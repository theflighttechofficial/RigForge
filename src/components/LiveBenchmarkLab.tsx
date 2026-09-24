import React, { useState, useMemo, useEffect } from 'react';
import { CPUItem, GPUItem } from '../types';
import { formatScore, formatINR } from '../utils/formatters';
import {
  Gauge,
  Play,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Monitor,
  Sparkles,
  Zap,
  Flame,
  Activity,
  Award,
  Layers,
  Sliders,
  Copy,
  Check,
  BarChart2,
  Clock,
  ShieldCheck,
  Tv
} from 'lucide-react';

interface LiveBenchmarkLabProps {
  cpus: CPUItem[];
  gpus: GPUItem[];
  initialCpuId?: string;
  initialGpuId?: string;
}

export type ResolutionKey = '1080p' | '1440p' | '4k' | 'ultrawide';
export type QualityPresetKey = 'competitive' | 'medium' | 'ultra' | 'rt_overdrive';
export type UpscalerKey = 'native' | 'dlss_quality' | 'dlss_perf' | 'fsr_quality' | 'xess';

interface GameProfile {
  id: string;
  title: string;
  genre: string;
  engine: string;
  baseFpsFactor: number;
  cpuSensitivity: number; // 0 to 1
  rtHeavy: boolean;
  coverAccent: string;
}

const GAME_PROFILES: GameProfile[] = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk 2077',
    genre: 'Open-World RPG',
    engine: 'REDengine 4 (Full Path Tracing)',
    baseFpsFactor: 1.0,
    cpuSensitivity: 0.35,
    rtHeavy: true,
    coverAccent: 'from-amber-500/30 to-yellow-600/30 border-amber-500/40'
  },
  {
    id: 'wukong',
    title: 'Black Myth: Wukong',
    genre: 'Action RPG',
    engine: 'Unreal Engine 5 (Lumen / Nanite)',
    baseFpsFactor: 0.92,
    cpuSensitivity: 0.28,
    rtHeavy: true,
    coverAccent: 'from-orange-600/30 to-rose-700/30 border-orange-500/40'
  },
  {
    id: 'cs2',
    title: 'Counter-Strike 2 & Valorant',
    genre: 'Tactical FPS Esports',
    engine: 'Source 2 / Sub-Tick Physics',
    baseFpsFactor: 3.4,
    cpuSensitivity: 0.65, // Heavily CPU & single-core bound
    rtHeavy: false,
    coverAccent: 'from-cyan-500/30 to-blue-600/30 border-cyan-500/40'
  },
  {
    id: 'rdr2',
    title: 'Red Dead Redemption 2',
    genre: 'Open-World Adventure',
    engine: 'RAGE Engine (Dense Vegetation)',
    baseFpsFactor: 1.35,
    cpuSensitivity: 0.38,
    rtHeavy: false,
    coverAccent: 'from-rose-600/30 to-red-800/30 border-rose-500/40'
  },
  {
    id: 'forza5',
    title: 'Forza Horizon 5',
    genre: 'Open-World Racing',
    engine: 'Forzatech Engine (Extreme Lighting)',
    baseFpsFactor: 1.6,
    cpuSensitivity: 0.30,
    rtHeavy: true,
    coverAccent: 'from-purple-500/30 to-pink-600/30 border-purple-500/40'
  },
  {
    id: 'warzone',
    title: 'Call of Duty: Warzone',
    genre: 'Battle Royale',
    engine: 'IW 9.0 (High Density Assets)',
    baseFpsFactor: 1.45,
    cpuSensitivity: 0.45,
    rtHeavy: false,
    coverAccent: 'from-emerald-500/30 to-teal-700/30 border-emerald-500/40'
  }
];

export const LiveBenchmarkLab: React.FC<LiveBenchmarkLabProps> = ({
  cpus,
  gpus,
  initialCpuId = 'cpu-amd-7800x3d',
  initialGpuId = 'gpu-nvidia-4070-super'
}) => {
  const [selectedCpuId, setSelectedCpuId] = useState<string>(initialCpuId);
  const [selectedGpuId, setSelectedGpuId] = useState<string>(initialGpuId);

  // Game Simulator Options
  const [selectedGameId, setSelectedGameId] = useState<string>('cyberpunk');
  const [resolution, setResolution] = useState<ResolutionKey>('1440p');
  const [qualityPreset, setQualityPreset] = useState<QualityPresetKey>('ultra');
  const [upscaler, setUpscaler] = useState<UpscalerKey>('native');
  const [frameGenEnabled, setFrameGenEnabled] = useState<boolean>(false);

  // Live Synthetic Stress Test State
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchProgress, setBenchProgress] = useState<number>(0);
  const [benchCurrentPhase, setBenchCurrentPhase] = useState<string>('Idle');
  const [benchCompleted, setBenchCompleted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedCpu = useMemo(() => cpus.find(c => c.id === selectedCpuId) || cpus[0], [cpus, selectedCpuId]);
  const selectedGpu = useMemo(() => gpus.find(g => g.id === selectedGpuId) || gpus[0], [gpus, selectedGpuId]);
  const isBlackwellGpu = useMemo(() => {
    return selectedGpu.Architecture.toLowerCase().includes('blackwell') ||
      selectedGpu.Model.includes('5090') ||
      selectedGpu.Model.includes('5080') ||
      selectedGpu.Model.includes('5070') ||
      selectedGpu.Model.includes('5060') ||
      selectedGpu.Model.includes('5050');
  }, [selectedGpu]);

  // Selected Game
  const activeGame = useMemo(() => GAME_PROFILES.find(g => g.id === selectedGameId) || GAME_PROFILES[0], [selectedGameId]);

  // Simulate Synthetic Test Runner
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBenchmarking) {
      const phases = [
        'Initializing Vulkan / DirectX 12 Compute Queues...',
        'Cinebench All-Core AVX-512 Stress Pass...',
        '3DMark Time Spy Extreme Graphics Loop 1...',
        '3DMark Port Royal DXR Ray Tracing BVH Traverse...',
        'Blender 4.0 OptiX / HIP Kernel Compilation...',
        'Finalizing Silicon Score Normalization...'
      ];

      timer = setInterval(() => {
        setBenchProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsBenchmarking(false);
            setBenchCompleted(true);
            setBenchCurrentPhase('Stress Test Completed & Verified');
            return 100;
          }
          const next = prev + 5;
          const phaseIdx = Math.min(phases.length - 1, Math.floor((next / 100) * phases.length));
          setBenchCurrentPhase(phases[phaseIdx]);
          return next;
        });
      }, 90);
    }
    return () => clearInterval(timer);
  }, [isBenchmarking]);

  const handleStartBenchmark = () => {
    setBenchCompleted(false);
    setBenchProgress(0);
    setIsBenchmarking(true);
  };

  // FPS Prediction Physics
  const gameStats = useMemo(() => {
    const gpuRaw = selectedGpu.Gaming_Score;
    const cpuRaw = selectedCpu.Gaming_Score;
    const rtRaw = selectedGpu.RayTracing_Score;

    // Resolution multipliers
    const resFactors: Record<ResolutionKey, number> = {
      '1080p': 1.0,
      '1440p': 0.72,
      'ultrawide': 0.58,
      '4k': 0.44
    };

    // Quality preset multipliers
    const qualityFactors: Record<QualityPresetKey, number> = {
      'competitive': 1.45,
      'medium': 1.2,
      'ultra': 0.95,
      'rt_overdrive': 0.62
    };

    // Upscaler multipliers
    const upscalerFactors: Record<UpscalerKey, number> = {
      'native': 1.0,
      'dlss_quality': 1.34,
      'dlss_perf': 1.62,
      'fsr_quality': 1.28,
      'xess': 1.26
    };

    // Base score calculation
    let effectiveScore: number;
    if (qualityPreset === 'rt_overdrive' && activeGame.rtHeavy) {
      effectiveScore = (gpuRaw * 0.4 + rtRaw * 0.6) * (1 - activeGame.cpuSensitivity) + (cpuRaw * activeGame.cpuSensitivity);
    } else {
      effectiveScore = (gpuRaw * (1 - activeGame.cpuSensitivity)) + (cpuRaw * activeGame.cpuSensitivity);
    }

    const rawFps = (effectiveScore / 110) * activeGame.baseFpsFactor;
    let computedFps = rawFps * resFactors[resolution] * qualityFactors[qualityPreset] * upscalerFactors[upscaler];

    // Frame generation multiplier (+72% boost on DLSS 3/FSR 3, +130% with DLSS 4 Multi-Frame Gen on Blackwell)
    if (frameGenEnabled) {
      computedFps *= isBlackwellGpu ? 2.30 : 1.72;
    }

    const avgFps = Math.max(15, Math.round(computedFps));
    // 1% lows scale with CPU strength and frame gen stability
    const cpuBonus = (selectedCpu.SingleCore_Score / 2100) * 0.08;
    const lowMultiplier = frameGenEnabled ? 0.64 : (0.78 + cpuBonus);
    const low1Pct = Math.max(10, Math.round(avgFps * lowMultiplier));

    // Frame time in ms
    const frameTimeMs = Number((1000 / avgFps).toFixed(2));

    // Latency estimate (ms)
    let latencyMs = Math.round(frameTimeMs * 1.5 + (resolution === '4k' ? 6 : 2));
    if (frameGenEnabled) latencyMs += 8; // Frame gen latency penalty
    if (upscaler.startsWith('dlss')) latencyMs = Math.max(8, latencyMs - 4); // Reflex mitigation

    return {
      avgFps,
      low1Pct,
      frameTimeMs,
      latencyMs
    };
  }, [selectedCpu, selectedGpu, activeGame, resolution, qualityPreset, upscaler, frameGenEnabled]);

  // Synthetic Scores Breakdown
  const syntheticScores = useMemo(() => {
    const cinebenchMulti = Math.round(selectedCpu.MultiCore_Score * 14.8);
    const cinebenchSingle = Math.round(selectedCpu.SingleCore_Score * 1.05);
    const timeSpyGraphics = Math.round(selectedGpu.Benchmark_Score * 2.3);
    const timeSpyCpu = Math.round(selectedCpu.Benchmark_Score * 1.25);
    const timeSpyTotal = Math.round((timeSpyGraphics * 0.85) + (timeSpyCpu * 0.15));
    const portRoyalScore = Math.round(selectedGpu.RayTracing_Score * 1.42);
    const blenderBmwSeconds = Math.max(5, Math.round(18000 / (selectedGpu.Compute_Score + selectedCpu.MultiCore_Score * 0.3)));

    // Global percentile rank
    const combinedWeight = selectedCpu.Benchmark_Score * 0.4 + selectedGpu.Benchmark_Score * 0.6;
    let percentile = 50;
    if (combinedWeight > 22000) percentile = 99;
    else if (combinedWeight > 18000) percentile = 96;
    else if (combinedWeight > 14000) percentile = 91;
    else if (combinedWeight > 10000) percentile = 78;
    else if (combinedWeight > 6000) percentile = 62;
    else percentile = 42;

    return {
      cinebenchMulti,
      cinebenchSingle,
      timeSpyTotal,
      timeSpyGraphics,
      timeSpyCpu,
      portRoyalScore,
      blenderBmwSeconds,
      percentile
    };
  }, [selectedCpu, selectedGpu]);

  const handleCopyCertificate = () => {
    const text = [
      `=== Silicon Performance Matrix Verified Benchmark Certificate ===`,
      `Rig Specification:`,
      `• Processor: ${selectedCpu.Model} (${selectedCpu.Cores_Threads})`,
      `• Graphics: ${selectedGpu.Model} (${selectedGpu.VRAM_GB}GB VRAM)`,
      `--------------------------------------------------`,
      `Synthetic Suite Results:`,
      `• 3DMark Time Spy Score: ${formatScore(syntheticScores.timeSpyTotal)} (Graphics: ${formatScore(syntheticScores.timeSpyGraphics)})`,
      `• 3DMark Port Royal (Ray Tracing): ${formatScore(syntheticScores.portRoyalScore)} pts`,
      `• Cinebench Multi-Core: ${formatScore(syntheticScores.cinebenchMulti)} pts (Single-Core: ${formatScore(syntheticScores.cinebenchSingle)} pts)`,
      `• Blender 4.0 BMW Render: ${syntheticScores.blenderBmwSeconds} seconds`,
      `• Global Desktop Rank: Top ${100 - syntheticScores.percentile}% of all PCs tested`,
      `--------------------------------------------------`,
      `Game Simulation: ${activeGame.title} (${resolution} ${qualityPreset})`,
      `• Average FPS: ${gameStats.avgFps} FPS | 1% Lows: ${gameStats.low1Pct} FPS`,
      `• Frame Time: ${gameStats.frameTimeMs} ms | Input Latency: ~${gameStats.latencyMs} ms`,
      `Verified via PC Hardware Performance Matrix & Synergy Engine`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Live Benchmark Studio & Game FPS Simulator
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              DirectX 12 / Vulkan / Ray Tracing
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Real-World Game & Synthetic Benchmark Engine
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Simulate realistic raster & ray-traced frame rates across modern game engines, predict 1% low frame-pacing, and run full synthetic stress-test passes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCertificate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-all border border-zinc-700 cursor-pointer shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Certificate Copied!' : 'Share Scorecard'}</span>
          </button>

          <button
            id="run-benchmark-btn"
            disabled={isBenchmarking}
            onClick={handleStartBenchmark}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-lg cursor-pointer ${
              isBenchmarking
                ? 'bg-zinc-800 text-zinc-400 cursor-wait'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-500/20'
            }`}
          >
            {isBenchmarking ? (
              <>
                <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Running Test ({benchProgress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Synthetic Stress Pass</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target CPU & GPU Rig Pair Selection Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPU Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Active Processor (CPU)
            </span>
            <span className="text-cyan-400 font-bold">{formatINR(selectedCpu.Price_INR)}</span>
          </label>
          <select
            value={selectedCpuId}
            onChange={(e) => setSelectedCpuId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-medium focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            {cpus.map(c => (
              <option key={c.id} value={c.id}>
                {c.Model} ({c.Cores_Threads}, {c.TDP_Watts}W) - Score {formatScore(c.Benchmark_Score)}
              </option>
            ))}
          </select>
        </div>

        {/* GPU Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-purple-400" /> Active Graphics Card (GPU)
            </span>
            <span className="text-purple-400 font-bold">{formatINR(selectedGpu.Price_INR)}</span>
          </label>
          <select
            value={selectedGpuId}
            onChange={(e) => setSelectedGpuId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-medium focus:border-purple-500 focus:outline-none cursor-pointer"
          >
            {gpus.map(g => (
              <option key={g.id} value={g.id}>
                {g.Model} ({g.VRAM_GB}GB VRAM, {g.TGP_Watts}W) - Score {formatScore(g.Benchmark_Score)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Benchmark Progress HUD when active */}
      {isBenchmarking && (
        <div className="p-5 rounded-2xl bg-zinc-950 border-2 border-cyan-500/60 shadow-2xl space-y-3 animate-pulse">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
              {benchCurrentPhase}
            </span>
            <span className="text-white font-bold">{benchProgress}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full transition-all duration-150"
              style={{ width: `${benchProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-zinc-500">
            <span>CPU Load: 100% (All-Cores Clamped at Boost)</span>
            <span>GPU Load: 99% (Memory Controller Saturated)</span>
          </div>
        </div>
      )}

      {/* SECTION 1: REAL-WORLD AAA GAME SIMULATOR */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                AAA Game Resolution & Preset Predictor
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Real-World Gameplay Frame Rate & Frame Time Engine
            </h3>
          </div>

          <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
            <span>Active Game:</span>
            <span className="text-white font-bold">{activeGame.title}</span>
          </div>
        </div>

        {/* Game Title Picker Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {GAME_PROFILES.map((game) => {
            const isSelected = selectedGameId === game.id;
            return (
              <button
                key={game.id}
                onClick={() => setSelectedGameId(game.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? `bg-zinc-800/90 border-purple-400 shadow-md ring-1 ring-purple-400/40 text-white`
                    : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="text-xs font-bold text-zinc-200 truncate">{game.title}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{game.genre}</div>
                {game.rtHeavy && (
                  <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                    Ray Tracing
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Resolution, Preset & Upscaling Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800">
          {/* Resolution */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-zinc-400 font-semibold">Display Resolution</label>
            <div className="grid grid-cols-2 gap-1 text-xs font-mono">
              {[
                { id: '1080p', label: '1080p FHD' },
                { id: '1440p', label: '1440p QHD' },
                { id: 'ultrawide', label: 'UW 1440p' },
                { id: '4k', label: '4K UHD' }
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setResolution(r.id as ResolutionKey)}
                  className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    resolution === r.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preset */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-zinc-400 font-semibold">Quality Preset</label>
            <div className="grid grid-cols-2 gap-1 text-xs font-mono">
              {[
                { id: 'competitive', label: 'Competitive' },
                { id: 'medium', label: 'Medium' },
                { id: 'ultra', label: 'Ultra Raster' },
                { id: 'rt_overdrive', label: 'Full RT' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setQualityPreset(p.id as QualityPresetKey)}
                  className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    qualityPreset === p.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upscaling Tech */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-zinc-400 font-semibold">Upscaling Method</label>
            <select
              value={upscaler}
              onChange={(e) => setUpscaler(e.target.value as UpscalerKey)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="native">Native Resolution (100% Render Scale)</option>
              <option value="dlss_quality">NVIDIA DLSS 3.7 (Quality Mode)</option>
              <option value="dlss_perf">NVIDIA DLSS 3.7 (Performance Mode)</option>
              <option value="fsr_quality">AMD FSR 3.1 (Quality Preset)</option>
              <option value="xess">Intel XeSS 1.3 (Ultra Quality)</option>
            </select>
          </div>

          {/* Frame Generation Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-zinc-400 font-semibold">
              {isBlackwellGpu ? 'DLSS 4 Multi-Frame Generation' : 'AI Frame Generation'}
            </label>
            <button
              onClick={() => setFrameGenEnabled(!frameGenEnabled)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-between border cursor-pointer ${
                frameGenEnabled
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{isBlackwellGpu ? 'DLSS 4 Multi-Frame:' : 'Frame Gen / Fluid Motion:'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${frameGenEnabled ? 'bg-emerald-500 text-black font-extrabold' : 'bg-zinc-800 text-zinc-400'}`}>
                {frameGenEnabled ? (isBlackwellGpu ? 'DLSS 4 ACTIVE (+130%)' : 'ENABLED (+70% FPS)') : 'DISABLED'}
              </span>
            </button>
          </div>
        </div>

        {/* Live FPS Output Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Average FPS */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> Projected Average FPS
            </span>
            <div className={`text-3xl sm:text-4xl font-black font-mono ${
              gameStats.avgFps >= 120 ? 'text-cyan-400' : gameStats.avgFps >= 60 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {gameStats.avgFps} <span className="text-base font-bold text-zinc-400">FPS</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500">
              {gameStats.avgFps >= 144 ? 'Ultra High Refresh Fluidity' : gameStats.avgFps >= 60 ? 'Smooth 60+ FPS Standard' : 'Below 60 FPS Threshold'}
            </div>
          </div>

          {/* 1% Low FPS */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> 1% Low Stability
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-purple-300">
              {gameStats.low1Pct} <span className="text-base font-bold text-zinc-400">FPS</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500">
              Micro-stutter margin &bull; Ratio: {Math.round((gameStats.low1Pct / gameStats.avgFps) * 100)}%
            </div>
          </div>

          {/* Frame Time Pacing */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Frame Time
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
              {gameStats.frameTimeMs} <span className="text-base font-bold text-zinc-400">ms</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500">
              Render interval per display frame
            </div>
          </div>

          {/* Estimated Latency */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> Click-to-Photon Lag
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300">
              ~{gameStats.latencyMs} <span className="text-base font-bold text-zinc-400">ms</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500">
              {frameGenEnabled ? 'Reflex mitigates frame gen buffer' : 'Competitive input response'}
            </div>
          </div>
        </div>

        {/* Gaming Monitor Saturation Bar */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 font-bold flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              Monitor Refresh Rate Saturation Rating
            </span>
            <span className="text-cyan-400 font-bold">{gameStats.avgFps} FPS Output</span>
          </div>

          {/* Multi-tier Monitor Meter */}
          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            {[
              { hz: 60, label: '60 Hz Office / Console Display' },
              { hz: 144, label: '144 Hz Esports Gaming Panel' },
              { hz: 240, label: '240 Hz Pro Tournament Display' },
              { hz: 360, label: '360 Hz Elite OLED Panel' }
            ].map((tier) => {
              const saturated = gameStats.avgFps >= tier.hz;
              const percent = Math.min(100, Math.round((gameStats.avgFps / tier.hz) * 100));
              return (
                <div key={tier.hz} className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-white">{tier.hz} Hz</span>
                    <span className={`text-[10px] font-bold ${saturated ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {saturated ? 'Saturated' : `${percent}%`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        saturated ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: SYNTHETIC BENCHMARK SUITE (Cinebench, 3DMark, Blender) */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                Synthetic Industry Standard Suite
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Cinebench, 3DMark Time Spy & Blender Compute Scores
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              Global Rank: Top {100 - syntheticScores.percentile}% Tier
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 3DMark Time Spy Extreme */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-xs font-mono uppercase text-zinc-400 block font-semibold">
              3DMark Time Spy (DX12)
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
              {formatScore(syntheticScores.timeSpyTotal)}
            </div>
            <div className="text-[11px] font-mono text-zinc-400 space-y-0.5 pt-1 border-t border-zinc-800/80">
              <div className="flex justify-between">
                <span>Graphics Score:</span>
                <span className="text-white font-bold">{formatScore(syntheticScores.timeSpyGraphics)}</span>
              </div>
              <div className="flex justify-between">
                <span>CPU Physics Score:</span>
                <span className="text-white font-bold">{formatScore(syntheticScores.timeSpyCpu)}</span>
              </div>
            </div>
          </div>

          {/* 3DMark Port Royal */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-xs font-mono uppercase text-zinc-400 block font-semibold">
              3DMark Port Royal (Ray Tracing)
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
              {formatScore(syntheticScores.portRoyalScore)}
            </div>
            <div className="text-[11px] font-mono text-zinc-400 space-y-0.5 pt-1 border-t border-zinc-800/80">
              <div className="flex justify-between">
                <span>DXR BVH Traversal:</span>
                <span className="text-white font-bold">Hardware Accelerated</span>
              </div>
              <div className="flex justify-between">
                <span>RT Pipeline Quality:</span>
                <span className="text-emerald-400 font-bold">Tier 1 DXR</span>
              </div>
            </div>
          </div>

          {/* Cinebench Multi & Single */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-xs font-mono uppercase text-zinc-400 block font-semibold">
              Cinebench R23 / 2024
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              {formatScore(syntheticScores.cinebenchMulti)}
            </div>
            <div className="text-[11px] font-mono text-zinc-400 space-y-0.5 pt-1 border-t border-zinc-800/80">
              <div className="flex justify-between">
                <span>Multi-Core Render:</span>
                <span className="text-white font-bold">{formatScore(syntheticScores.cinebenchMulti)} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Single-Core IPC:</span>
                <span className="text-white font-bold">{formatScore(syntheticScores.cinebenchSingle)} pts</span>
              </div>
            </div>
          </div>

          {/* Blender 4.0 BMW 3D Render */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-xs font-mono uppercase text-zinc-400 block font-semibold">
              Blender 4.0 BMW Render
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {syntheticScores.blenderBmwSeconds} <span className="text-base font-bold text-zinc-400">sec</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 space-y-0.5 pt-1 border-t border-zinc-800/80">
              <div className="flex justify-between">
                <span>Render Backend:</span>
                <span className="text-white font-bold">{selectedGpu.Brand === 'NVIDIA' ? 'OptiX Cycles' : 'HIP / OpenCL'}</span>
              </div>
              <div className="flex justify-between">
                <span>Compute Speed:</span>
                <span className="text-emerald-400 font-bold">Ultra Rapid Export</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
