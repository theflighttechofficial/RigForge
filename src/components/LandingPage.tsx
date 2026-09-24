import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CPUItem, GPUItem } from '../types';
import { cpuDataset, gpuDataset } from '../data/hardwareData';
import { formatINR } from '../utils/formatters';
import {
  Cpu,
  Monitor,
  Zap,
  Flame,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  ShieldCheck,
  Gauge,
  Activity,
  Layers,
  ChevronRight,
  BarChart3,
  GitCompare,
  GitMerge,
  Maximize2,
  Wrench,
  TrendingUp,
  SlidersHorizontal,
  Compass,
  Sun,
  Moon,
  Stethoscope,
  Laptop,
  HardDrive,
  Calculator,
  Trophy,
  Users
} from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
  onDirectLaunchWorkspace?: (tab?: string) => void;
  totalCpus: number;
  totalGpus: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunch,
  onDirectLaunchWorkspace,
  totalCpus,
  totalGpus,
  theme = 'dark',
  onToggleTheme
}) => {
  // Interactive Quick-Sim state on the landing page
  const [quickCpuId, setQuickCpuId] = useState<string>('cpu-amd-9950x3d');
  const [quickGpuId, setQuickGpuId] = useState<string>('gpu-nvidia-5090');

  const selectedCpu = useMemo(() => cpuDataset.find(c => c.id === quickCpuId) || cpuDataset[0], [quickCpuId]);
  const selectedGpu = useMemo(() => gpuDataset.find(g => g.id === quickGpuId) || gpuDataset[0], [quickGpuId]);

  // Quick calculate pair bottleneck and predicted 4K FPS
  const quickMetrics = useMemo(() => {
    const cpuPerf = selectedCpu.Benchmark_Score;
    const gpuPerf = selectedGpu.Benchmark_Score;
    const idealRatio = 0.52;
    const actualRatio = cpuPerf / Math.max(1, gpuPerf);
    const deviation = actualRatio - idealRatio;

    let bottleneckType: 'Balanced' | 'CPU Bottleneck' | 'GPU Bottleneck' = 'Balanced';
    let pct = 0;

    if (deviation < -0.15) {
      bottleneckType = 'CPU Bottleneck';
      pct = Math.min(48, Math.round(Math.abs(deviation + 0.15) * 60));
    } else if (deviation > 0.25) {
      bottleneckType = 'GPU Bottleneck';
      pct = Math.min(45, Math.round((deviation - 0.25) * 55));
    } else {
      pct = Math.max(2, Math.round(Math.abs(deviation) * 15));
    }

    // Estimated 4K Ultra FPS in AAA titles
    const isBlackwell = selectedGpu.Architecture.toLowerCase().includes('blackwell') ||
      selectedGpu.Model.includes('5090') || selectedGpu.Model.includes('5080') || selectedGpu.Model.includes('5070');
    const base4kFps = Math.round((gpuPerf / 620) * 0.95);
    const dlss4Fps = isBlackwell ? Math.round(base4kFps * 2.3) : Math.round(base4kFps * 1.72);

    return {
      bottleneckType,
      bottleneckPct: pct,
      est4kRasterFps: Math.max(20, base4kFps),
      estDlssFps: Math.max(35, dlss4Fps),
      isBlackwell,
      combinedWatts: selectedCpu.TDP_Watts + selectedGpu.TGP_Watts + 120
    };
  }, [selectedCpu, selectedGpu]);

  // Handle high-tech launch sequence
  const handleTriggerLaunch = () => {
    onLaunch();
  };

  // Canvas-based interactive particle grid background
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Nodes representing silicon circuit points
    const nodes: Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }> = [];
    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981'];

    const nodeCount = Math.min(45, Math.floor((width * height) / 28000));
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.6 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let t = 0;
    const render = () => {
      t += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        n1.x += n1.vx;
        n1.y += n1.vy;
        if (n1.x < 0 || n1.x > width) n1.vx *= -1;
        if (n1.y < 0 || n1.y > height) n1.vy *= -1;

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius, 0, Math.PI * 2);
        ctx.fillStyle = n1.color;
        ctx.shadowColor = n1.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const isLight = theme === 'light';

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden selection:bg-cyan-500 selection:text-black font-sans transition-colors duration-200 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Dynamic Animated Canvas Grid */}
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 pointer-events-none z-0 ${isLight ? 'opacity-40' : 'opacity-60'}`}
      />

      {/* Cybernetic Radial Glow Overlays */}
      <div className={`fixed top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none z-0 ${isLight ? 'bg-cyan-500/10' : 'bg-cyan-600/15'}`} />
      <div className={`fixed bottom-[-10%] right-[-5%] w-[600px] h-[500px] rounded-full blur-[160px] pointer-events-none z-0 ${isLight ? 'bg-purple-500/10' : 'bg-purple-600/10'}`} />
      <div className={`fixed top-[40%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none z-0 ${isLight ? 'bg-emerald-500/10' : 'bg-emerald-600/10'}`} />

      {/* Top Floating Glass Navigation */}
      <header
        className={`sticky top-0 z-40 w-full border-b backdrop-blur-2xl px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors ${
          isLight
            ? 'border-slate-200/90 bg-white/90 shadow-sm'
            : 'border-zinc-800/80 bg-zinc-950/75'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-xl shadow-sm transition-colors ${
              isLight
                ? 'bg-cyan-50 border border-cyan-200 text-cyan-700'
                : 'bg-cyan-950/90 border border-cyan-500/40 text-cyan-400 shadow-glow-cyan'
            }`}
          >
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-extrabold tracking-tight font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                APEX SILICON LAB
              </span>
              <span
                className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                  isLight
                    ? 'bg-cyan-50 border border-cyan-200 text-cyan-800'
                    : 'bg-cyan-950/90 border border-cyan-500/30 text-cyan-400'
                }`}
              >
                v2.5.0 BLACKWELL & ZEN 5 READY
              </span>
            </div>
            <p className={`text-[11px] font-mono hidden md:block ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Empirical PC Benchmarks, Synergy Physics & Setup Simulator
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className={`hidden lg:flex items-center gap-4 text-xs font-mono pr-2 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {totalCpus} CPUs
            </span>
            <span className={isLight ? 'text-slate-300' : 'text-zinc-700'}>/</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              {totalGpus} GPUs
            </span>
            <span className={isLight ? 'text-slate-300' : 'text-zinc-700'}>/</span>
            <span className={isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400 font-semibold'}>
              INR (₹) Matrix
            </span>
          </div>

          {/* Theme Toggle on Landing Page */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
              }`}
              title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
              aria-label="Toggle visual theme"
            >
              {isLight ? (
                <Moon className="w-4 h-4 text-purple-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span className="hidden sm:inline font-bold">
                {isLight ? 'Dark' : 'Light'}
              </span>
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleTriggerLaunch}
            className="group relative inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-zinc-950 font-bold text-xs sm:text-sm font-mono tracking-wide shadow-lg shadow-cyan-500/25 cursor-pointer hover:shadow-cyan-500/40 transition-all overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>LAUNCH SUITE</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
          </motion.button>
        </div>
      </header>

      {/* Main Landing Canvas */}
      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-12 pt-10 sm:pt-16 pb-24 space-y-16 sm:space-y-24">
        {/* HERO SECTION */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 shadow-inner backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-semibold text-cyan-300 tracking-wider uppercase">
              Blackwell RTX 5090 / 5080 / 5070 & Zen 5 9950X3D Online
            </span>
          </motion.div>

          {/* Master Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]"
          >
            Master PC Benchmarks &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 underline decoration-cyan-500/40 decoration-wavy decoration-2">
              Virtual Setup Simulator
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed"
          >
            Explore 110+ validated CPUs and GPUs with real-world Indian retail pricing (₹),
            2D Pareto value scatter plots, live DLSS 4 game FPS prediction, thermal throttling simulation, and 2D chassis CAD diagnostics.
          </motion.p>

          {/* Master Launch Button Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTriggerLaunch}
              className="relative group w-full sm:w-auto px-8 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-black text-base sm:text-lg tracking-wide shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all cursor-pointer flex items-center justify-center gap-3 overflow-hidden border-2 border-cyan-300"
            >
              {/* Animated Glow Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-white/40 to-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex items-center gap-3">
                <Play className="w-5 h-5 fill-current" />
                <span>LAUNCH SYSTEM & OVERVIEW</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
              </div>
            </motion.button>

            {onDirectLaunchWorkspace && (
              <button
                onClick={() => onDirectLaunchWorkspace('matrix')}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white font-mono text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 backdrop-blur-md"
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Direct to 2D Value Matrix</span>
              </button>
            )}
          </motion.div>

          {/* Fast Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-zinc-400 font-mono"
          >
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              110+ Verified Chips
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              DLSS 4 Multi-Frame Gen
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Thermal Throttling Physics
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              ATX 3.1 & LGA 1851 Ready
            </span>
          </motion.div>
        </div>

        {/* LIVE SILICON TICKER */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-900/60 border border-zinc-800/80 py-3 backdrop-blur-md shadow-lg">
          <div className="flex whitespace-nowrap animate-marquee gap-8 text-xs font-mono">
            <span className="inline-flex items-center gap-2 text-cyan-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" /> RTX 5090 32GB GDDR7 (1,792 GB/s)
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-purple-400 font-bold">
              <Cpu className="w-3.5 h-3.5" /> Ryzen 9 9950X3D (144MB 3D V-Cache)
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-blue-400 font-bold">
              <Zap className="w-3.5 h-3.5" /> Intel Core Ultra 7 265KF (Arrow Lake)
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-cyan-300">
              <Monitor className="w-3.5 h-3.5" /> RTX 5080 16GB (RTX 4090 Raster Killer)
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-emerald-400">
              <Flame className="w-3.5 h-3.5" /> RTX 5070 12GB & RTX 5060 8GB
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-amber-400">
              <Cpu className="w-3.5 h-3.5" /> Core i7-1165G7 Iris Xe & RTX 4050 Laptop
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-pink-400">
              <ShieldCheck className="w-3.5 h-3.5" /> LGA 1851 & AM5 Dual Architecture
            </span>
            <span className="text-zinc-700">|</span>
            {/* Repeated Set for Seamless Loop */}
            <span className="inline-flex items-center gap-2 text-cyan-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" /> RTX 5090 32GB GDDR7 (1,792 GB/s)
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-purple-400 font-bold">
              <Cpu className="w-3.5 h-3.5" /> Ryzen 9 9950X3D (144MB 3D V-Cache)
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-blue-400 font-bold">
              <Zap className="w-3.5 h-3.5" /> Intel Core Ultra 7 265KF (Arrow Lake)
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-cyan-300">
              <Monitor className="w-3.5 h-3.5" /> RTX 5080 16GB (RTX 4090 Raster Killer)
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-emerald-400">
              <Flame className="w-3.5 h-3.5" /> RTX 5070 12GB & RTX 5060 8GB
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-amber-400">
              <Cpu className="w-3.5 h-3.5" /> Core i7-1165G7 Iris Xe & RTX 4050 Laptop
            </span>
            <span className="text-zinc-700">|</span>
            <span className="inline-flex items-center gap-2 text-pink-400">
              <ShieldCheck className="w-3.5 h-3.5" /> LGA 1851 & AM5 Dual Architecture
            </span>
          </div>
        </div>

        {/* INTERACTIVE SILICON QUICK-SIM (Hands-on immediately on landing) */}
        <div className="relative rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-xs font-mono text-cyan-400 mb-2">
                  <Activity className="w-3 h-3" />
                  <span>INTERACTIVE LIVE PREVIEW</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Instant Hardware Synergy & 4K FPS Prototyper
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Select a CPU and GPU to preview real-time bottleneck telemetry, power requirements, and DLSS 4 frame multipliers.
                </p>
              </div>

              <button
                onClick={handleTriggerLaunch}
                className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-cyan-300 border border-zinc-700 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <span>Open Full Overview & Lab</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hardware Selectors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* CPU Selection */}
              <div className="lg:col-span-4 space-y-2">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Choose Processor (CPU)</span>
                </label>
                <select
                  value={quickCpuId}
                  onChange={(e) => setQuickCpuId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  <optgroup label="Latest AMD Ryzen Processors">
                    <option value="cpu-amd-9950x3d">AMD Ryzen 9 9950X3D (16C/32T, 144MB V-Cache)</option>
                    <option value="cpu-amd-7800x3d">AMD Ryzen 7 7800X3D (Gaming Gold Standard)</option>
                    <option value="cpu-amd-9900x">AMD Ryzen 9 9900X (12C/24T Zen 5)</option>
                    <option value="cpu-amd-7600x">AMD Ryzen 5 7600X (AM5 Mainstream)</option>
                    <option value="cpu-amd-5700u">AMD Ryzen 7 5700U (Mobile Ultrabook)</option>
                  </optgroup>
                  <optgroup label="Intel Core & Core Ultra Processors">
                    <option value="cpu-intel-ultra7-265kf">Intel Core Ultra 7 265KF (20C Arrow Lake-S)</option>
                    <option value="cpu-intel-ultra5-245k">Intel Core Ultra 5 245K (14C Arrow Lake-S)</option>
                    <option value="cpu-intel-14700k">Intel Core i7-14700K (20C Raptor Lake)</option>
                    <option value="cpu-intel-i7-1165g7">Intel Core i7-1165G7 (Iris Xe Mobile)</option>
                    <option value="cpu-intel-12400f">Intel Core i5-12400F (Budget King)</option>
                  </optgroup>
                </select>

                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>Socket & TDP:</span>
                    <span className="text-zinc-200">{selectedCpu.Socket} • {selectedCpu.TDP_Watts}W</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Retail Price:</span>
                    <span className="text-emerald-400 font-bold">{formatINR(selectedCpu.Price_INR)}</span>
                  </div>
                </div>
              </div>

              {/* Verses / Synergy Indicator */}
              <div className="lg:col-span-1 flex justify-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold shadow-lg">
                  +
                </div>
              </div>

              {/* GPU Selection */}
              <div className="lg:col-span-4 space-y-2">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <span>Choose Graphics Card (GPU)</span>
                </label>
                <select
                  value={quickGpuId}
                  onChange={(e) => setQuickGpuId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  <optgroup label="NVIDIA RTX 50 Series (Blackwell)">
                    <option value="gpu-nvidia-5090">NVIDIA GeForce RTX 5090 32GB GDDR7</option>
                    <option value="gpu-nvidia-5080">NVIDIA GeForce RTX 5080 16GB GDDR7</option>
                    <option value="gpu-nvidia-5070">NVIDIA GeForce RTX 5070 12GB GDDR7</option>
                    <option value="gpu-nvidia-5060">NVIDIA GeForce RTX 5060 8GB GDDR7</option>
                    <option value="gpu-nvidia-5050">NVIDIA GeForce RTX 5050 8GB GDDR7</option>
                  </optgroup>
                  <optgroup label="NVIDIA RTX 40 & 30 Series">
                    <option value="gpu-nvidia-4090">NVIDIA GeForce RTX 4090 24GB</option>
                    <option value="gpu-nvidia-4070-super">NVIDIA GeForce RTX 4070 Super 12GB</option>
                    <option value="gpu-nvidia-4050-laptop">NVIDIA RTX 4050 Laptop GPU 6GB</option>
                    <option value="gpu-nvidia-3050-6gb">NVIDIA RTX 3050 6GB (70W Slot Power)</option>
                  </optgroup>
                  <optgroup label="AMD Radeon RDNA 3">
                    <option value="gpu-amd-7900-xtx">AMD Radeon RX 7900 XTX 24GB</option>
                    <option value="gpu-amd-7800-xt">AMD Radeon RX 7800 XT 16GB</option>
                  </optgroup>
                </select>

                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>VRAM & Bandwidth:</span>
                    <span className="text-zinc-200">{selectedGpu.VRAM_GB}GB {selectedGpu.Memory_Type} • {selectedGpu.Bandwidth_GBs} GB/s</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Retail Price:</span>
                    <span className="text-emerald-400 font-bold">{formatINR(selectedGpu.Price_INR)}</span>
                  </div>
                </div>
              </div>

              {/* Real-time Telemetry Card */}
              <div className="lg:col-span-3 rounded-2xl bg-zinc-950 border border-cyan-500/40 p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">Pairing State</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    quickMetrics.bottleneckType === 'Balanced'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                  }`}>
                    {quickMetrics.bottleneckType}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-zinc-400">Predicted 4K Cyberpunk (Path Traced):</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-cyan-400 font-mono">
                      {quickMetrics.estDlssFps} <span className="text-xs text-zinc-400 font-normal">FPS</span>
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      (Raster: {quickMetrics.est4kRasterFps} FPS)
                    </span>
                  </div>
                  {quickMetrics.isBlackwell && (
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> DLSS 4 Multi-Frame Gen Active (+130%)
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex justify-between">
                  <span>Recommended PSU:</span>
                  <span className="text-white font-bold">{selectedGpu.Recommended_PSU_Watts}W ATX 3.1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE HIGHLIGHT PILLARS (Bento Grid) */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              A Complete Silicon Diagnostic & Engineering Suite
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
              Built from scratch to eliminate guesswork in PC hardware pairing, component clearance, and performance forecasting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 00: PC Build Digital Twin Centerpiece */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => onDirectLaunchWorkspace?.('digitaltwin')}
              className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-cyan-950/30 border-2 border-cyan-500/50 hover:border-cyan-400 transition-all space-y-3 shadow-xl cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500 text-black font-mono font-black text-[10px] uppercase tracking-wider rounded-bl-xl">
                CENTERPIECE
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">PC Build "Digital Twin"</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">MY RIG</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Save your complete PC as an interactive Digital Twin: exact dimensions, power curves, fan airflow orientation, live telemetry, BIOS/RAM tuning, display ecosystem, and component warranty tracking.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold">
                <span>Open Digital Twin Console</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* Card 0: AI Build Doctor */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => onDirectLaunchWorkspace?.('doctor')}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-cyan-500/30 hover:border-cyan-400 transition-all space-y-3 shadow-lg cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">AI Build Doctor</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">AI DIAGNOSTIC</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Full diagnostic health assistant. Enter your custom configuration (e.g. Ryzen 5 3600 + RTX 4070 + 16GB) to generate resolution balance, platform upgrade paths, and prioritized upgrade rationale.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold">
                <span>Run diagnostic report</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* Storage Performance Lab Card */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => onDirectLaunchWorkspace?.('storagelab')}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-amber-500/30 hover:border-amber-400 transition-all space-y-3 shadow-lg cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Storage Performance Lab</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">LAB</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Compare HDD vs SATA SSD vs PCIe 3/4/5 NVMe. Interactive 100GB file copy races, DirectStorage 1.2 GPU bypass testing, and real-world game loading benchmarks.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-amber-400 font-semibold">
                <span>Launch Storage Lab</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* RAM Configuration Lab Card */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => onDirectLaunchWorkspace?.('ramlab')}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-purple-500/30 hover:border-purple-400 transition-all space-y-3 shadow-lg cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">RAM Configuration Lab</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">PHYSICS ENGINE</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                DDR4 vs DDR5 latency simulator. Adjust frequency, CAS latency (tCL), primary timings, single/dual channels, and memory controller Gear modes (Gear 1 / Gear 2).
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-purple-400 font-semibold">
                <span>Launch RAM Lab</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* Build Cost Optimizer Card */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => onDirectLaunchWorkspace?.('costoptimizer')}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 hover:border-emerald-400 transition-all space-y-3 shadow-lg cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Build Cost Optimizer</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">FINANCIAL ENGINE</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter any budget in ₹ INR (e.g. ₹1,00,000) and explore optimal budget allocation splits across Gaming, AI/ML, Video Editing, Live Streaming, and 3D Rendering.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
                <span>Launch Cost Optimizer</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* PC Build Challenge Card */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => onDirectLaunchWorkspace?.('challengemode')}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-amber-500/30 hover:border-amber-400 transition-all space-y-3 shadow-lg cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">PC Build Challenge</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">GAMIFIED QUESTS</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Complete quests like Challenge #001 (Build a ₹80,000 1440p PC with 32GB RAM & Wi-Fi). Get scored on budget utilization, performance estimate, efficiency, and upgrade headroom!
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-amber-400 font-semibold">
                <span>Start Challenge #001</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* Community Build Gallery Card */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => onDirectLaunchWorkspace?.('community')}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-cyan-500/30 hover:border-cyan-400 transition-all space-y-3 shadow-lg cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Community Build Gallery</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">GITHUB FOR BUILDS</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Browse, publish, and fork custom builds like "Varun's Blackout Build" or "Priya's Local AI Rig". One-click 3D hardware spatial view, upvoting, and build derivative branching.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold">
                <span>Explore Community Gallery</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* PC Troubleshooting Wizard Card */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => onDirectLaunchWorkspace?.('troubleshoot')}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-rose-500/30 hover:border-rose-400 transition-all space-y-3 shadow-lg cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">PC Troubleshooting Wizard</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">DIAGNOSTIC ENGINE</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Interactive decision tree for diagnosing post-build problems: No boot, fans spin without display, random crashes, BSOD stop codes, thermal throttling, GPU artifacting, and SSD degradation.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-rose-400 font-semibold">
                <span>Launch Diagnostic Wizard</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* Card 1: 2D Pareto Matrix */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 transition-all space-y-3 shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">2D Performance & Value Matrix</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Scatter-plot silicon radar analyzing raw performance vs. live Indian retail pricing (₹). Effortlessly identify budget sweet spots and diminishing returns.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold">
                <span>Pareto frontier visualization</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Card 2: Head-to-Head Duel */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-purple-500/40 transition-all space-y-3 shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Architectural Head-to-Head</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Direct side-by-side silicon duel across 6 radar dimensions, transistor densities, memory bandwidths, cache hierarchies, and synthetic workloads.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-purple-400 font-semibold">
                <span>Microarchitecture breakdown</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Card 3: Synergy & Thermal Lab */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 transition-all space-y-3 shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Bottleneck & Thermal Throttling Lab</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Simulate high ambient room temperatures (up to 45°C Indian summer) and monitor dynamic clock throttling, VRM degradation, and score losses.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
                <span>Thermal physics engine</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Card 4: 2D Chassis Simulator */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 transition-all space-y-3 shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Visual 2D Chassis Simulator</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                CAD-inspired motherboard schematic visualizer showing VRM power phases, PCIe 5.0 slot spacing, ATX 3.1 12V-2x6 clearance, and transient spike safety.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-amber-400 font-semibold">
                <span>Physical clearance checks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Card 5: Live Game FPS Predictor */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-sky-500/40 transition-all space-y-3 shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <Gauge className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Game Predictor & DLSS 4 Studio</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Calibrated frame rate projections for Cyberpunk 2077, Black Myth Wukong, Valorant, and Blender with resolution and frame gen multipliers.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-sky-400 font-semibold">
                <span>Empirical frame prediction</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Card 6: Electricity Running Cost Lab */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-pink-500/40 transition-all space-y-3 shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-950/80 border border-pink-500/30 text-pink-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Running Cost & Upgrade ROI</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Calculate state-by-state Indian electricity bills (₹/kWh) based on your daily gaming hours, combined with generational upgrade ROI ratios.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-pink-400 font-semibold">
                <span>TCO & Watt-hour audits</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* BOTTOM LAUNCH DECK */}
        <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-cyan-500/30 p-8 sm:p-12 text-center space-y-6 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-radial from-cyan-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-xs font-mono text-cyan-400 font-semibold">
              READY FOR DEEP DIVE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Begin Your Silicon Hardware Exploration
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Launch directly into the interactive Intro & System Overview page to review the full database, architectural methodologies, and turnkey presets.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleTriggerLaunch}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-black text-base tracking-wide shadow-xl shadow-cyan-500/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>LAUNCH SYSTEM OVERVIEW NOW</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-8 px-4 text-center text-xs font-mono text-zinc-400">
        <p>Apex Silicon Hardware Matrix & Setup Simulator // Built with Empirical Data</p>
      </footer>
    </div>
  );
};
