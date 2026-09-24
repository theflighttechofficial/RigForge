import React, { useState, useMemo } from 'react';
import { CPUItem, GPUItem, ResolutionMode } from '../types';
import { calculateSynergyMetrics, formatINR } from '../utils/formatters';
import {
  GitMerge,
  Share2,
  Cpu,
  Monitor,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Gamepad2,
  Copy,
  Check,
  Skull,
  AlertOctagon,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Activity,
  FileDown,
  Loader2,
  Stethoscope,
  BatteryCharging
} from 'lucide-react';
import { ThermalThrottlingPanel } from './ThermalThrottlingPanel';
import { StabilityTestLab } from './StabilityTestLab';
import { DriverHealthPanel } from './DriverHealthPanel';
import { TDPBatteryEstimator } from './TDPBatteryEstimator';
import { generateHardwareDiagnosticPDF } from '../utils/pdfExport';

interface SynergyLabProps {
  cpus: CPUItem[];
  gpus: GPUItem[];
  initialCpuId?: string;
  initialGpuId?: string;
  onOpenBuildDoctor?: (cpuModel: string, gpuModel: string) => void;
}

export const SynergyLab: React.FC<SynergyLabProps> = ({
  cpus,
  gpus,
  initialCpuId = 'cpu-amd-7800x3d',
  initialGpuId = 'gpu-nvidia-4070-super',
  onOpenBuildDoctor
}) => {
  const [selectedCpuId, setSelectedCpuId] = useState<string>(initialCpuId);
  const [selectedGpuId, setSelectedGpuId] = useState<string>(initialGpuId);
  const [resolution, setResolution] = useState<ResolutionMode>('1440p');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState<boolean>(false);
  const [subLabView, setSubLabView] = useState<'all' | 'tdp' | 'driver' | 'stability' | 'thermal'>('all');
  const [driverHealthData, setDriverHealthData] = useState<{
    installedVersion: string;
    latestVersion: string;
    status: 'optimal' | 'recommended' | 'critical';
    statusLabel: string;
  } | undefined>(undefined);

  const selectedCpu = useMemo(() => {
    return cpus.find(c => c.id === selectedCpuId) || cpus[0];
  }, [cpus, selectedCpuId]);

  const selectedGpu = useMemo(() => {
    return gpus.find(g => g.id === selectedGpuId) || gpus[0];
  }, [gpus, selectedGpuId]);

  // Synergy Physics Output
  const synergy = useMemo(() => {
    return calculateSynergyMetrics(selectedCpu, selectedGpu, resolution);
  }, [selectedCpu, selectedGpu, resolution]);

  // Combined power & PSU calculations
  const totalPowerDraw = selectedCpu.TDP_Watts + selectedGpu.TGP_Watts + 90; // +90W for Motherboard, Fans, NVMe
  const recommendedPsu = Math.ceil((totalPowerDraw * 1.35) / 50) * 50;

  // Total Combined Core Hardware Cost
  const totalCost = selectedCpu.Price_INR + selectedGpu.Price_INR;

  const handleCopySpecs = () => {
    const text = [
      `== PC Synergy & Adverse Bottleneck Report ==`,
      `CPU: ${selectedCpu.Model} (${selectedCpu.Cores_Threads}) - ${formatINR(selectedCpu.Price_INR)}`,
      `GPU: ${selectedGpu.Model} (${selectedGpu.VRAM_GB}GB) - ${formatINR(selectedGpu.Price_INR)}`,
      `Combined Core Cost: ${formatINR(totalCost)}`,
      `Resolution Target: ${resolution.toUpperCase()}`,
      `Estimated Bottleneck: ${synergy.bottleneckPercentage}% (${synergy.status})`,
      `Mismatch Severity: ${synergy.adverseWarning.severity}`,
      `CPU Load: ${synergy.cpuUtilization}% | GPU Load: ${synergy.gpuUtilization}%`,
      `Total Estimated Power Draw: ~${totalPowerDraw}W (Recommended PSU: ${recommendedPsu}W+)`,
      `Generated via PC Hardware Performance Matrix & Synergy Engine`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Quick Preset Pairings
  const applyPreset = (cpuId: string, gpuId: string, res: ResolutionMode) => {
    setSelectedCpuId(cpuId);
    setSelectedGpuId(gpuId);
    setResolution(res);
  };

  const hasAdverseWarning = synergy.adverseWarning.severity !== 'NONE';

  const handleExportPDF = () => {
    setIsExportingPdf(true);
    try {
      generateHardwareDiagnosticPDF({
        cpu: selectedCpu,
        gpu: selectedGpu,
        resolution,
        bottleneckData: {
          cpuPercentage: synergy.cpuUtilization,
          gpuPercentage: synergy.gpuUtilization,
          bottleneckType: synergy.status === 'BALANCED' ? 'balanced' : synergy.status === 'CPU_BOTTLENECK' ? 'cpu' : 'gpu',
          explanation: synergy.summary,
          verdict: synergy.status === 'BALANCED'
            ? 'Optimal Symmetrical Pairing'
            : synergy.status === 'CPU_BOTTLENECK'
            ? 'CPU Bottleneck Restricting GPU'
            : 'GPU Limited (Optimal Gaming Vector)',
          impactLevel: synergy.adverseWarning.severity === 'CATASTROPHIC'
            ? 'high'
            : synergy.adverseWarning.severity === 'SEVERE'
            ? 'moderate'
            : 'low'
        },
        fpsEstimates: (synergy.gameFpsEstimates && synergy.gameFpsEstimates.length > 0)
          ? synergy.gameFpsEstimates.map(g => ({
              title: g.game,
              fps: g.fps,
              onePercentLow: Math.max(Math.round(g.fps * 0.72), 1),
              settings: `${g.quality} (${g.setting})`
            }))
          : [
              { title: 'Cyberpunk 2077', fps: 95, onePercentLow: 68, settings: 'Ultra Settings + Ray Tracing' },
              { title: 'Black Myth: Wukong', fps: 82, onePercentLow: 58, settings: 'High Cinematic TSR 100%' },
              { title: 'Valorant / CS2', fps: 360, onePercentLow: 280, settings: 'Competitive High 1080p/1440p' },
              { title: 'Shadow of Tomb Raider', fps: 135, onePercentLow: 98, settings: 'Highest Preset TAA' }
            ],
        driverHealth: driverHealthData,
        stabilityIndex: 96
      });
      setPdfExportSuccess(true);
      setTimeout(() => setPdfExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Hardware Bottleneck & Adverse Pairing Physics
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Synergy & Adverse Bottleneck Lab
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Simulate computational instruction dispatch rates versus graphical raster pipeline capacity across target resolutions and detect severe hardware mismatches.
          </p>
        </div>

        {/* Action Buttons: Export PDF & Copy Specs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-export-pdf"
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs font-mono transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Export full diagnostic summary & bottleneck report into structured PDF format"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : pdfExportSuccess ? (
              <Check className="w-4 h-4 text-black" />
            ) : (
              <FileDown className="w-4 h-4 text-black" />
            )}
            <span>{pdfExportSuccess ? 'Report Generated!' : isExportingPdf ? 'Compiling PDF...' : 'Export Diagnostic PDF'}</span>
          </button>

          <button
            onClick={handleCopySpecs}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-white transition-all border border-zinc-700 shadow-md cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          {onOpenBuildDoctor && (
            <button
              onClick={() => onOpenBuildDoctor(selectedCpu.Model, selectedGpu.Model)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold transition-all shadow-md cursor-pointer"
              title="Launch full AI Build Doctor diagnostic health report with upgrade sequence and rationale"
            >
              <Stethoscope className="w-4 h-4" />
              <span>AI Build Doctor Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Fast Selectors (including Adverse & Harmonious) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
        <span className="text-zinc-500 whitespace-nowrap text-[11px]">Hardware Presets:</span>
        <button
          onClick={() => applyPreset('cpu-amd-fx8350', 'gpu-nvidia-4090', '1080p')}
          className="px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/50 border border-rose-800 text-rose-300 whitespace-nowrap font-bold flex items-center gap-1"
        >
          <Skull className="w-3 h-3 text-rose-400" />
          FX-8350 + RTX 4090 (Catastrophic Mismatch)
        </button>
        <button
          onClick={() => applyPreset('cpu-intel-4790k', 'gpu-nvidia-4080-super', '1440p')}
          className="px-2.5 py-1 rounded-lg bg-amber-950/50 hover:bg-amber-900/50 border border-amber-800 text-amber-300 whitespace-nowrap flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          i7-4790K + RTX 4080 (Severe Bottleneck)
        </button>
        <button
          onClick={() => applyPreset('cpu-amd-threadripper-7980x', 'gpu-amd-580', '1080p')}
          className="px-2.5 py-1 rounded-lg bg-purple-950/50 hover:bg-purple-900/50 border border-purple-800 text-purple-300 whitespace-nowrap flex items-center gap-1"
        >
          64-Core Threadripper + RX 580 (HEDT Imbalance)
        </button>
        <button
          onClick={() => applyPreset('cpu-amd-7800x3d', 'gpu-nvidia-4070-super', '1440p')}
          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-cyan-400 whitespace-nowrap font-bold"
        >
          1440p Sweet Spot (₹97k)
        </button>
        <button
          onClick={() => applyPreset('cpu-amd-9800x3d', 'gpu-nvidia-4090', '4k')}
          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 whitespace-nowrap font-bold"
        >
          4K Titan Harmony (₹2.34L)
        </button>
      </div>

      {/* Adverse Mismatch Warning Callout Banner (if applicable) */}
      {hasAdverseWarning && (
        <div
          className={`p-4 rounded-2xl border-2 backdrop-blur-xl flex items-start gap-3.5 transition-all ${
            synergy.adverseWarning.severity === 'CATASTROPHIC'
              ? 'bg-rose-950/70 border-rose-500 shadow-glow-crimson'
              : synergy.adverseWarning.severity === 'SEVERE'
              ? 'bg-amber-950/70 border-amber-500 shadow-glow-amber'
              : 'bg-zinc-900/90 border-amber-600/50'
          }`}
        >
          {synergy.adverseWarning.severity === 'CATASTROPHIC' ? (
            <Skull className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
          ) : (
            <AlertOctagon className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold uppercase tracking-wider text-rose-400">
                [{synergy.adverseWarning.severity} ADVERSE MISMATCH DETECTED]
              </span>
              <strong className="text-white text-sm">{synergy.adverseWarning.title}</strong>
            </div>
            <ul className="list-disc list-inside text-zinc-300 space-y-1">
              {synergy.adverseWarning.details.map((d, idx) => (
                <li key={idx} className="leading-relaxed">{d}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Container with Dynamic Reactive Glow */}
      <div
        className={`rounded-2xl bg-zinc-900/90 border-2 p-6 backdrop-blur-xl transition-all duration-500 space-y-6 ${
          synergy.status === 'BALANCED'
            ? 'border-emerald-500/50 shadow-glow-emerald'
            : synergy.status === 'CPU_BOTTLENECK'
            ? 'border-rose-500/50 shadow-glow-crimson'
            : 'border-purple-500/50 shadow-glow-purple'
        }`}
      >
        {/* Component & Resolution Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Processor (CPU) &bull; {selectedCpu.Era}
            </label>
            <select
              value={selectedCpuId}
              onChange={(e) => setSelectedCpuId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-cyan-500 focus:outline-none"
            >
              {cpus.map(c => (
                <option key={c.id} value={c.id}>
                  {c.Model} ({c.Cores_Threads}) &bull; {formatINR(c.Price_INR)}
                </option>
              ))}
            </select>
          </div>

          {/* GPU Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-purple-400" />
              Graphics Card (GPU) &bull; {selectedGpu.Era}
            </label>
            <select
              value={selectedGpuId}
              onChange={(e) => setSelectedGpuId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-purple-500 focus:outline-none"
            >
              {gpus.map(g => (
                <option key={g.id} value={g.id}>
                  {g.Model} ({g.VRAM_GB}GB) &bull; {formatINR(g.Price_INR)}
                </option>
              ))}
            </select>
          </div>

          {/* Resolution Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-emerald-400" />
              Target Resolution / Mode
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value as ResolutionMode)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-emerald-500 focus:outline-none"
            >
              <option value="1080p">1080p Full HD (High CPU Sensitivity)</option>
              <option value="1440p">1440p QHD (Balanced Demands)</option>
              <option value="4k">4K UHD (Heavy GPU Bound)</option>
              <option value="workstation">Compute / Workstation Rendering</option>
            </select>
          </div>
        </div>

        {/* Bottleneck Gauge & Dual Pipeline Utilization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
          {/* Status Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center space-y-2">
            <span className="text-xs font-mono uppercase text-zinc-400">
              Estimated Bottleneck
            </span>
            <div
              className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${
                synergy.status === 'BALANCED'
                  ? 'text-emerald-400'
                  : synergy.status === 'CPU_BOTTLENECK'
                  ? 'text-rose-400'
                  : 'text-purple-400'
              }`}
            >
              {synergy.bottleneckPercentage}%
            </div>

            <div
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                synergy.status === 'BALANCED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : synergy.status === 'CPU_BOTTLENECK'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}
            >
              {synergy.status === 'BALANCED'
                ? 'Symmetrical Pairing'
                : synergy.status === 'CPU_BOTTLENECK'
                ? 'CPU Throttling GPU'
                : 'GPU Limited (Optimal)'}
            </div>

            <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
              {synergy.summary}
            </p>
          </div>

          {/* Utilization Bars & Architectural Verdict */}
          <div className="lg:col-span-8 space-y-4 p-6 rounded-xl bg-zinc-950/80 border border-zinc-800">
            {/* CPU Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  CPU Instruction Dispatch Pipeline
                </span>
                <span className="text-cyan-400 font-bold">{synergy.cpuUtilization}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-500 shadow-glow-cyan"
                  style={{ width: `${synergy.cpuUtilization}%` }}
                />
              </div>
            </div>

            {/* GPU Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-purple-400" />
                  GPU Graphical Raster Pipeline
                </span>
                <span className="text-purple-400 font-bold">{synergy.gpuUtilization}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-500 shadow-glow-purple"
                  style={{ width: `${synergy.gpuUtilization}%` }}
                />
              </div>
            </div>

            {/* Architectural Verdict */}
            <div className="pt-3 border-t border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300">
              {synergy.status === 'BALANCED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">
                {synergy.verdict}
              </div>
            </div>

            {/* Power & Thermal Row */}
            <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-zinc-500 block">Total Est. Draw:</span>
                <span className="text-white font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  ~{totalPowerDraw} Watts
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Recommended PSU:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {recommendedPsu}W+ Gold
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Combined Core Cost:</span>
                <span className="text-cyan-400 font-bold">
                  {formatINR(totalCost)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Stress & Climate Labs:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <a
                    href="#stability-test-lab"
                    onClick={() => setSubLabView(prev => prev === 'thermal' ? 'both' : prev)}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Stability &darr;</span>
                  </a>
                  <span className="text-zinc-700">&bull;</span>
                  <a
                    href="#thermal-throttling-panel"
                    onClick={() => setSubLabView(prev => prev === 'stability' ? 'both' : prev)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Thermal &darr;</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-World Game FPS Projections Strip */}
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              Projected Real-World Gaming Performance ({resolution.toUpperCase()})
            </h4>
            <span className="text-[10px] font-mono text-zinc-500">Averaged across real-world driver benchmarks</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {synergy.gameFpsEstimates.map(g => (
              <div key={g.game} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 space-y-1">
                <div className="text-[11px] font-bold text-white truncate">{g.game}</div>
                <div className="text-xl font-extrabold font-mono text-emerald-400">
                  {g.fps} <span className="text-xs font-normal text-zinc-400">FPS</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono truncate">{g.quality}</div>
                <div className="text-[9px] text-zinc-500 truncate">{g.setting}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnostic Lab Sub-View Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 px-1">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-bold">SILICON STRESS, DRIVER & THERMAL LABS</span>
          <span className="text-zinc-600">&bull;</span>
          <span>Select Diagnostic View</span>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono flex-wrap gap-1">
          <button
            id="tab-sublab-tdp"
            onClick={() => setSubLabView('tdp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              subLabView === 'tdp'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BatteryCharging className="w-3.5 h-3.5 text-black" />
            <span>TDP / Battery Drain</span>
          </button>

          <button
            id="tab-sublab-driver"
            onClick={() => setSubLabView('driver')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              subLabView === 'driver'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Driver Health (WHQL)</span>
          </button>

          <button
            id="tab-sublab-stability"
            onClick={() => setSubLabView('stability')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              subLabView === 'stability'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Stability Test Lab</span>
          </button>

          <button
            id="tab-sublab-thermal"
            onClick={() => setSubLabView('thermal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              subLabView === 'thermal'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Thermal Throttling</span>
          </button>

          <button
            id="tab-sublab-all"
            onClick={() => setSubLabView('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              subLabView === 'all'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>View All Labs</span>
          </button>
        </div>
      </div>

      {/* TDP & Battery Drain Estimator Module */}
      {(subLabView === 'all' || subLabView === 'tdp') && (
        <TDPBatteryEstimator cpu={selectedCpu} gpu={selectedGpu} />
      )}

      {/* GPU Driver Health & Official WHQL Verification Module */}
      {(subLabView === 'all' || subLabView === 'driver') && (
        <DriverHealthPanel
          gpu={selectedGpu}
          onDriverHealthChange={setDriverHealthData}
        />
      )}

      {/* Stability Test Module (Voltage Instability & Thermal Runaway) */}
      {(subLabView === 'all' || subLabView === 'stability') && (
        <StabilityTestLab cpu={selectedCpu} gpu={selectedGpu} />
      )}

      {/* Interactive High Ambient Thermal Throttling & Benchmark Impact Panel */}
      {(subLabView === 'all' || subLabView === 'thermal') && (
        <ThermalThrottlingPanel cpu={selectedCpu} gpu={selectedGpu} />
      )}
    </div>
  );
};
