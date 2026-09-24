import React, { useState, useMemo } from 'react';
import { CPUItem, GPUItem } from '../types';
import { formatINR } from '../utils/formatters';
import {
  Zap,
  Battery,
  BatteryCharging,
  Clock,
  Gauge,
  Flame,
  ShieldAlert,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
  Check,
  Copy,
  Laptop,
  Tv,
  Power,
  RotateCcw
} from 'lucide-react';

interface TDPBatteryEstimatorProps {
  cpu: CPUItem;
  gpu: GPUItem;
}

export type WorkloadState = 'idle' | 'balanced_gaming' | 'max_gaming' | 'heavy_rendering';
export type PowerProfile = 'eco' | 'stock' | 'overclocked';

interface BatteryPreset {
  id: string;
  name: string;
  capacityWh: number;
  type: 'laptop' | 'ups' | 'powerstation';
  description: string;
}

const BATTERY_PRESETS: BatteryPreset[] = [
  {
    id: 'laptop-80',
    name: '80 Wh Gaming Laptop Battery',
    capacityWh: 80,
    type: 'laptop',
    description: 'Standard high-capacity lithium battery for portable gaming rigs'
  },
  {
    id: 'laptop-99',
    name: '99.9 Wh Flight-Max Laptop Battery',
    capacityWh: 99.9,
    type: 'laptop',
    description: 'Maximum legal FAA/ICAO battery limit for airline carry-on'
  },
  {
    id: 'ups-600va',
    name: '600 VA / 360 W Desktop Home UPS',
    capacityWh: 86, // typical 12V 7.2Ah lead-acid battery
    type: 'ups',
    description: 'Entry-level home UPS (APC / Microtek / Luminous 12V 7Ah)'
  },
  {
    id: 'ups-1100va',
    name: '1100 VA / 660 W Dual-Battery UPS',
    capacityWh: 216, // dual 12V 9Ah lead-acid battery
    type: 'ups',
    description: 'Mainstream dual-battery line-interactive UPS for gaming PCs'
  },
  {
    id: 'ups-1500va',
    name: '1500 VA / 900 W Pro Sine-Wave UPS',
    capacityWh: 300, // dual 12V 12Ah high-rate battery
    type: 'ups',
    description: 'Enthusiast pure sine-wave UPS for high-draw RTX/Radeon rigs'
  },
  {
    id: 'station-1000',
    name: '1024 Wh LiFePO4 Portable Power Station',
    capacityWh: 1024,
    type: 'powerstation',
    description: 'Heavy duty portable solar/battery generator (EcoFlow / Bluetti)'
  }
];

export const TDPBatteryEstimator: React.FC<TDPBatteryEstimatorProps> = ({ cpu, gpu }) => {
  const [workload, setWorkload] = useState<WorkloadState>('max_gaming');
  const [powerProfile, setPowerProfile] = useState<PowerProfile>('stock');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ups-1100va');
  const [customWh, setCustomWh] = useState<number>(216);
  const [isCustomBattery, setIsCustomBattery] = useState<boolean>(false);
  const [electricityTariff, setElectricityTariff] = useState<number>(8.5); // ₹8.5 per kWh
  const [dailyHours, setDailyHours] = useState<number>(5);
  const [copied, setCopied] = useState<boolean>(false);

  // Active battery capacity
  const activeCapacityWh = useMemo(() => {
    if (isCustomBattery) return customWh;
    const preset = BATTERY_PRESETS.find(p => p.id === selectedPresetId);
    return preset ? preset.capacityWh : 216;
  }, [isCustomBattery, customWh, selectedPresetId]);

  // Profile multiplier
  const profileMultiplier = useMemo(() => {
    if (powerProfile === 'eco') return 0.75;
    if (powerProfile === 'overclocked') return 1.18;
    return 1.0;
  }, [powerProfile]);

  // Workload power consumption calculation
  const powerMetrics = useMemo(() => {
    let cpuPct = 0.85;
    let gpuPct = 1.0;
    let systemBaseW = 75; // Motherboard, RAM, NVMe, Fans, RGB, Pump

    if (workload === 'idle') {
      cpuPct = 0.12;
      gpuPct = 0.08;
      systemBaseW = 30;
    } else if (workload === 'balanced_gaming') {
      cpuPct = 0.60;
      gpuPct = 0.82;
      systemBaseW = 60;
    } else if (workload === 'max_gaming') {
      cpuPct = 0.85;
      gpuPct = 1.0;
      systemBaseW = 75;
    } else if (workload === 'heavy_rendering') {
      cpuPct = 1.0;
      gpuPct = 0.95;
      systemBaseW = 90;
    }

    const cpuDrawW = Math.round(cpu.TDP_Watts * cpuPct * profileMultiplier);
    const gpuDrawW = Math.round(gpu.TGP_Watts * gpuPct * profileMultiplier);
    const totalWallWatts = cpuDrawW + gpuDrawW + systemBaseW;

    // Peak transient load spike (up to 30% GPU/CPU transient power excursion)
    const peakTransientWatts = Math.round(totalWallWatts * 1.30);

    // Recommended PSU capacity (leaving ~30% headroom for high efficiency band)
    const recommendedPsuW = Math.ceil((totalWallWatts * 1.35) / 50) * 50;

    // Battery runtime calculation:
    // Effective usable energy = Capacity * 0.85 efficiency (inverter/DC converter losses)
    const usableCapacityWh = activeCapacityWh * 0.85;
    const runtimeHoursDecimal = totalWallWatts > 0 ? usableCapacityWh / totalWallWatts : 0;
    const runtimeTotalMinutes = Math.floor(runtimeHoursDecimal * 60);
    const runtimeHours = Math.floor(runtimeTotalMinutes / 60);
    const runtimeMinutes = runtimeTotalMinutes % 60;

    // Battery drain rate per hour
    const hourlyDrainPct = Math.min(100, Math.round((totalWallWatts / Math.max(1, activeCapacityWh)) * 100));

    // Electricity costs (INR ₹)
    const dailyKwh = (totalWallWatts * dailyHours) / 1000;
    const dailyCostINR = dailyKwh * electricityTariff;
    const monthlyCostINR = dailyCostINR * 30;
    const yearlyCostINR = monthlyCostINR * 12;

    return {
      cpuDrawW,
      gpuDrawW,
      systemBaseW,
      totalWallWatts,
      peakTransientWatts,
      recommendedPsuW,
      runtimeHours,
      runtimeMinutes,
      runtimeTotalMinutes,
      hourlyDrainPct,
      dailyKwh,
      dailyCostINR,
      monthlyCostINR,
      yearlyCostINR
    };
  }, [cpu, gpu, workload, profileMultiplier, activeCapacityWh, dailyHours, electricityTariff]);

  const activePreset = BATTERY_PRESETS.find(p => p.id === selectedPresetId);

  const handleCopyReport = () => {
    const reportText = [
      `== TDP & Battery Drain Estimator Report ==`,
      `CPU: ${cpu.Model} (TDP: ${cpu.TDP_Watts}W)`,
      `GPU: ${gpu.Model} (TGP: ${gpu.TGP_Watts}W)`,
      `Workload Profile: ${workload.replace('_', ' ').toUpperCase()} (${powerProfile.toUpperCase()} Mode)`,
      `-----------------------------------------`,
      `Real-time Total Power Draw: ~${powerMetrics.totalWallWatts} Watts`,
      `  - CPU Draw: ~${powerMetrics.cpuDrawW} W`,
      `  - GPU Draw: ~${powerMetrics.gpuDrawW} W`,
      `  - System Base Overhead: ~${powerMetrics.systemBaseW} W`,
      `Peak Transient Spike: ~${powerMetrics.peakTransientWatts} W`,
      `Recommended PSU: ${powerMetrics.recommendedPsuW}W Gold+`,
      `-----------------------------------------`,
      `Battery / UPS Source: ${isCustomBattery ? `Custom ${customWh}Wh` : activePreset?.name}`,
      `Capacity: ${activeCapacityWh} Wh`,
      `Estimated Battery Runtime: ${powerMetrics.runtimeHours}h ${powerMetrics.runtimeMinutes}m`,
      `Hourly Battery Drain: ${powerMetrics.hourlyDrainPct}% / hour`,
      `-----------------------------------------`,
      `Electricity Cost (@ ₹${electricityTariff}/kWh, ${dailyHours} hrs/day):`,
      `  - Daily: ${formatINR(powerMetrics.dailyCostINR)} (${powerMetrics.dailyKwh.toFixed(2)} kWh)`,
      `  - Monthly: ${formatINR(powerMetrics.monthlyCostINR)}`,
      `  - Yearly: ${formatINR(powerMetrics.yearlyCostINR)}`
    ].join('\n');

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-xl space-y-6 font-mono">
      {/* Module Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Power & Energy Physics
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                TDP & BATTERY DRAIN ESTIMATOR
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Real-Time TDP & Battery Backup Runtime Estimator
            </h3>
          </div>
        </div>

        <button
          onClick={handleCopyReport}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all border border-zinc-700 cursor-pointer shadow-md"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
          <span>{copied ? 'REPORT COPIED!' : 'COPY POWER REPORT'}</span>
        </button>
      </div>

      {/* Control Panel Sliders & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Workload State Selector */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            1. Simulated Workload Stress
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setWorkload('idle')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                workload === 'idle'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="font-bold">Idle / Browsing</div>
              <div className="text-[10px] text-zinc-500">10-15% TDP Load</div>
            </button>

            <button
              onClick={() => setWorkload('balanced_gaming')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                workload === 'balanced_gaming'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="font-bold">Light Gaming</div>
              <div className="text-[10px] text-zinc-500">60-80% TDP Load</div>
            </button>

            <button
              onClick={() => setWorkload('max_gaming')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                workload === 'max_gaming'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="font-bold">Ultra 4K Gaming</div>
              <div className="text-[10px] text-zinc-500">85-100% TDP Load</div>
            </button>

            <button
              onClick={() => setWorkload('heavy_rendering')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                workload === 'heavy_rendering'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="font-bold">Full Stress Render</div>
              <div className="text-[10px] text-zinc-500">100% TDP Max Burn</div>
            </button>
          </div>

          {/* Power Tuning Profile */}
          <div className="pt-2 space-y-1.5 border-t border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Power Tuning Profile:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                onClick={() => setPowerProfile('eco')}
                className={`py-1.5 px-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                  powerProfile === 'eco'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                Eco (-25%)
              </button>
              <button
                onClick={() => setPowerProfile('stock')}
                className={`py-1.5 px-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                  powerProfile === 'stock'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                Stock (100%)
              </button>
              <button
                onClick={() => setPowerProfile('overclocked')}
                className={`py-1.5 px-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                  powerProfile === 'overclocked'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                OC (+18%)
              </button>
            </div>
          </div>
        </div>

        {/* 2. Battery / UPS Source Selection */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-emerald-400" />
              2. Battery / UPS Energy Source
            </label>
            <button
              onClick={() => setIsCustomBattery(!isCustomBattery)}
              className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              {isCustomBattery ? 'Use Presets' : 'Custom Wh'}
            </button>
          </div>

          {!isCustomBattery ? (
            <div className="space-y-2">
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-amber-500 focus:outline-none"
              >
                {BATTERY_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.capacityWh} Wh)
                  </option>
                ))}
              </select>
              {activePreset && (
                <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                  <div className="text-white font-bold">{activePreset.name}</div>
                  <div>{activePreset.description}</div>
                  <div className="text-amber-400 font-mono font-bold">
                    Capacity: {activePreset.capacityWh} Wh Usable
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Custom Battery Capacity:</span>
                <span className="text-amber-400 font-bold">{customWh} Wh</span>
              </div>
              <input
                type="range"
                min="20"
                max="1500"
                step="10"
                value={customWh}
                onChange={(e) => setCustomWh(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>20 Wh (Handheld)</span>
                <span>500 Wh</span>
                <span>1500 Wh (UPS/Station)</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Tariff & Usage Settings */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            3. Electricity Tariff & Daily Usage
          </label>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>State Electricity Rate (₹ / kWh):</span>
                <span className="text-emerald-400 font-bold">₹{electricityTariff} / unit</span>
              </div>
              <input
                type="range"
                min="4"
                max="16"
                step="0.5"
                value={electricityTariff}
                onChange={(e) => setElectricityTariff(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>₹4 (Subsidized)</span>
                <span>₹8.5 (Urban Avg)</span>
                <span>₹16 (Commercial Peak)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Daily Gaming/Render Hours:</span>
                <span className="text-cyan-400 font-bold">{dailyHours} hours/day</span>
              </div>
              <input
                type="range"
                min="1"
                max="18"
                step="1"
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>1 hr</span>
                <span>5 hrs</span>
                <span>18 hrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Live Power & Battery Metrics Display Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Watts */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            Estimated Total Power Draw
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            ~{powerMetrics.totalWallWatts} <span className="text-sm font-normal text-zinc-400">Watts</span>
          </div>
          <div className="text-[10px] text-zinc-400 flex items-center gap-1 pt-1 border-t border-zinc-800/60">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>Transient Spike: ~{powerMetrics.peakTransientWatts}W</span>
          </div>
        </div>

        {/* Battery Runtime */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Battery / UPS Backup Runtime
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {powerMetrics.runtimeHours}h {powerMetrics.runtimeMinutes}m
          </div>
          <div className="text-[10px] text-zinc-400 flex items-center gap-1 pt-1 border-t border-zinc-800/60">
            <TrendingDown className="w-3 h-3 text-amber-400" />
            <span>Drain Rate: ~{powerMetrics.hourlyDrainPct}% per hour</span>
          </div>
        </div>

        {/* Monthly Cost */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Monthly Electricity Bill
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
            {formatINR(powerMetrics.monthlyCostINR)}
          </div>
          <div className="text-[10px] text-zinc-400 flex items-center gap-1 pt-1 border-t border-zinc-800/60">
            <span>Daily: {formatINR(powerMetrics.dailyCostINR)} ({powerMetrics.dailyKwh.toFixed(2)} kWh)</span>
          </div>
        </div>

        {/* Recommended PSU */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Power className="w-3.5 h-3.5 text-amber-400" />
            Recommended PSU Capacity
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {powerMetrics.recommendedPsuW}W+ <span className="text-xs font-bold text-emerald-400">Gold</span>
          </div>
          <div className="text-[10px] text-zinc-400 flex items-center gap-1 pt-1 border-t border-zinc-800/60">
            <span>Headroom: ~35% for efficiency</span>
          </div>
        </div>
      </div>

      {/* Detailed Power Distribution Bar */}
      <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-300">Power Component Breakdown:</span>
          <span className="text-zinc-400">
            CPU ({powerMetrics.cpuDrawW}W) + GPU ({powerMetrics.gpuDrawW}W) + System ({powerMetrics.systemBaseW}W) = ~{powerMetrics.totalWallWatts}W
          </span>
        </div>

        {/* Stacked Bar */}
        <div className="w-full h-4 rounded-full bg-zinc-900 overflow-hidden flex p-0.5 border border-zinc-800">
          <div
            className="h-full bg-cyan-500 rounded-l-full transition-all duration-300"
            style={{ width: `${Math.max(5, (powerMetrics.cpuDrawW / powerMetrics.totalWallWatts) * 100)}%` }}
            title={`CPU: ${powerMetrics.cpuDrawW}W`}
          />
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${Math.max(5, (powerMetrics.gpuDrawW / powerMetrics.totalWallWatts) * 100)}%` }}
            title={`GPU: ${powerMetrics.gpuDrawW}W`}
          />
          <div
            className="h-full bg-amber-500 rounded-r-full transition-all duration-300"
            style={{ width: `${Math.max(5, (powerMetrics.systemBaseW / powerMetrics.totalWallWatts) * 100)}%` }}
            title={`System Overhead: ${powerMetrics.systemBaseW}W`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>CPU: {cpu.Model} ({cpu.TDP_Watts}W TDP)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>GPU: {gpu.Model} ({gpu.TGP_Watts}W TGP)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Motherboard, RAM, NVMe & Fans</span>
          </div>
        </div>
      </div>
    </div>
  );
};
