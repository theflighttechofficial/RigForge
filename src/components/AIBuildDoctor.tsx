import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Zap,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Gauge,
  RotateCcw,
  Copy,
  Check,
  Wrench,
  Flame,
  Scale,
  RefreshCw,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import { cpuDataset, gpuDataset } from '../data/hardwareData';
import { buildIntegratedGpu } from '../utils/integratedGraphics';
import { generateDeterministicReport } from '../utils/doctorReport';
import { IntegratedGraphicsToggle } from './IntegratedGraphicsToggle';
import { BuildDoctorReport, CPUItem, GPUItem } from '../types';

interface AIBuildDoctorProps {
  onNavigateToBuilder?: (cpuId: string, gpuId: string) => void;
  onNavigateToSynergy?: (cpuId: string, gpuId: string) => void;
}

// Preset samples for quick testing
const QUICK_PRESETS = [
  {
    label: 'Ryzen 5 3600 + RTX 4070 + 16GB RAM',
    subtitle: 'Classic Zen 2 Midrange + Modern Ada 1440p',
    cpu: 'AMD Ryzen 5 3600',
    gpu: 'NVIDIA GeForce RTX 4070 12GB',
    ram: '16GB DDR4',
    badge: 'Popular'
  },
  {
    label: 'Core i5-10400F + RTX 3080 + 16GB RAM',
    subtitle: '10th Gen Comet Lake + Ampere Flagship',
    cpu: 'Intel Core i5-10400F',
    gpu: 'NVIDIA GeForce RTX 3080 10GB',
    ram: '16GB DDR4',
    badge: 'LGA 1200'
  },
  {
    label: 'Ryzen 7 7800X3D + RTX 4080 Super + 32GB RAM',
    subtitle: 'Enthusiast Zen 4 3D V-Cache Titan',
    cpu: 'AMD Ryzen 7 7800X3D',
    gpu: 'NVIDIA GeForce RTX 4080 Super 16GB',
    ram: '32GB DDR5',
    badge: 'Balanced'
  },
  {
    label: 'AMD FX-8350 + RTX 4090 + 8GB RAM',
    subtitle: 'Extreme 2012 Antique + 2024 Halo Card',
    cpu: 'AMD FX-8350 Black Edition',
    gpu: 'NVIDIA GeForce RTX 4090 24GB',
    ram: '8GB DDR3',
    badge: 'Disaster'
  }
];

export const AIBuildDoctor: React.FC<AIBuildDoctorProps> = ({
  onNavigateToBuilder,
  onNavigateToSynergy
}) => {
  // Input states
  const [nlInput, setNlInput] = useState('Ryzen 5 3600 + RTX 4070 + 16GB RAM');
  const [selectedCpuName, setSelectedCpuName] = useState('AMD Ryzen 5 3600');
  const [selectedGpuName, setSelectedGpuName] = useState('NVIDIA GeForce RTX 4070 12GB');
  const [useIgpu, setUseIgpu] = useState(false);
  // Name of the CPU's integrated graphics, when it has one
  const igpuFor = (cpuName: string) => {
    const cpu = cpuDataset.find((c) => c.Model === cpuName);
    return cpu ? buildIntegratedGpu(cpu)?.Model : undefined;
  };
  const gpuFor = (cpuName: string, gpuName: string, igpu = useIgpu) => (igpu && igpuFor(cpuName)) || gpuName;
  const [selectedRam, setSelectedRam] = useState('16GB');

  // Diagnostic state
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState<BuildDoctorReport | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Same catalog-driven generator the server uses, for when the API is unreachable
  const generateClientReport = (cpu: string, gpu: string, ram: string): BuildDoctorReport =>
    generateDeterministicReport(cpu, gpu, ram);

  // Natural Language Parser
  const parseNaturalLanguage = (text: string) => {
    let matchedCpu = selectedCpuName;
    let matchedGpu = selectedGpuName;
    let matchedRam = selectedRam;

    const lower = text.toLowerCase();

    // Check CPU keywords
    if (lower.includes('3600')) matchedCpu = 'AMD Ryzen 5 3600';
    else if (lower.includes('5600')) matchedCpu = 'AMD Ryzen 5 5600X';
    else if (lower.includes('5700x3d')) matchedCpu = 'AMD Ryzen 7 5700X3D';
    else if (lower.includes('5800x3d')) matchedCpu = 'AMD Ryzen 7 5800X3D';
    else if (lower.includes('7800x3d')) matchedCpu = 'AMD Ryzen 7 7800X3D';
    else if (lower.includes('7600')) matchedCpu = 'AMD Ryzen 5 7600X';
    else if (lower.includes('10400')) matchedCpu = 'Intel Core i5-10400F';
    else if (lower.includes('12400')) matchedCpu = 'Intel Core i5-12400F';
    else if (lower.includes('13600')) matchedCpu = 'Intel Core i5-13600K';
    else if (lower.includes('14700')) matchedCpu = 'Intel Core i7-14700K';
    else if (lower.includes('fx-8350') || lower.includes('fx 8350')) matchedCpu = 'AMD FX-8350 Black Edition';

    // Check GPU keywords
    if (lower.includes('4070 super')) matchedGpu = 'NVIDIA GeForce RTX 4070 Super 12GB';
    else if (lower.includes('4070')) matchedGpu = 'NVIDIA GeForce RTX 4070 12GB';
    else if (lower.includes('4080')) matchedGpu = 'NVIDIA GeForce RTX 4080 Super 16GB';
    else if (lower.includes('4090')) matchedGpu = 'NVIDIA GeForce RTX 4090 24GB';
    else if (lower.includes('3080')) matchedGpu = 'NVIDIA GeForce RTX 3080 10GB';
    else if (lower.includes('3060')) matchedGpu = 'NVIDIA GeForce RTX 3060 12GB';
    else if (lower.includes('4060')) matchedGpu = 'NVIDIA GeForce RTX 4060 8GB';
    else if (lower.includes('7800 xt')) matchedGpu = 'AMD Radeon RX 7800 XT 16GB';
    else if (lower.includes('7900')) matchedGpu = 'AMD Radeon RX 7900 XTX 24GB';

    // Check RAM keywords
    if (lower.includes('8gb') || lower.includes('8 gb')) matchedRam = '8GB';
    else if (lower.includes('16gb') || lower.includes('16 gb')) matchedRam = '16GB';
    else if (lower.includes('32gb') || lower.includes('32 gb')) matchedRam = '32GB';
    else if (lower.includes('64gb') || lower.includes('64 gb')) matchedRam = '64GB';

    setSelectedCpuName(matchedCpu);
    setSelectedGpuName(matchedGpu);
    setSelectedRam(matchedRam);

    return { cpu: matchedCpu, gpu: matchedGpu, ram: matchedRam };
  };

  // Run Diagnosis
  const runDiagnosis = async (cpuToDiagnose?: string, gpuToDiagnose?: string, ramToDiagnose?: string) => {
    const targetCpu = cpuToDiagnose || selectedCpuName;
    const targetGpu = gpuToDiagnose || selectedGpuName;
    const targetRam = ramToDiagnose || selectedRam;

    setIsScanning(true);
    setApiError(null);

    // Call /api/build-doctor backend
    try {
      const response = await fetch('/api/build-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpu: targetCpu,
          gpu: targetGpu,
          ram: targetRam
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      console.warn('API diagnostic endpoint failed or unavailable, using local client diagnosis engine:', err);
      // Fallback cleanly to client-side hardware calculation engine
      const clientReport = generateClientReport(targetCpu, targetGpu, targetRam);
      setReport(clientReport);
      setApiError('Connected to Local Silicon Diagnostic Engine (Offline Mode)');
    } finally {
      setIsScanning(false);
    }
  };

  // Initial diagnosis run on mount for Ryzen 5 3600 + RTX 4070 + 16GB RAM
  useEffect(() => {
    runDiagnosis('AMD Ryzen 5 3600', 'NVIDIA GeForce RTX 4070 12GB', '16GB');
  }, []);

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setNlInput(preset.label);
    setSelectedCpuName(preset.cpu);
    setSelectedGpuName(preset.gpu);
    setSelectedRam(preset.ram.includes('32') ? '32GB' : preset.ram.includes('8') ? '8GB' : '16GB');
    runDiagnosis(preset.cpu, preset.gpu, preset.ram);
  };

  const handleNaturalLanguageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseNaturalLanguage(nlInput);
    runDiagnosis(parsed.cpu, parsed.gpu, parsed.ram);
  };

  const handleCopyReport = () => {
    if (!report) return;
    const textReport = `BUILD HEALTH REPORT
==================
Configuration: ${report.config.cpu} + ${report.config.gpu} + ${report.config.ram}
Overall Health Score: ${report.overallHealthScore}/100
Verdict: ${report.overallVerdict}

CPU → GPU balance
-----------------
1080p: ${report.balance.res1080p.status} (${report.balance.res1080p.explanation})
1440p: ${report.balance.res1440p.status} (${report.balance.res1440p.explanation})
4K: ${report.balance.res4k.status} (${report.balance.res4k.explanation})

Memory
------
${report.memory.statusText}
Analysis: ${report.memory.analysis}

Platform
--------
${report.platform.statusText}
Max Suggested Upgrade: ${report.platform.maxRecommendedCpu}
Analysis: ${report.platform.analysis}

Recommended upgrade sequence
----------------------------
${report.upgradeSequence.map(s => `${s.step}. ${s.target} [${s.priority}] - ₹${s.costINR.toLocaleString('en-IN')}: ${s.rationale}`).join('\n')}

Architectural Rationale
-----------------------
${report.detailedRationale.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;

    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Find IDs for navigation
  const matchedCpuItem = useMemo(() => {
    return cpuDataset.find(c => c.Model.toLowerCase().includes(selectedCpuName.toLowerCase()) || selectedCpuName.toLowerCase().includes(c.Model.toLowerCase())) || cpuDataset[0];
  }, [selectedCpuName]);

  const matchedGpuItem = useMemo(() => {
    return gpuDataset.find(g => g.Model.toLowerCase().includes(selectedGpuName.toLowerCase()) || selectedGpuName.toLowerCase().includes(g.Model.toLowerCase())) || gpuDataset[0];
  }, [selectedGpuName]);

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in" id="ai-build-doctor-container">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 md:p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Silicon Diagnostic Assistant</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              AI Build Doctor
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                v2.5 Architecture Engine
              </span>
            </h1>
            <p className="text-sm md:text-base text-zinc-400 max-w-2xl">
              Beyond simple bottleneck percentages. Get an in-depth, resolution-aware Build Health Report with platform longevity analysis, memory paging impact, and prioritized upgrade paths with explicit engineering rationales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => runDiagnosis()}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              id="btn-re-run-diagnosis"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Diagnosing...' : 'Re-Run Diagnostic'}</span>
            </button>
            {report && (
              <button
                onClick={handleCopyReport}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                id="btn-copy-health-report"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Report!' : 'Copy Report'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Natural Language & Component Input Bar */}
      <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800 p-6 space-y-6">
        <div className="space-y-3">
          <label htmlFor="nl-query-input" className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
            Natural Language Rig Input
          </label>
          <form onSubmit={handleNaturalLanguageSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                id="nl-query-input"
                type="text"
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                placeholder="e.g. Ryzen 5 3600 + RTX 4070 + 16GB RAM"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-sm md:text-base transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isScanning}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
              id="btn-parse-and-diagnose"
            >
              Parse & Diagnose
            </button>
          </form>
        </div>

        {/* Quick Test Presets (including the exact user request) */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quick Diagnostic Presets:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {QUICK_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                  nlInput.includes(preset.cpu.split(' ')[2] || '') && nlInput.includes('4070') && idx === 0
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-zinc-100'
                    : 'bg-zinc-950/60 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                }`}
                id={`preset-btn-${idx}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 truncate">
                    {preset.label}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                    preset.badge === 'Popular'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : preset.badge === 'Disaster'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {preset.badge}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">{preset.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Component Pickers */}
        <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="select-cpu-picker" className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Processor (CPU)
            </label>
            <select
              id="select-cpu-picker"
              value={selectedCpuName}
              onChange={(e) => {
                setSelectedCpuName(e.target.value);
                const keepIgpu = useIgpu && Boolean(igpuFor(e.target.value));
                if (!keepIgpu) setUseIgpu(false);
                const gpu = gpuFor(e.target.value, selectedGpuName, keepIgpu);
                setNlInput(`${e.target.value} + ${gpu} + ${selectedRam} RAM`);
                runDiagnosis(e.target.value, gpu, selectedRam);
              }}
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-cyan-500"
            >
              {cpuDataset.map((cpu) => (
                <option key={cpu.id} value={cpu.Model}>
                  {cpu.Model} ({cpu.Socket}, {cpu.Cores_Threads})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="select-gpu-picker" className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Graphics Card (GPU)
            </label>
            <select
              id="select-gpu-picker"
              disabled={useIgpu}
              value={selectedGpuName}
              onChange={(e) => {
                setSelectedGpuName(e.target.value);
                setNlInput(`${selectedCpuName} + ${e.target.value} + ${selectedRam} RAM`);
                runDiagnosis(selectedCpuName, e.target.value, selectedRam);
              }}
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-cyan-500"
            >
              {gpuDataset.map((gpu) => (
                <option key={gpu.id} value={gpu.Model}>
                  {gpu.Model} ({gpu.VRAM_GB}GB, {gpu.TGP_Watts}W)
                </option>
              ))}
            </select>
            <IntegratedGraphicsToggle
              cpu={cpuDataset.find((c) => c.Model === selectedCpuName)}
              checked={useIgpu}
              onChange={(on) => {
                setUseIgpu(on);
                const gpu = gpuFor(selectedCpuName, selectedGpuName, on);
                setNlInput(`${selectedCpuName} + ${gpu} + ${selectedRam} RAM`);
                runDiagnosis(selectedCpuName, gpu, selectedRam);
              }}
            />
          </div>

          <div>
            <label htmlFor="select-ram-picker" className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              System Memory (RAM)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['8GB', '16GB', '32GB', '64GB'].map((ramOption) => (
                <button
                  key={ramOption}
                  type="button"
                  onClick={() => {
                    setSelectedRam(ramOption);
                    setNlInput(`${selectedCpuName} + ${gpuFor(selectedCpuName, selectedGpuName)} + ${ramOption} RAM`);
                    runDiagnosis(selectedCpuName, gpuFor(selectedCpuName, selectedGpuName), ramOption);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    selectedRam === ramOption
                      ? 'bg-cyan-500 text-zinc-950 border-cyan-400 shadow-sm'
                      : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                  }`}
                  id={`ram-btn-${ramOption}`}
                >
                  {ramOption}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Scanning Telemetry */}
      {isScanning && (
        <div className="bg-zinc-900/90 rounded-2xl border border-cyan-500/40 p-8 text-center space-y-4 shadow-lg shadow-cyan-500/5 animate-pulse">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-8 h-8 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Running Silicon Diagnostic Scans...</h2>
            <p className="text-sm text-zinc-400">
              Evaluating instruction dispatch queue, 1080p/1440p/4K raster loads, memory paging risk, and socket upgrade paths.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          THE BUILD HEALTH REPORT
          ========================================================================= */}
      {report && !isScanning && (
        <div className="space-y-8" id="build-health-report-section">
          {/* Header Card: Summary & Overall Health */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
              <div>
                <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  DIAGNOSTIC TELEMETRY OUTPUT
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                  BUILD HEALTH REPORT
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Analyzed rig: <span className="text-zinc-200 font-semibold">{report.config.cpu}</span> + <span className="text-zinc-200 font-semibold">{report.config.gpu}</span> + <span className="text-zinc-200 font-semibold">{report.config.ram}</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-zinc-400 font-medium">Build Health Score</div>
                  <div className="text-3xl font-black text-cyan-400 flex items-baseline justify-end gap-1">
                    {report.overallHealthScore}
                    <span className="text-xs font-normal text-zinc-500">/ 100</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Activity className="w-7 h-7" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Doctor's Primary Verdict</div>
                <div className="text-sm text-zinc-200 font-medium mt-0.5">{report.overallVerdict}</div>
              </div>
            </div>

            {/* SECTION 1: CPU -> GPU BALANCE */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">CPU → GPU balance</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1080p Resolution Card */}
                <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">1080p FHD Esports</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      report.balance.res1080p.status.includes('CPU constrained')
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      1080p: {report.balance.res1080p.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>CPU Load: {report.balance.res1080p.cpuLoadEst}%</span>
                      <span>GPU Load: {report.balance.res1080p.gpuLoadEst}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className="bg-amber-500 h-full" style={{ width: `${report.balance.res1080p.cpuLoadEst}%` }} />
                      <div className="bg-zinc-700 h-full flex-1" />
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {report.balance.res1080p.explanation}
                  </p>
                </div>

                {/* 1440p Resolution Card */}
                <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">1440p QHD Sweet Spot</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      1440p: {report.balance.res1440p.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>CPU Load: {report.balance.res1440p.cpuLoadEst}%</span>
                      <span>GPU Load: {report.balance.res1440p.gpuLoadEst}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className="bg-cyan-500 h-full" style={{ width: `${report.balance.res1440p.gpuLoadEst}%` }} />
                      <div className="bg-zinc-700 h-full flex-1" />
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {report.balance.res1440p.explanation}
                  </p>
                </div>

                {/* 4K Resolution Card */}
                <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">4K UHD Ultra</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      4K: {report.balance.res4k.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>CPU Load: {report.balance.res4k.cpuLoadEst}%</span>
                      <span>GPU Load: {report.balance.res4k.gpuLoadEst}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className="bg-purple-500 h-full" style={{ width: `${report.balance.res4k.gpuLoadEst}%` }} />
                      <div className="bg-zinc-700 h-full flex-1" />
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {report.balance.res4k.explanation}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: MEMORY */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">Memory</h3>
              </div>

              <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-mono">{report.memory.capacity}</span>
                    <span className="text-amber-400 font-semibold">{report.memory.statusText}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    report.memory.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : report.memory.severity === 'moderate'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {report.memory.severity} constraint
                  </span>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed">
                  {report.memory.analysis}
                </p>

                <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>1% Low Hitching Risk:</strong> {report.memory.hitchingRisk}</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: PLATFORM */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">Platform</h3>
              </div>

              <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-mono font-bold">
                      {report.platform.socket}
                    </span>
                    <span className="text-cyan-400 font-semibold">{report.platform.statusText}</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                    {report.platform.upgradePotential} upgrade longevity
                  </span>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed">
                  {report.platform.analysis}
                </p>

                <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Highest Drop-in Socket Upgrade:</strong> {report.platform.maxRecommendedCpu}</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: RECOMMENDED UPGRADE SEQUENCE */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white tracking-tight">Recommended upgrade sequence</h3>
                </div>
                <span className="text-xs text-zinc-400">Order by ROI & Physical Bottleneck Priority</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.upgradeSequence.map((step) => (
                  <div
                    key={step.step}
                    className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 transition-all ${
                      step.priority === 'Immediate'
                        ? 'bg-gradient-to-b from-emerald-950/30 to-zinc-950 border-emerald-500/40 shadow-sm'
                        : step.priority === 'Secondary'
                        ? 'bg-gradient-to-b from-cyan-950/30 to-zinc-950 border-cyan-500/40'
                        : 'bg-zinc-950/80 border-zinc-800'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center">
                          {step.step}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${
                          step.priority === 'Immediate'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : step.priority === 'Secondary'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {step.priority}
                        </span>
                      </div>

                      <div>
                        <div className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                          {step.target}
                        </div>
                        <div className="text-xs font-semibold text-zinc-400 mt-0.5">
                          {step.costINR > 0 ? `Est. Cost: ~₹${step.costINR.toLocaleString('en-IN')}` : 'Cost: ₹0 (No Action Required)'}
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {step.rationale}
                      </p>
                    </div>

                    {/^(CPU|GPU) → /.test(step.target) && step.priority !== 'Keep' && onNavigateToBuilder && (
                      <button
                        onClick={() => {
                          // Load the recommended part into Rig Architect alongside the rest of the current build
                          const name = step.target.replace(/^(CPU|GPU) → /, '');
                          const cpuPick = step.target.startsWith('CPU') ? cpuDataset.find((c) => c.Model === name) : undefined;
                          const gpuPick = step.target.startsWith('GPU') ? gpuDataset.find((g) => g.Model === name) : undefined;
                          onNavigateToBuilder((cpuPick ?? matchedCpuItem).id, (gpuPick ?? matchedGpuItem).id);
                        }}
                        className="w-full py-2 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-auto"
                        id={`btn-apply-upgrade-${step.step}`}
                      >
                        <span>Configure in Rig Architect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: AND IMPORTANTLY, EXPLAIN WHY EACH RECOMMENDATION EXISTS */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Why each recommendation exists (Engineering & Financial Breakdown)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.detailedRationale.map((rationaleText, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wide">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">
                        0{idx + 1}
                      </span>
                      <span>Architectural Rationale</span>
                    </div>
                    <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                      {rationaleText}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-6 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {onNavigateToSynergy && (
                  <button
                    onClick={() => onNavigateToSynergy(matchedCpuItem.id, matchedGpuItem.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                    id="btn-nav-synergy-from-doctor"
                  >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Test in Bottleneck Lab</span>
                  </button>
                )}
                {onNavigateToBuilder && (
                  <button
                    onClick={() => onNavigateToBuilder(matchedCpuItem.id, matchedGpuItem.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                    id="btn-nav-builder-from-doctor"
                  >
                    <Wrench className="w-4 h-4 text-blue-400" />
                    <span>Open in Rig Architect</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-zinc-500 font-mono">
                Telemetry Hash: SHA256-BD-{Date.now().toString(36).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
