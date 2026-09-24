import React, { useState, useMemo } from 'react';
import { CPUItem, GPUItem } from '../types';
import { calculateOperatingCost, formatINR } from '../utils/formatters';
import { INDIAN_UPS_PRESETS, calculateUpsRuntime, UpsPreset } from '../utils/upsCalculator';
import {
  Zap,
  Flame,
  IndianRupee,
  Leaf,
  Clock,
  MapPin,
  Cpu,
  Monitor,
  Calculator,
  Building,
  ThermometerSnowflake,
  BatteryCharging,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Power
} from 'lucide-react';

interface RunningCostLabProps {
  cpus: CPUItem[];
  gpus: GPUItem[];
  defaultCpuId?: string;
  defaultGpuId?: string;
}

const INDIAN_TARIFF_PRESETS: { state: string; rate: number }[] = [
  { state: 'Maharashtra (MSEDCL)', rate: 9.2 },
  { state: 'Karnataka (BESCOM)', rate: 8.5 },
  { state: 'West Bengal (CESC)', rate: 8.2 },
  { state: 'Uttar Pradesh (UPPCL)', rate: 7.8 },
  { state: 'Tamil Nadu (TANGEDCO)', rate: 7.5 },
  { state: 'Delhi (BSES)', rate: 6.8 },
  { state: 'National Average Baseline', rate: 8.0 }
];

export const RunningCostLab: React.FC<RunningCostLabProps> = ({
  cpus,
  gpus,
  defaultCpuId = 'cpu-amd-7800x3d',
  defaultGpuId = 'gpu-nvidia-4070-super'
}) => {
  const [cpuId, setCpuId] = useState<string>(defaultCpuId);
  const [gpuId, setGpuId] = useState<string>(defaultGpuId);
  const [dailyHours, setDailyHours] = useState<number>(4);
  const [tariffRate, setTariffRate] = useState<number>(8.0);
  const [selectedUpsId, setSelectedUpsId] = useState<string>('ups-1100va');

  const selectedCpu = useMemo(() => cpus.find(c => c.id === cpuId) || cpus[0], [cpus, cpuId]);
  const selectedGpu = useMemo(() => gpus.find(g => g.id === gpuId) || gpus[0], [gpus, gpuId]);

  const powerMetrics = useMemo(() => {
    return calculateOperatingCost(
      selectedCpu.TDP_Watts,
      selectedGpu.TGP_Watts,
      dailyHours,
      tariffRate
    );
  }, [selectedCpu, selectedGpu, dailyHours, tariffRate]);

  // Hardware upfront cost
  const upfrontCost = selectedCpu.Price_INR + selectedGpu.Price_INR;
  // 3-Year TCO = Upfront + (3 * Annual Electricity)
  const threeYearTCO = upfrontCost + powerMetrics.annualCostINR * 3;

  // Total gaming system wattage (CPU + GPU + Mobo/RAM/SSD ~80W)
  const totalSystemWatts = selectedCpu.TDP_Watts + selectedGpu.TGP_Watts + 80;

  const currentUpsPreset = useMemo(() => {
    return INDIAN_UPS_PRESETS.find(u => u.id === selectedUpsId) || INDIAN_UPS_PRESETS[1];
  }, [selectedUpsId]);

  const upsRuntime = useMemo(() => {
    return calculateUpsRuntime(totalSystemWatts, currentUpsPreset);
  }, [totalSystemWatts, currentUpsPreset]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Power & Thermal Operational Economics
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Electricity Running Cost & Thermal Lab (INR)
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Compute ongoing utility electricity bills, thermal heat expulsion into your gaming room, and 3-Year Total Cost of Ownership (TCO) across Indian state tariffs.
          </p>
        </div>
      </div>

      {/* Configuration Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* CPU Selector */}
        <div className="md:col-span-4 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
          <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Processor (CPU)
            </span>
            <span className="text-cyan-400 font-bold">{selectedCpu.TDP_Watts}W TDP</span>
          </label>
          <select
            value={cpuId}
            onChange={(e) => setCpuId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            {cpus.map(c => (
              <option key={c.id} value={c.id}>
                {c.Model} ({c.TDP_Watts}W)
              </option>
            ))}
          </select>
        </div>

        {/* GPU Selector */}
        <div className="md:col-span-4 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
          <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-purple-400" /> Graphics Card (GPU)
            </span>
            <span className="text-purple-400 font-bold">{selectedGpu.TGP_Watts}W TGP</span>
          </label>
          <select
            value={gpuId}
            onChange={(e) => setGpuId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
          >
            {gpus.map(g => (
              <option key={g.id} value={g.id}>
                {g.Model} ({g.TGP_Watts}W)
              </option>
            ))}
          </select>
        </div>

        {/* Daily Usage Slider */}
        <div className="md:col-span-4 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Daily Gaming / Load
            </span>
            <span className="text-amber-400 font-bold">{dailyHours} Hours / Day</span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
            className="w-full mt-2"
          />
        </div>
      </div>

      {/* Electricity Tariff Presets Strip */}
      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> State Power Tariff Rate (₹ per kWh / Unit):
          </span>
          <span className="text-emerald-400 font-bold">₹{tariffRate.toFixed(1)} / Unit</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
          {INDIAN_TARIFF_PRESETS.map(preset => (
            <button
              key={preset.state}
              onClick={() => setTariffRate(preset.rate)}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                tariffRate === preset.rate
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {preset.state} (₹{preset.rate})
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Running Bill */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border-2 border-emerald-500/40 backdrop-blur-xl shadow-glow-emerald space-y-2">
          <span className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span>Monthly Power Cost</span>
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <div className="text-3xl font-black font-mono text-emerald-400">
            {formatINR(powerMetrics.monthlyCostINR)}
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">
            ~{powerMetrics.monthlyKWh} Units (kWh) / Month
          </p>
        </div>

        {/* Annual Running Bill */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl space-y-2">
          <span className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span>Annual Power Cost</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </span>
          <div className="text-3xl font-black font-mono text-white">
            {formatINR(powerMetrics.annualCostINR)}
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">
            ~{powerMetrics.annualKWh} Units (kWh) / Year
          </p>
        </div>

        {/* Room Heat Dissipation */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl space-y-2">
          <span className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span>Thermal Heat Output</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </span>
          <div className="text-3xl font-black font-mono text-rose-400">
            {powerMetrics.heatBtuPerHour} <span className="text-sm font-normal text-zinc-400">BTU/hr</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">
            Peak thermal dissipation into room
          </p>
        </div>

        {/* 3-Year Total Cost of Ownership */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl space-y-2">
          <span className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span>3-Year Hardware + TCO</span>
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
          </span>
          <div className="text-3xl font-black font-mono text-cyan-400">
            {formatINR(threeYearTCO)}
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">
            Purchase + 3 yrs electricity
          </p>
        </div>
      </div>

      {/* Environmental & AC Room Load Note */}
      <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ThermometerSnowflake className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>AC Cooling Load:</strong> At {powerMetrics.heatBtuPerHour} BTU/hr, this PC requires approximately <strong>{(powerMetrics.heatBtuPerHour / 12000).toFixed(2)} Tons</strong> of air conditioning capacity to neutralize room warming in warm Indian summers.
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-emerald-400 whitespace-nowrap">
          <Leaf className="w-3.5 h-3.5" />
          <span>{powerMetrics.carbonKgPerYear} kg CO₂ / yr</span>
        </div>
      </div>

      {/* Indian Inverter & UPS Backup Runtime Calculator */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                Indian Power Grid & Load-Shedding Resilience
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              Inverter & UPS Backup Runtime Calculator
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Calculate battery autonomy duration and detect catastrophic instantaneous overload trip risks during unexpected power cuts across Indian cities.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
            <Power className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400">Rig Load:</span>
            <span className="text-white font-bold">{upsRuntime.gamingLoadWatts}W</span>
            <span className="text-zinc-500">(with display)</span>
          </div>
        </div>

        {/* UPS Preset Selector Chips */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-zinc-400 block">
            Select Household Inverter or UPS Capacity:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {INDIAN_UPS_PRESETS.map((preset) => {
              const isSelected = selectedUpsId === preset.id;
              const isOverloaded = upsRuntime.gamingLoadWatts > preset.maxWatts;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedUpsId(preset.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-glow-amber text-white'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold font-mono text-white">
                      {preset.va} VA / {preset.maxWatts}W
                    </span>
                    {isOverloaded && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Overload!
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate mb-1">
                    {preset.name.split('(')[1]?.replace(')', '') || preset.name}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    Est. {formatINR(preset.typicalCostINR)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Warning Banner if Overloaded */}
        {upsRuntime.isGamingOverloaded ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-300 font-mono">
                CRITICAL INVERTER OVERLOAD TRIP HAZARD
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {upsRuntime.adviceMessage} Minimum recommended capacity for this rig is{' '}
                <strong className="text-rose-300">{upsRuntime.minimumRecommendedVA} VA</strong> or higher.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-emerald-300 font-mono">
                {upsRuntime.verdict === 'SAFE_RUN' ? 'Adequate Power Inverter Headroom' : 'Limited Emergency Shutdown Window'}
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {upsRuntime.adviceMessage}
              </p>
            </div>
          </div>
        )}

        {/* Runtime Metrics Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gaming Load Runtime */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Full Gaming Outage Runtime</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="text-2xl font-black font-mono text-amber-400">
              {upsRuntime.isGamingOverloaded ? (
                <span className="text-rose-400 text-lg">0 mins (Instant Trip)</span>
              ) : (
                <>
                  {upsRuntime.gamingRuntimeMinutes >= 60 ? (
                    <>
                      {Math.floor(upsRuntime.gamingRuntimeMinutes / 60)}h{' '}
                      {upsRuntime.gamingRuntimeMinutes % 60}m
                    </>
                  ) : (
                    <>{upsRuntime.gamingRuntimeMinutes} Minutes</>
                  )}
                </>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              At ~{upsRuntime.gamingLoadWatts}W peak gaming load + 144Hz monitor
            </p>
          </div>

          {/* Idle / Desktop Runtime */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Idle / Desktop / Office Runtime</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {upsRuntime.idleRuntimeMinutes >= 60 ? (
                <>
                  {Math.floor(upsRuntime.idleRuntimeMinutes / 60)}h{' '}
                  {upsRuntime.idleRuntimeMinutes % 60}m
                </>
              ) : (
                <>{upsRuntime.idleRuntimeMinutes} Minutes</>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              At ~{upsRuntime.idleLoadWatts}W web browsing, coding & video playback
            </p>
          </div>

          {/* Battery Bank Specs */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Battery Chemistry & Capacity</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </span>
            <div className="text-sm font-bold font-mono text-white">
              {currentUpsPreset.batteryWh} Watt-Hours
            </div>
            <p className="text-[11px] text-zinc-400">
              {currentUpsPreset.batteryType}
            </p>
            <div className="pt-1 text-[10px] text-zinc-500 truncate">
              Popular: {currentUpsPreset.recommendedBrands[0]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
