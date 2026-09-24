import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Zap,
  ShieldCheck,
  Database,
  Activity,
  FastForward,
  Volume2,
  VolumeX,
  Gauge,
  Thermometer,
  Layers,
  Terminal,
  CheckCircle2,
  Radio,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface LoadingScreenProps {
  targetTabName?: string;
  onComplete: () => void;
}

interface DiagnosticStage {
  id: string;
  category: 'CORE' | 'MEMORY' | 'BUS' | 'POWER' | 'MATRIX';
  title: string;
  detail: string;
  hexCode: string;
  targetPct: number;
}

const diagnosticStages: DiagnosticStage[] = [
  {
    id: 'stage-1',
    category: 'CORE',
    title: 'Silicon Microcode & Topology Handshake',
    detail: 'Initializing AM5 / LGA1700 execution dispatch registers & AVX-512 / FMA instruction pipelines.',
    hexCode: '0x7F0A_POST_OK',
    targetPct: 20
  },
  {
    id: 'stage-2',
    category: 'BUS',
    title: 'PCIe 5.0 x16 Lane Calibration & VRAM Interface',
    detail: 'Synchronizing 32 GT/s bidirectional bus width; validating 384-bit GDDR6X / ECC memory channels.',
    hexCode: '0x88BC_LINK_X16',
    targetPct: 42
  },
  {
    id: 'stage-3',
    category: 'MEMORY',
    title: 'Indexing 94 Desktop Processors & Graphics Cards',
    detail: 'Compiling synthetic multi-workload tensors (Esports, AAA 4K, Ray Tracing, 3D Render, AI).',
    hexCode: '0x9E44_REGISTRY_SYNC',
    targetPct: 65
  },
  {
    id: 'stage-4',
    category: 'POWER',
    title: 'Indian DISCOM Tariffs & ATX 3.0 Headroom Sizing',
    detail: 'Calibrating MSEDCL, BESCOM, BSES, TANGEDCO kilowatt rates and 12V transient excursion tolerances.',
    hexCode: '0xA11F_DISCOM_CALIB',
    targetPct: 86
  },
  {
    id: 'stage-5',
    category: 'MATRIX',
    title: 'Synergy Engine & Pareto Efficiency Frontier Locked',
    detail: 'Predictive bottleneck queuing primed. Zero micro-stutter pipeline stalls detected.',
    hexCode: '0xFFFF_READY_ENTER',
    targetPct: 100
  }
];

const hardwareProTips = [
  'AMD 3D V-Cache stacks 64MB of L3 SRAM directly atop the CCD, dramatically cutting RAM latency in physics-heavy games.',
  'At 4K resolution, the graphical raster bottleneck shifts almost entirely to the GPU memory bus bandwidth (GB/s).',
  'Intel Thread Director dynamically routes background OS tasks to E-Cores while reserving low-latency P-Cores for game rendering.',
  'PCIe 4.0 x16 provides ~31.5 GB/s of bidirectional bandwidth — ample for modern GPUs without bottlenecking performance.',
  'Modern ATX 3.0 PSUs are rated to withstand brief 200% power spikes (excursions) from high-power Ada and RDNA 3 GPUs.'
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  targetTabName = 'Performance Matrix',
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [isTurbo, setIsTurbo] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '[0.0001] BOOT_INIT: PC Hardware Performance Matrix v2.9.4',
    '[0.0042] MEM_BUS: DDR5-6000 CL30 dual-channel profile engaged',
    '[0.0120] CHIPSET: Polling 94 hardware descriptors from silicon registry'
  ]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound generator helper using Web Audio API
  const playTone = (freq: number, type: OscillatorType = 'sine', duration = 0.08, gainVal = 0.05) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Progress ticker loop
  useEffect(() => {
    const totalDuration = isTurbo ? 900 : 2500;
    const intervalMs = 25;
    const increment = (intervalMs / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + increment, 100);

        // Find active stage
        const stageIndex = diagnosticStages.findIndex((s) => next <= s.targetPct);
        const resolvedIdx = stageIndex === -1 ? diagnosticStages.length - 1 : stageIndex;
        setCurrentStageIdx(resolvedIdx);

        // Add periodic terminal logs
        if (Math.floor(next) % 20 === 0 && Math.floor(next) !== Math.floor(prev)) {
          const timestamp = (next / 25).toFixed(3);
          const stageHex = diagnosticStages[resolvedIdx]?.hexCode || '0x00FF';
          setTerminalLines((prevLines) => [
            ...prevLines.slice(-4),
            `[${timestamp}] ${stageHex}: ${diagnosticStages[resolvedIdx]?.title.slice(0, 42)}...`
          ]);
          playTone(440 + next * 4, 'triangle', 0.05, 0.03);
        }

        if (next >= 100) {
          clearInterval(timer);
          playTone(880, 'sine', 0.18, 0.08); // Success chime
          setTimeout(onComplete, 200);
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isTurbo, onComplete, soundEnabled]);

  // Rotate hardware tip
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % hardwareProTips.length);
    }, 2800);
    return () => clearInterval(tipTimer);
  }, []);

  // Real-time calculated simulation metrics
  const clockGhz = (3.4 + (progress / 100) * 2.3).toFixed(2);
  const tempCelsius = (32 + (progress / 100) * 14.5).toFixed(1);
  const voltageV = (1.12 + (progress / 100) * 0.125).toFixed(3);
  const computeTflops = ((progress / 100) * 82.6).toFixed(1);

  // Active cores in the interactive die graphic (16 cores total)
  const activeCoreCount = Math.min(Math.floor((progress / 100) * 16), 16);

  return (
    <div
      id="hardware-loading-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 text-white p-4 sm:p-6 overflow-y-auto backdrop-blur-2xl select-none"
    >
      {/* Background High-Tech Animated Vector Grid & Circuit Traces */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Cyber Ambient Radiance */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Primary Terminal / Diagnostic Chassis */}
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-zinc-900/95 border border-zinc-800 p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6">
        {/* Top Control & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse text-cyan-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-extrabold tracking-widest text-cyan-400 uppercase">
                  POST HARDWARE DIAGNOSTICS
                </span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                  REV 2.9.4
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Silicon Architecture Calibration</span>
                <span className="text-zinc-500 font-mono text-xs hidden sm:inline">&bull; Destination: {targetTabName}</span>
              </h2>
            </div>
          </div>

          {/* Interactive Utility Controls (Turbo, Sound, Skip) */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playTone(587, 'sine', 0.1, 0.05);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                soundEnabled
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-400'
              }`}
              title={soundEnabled ? 'Disable tech audio tones' : 'Enable tech audio tones'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Audio ON' : 'Muted'}</span>
            </button>

            {/* Turbo Boost 3x Toggle */}
            <button
              onClick={() => {
                setIsTurbo(!isTurbo);
                playTone(660, 'square', 0.08, 0.04);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                isTurbo
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-300'
              }`}
              title="Fast-forward loading speed by 3x"
            >
              <Zap className={`w-3.5 h-3.5 ${isTurbo ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}`} />
              <span>{isTurbo ? 'Turbo 3x' : '1x Normal'}</span>
            </button>

            {/* Instant Skip */}
            <button
              onClick={onComplete}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 text-xs font-mono font-bold transition-all border border-zinc-700 cursor-pointer"
            >
              <span>Skip</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Central Visualizer: Silicon Die & Execution Engine Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Silicon Wafer Die Schematic (Left 5 Cols) */}
          <div className="md:col-span-5 p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-zinc-400 px-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                DIE TOPOLOGY
              </span>
              <span className="text-zinc-500">16 CORES ACTIVE</span>
            </div>

            {/* 16-Core Matrix Die Grid */}
            <div className="grid grid-cols-4 gap-1.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 w-full max-w-[220px]">
              {Array.from({ length: 16 }).map((_, i) => {
                const isActive = i < activeCoreCount;
                const isScanning = i === activeCoreCount;
                return (
                  <div
                    key={i}
                    className={`h-8 rounded flex flex-col items-center justify-center text-[9px] font-mono font-bold transition-all duration-200 border ${
                      isActive
                        ? 'bg-gradient-to-t from-cyan-950 to-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : isScanning
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-700'
                    }`}
                  >
                    <span>C{i + 1}</span>
                    <span className="text-[7px] text-zinc-500">
                      {isActive ? 'SYNC' : isScanning ? 'BUSY' : 'IDLE'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* PCIe Lane & L3 Cache Simulation Indicators */}
            <div className="w-full space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>PCIe 5.0 Bus Links</span>
                <span className="text-emerald-400 font-bold">x16 (32 GT/s)</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-sm transition-all duration-150 ${
                      i <= (progress / 100) * 16 ? 'bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.8)]' : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Hardware Telemetry Gauges (Right 7 Cols) */}
          <div className="md:col-span-7 space-y-3">
            {/* Live Numerical Readouts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
              <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-0.5">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono">
                  <Gauge className="w-3 h-3 text-cyan-400" />
                  <span>CORE FREQ</span>
                </div>
                <div className="text-sm font-black font-mono text-white">{clockGhz} GHz</div>
                <div className="text-[9px] text-zinc-500 font-mono">Boost Multiplier</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-0.5">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono">
                  <Thermometer className="w-3 h-3 text-emerald-400" />
                  <span>DIE TEMP</span>
                </div>
                <div className="text-sm font-black font-mono text-emerald-400">{tempCelsius} °C</div>
                <div className="text-[9px] text-zinc-500 font-mono">Tcase Sensor</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-0.5">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>VCORE</span>
                </div>
                <div className="text-sm font-black font-mono text-amber-300">{voltageV} V</div>
                <div className="text-[9px] text-zinc-500 font-mono">VRM Regulation</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-0.5">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono">
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>COMPUTE</span>
                </div>
                <div className="text-sm font-black font-mono text-purple-300">{computeTflops} TFLOPS</div>
                <div className="text-[9px] text-zinc-500 font-mono">FP32 Vector Peak</div>
              </div>
            </div>

            {/* Current Active Diagnostic Stage Card */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-cyan-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                  <span>{diagnosticStages[currentStageIdx]?.title}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
                  {diagnosticStages[currentStageIdx]?.hexCode}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">
                {diagnosticStages[currentStageIdx]?.detail}
              </p>
            </div>

            {/* Simulated Live Kernel/POST Terminal Stream */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-[10px] space-y-1">
              <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-800/60 pb-1">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-zinc-400" />
                  TELEMETRY LOG STREAM
                </span>
                <span>STATUS: OPERATIONAL</span>
              </div>
              <div className="space-y-0.5 text-zinc-400 font-mono">
                {terminalLines.map((line, idx) => (
                  <div key={idx} className="truncate">
                    <span className="text-cyan-400 font-bold">&gt; </span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Master Progress Bar & Stage Nodes */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-400 font-bold">
              CALIBRATION PROGRESS: <span className="text-cyan-400">{Math.round(progress)}%</span>
            </span>
            <span className="text-zinc-500">
              TARGET: <span className="text-zinc-300 font-semibold">{targetTabName}</span>
            </span>
          </div>

          <div className="relative w-full h-3 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-75 ease-out shadow-[0_0_16px_rgba(6,182,212,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Diagnostic Sub-System Stepper Nodes */}
          <div className="grid grid-cols-5 gap-1 pt-1 text-center font-mono">
            {diagnosticStages.map((stage, idx) => {
              const isPassed = progress >= stage.targetPct;
              const isCurrent = currentStageIdx === idx;
              return (
                <div key={stage.id} className="flex flex-col items-center space-y-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                      isPassed
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                        : isCurrent
                        ? 'bg-cyan-400 animate-ping'
                        : 'bg-zinc-800'
                    }`}
                  />
                  <span
                    className={`text-[9px] uppercase font-bold truncate max-w-full ${
                      isPassed ? 'text-zinc-300' : isCurrent ? 'text-cyan-400' : 'text-zinc-600'
                    }`}
                  >
                    {stage.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hardware Trivia & Educational Pro-Tip Footer */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
              SILICON ARCHITECTURE NOTE
            </span>
            <p className="text-zinc-300 text-[11px] leading-relaxed transition-opacity duration-300">
              {hardwareProTips[tipIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
