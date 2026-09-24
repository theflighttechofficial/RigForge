import React from 'react';
import { ActiveTab, ComponentCategory } from '../types';
import { budgetPresets } from '../data/presetData';
import { formatINR } from '../utils/formatters';
import {
  Cpu,
  Monitor,
  Zap,
  GitCompare,
  GitMerge,
  TrendingUp,
  Calculator,
  Database,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Play,
  Gauge,
  Compass,
  Laptop,
  BookOpen,
  Box,
  Stethoscope,
  HardDrive,
  Trophy,
  Users
} from 'lucide-react';

interface IntroPageProps {
  onEnterWorkspace: (targetTab: ActiveTab, targetCategory?: ComponentCategory) => void;
  onSelectPreset: (presetId: string) => void;
  totalCpus: number;
  totalGpus: number;
}

export const IntroPage: React.FC<IntroPageProps> = ({
  onEnterWorkspace,
  onSelectPreset,
  totalCpus,
  totalGpus
}) => {
  return (
    <div className="w-full space-y-12 animate-in fade-in duration-300">
      {/* Main Content Area */}
      <div className="space-y-12">
        {/* Hero Banner Section */}
        <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-8 sm:p-12 lg:p-14 overflow-hidden shadow-2xl text-center space-y-8">
          {/* Futuristic Ambient Glows */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Status Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-800/90 border border-zinc-700 text-xs font-mono text-zinc-300 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Architecture & Diagnostic Documentation Guide</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-cyan-400 font-semibold">Indian Retail Street Pricing (INR ₹)</span>
          </div>

          {/* Main Title & Lead */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              PC Hardware Performance <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                Matrix & Synergy Engine
              </span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-zinc-300 leading-relaxed max-w-3xl mx-auto">
              The definitive architectural diagnostic platform for Indian gamers, enthusiasts, and system builders.
              Analyze instruction pipelines, benchmark radar distributions, power tariffs, adverse bottleneck physics, and upgrade ROI across {totalCpus + totalGpus}+ processors and graphics cards.
            </p>
          </div>

          {/* Clean Primary Launch CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onEnterWorkspace('digitaltwin')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer hover:scale-105 active:scale-95"
              id="btn-intro-digital-twin"
            >
              <Laptop className="w-4 h-4 text-black" />
              <span>My Rig (Digital Twin)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onEnterWorkspace('doctor')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs sm:text-sm transition-all border border-cyan-500/40 cursor-pointer shadow-md shadow-cyan-500/10 hover:scale-105 active:scale-95"
              id="btn-intro-build-doctor"
            >
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <span>AI Build Doctor</span>
            </button>

            <button
              onClick={() => onEnterWorkspace('matrix')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm transition-all border border-zinc-700 cursor-pointer hover:border-cyan-500/50 hover:scale-105 active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Explore 2D Value Matrix</span>
            </button>
          </div>

          {/* Live Silicon Metrics Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 text-left">
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-cyan-400">
                <Cpu className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">Desktop CPUs</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">{totalCpus} Processors</div>
              <div className="text-[11px] text-zinc-500 font-mono">2007 Retro to 2025 Flagships</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-purple-400">
                <Monitor className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">Graphics Cards</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">{totalGpus} GPUs</div>
              <div className="text-[11px] text-zinc-500 font-mono">NVIDIA, AMD & Intel Arc</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <Layers className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">Workload Axes</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">6 Workloads</div>
              <div className="text-[11px] text-zinc-500 font-mono">Esports, RT, AAA, 3D, Video, AI</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-amber-400">
                <Zap className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">Power Modeling</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">7 DISCOMs</div>
              <div className="text-[11px] text-zinc-500 font-mono">State Electric Tariffs & BTU/hr</div>
            </div>
          </div>
        </div>

        {/* Core Diagnostic Modules Showcase */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
              Integrated Architectural Engines
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Explore Available Diagnostic Tools
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Click any module below to jump directly into that workspace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Module 1: Performance Matrix */}
          <div
            onClick={() => onEnterWorkspace('matrix')}
            className="group relative rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 p-6 space-y-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 group-hover:text-cyan-400 flex items-center gap-1">
                Open Matrix <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Performance & Value Matrix
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Interactive price-to-performance scatter plot with the mathematical Pareto efficiency curve. Filter by gaming score, multi-core throughput, or Indian retail budget.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">Pareto Curve</span>
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">INR Price/Pts</span>
            </div>
          </div>

          {/* Module 2: Synergy & Bottleneck Lab */}
          <div
            onClick={() => onEnterWorkspace('synergy')}
            className="group relative rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 p-6 space-y-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <GitMerge className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 group-hover:text-emerald-400 flex items-center gap-1">
                Open Synergy <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Bottleneck & Synergy Lab
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Simulates instruction dispatch vs. graphical raster queue. Identifies adverse generational mismatches (like FX-8350 with an RTX 4090) with real-world game FPS estimates.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">Queue Physics</span>
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">Adverse Detector</span>
            </div>
          </div>

          {/* Module 3: Head-to-Head Duel */}
          <div
            onClick={() => onEnterWorkspace('compare')}
            className="group relative rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 p-6 space-y-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-purple-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <GitCompare className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 group-hover:text-purple-400 flex items-center gap-1">
                Open Duel <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                Head-to-Head Architectural Duel
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Direct component showdown with 6-Axis normalized workload radar visualizer (Esports, AAA 4K, Ray Tracing, 3D Blender, Video Editing, AI Compute).
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">6-Axis Radar</span>
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">Price Delta (₹)</span>
            </div>
          </div>

          {/* Module 4: Rig Architect & PSU Sizing */}
          <div
            onClick={() => onEnterWorkspace('builder')}
            className="group relative rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 p-6 space-y-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-blue-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Calculator className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 group-hover:text-blue-400 flex items-center gap-1">
                Open Architect <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                Rig Architect & PSU Sizing
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Configure your complete gaming rig with CPU, GPU, RAM, storage, and liquid cooling. Evaluates PSU wattage requirements and ATX 3.0 transient spike safety factor.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">12V Rail Margins</span>
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">80+ Cert Tier</span>
            </div>
          </div>

          {/* Module 5: Upgrade ROI Decision Engine */}
          <div
            onClick={() => onEnterWorkspace('roi')}
            className="group relative rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 p-6 space-y-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-amber-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 group-hover:text-amber-400 flex items-center gap-1">
                Open ROI <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                Generational Upgrade ROI
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                "Is this upgrade worth it?" decision engine. Compare your current setup against target chips to calculate FPS uplift, total investment in ₹, and cost per 1% FPS gain.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">₹/1% FPS Gain</span>
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">Verdict Rating</span>
            </div>
          </div>

          {/* Module 6: Running Cost & Thermal Lab */}
          <div
            onClick={() => onEnterWorkspace('cost')}
            className="group relative rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-red-500/50 p-6 space-y-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-red-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 group-hover:text-red-400 flex items-center gap-1">
                Open Thermal Lab <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white group-hover:text-red-300 transition-colors">
                Electricity Cost & Thermal Lab
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Compute monthly and annual electricity expenses based on 7 Indian state DISCOM tariffs. Calculates room thermal expulsion in BTU/hr and required AC cooling capacity.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">DISCOM Tariffs</span>
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">BTU/hr Heat Output</span>
            </div>
          </div>

          {/* Module 7: Live Benchmark Studio & Game Predictor */}
          <div
            onClick={() => onEnterWorkspace('benchmarks')}
            className="group relative rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-400/50 p-6 space-y-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <Gauge className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 group-hover:text-cyan-400 flex items-center gap-1">
                Open Studio <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Benchmark Studio & Game Predictor
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Run simulated passes of 3DMark Time Spy, Cinebench R23, and Blender 4.0. Test real AAA games across 1080p, 1440p, and 4K with DLSS 3.7 & Frame Gen.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">1% Low Pacing</span>
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">3DMark / Cinebench</span>
            </div>
          </div>

          {/* Module 8: 3D Hardware Simulators & Spatial Studio */}
          <div
            onClick={() => onEnterWorkspace('spatial3d')}
            className="group relative rounded-2xl bg-gradient-to-b from-cyan-950/40 to-zinc-900 border border-cyan-700/60 hover:border-cyan-400 p-6 space-y-4 transition-all duration-200 cursor-pointer shadow-xl hover:shadow-cyan-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Box className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                Open Simulators <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Hardware Simulators & 3D Studio
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                RGB & Lighting Sandbox (sync fans, RAM, desk strip), Fan Flow & Radiator Mapping (blue/red CFM vectors), Real-World Clearance Warnings (pulsing red 3D overlap zones), and 1:1 AR floor preview.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-cyan-400">
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">RGB Sandbox</span>
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">Airflow Vectors</span>
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">3D Red Overlap</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ready-to-Build Indian Rig Presets (One-Click Launch) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Turnkey Configurations
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Calibrated Indian Budget Build Presets
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Click "Build & Test Rig" to load directly into the Rig Architect
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgetPresets.slice(0, 6).map((preset) => (
            <div
              key={preset.id}
              className="rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-5 space-y-4 flex flex-col justify-between shadow-xl transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {preset.tierCategory}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {preset.resolutionTier}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white leading-snug">
                    {preset.name}
                  </h4>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                    ~{formatINR(preset.targetBudgetINR)}
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {preset.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-xs font-mono">
                  {preset.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-zinc-300 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectPreset(preset.id)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-cyan-500 hover:text-black text-white font-bold text-xs transition-colors cursor-pointer border border-zinc-700 hover:border-cyan-400"
              >
                <span>Build & Test This Rig</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Adverse Mismatch Warning Feature Teaser */}
      <div className="rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-amber-950/40 border border-red-900/50 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">
            Adverse Hardware Mismatch Diagnostic Engine
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
          Unlike generic bottleneck calculators that show a single misleading percentage, our engine models physical PCIe saturation, DDR3 memory bus limitations, L3 cache starvation, and 1% low frame dips.
          Test pairing a 2012 FX-8350 or Core 2 Quad with an RTX 4090 to see exact frame stutter diagnostics.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => onEnterWorkspace('synergy')}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Launch Adverse Mismatch Tester
          </button>
          <button
            onClick={() => onEnterWorkspace('catalog')}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs transition-colors cursor-pointer border border-zinc-700"
          >
            Browse All {totalCpus + totalGpus} Components
          </button>
        </div>
      </div>

      {/* Explore Tools Quick Switcher Footer Card */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Silicon Matrix Architecture Hub</span>
          </h3>
          <p className="text-xs text-zinc-400 max-w-xl">
            Select any workspace module from the top navigation bar or jump directly to the 2D Value Matrix to evaluate real-time INR price-to-performance curves.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onEnterWorkspace('matrix')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Open 2D Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEnterWorkspace('benchmarks')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs transition-all border border-zinc-700 cursor-pointer"
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Benchmarks</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);
};
