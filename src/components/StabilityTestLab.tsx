import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CPUItem, GPUItem } from '../types';
import { formatINR } from '../utils/formatters';
import { WHEA_LEXICON, WheaErrorEntry } from '../data/wheaLexicon';
import {
  Activity,
  Zap,
  Flame,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Play,
  Square,
  RefreshCw,
  Cpu,
  Monitor,
  Server,
  Clock,
  AlertOctagon,
  FileText,
  Wrench,
  Sliders,
  Radio,
  BarChart2,
  BookOpen,
  Info,
  X,
  HelpCircle
} from 'lucide-react';

interface StabilityTestLabProps {
  cpu: CPUItem;
  gpu: GPUItem;
}

export type LLCOption = 'regular' | 'balanced' | 'flat';
export type PSUTier = 'tier_a' | 'tier_c' | 'degraded';
export type CoolingCondition = 'optimal' | 'dust_choked' | 'paste_dryout' | 'pump_failure';

interface LiveTelemetryPoint {
  timeSec: number;
  voltageV: number;
  tempC: number;
  errors: number;
  powerW: number;
}

export const StabilityTestLab: React.FC<StabilityTestLabProps> = ({ cpu, gpu }) => {
  // Voltage Instability Settings
  const [voltageOffsetMv, setVoltageOffsetMv] = useState<number>(0); // -150mV to +150mV
  const [llcSetting, setLlcSetting] = useState<LLCOption>('balanced');
  const [psuTier, setPsuTier] = useState<PSUTier>('tier_a');
  const [transientSpikePercent, setTransientSpikePercent] = useState<number>(140); // 100% to 220%

  // Thermal Runaway Settings
  const [coolingCondition, setCoolingCondition] = useState<CoolingCondition>('optimal');
  const [ambientTempC, setAmbientTempC] = useState<number>(28); // 18°C to 45°C
  const [enableThermalLeakageLoop, setEnableThermalLeakageLoop] = useState<boolean>(true);

  // Live Stress Test Simulation State
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testElapsedSec, setTestElapsedSec] = useState<number>(0);
  const [telemetryHistory, setTelemetryHistory] = useState<LiveTelemetryPoint[]>([]);
  const [eventLogs, setEventLogs] = useState<{ id: string; time: string; message: string; type: 'info' | 'warn' | 'error' | 'fatal'; wheaRef?: string }[]>([]);
  const [testOutcome, setTestOutcome] = useState<'IDLE' | 'RUNNING' | 'PASSED' | 'CRASHED_WHEA' | 'CRASHED_THERMAL' | 'CRASHED_POWER'>('IDLE');

  // WHEA Error Lexicon Modal
  const [isWheaModalOpen, setIsWheaModalOpen] = useState<boolean>(false);
  const [selectedWheaId, setSelectedWheaId] = useState<string>('whea-18');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Base physics calculation for the CPU and GPU pair
  const baseTdp = cpu.TDP_Watts + gpu.TGP_Watts;
  const nominalVcore = cpu.Brand === 'Intel' ? 1.28 : 1.22; // Nominal Vcore baseline (Volts)

  // Calculate stability indicators
  const stabilityCalculation = useMemo(() => {
    // 1. Voltage Analysis
    // Vdroop in mV based on LLC
    const vdroopMv = llcSetting === 'regular' ? 65 : llcSetting === 'balanced' ? 30 : 0;
    // Transient droop based on PSU quality
    const psuDroopMv = psuTier === 'tier_a' ? 15 : psuTier === 'tier_c' ? 45 : 95;
    const rippleMv = psuTier === 'tier_a' ? 18 : psuTier === 'tier_c' ? 55 : 120;

    // Effective minimum loaded voltage
    const effectiveVcore = nominalVcore + (voltageOffsetMv / 1000) - (vdroopMv / 1000) - (psuDroopMv / 1000);
    
    // Critical minimum required Vcore under full AVX/rendering load
    const minRequiredVcore = nominalVcore - 0.045; // Below this, bitflips in L1/L2 cache occur

    const isVoltageDeficient = effectiveVcore < minRequiredVcore;
    const voltageDeficitMv = isVoltageDeficient ? Math.round((minRequiredVcore - effectiveVcore) * 1000) : 0;

    // Extreme LLC voltage overshoot risk (can cause silicon degradation)
    const hasOvershootRisk = llcSetting === 'flat' && voltageOffsetMv > 30;

    // 2. Thermal Runaway Analysis
    let coolingPenaltyC = 0;
    let thermalDissipationFactor = 1.0;

    if (coolingCondition === 'dust_choked') {
      coolingPenaltyC = 14;
      thermalDissipationFactor = 0.75;
    } else if (coolingCondition === 'paste_dryout') {
      coolingPenaltyC = 22;
      thermalDissipationFactor = 0.60;
    } else if (coolingCondition === 'pump_failure') {
      coolingPenaltyC = 55;
      thermalDissipationFactor = 0.15; // Heat cannot leave coldplate
    }

    // Ambient influence (baseline 25°C)
    const ambientDelta = ambientTempC - 25;

    // Temperature without runaway feedback
    let estimatedCoreTemp = 40 + (baseTdp * 0.16 * (1 / thermalDissipationFactor)) + coolingPenaltyC + ambientDelta;
    if (voltageOffsetMv > 0) {
      estimatedCoreTemp += (voltageOffsetMv / 10) * 1.5; // Overvolt generates quadratically more heat
    } else if (voltageOffsetMv < 0) {
      estimatedCoreTemp += (voltageOffsetMv / 10) * 0.9; // Undervolt reduces heat
    }

    // Thermal runaway positive feedback calculation:
    // When silicon temp exceeds 85°C, leakage current rises ~2% per °C, escalating power consumption
    let leakagePowerMultiplier = 1.0;
    let isRunawayEngaged = false;
    if (enableThermalLeakageLoop && estimatedCoreTemp > 85) {
      const overTemp = estimatedCoreTemp - 85;
      leakagePowerMultiplier = 1.0 + (overTemp * 0.022); // up to +40% extra leakage power
      estimatedCoreTemp += overTemp * 0.45; // thermal accumulation feedback
      if (coolingCondition === 'pump_failure' || (coolingCondition === 'paste_dryout' && ambientTempC >= 38)) {
        isRunawayEngaged = true;
        estimatedCoreTemp = Math.min(115, estimatedCoreTemp + 18);
      }
    }

    const tjMax = cpu.Brand === 'Intel' ? 100 : (cpu.Model.includes('X3D') ? 89 : 95);
    const isThermalTripRisk = estimatedCoreTemp >= tjMax;

    // 3. Error Rate Estimation
    // WHEA errors per minute
    let wheaErrorsPerMin = 0;
    if (isVoltageDeficient) {
      wheaErrorsPerMin = Math.min(240, Math.round(Math.pow(voltageDeficitMv / 10, 1.8)));
    }
    if (rippleMv > 80) {
      wheaErrorsPerMin += Math.round((rippleMv - 80) * 0.5);
    }
    if (estimatedCoreTemp > tjMax - 4) {
      wheaErrorsPerMin += Math.round((estimatedCoreTemp - (tjMax - 4)) * 3);
    }

    // GPU VRAM / DirectX error rate per hour
    let gpuErrorRatePerHour = 0;
    if (psuTier === 'degraded' && transientSpikePercent > 130) {
      gpuErrorRatePerHour += 8;
    }
    if (ambientTempC > 36 && coolingCondition !== 'optimal') {
      gpuErrorRatePerHour += 12;
    }

    // 4. System Uptime & MTBF Index
    let stabilityScore = 100;
    let mtbfHours = 2400; // Normal rock-solid uptime
    let failureMechanism = 'System Operating within Nominal Stability Tolerances';

    if (coolingCondition === 'pump_failure') {
      stabilityScore = 2;
      mtbfHours = 0.05; // 3 minutes
      failureMechanism = 'Fatal Thermal Runaway: PROCHOT / Emergency Silicon Junction Trip';
    } else if (isThermalTripRisk && isVoltageDeficient) {
      stabilityScore = 8;
      mtbfHours = 0.2; // 12 minutes
      failureMechanism = 'Compounded Instability: Thermal Clamp + Severe Vcore Starvation';
    } else if (isThermalTripRisk) {
      stabilityScore = 22;
      mtbfHours = 0.7; // 40 minutes
      failureMechanism = 'Thermal Throttling Clamp & Junction Overtemperature Trip';
    } else if (isVoltageDeficient) {
      if (voltageDeficitMv > 50) {
        stabilityScore = 14;
        mtbfHours = 0.3; // 18 minutes
        failureMechanism = 'Severe Vdroop Under Heavy FPU Load: WHEA L0 Parity BSOD';
      } else {
        stabilityScore = 48;
        mtbfHours = 3.5;
        failureMechanism = 'Moderate Voltage Undervolt Deficit: Intermittent Cache Bit-Flips';
      }
    } else if (psuTier === 'degraded' && transientSpikePercent >= 160) {
      stabilityScore = 38;
      mtbfHours = 2.1;
      failureMechanism = 'PSU 12V Rail Collapse on Transient Load Excursion';
    } else if (hasOvershootRisk) {
      stabilityScore = 65;
      mtbfHours = 48;
      failureMechanism = 'Extreme LLC Transient Voltage Spike (Silicon Wear / Degradation)';
    } else if (wheaErrorsPerMin > 0) {
      stabilityScore = 70;
      mtbfHours = 18;
      failureMechanism = 'Minor Silicon Calculation Inaccuracies & Cache Parity Corrections';
    }

    return {
      vdroopMv,
      psuDroopMv,
      rippleMv,
      effectiveVcore: Number(effectiveVcore.toFixed(3)),
      minRequiredVcore: Number(minRequiredVcore.toFixed(3)),
      isVoltageDeficient,
      voltageDeficitMv,
      hasOvershootRisk,
      estimatedCoreTemp: Math.round(estimatedCoreTemp),
      tjMax,
      isThermalTripRisk,
      isRunawayEngaged,
      leakagePowerMultiplier: Number(leakagePowerMultiplier.toFixed(2)),
      wheaErrorsPerMin,
      gpuErrorRatePerHour,
      stabilityScore,
      mtbfHours,
      failureMechanism
    };
  }, [cpu, gpu, baseTdp, nominalVcore, voltageOffsetMv, llcSetting, psuTier, transientSpikePercent, coolingCondition, ambientTempC, enableThermalLeakageLoop]);

  // Handle Preset Scenarios
  const applyScenario = (type: 'rock_solid' | 'undervolt_crash' | 'pump_failure' | 'psu_spikes' | 'heatwave') => {
    stopLiveTest();
    if (type === 'rock_solid') {
      setVoltageOffsetMv(0);
      setLlcSetting('balanced');
      setPsuTier('tier_a');
      setTransientSpikePercent(120);
      setCoolingCondition('optimal');
      setAmbientTempC(25);
      setEnableThermalLeakageLoop(true);
    } else if (type === 'undervolt_crash') {
      setVoltageOffsetMv(-95);
      setLlcSetting('regular');
      setPsuTier('tier_c');
      setTransientSpikePercent(150);
      setCoolingCondition('optimal');
      setAmbientTempC(26);
    } else if (type === 'pump_failure') {
      setVoltageOffsetMv(10);
      setLlcSetting('balanced');
      setPsuTier('tier_a');
      setTransientSpikePercent(130);
      setCoolingCondition('pump_failure');
      setAmbientTempC(32);
      setEnableThermalLeakageLoop(true);
    } else if (type === 'psu_spikes') {
      setVoltageOffsetMv(0);
      setLlcSetting('flat');
      setPsuTier('degraded');
      setTransientSpikePercent(200);
      setCoolingCondition('optimal');
      setAmbientTempC(28);
    } else if (type === 'heatwave') {
      setVoltageOffsetMv(25);
      setLlcSetting('regular');
      setPsuTier('tier_c');
      setTransientSpikePercent(160);
      setCoolingCondition('dust_choked');
      setAmbientTempC(42);
      setEnableThermalLeakageLoop(true);
    }
  };

  // Start live stress test simulation loop
  const startLiveTest = () => {
    setIsTesting(true);
    setTestElapsedSec(0);
    setTelemetryHistory([]);
    setEventLogs([
      {
        id: 'log-0',
        time: '00:00',
        message: `Stress Engine Initialized for ${cpu.Model} + ${gpu.Model}. Deploying combined AVX-512 & FurMark Raster Load...`,
        type: 'info'
      }
    ]);
    setTestOutcome('RUNNING');
  };

  const stopLiveTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTesting(false);
  };

  // Live simulation tick
  useEffect(() => {
    if (!isTesting) return;

    let second = 0;
    let currentTemp = 42 + (ambientTempC - 25);
    let cumulativeErrors = 0;

    timerRef.current = setInterval(() => {
      second += 1;
      setTestElapsedSec(second);

      // Target temperature trajectory
      const targetTemp = stabilityCalculation.estimatedCoreTemp;
      // If pump failure, temp climbs aggressively
      const stepRate = coolingCondition === 'pump_failure' ? 6.5 : 2.5;
      currentTemp = Math.min(targetTemp, currentTemp + stepRate);

      // Instantaneous voltage with dynamic jitter
      const jitter = (Math.random() - 0.5) * (stabilityCalculation.rippleMv / 1000);
      const instantVcore = stabilityCalculation.effectiveVcore + jitter;

      // Error generation logic
      let newErrorsThisSec = 0;
      if (stabilityCalculation.isVoltageDeficient) {
        newErrorsThisSec += Math.floor(Math.random() * 3) + 1;
      }
      if (currentTemp > stabilityCalculation.tjMax - 3) {
        newErrorsThisSec += Math.floor(Math.random() * 4) + 1;
      }
      if (psuTier === 'degraded' && second % 4 === 0) {
        newErrorsThisSec += 2;
      }

      cumulativeErrors += newErrorsThisSec;

      // Power calculation with leakage
      const currentPower = Math.round(baseTdp * (currentTemp > 85 ? stabilityCalculation.leakagePowerMultiplier : 1.0));

      const point: LiveTelemetryPoint = {
        timeSec: second,
        voltageV: Number(instantVcore.toFixed(3)),
        tempC: Math.round(currentTemp),
        errors: cumulativeErrors,
        powerW: currentPower
      };

      setTelemetryHistory(prev => [...prev.slice(-25), point]);

      // Dynamic log entries
      const timestamp = `00:${second < 10 ? '0' + second : second}`;

      if (second === 2) {
        setEventLogs(prev => [
          ...prev,
          {
            id: `log-${second}`,
            time: timestamp,
            message: `Telemetry Online: Vcore @ ${instantVcore.toFixed(3)}V (Vdroop -${stabilityCalculation.vdroopMv}mV), Temp: ${Math.round(currentTemp)}°C, Total Power: ${currentPower}W`,
            type: 'info'
          }
        ]);
      }

      if (stabilityCalculation.isVoltageDeficient && second === 4) {
        setEventLogs(prev => [
          ...prev,
          {
            id: `log-${second}`,
            time: timestamp,
            message: `WHEA Event 18: L1/L2 Cache Hierarchy Bit-Flip on Core #${Math.floor(Math.random() * 8)}. Vcore starvation detected!`,
            type: 'warn',
            wheaRef: 'whea-18'
          }
        ]);
      }

      if (currentTemp >= 88 && second === 6 && enableThermalLeakageLoop) {
        setEventLogs(prev => [
          ...prev,
          {
            id: `log-${second}`,
            time: timestamp,
            message: `Thermal runaway feedback engaged: Silicon leakage current boosted power draw by +${Math.round((stabilityCalculation.leakagePowerMultiplier - 1) * 100)}%!`,
            type: 'warn',
            wheaRef: 'thermtrip'
          }
        ]);
      }

      if (psuTier === 'degraded' && second === 8) {
        setEventLogs(prev => [
          ...prev,
          {
            id: `log-${second}`,
            time: timestamp,
            message: `Transient spike excursion detected: 12V rail dropped to 11.42V. GPU PCIe link CRC retry count elevated.`,
            type: 'error',
            wheaRef: 'whea-17'
          }
        ]);
      }

      // Failure triggers
      if (currentTemp >= stabilityCalculation.tjMax + 4) {
        setEventLogs(prev => [
          ...prev,
          {
            id: `log-${second}-fatal`,
            time: timestamp,
            message: `FATAL: Silicon Junction exceeded ${stabilityCalculation.tjMax + 4}°C! Hardware THERMTRIP# signal triggered emergency shutdown.`,
            type: 'fatal',
            wheaRef: 'thermtrip'
          }
        ]);
        setTestOutcome('CRASHED_THERMAL');
        stopLiveTest();
        return;
      }

      if (stabilityCalculation.voltageDeficitMv > 60 && second >= 7) {
        setEventLogs(prev => [
          ...prev,
          {
            id: `log-${second}-fatal`,
            time: timestamp,
            message: `FATAL: Kernel BugCheck 0x00000124 (WHEA_UNCORRECTABLE_ERROR). CPU instruction register parity lost.`,
            type: 'fatal',
            wheaRef: 'bugcheck-124'
          }
        ]);
        setTestOutcome('CRASHED_WHEA');
        stopLiveTest();
        return;
      }

      if (psuTier === 'degraded' && transientSpikePercent >= 180 && second >= 9) {
        setEventLogs(prev => [
          ...prev,
          {
            id: `log-${second}-fatal`,
            time: timestamp,
            message: `FATAL: PSU Under-Voltage Protection (UVP) / Over-Current Protection (OCP) trip. Hard power cut!`,
            type: 'fatal',
            wheaRef: 'whea-41'
          }
        ]);
        setTestOutcome('CRASHED_POWER');
        stopLiveTest();
        return;
      }

      // Test Completed Successfully at 15s
      if (second >= 15) {
        setEventLogs(prev => [
          ...prev,
          {
            id: `log-${second}-pass`,
            time: timestamp,
            message: `STRESS PASS: Test cycle completed with ${cumulativeErrors} corrected hardware anomalies. System remained stable.`,
            type: cumulativeErrors > 0 ? 'warn' : 'info'
          }
        ]);
        setTestOutcome('PASSED');
        stopLiveTest();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTesting, stabilityCalculation, coolingCondition, ambientTempC, baseTdp, psuTier, transientSpikePercent, enableThermalLeakageLoop]);

  // Auto-scroll event logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [eventLogs]);

  return (
    <div id="stability-test-lab" className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 space-y-8 shadow-2xl relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Scenario Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
              Mission-Critical Silicon Diagnostics
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <span>Stability Lab: Voltage Instability & Thermal Runaway</span>
          </h3>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Simulate transient Vdroop under heavy instruction dispatch, capacitor ripple, ambient heatwaves, and positive-feedback thermal runaway to model mean-time-between-failures (MTBF) and WHEA error rates for <span className="text-cyan-300 font-semibold">{cpu.Model}</span> paired with <span className="text-purple-300 font-semibold">{gpu.Model}</span>.
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Silicon Stability Index</span>
              <span className={`text-base font-mono font-black ${
                stabilityCalculation.stabilityScore > 80 ? 'text-emerald-400' :
                stabilityCalculation.stabilityScore > 50 ? 'text-amber-400' : 'text-rose-500'
              }`}>
                {stabilityCalculation.stabilityScore}% MTBF
              </span>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              stabilityCalculation.stabilityScore > 80 ? 'bg-emerald-400 shadow-glow-emerald' :
              stabilityCalculation.stabilityScore > 50 ? 'bg-amber-400 shadow-glow-amber' : 'bg-rose-500 animate-ping'
            }`} />
          </div>
        </div>
      </div>

      {/* Stress Presets Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
        <span className="text-zinc-400 whitespace-nowrap text-[11px] font-bold">Scenarios:</span>
        <button
          onClick={() => applyScenario('rock_solid')}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 text-emerald-300 font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rock-Solid Stock (Baseline)</span>
        </button>
        <button
          onClick={() => applyScenario('undervolt_crash')}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-rose-500/50 text-rose-300 font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-rose-400" />
          <span>Aggressive Undervolt (-95mV Vdroop)</span>
        </button>
        <button
          onClick={() => applyScenario('pump_failure')}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-amber-300 font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>AIO Pump Failure (Thermal Runaway)</span>
        </button>
        <button
          onClick={() => applyScenario('psu_spikes')}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/50 text-purple-300 font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-purple-400" />
          <span>Poor PSU + 200% Transient Spike</span>
        </button>
        <button
          onClick={() => applyScenario('heatwave')}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 text-cyan-300 font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
          <span>Indian Summer Heatwave (42°C Choked)</span>
        </button>
      </div>

      {/* Primary Simulator Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Voltage Instability & Power Delivery Matrix */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                1. Voltage & Load-Line Calibration
              </h4>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded-lg">
              Nominal: {nominalVcore}V
            </span>
          </div>

          {/* Voltage Offset Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300 flex items-center gap-1">
                <span>Vcore Offset (UV / OC):</span>
                <span className={`font-bold ${voltageOffsetMv < 0 ? 'text-cyan-400' : voltageOffsetMv > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {voltageOffsetMv > 0 ? `+${voltageOffsetMv}mV` : `${voltageOffsetMv}mV`}
                </span>
              </span>
              <span className="text-zinc-500 text-[10px]">
                {voltageOffsetMv < -50 ? 'High Starvation Risk' : voltageOffsetMv > 50 ? 'Excessive Heat & Degradation' : 'Stable Margin'}
              </span>
            </div>
            <input
              type="range"
              min={-120}
              max={120}
              step={5}
              value={voltageOffsetMv}
              onChange={(e) => setVoltageOffsetMv(Number(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-zinc-950 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>-120mV (Deep UV)</span>
              <span>0mV (Stock)</span>
              <span>+120mV (High Overvolt)</span>
            </div>
          </div>

          {/* Load-Line Calibration (LLC) Options */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-300 block">
              Load-Line Calibration (VRM Vdroop Resistance):
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setLlcSetting('regular')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  llcSetting === 'regular'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold">Regular (High)</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">-65mV Vdroop</div>
              </button>

              <button
                type="button"
                onClick={() => setLlcSetting('balanced')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  llcSetting === 'balanced'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold">Balanced</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">-30mV Vdroop</div>
              </button>

              <button
                type="button"
                onClick={() => setLlcSetting('flat')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  llcSetting === 'flat'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold">Flat / Extreme</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">0mV (Spike Risk)</div>
              </button>
            </div>
          </div>

          {/* PSU 12V Rail Quality & Transient Spike Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 block">
                Power Supply 12V Filtering:
              </label>
              <select
                value={psuTier}
                onChange={(e) => setPsuTier(e.target.value as PSUTier)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="tier_a">Tier A Gold (18mV Ripple / Solid 12V)</option>
                <option value="tier_c">Tier C Budget (55mV Ripple / Mild Droop)</option>
                <option value="degraded">Degraded / Low-Tier (120mV Ripple)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300">GPU Transient Spike:</span>
                <span className="text-purple-400 font-bold">{transientSpikePercent}%</span>
              </div>
              <input
                type="range"
                min={100}
                max={220}
                step={10}
                value={transientSpikePercent}
                onChange={(e) => setTransientSpikePercent(Number(e.target.value))}
                className="w-full accent-purple-400 h-2 bg-zinc-950 rounded-lg cursor-pointer"
              />
              <div className="text-[10px] font-mono text-zinc-500 text-right">
                Peak: ~{Math.round(gpu.TGP_Watts * (transientSpikePercent / 100))}W excursion
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Thermal Runaway & Ambient Physics */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                2. Thermal Runaway & Cooling Integrity
              </h4>
            </div>
            <span className="text-[11px] font-mono text-rose-400 bg-rose-950/70 border border-rose-800/60 px-2 py-0.5 rounded-lg">
              TjMax: {stabilityCalculation.tjMax}°C
            </span>
          </div>

          {/* Cooling Health Condition */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-300 block">
              Cooling Apparatus State:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setCoolingCondition('optimal')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  coolingCondition === 'optimal'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold">Optimal / Fresh</div>
                <div className="text-[10px] text-zinc-500">100% dissipation</div>
              </button>

              <button
                type="button"
                onClick={() => setCoolingCondition('dust_choked')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  coolingCondition === 'dust_choked'
                    ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold">Dust Choked / Low RPM</div>
                <div className="text-[10px] text-zinc-500">+14°C thermal soak</div>
              </button>

              <button
                type="button"
                onClick={() => setCoolingCondition('paste_dryout')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  coolingCondition === 'paste_dryout'
                    ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold">Paste Pump-Out / Dry</div>
                <div className="text-[10px] text-zinc-500">+22°C hotspot delta</div>
              </button>

              <button
                type="button"
                onClick={() => setCoolingCondition('pump_failure')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  coolingCondition === 'pump_failure'
                    ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-glow-crimson'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold flex items-center gap-1 text-rose-400">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Pump/Fan Stoppage
                </div>
                <div className="text-[10px] text-zinc-500">Zero fluid circulation</div>
              </button>
            </div>
          </div>

          {/* Ambient Room Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300">Ambient Room Temperature:</span>
              <span className={`font-bold ${ambientTempC >= 38 ? 'text-rose-400' : ambientTempC >= 30 ? 'text-amber-400' : 'text-cyan-400'}`}>
                {ambientTempC}°C ({ambientTempC >= 38 ? 'Severe Summer Heat' : ambientTempC >= 30 ? 'Warm Room' : 'AC Climate'})
              </span>
            </div>
            <input
              type="range"
              min={18}
              max={45}
              step={1}
              value={ambientTempC}
              onChange={(e) => setAmbientTempC(Number(e.target.value))}
              className="w-full accent-rose-400 h-2 bg-zinc-950 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>18°C (Cold AC)</span>
              <span>28°C (Normal)</span>
              <span>45°C (Extreme Heatwave)</span>
            </div>
          </div>

          {/* Thermal Runaway Loop Toggle */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-mono text-white font-bold block">
                Silicon Leakage Current Feedback Loop:
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Simulates +2% leakage power per °C beyond 85°C that creates runaway thermal avalanche.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEnableThermalLeakageLoop(!enableThermalLeakageLoop)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors shrink-0 cursor-pointer ${
                enableThermalLeakageLoop ? 'bg-rose-500 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {enableThermalLeakageLoop ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* Physics Diagnostic Readout Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Effective Loaded Vcore */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Loaded Vcore</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className={`text-2xl font-mono font-extrabold ${
            stabilityCalculation.isVoltageDeficient ? 'text-rose-400' : 'text-cyan-400'
          }`}>
            {stabilityCalculation.effectiveVcore}V
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {stabilityCalculation.isVoltageDeficient
              ? `-${stabilityCalculation.voltageDeficitMv}mV below safe floor`
              : `+${Math.round((stabilityCalculation.effectiveVcore - stabilityCalculation.minRequiredVcore) * 1000)}mV headroom`}
          </div>
        </div>

        {/* Junction Temperature Under Load */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Peak Junction Temp</span>
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className={`text-2xl font-mono font-extrabold ${
            stabilityCalculation.isThermalTripRisk ? 'text-rose-500' :
            stabilityCalculation.estimatedCoreTemp > 85 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {stabilityCalculation.estimatedCoreTemp}°C
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {stabilityCalculation.isThermalTripRisk
              ? 'TjMax Clamp / Thermal Trip'
              : `${stabilityCalculation.tjMax - stabilityCalculation.estimatedCoreTemp}°C to TjMax`}
          </div>
        </div>

        {/* Hardware Error Rate */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>WHEA Errors / min</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className={`text-2xl font-mono font-extrabold ${
            stabilityCalculation.wheaErrorsPerMin > 20 ? 'text-rose-500' :
            stabilityCalculation.wheaErrorsPerMin > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {stabilityCalculation.wheaErrorsPerMin} <span className="text-xs font-normal text-zinc-400">err/m</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {stabilityCalculation.wheaErrorsPerMin > 0 ? 'Cache bit-flips detected' : 'Zero hardware parity faults'}
          </div>
        </div>

        {/* Projected Uptime / MTBF */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Est. MTBF Uptime</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`text-2xl font-mono font-extrabold ${
            stabilityCalculation.mtbfHours >= 100 ? 'text-emerald-400' :
            stabilityCalculation.mtbfHours >= 5 ? 'text-amber-400' : 'text-rose-500'
          }`}>
            {stabilityCalculation.mtbfHours >= 24
              ? `>${Math.round(stabilityCalculation.mtbfHours / 24)} Days`
              : stabilityCalculation.mtbfHours >= 1
              ? `~${stabilityCalculation.mtbfHours.toFixed(1)} Hours`
              : `~${Math.round(stabilityCalculation.mtbfHours * 60)} Mins`}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono truncate">
            {stabilityCalculation.failureMechanism}
          </div>
        </div>
      </div>

      {/* Live 15-Second Stress Simulation & Telemetry Terminal */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Real-Time Stress Run Simulation (15s Full-Load Sweep)</span>
            </h4>
            <p className="text-xs text-zinc-400">
              Dispatches AVX-512 vector loops and FurMark stress patterns to test Vcore droop response and thermal dissipation in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isTesting ? (
              <button
                type="button"
                onClick={startLiveTest}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs font-mono transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START 15S STRESS RUN</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopLiveTest}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs font-mono transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>ABORT RUN [{testElapsedSec}s]</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Test Outcome Banner */}
        <AnimatePresence>
          {testOutcome !== 'IDLE' && testOutcome !== 'RUNNING' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                testOutcome === 'PASSED'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-glow-crimson'
              }`}
            >
              {testOutcome === 'PASSED' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              )}
              <div className="space-y-1 text-xs font-mono">
                <div className="font-bold text-sm">
                  {testOutcome === 'PASSED'
                    ? 'STRESS CYCLE PASSED — SYSTEM STABLE'
                    : testOutcome === 'CRASHED_WHEA'
                    ? 'CRITICAL WHEA_UNCORRECTABLE_ERROR (BSOD)'
                    : testOutcome === 'CRASHED_THERMAL'
                    ? 'CRITICAL THERMAL RUNAWAY / SILICON CLAMP TRIP'
                    : 'CRITICAL PSU OCP/UVP POWER COLLAPSE'}
                </div>
                <div className="text-zinc-300">
                  {testOutcome === 'PASSED'
                    ? `Hardware pair maintained structural integrity under loaded Vcore of ${stabilityCalculation.effectiveVcore}V and junction temp of ${stabilityCalculation.estimatedCoreTemp}°C.`
                    : testOutcome === 'CRASHED_WHEA'
                    ? `Vcore dropped to ${stabilityCalculation.effectiveVcore}V during full instruction execution. Adjust LLC to 'Balanced' or add +25mV Vcore offset.`
                    : testOutcome === 'CRASHED_THERMAL'
                    ? `Core temperature breached ${stabilityCalculation.tjMax}°C. Thermal dissipation failed due to ${coolingCondition.replace('_', ' ')}. Check pump and airflow immediately.`
                    : `Peak GPU transient spike overwhelmed 12V rail filtering. Upgrade to ATX 3.1 / Tier A PSU.`}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-Time Telemetry Graph & Console Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Telemetry Chart Canvas / Bars */}
          <div className="lg:col-span-6 p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                Live Telemetry Plot (Voltage vs Temp)
              </span>
              <span className="text-zinc-500 text-[10px]">
                {telemetryHistory.length > 0 ? `T+${telemetryHistory[telemetryHistory.length - 1].timeSec}s` : 'Standby'}
              </span>
            </div>

            {/* Visual SVG Multi-Axis Waveform */}
            <div className="relative h-36 w-full bg-zinc-900/50 rounded-lg border border-zinc-800/60 p-2 overflow-hidden flex flex-col justify-end">
              {telemetryHistory.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-zinc-600">
                  Click 'Start 15s Stress Run' to generate live voltage/thermal trace
                </div>
              ) : (
                <div className="w-full h-full flex items-end gap-1.5 pt-4">
                  {telemetryHistory.map((pt, idx) => {
                    const tempHeight = Math.min(100, Math.max(15, (pt.tempC / (stabilityCalculation.tjMax + 10)) * 100));
                    const isHot = pt.tempC >= stabilityCalculation.tjMax - 3;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          className={`w-full rounded-t transition-all duration-300 ${
                            isHot ? 'bg-rose-500 shadow-glow-crimson' : 'bg-cyan-500'
                          }`}
                          style={{ height: `${tempHeight}%` }}
                          title={`T+${pt.timeSec}s: ${pt.tempC}°C | ${pt.voltageV}V | ${pt.errors} errors`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-900">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>Nominal Temp Curve</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Thermal Runaway Peak</span>
              </span>
              <span className="text-zinc-500">
                Max: {stabilityCalculation.tjMax}°C TjMax
              </span>
            </div>
          </div>

          {/* Event Logs Terminal Window */}
          <div className="lg:col-span-6 p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
              <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Diagnostic Kernel Ring Log
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWheaId('whea-18');
                    setIsWheaModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 transition-all cursor-pointer"
                  title="Open WHEA Error Code & Hardware BugCheck Reference Guide"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>WHEA Lexicon</span>
                </button>
                <span className="text-[10px] text-zinc-500 hidden sm:inline">EVENT_LOG_BUFFER</span>
              </div>
            </div>

            <div className="h-36 overflow-y-auto space-y-1.5 pr-1 text-[11px] no-scrollbar">
              {eventLogs.length === 0 ? (
                <div className="text-zinc-600 text-center py-10">
                  Ready for live vector dispatch. No events registered.
                </div>
              ) : (
                eventLogs.map(log => (
                  <div
                    key={log.id}
                    onClick={() => {
                      if (log.wheaRef) {
                        setSelectedWheaId(log.wheaRef);
                        setIsWheaModalOpen(true);
                      }
                    }}
                    className={`flex items-start gap-2 leading-tight rounded p-1 transition-all ${
                      log.wheaRef ? 'hover:bg-zinc-900/90 cursor-pointer group' : ''
                    }`}
                  >
                    <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                    <span className={`break-words flex-1 ${
                      log.type === 'fatal' ? 'text-rose-400 font-bold' :
                      log.type === 'error' ? 'text-rose-300' :
                      log.type === 'warn' ? 'text-amber-300' : 'text-zinc-300'
                    }`}>
                      {log.message}
                    </span>
                    {log.wheaRef && (
                      <span className="shrink-0 text-[10px] font-mono text-amber-400/80 group-hover:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Lexicon ↗
                      </span>
                    )}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
              <span>WHEA Architecture v2.9 &bull; Real-Time Trap Handler</span>
              <button
                type="button"
                onClick={() => setEventLogs([])}
                className="hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Clear Log
              </button>
            </div>
          </div>
        </div>

        {/* Actionable Engineering Remediation Guide */}
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2 text-xs font-mono">
          <div className="text-zinc-200 font-bold flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>Diagnostic Stability Engineering Recommendations:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-zinc-400 text-[11px]">
            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-cyan-400 font-bold block mb-1">Vdroop Calibration:</span>
              <span>
                {stabilityCalculation.isVoltageDeficient
                  ? `Raise LLC to 'Balanced' or add +${stabilityCalculation.voltageDeficitMv + 15}mV to prevent Core bit-flips.`
                  : `Vdroop is safely within silicon tolerance. Nominal Vcore is adequate.`}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-rose-400 font-bold block mb-1">Thermal Runaway Prevention:</span>
              <span>
                {coolingCondition === 'pump_failure'
                  ? `Immediate AIO replacement required; water pump is not circulating fluid.`
                  : ambientTempC >= 38
                  ? `Indian summer peak ambient requires high-static-pressure fans and PTM7950 phase-change pad.`
                  : `Thermal dissipation headroom is nominal. No runaway cycle detected.`}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-purple-400 font-bold block mb-1">PSU & Power Filtering:</span>
              <span>
                {psuTier === 'degraded'
                  ? `Upgrade to ATX 3.1 PSU with native 12V-2x6 connector to absorb ${transientSpikePercent}% transient GPU spikes.`
                  : `12V rail ripple is compliant with Intel ATX spec (<20mV).`}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive WHEA & Kernel BugCheck Lexicon Modal */}
        <AnimatePresence>
          {isWheaModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                        WHEA & Hardware Crash Lexicon
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Silicon-level telemetry failure modes, memory bit-flips, and actionable BIOS fixes
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsWheaModalOpen(false)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
                  {/* Sidebar with codes */}
                  <div className="md:col-span-4 border-r border-zinc-800 bg-zinc-950/40 p-3 overflow-y-auto space-y-1.5 max-h-[35vh] md:max-h-[60vh]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold px-2 block mb-1">
                      WHEA & Crash Events
                    </span>
                    {WHEA_LEXICON.map((entry) => {
                      const isSelected = entry.id === selectedWheaId;
                      return (
                        <button
                          key={entry.id}
                          onClick={() => setSelectedWheaId(entry.id)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs font-mono cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-glow-amber'
                              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white truncate">{entry.code}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                              entry.severity === 'FATAL_BSOD'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : entry.severity === 'HARD_POWER_OFF'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {entry.severity.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">{entry.name}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Detail Panel */}
                  {(() => {
                    const activeEntry = WHEA_LEXICON.find(e => e.id === selectedWheaId) || WHEA_LEXICON[0];
                    return (
                      <div className="md:col-span-8 p-5 overflow-y-auto max-h-[55vh] md:max-h-[60vh] space-y-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base sm:text-lg font-black font-mono text-amber-400">
                              {activeEntry.code}
                            </span>
                            <span className="text-sm font-bold text-white">
                              &mdash; {activeEntry.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                            <span>Subsystem: <strong className="text-cyan-400">{activeEntry.affectedSubsystem}</strong></span>
                            <span>&bull;</span>
                            <span>Source: <strong className="text-zinc-300">{activeEntry.eventViewerSource}</strong></span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-1">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">
                            Diagnostic Description
                          </span>
                          <p>{activeEntry.description}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Silicon Microarchitecture Cause
                            </span>
                            <p className="text-zinc-300 text-[11px] leading-relaxed">
                              {activeEntry.siliconMechanism}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold flex items-center gap-1">
                              <Info className="w-3.5 h-3.5" />
                              Most Likely Hardware Culprit
                            </span>
                            <p className="text-zinc-300 text-[11px] leading-relaxed">
                              {activeEntry.likelyCulprit}
                            </p>
                          </div>
                        </div>

                        {/* Actionable Engineering Fix Steps */}
                        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                          <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                            <Wrench className="w-4 h-4" />
                            Actionable BIOS & Hardware Fix Steps:
                          </span>
                          <ul className="space-y-1.5 text-xs text-zinc-300">
                            {activeEntry.actionableFixes.map((fix, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-cyan-400 font-mono shrink-0">{idx + 1}.</span>
                                <span>{fix}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Modal Footer */}
                <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500 px-5">
                  <span>Standardized under Microsoft Hardware Error Architecture (WHEA) & ACPI APEI Specs</span>
                  <button
                    onClick={() => setIsWheaModalOpen(false)}
                    className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors cursor-pointer"
                  >
                    Close Lexicon
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
