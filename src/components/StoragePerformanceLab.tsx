import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  STORAGE_TIERS,
  STORAGE_METRICS,
  StorageTierSpec,
  StorageBenchmarkMetric
} from '../data/storageLabData';
import { formatINR } from '../utils/formatters';
import {
  HardDrive,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Clock,
  Flame,
  Activity,
  ShieldAlert,
  DollarSign,
  Gauge,
  FileText,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Info,
  Tv,
  Cpu,
  Thermometer,
  Boxes
} from 'lucide-react';

interface StoragePerformanceLabProps {
  onNavigateToBuilder?: () => void;
  theme?: 'dark' | 'light';
}

export const StoragePerformanceLab: React.FC<StoragePerformanceLabProps> = ({
  onNavigateToBuilder,
  theme = 'dark'
}) => {
  const [selectedMetricId, setSelectedMetricId] = useState<StorageBenchmarkMetric['id']>('seqRead');
  const [directStorageActive, setDirectStorageActive] = useState<boolean>(true);
  const [inspectedTier, setInspectedTier] = useState<StorageTierSpec>(STORAGE_TIERS[3]); // PCIe 4 NVMe

  // Live File Copy Race State
  const [raceDriveAId, setRaceDriveAId] = useState<string>('hdd-7200');
  const [raceDriveBId, setRaceDriveBId] = useState<string>('pcie-gen4');
  const [isRaceRunning, setIsRaceRunning] = useState<boolean>(false);
  const [raceProgressA, setRaceProgressA] = useState<number>(0); // 0 to 100%
  const [raceProgressB, setRaceProgressB] = useState<number>(0);
  const [raceTimeElapsed, setRaceTimeElapsed] = useState<number>(0); // in seconds
  const [raceFinishedWinner, setRaceFinishedWinner] = useState<string | null>(null);

  const driveA = useMemo(() => STORAGE_TIERS.find((t) => t.id === raceDriveAId) || STORAGE_TIERS[0], [raceDriveAId]);
  const driveB = useMemo(() => STORAGE_TIERS.find((t) => t.id === raceDriveBId) || STORAGE_TIERS[3], [raceDriveBId]);

  // Handle Race Simulation Loop
  useEffect(() => {
    let interval: any = null;
    if (isRaceRunning) {
      interval = setInterval(() => {
        setRaceTimeElapsed((prevTime) => {
          const nextTime = prevTime + 0.5;

          // 100GB transfer total seconds
          const totalSecsA = driveA.largeFileTransferSeconds;
          const totalSecsB = driveB.largeFileTransferSeconds;

          const progA = Math.min(100, (nextTime / totalSecsA) * 100);
          const progB = Math.min(100, (nextTime / totalSecsB) * 100);

          setRaceProgressA(progA);
          setRaceProgressB(progB);

          if (progA >= 100 && progB >= 100) {
            setIsRaceRunning(false);
            setRaceFinishedWinner(totalSecsA < totalSecsB ? driveA.name : driveB.name);
            clearInterval(interval);
          } else if (progA >= 100 && progB < 100 && !raceFinishedWinner) {
            setRaceFinishedWinner(driveA.name);
          } else if (progB >= 100 && progA < 100 && !raceFinishedWinner) {
            setRaceFinishedWinner(driveB.name);
          }

          return nextTime;
        });
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRaceRunning, driveA, driveB, raceFinishedWinner]);

  const handleStartRace = () => {
    setRaceProgressA(0);
    setRaceProgressB(0);
    setRaceTimeElapsed(0);
    setRaceFinishedWinner(null);
    setIsRaceRunning(true);
  };

  const handleResetRace = () => {
    setIsRaceRunning(false);
    setRaceProgressA(0);
    setRaceProgressB(0);
    setRaceTimeElapsed(0);
    setRaceFinishedWinner(null);
  };

  // Selected Metric
  const currentMetric = useMemo(() => {
    return STORAGE_METRICS.find((m) => m.id === selectedMetricId) || STORAGE_METRICS[0];
  }, [selectedMetricId]);

  // Max value calculation for relative bars
  const maxMetricVal = useMemo(() => {
    if (selectedMetricId === 'seqRead') return 12400;
    if (selectedMetricId === 'randomIo') return 2200000;
    if (selectedMetricId === 'videoEditing') return 120;
    // For times (lower is better): max time is HDD
    if (selectedMetricId === 'gameLoading') return 48.5;
    if (selectedMetricId === 'windowsBoot') return 42.0;
    if (selectedMetricId === 'largeFile') return 672;
    return 100;
  }, [selectedMetricId]);

  // Get metric value for a drive tier
  const getDriveMetricValue = (tier: StorageTierSpec, metricId: StorageBenchmarkMetric['id']) => {
    switch (metricId) {
      case 'seqRead':
        return tier.seqReadMBps;
      case 'gameLoading':
        // If DirectStorage is disabled, NVMe game load times get slightly slower (+20%)
        if (!directStorageActive && tier.id.includes('pcie')) {
          return Number((tier.gameLoadingSeconds * 1.35).toFixed(1));
        }
        return tier.gameLoadingSeconds;
      case 'windowsBoot':
        return tier.windowsBootSeconds;
      case 'largeFile':
        return tier.largeFileTransferSeconds;
      case 'videoEditing':
        return tier.videoEditingScrubbingFps;
      case 'randomIo':
        return tier.random4kReadIOPS;
      default:
        return tier.seqReadMBps;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                Silicon Storage Performance Lab
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                BENCHMARK ENGINE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              HDD vs. SATA vs. PCIe 3/4/5 NVMe Laboratory
            </h1>
          </div>
        </div>

        {/* DirectStorage Toggle & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setDirectStorageActive(!directStorageActive)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              directStorageActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/10'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>DirectStorage 1.2 GPU Bypass: {directStorageActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* METRIC SELECTOR TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STORAGE_METRICS.map((metric) => {
          const isActive = selectedMetricId === metric.id;
          return (
            <button
              key={metric.id}
              onClick={() => setSelectedMetricId(metric.id)}
              className={`p-3.5 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-amber-400' : 'text-zinc-500'}`}>
                  WORKLOAD
                </span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
              </div>
              <strong className="text-xs font-bold leading-tight block">{metric.label}</strong>
              <span className="text-[11px] text-zinc-500 font-mono">
                Unit: {metric.unit}
              </span>
            </button>
          );
        })}
      </div>

      {/* MAIN VISUALIZATION COMPARISON BOARD */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-2xl overflow-hidden font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span>{currentMetric.label} Benchmark</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">{currentMetric.description}</p>
          </div>
          <div className="text-xs text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
            {currentMetric.higherIsBetter ? 'Higher is better (throughput)' : 'Lower is better (latency/time)'}
          </div>
        </div>

        {/* Dynamic Visual Bars Array */}
        <div className="space-y-4">
          {STORAGE_TIERS.map((tier) => {
            const rawVal = getDriveMetricValue(tier, selectedMetricId);
            const isSelectedInspected = inspectedTier.id === tier.id;

            // Bar percentage calculation
            let barPct = 0;
            if (currentMetric.higherIsBetter) {
              barPct = Math.max(4, Math.min(100, (rawVal / maxMetricVal) * 100));
            } else {
              // For times (lower is better), HDD takes 100% of bar width, faster drives get smaller bars
              barPct = Math.max(5, Math.min(100, (rawVal / maxMetricVal) * 100));
            }

            return (
              <div
                key={tier.id}
                onClick={() => setInspectedTier(tier)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isSelectedInspected
                    ? 'bg-zinc-950 border-amber-500/60 shadow-lg'
                    : 'bg-zinc-950/60 hover:bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black text-white">{tier.shortName}</span>
                    <span className="text-xs text-zinc-500 hidden sm:inline">&bull; {tier.typicalModel}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-400">
                      Price: {formatINR(tier.pricePerTbINR)}/TB
                    </span>
                    <span className="text-sm font-black font-mono text-amber-400">
                      {rawVal.toLocaleString()} {currentMetric.unit}
                    </span>
                  </div>
                </div>

                {/* ASCII / Graphic Visual Bar */}
                <div className="space-y-1">
                  <div className="w-full h-3.5 rounded-lg bg-zinc-900 overflow-hidden flex items-center p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-md ${tier.barColor} shadow-glow`}
                    />
                  </div>
                  {/* ASCII Visualization representation */}
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono tracking-widest pt-0.5">
                    <span>ASCII Bar: {tier.asciiBar}</span>
                    <span>{tier.interfaceType}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE "LIVE FILE COPY RACE" SIMULATOR */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-amber-500/30 space-y-6 shadow-2xl font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>INTERACTIVE REAL-TIME BENCHMARK</span>
            </div>
            <h3 className="text-xl font-extrabold text-white">
              100GB Raw Movie Directory Transfer Race
            </h3>
            <p className="text-xs text-zinc-400">
              Pit two storage generations head-to-head in a live simulated 100GB project copy race.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isRaceRunning ? (
              <button
                onClick={handleStartRace}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 text-black fill-current" />
                <span>START COPY RACE</span>
              </button>
            ) : (
              <button
                onClick={handleResetRace}
                className="px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-black text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>STOP & RESET</span>
              </button>
            )}
          </div>
        </div>

        {/* Race Selector & Live Progress Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drive A Gauge */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold uppercase">LANE A (CONTENDER 1)</span>
              <select
                value={raceDriveAId}
                onChange={(e) => {
                  setRaceDriveAId(e.target.value);
                  handleResetRace();
                }}
                disabled={isRaceRunning}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
              >
                {STORAGE_TIERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white font-bold">{driveA.shortName}</span>
                <span className="text-amber-400 font-bold">{raceProgressA.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-100"
                  style={{ width: `${raceProgressA}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
              <span>Transfer Speed: {driveA.seqWriteMBps} MB/s</span>
              <span>Estimated Time: {driveA.largeFileTransferSeconds}s</span>
            </div>
          </div>

          {/* Drive B Gauge */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold uppercase">LANE B (CONTENDER 2)</span>
              <select
                value={raceDriveBId}
                onChange={(e) => {
                  setRaceDriveBId(e.target.value);
                  handleResetRace();
                }}
                disabled={isRaceRunning}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
              >
                {STORAGE_TIERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white font-bold">{driveB.shortName}</span>
                <span className="text-emerald-400 font-bold">{raceProgressB.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-100"
                  style={{ width: `${raceProgressB}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
              <span>Transfer Speed: {driveB.seqWriteMBps} MB/s</span>
              <span>Estimated Time: {driveB.largeFileTransferSeconds}s</span>
            </div>
          </div>
        </div>

        {/* Winner Announcement Banner */}
        {raceFinishedWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center space-y-1"
          >
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>RACE COMPLETED</span>
            </div>
            <div className="text-base font-extrabold text-white">
              🏆 Winner: <span className="text-emerald-300">{raceFinishedWinner}</span> finished in first place!
            </div>
          </motion.div>
        )}
      </div>

      {/* INSPECTED TIER DEEP DIVE ARCHITECTURE CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-xl font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              DETAILED ARCHITECTURAL INSPECTOR
            </span>
            <h3 className="text-xl font-extrabold text-white">{inspectedTier.name}</h3>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            {inspectedTier.interfaceType}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{inspectedTier.description}</p>

        {/* Thermal & Heatsink Advisory Warning */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="text-white font-bold block">Cooling & Thermal Requirements</span>
            <p className="text-zinc-400 leading-relaxed">
              Required Heatsink: <span className="text-amber-300 font-bold">{inspectedTier.thermalHeatsinkReq}</span>.
              Operating power draw under full sequential load is ~{inspectedTier.powerLoadWatts}W.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-2">
            <span className="text-emerald-400 font-bold block uppercase tracking-wider">
              Primary Advantages
            </span>
            <ul className="space-y-1 text-zinc-300 list-disc list-inside">
              {inspectedTier.pros.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 space-y-2">
            <span className="text-rose-400 font-bold block uppercase tracking-wider">
              Tradeoffs & Limitations
            </span>
            <ul className="space-y-1 text-zinc-300 list-disc list-inside">
              {inspectedTier.cons.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
