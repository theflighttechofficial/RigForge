import React, { useState, useMemo } from 'react';
import { CPUItem, GPUItem, ResolutionMode } from '../types';
import { calculateUpgradeROI, formatINR } from '../utils/formatters';
import {
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  IndianRupee,
  Cpu,
  Monitor,
  CheckCircle,
  AlertCircle,
  Clock,
  Gauge,
  ShieldAlert,
  AlertTriangle,
  HardDrive,
  Layers
} from 'lucide-react';

interface UpgradeROIProps {
  cpus: CPUItem[];
  gpus: GPUItem[];
}

export const UpgradeROI: React.FC<UpgradeROIProps> = ({ cpus, gpus }) => {
  // Current Rig
  const [currentCpuId, setCurrentCpuId] = useState<string>('cpu-intel-8700k');
  const [currentGpuId, setCurrentGpuId] = useState<string>('gpu-nvidia-1060');

  // Next / Target Rig
  const [targetCpuId, setTargetCpuId] = useState<string>('cpu-amd-7800x3d');
  const [targetGpuId, setTargetGpuId] = useState<string>('gpu-nvidia-4070-super');

  const [resolution, setResolution] = useState<ResolutionMode>('1440p');

  const currentCpu = useMemo(() => cpus.find(c => c.id === currentCpuId) || cpus[0], [cpus, currentCpuId]);
  const currentGpu = useMemo(() => gpus.find(g => g.id === currentGpuId) || gpus[0], [gpus, currentGpuId]);

  const targetCpu = useMemo(() => cpus.find(c => c.id === targetCpuId) || cpus[0], [cpus, targetCpuId]);
  const targetGpu = useMemo(() => gpus.find(g => g.id === targetGpuId) || gpus[0], [gpus, targetGpuId]);

  const roi = useMemo(() => {
    return calculateUpgradeROI(currentCpu, currentGpu, targetCpu, targetGpu, resolution);
  }, [currentCpu, currentGpu, targetCpu, targetGpu, resolution]);

  // VRAM Bottleneck Hard-Wall Indicator
  const vramAnalysis = useMemo(() => {
    const targetVram = targetGpu.VRAM_GB;
    const currentVram = currentGpu.VRAM_GB;
    const reqVram = resolution === '4K' ? 16 : resolution === '1440p' ? 12 : 8;
    const isVramDeficit = targetVram < reqVram;
    const isLateralVram = targetVram <= currentVram;

    let severity: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
    if (targetVram <= 8 && (resolution === '1440p' || resolution === '4K')) {
      severity = 'CRITICAL';
    } else if (isVramDeficit || (isLateralVram && currentVram <= 8)) {
      severity = 'WARNING';
    }

    return {
      targetVram,
      currentVram,
      reqVram,
      isVramDeficit,
      isLateralVram,
      severity,
      saturationPct: Math.min(180, Math.round((reqVram / Math.max(1, targetVram)) * 100))
    };
  }, [targetGpu, currentGpu, resolution]);

  // Quick Preset Scenarios
  const applyPreset = (cCpu: string, cGpu: string, tCpu: string, tGpu: string, res: ResolutionMode) => {
    setCurrentCpuId(cCpu);
    setCurrentGpuId(cGpu);
    setTargetCpuId(tCpu);
    setTargetGpuId(tGpu);
    setResolution(res);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Investment & Frame Uplift Analysis
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Generational Upgrade ROI & "Worth-It?" Engine
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Select your existing PC and evaluate whether upgrading yields a transformative generational leap, or whether you should wait for future silicon.
          </p>
        </div>

        {/* Target Resolution */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {(['1080p', '1440p', '4k'] as ResolutionMode[]).map(res => (
            <button
              key={res}
              onClick={() => setResolution(res)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                resolution === res
                  ? 'bg-cyan-500 text-zinc-950 shadow-glow-cyan'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Comparison Presets */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
        <span className="text-zinc-500 whitespace-nowrap text-[11px]">Popular Upgrade Paths:</span>
        <button
          onClick={() => applyPreset('cpu-amd-fx8350', 'gpu-amd-580', 'cpu-amd-5600', 'gpu-amd-6600', '1080p')}
          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 whitespace-nowrap"
        >
          2014 Vintage (FX-8350) ➔ 2024 Budget 1080p
        </button>
        <button
          onClick={() => applyPreset('cpu-intel-8700k', 'gpu-nvidia-1060', 'cpu-amd-7600', 'gpu-nvidia-4060', '1080p')}
          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-cyan-400 whitespace-nowrap"
        >
          GTX 1060 Era ➔ Modern RTX 4060
        </button>
        <button
          onClick={() => applyPreset('cpu-amd-3600', 'gpu-nvidia-2060', 'cpu-amd-7800x3d', 'gpu-nvidia-4070-super', '1440p')}
          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 whitespace-nowrap font-bold"
        >
          Zen 2 + RTX 2060 ➔ 1440p High Refresh Titan
        </button>
        <button
          onClick={() => applyPreset('cpu-intel-12400f', 'gpu-nvidia-3070', 'cpu-amd-9800x3d', 'gpu-nvidia-4080-super', '4k')}
          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-400 whitespace-nowrap font-bold"
        >
          Mid-Range ➔ Ultra 4K Enthusiast
        </button>
      </div>

      {/* Duel Configurator Grid: Current vs Target */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CURRENT RIG CARD */}
        <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-zinc-400" />
              My Current PC Rig
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              Baseline (0% Delta)
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Current Processor (CPU)</label>
              <select
                value={currentCpuId}
                onChange={(e) => setCurrentCpuId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                {cpus.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.Model} ({c.ReleaseYear}) - {formatINR(c.Price_INR)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Current Graphics Card (GPU)</label>
              <select
                value={currentGpuId}
                onChange={(e) => setCurrentGpuId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                {gpus.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.Model} ({g.VRAM_GB}GB, {g.ReleaseYear})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baseline Output */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-400">Current Projected Avg FPS:</span>
            <span className="text-xl font-black text-zinc-300">{roi.oldFpsEst} FPS</span>
          </div>
        </div>

        {/* TARGET RIG CARD */}
        <div className="rounded-2xl bg-zinc-900/90 border-2 border-emerald-500/50 p-5 space-y-4 backdrop-blur-xl shadow-glow-emerald">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Proposed Upgrade Target
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              +{roi.fpsGainPct}% Performance Leap
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Proposed Processor (CPU)</label>
              <select
                value={targetCpuId}
                onChange={(e) => setTargetCpuId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {cpus.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.Model} - {formatINR(c.Price_INR)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Proposed Graphics Card (GPU)</label>
              <select
                value={targetGpuId}
                onChange={(e) => setTargetGpuId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {gpus.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.Model} ({g.VRAM_GB}GB) - {formatINR(g.Price_INR)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Upgraded Output */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-400">Target Projected Avg FPS:</span>
            <span className="text-xl font-black text-emerald-400">{roi.newFpsEst} FPS</span>
          </div>
        </div>
      </div>

      {/* VRAM Bottleneck Hard-Wall Indicator */}
      <div
        className={`rounded-2xl border p-5 backdrop-blur-xl transition-all shadow-xl ${
          vramAnalysis.severity === 'CRITICAL'
            ? 'bg-rose-950/40 border-rose-600/60 shadow-rose-950/50'
            : vramAnalysis.severity === 'WARNING'
            ? 'bg-amber-950/30 border-amber-600/50'
            : 'bg-zinc-900/90 border-zinc-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                vramAnalysis.severity === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : vramAnalysis.severity === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  VRAM Bottleneck & Texture Streaming Hard-Wall
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                    vramAnalysis.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : vramAnalysis.severity === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {vramAnalysis.severity === 'CRITICAL'
                    ? 'Hard-Wall Risk: High'
                    : vramAnalysis.severity === 'WARNING'
                    ? 'Caution: Low Headroom'
                    : 'VRAM Safe'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Target GPU: {targetGpu.Model} ({vramAnalysis.targetVram}GB) @ {resolution} Native Gaming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-zinc-500 block text-[10px]">AAA VRAM Pressure:</span>
              <span
                className={`font-black text-sm ${
                  vramAnalysis.severity === 'CRITICAL'
                    ? 'text-rose-400'
                    : vramAnalysis.severity === 'WARNING'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {vramAnalysis.saturationPct}% Saturation
              </span>
            </div>
          </div>
        </div>

        {/* VRAM Meter Visualizer */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">
              Installed VRAM: <strong className="text-white">{vramAnalysis.targetVram} GB</strong>
            </span>
            <span className="text-zinc-400">
              AAA Demand @ {resolution}:{' '}
              <strong
                className={
                  vramAnalysis.reqVram > vramAnalysis.targetVram ? 'text-rose-400' : 'text-emerald-400'
                }
              >
                ~{vramAnalysis.reqVram} GB Recommended
              </strong>
            </span>
          </div>
          <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800 flex">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                vramAnalysis.severity === 'CRITICAL'
                  ? 'bg-rose-500 shadow-glow-rose'
                  : vramAnalysis.severity === 'WARNING'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (vramAnalysis.targetVram / 16) * 100)}%` }}
            />
          </div>
        </div>

        {/* Narrative Diagnostics */}
        <div className="mt-4 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs space-y-2">
          {vramAnalysis.severity === 'CRITICAL' ? (
            <div className="flex items-start gap-2.5 text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold font-mono text-rose-300 block">
                  Severe 8GB VRAM Hard-Wall at {resolution} Detected!
                </span>
                <p className="text-zinc-300 leading-relaxed">
                  Modern AAA titles (such as Cyberpunk 2077, The Last of Us, Hogwarts Legacy, and Alan Wake 2)
                  require <strong>10GB–12GB+</strong> for high-resolution mipmap textures and raytracing BVH buffers.
                  At 8GB, overflow assets spill over the PCIe bus into system DDR RAM, leading to massive 1% low frame
                  drops (-35% to -50%), texture pop-in, and microstuttering.
                </p>
                <div className="pt-1 text-[11px] text-amber-300 font-mono">
                  💡 <strong>Architect Recommendation:</strong> For {resolution}, consider a minimum of 12GB VRAM (e.g. RTX 4070 Super 12GB or Radeon RX 7700 XT 12GB / RX 7800 XT 16GB) to avoid obsolete frame buffers within 18 months.
                </div>
              </div>
            </div>
          ) : vramAnalysis.isLateralVram && vramAnalysis.targetVram <= 8 ? (
            <div className="flex items-start gap-2.5 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold font-mono text-amber-300 block">
                  Lateral VRAM Trap ({vramAnalysis.currentVram}GB ➔ {vramAnalysis.targetVram}GB)
                </span>
                <p className="text-zinc-300 leading-relaxed">
                  You are spending {formatINR(roi.costINR)} but maintaining the exact same {vramAnalysis.targetVram}GB VRAM capacity. Enabling Frame Generation (DLSS 3 / FSR 3) consumes an extra 1.5GB to 2GB of VRAM overhead, immediately choking 8GB buffers in next-gen titles.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-emerald-400">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-zinc-300 leading-relaxed">
                <strong>VRAM Buffer Healthy:</strong> {vramAnalysis.targetVram}GB VRAM provides adequate headroom for {resolution} rasterization, ultra textures, and DLSS/FSR frame generation without PCIe memory thrashing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* The Verdict Box */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Average FPS Gain</span>
            <div className="text-3xl font-black font-mono text-emerald-400">
              +{roi.fpsGainPct}%
            </div>
            <span className="text-[10px] text-zinc-400 block">
              {roi.oldFpsEst} FPS ➔ {roi.newFpsEst} FPS
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Hardware Investment</span>
            <div className="text-2xl font-black font-mono text-cyan-400">
              {formatINR(roi.costINR)}
            </div>
            <span className="text-[10px] text-zinc-400 block">
              Combined CPU & GPU retail
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Cost-Per-Percent Gain</span>
            <div className="text-2xl font-black font-mono text-amber-400">
              ₹{roi.costPerPercentGain}
            </div>
            <span className="text-[10px] text-zinc-400 block">
              Investment per 1% FPS uplift
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Upgrade Recommendation</span>
            <div
              className={`text-sm font-black uppercase tracking-wider ${
                roi.verdict === 'NO_BRAINER'
                  ? 'text-emerald-400'
                  : roi.verdict === 'SOLID_LEAP'
                  ? 'text-cyan-400'
                  : roi.verdict === 'MODERATE'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {roi.verdictTitle}
            </div>
            <span className="text-[10px] text-zinc-400 block line-clamp-1">
              {roi.verdict === 'NO_BRAINER' ? 'Exceptional value proposition' : 'Analyzed by matrix engine'}
            </span>
          </div>
        </div>

        {/* Narrative Verdict Explanation */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-3">
          {roi.verdict === 'NO_BRAINER' || roi.verdict === 'SOLID_LEAP' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white font-mono">{roi.verdictTitle}</h4>
            <p className="text-xs text-zinc-300 leading-relaxed">{roi.verdictSummary}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
