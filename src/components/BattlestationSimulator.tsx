import React, { useState, useEffect, useMemo } from 'react';
import { CPUItem, GPUItem, SavedCustomPreset } from '../types';
import { formatINR } from '../utils/formatters';
import { getSavedCustomPresets } from '../utils/customPresetsStorage';
import { buildIntegratedGpu } from '../utils/integratedGraphics';
import {
  Monitor,
  Cpu,
  Zap,
  HardDrive,
  Fan,
  Volume2,
  VolumeX,
  Sparkles,
  Palette,
  Sliders,
  Eye,
  CheckCircle2,
  Laptop,
  Maximize2,
  Bookmark,
  Layers,
  Shield,
  Activity,
  Award
} from 'lucide-react';

interface BattlestationSimulatorProps {
  cpus: CPUItem[];
  gpus: GPUItem[];
  onOpenArchitect?: () => void;
}

type RGBTheme = 'cyan-neon' | 'tokyo-purple' | 'matrix-green' | 'amber-sunset' | 'stealth-dark';

interface MonitorOption {
  id: string;
  label: string;
  resTag: '720p' | '1080p' | '1440p' | '4K' | '5K' | '8K';
  refreshHz: number;
  panel: 'TN' | 'IPS' | 'Fast IPS' | 'VA' | 'OLED' | 'QD-OLED';
  priceINR: number;
}

const MONITOR_OPTIONS: MonitorOption[] = [
  { id: 'mon-720p-24-75tn', label: '24" 720p 75Hz TN (Basic Office)', resTag: '720p', refreshHz: 75, panel: 'TN', priceINR: 5499 },
  { id: 'mon-1080p-24-165ips', label: '24" 1080p 165Hz IPS (Esports Entry)', resTag: '1080p', refreshHz: 165, panel: 'IPS', priceINR: 11999 },
  { id: 'mon-1080p-27-240fips', label: '27" 1080p 240Hz Fast IPS (Competitive)', resTag: '1080p', refreshHz: 240, panel: 'Fast IPS', priceINR: 18999 },
  { id: 'mon-1440p-27-240fips', label: '27" 1440p 240Hz Fast IPS (Esports)', resTag: '1440p', refreshHz: 240, panel: 'Fast IPS', priceINR: 24999 },
  { id: 'mon-1440p-27-165oled', label: '27" 1440p 165Hz QD-OLED (Immersion)', resTag: '1440p', refreshHz: 165, panel: 'QD-OLED', priceINR: 46999 },
  { id: 'mon-1440p-34-uw-oled', label: '34" 3440x1440 175Hz Ultrawide OLED', resTag: '1440p', refreshHz: 175, panel: 'OLED', priceINR: 62999 },
  { id: 'mon-4k-27-144ips', label: '27" 4K 144Hz IPS (Sharp & Balanced)', resTag: '4K', refreshHz: 144, panel: 'IPS', priceINR: 42999 },
  { id: 'mon-4k-32-165oled', label: '32" 4K 165Hz QD-OLED (Flagship)', resTag: '4K', refreshHz: 165, panel: 'QD-OLED', priceINR: 69999 },
  { id: 'mon-5k-27-60ips', label: '27" 5K 60Hz IPS (Creator/Photo)', resTag: '5K', refreshHz: 60, panel: 'IPS', priceINR: 89999 },
  { id: 'mon-8k-32-60ips', label: '32" 8K 60Hz IPS (Ultra Flagship)', resTag: '8K', refreshHz: 60, panel: 'IPS', priceINR: 249999 }
];

type RamType = 'DDR3' | 'DDR4' | 'DDR5' | 'LPDDR5X';
const RAM_TYPE_COST_PER_GB: Record<RamType, number> = { DDR3: 150, DDR4: 240, DDR5: 340, LPDDR5X: 420 };
const RAM_SIZE_OPTIONS = [8, 16, 32, 64, 96, 128];

type StorageType = 'HDD' | 'SATA SSD' | 'NVMe Gen3' | 'NVMe Gen4' | 'NVMe Gen5';
const STORAGE_TYPE_INFO: Record<StorageType, { costPerGB: number; readSpeed: string }> = {
  'HDD': { costPerGB: 3, readSpeed: '160 MB/s (7200 RPM)' },
  'SATA SSD': { costPerGB: 6, readSpeed: '560 MB/s' },
  'NVMe Gen3': { costPerGB: 7, readSpeed: '3,500 MB/s' },
  'NVMe Gen4': { costPerGB: 9, readSpeed: '7,400 MB/s (DirectStorage Ready)' },
  'NVMe Gen5': { costPerGB: 13, readSpeed: '12,400 MB/s (DirectStorage Ready)' }
};
const STORAGE_CAPACITY_OPTIONS_GB = [500, 1000, 2000, 4000, 8000];

// Pixel count relative to 1080p — GPU-bound fps scales ~inversely with pixel count.
const RESOLUTION_PIXEL_FACTOR: Record<MonitorOption['resTag'], number> = {
  '720p': 2.25,
  '1080p': 1,
  '1440p': 0.56,
  '4K': 0.25,
  '5K': 0.14,
  '8K': 0.0625
};

interface GameProfile {
  id: string;
  name: string;
  // Higher demand = harder to run; calibrated so a ~80,000 Gaming_Score flagship GPU
  // lands near a realistic 1080p-ultra fps for this title.
  gpuDemand: number;
  usesRayTracing: boolean;
  // CPU-bound esports titles cap fps hard regardless of GPU; multiplier tuned against
  // CPU Gaming_Score range (~4,800 low-end to ~55,000 flagship).
  cpuCapMultiplier: number;
}

const GAMES: GameProfile[] = [
  { id: 'valorant', name: 'Valorant', gpuDemand: 200, usesRayTracing: false, cpuCapMultiplier: 0.012 },
  { id: 'cs2', name: 'Counter-Strike 2', gpuDemand: 229, usesRayTracing: false, cpuCapMultiplier: 0.011 },
  { id: 'fortnite', name: 'Fortnite (Performance Mode)', gpuDemand: 320, usesRayTracing: false, cpuCapMultiplier: 0.009 },
  { id: 'apex', name: 'Apex Legends', gpuDemand: 364, usesRayTracing: false, cpuCapMultiplier: 0.008 },
  { id: 'gta5', name: 'GTA V', gpuDemand: 400, usesRayTracing: false, cpuCapMultiplier: 0.007 },
  { id: 'cod', name: 'Call of Duty: Warzone', gpuDemand: 444, usesRayTracing: false, cpuCapMultiplier: 0.007 },
  { id: 'sottr', name: 'Shadow of the Tomb Raider', gpuDemand: 500, usesRayTracing: false, cpuCapMultiplier: 0.006 },
  { id: 'bg3', name: "Baldur's Gate 3", gpuDemand: 571, usesRayTracing: false, cpuCapMultiplier: 0.006 },
  { id: 'eldenring', name: 'Elden Ring', gpuDemand: 615, usesRayTracing: false, cpuCapMultiplier: 0.006 },
  { id: 'minecraft-rtx', name: 'Minecraft RTX', gpuDemand: 800, usesRayTracing: true, cpuCapMultiplier: 0.005 },
  { id: 'wukong', name: 'Black Myth: Wukong (Ray Tracing)', gpuDemand: 889, usesRayTracing: true, cpuCapMultiplier: 0.004 },
  { id: 'alanwake2', name: 'Alan Wake 2 (Ray Tracing)', gpuDemand: 1231, usesRayTracing: true, cpuCapMultiplier: 0.004 },
  { id: 'cyberpunk-pt', name: 'Cyberpunk 2077 (Path Tracing)', gpuDemand: 1067, usesRayTracing: true, cpuCapMultiplier: 0.004 }
];

export const BattlestationSimulator: React.FC<BattlestationSimulatorProps> = ({
  cpus,
  gpus,
  onOpenArchitect
}) => {
  // Setup configuration state
  const [selectedCpuId, setSelectedCpuId] = useState<string>(cpus[0]?.id || 'cpu-amd-9800x3d');
  const [selectedGpuId, setSelectedGpuId] = useState<string>(gpus[0]?.id || 'gpu-nvidia-5080');
  const [useIntegratedGraphics, setUseIntegratedGraphics] = useState<boolean>(false);
  const [ramSize, setRamSize] = useState<number>(32);
  const [ramType, setRamType] = useState<RamType>('DDR5');
  const [coolerStyle, setCoolerStyle] = useState<'Air Tower' | '360mm AIO Liquid'>('360mm AIO Liquid');
  const [monitorId, setMonitorId] = useState<string>('mon-4k-32-165oled');
  const [storageType, setStorageType] = useState<StorageType>('NVMe Gen4');
  const [storageCapacityGB, setStorageCapacityGB] = useState<number>(2000);
  const [gameId, setGameId] = useState<string>('cyberpunk-pt');
  const [keyboardSwitch, setKeyboardSwitch] = useState<'Linear Red' | 'Tactile Brown' | 'Hall-Effect Magnetic (Rapid Trigger)'>('Hall-Effect Magnetic (Rapid Trigger)');
  const [rgbTheme, setRgbTheme] = useState<RGBTheme>('cyan-neon');
  const [keyboardLightingEffect, setKeyboardLightingEffect] = useState<'pulse' | 'static' | 'wave'>('wave');
  const [isTypingActive, setIsTypingActive] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [activeScreenTab, setActiveScreenTab] = useState<'game' | 'telemetry' | 'benchmark'>('game');
  const [savedPresets, setSavedPresets] = useState<SavedCustomPreset[]>([]);

  useEffect(() => {
    setSavedPresets(getSavedCustomPresets());
  }, []);

  const selectedCpu = cpus.find((c) => c.id === selectedCpuId) || cpus[0];
  const selectedGpu = gpus.find((g) => g.id === selectedGpuId) || gpus[0];

  // Reset the iGPU toggle if the chosen CPU has no integrated graphics
  useEffect(() => {
    if (useIntegratedGraphics && !selectedCpu?.Has_iGPU) {
      setUseIntegratedGraphics(false);
    }
  }, [selectedCpu, useIntegratedGraphics]);

  // Build a synthetic "GPU" record from the CPU's integrated graphics so the rest of
  // the simulator (chassis card, spec sheet, wattage math) can treat it like a real GPU.
  const integratedGpu: GPUItem | null = useMemo(() => buildIntegratedGpu(selectedCpu), [selectedCpu]);

  const effectiveGpu: GPUItem = (useIntegratedGraphics && integratedGpu) ? integratedGpu : selectedGpu;

  const selectedMonitor = MONITOR_OPTIONS.find((m) => m.id === monitorId) || MONITOR_OPTIONS[0];
  const selectedGame = GAMES.find((g) => g.id === gameId) || GAMES[0];

  // Realistic FPS/thermal telemetry: GPU-bound fps from Gaming/RayTracing_Score scaled by
  // resolution pixel count, hard-capped by a CPU-bound ceiling for esports-style titles.
  // This keeps an iGPU (Gaming_Score in the low thousands) from ever showing flagship-GPU fps.
  const telemetry = useMemo(() => {
    const gpuScoreForGame = selectedGame.usesRayTracing
      ? effectiveGpu.Gaming_Score * 0.3 + effectiveGpu.RayTracing_Score * 0.7
      : effectiveGpu.Gaming_Score;
    const resFactor = RESOLUTION_PIXEL_FACTOR[selectedMonitor.resTag];
    const gpuBoundFps = (gpuScoreForGame / selectedGame.gpuDemand) * resFactor;
    const cpuCapFps = Math.max(15, selectedCpu.Gaming_Score * selectedGame.cpuCapMultiplier);
    const avgFps = Math.max(4, Math.round(Math.min(gpuBoundFps, cpuCapFps)));
    const onePctLow = Math.max(2, Math.round(avgFps * 0.74));

    const gpuLoadPct = Math.min(99, Math.max(28, Math.round((avgFps / Math.max(1, gpuBoundFps)) * 100)));
    const cpuLoadPct = Math.min(98, Math.max(12, Math.round((avgFps / Math.max(1, cpuCapFps)) * 100)));

    const gpuIsIntegrated = effectiveGpu.TGP_Watts === 0;
    const gpuTempC = gpuIsIntegrated
      ? 45 + Math.round((cpuLoadPct / 100) * 30)
      : 42 + Math.round((gpuLoadPct / 100) * 42);
    const cpuTempC = 38 + Math.round((cpuLoadPct / 100) * (selectedCpu.TDP_Watts > 150 ? 55 : 42));

    return { avgFps, onePctLow, gpuLoadPct, cpuLoadPct, gpuTempC, cpuTempC, gpuIsIntegrated };
  }, [effectiveGpu, selectedCpu, selectedGame, selectedMonitor]);

  // Calculated estimates
  const estTotalWatts = (selectedCpu?.TDP_Watts || 105) + (effectiveGpu?.TGP_Watts || 250) + 120;
  const monitorCost = selectedMonitor.priceINR;
  const ramCost = ramSize * RAM_TYPE_COST_PER_GB[ramType];
  const storageCost = storageCapacityGB * STORAGE_TYPE_INFO[storageType].costPerGB;
  const keyboardCost = keyboardSwitch.includes('Magnetic') ? 13999 : 4999;
  const mouseAndMatCost = 5999;
  const totalBuildCostINR = (selectedCpu?.Price_INR || 30000) + (effectiveGpu?.Price_INR || 60000) + ramCost + storageCost + 18500;
  const totalBattlestationCostINR = totalBuildCostINR + monitorCost + keyboardCost + mouseAndMatCost;

  // Audio synthesize click effect for mechanical keyboard simulation
  const playKeySound = () => {
    if (isMuted || typeof window === 'undefined' || !window.AudioContext) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = keyboardSwitch.includes('Linear') ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(420 + Math.random() * 80, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext muted/unsupported
    }
  };

  const handleKeyPressSimulation = (keyName: string) => {
    setActiveKey(keyName);
    setIsTypingActive(true);
    playKeySound();
    setTimeout(() => {
      setActiveKey(null);
      setIsTypingActive(false);
    }, 180);
  };

  // RGB theme visual properties
  const themeColors = {
    'cyan-neon': {
      primary: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.45)',
      tailwindRing: 'ring-cyan-500',
      tailwindBg: 'bg-cyan-500',
      text: 'text-cyan-400',
      border: 'border-cyan-500/50'
    },
    'tokyo-purple': {
      primary: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.45)',
      tailwindRing: 'ring-purple-500',
      tailwindBg: 'bg-purple-500',
      text: 'text-purple-400',
      border: 'border-purple-500/50'
    },
    'matrix-green': {
      primary: '#10b981',
      glow: 'rgba(16, 185, 129, 0.45)',
      tailwindRing: 'ring-emerald-500',
      tailwindBg: 'bg-emerald-500',
      text: 'text-emerald-400',
      border: 'border-emerald-500/50'
    },
    'amber-sunset': {
      primary: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.45)',
      tailwindRing: 'ring-amber-500',
      tailwindBg: 'bg-amber-500',
      text: 'text-amber-400',
      border: 'border-amber-500/50'
    },
    'stealth-dark': {
      primary: '#52525b',
      glow: 'rgba(82, 82, 91, 0.2)',
      tailwindRing: 'ring-zinc-600',
      tailwindBg: 'bg-zinc-700',
      text: 'text-zinc-400',
      border: 'border-zinc-700/50'
    }
  }[rgbTheme];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Interactive 3D-Style Workspace Simulation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Dream Setup Battlestation Simulator
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Simulate your configured dream rig sitting on a complete workstation desk: dynamic tempered glass chassis with visible CPU, GPU & cooling, high-refresh gaming monitor with live telemetry HUD, and interactive mechanical keyboard with RGB backlighting.
          </p>
        </div>

        {/* Quick Setup Stats */}
        <div className="flex items-center gap-4 bg-zinc-950/80 border border-zinc-800/80 px-5 py-3.5 rounded-2xl shrink-0">
          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-500">Total Setup Investment</div>
            <div className="text-xl font-mono font-black text-emerald-400">{formatINR(totalBattlestationCostINR)}</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-500">Desk Power Load</div>
            <div className="text-xl font-mono font-black text-amber-400">~{estTotalWatts + 65}W</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Theme, Hardware Pickers & Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RGB Lighting Theme */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
          <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Palette className="w-3.5 h-3.5 text-cyan-400" /> Battlestation RGB Aura
            </span>
          </label>
          <div className="flex items-center gap-2 pt-1">
            {(['cyan-neon', 'tokyo-purple', 'matrix-green', 'amber-sunset', 'stealth-dark'] as RGBTheme[]).map((theme) => {
              const colors: Record<RGBTheme, string> = {
                'cyan-neon': 'bg-cyan-500',
                'tokyo-purple': 'bg-purple-500',
                'matrix-green': 'bg-emerald-500',
                'amber-sunset': 'bg-amber-500',
                'stealth-dark': 'bg-zinc-700'
              };
              return (
                <button
                  key={theme}
                  onClick={() => setRgbTheme(theme)}
                  className={`w-7 h-7 rounded-xl ${colors[theme]} transition-all cursor-pointer ${
                    rgbTheme === theme ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={theme}
                />
              );
            })}
          </div>
        </div>

        {/* CPU Selector */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
          <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Processor (CPU)
            </span>
            <span className="text-[10px] text-zinc-500">{selectedCpu.Cores_Threads}</span>
          </label>
          <select
            value={selectedCpuId}
            onChange={(e) => setSelectedCpuId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cyan-400 focus:outline-none"
          >
            {cpus.map((c) => (
              <option key={c.id} value={c.id}>
                {c.Model} ({c.Architecture})
              </option>
            ))}
          </select>
        </div>

        {/* GPU Selector */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
          <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Monitor className="w-3.5 h-3.5 text-purple-400" /> Graphics Card (GPU)
            </span>
            <span className="text-[10px] text-zinc-500">
              {useIntegratedGraphics ? 'Shared RAM' : `${effectiveGpu.VRAM_GB}GB VRAM`}
            </span>
          </label>
          <select
            value={selectedGpuId}
            onChange={(e) => setSelectedGpuId(e.target.value)}
            disabled={useIntegratedGraphics}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-purple-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {gpus.map((g) => (
              <option key={g.id} value={g.id}>
                {g.Model} ({g.Architecture})
              </option>
            ))}
          </select>
          <label
            className={`flex items-center gap-2 pt-1 text-[11px] font-mono ${
              selectedCpu.Has_iGPU ? 'text-zinc-300 cursor-pointer' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title={selectedCpu.Has_iGPU ? undefined : `${selectedCpu.Model} has no integrated graphics`}
          >
            <input
              type="checkbox"
              checked={useIntegratedGraphics}
              disabled={!selectedCpu.Has_iGPU}
              onChange={(e) => setUseIntegratedGraphics(e.target.checked)}
              className="w-3.5 h-3.5 accent-purple-500 disabled:opacity-40"
            />
            No discrete GPU — use CPU&apos;s integrated graphics
          </label>
        </div>

        {/* Peripherals & Display Preset */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
          <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Laptop className="w-3.5 h-3.5 text-amber-400" /> Display Setup
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">{formatINR(monitorCost)}</span>
          </label>
          <select
            value={monitorId}
            onChange={(e) => setMonitorId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-amber-400 focus:outline-none"
          >
            {MONITOR_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Memory (RAM) Configuration */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
          <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" /> System Memory (RAM)
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">{formatINR(ramCost)}</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={ramSize}
              onChange={(e) => setRamSize(Number(e.target.value))}
              className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-blue-400 focus:outline-none"
            >
              {RAM_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}GB</option>
              ))}
            </select>
            <select
              value={ramType}
              onChange={(e) => setRamType(e.target.value as RamType)}
              className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-blue-400 focus:outline-none"
            >
              {(Object.keys(RAM_TYPE_COST_PER_GB) as RamType[]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Storage Configuration */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
          <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Storage Drive
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">{formatINR(storageCost)}</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={storageCapacityGB}
              onChange={(e) => setStorageCapacityGB(Number(e.target.value))}
              className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-emerald-400 focus:outline-none"
            >
              {STORAGE_CAPACITY_OPTIONS_GB.map((gb) => (
                <option key={gb} value={gb}>{gb >= 1000 ? `${gb / 1000}TB` : `${gb}GB`}</option>
              ))}
            </select>
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value as StorageType)}
              className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-emerald-400 focus:outline-none"
            >
              {(Object.keys(STORAGE_TYPE_INFO) as StorageType[]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Game Simulator Selector */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
          <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Game Simulator
            </span>
            <span className="text-[10px] text-zinc-500">{telemetry.avgFps} FPS</span>
          </label>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-emerald-400 focus:outline-none"
          >
            {GAMES.map((g) => (
              <option key={g.id} value={g.id}>{g.name}{g.usesRayTracing ? ' (RT)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Battlestation Simulation Canvas / Stage */}
      <div className="relative rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
        {/* Ambient Room Glow Behind Desk */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-3/4 h-80 blur-[130px] rounded-full pointer-events-none opacity-40 transition-colors duration-500"
          style={{ backgroundColor: themeColors.primary }}
        />

        {/* Wall LED Accent Light Bar */}
        <div className="w-full max-w-2xl mx-auto h-1.5 rounded-full mb-8 relative overflow-hidden bg-zinc-800/80">
          <div
            className="w-full h-full blur-[2px] transition-colors duration-500"
            style={{ backgroundColor: themeColors.primary }}
          />
        </div>

        {/* DESK SURFACE STAGE */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          {/* Upper Section: Monitor + Desktop PC Tower sitting side by side on desk */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-8">
            {/* 1. GAMING MONITOR (Col 1-8) */}
            <div className="lg:col-span-8 flex flex-col items-center">
              {/* Monitor Screen Frame */}
              <div
                className="w-full aspect-[16/9] sm:aspect-[21/10] bg-zinc-900 rounded-2xl border-4 border-zinc-800 p-2 sm:p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between"
                style={{
                  boxShadow: `0 0 45px ${themeColors.glow}, 0 25px 50px -12px rgba(0, 0, 0, 0.7)`
                }}
              >
                {/* Screen Top Status Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-zinc-300 z-20">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white tracking-wide">{selectedMonitor.label}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400">
                      HDR: <span className="text-amber-400 font-bold">1000 Nits TrueBlack</span>
                    </span>
                    <span className="text-zinc-400">
                      G-Sync / FreeSync: <span className="text-cyan-400 font-bold">ACTIVE</span>
                    </span>
                  </div>
                </div>

                {/* Screen Center Dynamic Content */}
                <div className="my-auto py-4 px-3 sm:px-6 relative z-10 text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-xs font-mono text-zinc-300">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Real-Time In-Game Telemetry Simulation</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                    <div className="p-3 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md">
                      <div className="text-[10px] font-mono uppercase text-zinc-400">Avg Gaming FPS</div>
                      <div className="text-2xl font-black font-mono text-emerald-400">{telemetry.avgFps} FPS</div>
                      <div className="text-[9px] text-zinc-500 font-mono">1% Low: {telemetry.onePctLow} FPS</div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md">
                      <div className="text-[10px] font-mono uppercase text-zinc-400">
                        {telemetry.gpuIsIntegrated ? 'iGPU Temp / Load' : 'GPU Temp / Load'}
                      </div>
                      <div className="text-2xl font-black font-mono text-cyan-400">{telemetry.gpuTempC}°C</div>
                      <div className="text-[9px] text-zinc-500 font-mono">
                        Load: {telemetry.gpuLoadPct}% • {telemetry.gpuIsIntegrated ? 'Shared w/ CPU' : `${effectiveGpu.TGP_Watts}W`}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md">
                      <div className="text-[10px] font-mono uppercase text-zinc-400">CPU Temp / Load</div>
                      <div className="text-2xl font-black font-mono text-purple-400">{telemetry.cpuTempC}°C</div>
                      <div className="text-[9px] text-zinc-500 font-mono">Load: {telemetry.cpuLoadPct}% • {selectedCpu.TDP_Watts}W</div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md">
                      <div className="text-[10px] font-mono uppercase text-zinc-400">Resolution Mode</div>
                      <div className="text-2xl font-black font-mono text-amber-400">
                        {selectedMonitor.resTag}
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono">{selectedMonitor.refreshHz}Hz {selectedMonitor.panel}</div>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-zinc-400">
                    Active Game Simulator: <span className="text-white font-bold">{selectedGame.name}</span>
                    {telemetry.gpuIsIntegrated && (
                      <span className="ml-2 text-amber-400">(iGPU — expect low/medium settings)</span>
                    )}
                  </div>
                </div>

                {/* Screen Bottom Bezel Logo */}
                <div className="flex items-center justify-center py-0.5">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-600 uppercase">
                    SILICON MATRIX VISION
                  </span>
                </div>
              </div>

              {/* Monitor Stand */}
              <div className="w-12 h-14 bg-zinc-800 border-x border-zinc-700/80 -mt-0.5" />
              <div className="w-48 h-3 bg-zinc-800 rounded-t-xl border-t border-zinc-700 shadow-md" />
            </div>

            {/* 2. TEMPERED GLASS PC CHASSIS (Col 9-12) */}
            <div className="lg:col-span-4 flex flex-col items-center">
              <div
                className="w-full max-w-[280px] h-[340px] sm:h-[390px] rounded-3xl bg-zinc-950/90 border-2 border-zinc-700/80 p-3 shadow-2xl relative flex flex-col justify-between overflow-hidden"
                style={{
                  boxShadow: `inset 0 0 35px ${themeColors.glow}, 0 20px 40px -10px rgba(0, 0, 0, 0.8)`
                }}
              >
                {/* Top Exhaust Fans with RGB */}
                <div className="flex items-center justify-around py-1.5 px-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                    <Fan className="w-3.5 h-3.5 animate-spin" style={{ color: themeColors.primary }} />
                    <span>360mm Radiator Exhaust</span>
                  </div>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColors.primary }} />
                </div>

                {/* Interior Components Zone */}
                <div className="my-auto space-y-3 px-2">
                  {/* CPU Cooler Pump / Block */}
                  <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between shadow-inner relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-15 blur-sm"
                      style={{ backgroundColor: themeColors.primary }}
                    />
                    <div className="relative z-10 flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center animate-pulse"
                        style={{ borderColor: themeColors.primary }}
                      >
                        <Cpu className="w-4 h-4" style={{ color: themeColors.primary }} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-white">{selectedCpu.Model}</div>
                        <div className="text-[9px] font-mono text-zinc-400">
                          {selectedCpu.Socket} • {selectedCpu.Architecture}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-cyan-400 font-bold border border-zinc-800">
                      {telemetry.cpuTempC}°C
                    </span>
                  </div>

                  {/* RAM Modules (2x or 4x Sticks) with glowing top RGB bars */}
                  <div className="flex items-center justify-end gap-1.5 px-3">
                    <span className="text-[9px] font-mono text-zinc-500 mr-auto">RAM: {ramSize}GB {ramType}</span>
                    {[1, 2].map((stick) => (
                      <div
                        key={stick}
                        className="w-2.5 h-12 rounded-sm bg-zinc-800 border border-zinc-700 relative overflow-hidden shadow-sm"
                      >
                        <div
                          className="w-full h-3 rounded-t-sm animate-pulse"
                          style={{ backgroundColor: themeColors.primary }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Discrete Graphics Card (GPU) with Fans & RGB Edge */}
                  <div
                    className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl relative overflow-hidden"
                    style={{
                      borderLeftColor: themeColors.primary,
                      borderLeftWidth: '3px'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-white">{effectiveGpu.Model}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300 font-bold">
                        {effectiveGpu.VRAM_GB}GB
                      </span>
                    </div>

                    {/* Dual or Triple Fans */}
                    <div className="flex items-center justify-around py-1 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                      {[1, 2, 3].map((fan) => (
                        <div key={fan} className="flex items-center gap-1">
                          <Fan className="w-4 h-4 animate-spin text-zinc-500" style={{ animationDuration: '2s' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom PSU Shroud & Storage Chamber */}
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> ATX 3.1 PSU Shroud
                  </span>
                  <span className="text-zinc-500">1x {storageType}</span>
                </div>
              </div>

              {/* Chassis Feet */}
              <div className="w-40 flex justify-between px-4">
                <div className="w-4 h-2 bg-zinc-800 rounded-b" />
                <div className="w-4 h-2 bg-zinc-800 rounded-b" />
              </div>
            </div>
          </div>

          {/* DESK SURFACE (Wood/Carbon texture bar) */}
          <div className="w-full h-4 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-xl shadow-lg border-y border-zinc-700 mb-6" />

          {/* LOWER SECTION: Interactive Mechanical Keyboard & Gaming Mouse */}
          <div className="w-full max-w-3xl flex flex-col md:flex-row items-center justify-between gap-6 pb-4">
            {/* Interactive Mechanical Keyboard */}
            <div className="w-full md:w-3/4 p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl relative space-y-2">
              <div className="flex items-center justify-between px-1 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColors.primary }} />
                  Custom 75% Mechanical Keyboard ({keyboardSwitch})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted((m) => !m)}
                    className="p-1 text-zinc-400 hover:text-white rounded"
                    title={isMuted ? 'Unmute Mechanical Click Sounds' : 'Mute Click Sounds'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                  <span className="text-[10px] text-zinc-500 font-mono">1000Hz Polling</span>
                </div>
              </div>

              {/* Keyboard Keycaps Grid Simulation */}
              <div
                className="grid grid-cols-12 gap-1 p-2 rounded-xl bg-zinc-950 border border-zinc-800 shadow-inner"
                style={{
                  boxShadow: `0 0 15px ${themeColors.glow}`
                }}
              >
                {/* Row 1: Function Keys */}
                {['ESC', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'DEL'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeyPressSimulation(k)}
                    className={`h-7 rounded-lg text-[9px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                      activeKey === k
                        ? 'bg-white text-zinc-950 scale-95 shadow-md'
                        : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                    }`}
                  >
                    {k}
                  </button>
                ))}

                {/* Row 2: Number Row */}
                {['~', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'BACK'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeyPressSimulation(k)}
                    className={`h-7 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                      activeKey === k
                        ? 'bg-white text-zinc-950 scale-95 shadow-md'
                        : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                    }`}
                  >
                    {k}
                  </button>
                ))}

                {/* Row 3: QWERTY */}
                {['TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '\\'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeyPressSimulation(k)}
                    className={`h-7 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                      activeKey === k || (k === 'W' && isTypingActive)
                        ? 'bg-white text-zinc-950 scale-95 shadow-md'
                        : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                    }`}
                  >
                    {k}
                  </button>
                ))}

                {/* Row 4: ASDF */}
                {['CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', 'ENTER'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeyPressSimulation(k)}
                    className={`h-7 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                      activeKey === k || ((k === 'A' || k === 'D') && isTypingActive)
                        ? 'bg-white text-zinc-950 scale-95 shadow-md'
                        : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                    }`}
                  >
                    {k}
                  </button>
                ))}

                {/* Row 5: Bottom Modifier Row */}
                {['CTRL', 'WIN', 'ALT', 'SPACE', 'SPACE', 'SPACE', 'SPACE', 'SPACE', 'ALT', 'FN', 'UP', 'DOWN'].map((k, idx) => (
                  <button
                    key={`${k}-${idx}`}
                    onClick={() => handleKeyPressSimulation(k)}
                    className={`h-7 rounded-lg text-[9px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                      k === 'SPACE' ? 'col-span-1 bg-zinc-800 text-zinc-400' : 'bg-zinc-850 text-zinc-300'
                    } ${
                      activeKey === k ? 'bg-white text-zinc-950 scale-95' : 'hover:bg-zinc-800 border border-zinc-700/60'
                    }`}
                  >
                    {k === 'SPACE' ? '␣' : k}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                <span>Click any key above to test mechanical action & sound effect</span>
                <span className="text-cyan-400">PBT Double-Shot Keycaps</span>
              </div>
            </div>

            {/* Wireless Gaming Mouse & Deskmat */}
            <div className="w-full md:w-1/4 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col items-center justify-center space-y-3">
              <div className="text-[11px] font-mono text-zinc-400 font-bold">Ultra-light Mouse (49g)</div>

              {/* Mouse silhouette */}
              <div
                className="w-16 h-28 rounded-3xl bg-zinc-950 border-2 border-zinc-700 relative p-1 flex flex-col justify-between shadow-lg cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleKeyPressSimulation('MOUSE_CLICK')}
                style={{
                  boxShadow: `0 0 12px ${themeColors.glow}`
                }}
              >
                <div className="flex justify-between gap-1 h-10">
                  <div className="flex-1 bg-zinc-850 rounded-tl-2xl border-r border-zinc-700" />
                  <div className="w-1.5 h-4 bg-zinc-700 rounded-full mx-auto self-center" />
                  <div className="flex-1 bg-zinc-850 rounded-tr-2xl border-l border-zinc-700" />
                </div>
                <div className="w-2 h-2 rounded-full mx-auto mb-3" style={{ backgroundColor: themeColors.primary }} />
              </div>

              <div className="text-[10px] font-mono text-zinc-500 text-center">
                PAW3395 Sensor • 26,000 DPI
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "What's Inside Your Dream Setup" Detailed Spec Sheet */}
      <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Inside The Configured Dream Battlestation</h2>
              <p className="text-xs text-zinc-400">Complete itemized bill of materials and component specifications.</p>
            </div>
          </div>

          {onOpenArchitect && (
            <button
              onClick={onOpenArchitect}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
            >
              Open in Rig Architect
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* CPU Card */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Processor
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">{formatINR(selectedCpu.Price_INR)}</span>
            </div>
            <div className="text-sm font-bold text-white">{selectedCpu.Model}</div>
            <div className="text-xs text-zinc-400 space-y-1">
              <div>• Cores & Threads: {selectedCpu.Cores_Threads}</div>
              <div>• Boost Frequency: {selectedCpu.Base_Boost_GHz}</div>
              <div>• Cache: {selectedCpu.Cache_MB}MB • TDP: {selectedCpu.TDP_Watts}W</div>
            </div>
          </div>

          {/* GPU Card */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" /> Graphics Card
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">{formatINR(effectiveGpu.Price_INR)}</span>
            </div>
            <div className="text-sm font-bold text-white">{effectiveGpu.Model}</div>
            <div className="text-xs text-zinc-400 space-y-1">
              <div>• VRAM: {effectiveGpu.VRAM_GB}GB {effectiveGpu.Memory_Type}</div>
              <div>• Memory Bus: {effectiveGpu.Bus_Width_Bit}-bit ({effectiveGpu.Bandwidth_GBs} GB/s)</div>
              <div>• Board Power: {effectiveGpu.TGP_Watts}W • Architecture: {effectiveGpu.Architecture}</div>
            </div>
          </div>

          {/* Display Card */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5" /> Gaming Display
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">{formatINR(monitorCost)}</span>
            </div>
            <div className="text-sm font-bold text-white">{selectedMonitor.label}</div>
            <div className="text-xs text-zinc-400 space-y-1">
              <div>• Response Time: 0.03ms GtG (OLED Instant)</div>
              <div>• Color Gamut: 99% DCI-P3 Professional</div>
              <div>• Ports: DisplayPort 2.1 & Dual HDMI 2.1</div>
            </div>
          </div>

          {/* Memory & Storage */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" /> RAM & High-Speed NVMe
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">{formatINR(ramCost + storageCost)}</span>
            </div>
            <div className="text-sm font-bold text-white">{ramSize}GB {ramType} + {storageCapacityGB >= 1000 ? `${storageCapacityGB / 1000}TB` : `${storageCapacityGB}GB`} {storageType}</div>
            <div className="text-xs text-zinc-400 space-y-1">
              <div>• RAM Speed: 6000 MT/s CL30 Dual-Channel</div>
              <div>• {storageType} Read Speed: {STORAGE_TYPE_INFO[storageType].readSpeed}</div>
            </div>
          </div>

          {/* Cooling & Power Supply */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase flex items-center gap-1.5">
                <Fan className="w-3.5 h-3.5" /> Thermals & Power Unit
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">{formatINR(18500)}</span>
            </div>
            <div className="text-sm font-bold text-white">360mm Liquid AIO + 850W Gold ATX 3.1</div>
            <div className="text-xs text-zinc-400 space-y-1">
              <div>• Native 12V-2x6 600W PCIe 5.0 GPU Cable</div>
              <div>• Quiet Fluid Dynamic Bearing Fans</div>
            </div>
          </div>

          {/* Peripherals & Ergonomics */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Peripherals Package
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">{formatINR(keyboardCost + mouseAndMatCost)}</span>
            </div>
            <div className="text-sm font-bold text-white">Rapid-Trigger Keyboard + 49g Optical Mouse</div>
            <div className="text-xs text-zinc-400 space-y-1">
              <div>• Magnetic switches with 0.1mm adjustable actuation</div>
              <div>• Cordura speed-cloth 900x400mm deskmat</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
