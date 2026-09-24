import React from 'react';
import { CPUItem, GPUItem } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Info,
  Fan,
  Monitor,
  Flame,
  Snowflake,
  ChevronRight
} from 'lucide-react';

interface VramAndThermalAdvisorProps {
  cpu: CPUItem;
  gpu: GPUItem;
  cooler: 'Air Cooler' | '240mm AIO' | '360mm AIO';
  onUpgradeCooler?: (newCooler: '240mm AIO' | '360mm AIO') => void;
}

export const VramAndThermalAdvisor: React.FC<VramAndThermalAdvisorProps> = ({
  cpu,
  gpu,
  cooler,
  onUpgradeCooler
}) => {
  const vram = gpu.VRAM_GB;

  // Peak CPU Package Power Estimate (PPT for AMD, MTP for Intel)
  const isIntelHighK = cpu.Model.includes('K') || cpu.Model.includes('Ultra');
  const estimatedPeakCpuWatts = isIntelHighK
    ? Math.round(cpu.TDP_Watts * 1.8)
    : Math.round(cpu.TDP_Watts * 1.35);

  // Cooler Heat Dissipation Capacity (Watts)
  const coolerDissipationRating: Record<typeof cooler, number> = {
    'Air Cooler': 180,
    '240mm AIO': 250,
    '360mm AIO': 320
  };

  const currentCoolerCap = coolerDissipationRating[cooler];
  const thermalLoadRatio = Math.round((estimatedPeakCpuWatts / currentCoolerCap) * 100);
  const isThermalThrottlingRisk = estimatedPeakCpuWatts > currentCoolerCap;
  const isThermalTight = !isThermalThrottlingRisk && thermalLoadRatio > 85;

  // VRAM Suitability Evaluation
  const resolutions = [
    {
      res: '1080p (FHD)',
      reqVram: 8,
      status: vram >= 8 ? 'OPTIMAL' : vram >= 6 ? 'VIABLE' : 'BOTTLENECK',
      note: vram >= 8 ? 'Flawless frame times at Ultra' : 'Lower texture detail advised'
    },
    {
      res: '1440p (QHD)',
      reqVram: 12,
      status: vram >= 12 ? 'OPTIMAL' : vram >= 10 ? 'VIABLE' : 'WARNING',
      note:
        vram < 10
          ? 'Risk of texture pop-in in UE5 titles'
          : vram >= 16
          ? 'Ample headroom for Path Tracing'
          : 'High settings recommended'
    },
    {
      res: '4K (UHD)',
      reqVram: 16,
      status: vram >= 16 ? 'OPTIMAL' : vram >= 12 ? 'VIABLE' : 'CRITICAL',
      note:
        vram < 12
          ? 'Severe VRAM saturation / stuttering'
          : vram >= 24
          ? 'Extreme buffer for 8K / AI models'
          : 'DLSS / FSR Quality recommended'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* VRAM & Resolution Frame Buffer Advisor */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              VRAM & Resolution Buffer Advisor
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-cyan-400 border border-zinc-700">
            {vram}GB {gpu.Memory_Type} ({gpu.Bus_Width_Bit}-bit)
          </span>
        </div>

        {/* Resolution Capability Cards */}
        <div className="space-y-2 font-mono text-xs">
          {resolutions.map((r) => {
            const isOptimal = r.status === 'OPTIMAL';
            const isViable = r.status === 'VIABLE';
            return (
              <div
                key={r.res}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  isOptimal
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : isViable
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                    : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span>{r.res}</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      (Rec: {r.reqVram}GB+)
                    </span>
                  </div>
                  <div className="text-[10.5px] text-zinc-400">{r.note}</div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                      isOptimal
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : isViable
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unreal Engine 5 VRAM Guidance */}
        {vram <= 8 && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-[11px] font-mono text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>VRAM Alert:</strong> Modern Unreal Engine 5 titles (Nanite, Lumen, Virtual Shadow Maps) frequently breach 8GB at 1440p/4K, spilling textures into system RAM and causing 1% low frame stuttering.
            </p>
          </div>
        )}
      </div>

      {/* CPU Thermal Dissipation & Cooler Match Advisor */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              CPU Thermal Dissipation Engine
            </h4>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
              isThermalThrottlingRisk
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : isThermalTight
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isThermalThrottlingRisk ? (
              <>
                <Flame className="w-3 h-3 text-rose-400" />
                Throttling Hazard
              </>
            ) : isThermalTight ? (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Heavy Thermal Load
              </>
            ) : (
              <>
                <Snowflake className="w-3 h-3 text-emerald-400" />
                Sub-75°C Chill
              </>
            )}
          </span>
        </div>

        {/* Cooler Comparison Stats */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center font-mono text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 block">Peak CPU Package</span>
            <div className="text-base font-black text-amber-400 mt-0.5">~{estimatedPeakCpuWatts}W</div>
            <span className="text-[9px] text-zinc-500">{cpu.TDP_Watts}W Base TDP</span>
          </div>

          <div className="border-x border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">Cooler Capacity</span>
            <div className="text-base font-black text-white mt-0.5">{currentCoolerCap}W</div>
            <span className="text-[9px] text-zinc-500">{cooler}</span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-500 block">Thermal Load Factor</span>
            <div
              className={`text-base font-black mt-0.5 ${
                isThermalThrottlingRisk
                  ? 'text-rose-400'
                  : isThermalTight
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {thermalLoadRatio}%
            </div>
            <span className="text-[9px] text-zinc-500">
              {isThermalThrottlingRisk ? 'Saturated' : 'Dissipating'}
            </span>
          </div>
        </div>

        {/* Progress Bar for Cooler Load */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>Cooler Thermal Saturation:</span>
            <span className={isThermalThrottlingRisk ? 'text-rose-400 font-bold' : 'text-zinc-300'}>
              {thermalLoadRatio}% of {cooler} Rating
            </span>
          </div>
          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isThermalThrottlingRisk
                  ? 'bg-rose-500'
                  : isThermalTight
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, thermalLoadRatio)}%` }}
            />
          </div>
        </div>

        {/* Dynamic Thermal Advice & 1-Click Upgrade Button */}
        {isThermalThrottlingRisk && onUpgradeCooler ? (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 text-xs font-mono space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                {cpu.Model} can exceed {estimatedPeakCpuWatts}W during all-core workloads, overwhelming your {cooler} (rated {currentCoolerCap}W) and causing thermal throttling at 95°C–100°C.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-zinc-400">Recommended Liquid Cooler:</span>
              <button
                type="button"
                onClick={() => onUpgradeCooler(estimatedPeakCpuWatts > 240 ? '360mm AIO' : '240mm AIO')}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
              >
                <span>Upgrade to {estimatedPeakCpuWatts > 240 ? '360mm AIO' : '240mm AIO'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {cooler} provides sufficient dissipation ({currentCoolerCap}W) to keep {cpu.Model} operating at maximum boost clocks without thermal throttling.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
