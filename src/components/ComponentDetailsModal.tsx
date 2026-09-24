import React from 'react';
import { CPUItem, GPUItem, HardwareItem } from '../types';
import { formatINR, formatScore, getValueIndex, getPowerEfficiency } from '../utils/formatters';
import { X, Cpu, Monitor, Zap, Award, ExternalLink, GitCompare, GitMerge } from 'lucide-react';

interface ComponentDetailsModalProps {
  item: HardwareItem | null;
  onClose: () => void;
  onSelectForCompare: (item: HardwareItem) => void;
  onSelectForSynergy: (item: HardwareItem) => void;
}

export const ComponentDetailsModal: React.FC<ComponentDetailsModalProps> = ({
  item,
  onClose,
  onSelectForCompare,
  onSelectForSynergy
}) => {
  if (!item) return null;

  const isCPU = item.category === 'CPU';
  const cpu = isCPU ? (item as CPUItem) : null;
  const gpu = !isCPU ? (item as GPUItem) : null;

  const valueIdx = getValueIndex(item.Benchmark_Score, item.Price_INR);
  const eff = getPowerEfficiency(item);

  const eraColor =
    item.Era === 'vintage'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : item.Era === 'workstation'
      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      : item.Era === 'enthusiast'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-700 p-6 shadow-2xl space-y-6 text-white overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div
          className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isCPU ? 'bg-cyan-500/20' : 'bg-purple-500/20'
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isCPU ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                {item.category} Specification Dossier
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${eraColor}`}>
                Era: {item.Era}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Released {item.ReleaseYear}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">{item.Model}</h2>
            <div className="text-xs text-zinc-400 font-mono">
              Architecture: <strong className="text-white">{item.Architecture}</strong> &bull; Manufacturer: <strong className="text-white">{item.Brand}</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Market Price (INR)</span>
            <div className="text-lg font-black text-emerald-400 font-mono">
              {formatINR(item.Price_INR)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Benchmark Score</span>
            <div className="text-lg font-black text-cyan-400 font-mono">
              {formatScore(item.Benchmark_Score)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Gaming Index</span>
            <div className="text-lg font-black text-purple-400 font-mono">
              {formatScore(item.Gaming_Score)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Value Efficiency</span>
            <div className="text-lg font-black text-amber-400 font-mono">
              {valueIdx} <span className="text-[10px] text-zinc-500 font-normal">pts/₹1k</span>
            </div>
          </div>
        </div>

        {/* 6-Axis Multi-Workload Radar Capability Matrix */}
        {item.RadarScores && (
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                6-Axis Architectural Workload Capability
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Normalized Index (0 - 100)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              {[
                { label: '1080p Esports', score: item.RadarScores.esports1080p },
                { label: '1440p/4K Raster', score: item.RadarScores.raster1440p4k },
                { label: 'Ray Tracing', score: item.RadarScores.rayTracing },
                { label: 'Video Editing', score: item.RadarScores.videoEditing },
                { label: '3D Render (Blender)', score: item.RadarScores.render3D },
                { label: 'AI Compute / LLM', score: item.RadarScores.aiCompute }
              ].map(m => (
                <div key={m.label} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 space-y-1">
                  <div className="text-[10px] text-zinc-400 truncate">{m.label}</div>
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${m.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white">{m.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architectural Deep-Dive Grid */}
        <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-4 space-y-3 font-mono text-xs">
          <h4 className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold border-b border-zinc-800/80 pb-2">
            Technical Specification Matrix
          </h4>

          {isCPU && cpu && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-zinc-300">
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Socket / Platform:</span>
                <span className="font-bold text-white">{cpu.Socket}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Cores / Threads:</span>
                <span className="font-bold text-white">{cpu.Cores_Threads}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Base / Boost Clock:</span>
                <span className="font-bold text-white">{cpu.Base_Boost_GHz}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">L2 + L3 Cache:</span>
                <span className="font-bold text-white">{cpu.Cache_MB} MB</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">TDP Thermal Power:</span>
                <span className="font-bold text-white">{cpu.TDP_Watts} Watts</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">PCIe Version:</span>
                <span className="font-bold text-white">{cpu.PCIe_Gen}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Memory Standard:</span>
                <span className="font-bold text-white">{cpu.Memory_Support}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Integrated Graphics:</span>
                <span className="font-bold text-white">{cpu.Has_iGPU ? 'Included (iGPU)' : 'None (Discrete Req.)'}</span>
              </div>
            </div>
          )}

          {!isCPU && gpu && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-zinc-300">
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">VRAM Capacity:</span>
                <span className="font-bold text-white">{gpu.VRAM_GB} GB {gpu.Memory_Type}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Memory Bus Width:</span>
                <span className="font-bold text-white">{gpu.Bus_Width_Bit}-bit</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Memory Bandwidth:</span>
                <span className="font-bold text-white">{gpu.Bandwidth_GBs} GB/s</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Ray Tracing Score:</span>
                <span className="font-bold text-white">{formatScore(gpu.RayTracing_Score)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">TGP Graphics Power:</span>
                <span className="font-bold text-white">{gpu.TGP_Watts} Watts</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Recommended PSU:</span>
                <span className="font-bold text-white">{gpu.Recommended_PSU_Watts}W+</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Card Form Length:</span>
                <span className="font-bold text-white">{gpu.Length_mm} mm</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">PCIe Interface:</span>
                <span className="font-bold text-white">{gpu.PCIe_Interface}</span>
              </div>
            </div>
          )}
        </div>

        {/* Narrative Description */}
        <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
          "{item.Description}"
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              onSelectForCompare(item);
              onClose();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
          >
            <GitCompare className="w-4 h-4" />
            <span>Send to Head-to-Head Duel</span>
          </button>

          <button
            onClick={() => {
              onSelectForSynergy(item);
              onClose();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
          >
            <GitMerge className="w-4 h-4" />
            <span>Send to Synergy Lab</span>
          </button>
        </div>
      </div>
    </div>
  );
};
