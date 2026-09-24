import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RAM_PRESETS,
  CAPACITY_SUITABILITY,
  RAMPresetConfig,
  CapacityWorkloadSuitability,
  calculateFirstWordLatencyNs,
  calculateMemoryBandwidthGBps,
  calculateEffectiveTotalLatencyNs,
  calculateFPSStabilityScore
} from '../data/ramLabData';
import { formatINR } from '../utils/formatters';
import {
  Cpu,
  Zap,
  Sliders,
  Layers,
  Sparkles,
  Gauge,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Boxes,
  Maximize2
} from 'lucide-react';

interface RAMConfigurationLabProps {
  onNavigateToBuilder?: () => void;
  theme?: 'dark' | 'light';
}

export const RAMConfigurationLab: React.FC<RAMConfigurationLabProps> = ({
  onNavigateToBuilder,
  theme = 'dark'
}) => {
  // Sandbox RAM Configuration Controls
  const [ramType, setRamType] = useState<'DDR4' | 'DDR5'>('DDR5');
  const [frequencyMhz, setFrequencyMhz] = useState<number>(6000);
  const [casLatencyCL, setCasLatencyCL] = useState<number>(30);
  const [tRCD, setTRCD] = useState<number>(36);
  const [tRP, setTRP] = useState<number>(36);
  const [tRAS, setTRAS] = useState<number>(76);
  const [channels, setChannels] = useState<'Single' | 'Dual'>('Dual');
  const [dimmCount, setDimmCount] = useState<2 | 4>(2);
  const [capacityGb, setCapacityGb] = useState<number>(32);
  const [gearMode, setGearMode] = useState<'Gear 1 (1:1)' | 'Gear 2 (1:2)' | 'Gear 4 (1:4)'>('Gear 1 (1:1)');

  // Preset quick load
  const [activePresetId, setActivePresetId] = useState<string>('ddr5-6000-cl30');

  // Active Capacity tab for Workload Suitability Matrix
  const [selectedCapacityGb, setSelectedCapacityGb] = useState<number>(32);

  // Apply preset helper
  const handleApplyPreset = (preset: RAMPresetConfig) => {
    setActivePresetId(preset.id);
    setRamType(preset.type);
    setFrequencyMhz(preset.frequencyMhz);
    setCasLatencyCL(preset.casLatencyCL);
    setTRCD(preset.tRCD);
    setTRP(preset.tRP);
    setTRAS(preset.tRAS);
    setChannels(preset.channels);
    setDimmCount(preset.dimmCount);
    setCapacityGb(preset.capacityGb);
    setGearMode(preset.gearMode);
  };

  // Calculated Physics Metrics
  const firstWordLatencyNs = useMemo(() => {
    return calculateFirstWordLatencyNs(frequencyMhz, casLatencyCL);
  }, [frequencyMhz, casLatencyCL]);

  const memoryBandwidthGBps = useMemo(() => {
    return calculateMemoryBandwidthGBps(frequencyMhz, channels, ramType);
  }, [frequencyMhz, channels, ramType]);

  const effectiveTotalLatencyNs = useMemo(() => {
    return calculateEffectiveTotalLatencyNs(firstWordLatencyNs, gearMode, dimmCount, ramType);
  }, [firstWordLatencyNs, gearMode, dimmCount, ramType]);

  const fpsStabilityScore = useMemo(() => {
    return calculateFPSStabilityScore(effectiveTotalLatencyNs, memoryBandwidthGBps);
  }, [effectiveTotalLatencyNs, memoryBandwidthGBps]);

  // Selected Capacity Object
  const currentCapacityObj = useMemo(() => {
    return CAPACITY_SUITABILITY.find((c) => c.capacityGb === selectedCapacityGb) || CAPACITY_SUITABILITY[1];
  }, [selectedCapacityGb]);

  // ASCII Bar calculation
  // Bandwidth max = 128 GB/s (16 blocks)
  const bandwidthBarBlocks = Math.max(1, Math.min(16, Math.round((memoryBandwidthGBps / 128) * 16)));
  const bandwidthAscii = '█'.repeat(bandwidthBarBlocks);

  // Latency bar: lower is better (max 20ns)
  const latencyBarBlocks = Math.max(1, Math.min(16, Math.round((effectiveTotalLatencyNs / 20) * 16)));
  const latencyAscii = '█'.repeat(latencyBarBlocks);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                Memory Subsystem Architecture
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                TIMINGS & LATENCY LAB
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              RAM Configuration & Latency Simulator
            </h1>
          </div>
        </div>
      </div>

      {/* QUICK PRESETS CAROUSEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Turnkey Memory Profile Presets</span>
          </span>
          <span className="text-xs text-zinc-500">Click to apply configuration</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RAM_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                  isSelected
                    ? 'bg-zinc-950 border-cyan-500 shadow-lg shadow-cyan-500/10'
                    : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800'
                }`}
              >
                {preset.badge && (
                  <span className="absolute top-3 right-3 text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {preset.badge}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      preset.type === 'DDR5'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {preset.type}
                  </span>
                  <span className="text-sm font-bold text-white">{preset.name}</span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2">{preset.description}</p>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
                  <span>Est Price: {formatINR(preset.priceINR)}</span>
                  <span className="text-cyan-400 font-bold">{preset.gearMode}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN RAM SANDBOX & PHYSICS CALCULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: CONTROLS & SLIDERS (7 COLS) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>Interactive Memory Tuning Sandbox</span>
            </h2>
            <span className="text-xs text-zinc-400">Custom Manual Overclock</span>
          </div>

          {/* Toggle DDR4 / DDR5 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              RAM Generation Standard
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setRamType('DDR4');
                  if (frequencyMhz > 4400) setFrequencyMhz(3600);
                  if (casLatencyCL > 22) setCasLatencyCL(16);
                }}
                className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  ramType === 'DDR4'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-md'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}
              >
                DDR4 (288-pin DIMM)
              </button>
              <button
                onClick={() => {
                  setRamType('DDR5');
                  if (frequencyMhz < 4800) setFrequencyMhz(6000);
                  if (casLatencyCL < 28) setCasLatencyCL(30);
                }}
                className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  ramType === 'DDR5'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-md'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}
              >
                DDR5 (On-Die ECC + PMIC)
              </button>
            </div>
          </div>

          {/* Frequency & CAS Latency Sliders */}
          <div className="space-y-5 pt-2">
            {/* Frequency */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-bold uppercase">Memory Data Rate (Frequency)</span>
                <span className="text-cyan-400 font-extrabold">{frequencyMhz} MT/s (MHz)</span>
              </div>
              <input
                type="range"
                min={ramType === 'DDR4' ? 2133 : 4800}
                max={ramType === 'DDR4' ? 4400 : 8400}
                step={200}
                value={frequencyMhz}
                onChange={(e) => {
                  setFrequencyMhz(Number(e.target.value));
                  setActivePresetId('custom');
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* CAS Latency */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-bold uppercase">CAS Latency (tCL)</span>
                <span className="text-cyan-400 font-extrabold">CL{casLatencyCL}</span>
              </div>
              <input
                type="range"
                min={ramType === 'DDR4' ? 12 : 28}
                max={ramType === 'DDR4' ? 22 : 44}
                step={1}
                value={casLatencyCL}
                onChange={(e) => {
                  setCasLatencyCL(Number(e.target.value));
                  setActivePresetId('custom');
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Timings (tRCD, tRP, tRAS) */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold block">tRCD</span>
                <input
                  type="number"
                  value={tRCD}
                  onChange={(e) => setTRCD(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold block">tRP</span>
                <input
                  type="number"
                  value={tRP}
                  onChange={(e) => setTRP(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold block">tRAS</span>
                <input
                  type="number"
                  value={tRAS}
                  onChange={(e) => setTRAS(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Channel & Gear Mode Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Channel Mode
              </label>
              <select
                value={channels}
                onChange={(e) => setChannels(e.target.value as any)}
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="Single">Single Channel (64-bit bus)</option>
                <option value="Dual">Dual Channel (128-bit bus)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Memory Controller Gear Mode
              </label>
              <select
                value={gearMode}
                onChange={(e) => setGearMode(e.target.value as any)}
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="Gear 1 (1:1)">Gear 1 (1:1 Ratio - Lowest Latency)</option>
                <option value="Gear 2 (1:2)">Gear 2 (1:2 Ratio - High Speed OC)</option>
                <option value="Gear 4 (1:4)">Gear 4 (1:4 Ratio - Ultra Speed OC)</option>
              </select>
            </div>
          </div>

          {/* DIMM Count Warning */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white">DIMM Slot Topology</span>
              <p className="text-[11px] text-zinc-400">
                {dimmCount === 4 && ramType === 'DDR5'
                  ? '⚠️ 4 DIMMs on DDR5 adds +4.0ns memory controller signal strain penalty.'
                  : 'Optimal 2 DIMM dual-channel layout.'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDimmCount(2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  dimmCount === 2 ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                2 DIMMs
              </button>
              <button
                onClick={() => setDimmCount(4)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  dimmCount === 4 ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                4 DIMMs
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CALCULATED PHYSICS OUTPUT (5 COLS) */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-zinc-950 border-2 border-cyan-500/30 space-y-6 shadow-2xl">
          <div className="space-y-1 border-b border-zinc-800 pb-4">
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest block">
              SIMULATED PERFORMANCE
            </span>
            <h2 className="text-xl font-extrabold text-white">
              {ramType}-{frequencyMhz} CL{casLatencyCL}
            </h2>
            <p className="text-xs text-zinc-400">
              Timings: {casLatencyCL}-{tRCD}-{tRP}-{tRAS} &bull; {channels} Channel
            </p>
          </div>

          {/* THE EXACT USER PROMPT ASCII BAR FORMAT */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            {/* Bandwidth Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-bold">Theoretical Bandwidth</span>
                <span className="text-emerald-400 font-extrabold">{memoryBandwidthGBps} GB/s</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono text-sm tracking-wider flex justify-between items-center">
                <span>Bandwidth</span>
                <span>{bandwidthAscii} &nbsp; {memoryBandwidthGBps} GB/s</span>
              </div>
            </div>

            {/* Latency Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-bold">Effective Latency</span>
                <span className="text-cyan-400 font-extrabold">{effectiveTotalLatencyNs} ns</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-cyan-400 font-mono text-sm tracking-wider flex justify-between items-center">
                <span>Latency</span>
                <span>{latencyAscii} &nbsp; {effectiveTotalLatencyNs} ns</span>
              </div>
            </div>
          </div>

          {/* Detailed Metric Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 block">First-Word Latency</span>
              <span className="text-sm font-bold text-white">{firstWordLatencyNs} ns</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 block">1% Low Frame Stability</span>
              <span className="text-sm font-bold text-emerald-400">{fpsStabilityScore}/100</span>
            </div>
          </div>

          {/* Rationale & Advice Card */}
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-zinc-300 space-y-1.5">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Architectural Insight</span>
            </span>
            <p className="leading-relaxed text-zinc-400">
              {effectiveTotalLatencyNs <= 10.0
                ? '⭐ Excellent sub-10ns latency profile! Delivers silky-smooth 1% low FPS in eSports titles.'
                : 'Higher latency profile. Consider tightening CAS latency or running Gear 1 to reduce memory access delay.'}
            </p>
          </div>
        </div>
      </div>

      {/* CAPACITY PROGRESSION & WORKLOAD SUITABILITY MATRIX */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">
              CAPACITY MATRIX
            </span>
            <h2 className="text-xl font-extrabold text-white">
              16GB &rarr; 32GB &rarr; 64GB &rarr; 128GB Workload Suitability
            </h2>
          </div>
        </div>

        {/* Capacity Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CAPACITY_SUITABILITY.map((cap) => {
            const isActive = selectedCapacityGb === cap.capacityGb;
            return (
              <button
                key={cap.capacityGb}
                onClick={() => setSelectedCapacityGb(cap.capacityGb)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                  isActive
                    ? 'bg-zinc-950 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                    : 'bg-zinc-950/60 hover:bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white">{cap.capacityGb}GB</span>
                  <span className="text-[10px] text-cyan-400 font-bold">{formatINR(cap.priceINR)}</span>
                </div>
                <span className="text-xs text-zinc-400 block">{cap.dimmConfig}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Capacity Workload Inspector */}
        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <span className="text-sm font-extrabold text-white">{currentCapacityObj.label}</span>
            <span className="text-xs text-cyan-400 font-bold">
              Recommended: {currentCapacityObj.recommendedFor}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentCapacityObj.suitabilityBullets.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{item.workload}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.suitability === 'Ideal'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : item.suitability === 'Sufficient'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : item.suitability === 'Overkill'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {item.suitability}
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">{item.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
