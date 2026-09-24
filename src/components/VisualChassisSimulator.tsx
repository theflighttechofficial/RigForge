import React, { useState } from 'react';
import { CPUItem, GPUItem } from '../types';
import { formatINR } from '../utils/formatters';
import {
  Wind,
  Layers,
  Cpu,
  Monitor,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Fan,
  Gauge,
  Sparkles,
  Info,
  Maximize2,
  Compass,
  Palette
} from 'lucide-react';

interface VisualChassisSimulatorProps {
  cpu: CPUItem;
  gpu: GPUItem;
  ramType: 'DDR4' | 'DDR5';
  ramCapacity: number;
  cooler: 'Stock' | 'Tower Air' | '240mm AIO' | '360mm AIO';
  storageCount: number;
  totalWatts: number;
  recommendedPsu: number;
  chosenPsuName?: string;
  chosenPsuWattage?: number;
  chosenPsuLoadPct?: number;
  isPsuOver80?: boolean;
  isPsuOverloaded?: boolean;
  onOpenBenchmarks?: () => void;
}

export type RgbTheme = 'cyberpunk' | 'stealth' | 'aurora' | 'arctic';
export type CaseFormFactor = 'mid_tower' | 'compact_matx' | 'full_tower';
export type CasePanelType = 'mesh' | 'glass';

export const VisualChassisSimulator: React.FC<VisualChassisSimulatorProps> = ({
  cpu,
  gpu,
  ramType,
  ramCapacity,
  cooler,
  storageCount,
  totalWatts,
  recommendedPsu,
  chosenPsuName,
  chosenPsuWattage,
  chosenPsuLoadPct,
  isPsuOver80,
  isPsuOverloaded,
  onOpenBenchmarks
}) => {
  const [rgbTheme, setRgbTheme] = useState<RgbTheme>('cyberpunk');
  const [caseForm, setCaseForm] = useState<CaseFormFactor>('mid_tower');
  const [panelType, setPanelType] = useState<CasePanelType>('mesh');
  const [fanRpmMode, setFanRpmMode] = useState<'silent' | 'balanced' | 'turbo'>('balanced');
  const [activeInspect, setActiveInspect] = useState<string | null>(null);

  // Chassis Dimensions & Clearances
  const caseClearances = {
    compact_matx: { maxGpuLength: 305, maxCoolerHeight: 155, name: 'Micro-ATX Compact Case', maxRadiator: 240 },
    mid_tower: { maxGpuLength: 360, maxCoolerHeight: 170, name: 'Standard ATX Mid-Tower', maxRadiator: 360 },
    full_tower: { maxGpuLength: 430, maxCoolerHeight: 185, name: 'Enthusiast Full-Tower Chassis', maxRadiator: 420 }
  }[caseForm];

  // Component Fitment Diagnostics
  const gpuLength = gpu.Length_mm || 280;
  const isGpuClearing = gpuLength <= caseClearances.maxGpuLength;
  const gpuMarginMm = caseClearances.maxGpuLength - gpuLength;

  const coolerHeightMm = cooler === 'Stock' ? 65 : cooler === 'Tower Air' ? 160 : 55; // AIO block is low profile
  const isCoolerClearing = coolerHeightMm <= caseClearances.maxCoolerHeight;
  const isRadiatorClearing = cooler === '360mm AIO' ? caseClearances.maxRadiator >= 360 : true;

  // Sag check: cards > 285mm or > 250W need sag bracket
  const needsSagBracket = gpuLength >= 285 || gpu.TGP_Watts >= 250;

  // Transient Spike rating
  const transientSpikeWatts = Math.round(gpu.TGP_Watts * 1.8 + cpu.TDP_Watts * 1.4);
  const psuHeadroomSafe = recommendedPsu >= transientSpikeWatts * 0.95;

  // Motherboard socket
  const isAm5 = cpu.Socket === 'AM5';
  const isLga1851 = cpu.Socket === 'LGA 1851';
  const moboChipset = isAm5
    ? 'AMD B650 / X870'
    : isLga1851
    ? 'Intel Z890 / B860'
    : cpu.Socket.includes('BGA') || cpu.Socket.includes('FP')
    ? 'OEM Mobile / Ultrabook SoC'
    : cpu.Socket === 'LGA 1700'
    ? 'Intel B760 / Z790'
    : 'AMD AM4 B550';
  const vrmPowerPhases = isAm5
    ? '16+2+1 DrMOS (80A)'
    : isLga1851
    ? '18+1+2 Smart Power Stage (90A)'
    : cpu.Socket.includes('BGA') || cpu.Socket.includes('FP')
    ? '6+2 Embedded Phase'
    : '16+1+1 (70A)';
  const isBlackwellGpu = gpu.Architecture.toLowerCase().includes('blackwell') || gpu.Model.includes('5090') || gpu.Model.includes('5080') || gpu.Model.includes('5070') || gpu.Model.includes('5060') || gpu.Model.includes('5050');

  // Theme colors
  const rgbColors = {
    cyberpunk: {
      primary: '#06b6d4', // Cyan
      secondary: '#ec4899', // Pink/Magenta
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
      ramBorder: 'border-cyan-400 bg-cyan-950/60 text-cyan-300',
      coolerLed: 'text-cyan-400',
      name: 'Cyberpunk Neon'
    },
    stealth: {
      primary: '#52525b', // Zinc
      secondary: '#27272a',
      glow: '',
      ramBorder: 'border-zinc-700 bg-zinc-900 text-zinc-400',
      coolerLed: 'text-zinc-500',
      name: 'Stealth Blackout'
    },
    aurora: {
      primary: '#10b981', // Emerald
      secondary: '#8b5cf6', // Violet
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
      ramBorder: 'border-emerald-400 bg-emerald-950/60 text-emerald-300',
      coolerLed: 'text-emerald-400',
      name: 'Aurora Borealis'
    },
    arctic: {
      primary: '#38bdf8', // Light Blue
      secondary: '#f8fafc', // Crisp White
      glow: 'shadow-[0_0_15px_rgba(56,189,248,0.4)]',
      ramBorder: 'border-sky-300 bg-sky-950/60 text-sky-200',
      coolerLed: 'text-sky-300',
      name: 'Arctic Blizzard'
    }
  }[rgbTheme];

  const fanSpeedRpm = fanRpmMode === 'silent' ? '850 RPM' : fanRpmMode === 'balanced' ? '1,350 RPM' : '2,100 RPM';

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Top Header & Simulator Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Interactive 2D Silicon Chassis Simulator
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              Active Fitment & Airflow Engine
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Visual Rig Architecture & Clearance Inspector
          </h3>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Inspect physical component tolerances, Motherboard PCIe layout, dynamic fluid chassis airflow vectors, and transient power spikes in real-time.
          </p>
        </div>

        {/* RGB Theme & Preset Quick-Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* RGB Palette Picker */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <Palette className="w-3.5 h-3.5 text-zinc-400 ml-1.5 mr-0.5" />
            {(['cyberpunk', 'aurora', 'arctic', 'stealth'] as RgbTheme[]).map((theme) => (
              <button
                key={theme}
                onClick={() => setRgbTheme(theme)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer ${
                  rgbTheme === theme
                    ? 'bg-zinc-800 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>

          {/* Airflow Mode */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-mono">
            <Fan className={`w-3.5 h-3.5 ml-1.5 mr-0.5 ${fanRpmMode === 'turbo' ? 'text-rose-400 animate-spin' : 'text-cyan-400'}`} />
            {(['silent', 'balanced', 'turbo'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFanRpmMode(mode)}
                className={`px-2 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  fanRpmMode === mode
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Visual Chassis Schematic Canvas & Subsystem Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: 2D Interactive Chassis Schematic (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-2xl bg-zinc-950 border-2 border-zinc-800 p-4 sm:p-6 overflow-hidden shadow-inner select-none">
            {/* Ambient Chassis LED Hue */}
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-20"
              style={{
                background: `radial-gradient(circle at 65% 45%, ${rgbColors.primary} 0%, ${rgbColors.secondary} 40%, transparent 80%)`
              }}
            />

            {/* Top Status Bar of the Chassis */}
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-4 pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-white font-bold">{caseClearances.name}</span>
                <span className="text-zinc-500">&bull;</span>
                <span className="text-cyan-400">{panelType === 'mesh' ? 'High-Flow Mesh' : 'Tempered Glass'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Intake: <strong className="text-cyan-400">{fanSpeedRpm}</strong></span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">Airflow: <strong className="text-emerald-400">Positive Delta</strong></span>
              </div>
            </div>

            {/* Visual Chassis Frame Representation (SVG + HTML layer) */}
            <div className="relative w-full aspect-[16/11] bg-zinc-900/60 rounded-xl border border-zinc-800/90 p-3 sm:p-5 flex flex-col justify-between overflow-hidden">
              {/* TOP RADIATOR / EXHAUST SECTION */}
              <div className="w-full flex items-center justify-between px-6 py-2 rounded-lg bg-zinc-950/80 border border-zinc-800/60 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Wind className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-zinc-400">Top Exhaust:</span>
                  <span className="text-zinc-200 font-semibold">
                    {cooler.includes('AIO') ? `${cooler} Radiator + Dual/Triple Fans` : '2x 120mm Exhaust Fans'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-rose-400 flex items-center gap-1">&uarr; Hot Air Outflow</span>
                  <span className="text-zinc-500 font-bold">~42°C</span>
                </div>
              </div>

              {/* MAIN MOTHERBOARD CHAMBER (Center) */}
              <div className="flex-1 my-3 grid grid-cols-12 gap-3 relative">
                {/* FRONT INTAKE AIRFLOW (Left 2 cols) */}
                <div className="col-span-2 flex flex-col justify-around items-center py-2 px-1 bg-zinc-950/60 rounded-xl border border-cyan-500/20 text-center">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                    Front Mesh Intake
                  </div>
                  {/* Animated Fans */}
                  <div className="space-y-3">
                    {[1, 2, 3].map((fanIdx) => (
                      <div
                        key={fanIdx}
                        className="w-10 h-10 rounded-full border border-cyan-500/40 bg-cyan-950/30 flex items-center justify-center relative shadow-sm"
                      >
                        <Fan
                          className={`w-6 h-6 text-cyan-400 transition-all ${
                            fanRpmMode === 'turbo'
                              ? 'animate-spin [animation-duration:0.6s]'
                              : fanRpmMode === 'balanced'
                              ? 'animate-spin [animation-duration:1.2s]'
                              : 'animate-spin [animation-duration:2.5s]'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                    <span>&rarr;</span> Cold Air
                  </div>
                </div>

                {/* MOTHERBOARD TRAY (Middle 10 cols) */}
                <div className="col-span-10 bg-zinc-950/90 rounded-xl border border-zinc-800 p-3.5 flex flex-col justify-between relative shadow-lg">
                  {/* Motherboard Header Label */}
                  <div className="flex items-center justify-between text-[11px] font-mono border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <strong>{moboChipset}</strong> Motherboard ({cpu.Socket})
                    </span>
                    <span className="text-zinc-400">
                      VRM: <strong className="text-emerald-400">{vrmPowerPhases}</strong>
                    </span>
                  </div>

                  {/* Top Half of Motherboard: CPU Socket, Cooler & RAM Slots */}
                  <div className="grid grid-cols-12 gap-3 items-center py-2">
                    {/* CPU & Cooler Assembly (8 cols) */}
                    <div
                      onClick={() => setActiveInspect('cpu')}
                      className={`col-span-8 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        activeInspect === 'cpu'
                          ? 'border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400'
                          : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="text-zinc-300 font-bold truncate max-w-[170px]">{cpu.Model}</span>
                        <span className="text-cyan-400 font-bold text-[11px]">{cooler}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Cooler Graphic */}
                        <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-700 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                          {cooler.includes('AIO') ? (
                            <div className="relative flex flex-col items-center">
                              <div
                                className="w-8 h-8 rounded-full border border-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-glow-cyan"
                                style={{ borderColor: rgbColors.primary }}
                              >
                                52°C
                              </div>
                              <span className="text-[8px] font-mono text-cyan-300">PUMP</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Fan className="w-6 h-6 text-zinc-300 animate-spin [animation-duration:1.5s]" />
                              <span className="text-[8px] font-mono text-zinc-400">FIN TOWER</span>
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-zinc-400 space-y-0.5">
                          <div>Cores/Threads: <strong className="text-white">{cpu.Cores_Threads}</strong></div>
                          <div>Load Temp: <strong className="text-emerald-400">~61°C</strong> &bull; TDP: <strong className="text-white">{cpu.TDP_Watts}W</strong></div>
                          <div className="text-[10px] text-zinc-500">PCIe 5.0 x16 Primary PEG</div>
                        </div>
                      </div>
                    </div>

                    {/* RAM DIMM Slots (4 cols) */}
                    <div
                      onClick={() => setActiveInspect('ram')}
                      className={`col-span-4 p-2 rounded-xl border transition-all cursor-pointer ${
                        activeInspect === 'ram'
                          ? 'border-cyan-400 bg-cyan-950/30'
                          : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-[11px] font-mono text-zinc-400 mb-1 flex items-center justify-between">
                        <span>DIMM Slots</span>
                        <span className="text-white font-bold">{ramType}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-center py-1">
                        {[1, 2].map((slot) => (
                          <div
                            key={slot}
                            className={`w-3.5 h-12 rounded-sm border flex flex-col justify-between items-center py-1 text-[8px] font-mono transition-all ${rgbColors.ramBorder}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="rotate-90 text-[7px] font-bold">RGB</span>
                            <span className="w-2 h-0.5 bg-zinc-400" />
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] font-mono text-center text-zinc-400 mt-1">
                        {ramCapacity} GB Dual-Channel
                      </div>
                    </div>
                  </div>

                  {/* NVMe M.2 Shield Slot */}
                  <div
                    onClick={() => setActiveInspect('storage')}
                    className="w-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-lg px-2.5 py-1 flex items-center justify-between text-[11px] font-mono text-zinc-400 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      M.2 PCIe 4.0 Thermal Shield: <strong className="text-white">{storageCount}x NVMe Drive ({storageCount * 1} TB)</strong>
                    </span>
                    <span className="text-emerald-400 font-bold">~44°C Gen4 Temp</span>
                  </div>

                  {/* Lower Half of Motherboard: GPU in PCIe Slot */}
                  <div
                    onClick={() => setActiveInspect('gpu')}
                    className={`mt-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeInspect === 'gpu'
                        ? 'border-purple-400 bg-purple-950/30 ring-1 ring-purple-400'
                        : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-purple-400" />
                        {gpu.Model} ({gpu.VRAM_GB}GB VRAM)
                      </span>
                      <span className="text-purple-400 font-bold">{gpuLength} mm Length</span>
                    </div>

                    {/* Visual GPU Shroud */}
                    <div className="w-full h-9 rounded-lg bg-zinc-950 border border-purple-500/40 px-3 flex items-center justify-between text-xs font-mono relative overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        <span className="text-[11px] text-zinc-300 font-bold">Triple Axial Fans (Zero RPM Idle)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-zinc-400">Power: <strong className="text-white">{gpu.TGP_Watts}W</strong></span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                          {gpu.TGP_Watts > 280 ? '12VHPWR 16-Pin' : '2x 8-Pin PCIe'}
                        </span>
                      </div>
                    </div>

                    {/* Anti-Sag Bracket Status */}
                    {needsSagBracket && (
                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-amber-300">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          GPU Anti-Sag Support Bracket: Installed
                        </span>
                        <span className="text-zinc-500">Prevents PCIe Slot Strain</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM PSU BASEMENT & DRIVE CAGE SHROUD */}
              <div
                onClick={() => setActiveInspect('psu')}
                className={`w-full flex items-center justify-between px-5 py-2.5 rounded-xl bg-zinc-950 border text-xs font-mono cursor-pointer transition-all ${
                  isPsuOverloaded
                    ? 'border-rose-500/70 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                    : isPsuOver80
                    ? 'border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${isPsuOverloaded ? 'text-rose-400 animate-pulse' : isPsuOver80 ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span className="text-zinc-400">PSU Basement:</span>
                  <span className="text-white font-bold">
                    {chosenPsuWattage || recommendedPsu}W {chosenPsuName ? `(${chosenPsuName.split(' ')[0]})` : '80+ Gold'}
                  </span>
                  {isPsuOverloaded ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      CRITICAL OVERLOAD ({chosenPsuLoadPct}%)
                    </span>
                  ) : isPsuOver80 ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      &gt;80% Load Warning ({chosenPsuLoadPct}%)
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Compatible ({chosenPsuLoadPct ?? 65}%)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span>Peak Load: <strong className="text-white">{totalWatts}W</strong></span>
                  <span className={isPsuOver80 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                    Load: {chosenPsuLoadPct ?? Math.round((totalWatts / recommendedPsu) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Case Form Factor Switcher */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Chassis Form Factor:
            </span>
            <div className="flex items-center gap-2">
              {[
                { id: 'compact_matx', label: 'Micro-ATX (305mm GPU Max)' },
                { id: 'mid_tower', label: 'Mid-Tower (360mm GPU Max)' },
                { id: 'full_tower', label: 'Full-Tower (430mm GPU Max)' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCaseForm(c.id as CaseFormFactor)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    caseForm === c.id
                      ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {c.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Physical Fitment, Clearances & Subsystem HUD (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Fitment & Clearance Verification Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <span className="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                Physical Clearance & Fitment Guard
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                isGpuClearing && isCoolerClearing && isRadiatorClearing
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
              }`}>
                {isGpuClearing && isCoolerClearing && isRadiatorClearing ? '100% Verified Fit' : 'Clearance Alert'}
              </span>
            </div>

            {/* GPU Length Clearance */}
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">GPU Length vs. Chassis:</span>
                <span className={`font-bold ${isGpuClearing ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {gpuLength}mm / {caseClearances.maxGpuLength}mm
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                <div
                  className={`h-full rounded-full ${
                    isGpuClearing ? 'bg-cyan-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (gpuLength / caseClearances.maxGpuLength) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 flex justify-between">
                <span>Margin: {gpuMarginMm >= 0 ? `+${gpuMarginMm}mm clearance` : `${gpuMarginMm}mm collision!`}</span>
                <span>{caseForm}</span>
              </div>
            </div>

            {/* CPU Cooler Height Clearance */}
            <div className="space-y-1 text-xs font-mono pt-2 border-t border-zinc-800/80">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Cooler Height vs. Chassis:</span>
                <span className={`font-bold ${isCoolerClearing ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {coolerHeightMm}mm / {caseClearances.maxCoolerHeight}mm
                </span>
              </div>
              <div className="text-[10px] text-zinc-500">
                {cooler.includes('AIO')
                  ? 'AIO low-profile waterblock has zero side-panel collision risk.'
                  : `Tower heatsink fits with ${caseClearances.maxCoolerHeight - coolerHeightMm}mm tempered glass gap.`}
              </div>
            </div>

            {/* Motherboard Socket & Memory Pairing */}
            <div className="space-y-1 text-xs font-mono pt-2 border-t border-zinc-800/80">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Socket & RAM Architecture:</span>
                <span className="text-emerald-400 font-bold">{cpu.Socket} &bull; {ramType}</span>
              </div>
              <div className="text-[10px] text-zinc-500">
                {(isAm5 || isLga1851) && ramType === 'DDR4'
                  ? `Warning: ${cpu.Socket} architecture requires high-speed DDR5 memory modules!`
                  : 'Memory bus controllers and voltage regulators matched.'}
              </div>
            </div>

            {/* Transient Power Headroom Guard */}
            <div className="space-y-1 text-xs font-mono pt-2 border-t border-zinc-800/80">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Microsecond Transient Headroom:</span>
                <span className={`font-bold ${psuHeadroomSafe ? 'text-emerald-400' : 'text-amber-400'}`}>
                  ~{transientSpikeWatts}W Peak {isBlackwellGpu ? '(ATX 3.1 12V-2x6)' : ''}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500">
                {isBlackwellGpu
                  ? 'Blackwell RTX 50 series utilizes native ATX 3.1 12V-2x6 connector rated for up to 600W sustained throughput.'
                  : 'ATX 3.0 / PCIe 5.0 spec tolerates 200% power spikes for up to 100μs without triggering overcurrent protection (OCP).'}
              </div>
            </div>
          </div>

          {/* Interactive Inspection Details Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Subsystem Live Telemetry
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Click components to inspect</span>
            </div>

            {activeInspect === 'cpu' && (
              <div className="space-y-2 text-xs font-mono">
                <div className="text-white font-bold">{cpu.Model}</div>
                <div className="text-zinc-400">Architecture: <span className="text-zinc-200">{cpu.Architecture}</span></div>
                <div className="text-zinc-400">Base / Boost: <span className="text-cyan-400">{cpu.Base_Boost_GHz}</span></div>
                <div className="text-zinc-400">Cache: <span className="text-white">{cpu.Cache_MB} MB</span></div>
                <div className="text-zinc-400">Estimated Price: <span className="text-emerald-400 font-bold">{formatINR(cpu.Price_INR)}</span></div>
              </div>
            )}

            {activeInspect === 'gpu' && (
              <div className="space-y-2 text-xs font-mono">
                <div className="text-white font-bold">{gpu.Model}</div>
                <div className="text-zinc-400">VRAM: <span className="text-purple-400 font-bold">{gpu.VRAM_GB}GB {gpu.Memory_Type}</span></div>
                <div className="text-zinc-400">Memory Bus: <span className="text-zinc-200">{gpu.Bus_Width_Bit}-bit ({gpu.Bandwidth_GBs} GB/s)</span></div>
                <div className="text-zinc-400">Power Rating: <span className="text-white">{gpu.TGP_Watts}W TGP</span></div>
                <div className="text-zinc-400">Card Length: <span className="text-cyan-400">{gpuLength} mm</span></div>
              </div>
            )}

            {activeInspect === 'ram' && (
              <div className="space-y-2 text-xs font-mono">
                <div className="text-white font-bold">{ramCapacity}GB {ramType} Dual-Channel Kit</div>
                <div className="text-zinc-400">Speed Profile: <span className="text-cyan-400">{ramType === 'DDR5' ? '6000 MT/s CL30 EXPO/XMP' : '3600 MT/s CL16'}</span></div>
                <div className="text-zinc-400">RGB Lighting Theme: <span className="text-emerald-400 capitalize">{rgbColors.name}</span></div>
              </div>
            )}

            {activeInspect === 'storage' && (
              <div className="space-y-2 text-xs font-mono">
                <div className="text-white font-bold">PCIe Gen4 NVMe Storage Subsystem</div>
                <div className="text-zinc-400">Capacity: <span className="text-white">{storageCount}x 1TB NVMe Solid State Drives</span></div>
                <div className="text-zinc-400">Sequential Read/Write: <span className="text-emerald-400 font-bold">7,300 / 6,500 MB/s</span></div>
              </div>
            )}

            {activeInspect === 'psu' && (
              <div className="space-y-2 text-xs font-mono">
                <div className="text-white font-bold flex items-center justify-between">
                  <span>{chosenPsuName || `${recommendedPsu}W Power Supply`}</span>
                  <span className="text-cyan-400 font-bold">{chosenPsuWattage || recommendedPsu}W Rated</span>
                </div>
                <div className="text-zinc-400">Total System Power Draw: <span className="text-white font-bold">~{totalWatts}W</span></div>
                <div className="text-zinc-400">
                  Continuous Load: <span className={`font-bold ${isPsuOverloaded ? 'text-rose-400' : isPsuOver80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {chosenPsuLoadPct ?? Math.round((totalWatts / recommendedPsu) * 100)}%
                  </span>
                  {' '}(80% Limit: {Math.round((chosenPsuWattage || recommendedPsu) * 0.8)}W)
                </div>
                {isPsuOver80 ? (
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px] flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Warning: Continuous load exceeds 80% rated capacity. Upgrade to at least {recommendedPsu}W to maintain safe transient excursion headroom.</span>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Safe Headroom: Operating well below 80% ceiling with optimal efficiency and low capacitor thermals.</span>
                  </div>
                )}
              </div>
            )}

            {!activeInspect && (
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                Select any component inside the chassis above to inspect clock frequencies, PCIe channel lanes, thermal margins, and Indian market costs.
              </p>
            )}
          </div>

          {/* Shortcut to Live Benchmark Studio */}
          {onOpenBenchmarks && (
            <button
              onClick={onOpenBenchmarks}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Gauge className="w-4 h-4" />
              <span>Simulate Real Games & Benchmarks with this Rig &rarr;</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
