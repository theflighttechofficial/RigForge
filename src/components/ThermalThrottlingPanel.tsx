import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CPUItem, GPUItem } from '../types';
import { formatScore } from '../utils/formatters';
import {
  Thermometer,
  Flame,
  Wind,
  Cpu,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Gauge,
  Volume2,
  TrendingDown,
  Clock,
  ShieldAlert,
  Info,
  Layers,
  Zap,
  RotateCcw
} from 'lucide-react';

export type CoolerType = 'stock' | 'dual_tower' | 'aio_240' | 'aio_360';
export type CaseAirflowType = 'choked' | 'balanced' | 'mesh';

interface ThermalThrottlingPanelProps {
  cpu: CPUItem;
  gpu: GPUItem;
}

interface ThermalSimulation {
  componentName: string;
  category: 'CPU' | 'GPU';
  nominalScore: number;
  throttledScore: number;
  scoreLoss: number;
  retentionPercent: number;
  lossPercent: number;
  packageTempC: number;
  tjMaxC: number;
  ambientC: number;
  internalCaseTempC: number;
  coolerLabel: string;
  throttlingState: 'SAFE' | 'MILD_TRIM' | 'MODERATE_THROTTLE' | 'CRITICAL_CLAMP';
  stateLabel: string;
  stateColor: string;
  boostClockEstimate: string;
  throttledClockEstimate: string;
  gamingFpsEstimate: { baseline: number; throttled: number };
  renderTimeEstimate: { baseline: string; throttled: string };
  acousticDba: number;
  curveData: { ambient: number; score: number; temp: number; isThrottling: boolean }[];
}

const COOLER_SPECS: Record<CoolerType, { label: string; desc: string; thermalResistance: number; acousticBase: number }> = {
  stock: {
    label: 'Stock / Budget Cooler',
    desc: 'Basic aluminum fin heatsink (high thermal resistance)',
    thermalResistance: 0.36,
    acousticBase: 44
  },
  dual_tower: {
    label: 'Dual-Tower Air Cooler',
    desc: 'High-density twin-heatsink + 6-7 heatpipes (e.g., Peerless Assassin / AK620)',
    thermalResistance: 0.22,
    acousticBase: 36
  },
  aio_240: {
    label: '240mm Liquid AIO',
    desc: 'Dual 120mm radiator with liquid pump loop',
    thermalResistance: 0.17,
    acousticBase: 34
  },
  aio_360: {
    label: '360mm High-Performance AIO',
    desc: 'Triple 120mm radiator or custom water loop (maximum thermal headroom)',
    thermalResistance: 0.12,
    acousticBase: 31
  }
};

const CASE_AIRFLOW_SPECS: Record<CaseAirflowType, { label: string; deltaC: number; desc: string }> = {
  choked: {
    label: 'Choked Solid Glass Panel',
    deltaC: 6.5,
    desc: 'Restricted intake slits, heat pools inside chassis'
  },
  balanced: {
    label: 'Balanced Airflow Case',
    deltaC: 3.0,
    desc: 'Standard intake + exhaust fan configuration'
  },
  mesh: {
    label: 'High-Flow Front Mesh Case',
    deltaC: 0.8,
    desc: 'Unrestricted cold air ingress across components'
  }
};

const AMBIENT_PRESETS = [
  { temp: 21, label: 'AC Studio', desc: 'Climate Controlled (21°C / 70°F)', icon: '❄️' },
  { temp: 27, label: 'Normal Room', desc: 'Indoors with Fan (27°C / 81°F)', icon: '🍃' },
  { temp: 35, label: 'Indian Summer', desc: 'Standard Summer Day (35°C / 95°F)', icon: '☀️' },
  { temp: 42, label: 'Heatwave Peak', desc: 'Delhi/Rajasthan Heatwave (42°C / 108°F)', icon: '🔥' },
  { temp: 48, label: 'Attic Crucible', desc: 'Top-Floor Tin Roof (48°C / 118°F)', icon: '🏜️' }
];

export const ThermalThrottlingPanel: React.FC<ThermalThrottlingPanelProps> = ({ cpu, gpu }) => {
  const [targetComponent, setTargetComponent] = useState<'CPU' | 'GPU'>('CPU');
  const [ambientTemp, setAmbientTemp] = useState<number>(35); // Default to Indian summer condition
  const [cooler, setCooler] = useState<CoolerType>('dual_tower');
  const [caseAirflow, setCaseAirflow] = useState<CaseAirflowType>('balanced');

  // Simulation physics engine
  const simulation: ThermalSimulation = useMemo(() => {
    const isCpu = targetComponent === 'CPU';
    const componentName = isCpu ? cpu.Model : gpu.Model;
    const nominalScore = isCpu ? cpu.Benchmark_Score : gpu.Benchmark_Score;

    // Power in watts
    // High-end CPUs draw up to 1.35x TDP under continuous all-core synthetic load
    const baseWatts = isCpu ? cpu.TDP_Watts : gpu.TGP_Watts;
    const powerWatts = isCpu
      ? (cpu.TDP_Watts > 105 ? cpu.TDP_Watts * 1.3 : cpu.TDP_Watts * 1.15)
      : gpu.TGP_Watts;

    // TjMax specifications
    // AMD X3D / Ryzen ~89-95°C; Intel 100°C; GPU Hotspot 88-95°C (Core 83°C)
    let tjMaxC = 95;
    if (isCpu) {
      if (cpu.Brand === 'Intel') {
        tjMaxC = 100;
      } else {
        tjMaxC = cpu.Model.includes('X3D') ? 89 : 95;
      }
    } else {
      tjMaxC = 83; // GPU core throttle ceiling
    }

    const coolerSpec = COOLER_SPECS[cooler];
    const caseSpec = CASE_AIRFLOW_SPECS[caseAirflow];

    const internalCaseTempC = ambientTemp + caseSpec.deltaC;

    // Theoretical unthrottled load junction temperature
    const unthrottledTemp = internalCaseTempC + (powerWatts * coolerSpec.thermalResistance);

    // Throttling threshold onset: chips start shedding top-bin boost clocks around 75°C (CPU) or 70°C (GPU)
    const throttleOnset = isCpu ? 75 : 70;

    let throttlingState: ThermalSimulation['throttlingState'] = 'SAFE';
    let performanceFactor = 1.0;
    let packageTempC = Math.round(unthrottledTemp);

    if (unthrottledTemp <= throttleOnset) {
      throttlingState = 'SAFE';
      performanceFactor = 1.0;
      packageTempC = Math.round(unthrottledTemp);
    } else if (unthrottledTemp <= tjMaxC) {
      // Mild boost rollback: shedding 1-2 boost bins
      throttlingState = 'MILD_TRIM';
      const range = tjMaxC - throttleOnset;
      const progress = (unthrottledTemp - throttleOnset) / range;
      // Loses between 1.5% to 6.5% of max boost potential
      performanceFactor = 1.0 - (progress * 0.065);
      packageTempC = Math.round(unthrottledTemp);
    } else {
      // Temperature exceeded TjMax -> chip clamps frequency & voltage to protect itself
      const excess = unthrottledTemp - tjMaxC;
      packageTempC = tjMaxC; // Capped at TjMax by hardware thermal trip

      if (excess < 12) {
        throttlingState = 'MODERATE_THROTTLE';
        // Power scaling: chip reduces power draw to stay within TjMax
        // P_retained = (TjMax - internalCaseTemp) / thermalResistance
        const allowablePower = Math.max(powerWatts * 0.5, (tjMaxC - internalCaseTempC) / coolerSpec.thermalResistance);
        const powerRatio = Math.max(0.4, Math.min(1.0, allowablePower / powerWatts));
        // Performance scales roughly to power^0.65
        performanceFactor = Math.max(0.65, Math.pow(powerRatio, 0.65));
      } else {
        throttlingState = 'CRITICAL_CLAMP';
        const allowablePower = Math.max(powerWatts * 0.35, (tjMaxC - internalCaseTempC) / coolerSpec.thermalResistance);
        const powerRatio = Math.max(0.3, Math.min(1.0, allowablePower / powerWatts));
        performanceFactor = Math.max(0.52, Math.pow(powerRatio, 0.7));
      }
    }

    const throttledScore = Math.round(nominalScore * performanceFactor);
    const scoreLoss = nominalScore - throttledScore;
    const retentionPercent = Number((performanceFactor * 100).toFixed(1));
    const lossPercent = Number(((1 - performanceFactor) * 100).toFixed(1));

    // Status metadata
    let stateLabel = 'Optimal Thermal State';
    let stateColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';

    if (throttlingState === 'MILD_TRIM') {
      stateLabel = 'Mild Boost Rollback (TVB / PB2 Backoff)';
      stateColor = 'text-amber-300 border-amber-500/40 bg-amber-950/40';
    } else if (throttlingState === 'MODERATE_THROTTLE') {
      stateLabel = 'Active Thermal Throttling (Frequency Cut)';
      stateColor = 'text-orange-400 border-orange-500/50 bg-orange-950/50';
    } else if (throttlingState === 'CRITICAL_CLAMP') {
      stateLabel = 'Critical TjMax Thermal Clamping';
      stateColor = 'text-rose-400 border-rose-500/60 bg-rose-950/60';
    }

    // Clock frequency estimates
    let boostClockEstimate = '5.0 GHz';
    let throttledClockEstimate = '5.0 GHz';
    if (isCpu && cpu.Base_Boost_GHz) {
      const parts = cpu.Base_Boost_GHz.split('/');
      const boostVal = parseFloat(parts[1] || parts[0]) || 5.0;
      const baseVal = parseFloat(parts[0]) || 3.5;
      boostClockEstimate = `${boostVal.toFixed(2)} GHz`;
      const scaledClock = Math.max(baseVal * 0.85, baseVal + (boostVal - baseVal) * performanceFactor);
      throttledClockEstimate = `${scaledClock.toFixed(2)} GHz`;
    } else {
      boostClockEstimate = '2.55 GHz Boost';
      throttledClockEstimate = `${(2.55 * performanceFactor).toFixed(2)} GHz`;
    }

    // Gaming FPS estimate
    const baselineFps = Math.round((isCpu ? cpu.Gaming_Score : gpu.Gaming_Score) / 115);
    // 1% lows drop even faster under thermal throttling due to clock dips
    const throttledFps = Math.round(baselineFps * Math.pow(performanceFactor, 1.15));

    // Render Time estimate for 10-minute baseline workload
    const baselineSec = 600; // 10 minutes
    const throttledSec = Math.round(baselineSec / performanceFactor);
    const throttledMin = Math.floor(throttledSec / 60);
    const throttledRemainSec = throttledSec % 60;
    const renderTimeEstimate = {
      baseline: '10m 00s',
      throttled: `${throttledMin}m ${throttledRemainSec < 10 ? '0' : ''}${throttledRemainSec}s`
    };

    // Acoustic Fan Noise (dBA)
    // Fan curve ramps with junction temperature
    const acousticDba = Math.round(
      Math.min(58, coolerSpec.acousticBase + Math.max(0, (packageTempC - 60) * 0.45) + (throttlingState === 'CRITICAL_CLAMP' ? 4 : 0))
    );

    // Curve generation across ambient range 16°C to 50°C
    const curveData = [];
    for (let amb = 16; amb <= 50; amb += 2) {
      const caseT = amb + caseSpec.deltaC;
      const unth = caseT + (powerWatts * coolerSpec.thermalResistance);
      let pFact = 1.0;
      if (unth <= throttleOnset) {
        pFact = 1.0;
      } else if (unth <= tjMaxC) {
        const prog = (unth - throttleOnset) / (tjMaxC - throttleOnset);
        pFact = 1.0 - (prog * 0.065);
      } else {
        const allowableP = Math.max(powerWatts * 0.35, (tjMaxC - caseT) / coolerSpec.thermalResistance);
        const pRatio = Math.max(0.3, Math.min(1.0, allowableP / powerWatts));
        pFact = Math.max(0.52, Math.pow(pRatio, 0.68));
      }
      curveData.push({
        ambient: amb,
        score: Math.round(nominalScore * pFact),
        temp: Math.round(Math.min(unth, tjMaxC)),
        isThrottling: unth > throttleOnset
      });
    }

    return {
      componentName,
      category: isCpu ? 'CPU' : 'GPU',
      nominalScore,
      throttledScore,
      scoreLoss,
      retentionPercent,
      lossPercent,
      packageTempC,
      tjMaxC,
      ambientC: ambientTemp,
      internalCaseTempC: Math.round(internalCaseTempC),
      coolerLabel: coolerSpec.label,
      throttlingState,
      stateLabel,
      stateColor,
      boostClockEstimate,
      throttledClockEstimate,
      gamingFpsEstimate: { baseline: baselineFps, throttled: throttledFps },
      renderTimeEstimate,
      acousticDba,
      curveData
    };
  }, [targetComponent, ambientTemp, cooler, caseAirflow, cpu, gpu]);

  // SVG dimensions for thermal curve
  const chartW = 560;
  const chartH = 170;
  const padL = 55;
  const padR = 25;
  const padT = 20;
  const padB = 30;

  const minScore = simulation.nominalScore * 0.45;
  const maxScore = simulation.nominalScore * 1.05;

  const getX = (amb: number) => padL + ((amb - 16) / (50 - 16)) * (chartW - padL - padR);
  const getY = (score: number) => padB + (1 - (score - minScore) / (maxScore - minScore)) * (chartH - padT - padB);

  // SVG points for throttled curve
  const curvePoints = simulation.curveData
    .map(pt => `${getX(pt.ambient)},${getY(pt.score)}`)
    .join(' ');

  // Current ambient position
  const currentX = getX(ambientTemp);
  const currentY = getY(simulation.throttledScore);
  const nominalY = getY(simulation.nominalScore);

  return (
    <div
      id="thermal-throttling-panel"
      className="rounded-2xl bg-zinc-900/90 border-2 border-amber-500/40 p-5 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden"
    >
      {/* Background Ambient Heat Sheen */}
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{
          backgroundColor:
            simulation.throttlingState === 'SAFE'
              ? 'rgba(16, 185, 129, 0.08)'
              : simulation.throttlingState === 'MILD_TRIM'
              ? 'rgba(245, 158, 11, 0.12)'
              : simulation.throttlingState === 'MODERATE_THROTTLE'
              ? 'rgba(249, 115, 22, 0.16)'
              : 'rgba(244, 63, 94, 0.22)'
        }}
      />

      {/* Header & Component Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
              Ambient Climate & Thermal Throttling Physics
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-300">
              India Summer Simulation
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            High Ambient Temperature Throttling Simulator
          </h3>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Simulate realistic Indian ambient thermal environments (21°C to 48°C) and visualize how elevated case temperatures and cooler heat dissipation limits force silicon clock drops, degrading nominal <strong className="text-zinc-200">Benchmark_Score</strong> and frame stability.
          </p>
        </div>

        {/* Target Component Switcher: CPU vs GPU */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800 self-start lg:self-auto shrink-0">
          <button
            id="target-cpu-btn"
            onClick={() => setTargetComponent('CPU')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              targetComponent === 'CPU'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>CPU: {cpu.Model.split(' ')[0]} {cpu.Model.split(' ')[1]}</span>
          </button>
          <button
            id="target-gpu-btn"
            onClick={() => setTargetComponent('GPU')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              targetComponent === 'GPU'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>GPU: {gpu.Model.split(' ')[0]} {gpu.Model.split(' ')[1]}</span>
          </button>
        </div>
      </div>

      {/* Primary Simulator Control Grid: Ambient Slider + Cooler + Case Airflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Ambient Temperature Controls (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-zinc-950/80 border border-zinc-800/90 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              Ambient Room Temperature: <span className="text-white text-sm font-extrabold">{ambientTemp}°C</span>
              <span className="text-zinc-500 text-[11px] font-normal">({Math.round((ambientTemp * 9) / 5 + 32)}°F)</span>
            </label>

            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400">
              Est. Case Int. {simulation.internalCaseTempC}°C
            </span>
          </div>

          {/* Interactive Ambient Temperature Slider */}
          <div className="space-y-2">
            <div className="relative flex items-center">
              <input
                id="ambient-temp-slider"
                type="range"
                min="16"
                max="50"
                step="1"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(Number(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-600 rounded-lg appearance-none cursor-pointer focus:outline-none accent-white shadow-inner"
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>16°C (Cold Lab)</span>
              <span>28°C (Normal)</span>
              <span>38°C (Hot Summer)</span>
              <span>50°C (Furnace)</span>
            </div>
          </div>

          {/* Quick Environment Preset Buttons */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block">
              Indian Climate & Room Presets:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {AMBIENT_PRESETS.map(preset => {
                const isSelected = ambientTemp === preset.temp;
                return (
                  <button
                    key={preset.temp}
                    id={`ambient-preset-${preset.temp}`}
                    onClick={() => setAmbientTemp(preset.temp)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 border-amber-400/80 shadow-md ring-1 ring-amber-400/40 text-white'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-bold font-mono">
                      <span>{preset.icon}</span>
                      <span className={isSelected ? 'text-amber-300' : 'text-zinc-300'}>{preset.temp}°C</span>
                    </div>
                    <div className="text-[10px] font-semibold truncate mt-0.5">{preset.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Cooling Hardware & Case Airflow Selectors (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 p-4 sm:p-5 space-y-3.5">
          {/* Cooler Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-cyan-400" />
              Thermal Dissipation Cooler:
            </label>
            <select
              id="cooler-type-select"
              value={cooler}
              onChange={(e) => setCooler(e.target.value as CoolerType)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
            >
              <option value="stock">Stock / Budget Air Cooler (0.36 °C/W)</option>
              <option value="dual_tower">Dual-Tower Air Cooler (0.22 °C/W)</option>
              <option value="aio_240">240mm Liquid AIO Radiator (0.17 °C/W)</option>
              <option value="aio_360">360mm High-Performance AIO (0.12 °C/W)</option>
            </select>
            <p className="text-[11px] text-zinc-400 italic">
              {COOLER_SPECS[cooler].desc}
            </p>
          </div>

          {/* Case Airflow Selector */}
          <div className="space-y-1.5 pt-1 border-t border-zinc-800/70">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              Chassis Intake Airflow:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CASE_AIRFLOW_SPECS) as CaseAirflowType[]).map(key => {
                const spec = CASE_AIRFLOW_SPECS[key];
                const active = caseAirflow === key;
                return (
                  <button
                    key={key}
                    id={`case-airflow-${key}`}
                    onClick={() => setCaseAirflow(key)}
                    className={`px-2.5 py-1.5 rounded-lg border text-center text-xs font-mono font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-zinc-800 border-purple-500 text-purple-300 shadow-sm'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div>{spec.label.split(' ')[0]}</div>
                    <div className="text-[9px] text-zinc-500 font-normal">+{spec.deltaC}°C rise</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-400 italic">
              {CASE_AIRFLOW_SPECS[caseAirflow].desc}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Benchmark Score Impact Showcase Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nominal Benchmark Score */}
        <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-4 space-y-1.5">
          <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Nominal Benchmark Score (STC)
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {formatScore(simulation.nominalScore)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Tested at 21°C ambient standard room conditions
          </div>
        </div>

        {/* Throttled Effective Benchmark Score */}
        <div className={`rounded-xl border p-4 space-y-1.5 transition-all ${
          simulation.throttlingState === 'SAFE'
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : simulation.throttlingState === 'MILD_TRIM'
            ? 'bg-amber-950/20 border-amber-500/40'
            : simulation.throttlingState === 'MODERATE_THROTTLE'
            ? 'bg-orange-950/20 border-orange-500/50'
            : 'bg-rose-950/30 border-rose-500/60'
        }`}>
          <span className="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-1.5">
            <TrendingDown className={`w-3.5 h-3.5 ${
              simulation.throttlingState === 'SAFE' ? 'text-emerald-400' : 'text-rose-400'
            }`} />
            Throttled Score ({ambientTemp}°C Ambient)
          </span>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${
            simulation.throttlingState === 'SAFE' ? 'text-emerald-400' : 'text-amber-300'
          }`}>
            {formatScore(simulation.throttledScore)}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className={`font-bold ${simulation.lossPercent > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {simulation.lossPercent > 0 ? `-${simulation.lossPercent}% loss` : '100% capacity'}
            </span>
            <span className="text-zinc-500">&bull;</span>
            <span className="text-zinc-400">-{formatScore(simulation.scoreLoss)} pts</span>
          </div>
        </div>

        {/* Operating Die Package Temperature */}
        <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-4 space-y-1.5">
          <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            Sustained Die Junction Temp
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${
              simulation.packageTempC >= simulation.tjMaxC
                ? 'text-rose-400'
                : simulation.packageTempC > 80
                ? 'text-amber-300'
                : 'text-emerald-400'
            }`}>
              {simulation.packageTempC}°C
            </span>
            <span className="text-xs font-mono text-zinc-500">/ TjMax {simulation.tjMaxC}°C</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800 mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                simulation.packageTempC >= simulation.tjMaxC
                  ? 'bg-rose-500 shadow-glow-crimson'
                  : simulation.packageTempC > 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (simulation.packageTempC / simulation.tjMaxC) * 100)}%` }}
            />
          </div>
        </div>

        {/* Frequency & Clock Retention */}
        <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-4 space-y-1.5">
          <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Sustained Frequency Clock
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {simulation.throttledClockEstimate}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
            <span>Nominal Boost:</span>
            <span className="text-zinc-300 font-semibold">{simulation.boostClockEstimate}</span>
          </div>
        </div>
      </div>

      {/* Status Warning Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${simulation.stateColor}`}>
        {simulation.throttlingState === 'SAFE' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : simulation.throttlingState === 'MILD_TRIM' ? (
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
        )}
        <div className="space-y-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-white text-sm tracking-tight">{simulation.stateLabel}</strong>
            <span className="font-mono font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-700 text-zinc-300">
              Retained: {simulation.retentionPercent}%
            </span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {simulation.throttlingState === 'SAFE' && (
              <>
                At {ambientTemp}°C ambient with the {simulation.coolerLabel}, junction temperatures remain comfortably under thermal threshold. The silicon maintains maximum boost bins without clock throttling.
              </>
            )}
            {simulation.throttlingState === 'MILD_TRIM' && (
              <>
                At {ambientTemp}°C ambient, high internal case temps ({simulation.internalCaseTempC}°C) cause the chip to back off from Peak Turbo Boost steps down to {simulation.throttledClockEstimate}, shedding ~{simulation.scoreLoss} benchmark points ({simulation.lossPercent}% reduction).
              </>
            )}
            {simulation.throttlingState === 'MODERATE_THROTTLE' && (
              <>
                Thermal junction is hitting the {simulation.tjMaxC}°C TjMax ceiling! The onboard power management controller actively down-clocks frequency and throttles voltage to prevent silicon electromigration, reducing the benchmark score from {formatScore(simulation.nominalScore)} to {formatScore(simulation.throttledScore)}.
              </>
            )}
            {simulation.throttlingState === 'CRITICAL_CLAMP' && (
              <>
                Severe thermal limit breach! In {ambientTemp}°C Indian summer conditions, the current cooling setup cannot dissipate the continuous heat. Performance drops by {simulation.lossPercent}%, creating severe frame-time micro-stutters and drastically prolonged render exports. Upgrading to a 360mm AIO or high-airflow mesh chassis is strongly recommended.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Interactive Thermal Curve & Downstream Real-World Impact Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Ambient Temperature vs. Benchmark Score Curve Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-zinc-950/80 border border-zinc-800 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Thermal Throttling Performance Curve (16°C &rarr; 50°C Ambient)
            </h4>
            <span className="text-[10px] font-mono text-zinc-400">Score vs. Room Temp</span>
          </div>

          {/* SVG Thermal Curve Visualizer */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-44 sm:h-52 overflow-visible select-none"
            >
              {/* Grid lines */}
              <line x1={padL} y1={padT} x2={chartW - padR} y2={padT} stroke="#27272a" strokeDasharray="3 3" />
              <line x1={padL} y1={(padT + chartH - padB) / 2} x2={chartW - padR} y2={(padT + chartH - padB) / 2} stroke="#27272a" strokeDasharray="3 3" />
              <line x1={padL} y1={chartH - padB} x2={chartW - padR} y2={chartH - padB} stroke="#3f3f46" />
              <line x1={padL} y1={padT} x2={padL} y2={chartH - padB} stroke="#3f3f46" />

              {/* Y Axis Labels */}
              <text x={padL - 6} y={padT + 4} fill="#a1a1aa" fontSize="9" textAnchor="end" fontFamily="monospace">
                {formatScore(maxScore)}
              </text>
              <text x={padL - 6} y={(padT + chartH - padB) / 2 + 3} fill="#71717a" fontSize="9" textAnchor="end" fontFamily="monospace">
                {formatScore((maxScore + minScore) / 2)}
              </text>
              <text x={padL - 6} y={chartH - padB + 2} fill="#71717a" fontSize="9" textAnchor="end" fontFamily="monospace">
                {formatScore(minScore)}
              </text>

              {/* X Axis Ambient Labels */}
              {[16, 22, 28, 35, 42, 48].map(temp => (
                <text
                  key={temp}
                  x={getX(temp)}
                  y={chartH - padB + 14}
                  fill={temp === ambientTemp ? '#f59e0b' : '#71717a'}
                  fontWeight={temp === ambientTemp ? 'bold' : 'normal'}
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {temp}°C
                </text>
              ))}

              {/* Nominal Baseline Score (Dashed line) */}
              <line
                x1={padL}
                y1={nominalY}
                x2={chartW - padR}
                y2={nominalY}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <text
                x={chartW - padR - 4}
                y={nominalY - 6}
                fill="#06b6d4"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Nominal Baseline ({formatScore(simulation.nominalScore)})
              </text>

              {/* Shaded Area of Lost Performance Under Curve */}
              <polygon
                points={`${getX(16)},${getY(simulation.curveData[0].score)} ${curvePoints} ${getX(50)},${chartH - padB} ${getX(16)},${chartH - padB}`}
                fill="url(#thermalGradient)"
                opacity="0.25"
              />

              {/* Dynamic Gradient Definition */}
              <defs>
                <linearGradient id="thermalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Dynamic Throttled Benchmark Score Curve */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={curvePoints}
              />

              {/* Vertical Marker for Current Ambient Temp */}
              <line
                x1={currentX}
                y1={padT}
                x2={currentX}
                y2={chartH - padB}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Current Active Operating Point Dot */}
              <circle
                cx={currentX}
                cy={currentY}
                r="6"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Label for Current Operating Point */}
              <text
                x={Math.min(chartW - padR - 10, currentX + 8)}
                y={Math.max(padT + 12, currentY - 8)}
                fill="#fef08a"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {formatScore(simulation.throttledScore)} pts
              </text>
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-400" />
              Cyan dashed: Nominal Score (21°C Room)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-400" />
              Amber curve: Throttled score as ambient rises
            </span>
          </div>
        </div>

        {/* Right Side: Downstream Real-World Impact Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Gaming FPS Impact */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                Projected Gaming FPS
              </span>
              <span className="text-[10px] font-mono text-zinc-500">1440p High Preset</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-zinc-500 block">Baseline FPS:</span>
                <span className="text-lg font-black font-mono text-zinc-300">
                  {simulation.gamingFpsEstimate.baseline} FPS
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500 block">Throttled ({ambientTemp}°C):</span>
                <span className={`text-xl font-black font-mono ${
                  simulation.gamingFpsEstimate.throttled < simulation.gamingFpsEstimate.baseline
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}>
                  {simulation.gamingFpsEstimate.throttled} FPS
                </span>
              </div>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-800/80 flex items-center justify-between">
              <span>Frame Rate Stability:</span>
              <span className={simulation.throttlingState === 'SAFE' ? 'text-emerald-400' : 'text-rose-400'}>
                {simulation.throttlingState === 'SAFE' ? 'Fluid (No 1% Low drops)' : 'Prone to micro-stutter dips'}
              </span>
            </div>
          </div>

          {/* Render Export Time Impact */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Heavy Render / Compute Duration
              </span>
              <span className="text-[10px] font-mono text-zinc-500">10-min Standard Job</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-zinc-500 block">Baseline Render:</span>
                <span className="text-lg font-black font-mono text-zinc-300">
                  {simulation.renderTimeEstimate.baseline}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500 block">Throttled Wait Time:</span>
                <span className={`text-xl font-black font-mono ${
                  simulation.renderTimeEstimate.throttled !== simulation.renderTimeEstimate.baseline
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}>
                  {simulation.renderTimeEstimate.throttled}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-800/80 flex items-center justify-between">
              <span>Productivity Time Penalty:</span>
              <span className="text-amber-300 font-bold">
                +{Math.round((100 / (simulation.retentionPercent / 100)) - 100)}% more time
              </span>
            </div>
          </div>

          {/* Acoustic Fan Noise */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                Acoustic Profile & Fan RPM
              </span>
              <span className="text-xs font-mono font-bold text-white">
                ~{simulation.acousticDba} dBA
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 leading-relaxed">
              {simulation.acousticDba < 40 ? (
                <span>Quiet whisper acoustics. Fan RPM stays below 55% duty cycle.</span>
              ) : simulation.acousticDba < 48 ? (
                <span className="text-amber-300">Audible fan whoosh. Cooler curves ramp up to 80% to fight ambient heat.</span>
              ) : (
                <span className="text-rose-400 font-medium">Aggressive 100% maximum fan speed scream trying to avoid emergency thermal shutdown.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
