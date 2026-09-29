// macOS and Linux scan agent. The shell script only gathers raw command output (no jq or
// python needed on the user's machine) and posts it as sectioned plain text; parseUnixDump
// turns it into the same raw shape the Windows agent sends, so reportFromAgent handles both.

export function unixAgentScript(origin: string, token: string): string {
  return `#!/bin/sh
# Silicon Matrix hardware scan agent for macOS and Linux (read-only)
# Reads hardware details on this computer and sends them to ${origin} (scan session ${token}).
# It does not change settings, install anything, or read personal files.
# Nearby Wi-Fi networks that macOS lists are discarded by the server and never stored.
tmp=$(mktemp 2>/dev/null || echo /tmp/silicon-scan-$$)
sec() { printf '\\n@@@%s\\n' "$1"; }
{
  sec uname; uname -s
  sec kernel; uname -r
  if [ "$(uname -s)" = Darwin ]; then
    sec sw_vers; sw_vers
    sec sysctl; sysctl hw.model machdep.cpu.brand_string hw.physicalcpu hw.logicalcpu hw.memsize hw.cpufrequency hw.cpufrequency_max hw.l2cachesize hw.l3cachesize 2>/dev/null
    sec sp_json; system_profiler -json SPDisplaysDataType SPMemoryDataType SPNVMeDataType SPSerialATADataType SPStorageDataType SPAirPortDataType 2>/dev/null
    sec ports; networksetup -listallhardwareports 2>/dev/null
    for p in $(networksetup -listallhardwareports 2>/dev/null | sed -n 's/^Device: //p'); do
      sec "ifstatus $p"; ifconfig "$p" 2>/dev/null | grep -E 'status:|media:'
    done
  else
    sec os_release; cat /etc/os-release 2>/dev/null
    sec dmi; printf 'vendor=%s\\nproduct=%s\\n' "$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null)" "$(cat /sys/class/dmi/id/product_name 2>/dev/null)"
    sec lscpu; LC_ALL=C lscpu 2>/dev/null
    sec meminfo; grep MemTotal /proc/meminfo
    # RAM type and speed need root; sudo -n never prompts, it just skips when no cached credentials
    sec dmidecode; (dmidecode -t 17 2>/dev/null || sudo -n dmidecode -t 17 2>/dev/null)
    sec lsblk; lsblk -d -b -P -o NAME,MODEL,SIZE,ROTA,TRAN,TYPE 2>/dev/null
    sec lspci; lspci -mm -D 2>/dev/null
    sec nvidia; nvidia-smi --query-gpu=name,memory.total,driver_version,pci.bus_id --format=csv,noheader,nounits 2>/dev/null
    sec drm
    for c in /sys/class/drm/card[0-9]*; do
      [ -e "$c/device" ] || continue
      printf '%s|%s|%s\\n' "$(basename "$(readlink -f "$c/device")")" "$(cat "$c/device/mem_info_vram_total" 2>/dev/null)" "$(basename "$(readlink -f "$c/device/driver")" 2>/dev/null)"
    done
    sec net
    for i in /sys/class/net/*; do
      n=\${i##*/}
      [ -e "$i/device" ] || continue
      w=0; { [ -d "$i/wireless" ] || [ -d "$i/phy80211" ]; } && w=1
      printf '%s|%s|%s|%s|%s|%s|%s\\n' "$n" "$w" "$(cat "$i/operstate" 2>/dev/null)" "$(cat "$i/speed" 2>/dev/null)" "$(basename "$(readlink -f "$i/device")")" "$(cat "$i/address" 2>/dev/null)" "$(udevadm info -q property -p "$i" 2>/dev/null | sed -n 's/^ID_MODEL_FROM_DATABASE=//p' | head -n 1)"
      if [ "$w" = 1 ]; then sec "iw $n"; iw dev "$n" link 2>/dev/null; sec net; fi
    done
    sec xrandr; xrandr --current 2>/dev/null | grep -E ' connected|\\*'
  fi
} > "$tmp" 2>/dev/null
if curl -fsS -X POST -H 'Content-Type: text/plain' --data-binary @"$tmp" '${origin}/api/system-specs/report/${token}' >/dev/null; then
  echo 'Scan sent. Return to your browser tab.'
else
  echo 'Could not send the scan. Start a new scan in the browser and try again.'
fi
rm -f "$tmp"
`;
}

const sizeToBytes = (v: unknown): number => {
  const m = String(v ?? '').match(/([\d.]+)\s*(TB|GB|MB|KB)?/i);
  if (!m) return 0;
  const mult = { TB: 1024 ** 4, GB: 1024 ** 3, MB: 1024 ** 2, KB: 1024 }[(m[2] || '').toUpperCase() as 'TB'] || 1;
  return parseFloat(m[1]) * mult;
};

function splitSections(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  for (const chunk of text.split(/\n@@@/)) {
    const nl = chunk.indexOf('\n');
    if (nl < 0) continue;
    const name = chunk.slice(0, nl).replace(/^@@@/, '').trim();
    sections.set(name, (sections.get(name) ? sections.get(name) + '\n' : '') + chunk.slice(nl + 1).trim());
  }
  return sections;
}

const keyValues = (text: string, sep: RegExp) => {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const m = line.match(sep);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
};

export function parseUnixDump(text: string): any {
  const s = splitSections(text);
  return s.get('uname') === 'Darwin' ? parseMac(s) : parseLinux(s);
}

// "Wi-Fi (0x14E4, 0x4388)" is PCI vendor + device ID of the wireless chip
function macWifiModel(cardType?: string): string {
  const ids = String(cardType || '').match(/0x([0-9a-f]{4}),\s*0x([0-9a-f]{4})/i);
  if (!ids) return cardType || 'Wi-Fi';
  const vendor = ({ '14E4': 'Broadcom', '168C': 'Atheros', '8086': 'Intel' } as Record<string, string>)[ids[1].toUpperCase()] || 'Apple';
  return `${vendor} Wi-Fi (device 0x${ids[2].toUpperCase()})`;
}

function parseMac(s: Map<string, string>): any {
  const ctl = keyValues(s.get('sysctl') || '', /^([\w.]+):\s*(.*)$/);
  const ver = keyValues(s.get('sw_vers') || '', /^(\w+):\s*(.*)$/);
  let sp: any = {};
  try {
    sp = JSON.parse(s.get('sp_json') || '{}');
  } catch {
    // older macOS without -json support
  }
  const brand = ctl['machdep.cpu.brand_string'] || '';

  // Apple Silicon reports one unified memory entry; Intel Macs list each DIMM under _items
  const memory: any[] = [];
  for (const top of sp.SPMemoryDataType || []) {
    if (top.dimm_type && !top._items) {
      memory.push({ bank: 'Unified memory', sizeBytes: sizeToBytes(top.SPMemoryDataType), type: top.dimm_type, manufacturer: top.dimm_manufacturer, formFactor: 'On-package' });
    }
    for (const d of top._items || []) {
      if (!/empty/i.test(d.dimm_size || '')) {
        memory.push({ bank: d._name, sizeBytes: sizeToBytes(d.dimm_size), type: d.dimm_type, speed: parseInt(d.dimm_speed) || null, manufacturer: d.dimm_manufacturer, partNumber: d.dimm_part_number });
      }
    }
  }

  const disks: any[] = [];
  for (const ctrl of sp.SPNVMeDataType || []) {
    for (const d of ctrl._items || []) disks.push({ model: d.device_model || d._name, mediaType: 'SSD', busType: 'NVMe', sizeBytes: d.size_in_bytes, health: d.smart_status });
  }
  for (const ctrl of sp.SPSerialATADataType || []) {
    for (const d of ctrl._items || []) {
      if (!d.size_in_bytes) continue;
      disks.push({ model: d.device_model || d._name, mediaType: /solid/i.test(d.spsata_medium_type || '') ? 'SSD' : 'HDD', busType: 'SATA', sizeBytes: d.size_in_bytes, health: d.smart_status });
    }
  }
  // Apple Silicon internal SSDs sit on "Apple Fabric" and only show up as volumes
  if (!disks.length) {
    const byDevice = new Map<string, any>();
    for (const v of sp.SPStorageDataType || []) {
      const pd = v.physical_drive || {};
      if (!pd.device_name) continue;
      const prev = byDevice.get(pd.device_name);
      if (!prev || v.size_in_bytes > prev.sizeBytes) {
        byDevice.set(pd.device_name, { model: pd.device_name, mediaType: /ssd/i.test(pd.medium_type) ? 'SSD' : 'HDD', busType: pd.protocol || 'Unknown', sizeBytes: v.size_in_bytes, health: pd.smart_status });
      }
    }
    disks.push(...byDevice.values());
  }

  const gpus: any[] = [];
  const displays: any[] = [];
  for (const g of sp.SPDisplaysDataType || []) {
    const vram = sizeToBytes(g.spdisplays_vram || g._spdisplays_vram);
    const builtin = /builtin/i.test(g.sppci_bus || '') || /^apple/i.test(g.sppci_model || '');
    gpus.push({
      name: g.sppci_model || g._name,
      vendor: String(g.spdisplays_vendor || '').replace(/^sppci_vendor_/, ''),
      vramBytes: builtin ? 0 : vram,
      integrated: builtin,
      bus: builtin ? 'Built-in' : 'PCIe',
      driverVersion: g.spdisplays_mtlgpufamilysupport ? String(g.spdisplays_mtlgpufamilysupport).replace(/^spdisplays_/, '') : ''
    });
    for (const d of g.spdisplays_ndrvs || []) {
      const res = String(d._spdisplays_resolution || d.spdisplays_resolution || '').match(/(\d+)\s*x\s*(\d+)(?:.*?@\s*([\d.]+))?/);
      displays.push({ name: d._name, width: res?.[1], height: res?.[2], refresh: res?.[3] ? Math.round(parseFloat(res[3])) : null, main: d.spdisplays_main === 'spdisplays_yes' });
    }
  }

  // networksetup lists every port; ifconfig tells us if it is up
  const network: any[] = [];
  const ports = (s.get('ports') || '').split(/\n\s*\n/);
  const airport = (sp.SPAirPortDataType?.[0]?.spairport_airport_interfaces || []) as any[];
  for (const block of ports) {
    const kv = keyValues(block, /^([\w ]+):\s*(.*)$/);
    const port = kv['Hardware Port'];
    const dev = kv['Device'];
    if (!port || !dev || /bluetooth|thunderbolt bridge|vpn/i.test(port)) continue;
    const status = s.get(`ifstatus ${dev}`) || '';
    const media = status.match(/media:.*?(\d+)(G|M)base/i);
    const air = airport.find((a) => a._name === dev);
    const cur = air?.spairport_current_network_information;
    const wireless = /wi-?fi|airport/i.test(port);
    network.push({
      name: dev,
      description: wireless ? macWifiModel(air?.spairport_wireless_card_type) : port,
      mac: kv['Ethernet Address'],
      speedBps: cur?.spairport_network_rate ? cur.spairport_network_rate * 1e6 : media ? parseInt(media[1]) * (media[2].toUpperCase() === 'G' ? 1e9 : 1e6) : 0,
      status: /status:\s*active/.test(status) ? 'Up' : 'Down',
      wireless,
      wifi: cur
        ? {
            ssid: cur._name,
            signalDbm: parseInt(String(cur.spairport_signal_noise || '')) || null,
            band: (String(cur.spairport_network_channel || '').match(/\((\d)/) || [])[1] || ''
          }
        : undefined
    });
  }

  const threads = parseInt(ctl['hw.logicalcpu']) || 0;
  return {
    system: { manufacturer: 'Apple', model: ctl['hw.model'], os: `${ver.ProductName || 'macOS'} ${ver.ProductVersion || ''} (${s.get('kernel') || ''})`.trim() },
    cpu: {
      name: brand,
      manufacturer: /apple/i.test(brand) ? 'Apple' : /intel/i.test(brand) ? 'Intel' : '',
      cores: parseInt(ctl['hw.physicalcpu']) || threads,
      threads,
      baseMHz: (parseInt(ctl['hw.cpufrequency']) || 0) / 1e6,
      maxMHz: (parseInt(ctl['hw.cpufrequency_max'] || ctl['hw.cpufrequency']) || 0) / 1e6,
      socket: /apple/i.test(brand) ? 'SoC' : 'BGA',
      l2KB: (parseInt(ctl['hw.l2cachesize']) || 0) / 1024,
      l3KB: (parseInt(ctl['hw.l3cachesize']) || 0) / 1024
    },
    totalMemoryBytes: parseInt(ctl['hw.memsize']) || 0,
    memory,
    disks,
    gpus,
    displays,
    network
  };
}

// lspci -mm fields: slot "class" "vendor" "device" [-rXX] [-pXX] "subsys vendor" "subsys device"
function parseLspci(text: string) {
  return text
    .split('\n')
    .map((line) => {
      const slot = line.split(' ')[0];
      const q = [...line.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
      return { slot, cls: q[0] || '', vendor: q[1] || '', device: q[2] || '' };
    })
    .filter((d) => d.slot);
}

const shortVendor = (v: string) =>
  /nvidia/i.test(v) ? 'NVIDIA' : /advanced micro|amd|ati/i.test(v) ? 'AMD' : /intel/i.test(v) ? 'Intel' : v.replace(/ (Corporation|Corp\.|Inc\.|Co\., Ltd\.|Semiconductor Co\., Ltd\.)$/i, '');

// "AD104 [GeForce RTX 4070]" -> "GeForce RTX 4070"
const marketingName = (device: string) => (device.match(/\[([^\]]+)\]\s*$/) || [])[1] || device;

// AMD APU graphics sit on arbitrary buses, so recognise them by codename or tiny carve-out VRAM
const AMD_APU = /raven|picasso|renoir|lucienne|cezanne|barcelo|rembrandt|mendocino|phoenix|hawk point|strix|krackan|raphael|granite ridge|van gogh|radeon (vega|graphics)|\b\d{3}m\b/i;

function isIntegrated(slot: string, vendor: string, device: string, vramBytes: number): boolean | undefined {
  if (vendor === 'NVIDIA') return false;
  if (vendor === 'Intel') return /^(0000:)?00:/.test(slot); // Arc cards sit behind a PCIe bridge
  if (vendor === 'AMD') return AMD_APU.test(device) || (vramBytes > 0 && vramBytes <= 2 * 1024 ** 3);
  return undefined;
}

function parseLinux(s: Map<string, string>): any {
  const os = keyValues(s.get('os_release') || '', /^(\w+)=(.*)$/);
  const dmi = keyValues(s.get('dmi') || '', /^(\w+)=(.*)$/);
  const cpu = keyValues(s.get('lscpu') || '', /^([^:]+):\s*(.*)$/);
  const pci = parseLspci(s.get('lspci') || '');
  const pciBySlot = (slot: string) => pci.find((p) => p.slot === slot || p.slot.endsWith(slot.toLowerCase()));

  const threads = parseInt(cpu['CPU(s)']) || 0;
  const coresPerSocket = parseInt(cpu['Core(s) per socket']) || 0;
  const sockets = parseInt(cpu['Socket(s)']) || 1;
  const cacheKB = (v?: string) => (v ? sizeToBytes(v.replace(/\(.*$/, '').replace(/MiB/i, 'MB').replace(/KiB/i, 'KB')) / 1024 : 0);

  const memory: any[] = [];
  for (const block of (s.get('dmidecode') || '').split(/\n(?=Handle )/)) {
    if (!/Memory Device/.test(block)) continue;
    const kv = keyValues(block, /^\s*([^:]+):\s*(.*)$/);
    if (!kv.Size || /no module/i.test(kv.Size)) continue;
    memory.push({
      bank: kv.Locator,
      sizeBytes: sizeToBytes(kv.Size),
      type: kv.Type,
      speed: parseInt(kv['Configured Memory Speed'] || kv['Configured Clock Speed'] || kv.Speed) || null,
      manufacturer: kv.Manufacturer,
      partNumber: kv['Part Number'],
      formFactor: kv['Form Factor']
    });
  }

  const disks = (s.get('lsblk') || '')
    .split('\n')
    .map((line) => keyValues(line.replace(/" /g, '"\n'), /^(\w+)="(.*)"?$/))
    .map((kv) => Object.fromEntries(Object.entries(kv).map(([k, v]) => [k, v.replace(/"$/, '')])))
    .filter((d) => d.TYPE === 'disk' && !/^(loop|zram|ram|sr)/.test(d.NAME || ''))
    .map((d) => {
      const nvme = d.TRAN === 'nvme' || /^nvme/.test(d.NAME);
      return {
        model: d.MODEL || d.NAME,
        mediaType: nvme || d.ROTA === '0' ? 'SSD' : 'HDD',
        busType: nvme ? 'NVMe' : (d.TRAN || 'Unknown').toUpperCase(),
        sizeBytes: parseInt(d.SIZE) || 0
      };
    });

  const nvidia = (s.get('nvidia') || '')
    .split('\n')
    .map((l) => l.split(',').map((x) => x.trim()))
    .filter((f) => f[0]);
  const drm = (s.get('drm') || '').split('\n').map((l) => l.split('|'));
  const gpus = pci
    .filter((p) => /vga|3d controller|display controller/i.test(p.cls))
    .map((p) => {
      const nv = nvidia.find((f) => (f[3] || '').toLowerCase().endsWith(p.slot.toLowerCase().replace(/^0000:/, '')));
      const card = drm.find((d) => d[0] === p.slot);
      const vendor = shortVendor(p.vendor);
      const vram = parseInt(card?.[1] || '') || 0;
      const name = nv?.[0] || `${vendor} ${marketingName(p.device)}`;
      return {
        name,
        vendor,
        vramBytes: nv ? parseFloat(nv[1]) * 1024 ** 2 : vram,
        integrated: isIntegrated(p.slot, vendor, p.device, vram),
        bus: 'PCIe',
        driverVersion: nv?.[2] || card?.[2] || ''
      };
    });

  const displays = (s.get('xrandr') || '')
    .split(/\n(?=\S)/)
    .filter((b) => / connected/.test(b))
    .map((b) => {
      const res = b.match(/\n\s+(\d+)x(\d+)\s+([\d.]+)\*/) || b.match(/(\d+)x(\d+)\+/);
      return { name: b.split(' ')[0], width: res?.[1], height: res?.[2], refresh: res?.[3] ? Math.round(parseFloat(res[3])) : null, main: / primary /.test(b) };
    });

  const network = (s.get('net') || '')
    .split('\n')
    .map((l) => l.split('|'))
    .filter((f) => f[0] && f.length >= 6)
    .map(([name, w, oper, speed, slot, mac, udevModel]) => {
      const dev = pciBySlot(slot);
      const iw = keyValues(s.get(`iw ${name}`) || '', /^\s*([^:]+):\s*(.*)$/);
      const wireless = w === '1';
      const bitrate = parseFloat(iw['tx bitrate'] || '');
      return {
        name,
        description: dev ? `${shortVendor(dev.vendor)} ${marketingName(dev.device)}` : udevModel || name,
        mac,
        speedBps: wireless ? (bitrate || 0) * 1e6 : Math.max(parseInt(speed) || 0, 0) * 1e6,
        status: oper === 'up' ? 'Up' : 'Down',
        wireless,
        wifi: iw.SSID ? { ssid: iw.SSID, signalDbm: parseInt(iw.signal) || null, frequencyMHz: Math.round(parseFloat(iw.freq)) || null } : undefined
      };
    });

  return {
    system: { manufacturer: dmi.vendor, model: dmi.product, os: `${(os.PRETTY_NAME || 'Linux').replace(/"/g, '')} (kernel ${s.get('kernel') || ''})` },
    cpu: {
      name: cpu['Model name'],
      manufacturer: cpu['Vendor ID'],
      cores: coresPerSocket * sockets || threads,
      threads,
      maxMHz: parseFloat(cpu['CPU max MHz']) || 0,
      socket: 'Unknown',
      l2KB: cacheKB(cpu['L2 cache']),
      l3KB: cacheKB(cpu['L3 cache']),
      virtualization: Boolean(cpu['Virtualization'])
    },
    totalMemoryBytes: (parseInt((s.get('meminfo') || '').replace(/\D+/g, ' ').trim()) || 0) * 1024,
    memory,
    disks,
    gpus,
    displays,
    network
  };
}
