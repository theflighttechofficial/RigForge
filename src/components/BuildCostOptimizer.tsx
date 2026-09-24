import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  OBJECTIVE_PROFILES,
  BuildObjective,
  ObjectiveProfile,
  generateOptimizedBuild,
  OptimizedBuildResult
} from '../data/costOptimizerData';
import { CPUItem, GPUItem } from '../types';
import { formatINR } from '../utils/formatters';
import {
  Calculator,
  Gamepad2,
  Brain,
  Film,
  Video,
  Box,
  Scale,
  Sparkles,
  PieChart,
  DollarSign,
  Cpu,
  Tv,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Layers,
  Wrench,
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface BuildCostOptimizerProps {
  cpus: CPUItem[];
  gpus: GPUItem[];
  onNavigateToBuilder?: (presetId?: string) => void;
  theme?: 'dark' | 'light';
}

const PRESET_BUDGETS = [50000, 80000, 100000, 150000, 250000, 400000];

export const BuildCostOptimizer: React.FC<BuildCostOptimizerProps> = ({
  cpus,
  gpus,
  onNavigateToBuilder,
  theme = 'dark'
}) => {
  const [budgetINR, setBudgetINR] = useState<number>(100000);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<BuildObjective>('gaming');
  const [compareMode, setCompareMode] = useState<boolean>(false);

  // Active Objective Profile
  const activeObjective = useMemo(() => {
    return OBJECTIVE_PROFILES.find((o) => o.id === selectedObjectiveId) || OBJECTIVE_PROFILES[0];
  }, [selectedObjectiveId]);

  // Primary Build Result
  const optimizedBuild = useMemo(() => {
    return generateOptimizedBuild(budgetINR, activeObjective, cpus, gpus);
  }, [budgetINR, activeObjective, cpus, gpus]);

  // Side-by-Side Comparison Builds (Gaming vs Editing vs AI)
  const comparisonBuilds = useMemo(() => {
    return OBJECTIVE_PROFILES.map((obj) => generateOptimizedBuild(budgetINR, obj, cpus, gpus));
  }, [budgetINR, cpus, gpus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                Financial Allocation Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                BUDGET OPTIMIZER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Workload-Driven Build Cost Optimizer
            </h1>
          </div>
        </div>

        {/* Compare Mode Toggle */}
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            compareMode
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
        >
          <PieChart className="w-4 h-4 text-emerald-400" />
          <span>Compare All Objectives Side-by-Side: {compareMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* INPUT CONTROLS: BUDGET SLIDER & CHIPS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
              1. Enter Target Budget (₹ INR)
            </label>
            <div className="text-3xl font-black text-emerald-400 mt-1">
              {formatINR(budgetINR)}
            </div>
          </div>

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_BUDGETS.map((amt) => (
              <button
                key={amt}
                onClick={() => setBudgetINR(amt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  budgetINR === amt
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                }`}
              >
                {formatINR(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={40000}
            max={500000}
            step={5000}
            value={budgetINR}
            onChange={(e) => setBudgetINR(Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-zinc-500">
            <span>₹40,000 (Entry)</span>
            <span>₹1,00,000 (Popular Sweet Spot)</span>
            <span>₹2,50,000 (High-End)</span>
            <span>₹5,00,000 (Extreme Enthusiast)</span>
          </div>
        </div>
      </div>

      {/* OBJECTIVE SELECTOR TABS */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
          2. Select Primary Workload Objective
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {OBJECTIVE_PROFILES.map((profile) => {
            const isSelected = selectedObjectiveId === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => setSelectedObjectiveId(profile.id)}
                className={`p-4 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-xl shadow-emerald-500/10'
                    : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    OBJECTIVE
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                </div>
                <strong className="text-sm font-extrabold text-white leading-tight block">
                  {profile.title}
                </strong>
                <span className="text-[11px] text-zinc-500 font-mono">
                  GPU: {profile.allocations.gpuPct}% &bull; CPU: {profile.allocations.cpuPct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN SINGLE BUILD ALLOCATION BREAKDOWN (When Compare Mode OFF) */}
      {!compareMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: PERCENTAGE ALLOCATION CHART (5 COLS) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-xl">
            <div className="space-y-1 border-b border-zinc-800 pb-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
                PERCENTAGE ALLOCATION SPLIT
              </span>
              <h2 className="text-xl font-extrabold text-white">{activeObjective.title}</h2>
              <p className="text-xs text-zinc-400">{activeObjective.priorityNote}</p>
            </div>

            {/* Component Allocation Bars */}
            <div className="space-y-3.5 text-xs">
              {/* GPU */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-white">Graphics Card (GPU)</span>
                  <span className="text-emerald-400 font-extrabold">
                    {activeObjective.allocations.gpuPct}% ({formatINR(optimizedBuild.allocatedInr.gpu)})
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${activeObjective.allocations.gpuPct}%` }}
                  />
                </div>
              </div>

              {/* CPU */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-white">Processor (CPU)</span>
                  <span className="text-cyan-400 font-extrabold">
                    {activeObjective.allocations.cpuPct}% ({formatINR(optimizedBuild.allocatedInr.cpu)})
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${activeObjective.allocations.cpuPct}%` }}
                  />
                </div>
              </div>

              {/* RAM */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-white">System Memory (RAM)</span>
                  <span className="text-purple-400 font-extrabold">
                    {activeObjective.allocations.ramPct}% ({formatINR(optimizedBuild.allocatedInr.ram)})
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full"
                    style={{ width: `${activeObjective.allocations.ramPct}%` }}
                  />
                </div>
              </div>

              {/* SSD */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-white">NVMe Storage (SSD)</span>
                  <span className="text-amber-400 font-extrabold">
                    {activeObjective.allocations.ssdPct}% ({formatINR(optimizedBuild.allocatedInr.ssd)})
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${activeObjective.allocations.ssdPct}%` }}
                  />
                </div>
              </div>

              {/* Motherboard */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-white">Motherboard</span>
                  <span className="text-blue-400 font-extrabold">
                    {activeObjective.allocations.boardPct}% ({formatINR(optimizedBuild.allocatedInr.board)})
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${activeObjective.allocations.boardPct}%` }}
                  />
                </div>
              </div>

              {/* PSU & Case */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 block">Power Supply (PSU)</span>
                  <span className="font-bold text-white">
                    {activeObjective.allocations.psuPct}% ({formatINR(optimizedBuild.allocatedInr.psu)})
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 block">Chassis Cabinet</span>
                  <span className="font-bold text-white">
                    {activeObjective.allocations.casePct}% ({formatINR(optimizedBuild.allocatedInr.case)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: RECOMMENDED HARDWARE LIST FOR THIS BUDGET (7 COLS) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-zinc-950 border-2 border-emerald-500/30 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest block">
                  RECOMMENDED SILICON HARDWARE
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  Target Budget: {formatINR(budgetINR)}
                </h2>
              </div>
              <button
                onClick={() => onNavigateToBuilder?.()}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center gap-2 hover:bg-emerald-400 transition-all cursor-pointer"
              >
                <Wrench className="w-4 h-4" />
                <span>Open Rig Architect</span>
              </button>
            </div>

            {/* Hardware List Cards */}
            <div className="space-y-3 text-xs">
              {/* CPU */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase block">PROCESSOR (CPU)</span>
                  <span className="font-bold text-white text-sm">{optimizedBuild.recommendedParts.cpu.Model}</span>
                </div>
                <span className="font-bold font-mono text-emerald-400">
                  {formatINR(optimizedBuild.recommendedParts.cpu.Price_INR)}
                </span>
              </div>

              {/* GPU */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">GRAPHICS CARD (GPU)</span>
                  <span className="font-bold text-white text-sm">{optimizedBuild.recommendedParts.gpu.Model}</span>
                </div>
                <span className="font-bold font-mono text-emerald-400">
                  {formatINR(optimizedBuild.recommendedParts.gpu.Price_INR)}
                </span>
              </div>

              {/* RAM */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-purple-400 font-bold uppercase block">SYSTEM MEMORY (RAM)</span>
                  <span className="font-bold text-white text-sm">{optimizedBuild.recommendedParts.ramModel}</span>
                </div>
                <span className="font-bold font-mono text-emerald-400">
                  {formatINR(optimizedBuild.recommendedParts.ramPriceINR)}
                </span>
              </div>

              {/* SSD */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">NVME STORAGE</span>
                  <span className="font-bold text-white text-sm">{optimizedBuild.recommendedParts.ssdModel}</span>
                </div>
                <span className="font-bold font-mono text-emerald-400">
                  {formatINR(optimizedBuild.recommendedParts.ssdPriceINR)}
                </span>
              </div>

              {/* Motherboard, PSU, Case */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex justify-between text-zinc-300">
                  <span>Motherboard: <strong className="text-white">{optimizedBuild.recommendedParts.boardModel}</strong></span>
                  <span className="text-emerald-400 font-bold">{formatINR(optimizedBuild.recommendedParts.boardPriceINR)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Power Supply: <strong className="text-white">{optimizedBuild.recommendedParts.psuModel}</strong></span>
                  <span className="text-emerald-400 font-bold">{formatINR(optimizedBuild.recommendedParts.psuPriceINR)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Cabinet: <strong className="text-white">{optimizedBuild.recommendedParts.caseModel}</strong></span>
                  <span className="text-emerald-400 font-bold">{formatINR(optimizedBuild.recommendedParts.casePriceINR)}</span>
                </div>
              </div>
            </div>

            {/* Total Spend Summary */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 block">Total Calculated Expenditure</span>
                <span className="text-lg font-black text-white">{formatINR(optimizedBuild.totalActualINR)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400 block">Contingency Buffer</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatINR(optimizedBuild.remainingBufferINR)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SIDE-BY-SIDE ALLOCATION COMPARISON TABLE (When Compare Mode ON) */
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-2xl overflow-x-auto">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-extrabold text-white">
              Side-by-Side Objective Comparison for {formatINR(budgetINR)}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Compare how component allocations shift across Gaming, AI, Video Editing, Streaming, and Rendering.
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[11px]">
                <th className="py-3 px-2">Objective</th>
                <th className="py-3 px-2 text-emerald-400">GPU % (Spend)</th>
                <th className="py-3 px-2 text-cyan-400">CPU % (Spend)</th>
                <th className="py-3 px-2 text-purple-400">RAM % (Spend)</th>
                <th className="py-3 px-2 text-amber-400">SSD % (Spend)</th>
                <th className="py-3 px-2 text-white">Recommended CPU</th>
                <th className="py-3 px-2 text-white">Recommended GPU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {comparisonBuilds.map((res) => (
                <tr key={res.objective.id} className="hover:bg-zinc-950/60 transition-colors">
                  <td className="py-3.5 px-2 font-bold text-white flex items-center gap-2">
                    <span>{res.objective.title}</span>
                  </td>
                  <td className="py-3.5 px-2 text-emerald-300 font-bold">
                    {res.objective.allocations.gpuPct}% ({formatINR(res.allocatedInr.gpu)})
                  </td>
                  <td className="py-3.5 px-2 text-cyan-300 font-bold">
                    {res.objective.allocations.cpuPct}% ({formatINR(res.allocatedInr.cpu)})
                  </td>
                  <td className="py-3.5 px-2 text-purple-300 font-bold">
                    {res.objective.allocations.ramPct}% ({formatINR(res.allocatedInr.ram)})
                  </td>
                  <td className="py-3.5 px-2 text-amber-300 font-bold">
                    {res.objective.allocations.ssdPct}% ({formatINR(res.allocatedInr.ssd)})
                  </td>
                  <td className="py-3.5 px-2 text-white">{res.recommendedParts.cpu.Model}</td>
                  <td className="py-3.5 px-2 text-white">{res.recommendedParts.gpu.Model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
