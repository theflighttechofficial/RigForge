import React, { useState, useMemo, useEffect } from 'react';
import { GPUItem } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Download,
  RefreshCw,
  Cpu,
  CheckCircle2,
  Clock,
  Zap,
  HardDrive,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

interface DriverHealthPanelProps {
  gpu: GPUItem;
  onDriverHealthChange?: (info: {
    installedVersion: string;
    latestVersion: string;
    status: 'optimal' | 'recommended' | 'critical';
    statusLabel: string;
  }) => void;
}

interface DriverProfile {
  brand: 'NVIDIA' | 'AMD' | 'Intel';
  latestWhqlVersion: string;
  releaseDate: string;
  downloadUrl: string;
  driverSuiteName: string;
  keyEnhancements: string[];
  vramOptimization: string;
  presetVersions: { label: string; version: string; type: 'latest' | 'recent' | 'outdated' | 'day1' }[];
}

const DRIVER_DATABASE: Record<'NVIDIA' | 'AMD' | 'Intel', DriverProfile> = {
  NVIDIA: {
    brand: 'NVIDIA',
    latestWhqlVersion: '566.14',
    releaseDate: 'Current WHQL Branch',
    downloadUrl: 'https://www.nvidia.com/Download/index.aspx',
    driverSuiteName: 'GeForce Game Ready & Studio Driver',
    keyEnhancements: [
      'DLSS 3.7 Ray Reconstruction with enhanced temporal stability',
      'Reflex Low Latency frame-pacing micro-stutter suppression',
      'Zero-day Game Ready profiles for modern Unreal Engine 5 releases',
      'Chromium browser hardware acceleration artifact & flicker fixes'
    ],
    vramOptimization: 'Rebar memory allocation optimized: up to +8% 1% Low frame rates',
    presetVersions: [
      { label: '566.14 (Latest Certified WHQL)', version: '566.14', type: 'latest' },
      { label: '561.09 (2 Months Old - Stable)', version: '561.09', type: 'recent' },
      { label: '551.86 (6 Months Old - Missing UE5 Fixes)', version: '551.86', type: 'outdated' },
      { label: '537.58 (Legacy Day-1 - High Crash Risk)', version: '537.58', type: 'day1' }
    ]
  },
  AMD: {
    brand: 'AMD',
    latestWhqlVersion: '24.12.1',
    releaseDate: 'Current WHQL Branch',
    downloadUrl: 'https://www.amd.com/en/support',
    driverSuiteName: 'AMD Software: Adrenalin Edition',
    keyEnhancements: [
      'AMD Fluid Motion Frames 2 (AFMF 2) driver-level frame generation',
      'AMD HYPR-RX one-click latency and rendering throughput booster',
      'Anti-Lag 2 sub-millisecond dispatch responsiveness',
      'DirectX 12 Ultimate shader cache pre-compilation speedups'
    ],
    vramOptimization: 'Smart Access Memory (SAM) bus bandwidth improved: up to +10% 1% Lows',
    presetVersions: [
      { label: '24.12.1 (Latest Certified WHQL)', version: '24.12.1', type: 'latest' },
      { label: '24.9.1 (2 Months Old - Solid)', version: '24.9.1', type: 'recent' },
      { label: '24.3.1 (8 Months Old - Missing AFMF 2)', version: '24.3.1', type: 'outdated' },
      { label: '23.11.1 (Day-1 RDNA 3 - Stutter Known)', version: '23.11.1', type: 'day1' }
    ]
  },
  Intel: {
    brand: 'Intel',
    latestWhqlVersion: '32.0.101.6252',
    releaseDate: 'Current WHQL Branch',
    downloadUrl: 'https://www.intel.com/content/www/us/en/download/785597/intel-arc-iris-xe-graphics-windows.html',
    driverSuiteName: 'Intel Arc & Iris Xe Graphics WHQL',
    keyEnhancements: [
      'Legacy DirectX 9 and DX11 translation layer +25% performance boost',
      'Intel XeSS 1.3 frame generation model update',
      'Arc Control panel telemetry and fan curve management overhaul',
      'Blender 4.x Embree GPU hardware ray tracing acceleration'
    ],
    vramOptimization: 'PCIe Resizable BAR requirement validation & memory tiling fix',
    presetVersions: [
      { label: '32.0.101.6252 (Latest Certified WHQL)', version: '32.0.101.6252', type: 'latest' },
      { label: '32.0.101.5972 (2 Months Old)', version: '32.0.101.5972', type: 'recent' },
      { label: '31.0.101.5333 (7 Months Old - DX11 Stutters)', version: '31.0.101.5333', type: 'outdated' },
      { label: '31.0.101.4887 (Day-1 Alchemist - Severe Inefficiencies)', version: '31.0.101.4887', type: 'day1' }
    ]
  }
};

export const DriverHealthPanel: React.FC<DriverHealthPanelProps> = ({ gpu, onDriverHealthChange }) => {
  // Determine GPU brand profile
  const profile = useMemo(() => {
    return DRIVER_DATABASE[gpu.Brand] || DRIVER_DATABASE.NVIDIA;
  }, [gpu.Brand]);

  // Current user installed driver version state
  const [installedVersion, setInstalledVersion] = useState<string>(profile.latestWhqlVersion);
  const [customInput, setCustomInput] = useState<string>('');
  const [useCustomInput, setUseCustomInput] = useState<boolean>(false);

  // Parse version numbers for comparison
  const comparisonResult = useMemo(() => {
    const activeVersion = useCustomInput && customInput.trim() ? customInput.trim() : installedVersion;

    const parseSegments = (ver: string): number[] => {
      return ver.split(/[\.-]/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    };

    const installedSegments = parseSegments(activeVersion);
    const latestSegments = parseSegments(profile.latestWhqlVersion);

    let status: 'optimal' | 'recommended' | 'critical' = 'optimal';
    let statusLabel = 'Certified Up to Date (WHQL)';
    let penaltyPercent = 0;
    let missingFeatures: string[] = [];

    // Compare versions
    if (activeVersion === profile.latestWhqlVersion) {
      status = 'optimal';
      statusLabel = 'Certified Up to Date (WHQL)';
      penaltyPercent = 0;
    } else {
      // Numerical check
      const isOutdated = installedSegments[0] < latestSegments[0] ||
        (installedSegments[0] === latestSegments[0] && (installedSegments[1] || 0) < (latestSegments[1] || 0));

      const majorDiff = (latestSegments[0] || 0) - (installedSegments[0] || 0);

      if (majorDiff >= 2 || (gpu.Brand === 'NVIDIA' && majorDiff >= 15) || (gpu.Brand === 'AMD' && majorDiff >= 1)) {
        status = 'critical';
        statusLabel = 'Critical Driver Lag (>6 Months Outdated)';
        penaltyPercent = 14;
        missingFeatures = [
          'High risk of DirectX 12 Device Lost kernel crashes in newly released games',
          'Elevated VRAM allocation overhead and frame-time hitching (-12% to -18% 1% Low FPS)',
          'Missing critical architectural power-state and ReBAR stability hotfixes'
        ];
      } else if (isOutdated) {
        status = 'recommended';
        statusLabel = 'Update Recommended (Minor Driver Lag)';
        penaltyPercent = 6;
        missingFeatures = [
          'Missing latest Day-0 Game Ready profiles for newly patched titles',
          'Slightly higher 1% Low frametime volatility in heavy Ray Tracing scenes (~5% delta)'
        ];
      } else {
        // Newer / Beta / Custom
        status = 'optimal';
        statusLabel = 'Up to Date / Hotfix Preview Build';
        penaltyPercent = 0;
      }
    }

    return {
      activeVersion,
      status,
      statusLabel,
      penaltyPercent,
      missingFeatures
    };
  }, [installedVersion, customInput, useCustomInput, profile, gpu.Brand]);

  useEffect(() => {
    if (onDriverHealthChange) {
      onDriverHealthChange({
        installedVersion: comparisonResult.activeVersion,
        latestVersion: profile.latestWhqlVersion,
        status: comparisonResult.status,
        statusLabel: comparisonResult.statusLabel
      });
    }
  }, [
    comparisonResult.activeVersion,
    comparisonResult.status,
    comparisonResult.statusLabel,
    profile.latestWhqlVersion,
    onDriverHealthChange
  ]);

  const handleSelectPreset = (ver: string) => {
    setUseCustomInput(false);
    setInstalledVersion(ver);
  };

  return (
    <div id="driver-health-panel" className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Silicon Ecosystem & Firmware Health
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <span>GPU Driver Health & Official WHQL Verification</span>
          </h3>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Monitor driver version compliance for <span className="text-purple-300 font-bold">{gpu.Model}</span>. GPU drivers dictate API translation efficiency, frame generation models, and ReBAR memory caching on modern Windows systems.
          </p>
        </div>

        {/* Official Driver Download Link Button */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={profile.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs font-mono transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD OFFICIAL {profile.brand.toUpperCase()} DRIVER</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* Driver Version Comparison Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Version Selector & Preset Simulation */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wide flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Simulated / Installed Driver Version</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-lg">
              Official WHQL: {profile.latestWhqlVersion}
            </span>
          </div>

          {/* Quick Version Presets */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 block">
              Select or test a driver branch:
            </label>
            <div className="space-y-2">
              {profile.presetVersions.map((preset) => {
                const isSelected = !useCustomInput && installedVersion === preset.version;
                return (
                  <button
                    key={preset.version}
                    type="button"
                    onClick={() => handleSelectPreset(preset.version)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between font-mono ${
                      isSelected
                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-sm'
                        : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{preset.label}</div>
                      <div className="text-[10px] text-zinc-500">
                        {preset.type === 'latest'
                          ? 'Zero-day performance optimizations active'
                          : preset.type === 'recent'
                          ? 'Minor frametime variances in newest titles'
                          : preset.type === 'outdated'
                          ? 'Missing framegen and stability updates'
                          : 'Severe driver regressions & crash vectors'}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Version Custom Input */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Or type your exact driver version:</span>
              <button
                type="button"
                onClick={() => setUseCustomInput(!useCustomInput)}
                className={`text-[11px] underline cursor-pointer ${
                  useCustomInput ? 'text-cyan-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {useCustomInput ? 'Custom Enabled' : 'Use Custom'}
              </button>
            </div>
            {useCustomInput && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`e.g. ${profile.latestWhqlVersion}`}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setInstalledVersion(customInput.trim() || profile.latestWhqlVersion)}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-white font-bold cursor-pointer transition-colors"
                >
                  Verify
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Driver Health Analysis & Performance Impact */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Diagnostic Assessment & Impact Model</span>
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                comparisonResult.status === 'optimal'
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : comparisonResult.status === 'recommended'
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                  : 'bg-rose-950/80 border-rose-500/60 text-rose-300 shadow-glow-crimson'
              }`}>
                {comparisonResult.statusLabel}
              </span>
            </div>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1 font-mono">
              <span className="text-[10px] text-zinc-500 uppercase block">Installed Branch</span>
              <div className="text-base font-bold text-white truncate">{comparisonResult.activeVersion}</div>
              <span className="text-[10px] text-zinc-400">{profile.driverSuiteName.split('&')[0]}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1 font-mono">
              <span className="text-[10px] text-zinc-500 uppercase block">Latest Official</span>
              <div className="text-base font-bold text-emerald-400">{profile.latestWhqlVersion}</div>
              <span className="text-[10px] text-zinc-400">{profile.releaseDate}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1 font-mono col-span-2 sm:col-span-1">
              <span className="text-[10px] text-zinc-500 uppercase block">1% Low FPS Penalty</span>
              <div className={`text-base font-bold ${
                comparisonResult.penaltyPercent > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {comparisonResult.penaltyPercent > 0 ? `-${comparisonResult.penaltyPercent}%` : '0% (Peak)'}
              </div>
              <span className="text-[10px] text-zinc-400">
                {comparisonResult.penaltyPercent > 0 ? 'Micro-stutter risk' : 'Full frame pacing'}
              </span>
            </div>
          </div>

          {/* Key Enhancements in Latest Driver Branch */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Latest Official Driver Optimizations ({profile.brand}):
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">WHQL Certified</span>
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
              {profile.keyEnhancements.map((enhancement, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">{enhancement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Warnings for Outdated Drivers */}
          {comparisonResult.missingFeatures.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Risks Associated with Installed Version ({comparisonResult.activeVersion}):</span>
              </div>
              <ul className="space-y-1 text-zinc-300 text-[11px]">
                {comparisonResult.missingFeatures.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">&bull;</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Best Practices Clean Install Advisory */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 text-xs font-mono text-zinc-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-zinc-200 font-bold block">Display Driver Uninstaller (DDU) Advisory:</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                When switching between GPU vendors (e.g. GeForce to Radeon) or resolving persistent shader cache stutters, boot into Windows Safe Mode and execute a clean wipe via DDU before installing official {profile.latestWhqlVersion} WHQL binaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
