import React, { useState } from 'react';
import { CPUItem, GPUItem } from '../types';
import { AssemblyCanvas3D } from './spatial/AssemblyCanvas3D';
import { DeskPlannerCanvas3D, DeskType, DeskFinish, ChairType, MonitorArmConfig } from './spatial/DeskPlannerCanvas3D';
import { ARViewerModal } from './spatial/ARViewerModal';
import { AirflowSimulator3D } from './spatial/AirflowSimulator3D';
import { ClearanceWarningSimulator3D } from './spatial/ClearanceWarningSimulator3D';
import { RGBLightingSandbox } from './spatial/RGBLightingSandbox';
import { formatINR } from '../utils/formatters';
import {
  Layers,
  Box,
  Monitor,
  Camera,
  Sparkles,
  Sliders,
  Maximize2,
  CheckCircle2,
  Cpu,
  Compass,
  Zap,
  Palette,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Laptop,
  Wind,
  ShieldAlert,
  Sun
} from 'lucide-react';

export interface Spatial3DStudioProps {
  selectedCpu: CPUItem;
  selectedGpu: GPUItem;
  allCpus: CPUItem[];
  allGpus: GPUItem[];
  onSelectCpu: (cpu: CPUItem) => void;
  onSelectGpu: (gpu: GPUItem) => void;
  onOpenRigArchitect?: () => void;
  theme?: 'dark' | 'light';
}

export type SpatialStudioMode = 'assembly' | 'clearance' | 'airflow' | 'rgb' | 'desk' | 'ar';

export const Spatial3DStudio: React.FC<Spatial3DStudioProps> = ({
  selectedCpu,
  selectedGpu,
  allCpus,
  allGpus,
  onSelectCpu,
  onSelectGpu,
  onOpenRigArchitect,
  theme = 'dark'
}) => {
  const [activeMode, setActiveMode] = useState<SpatialStudioMode>('assembly');
  const [isArModalOpen, setIsArModalOpen] = useState<boolean>(false);
  const [arTargetObject, setArTargetObject] = useState<'tower' | 'desk'>('tower');

  // Shared Hardware & Aesthetic Configuration
  const [ramType, setRamType] = useState<'DDR4' | 'DDR5'>('DDR5');
  const [ramCapacity, setRamCapacity] = useState<number>(32);
  const [coolerType, setCoolerType] = useState<'Tower Air' | '360mm AIO' | 'Stock'>('360mm AIO');
  const [activeRgbTheme, setActiveRgbTheme] = useState<string>('cyan');
  const [customMasterRgb, setCustomMasterRgb] = useState<string>('#06b6d4');

  // RGB Hex Map
  const rgbThemes: Record<string, { label: string; hex: string; desc: string }> = {
    cyan: { label: 'Cyberpunk Cyan', hex: '#06b6d4', desc: 'Futuristic high-contrast cool aura' },
    neon: { label: 'Tokyo Violet', hex: '#a855f7', desc: 'Synthwave neon luminescence' },
    emerald: { label: 'Matrix Emerald', hex: '#10b981', desc: 'Overclocked clean silicon green' },
    sunset: { label: 'Amber Horizon', hex: '#f59e0b', desc: 'Warm dusk ambient glow' },
    stealth: { label: 'Stealth Blackout', hex: '#3f3f46', desc: 'Zero RGB minimal competition look' },
    polar: { label: 'Arctic White', hex: '#f4f4f5', desc: 'Clean laboratory studio illumination' }
  };

  const currentRgbHex = customMasterRgb || rgbThemes[activeRgbTheme]?.hex || '#06b6d4';

  const totalHardwareCostINR =
    (selectedCpu.Price_INR || 30000) +
    (selectedGpu.Price_INR || 75000) +
    (ramCapacity >= 64 ? 18000 : 9500) +
    (coolerType === '360mm AIO' ? 11500 : 4500) +
    18500 + // Motherboard
    12500 + // 850W PSU
    11000; // Cabinet

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Hero Header */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: currentRgbHex }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Spatial Computing & Hardware Simulator Suite</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              3D Assembly, Airflow & Lighting Studio
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed">
              Step inside your build before buying. Verify 3D clearance conflicts with highlighted red overlap zones, trace thermal airflow dynamics with intake/exhaust vectors, sync ARGB lighting across all components, and project your life-size rig into your room via AR.
            </p>
          </div>

          {/* Quick Stat / Cost Snapshot */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 font-mono text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Simulated Build Spec</span>
              <div className="text-sm font-bold text-white">{selectedCpu.Model}</div>
              <div className="text-xs text-cyan-400 font-bold">{selectedGpu.Model}</div>
              <div className="text-[11px] text-zinc-400 mt-1">{formatINR(totalHardwareCostINR)} Est.</div>
            </div>

            <button
              onClick={() => {
                setArTargetObject(activeMode === 'desk' ? 'desk' : 'tower');
                setIsArModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs sm:text-sm font-mono transition-transform active:scale-95 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Camera className="w-4 h-4" />
              <span>Launch AR Floor Preview</span>
            </button>
          </div>
        </div>

        {/* Master Navigation Switcher Tabs */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800">
            {/* 1. 3D Assembly */}
            <button
              onClick={() => setActiveMode('assembly')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                activeMode === 'assembly'
                  ? 'bg-cyan-500 text-zinc-950 shadow-md scale-102'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>1. 3D Assembly Visualizer</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-normal">BuildCores</span>
            </button>

            {/* 2. Real-World Clearance */}
            <button
              onClick={() => setActiveMode('clearance')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                activeMode === 'clearance'
                  ? 'bg-rose-500 text-zinc-950 shadow-md scale-102'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>2. 3D Clearance & Collision Lab</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-normal">Red Overlap</span>
            </button>

            {/* 3. Fan Flow & Radiator Mapping */}
            <button
              onClick={() => setActiveMode('airflow')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                activeMode === 'airflow'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md scale-102'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Wind className="w-4 h-4" />
              <span>3. Fan Flow & Radiator Mapping</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-normal">CFM Vectors</span>
            </button>

            {/* 4. RGB & Lighting Sandbox */}
            <button
              onClick={() => setActiveMode('rgb')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                activeMode === 'rgb'
                  ? 'bg-amber-400 text-zinc-950 shadow-md scale-102'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>4. RGB & Lighting Sandbox</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-normal">Aura Sync</span>
            </button>

            {/* 5. Entire Desk Planner */}
            <button
              onClick={() => setActiveMode('desk')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                activeMode === 'desk'
                  ? 'bg-violet-500 text-zinc-950 shadow-md scale-102'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>5. Desk Setup Planner</span>
            </button>

            {/* 6. AR Floor View */}
            <button
              onClick={() => {
                setArTargetObject('tower');
                setIsArModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>6. AR Floor View</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-normal">
                1:1
              </span>
            </button>
          </div>

          {/* RGB Palette Quick Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Aura RGB:
            </span>
            <div className="flex items-center gap-1.5">
              {Object.entries(rgbThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveRgbTheme(key);
                    setCustomMasterRgb(theme.hex);
                  }}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                    activeRgbTheme === key
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110 border-white'
                      : 'border-zinc-700 opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: theme.hex }}
                  title={`${theme.label} - ${theme.desc}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Configuration Bar (Change CPU / GPU / Cooler live) */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          {/* Quick CPU Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase">CPU:</span>
            <select
              value={selectedCpu.id}
              onChange={(e) => {
                const found = allCpus.find((c) => c.id === e.target.value);
                if (found) onSelectCpu(found);
              }}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-zinc-200 font-bold text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {allCpus.slice(0, 16).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.Model} ({c.Socket})
                </option>
              ))}
            </select>
          </div>

          {/* Quick GPU Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase">GPU:</span>
            <select
              value={selectedGpu.id}
              onChange={(e) => {
                const found = allGpus.find((g) => g.id === e.target.value);
                if (found) onSelectGpu(found);
              }}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-cyan-300 font-bold text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {allGpus.slice(0, 16).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.Model} ({g.VRAM_GB}GB - {g.Length_mm}mm)
                </option>
              ))}
            </select>
          </div>

          {/* Cooler Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase">Cooler:</span>
            <div className="flex bg-zinc-950 p-0.5 rounded-xl border border-zinc-800">
              <button
                onClick={() => setCoolerType('360mm AIO')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  coolerType === '360mm AIO' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                360mm Liquid AIO
              </button>
              <button
                onClick={() => setCoolerType('Tower Air')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  coolerType === 'Tower Air' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Dual-Tower Air
              </button>
            </div>
          </div>

          {/* RAM Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase">RAM:</span>
            <div className="flex bg-zinc-950 p-0.5 rounded-xl border border-zinc-800">
              {[32, 64].map((cap) => (
                <button
                  key={cap}
                  onClick={() => setRamCapacity(cap)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    ramCapacity === cap ? 'bg-zinc-800 text-cyan-300' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {cap}GB {cap === 64 ? '(4 Sticks)' : '(2 Sticks)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {onOpenRigArchitect && (
          <button
            onClick={onOpenRigArchitect}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <span>Open in Full Rig Architect</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Mode Viewport Display */}
      {activeMode === 'assembly' && (
        <AssemblyCanvas3D
          selectedCpu={selectedCpu}
          selectedGpu={selectedGpu}
          ramType={ramType}
          ramCapacity={ramCapacity}
          coolerType={coolerType}
          rgbColorHex={currentRgbHex}
          theme={theme}
        />
      )}

      {activeMode === 'clearance' && (
        <ClearanceWarningSimulator3D
          selectedCpu={selectedCpu}
          selectedGpu={selectedGpu}
        />
      )}

      {activeMode === 'airflow' && (
        <AirflowSimulator3D
          initialArchitecture={coolerType === '360mm AIO' ? 'aio-top' : 'air-tower'}
          rgbColorHex={currentRgbHex}
        />
      )}

      {activeMode === 'rgb' && (
        <RGBLightingSandbox
          currentMasterColor={currentRgbHex}
          onMasterColorChange={(hex) => {
            setCustomMasterRgb(hex);
          }}
        />
      )}

      {activeMode === 'desk' && (
        <DeskPlannerCanvas3D
          initialDeskType="standing"
          initialFinish="walnut"
          initialChair="mesh"
          initialMonitorConfig="dual"
          rgbColorHex={currentRgbHex}
        />
      )}

      {/* AR Modal */}
      <ARViewerModal
        isOpen={isArModalOpen}
        onClose={() => setIsArModalOpen(false)}
        selectedCpu={selectedCpu}
        selectedGpu={selectedGpu}
        targetObject={arTargetObject}
        rgbColorHex={currentRgbHex}
      />
    </div>
  );
};
