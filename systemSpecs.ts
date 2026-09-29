import fs from 'fs';
import path from 'path';
import si from 'systeminformation';
import { cpuDataset, gpuDataset } from './src/data/hardwareData';

export type SpecCategory = 'CPU' | 'GPU' | 'RAM' | 'Storage' | 'Network';

export interface DetectedCpu {
  model: string;
  vendor: string;
  cores: number;
  threads: number;
  baseGHz: number;
  maxGHz: number;
  socket: string;
  cacheL2KB: number;
  cacheL3KB: number;
  virtualization: boolean;
  matchedId: string | null;
}

export interface DetectedRamModule {
  slot: string;
  sizeGB: number;
  type: string;
  speedMHz: number | null;
  manufacturer: string;
  partNumber: string;
  formFactor: string;
}

export interface DetectedStorage {
  model: string;
  vendor: string;
  type: string;
  interface: string;
  sizeGB: number;
  smartStatus: string;
}

export interface DetectedGpu {
  model: string;
  vendor: string;
  vramGB: number | null;
  kind: 'Integrated' | 'Dedicated' | 'Unknown';
  bus: string;
  driverVersion: string;
  matchedId: string | null;
}

export interface DetectedDisplay {
  model: string;
  resolution: string;
  refreshHz: number | null;
  main: boolean;
}

export interface DetectedNetworkAdapter {
  name: string;
  model: string;
  vendor: string;
  kind: 'Wi-Fi' | 'Ethernet' | 'Other';
  mac: string;
  speedMbps: number | null;
  connected: boolean;
  ssid?: string;
  signalDbm?: number | null;
  frequencyMHz?: number | null;
}

export interface SystemSpecsReport {
  scannedAt: string;
  source: 'host-agent' | 'device-agent';
  system: { manufacturer: string; model: string; os: string; hostname: string };
  cpu: DetectedCpu;
  ram: { totalGB: number; modules: DetectedRamModule[]; type: string; channelsHint: string };
  storage: DetectedStorage[];
  gpus: DetectedGpu[];
  displays: DetectedDisplay[];
  network: DetectedNetworkAdapter[];
  newlyRegistered: UserHardwareEntry[];
}

export interface UserHardwareEntry {
  id: string;
  category: SpecCategory;
  model: string;
  vendor: string;
  specs: Record<string, string | number | boolean | null>;
  firstSeen: string;
  lastSeen: string;
  timesSeen: number;
}

const DB_PATH = path.join(process.cwd(), 'data', 'user-hardware-db.json');

export function readUserHardwareDb(): UserHardwareEntry[] {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function writeUserHardwareDb(entries: UserHardwareEntry[]) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(entries, null, 2));
}

export const toGB = (bytes: number) => Math.round((bytes / 1024 ** 3) * 10) / 10;

// Strip trademark noise so "Intel(R) Core(TM) i7-4790K CPU @ 4.00GHz" compares cleanly
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\((r|tm|c)\)|®|™/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/@.*$/, ' ')
    .replace(/\b(cpu|processor|graphics|with radeon|laptop gpu|\d+-core)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const BRAND_WORDS = new Set(['amd', 'intel', 'nvidia', 'geforce', 'radeon', 'core', 'ryzen', 'arc', 'black', 'edition']);

// Match when every significant token of a catalog model appears in the detected name; longest match wins
export function matchCatalog(detected: string, models: { id: string; Model: string }[]): string | null {
  const target = ` ${normalize(detected)} `;
  let best: { id: string; score: number } | null = null;
  for (const item of models) {
    const tokens = normalize(item.Model).split(' ').filter((t) => t && !BRAND_WORDS.has(t));
    if (!tokens.length) continue;
    if (tokens.every((t) => target.includes(` ${t} `))) {
      const score = tokens.join('').length;
      if (!best || score > best.score) best = { id: item.id, score };
    }
  }
  return best?.id ?? null;
}

export function classifyGpu(vendor: string, model: string, vramMB: number | null, dynamic: boolean): DetectedGpu['kind'] {
  const n = `${vendor} ${model}`.toLowerCase();
  if (/uhd|iris|hd graphics|vega \d+ graphics|radeon\(tm\) graphics|radeon graphics|780m|760m|680m|610m|arc graphics|adreno|apple/.test(n)) return 'Integrated';
  if (/geforce|rtx|gtx|quadro|radeon rx|radeon pro|arc a\d|arc b\d|tesla/.test(n)) return 'Dedicated';
  if (dynamic) return 'Integrated';
  if (vramMB !== null && vramMB >= 2048) return 'Dedicated';
  return 'Unknown';
}

function upsertEntries(found: Omit<UserHardwareEntry, 'firstSeen' | 'lastSeen' | 'timesSeen'>[]): UserHardwareEntry[] {
  const db = readUserHardwareDb();
  const now = new Date().toISOString();
  const added: UserHardwareEntry[] = [];
  for (const f of found) {
    const existing = db.find((e) => e.id === f.id);
    if (existing) {
      existing.lastSeen = now;
      existing.timesSeen += 1;
      existing.specs = { ...existing.specs, ...f.specs };
    } else {
      const entry = { ...f, firstSeen: now, lastSeen: now, timesSeen: 1 };
      db.push(entry);
      added.push(entry);
    }
  }
  writeUserHardwareDb(db);
  return added;
}

const slug = (category: SpecCategory, model: string) =>
  `user-${category.toLowerCase()}-${normalize(model).replace(/ /g, '-') || 'unknown'}`;

export async function scanSystemSpecs(): Promise<SystemSpecsReport> {
  const [system, osInfo, cpu, mem, memLayout, disks, graphics, netIfaces, wifiIfaces, wifiConns] = await Promise.all([
    si.system(),
    si.osInfo(),
    si.cpu(),
    si.mem(),
    si.memLayout(),
    si.diskLayout(),
    si.graphics(),
    si.networkInterfaces(),
    si.wifiInterfaces().catch(() => []),
    si.wifiConnections().catch(() => [])
  ]);

  const cpuModel = `${cpu.manufacturer} ${cpu.brand}`.replace(/\s+/g, ' ').trim();
  const detectedCpu: DetectedCpu = {
    model: cpuModel,
    vendor: cpu.manufacturer,
    cores: cpu.physicalCores,
    threads: cpu.cores,
    baseGHz: cpu.speed,
    maxGHz: cpu.speedMax || cpu.speed,
    socket: cpu.socket || 'Unknown',
    cacheL2KB: Math.round((cpu.cache?.l2 || 0) / 1024),
    cacheL3KB: Math.round((cpu.cache?.l3 || 0) / 1024),
    virtualization: Boolean(cpu.virtualization),
    matchedId: matchCatalog(cpuModel, cpuDataset)
  };

  const modules: DetectedRamModule[] = memLayout
    .filter((m) => m.size > 0)
    .map((m) => ({
      slot: m.bank || 'Slot',
      sizeGB: toGB(m.size),
      type: m.type || 'Unknown',
      speedMHz: m.clockSpeed || null,
      manufacturer: m.manufacturer || 'Unknown',
      partNumber: (m.partNum || '').trim(),
      formFactor: m.formFactor || ''
    }));
  const ramTypes = [...new Set(modules.map((m) => m.type).filter((t) => t && t !== 'Unknown'))];

  const storage: DetectedStorage[] = disks.map((d) => {
    const iface = d.interfaceType || '';
    const type = /nvme/i.test(iface) || /nvme/i.test(d.name) ? 'NVMe SSD' : d.type === 'SSD' ? 'SATA SSD' : d.type === 'HD' ? 'HDD' : d.type || 'Unknown';
    return {
      model: (d.name || d.device || 'Unknown drive').trim(),
      vendor: d.vendor || '',
      type,
      interface: iface || 'Unknown',
      sizeGB: toGB(d.size),
      smartStatus: d.smartStatus || 'unknown'
    };
  });

  const gpus: DetectedGpu[] = graphics.controllers
    .filter((g) => g.model && !/basic display|remote display|virtual/i.test(g.model))
    .map((g) => {
      const vramMB = g.vram ?? null;
      const kind = classifyGpu(g.vendor, g.model, vramMB, Boolean(g.vramDynamic));
      return {
        model: g.model,
        vendor: g.vendor,
        // Integrated GPUs report shared memory, so VRAM is only meaningful for dedicated cards
        vramGB: vramMB && kind !== 'Integrated' ? Math.round((vramMB / 1024) * 10) / 10 : null,
        kind,
        bus: g.bus || '',
        driverVersion: g.driverVersion || '',
        matchedId: matchCatalog(g.model, gpuDataset)
      };
    });

  const displays: DetectedDisplay[] = graphics.displays.map((d) => ({
    model: d.model || 'Display',
    resolution: d.currentResX && d.currentResY ? `${d.currentResX}x${d.currentResY}` : 'Unknown',
    refreshHz: d.currentRefreshRate || null,
    main: Boolean(d.main)
  }));

  const conn = wifiConns[0];
  const network: DetectedNetworkAdapter[] = netIfaces
    .filter((n) => !n.internal && !n.virtual && n.mac)
    .map((n) => {
      const wifi = wifiIfaces.find((w) => w.iface === n.iface || w.mac?.toLowerCase() === n.mac.toLowerCase());
      const kind: DetectedNetworkAdapter['kind'] = wifi || n.type === 'wireless' ? 'Wi-Fi' : n.type === 'wired' ? 'Ethernet' : 'Other';
      const adapter: DetectedNetworkAdapter = {
        name: n.ifaceName || n.iface,
        model: wifi?.model || n.ifaceName || n.iface,
        vendor: wifi?.vendor || '',
        kind,
        mac: n.mac,
        speedMbps: n.speed || null,
        connected: n.operstate === 'up'
      };
      if (kind === 'Wi-Fi' && conn) {
        adapter.ssid = conn.ssid;
        adapter.signalDbm = conn.signalLevel ?? null;
        adapter.frequencyMHz = conn.frequency ?? null;
      }
      return adapter;
    });

  const report: SystemSpecsReport = {
    scannedAt: new Date().toISOString(),
    source: 'host-agent',
    system: {
      manufacturer: system.manufacturer,
      model: system.model,
      os: `${osInfo.distro} ${osInfo.release} (${osInfo.arch})`,
      hostname: osInfo.hostname
    },
    cpu: detectedCpu,
    ram: {
      totalGB: toGB(mem.total),
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
  report.newlyRegistered = registerUnknowns(report);
  return report;
}

// Add every CPU/GPU the catalog lacks, plus RAM, drives and Wi-Fi adapters (the catalog has none of those)
export function registerUnknowns(report: SystemSpecsReport): UserHardwareEntry[] {
  const { cpu: detectedCpu, gpus, storage, network } = report;
  const modules = report.ram.modules;
  const toRegister: Omit<UserHardwareEntry, 'firstSeen' | 'lastSeen' | 'timesSeen'>[] = [];
  if (!detectedCpu.matchedId) {
    toRegister.push({
      id: slug('CPU', detectedCpu.model), category: 'CPU', model: detectedCpu.model, vendor: detectedCpu.vendor,
      specs: { cores: detectedCpu.cores, threads: detectedCpu.threads, baseGHz: detectedCpu.baseGHz, maxGHz: detectedCpu.maxGHz, socket: detectedCpu.socket, l3KB: detectedCpu.cacheL3KB }
    });
  }
  for (const g of gpus.filter((g) => !g.matchedId)) {
    toRegister.push({ id: slug('GPU', g.model), category: 'GPU', model: g.model, vendor: g.vendor, specs: { kind: g.kind, vramGB: g.vramGB, bus: g.bus } });
  }
  for (const m of modules) {
    const model = m.partNumber || `${m.manufacturer} ${m.sizeGB}GB ${m.type}`;
    toRegister.push({ id: slug('RAM', model), category: 'RAM', model, vendor: m.manufacturer, specs: { sizeGB: m.sizeGB, type: m.type, speedMHz: m.speedMHz, formFactor: m.formFactor } });
  }
  for (const d of storage) {
    toRegister.push({ id: slug('Storage', d.model), category: 'Storage', model: d.model, vendor: d.vendor, specs: { type: d.type, interface: d.interface, sizeGB: d.sizeGB } });
  }
  for (const n of network.filter((n) => n.kind === 'Wi-Fi')) {
    toRegister.push({ id: slug('Network', n.model), category: 'Network', model: n.model, vendor: n.vendor, specs: { kind: n.kind } });
  }

  return upsertEntries(toRegister);
}
