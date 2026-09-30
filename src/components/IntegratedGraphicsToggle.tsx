import React, { useEffect, useMemo, useState } from 'react';
import { CPUItem, GPUItem } from '../types';
import { buildIntegratedGpu } from '../utils/integratedGraphics';

/**
 * Shared "no discrete GPU" state for any page that pairs a CPU with a GPU.
 * Returns the GPU the page should use for its maths: the CPU's integrated graphics when the
 * toggle is on (and the CPU has one), otherwise the selected discrete card.
 */
export function useIntegratedGraphics(cpu: CPUItem | undefined, selectedGpu: GPUItem) {
  const [useIntegrated, setUseIntegrated] = useState(false);
  const integratedGpu = useMemo(() => (cpu ? buildIntegratedGpu(cpu) : null), [cpu]);

  // A CPU without integrated graphics cannot run an iGPU-only build
  useEffect(() => {
    if (useIntegrated && !integratedGpu) setUseIntegrated(false);
  }, [useIntegrated, integratedGpu]);

  const active = useIntegrated && Boolean(integratedGpu);
  return {
    useIntegrated: active,
    setUseIntegrated,
    integratedGpu,
    effectiveGpu: active && integratedGpu ? integratedGpu : selectedGpu
  };
}

interface IntegratedGraphicsToggleProps {
  cpu: CPUItem | undefined;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const IntegratedGraphicsToggle: React.FC<IntegratedGraphicsToggleProps> = ({ cpu, checked, onChange, className = '' }) => {
  const available = Boolean(cpu?.Has_iGPU);
  const igpuName = cpu ? buildIntegratedGpu(cpu)?.Model : undefined;
  return (
    <label
      className={`flex items-start gap-2 pt-1 text-[11px] font-mono leading-snug ${
        available ? 'text-zinc-300 cursor-pointer' : 'text-zinc-600 cursor-not-allowed'
      } ${className}`}
      title={available ? undefined : `${cpu?.Model ?? 'This CPU'} has no integrated graphics`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={!available}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-3.5 h-3.5 shrink-0 accent-purple-500 disabled:opacity-40"
      />
      <span>
        No discrete GPU — use integrated graphics
        {checked && igpuName && <span className="block text-amber-400">Using {igpuName}</span>}
        {!available && <span className="block">Not available: this CPU has no iGPU</span>}
      </span>
    </label>
  );
};
