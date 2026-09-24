import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CPUItem, GPUItem, HardwareItem, ComponentCategory } from '../types';
import { formatINR, formatScore, getValueIndex, getPowerEfficiency } from '../utils/formatters';
import { METRIC_LEXICON } from '../data/metricLexicon';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Zap,
  IndianRupee,
  Cpu,
  Monitor,
  Info,
  Scale,
  Sparkles,
  Flame,
  ShieldCheck,
  Award,
  HelpCircle,
  Lightbulb,
  Gamepad2,
  X
} from 'lucide-react';

interface HeadToHeadProps {
  category: ComponentCategory;
  setCategory: (cat: ComponentCategory) => void;
  cpus: CPUItem[];
  gpus: GPUItem[];
  defaultItemA?: HardwareItem;
  defaultItemB?: HardwareItem;
  onOpenDetails: (item: HardwareItem) => void;
}

export const HeadToHead: React.FC<HeadToHeadProps> = ({
  category,
  setCategory,
  cpus,
  gpus,
  defaultItemA,
  defaultItemB,
  onOpenDetails
}) => {
  const currentList = category === 'CPU' ? cpus : gpus;

  // Selected item IDs
  const [selectedIdA, setSelectedIdA] = useState<string>(() => {
    if (defaultItemA && defaultItemA.category === category) return defaultItemA.id;
    return category === 'CPU' ? 'cpu-amd-7800x3d' : 'gpu-nvidia-4070-super';
  });

  const [selectedIdB, setSelectedIdB] = useState<string>(() => {
    if (defaultItemB && defaultItemB.category === category) return defaultItemB.id;
    return category === 'CPU' ? 'cpu-intel-14700k' : 'gpu-amd-7800xt';
  });

  // Pulse key for triggering slick animations on component selection or swap
  const [duelPulseKey, setDuelPulseKey] = useState<number>(0);

  useEffect(() => {
    setDuelPulseKey(prev => prev + 1);
  }, [selectedIdA, selectedIdB, category]);

  // Keep state consistent if category changes
  const itemA = useMemo(() => {
    return currentList.find(i => i.id === selectedIdA) || currentList[0];
  }, [currentList, selectedIdA]);

  const itemB = useMemo(() => {
    return currentList.find(i => i.id === selectedIdB) || currentList[1] || currentList[0];
  }, [currentList, selectedIdB]);

  const handleSwap = () => {
    const temp = selectedIdA;
    setSelectedIdA(selectedIdB);
    setSelectedIdB(temp);
  };

  // Metric Comparison Helper
  const compareMetric = (valA: number, valB: number, higherIsBetter = true) => {
    if (valA === valB) return { diffPct: 0, winner: 'tie' as const, delta: 0 };
    const delta = valA - valB;
    const diffPct = Math.round((Math.abs(delta) / Math.max(valA, valB)) * 100);
    const winner = higherIsBetter
      ? valA > valB ? 'A' : 'B'
      : valA < valB ? 'A' : 'B';
    return { diffPct, winner, delta };
  };

  // Calculations
  const priceDiff = compareMetric(itemA.Price_INR, itemB.Price_INR, false);
  const benchDiff = compareMetric(itemA.Benchmark_Score, itemB.Benchmark_Score, true);
  const gamingDiff = compareMetric(itemA.Gaming_Score, itemB.Gaming_Score, true);

  const valueA = getValueIndex(itemA.Benchmark_Score, itemA.Price_INR);
  const valueB = getValueIndex(itemB.Benchmark_Score, itemB.Price_INR);
  const valueDiff = compareMetric(valueA, valueB, true);

  const effA = getPowerEfficiency(itemA);
  const effB = getPowerEfficiency(itemB);
  const effDiff = compareMetric(effA, effB, true);

  // Power
  const wattsA = itemA.category === 'CPU' ? (itemA as CPUItem).TDP_Watts : (itemA as GPUItem).TGP_Watts;
  const wattsB = itemB.category === 'CPU' ? (itemB as CPUItem).TDP_Watts : (itemB as GPUItem).TGP_Watts;
  const powerDiff = compareMetric(wattsA, wattsB, false);

  // Category-specific granular performance diffs
  const singleCoreDiff = category === 'CPU'
    ? compareMetric((itemA as CPUItem).SingleCore_Score, (itemB as CPUItem).SingleCore_Score, true)
    : { diffPct: 0, winner: 'tie' as const, delta: 0 };

  const multiCoreDiff = category === 'CPU'
    ? compareMetric((itemA as CPUItem).MultiCore_Score, (itemB as CPUItem).MultiCore_Score, true)
    : { diffPct: 0, winner: 'tie' as const, delta: 0 };

  const rayTracingDiff = category === 'GPU'
    ? compareMetric((itemA as GPUItem).RayTracing_Score, (itemB as GPUItem).RayTracing_Score, true)
    : { diffPct: 0, winner: 'tie' as const, delta: 0 };

  const computeDiff = category === 'GPU'
    ? compareMetric((itemA as GPUItem).Compute_Score, (itemB as GPUItem).Compute_Score, true)
    : { diffPct: 0, winner: 'tie' as const, delta: 0 };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">
              Precision Benchmark Duel
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Head-to-Head Hardware Duel
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Compare granular architectural specifications, gaming IPC, thermal efficiency, and rupee-per-point value metrics.
          </p>
        </div>

        {/* Category switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCategory('CPU');
              setSelectedIdA('cpu-amd-7800x3d');
              setSelectedIdB('cpu-intel-14700k');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              category === 'CPU'
                ? 'bg-cyan-500 text-zinc-950 shadow-glow-cyan'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Duel CPUs</span>
          </button>
          <button
            onClick={() => {
              setCategory('GPU');
              setSelectedIdA('gpu-nvidia-4070-super');
              setSelectedIdB('gpu-amd-7800xt');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              category === 'GPU'
                ? 'bg-purple-500 text-zinc-950 shadow-glow-purple'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Duel GPUs</span>
          </button>
        </div>
      </div>

      {/* Duel Component Pickers & Cards with Slick Animated VS Clash */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center relative">
        {/* Component A Card */}
        <motion.div
          key={`card-A-${itemA.id}`}
          initial={{ opacity: 0.6, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="lg:col-span-5 rounded-2xl bg-zinc-900/90 border-2 border-cyan-500/40 p-5 shadow-glow-cyan backdrop-blur-xl space-y-4 relative overflow-hidden"
        >
          {/* Subtle Ambient Cyber Sheen */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Challenger A
            </span>
            <button
              onClick={() => onOpenDetails(itemA)}
              className="text-xs font-mono text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" /> Full Specs
            </button>
          </div>

          <div>
            <label className="text-[11px] font-mono text-zinc-400 uppercase">Select Component</label>
            <select
              value={selectedIdA}
              onChange={(e) => setSelectedIdA(e.target.value)}
              className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              {currentList.map(item => (
                <option key={item.id} value={item.id}>
                  {item.Model} &bull; {formatINR(item.Price_INR)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tight">{itemA.Model}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span className="text-cyan-300 font-semibold">{itemA.Architecture}</span>
              <span>&bull;</span>
              <span>{itemA.Brand}</span>
              <span>&bull;</span>
              <span>{itemA.ReleaseYear}</span>
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">Market Price (INR)</span>
            <span className="text-xl font-extrabold text-cyan-400 font-mono">
              {formatINR(itemA.Price_INR)}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed italic line-clamp-2">
            {itemA.Description}
          </p>
        </motion.div>

        {/* Slick Animated 'VS' Clash Emblem & Swap Action */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center py-2 lg:py-0 relative">
          {/* Shockwave Rings on Selection / Swap */}
          <div className="relative flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`shockwave-cyan-${duelPulseKey}`}
                initial={{ scale: 0.6, opacity: 0.9, borderWidth: '3px' }}
                animate={{ scale: 2.4, opacity: 0, borderWidth: '1px' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-cyan-400 pointer-events-none"
              />
              <motion.div
                key={`shockwave-purple-${duelPulseKey}`}
                initial={{ scale: 0.7, opacity: 0.8, borderWidth: '3px' }}
                animate={{ scale: 2.8, opacity: 0, borderWidth: '1px' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut', delay: 0.05 }}
                className="absolute inset-0 rounded-full border-purple-500 pointer-events-none"
              />
            </AnimatePresence>

            {/* Glowing Orb Background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-purple-500/20 blur-xl pointer-events-none" />

            {/* Rotating Cyber Reticle */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="absolute w-16 h-16 rounded-full border border-dashed border-zinc-600/60 pointer-events-none"
            />

            {/* Central Animated VS Badge */}
            <motion.div
              key={`vs-badge-${duelPulseKey}`}
              initial={{ scale: 0.8, rotate: -8 }}
              animate={{ scale: [1, 1.2, 1], rotate: [0, -6, 6, 0] }}
              transition={{ duration: 0.45, ease: 'backOut' }}
              className="relative z-10 w-14 h-14 rounded-full bg-zinc-950 border-2 border-zinc-700 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)]"
            >
              <span className="text-base font-black italic tracking-tighter bg-gradient-to-br from-cyan-400 via-sky-200 to-purple-400 bg-clip-text text-transparent select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                VS
              </span>
              <div className="w-4 h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" />
            </motion.div>
          </div>

          {/* Animated Swap Challengers Button */}
          <motion.button
            whileHover={{ scale: 1.15, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.25 }}
            onClick={handleSwap}
            title="Swap Challengers (A ⇄ B)"
            className="mt-2 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 shadow-xl transition-colors cursor-pointer group"
          >
            <ArrowLeftRight className="w-4 h-4 text-purple-400 group-hover:text-cyan-300 transition-colors" />
          </motion.button>
          <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider mt-1">SWAP</span>
        </div>

        {/* Component B Card */}
        <motion.div
          key={`card-B-${itemB.id}`}
          initial={{ opacity: 0.6, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="lg:col-span-5 rounded-2xl bg-zinc-900/90 border-2 border-purple-500/40 p-5 shadow-glow-purple backdrop-blur-xl space-y-4 relative overflow-hidden"
        >
          {/* Subtle Ambient Cyber Sheen */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Challenger B
            </span>
            <button
              onClick={() => onOpenDetails(itemB)}
              className="text-xs font-mono text-zinc-400 hover:text-purple-400 transition-colors flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" /> Full Specs
            </button>
          </div>

          <div>
            <label className="text-[11px] font-mono text-zinc-400 uppercase">Select Component</label>
            <select
              value={selectedIdB}
              onChange={(e) => setSelectedIdB(e.target.value)}
              className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:border-purple-500 focus:outline-none cursor-pointer"
            >
              {currentList.map(item => (
                <option key={item.id} value={item.id}>
                  {item.Model} &bull; {formatINR(item.Price_INR)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tight">{itemB.Model}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span className="text-purple-300 font-semibold">{itemB.Architecture}</span>
              <span>&bull;</span>
              <span>{itemB.Brand}</span>
              <span>&bull;</span>
              <span>{itemB.ReleaseYear}</span>
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">Market Price (INR)</span>
            <span className="text-xl font-extrabold text-purple-400 font-mono">
              {formatINR(itemB.Price_INR)}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed italic line-clamp-2">
            {itemB.Description}
          </p>
        </motion.div>
      </div>

      {/* Comprehensive Metric Comparison Table */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Multi-Criteria Performance Matrix & Deltas
            </h3>
            <p className="text-xs text-zinc-400">
              Granular architectural metrics with animated comparative delta bars and silicon explanations.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-700/40 text-[11px] font-mono text-cyan-300">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Hover metric titles for technical & gaming significance</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* 1. Price Criteria */}
          <MetricRow
            index={0}
            triggerKey={duelPulseKey}
            metricKey="pricing"
            label="Pricing (INR)"
            subLabel="Lower price is better"
            valA={formatINR(itemA.Price_INR)}
            valB={formatINR(itemB.Price_INR)}
            winner={priceDiff.winner}
            diffPct={priceDiff.diffPct}
            barPercentA={Math.min((itemA.Price_INR / Math.max(itemA.Price_INR, itemB.Price_INR)) * 100, 100)}
            barPercentB={Math.min((itemB.Price_INR / Math.max(itemA.Price_INR, itemB.Price_INR)) * 100, 100)}
            isInverse
          />

          {/* 2. Gaming Performance */}
          <MetricRow
            index={1}
            triggerKey={duelPulseKey}
            metricKey="gamingScore"
            label="Gaming Performance Index"
            subLabel="Real-world 1080p/1440p frame throughput"
            valA={formatScore(itemA.Gaming_Score)}
            valB={formatScore(itemB.Gaming_Score)}
            winner={gamingDiff.winner}
            diffPct={gamingDiff.diffPct}
            barPercentA={(itemA.Gaming_Score / Math.max(itemA.Gaming_Score, itemB.Gaming_Score)) * 100}
            barPercentB={(itemB.Gaming_Score / Math.max(itemA.Gaming_Score, itemB.Gaming_Score)) * 100}
          />

          {/* Category-Specific Granular Criteria */}
          {category === 'CPU' ? (
            <>
              {/* CPU Single-Core IPC & Clock Speed */}
              <MetricRow
                index={2}
                triggerKey={duelPulseKey}
                metricKey="clockSpeedIpc"
                label="Single-Core IPC & Clock Speed"
                subLabel="Why Clock Speed vs IPC matters for gaming"
                valA={`${(itemA as CPUItem).Base_Boost_GHz} (${(itemA as CPUItem).SingleCore_Score} pts)`}
                valB={`${(itemB as CPUItem).Base_Boost_GHz} (${(itemB as CPUItem).SingleCore_Score} pts)`}
                winner={singleCoreDiff.winner}
                diffPct={singleCoreDiff.diffPct}
                barPercentA={((itemA as CPUItem).SingleCore_Score / Math.max((itemA as CPUItem).SingleCore_Score, (itemB as CPUItem).SingleCore_Score)) * 100}
                barPercentB={((itemB as CPUItem).SingleCore_Score / Math.max((itemA as CPUItem).SingleCore_Score, (itemB as CPUItem).SingleCore_Score)) * 100}
              />
              {/* CPU Multi-Core Compute */}
              <MetricRow
                index={3}
                triggerKey={duelPulseKey}
                metricKey="multiCoreScore"
                label="Multi-Core Compute Throughput"
                subLabel="All-core rendering, code building & export capacity"
                valA={`${formatScore((itemA as CPUItem).MultiCore_Score)} pts`}
                valB={`${formatScore((itemB as CPUItem).MultiCore_Score)} pts`}
                winner={multiCoreDiff.winner}
                diffPct={multiCoreDiff.diffPct}
                barPercentA={((itemA as CPUItem).MultiCore_Score / Math.max((itemA as CPUItem).MultiCore_Score, (itemB as CPUItem).MultiCore_Score)) * 100}
                barPercentB={((itemB as CPUItem).MultiCore_Score / Math.max((itemA as CPUItem).MultiCore_Score, (itemB as CPUItem).MultiCore_Score)) * 100}
              />
              {/* CPU Cores / Threads */}
              <MetricRow
                index={4}
                triggerKey={duelPulseKey}
                metricKey="coresThreads"
                label="Cores & Multi-Threading"
                subLabel="Total computational execution units"
                valA={(itemA as CPUItem).Cores_Threads}
                valB={(itemB as CPUItem).Cores_Threads}
                winner={(itemA as CPUItem).Cores > (itemB as CPUItem).Cores ? 'A' : (itemB as CPUItem).Cores > (itemA as CPUItem).Cores ? 'B' : 'tie'}
                diffPct={Math.round(Math.abs((itemA as CPUItem).Cores - (itemB as CPUItem).Cores) / Math.max((itemA as CPUItem).Cores, (itemB as CPUItem).Cores) * 100)}
                barPercentA={((itemA as CPUItem).Cores / Math.max((itemA as CPUItem).Cores, (itemB as CPUItem).Cores)) * 100}
                barPercentB={((itemB as CPUItem).Cores / Math.max((itemA as CPUItem).Cores, (itemB as CPUItem).Cores)) * 100}
              />
              {/* CPU Cache */}
              <MetricRow
                index={5}
                triggerKey={duelPulseKey}
                metricKey="cpuCache"
                label="L2 + L3 Cache"
                subLabel="High cache lowers memory latency in gaming"
                valA={`${(itemA as CPUItem).Cache_MB} MB`}
                valB={`${(itemB as CPUItem).Cache_MB} MB`}
                winner={(itemA as CPUItem).Cache_MB > (itemB as CPUItem).Cache_MB ? 'A' : (itemB as CPUItem).Cache_MB > (itemA as CPUItem).Cache_MB ? 'B' : 'tie'}
                diffPct={Math.round(Math.abs((itemA as CPUItem).Cache_MB - (itemB as CPUItem).Cache_MB) / Math.max((itemA as CPUItem).Cache_MB, (itemB as CPUItem).Cache_MB) * 100)}
                barPercentA={((itemA as CPUItem).Cache_MB / Math.max((itemA as CPUItem).Cache_MB, (itemB as CPUItem).Cache_MB)) * 100}
                barPercentB={((itemB as CPUItem).Cache_MB / Math.max((itemA as CPUItem).Cache_MB, (itemB as CPUItem).Cache_MB)) * 100}
              />
            </>
          ) : (
            <>
              {/* GPU Hardware Ray Tracing */}
              <MetricRow
                index={2}
                triggerKey={duelPulseKey}
                metricKey="rayTracing"
                label="Hardware Ray Tracing (BVH Acceleration)"
                subLabel="Dedicated RT silicon for real-time light simulation"
                valA={`${formatScore((itemA as GPUItem).RayTracing_Score)} pts`}
                valB={`${formatScore((itemB as GPUItem).RayTracing_Score)} pts`}
                winner={rayTracingDiff.winner}
                diffPct={rayTracingDiff.diffPct}
                barPercentA={((itemA as GPUItem).RayTracing_Score / Math.max((itemA as GPUItem).RayTracing_Score, (itemB as GPUItem).RayTracing_Score)) * 100}
                barPercentB={((itemB as GPUItem).RayTracing_Score / Math.max((itemA as GPUItem).RayTracing_Score, (itemB as GPUItem).RayTracing_Score)) * 100}
              />
              {/* GPU Compute & AI Engine */}
              <MetricRow
                index={3}
                triggerKey={duelPulseKey}
                metricKey="computeAi"
                label="Compute & AI Acceleration"
                subLabel="Tensor & FP32 matrix compute for DLSS & AI workflows"
                valA={`${formatScore((itemA as GPUItem).Compute_Score)} pts`}
                valB={`${formatScore((itemB as GPUItem).Compute_Score)} pts`}
                winner={computeDiff.winner}
                diffPct={computeDiff.diffPct}
                barPercentA={((itemA as GPUItem).Compute_Score / Math.max((itemA as GPUItem).Compute_Score, (itemB as GPUItem).Compute_Score)) * 100}
                barPercentB={((itemB as GPUItem).Compute_Score / Math.max((itemA as GPUItem).Compute_Score, (itemB as GPUItem).Compute_Score)) * 100}
              />
              {/* GPU VRAM */}
              <MetricRow
                index={4}
                triggerKey={duelPulseKey}
                metricKey="vramCapacity"
                label="VRAM Capacity"
                subLabel="Texture storage and high-resolution buffer"
                valA={`${(itemA as GPUItem).VRAM_GB} GB ${(itemA as GPUItem).Memory_Type}`}
                valB={`${(itemB as GPUItem).VRAM_GB} GB ${(itemB as GPUItem).Memory_Type}`}
                winner={(itemA as GPUItem).VRAM_GB > (itemB as GPUItem).VRAM_GB ? 'A' : (itemB as GPUItem).VRAM_GB > (itemA as GPUItem).VRAM_GB ? 'B' : 'tie'}
                diffPct={Math.round(Math.abs((itemA as GPUItem).VRAM_GB - (itemB as GPUItem).VRAM_GB) / Math.max((itemA as GPUItem).VRAM_GB, (itemB as GPUItem).VRAM_GB) * 100)}
                barPercentA={((itemA as GPUItem).VRAM_GB / Math.max((itemA as GPUItem).VRAM_GB, (itemB as GPUItem).VRAM_GB)) * 100}
                barPercentB={((itemB as GPUItem).VRAM_GB / Math.max((itemA as GPUItem).VRAM_GB, (itemB as GPUItem).VRAM_GB)) * 100}
              />
              {/* GPU Memory Bandwidth */}
              <MetricRow
                index={5}
                triggerKey={duelPulseKey}
                metricKey="memoryBandwidth"
                label="Memory Bandwidth"
                subLabel="Memory bus speed and data throughput"
                valA={`${(itemA as GPUItem).Bandwidth_GBs} GB/s (${(itemA as GPUItem).Bus_Width_Bit}-bit)`}
                valB={`${(itemB as GPUItem).Bandwidth_GBs} GB/s (${(itemB as GPUItem).Bus_Width_Bit}-bit)`}
                winner={(itemA as GPUItem).Bandwidth_GBs > (itemB as GPUItem).Bandwidth_GBs ? 'A' : (itemB as GPUItem).Bandwidth_GBs > (itemA as GPUItem).Bandwidth_GBs ? 'B' : 'tie'}
                diffPct={Math.round(Math.abs((itemA as GPUItem).Bandwidth_GBs - (itemB as GPUItem).Bandwidth_GBs) / Math.max((itemA as GPUItem).Bandwidth_GBs, (itemB as GPUItem).Bandwidth_GBs) * 100)}
                barPercentA={((itemA as GPUItem).Bandwidth_GBs / Math.max((itemA as GPUItem).Bandwidth_GBs, (itemB as GPUItem).Bandwidth_GBs)) * 100}
                barPercentB={((itemB as GPUItem).Bandwidth_GBs / Math.max((itemA as GPUItem).Bandwidth_GBs, (itemB as GPUItem).Bandwidth_GBs)) * 100}
              />
            </>
          )}

          {/* Overall Benchmark Score */}
          <MetricRow
            index={6}
            triggerKey={duelPulseKey}
            metricKey="benchmarkScore"
            label="Overall Benchmark Score"
            subLabel="Composite computational pipeline evaluation"
            valA={formatScore(itemA.Benchmark_Score)}
            valB={formatScore(itemB.Benchmark_Score)}
            winner={benchDiff.winner}
            diffPct={benchDiff.diffPct}
            barPercentA={(itemA.Benchmark_Score / Math.max(itemA.Benchmark_Score, itemB.Benchmark_Score)) * 100}
            barPercentB={(itemB.Benchmark_Score / Math.max(itemA.Benchmark_Score, itemB.Benchmark_Score)) * 100}
          />

          {/* Value Index (Points per ₹1,000) */}
          <MetricRow
            index={7}
            triggerKey={duelPulseKey}
            metricKey="valueIndex"
            label="Value Index (Points per ₹1,000)"
            subLabel="Rupee-for-rupee performance return"
            valA={`${valueA} pts/₹1k`}
            valB={`${valueB} pts/₹1k`}
            winner={valueDiff.winner}
            diffPct={valueDiff.diffPct}
            barPercentA={(valueA / Math.max(valueA, valueB)) * 100}
            barPercentB={(valueB / Math.max(valueA, valueB)) * 100}
          />

          {/* Power Consumption (Watts) */}
          <MetricRow
            index={8}
            triggerKey={duelPulseKey}
            metricKey="powerConsumption"
            label={category === 'CPU' ? 'TDP (Thermal Design Power)' : 'TGP (Total Graphics Power)'}
            subLabel="Lower power draw is better"
            valA={`${wattsA}W`}
            valB={`${wattsB}W`}
            winner={powerDiff.winner}
            diffPct={powerDiff.diffPct}
            barPercentA={(wattsA / Math.max(wattsA, wattsB)) * 100}
            barPercentB={(wattsB / Math.max(wattsA, wattsB)) * 100}
            isInverse
          />

          {/* Power Efficiency */}
          <MetricRow
            index={9}
            triggerKey={duelPulseKey}
            metricKey="powerEfficiency"
            label="Power Efficiency"
            subLabel="Score points achieved per Watt drawn"
            valA={`${effA} pts/W`}
            valB={`${effB} pts/W`}
            winner={effDiff.winner}
            diffPct={effDiff.diffPct}
            barPercentA={(effA / Math.max(effA, effB)) * 100}
            barPercentB={(effB / Math.max(effA, effB)) * 100}
          />
        </div>

        {/* 6-Axis Multi-Workload Capability Radar Section */}
        <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                6-Axis Architectural Workload Capability Hexagon
              </span>
              <span className="text-[11px] text-zinc-500 block">
                Normalized benchmark throughput across distinct computing workloads (0 to 100)
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
                {itemA.Model}
              </span>
              <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                <span className="w-3 h-3 rounded bg-purple-500 inline-block" />
                {itemB.Model}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* SVG Radar Chart */}
            <div className="md:col-span-6 flex justify-center py-2">
              <svg className="w-64 h-64 overflow-visible" viewBox="-120 -120 240 240">
                {/* Concentric Hexagons (25%, 50%, 75%, 100%) */}
                {[0.25, 0.5, 0.75, 1.0].map((scale, i) => {
                  const points = [0, 1, 2, 3, 4, 5].map(idx => {
                    const angle = (Math.PI / 3) * idx - Math.PI / 2;
                    const r = 90 * scale;
                    return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
                  }).join(' ');
                  return (
                    <polygon
                      key={i}
                      points={points}
                      fill="none"
                      stroke="#27272a"
                      strokeWidth={1}
                      strokeDasharray={scale < 1.0 ? '2,2' : undefined}
                    />
                  );
                })}

                {/* Axis Spoke Lines */}
                {[0, 1, 2, 3, 4, 5].map(idx => {
                  const angle = (Math.PI / 3) * idx - Math.PI / 2;
                  const x = 90 * Math.cos(angle);
                  const y = 90 * Math.sin(angle);
                  return (
                    <line
                      key={idx}
                      x1={0}
                      y1={0}
                      x2={x}
                      y2={y}
                      stroke="#27272a"
                      strokeWidth={1}
                    />
                  );
                })}

                {/* Polygon Item A (Cyan) */}
                {(() => {
                  const axes: (keyof typeof itemA.RadarScores)[] = [
                    'esports1080p',
                    'raster1440p4k',
                    'rayTracing',
                    'videoEditing',
                    'render3D',
                    'aiCompute'
                  ];
                  const pts = axes.map((key, idx) => {
                    const val = (itemA.RadarScores?.[key] ?? 50) / 100;
                    const angle = (Math.PI / 3) * idx - Math.PI / 2;
                    const r = 90 * Math.max(val, 0.08);
                    return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
                  }).join(' ');
                  return (
                    <polygon
                      points={pts}
                      fill="rgba(6, 182, 212, 0.22)"
                      stroke="#06b6d4"
                      strokeWidth={2}
                    />
                  );
                })()}

                {/* Polygon Item B (Purple) */}
                {(() => {
                  const axes: (keyof typeof itemB.RadarScores)[] = [
                    'esports1080p',
                    'raster1440p4k',
                    'rayTracing',
                    'videoEditing',
                    'render3D',
                    'aiCompute'
                  ];
                  const pts = axes.map((key, idx) => {
                    const val = (itemB.RadarScores?.[key] ?? 50) / 100;
                    const angle = (Math.PI / 3) * idx - Math.PI / 2;
                    const r = 90 * Math.max(val, 0.08);
                    return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
                  }).join(' ');
                  return (
                    <polygon
                      points={pts}
                      fill="rgba(168, 85, 247, 0.22)"
                      stroke="#a855f7"
                      strokeWidth={2}
                    />
                  );
                })()}

                {/* Axis Labels */}
                {[
                  { label: '1080p Esports', idx: 0, dx: 0, dy: -10 },
                  { label: '1440p/4K', idx: 1, dx: 14, dy: 0 },
                  { label: 'Ray Tracing', idx: 2, dx: 14, dy: 10 },
                  { label: 'Video Edit', idx: 3, dx: 0, dy: 15 },
                  { label: '3D Render', idx: 4, dx: -14, dy: 10 },
                  { label: 'AI Compute', idx: 5, dx: -14, dy: 0 }
                ].map(ax => {
                  const angle = (Math.PI / 3) * ax.idx - Math.PI / 2;
                  const x = 105 * Math.cos(angle) + ax.dx;
                  const y = 105 * Math.sin(angle) + ax.dy;
                  return (
                    <text
                      key={ax.idx}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-zinc-400 text-[9px] font-mono font-semibold"
                    >
                      {ax.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Granular Workload Score Breakdown Table */}
            <div className="md:col-span-6 space-y-2 text-xs font-mono">
              {[
                {
                  name: '1080p Esports Frame Pacing',
                  key: 'esports1080p' as const,
                  tip: 'CPU IPC, clock frequency, and low cache latency dominate frame delivery in CS2, Valorant & Apex Legends to keep minimum 1% lows high.'
                },
                {
                  name: '1440p / 4K AAA Rasterization',
                  key: 'raster1440p4k' as const,
                  tip: 'Stresses GPU compute clusters, texture mapping units, and memory bus bandwidth in heavy titles like Cyberpunk, Wukong, and Starfield.'
                },
                {
                  name: 'Hardware Ray & Path Tracing',
                  key: 'rayTracing' as const,
                  tip: 'BVH traversal and real-time ray-triangle intersection throughput for photorealistic lighting, reflections, and path-traced illumination.'
                },
                {
                  name: 'Video Editing & Timeline Export',
                  key: 'videoEditing' as const,
                  tip: 'Dedicated hardware media encoders (NVENC/QuickSync/VCN) and memory throughput for smooth timeline scrubbing in Premiere & DaVinci Resolve.'
                },
                {
                  name: '3D Rendering & Simulation (Blender)',
                  key: 'render3D' as const,
                  tip: 'Heavy all-core CPU parallel execution and GPU OptiX/CUDA compute speed during path-traced scene rendering and simulation baking.'
                },
                {
                  name: 'Local AI / LLMs & Stable Diffusion',
                  key: 'aiCompute' as const,
                  tip: 'FP16/BF16/INT8 matrix tensor multiplication and VRAM capacity for local AI generation, voice transcription, and offline LLM inferencing.'
                }
              ].map(m => {
                const scoreA = itemA.RadarScores?.[m.key] ?? 50;
                const scoreB = itemB.RadarScores?.[m.key] ?? 50;
                return (
                  <div
                    key={m.key}
                    title={m.tip}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors group/item"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <span className="text-zinc-300 truncate group-hover/item:text-cyan-300 transition-colors">{m.name}</span>
                      <HelpCircle className="w-3 h-3 text-zinc-500 group-hover/item:text-cyan-400 shrink-0 opacity-70 group-hover/item:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-bold ${scoreA >= scoreB ? 'text-cyan-400' : 'text-zinc-400'}`}>
                        {scoreA}
                      </span>
                      <span className="text-zinc-600">vs</span>
                      <span className={`font-bold ${scoreB >= scoreA ? 'text-purple-400' : 'text-zinc-400'}`}>
                        {scoreB}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Calculated Verdict Banner */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Strategic Comparison Takeaway
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {valueA > valueB ? (
              <>
                <strong className="text-cyan-400">{itemA.Model}</strong> provides superior rupee-for-rupee value ({valueA} vs {valueB} pts/₹1k).{' '}
              </>
            ) : (
              <>
                <strong className="text-purple-400">{itemB.Model}</strong> provides superior rupee-for-rupee value ({valueB} vs {valueA} pts/₹1k).{' '}
              </>
            )}
            {itemA.Benchmark_Score > itemB.Benchmark_Score ? (
              <>
                For users seeking maximum performance without budget boundaries, <strong className="text-cyan-400">{itemA.Model}</strong> leads by{' '}
                <span className="text-emerald-400 font-mono font-bold">+{benchDiff.diffPct}%</span>.
              </>
            ) : (
              <>
                For users seeking maximum performance without budget boundaries, <strong className="text-purple-400">{itemB.Model}</strong> leads by{' '}
                <span className="text-emerald-400 font-mono font-bold">+{benchDiff.diffPct}%</span>.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual metric comparison row with animated delta bars and architectural hover tooltip
interface MetricRowProps {
  label: string;
  subLabel: string;
  valA: string;
  valB: string;
  winner: 'A' | 'B' | 'tie';
  diffPct: number;
  barPercentA: number;
  barPercentB: number;
  isInverse?: boolean;
  index?: number;
  triggerKey?: string | number;
  metricKey?: string;
}

const MetricRow: React.FC<MetricRowProps> = ({
  label,
  subLabel,
  valA,
  valB,
  winner,
  diffPct,
  barPercentA,
  barPercentB,
  isInverse,
  index = 0,
  triggerKey = 0,
  metricKey
}) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipData = metricKey ? METRIC_LEXICON[metricKey] : undefined;

  return (
    <motion.div
      key={`${triggerKey}-${label}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors space-y-2 relative group"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="relative inline-flex items-center">
          <div
            className="flex items-center gap-1.5 cursor-pointer select-none group/title"
            onMouseEnter={() => setIsTooltipOpen(true)}
            onMouseLeave={() => setIsTooltipOpen(false)}
            onClick={() => setIsTooltipOpen(prev => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsTooltipOpen(prev => !prev);
              }
            }}
          >
            <span className={`text-sm font-semibold text-white group-hover/title:text-cyan-300 transition-colors ${
              tooltipData ? 'border-b border-dashed border-zinc-600 group-hover/title:border-cyan-400' : ''
            }`}>
              {label}
            </span>
            {tooltipData && (
              <span
                className="p-0.5 rounded text-zinc-400 group-hover/title:text-cyan-400 group-hover/title:bg-zinc-800/80 transition-all inline-flex items-center"
                title="Hover or click for technical & gaming significance"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <span className="text-[11px] text-zinc-400 hidden sm:inline ml-1.5">&bull; {subLabel}</span>

          {/* Rich Silicon & Gaming Significance Floating Card */}
          <AnimatePresence>
            {isTooltipOpen && tooltipData && (
              <motion.div
                initial={{ opacity: 0, y: index <= 1 ? -6 : 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: index <= 1 ? -6 : 6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className={`absolute z-50 w-80 sm:w-96 p-4 rounded-xl bg-zinc-950/95 border border-cyan-500/50 shadow-[0_16px_40px_rgba(0,0,0,0.9)] backdrop-blur-xl pointer-events-auto text-left space-y-2.5 ${
                  index <= 1 ? 'top-full mt-2 left-0 sm:left-2' : 'bottom-full mb-2 left-0 sm:left-2'
                }`}
                onMouseEnter={() => setIsTooltipOpen(true)}
                onMouseLeave={() => setIsTooltipOpen(false)}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2">
                  <div className="space-y-0.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 uppercase">
                      {tooltipData.tag}
                    </span>
                    <h4 className="text-xs font-bold text-white font-mono leading-snug">
                      {tooltipData.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTooltipOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded cursor-pointer"
                    aria-label="Close tooltip"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Technical Definition */}
                <div className="text-xs text-zinc-300 leading-relaxed space-y-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">
                    Technical Significance:
                  </span>
                  <p className="text-zinc-300">{tooltipData.definition}</p>
                </div>

                {/* Gaming Significance Box */}
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold font-mono uppercase">
                    <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Gaming Impact & Architecture:</span>
                  </div>
                  <p className="text-[11px] text-zinc-200 leading-relaxed">
                    {tooltipData.gamingSignificance}
                  </p>
                </div>

                {/* Pro-Tip */}
                <div className="flex items-start gap-1.5 text-[10px] font-mono text-cyan-300 pt-0.5 border-t border-zinc-800/80">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    <strong className="text-yellow-300">Rule of Thumb:</strong> {tooltipData.architecturalTip}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {winner !== 'tie' && (
          <motion.span
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, delay: index * 0.04 + 0.15 }}
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1 self-start sm:self-auto ${
              winner === 'A'
                ? 'bg-cyan-950/60 border-cyan-700/50 text-cyan-300'
                : 'bg-purple-950/60 border-purple-700/50 text-purple-300'
            }`}
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>{winner === 'A' ? 'Challenger A' : 'Challenger B'} leads by</span>
            <span className="font-extrabold text-emerald-400">+{diffPct}%</span>
          </motion.span>
        )}
      </div>

      <div className="grid grid-cols-12 gap-3 items-center pt-1">
        {/* Value A */}
        <div className="col-span-3 text-left">
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 + 0.05 }}
            className={`text-xs font-mono font-bold block truncate ${
              winner === 'A' ? 'text-cyan-400 font-black drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-zinc-400'
            }`}
          >
            {valA}
          </motion.span>
        </div>

        {/* Dual Progress Bars with Center-Out Slide Transition */}
        <div className="col-span-6 flex items-center gap-2 relative">
          {/* Bar A (Slides in from center to left) */}
          <div className="w-1/2 h-3 rounded-full bg-zinc-900/90 border border-zinc-800/80 overflow-hidden flex justify-end relative">
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${Math.max(barPercentA, 8)}%`, opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 + 0.08 }}
              className={`h-full rounded-full relative overflow-hidden ${
                winner === 'A'
                  ? 'bg-gradient-to-l from-cyan-400 via-cyan-500 to-sky-600 shadow-[0_0_12px_rgba(6,182,212,0.7)]'
                  : 'bg-zinc-700'
              }`}
            >
              {/* Animated Light Sheen */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 0.7, delay: index * 0.04 + 0.3, ease: 'easeOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-12 pointer-events-none"
              />
            </motion.div>
          </div>

          {/* Center Dividing Notch */}
          <div className="w-1 h-3 rounded-full bg-zinc-700 shrink-0" />

          {/* Bar B (Slides in from center to right) */}
          <div className="w-1/2 h-3 rounded-full bg-zinc-900/90 border border-zinc-800/80 overflow-hidden flex justify-start relative">
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${Math.max(barPercentB, 8)}%`, opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 + 0.08 }}
              className={`h-full rounded-full relative overflow-hidden ${
                winner === 'B'
                  ? 'bg-gradient-to-r from-purple-400 via-purple-500 to-fuchsia-600 shadow-[0_0_12px_rgba(168,85,247,0.7)]'
                  : 'bg-zinc-700'
              }`}
            >
              {/* Animated Light Sheen */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 0.7, delay: index * 0.04 + 0.3, ease: 'easeOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-12 pointer-events-none"
              />
            </motion.div>
          </div>
        </div>

        {/* Value B */}
        <div className="col-span-3 text-right">
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 + 0.05 }}
            className={`text-xs font-mono font-bold block truncate ${
              winner === 'B' ? 'text-purple-400 font-black drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'text-zinc-400'
            }`}
          >
            {valB}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};
