import crypto from 'crypto';
import { getSessionValue, setSessionValue } from './store.js';
import { cpuDataset, gpuDataset } from './src/data/hardwareData.js';
import {
  classifyGpu,
  DetectedCpu,
  DetectedDisplay,
  DetectedGpu,
  DetectedNetworkAdapter,
  DetectedRamModule,
  DetectedStorage,
  matchCatalog,
  registerUnknowns,
  SystemSpecsReport,
  toGB
} from './systemSpecs.js';

// Browsers cannot read hardware, so a hosted site asks the visitor for consent and then has
// them run a small read-only agent script on their own PC. The agent posts its findings back
// under a one-time session token that the consenting browser tab is polling.

const str = (v: unknown, max = 120) =>
  (typeof v === 'string' ? v : v == null ? '' : String(v)).replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);
const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
};
// ConvertTo-Json collapses one-element arrays into a plain object
const arr = (v: unknown, max = 32): any[] => (Array.isArray(v) ? v.slice(0, max) : v && typeof v === 'object' ? [v] : []);

// Win32_PhysicalMemory.SMBIOSMemoryType
const SMBIOS_MEMORY: Record<number, string> = { 20: 'DDR', 21: 'DDR2', 24: 'DDR3', 26: 'DDR4', 27: 'LPDDR', 28: 'LPDDR2', 29: 'LPDDR3', 30: 'LPDDR4', 34: 'DDR5', 35: 'LPDDR5' };
// Windows often reports RAM makers as JEDEC IDs (e.g. "80AD000080AD" = SK hynix)
const JEDEC_VENDORS: Record<string, string> = {
  '80AD': 'SK hynix', '00AD': 'SK hynix', '80CE': 'Samsung', '00CE': 'Samsung', '802C': 'Micron', '002C': 'Micron',
  '859B': 'Crucial', '059B': 'Crucial', '04CD': 'G.Skill', '029E': 'Corsair', '0198': 'Kingston', '8551': 'Qimonda', '0443': 'Ramaxel', '04CB': 'ADATA', '8A76': 'Lexar'
};
const ramVendor = (raw: string) => {
  const v = str(raw);
  const key = v.toUpperCase().replace(/^0X/, '').slice(0, 4);
  return /^[0-9A-F]{4,}$/i.test(v.replace(/^0x/i, '')) ? JEDEC_VENDORS[key] || v : v;
};

// MSFT_PhysicalDisk.BusType
const BUS_TYPE: Record<number, string> = { 3: 'ATA', 7: 'USB', 8: 'RAID', 11: 'SATA', 12: 'SD', 17: 'NVMe' };

export async function reportFromAgent(raw: any): Promise<SystemSpecsReport> {
  const c = raw?.cpu || {};
  const cpuModel = str(c.name).replace(/\s+/g, ' ');
  const maxGHz = Math.round(num(c.maxMHz) / 10) / 100;
  const baseGHz = num(c.baseMHz) ? Math.round(num(c.baseMHz) / 10) / 100 : maxGHz;
  const cpu: DetectedCpu = {
    model: cpuModel || 'Unknown CPU',
    vendor: str(c.manufacturer).replace('GenuineIntel', 'Intel').replace('AuthenticAMD', 'AMD'),
    cores: num(c.cores),
    threads: num(c.threads),
    baseGHz,
    maxGHz,
    socket: str(c.socket) || 'Unknown',
    cacheL2KB: num(c.l2KB),
    cacheL3KB: num(c.l3KB),
    virtualization: Boolean(c.virtualization),
    matchedId: matchCatalog(cpuModel, cpuDataset)
  };

  const modules: DetectedRamModule[] = arr(raw?.memory).map((m) => ({
    slot: str(m.bank) || 'Slot',
    sizeGB: toGB(num(m.sizeBytes)),
    type: SMBIOS_MEMORY[num(m.smbiosType)] || str(m.type, 20) || 'Unknown',
    speedMHz: num(m.speed) || null,
    manufacturer: ramVendor(m.manufacturer) || 'Unknown',
    partNumber: str(m.partNumber),
    formFactor: num(m.formFactor) === 12 ? 'SODIMM' : num(m.formFactor) === 8 ? 'DIMM' : typeof m.formFactor === 'string' ? str(m.formFactor, 20) : ''
  }));
  const ramTypes = [...new Set(modules.map((m) => m.type).filter((t) => t !== 'Unknown'))];

  const storage: DetectedStorage[] = arr(raw?.disks).map((d) => {
    // Get-PhysicalDisk reports names ("SSD", "NVMe"); raw CIM reports numeric codes
    const bus = BUS_TYPE[num(d.busType)] || str(d.busType, 20) || 'Unknown';
    const media = str(d.mediaType, 20).toUpperCase();
    const isSsd = media === 'SSD' || media === '4';
    const isHdd = media === 'HDD' || media === '3';
    // Apple Silicon internal SSDs are NVMe over Apple Fabric
    const type = /nvme|apple fabric|pci/i.test(bus) && !isHdd ? 'NVMe SSD' : isSsd ? (bus === 'USB' ? 'External SSD' : 'SATA SSD') : isHdd ? 'HDD' : 'Unknown';
    return { model: str(d.model) || 'Unknown drive', vendor: '', type, interface: bus, sizeGB: toGB(num(d.sizeBytes)), smartStatus: str(d.health) || 'unknown' };
  });

  const gpus: DetectedGpu[] = arr(raw?.gpus)
    .filter((g) => str(g.name) && !/basic display|remote display|virtual|mirage|parsec/i.test(str(g.name)))
    .map((g) => {
      const vramMB = num(g.vramBytes) ? num(g.vramBytes) / 1024 ** 2 : null;
      const kind = g.integrated === true ? 'Integrated' : g.integrated === false ? 'Dedicated' : classifyGpu(str(g.vendor), str(g.name), vramMB, false);
      return {
        model: str(g.name),
        vendor: str(g.vendor),
        vramGB: vramMB && kind !== 'Integrated' ? Math.round((vramMB / 1024) * 10) / 10 : null,
        kind,
        bus: str(g.bus, 20) || (str(g.pnp).startsWith('PCI') ? 'PCIe' : ''),
        driverVersion: str(g.driverVersion),
        matchedId: matchCatalog(str(g.name), gpuDataset)
      };
    });

  const displays: DetectedDisplay[] = arr(raw?.displays).map((d) => ({
    model: str(d.name) || 'Display',
    resolution: num(d.width) && num(d.height) ? `${num(d.width)}x${num(d.height)}` : 'Unknown',
    refreshHz: num(d.refresh) || null,
    main: Boolean(d.main)
  }));

  const sharedWifi = raw?.wifi || {};
  const network: DetectedNetworkAdapter[] = arr(raw?.network).map((n) => {
    // Windows sends one system-wide Wi-Fi status; macOS/Linux agents attach it per adapter
    const wifi = n.wifi || sharedWifi;
    const kind: DetectedNetworkAdapter['kind'] = n.wireless ? 'Wi-Fi' : /ethernet|gbe|family controller/i.test(str(n.description)) ? 'Ethernet' : 'Other';
    const adapter: DetectedNetworkAdapter = {
      name: str(n.name),
      model: str(n.description) || str(n.name),
      vendor: '',
      kind,
      mac: str(n.mac, 20),
      speedMbps: num(n.speedBps) ? Math.round(num(n.speedBps) / 1e6) : null,
      connected: str(n.status) === 'Up'
    };
    if (kind === 'Wi-Fi' && str(wifi.ssid)) {
      adapter.ssid = str(wifi.ssid);
      // netsh gives signal as a percentage; convert the same way Windows does
      adapter.signalDbm = num(wifi.signalDbm) || (num(wifi.signalPercent) ? Math.round(num(wifi.signalPercent) / 2 - 100) : null);
      const band = str(wifi.band);
      adapter.frequencyMHz = num(wifi.frequencyMHz) || (band.startsWith('6') ? 6000 : band.startsWith('5') ? 5000 : band.startsWith('2') ? 2400 : null);
    }
    return adapter;
  });

  const report: SystemSpecsReport = {
    scannedAt: new Date().toISOString(),
    source: 'device-agent',
    system: {
      manufacturer: str(raw?.system?.manufacturer),
      model: str(raw?.system?.model),
      os: str(raw?.system?.os),
      hostname: str(raw?.system?.hostname)
    },
    cpu,
    ram: {
      totalGB: toGB(num(raw?.totalMemoryBytes)),
      modules,
      type: ramTypes.join(' / ') || 'Unknown',
      channelsHint: modules.length >= 2 ? 'Multi-module (likely dual-channel)' : modules.length === 1 ? 'Single module (single-channel)' : 'Unknown'
    },
    storage,
    gpus,
    displays,
    network,
    newlyRegistered: []
  };
  report.newlyRegistered = await registerUnknowns(report);
  return report;
}

interface ScanSession {
  createdAt: number;
  report: SystemSpecsReport | null;
}

const SESSION_TTL_SECONDS = 15 * 60;

export async function createScanSession(): Promise<string> {
  const token = crypto.randomBytes(16).toString('hex');
  await setSessionValue(token, { createdAt: Date.now(), report: null } satisfies ScanSession, SESSION_TTL_SECONDS);
  return token;
}

export async function getScanSession(token: string): Promise<ScanSession | null> {
  if (!/^[0-9a-f]{32}$/.test(token)) return null;
  return getSessionValue<ScanSession>(token);
}

// Keeps the original expiry so a finished session still disappears 15 minutes after it started
export async function completeScanSession(token: string, session: ScanSession, report: SystemSpecsReport): Promise<void> {
  const remaining = Math.max(60, SESSION_TTL_SECONDS - Math.floor((Date.now() - session.createdAt) / 1000));
  await setSessionValue(token, { ...session, report }, remaining);
}

// Double-click launcher: runs the PowerShell agent in a window that stays open until Enter is pressed
export function windowsLauncherScript(agentUrl: string): string {
  return [
    '@echo off',
    'title Silicon Matrix hardware scan',
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072; irm '${agentUrl}' | iex"`,
    'echo.',
    'pause'
  ].join(String.fromCharCode(13, 10));
}

export function windowsAgentScript(origin: string, token: string): string {
  return `# Silicon Matrix hardware scan agent (read-only)
# Reads hardware details on this PC and sends them to ${origin} (scan session ${token}).
# It does not change settings, install anything, or read personal files.
# Older Windows PowerShell builds default to TLS 1.0, which HTTPS hosts reject
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = 'SilentlyContinue'
Write-Host ''
Write-Host 'Silicon Matrix hardware scan' -ForegroundColor Cyan
Write-Host '[1/3] Reading processor, memory, drives, graphics and network adapters...'
$cs  = Get-CimInstance Win32_ComputerSystem
$os  = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$video = Get-CimInstance Win32_VideoController
$gpuRegs = Get-ItemProperty 'HKLM:\\SYSTEM\\ControlSet001\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0*'
$wlan = netsh wlan show interfaces
function Get-WlanField($label) { ($wlan | Select-String "^\\s*$label\\s*:" | Select-Object -First 1).Line -replace '^[^:]*:\\s*', '' }
$data = [ordered]@{
  system = @{ manufacturer = $cs.Manufacturer; model = $cs.Model; os = "$($os.Caption) $($os.Version) ($($os.OSArchitecture))"; hostname = $env:COMPUTERNAME }
  cpu = @{ name = $cpu.Name; manufacturer = $cpu.Manufacturer; cores = $cpu.NumberOfCores; threads = $cpu.NumberOfLogicalProcessors; maxMHz = $cpu.MaxClockSpeed; socket = $cpu.SocketDesignation; l2KB = $cpu.L2CacheSize; l3KB = $cpu.L3CacheSize; virtualization = $cpu.VirtualizationFirmwareEnabled }
  totalMemoryBytes = $cs.TotalPhysicalMemory
  memory = @(Get-CimInstance Win32_PhysicalMemory | ForEach-Object { @{ bank = $_.DeviceLocator; sizeBytes = $_.Capacity; smbiosType = $_.SMBIOSMemoryType; speed = $_.ConfiguredClockSpeed; manufacturer = $_.Manufacturer; partNumber = $_.PartNumber; formFactor = $_.FormFactor } })
  disks = @(Get-PhysicalDisk | ForEach-Object { @{ model = $_.FriendlyName; mediaType = "$($_.MediaType)"; busType = "$($_.BusType)"; sizeBytes = $_.Size; health = "$($_.HealthStatus)" } })
  gpus = @($video | ForEach-Object {
    $name = $_.Name
    $reg = $gpuRegs | Where-Object { $_.DriverDesc -eq $name } | Select-Object -First 1
    # AdapterRAM is capped at 4 GB, so prefer the 64-bit value the driver writes to the registry
    $vram = if ($reg.'HardwareInformation.qwMemorySize') { [int64]$reg.'HardwareInformation.qwMemorySize' } else { [int64]$_.AdapterRAM }
    @{ name = $name; vendor = $_.AdapterCompatibility; vramBytes = $vram; driverVersion = $_.DriverVersion; pnp = $_.PNPDeviceID }
  })
  displays = @($video | Where-Object { $_.CurrentHorizontalResolution } | ForEach-Object { @{ name = $_.Name; width = $_.CurrentHorizontalResolution; height = $_.CurrentVerticalResolution; refresh = $_.CurrentRefreshRate; main = $true } })
  network = @(Get-NetAdapter -Physical | ForEach-Object { @{ name = $_.Name; description = $_.InterfaceDescription; mac = $_.MacAddress; speedBps = $_.ReceiveLinkSpeed; status = "$($_.Status)"; wireless = ($_.PhysicalMediaType -match '802\\.11') } })
  wifi = @{ ssid = (Get-WlanField 'SSID'); signalPercent = ((Get-WlanField 'Signal') -replace '%', ''); band = (Get-WlanField 'Band') }
}
Write-Host ('       Found: ' + $cpu.Name.Trim())
$json = $data | ConvertTo-Json -Depth 5
Write-Host '[2/3] Sending the report to ${origin} ...'
try {
  Invoke-RestMethod -Method Post -Uri '${origin}/api/system-specs/report/${token}' -ContentType 'application/json' -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) -ErrorAction Stop | Out-Null
  Write-Host '[3/3] Done. Go back to your browser tab; your specs appear there in a few seconds.' -ForegroundColor Green
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq 404) {
    Write-Host 'This scan link has expired (links last 15 minutes). Press Rescan in the browser for a new one.' -ForegroundColor Yellow
  } elseif ($code -eq 409) {
    Write-Host 'This scan link was already used. Press Rescan in the browser for a new one.' -ForegroundColor Yellow
  } else {
    Write-Host ('Could not send the scan: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'Check your internet connection and try again.'
  }
}
Write-Host ''
`;
}
