import React, { useMemo, useState } from 'react';
import { ActiveTab, ComponentCategory, CPUItem, GPUItem, ResolutionMode } from '../types';
import { budgetPresets } from '../data/presetData';
import { calculateSynergyMetrics, formatINR } from '../utils/formatters';
import { ScanLine, Wrench, GitCompare } from './icons';

interface IntroPageProps {
  onEnterWorkspace: (targetTab: ActiveTab, targetCategory?: ComponentCategory) => void;
  onSelectPreset: (presetId: string) => void;
  onOpenSynergy: (cpuId: string, gpuId: string) => void;
  cpus: CPUItem[];
  gpus: GPUItem[];
}

// Every workspace, grouped by what the visitor is trying to do
const TOOL_GROUPS: { title: string; tools: { tab: ActiveTab; name: string; what: string }[] }[] = [
  {
    title: 'Your PC',
    tools: [
      { tab: 'myspecs', name: 'My PC Specs', what: 'Scan this computer and list its processor, memory, drives, graphics and Wi-Fi.' },
      { tab: 'digitaltwin', name: 'My Rig', what: 'Keep a record of your build with warranties, purchase prices and thermals.' },
      { tab: 'doctor', name: 'Build Doctor', what: 'Describe a build and get a health report with a ranked upgrade order.' },
      { tab: 'troubleshoot', name: 'Troubleshooting', what: 'Step through no-power, no-display and crash symptoms to a likely cause.' }
    ]
  },
  {
    title: 'Plan and buy',
    tools: [
      { tab: 'builder', name: 'Rig Architect', what: 'Pick parts, size the power supply and total the cost in rupees.' },
      { tab: 'costoptimizer', name: 'Cost Optimizer', what: 'Split a fixed budget across parts for gaming, editing or AI work.' },
      { tab: 'roi', name: 'Upgrade ROI', what: 'See how much performance an upgrade buys per rupee.' },
      { tab: 'cost', name: 'Power & TCO', what: 'Running cost by state electricity tariff, plus UPS sizing.' }
    ]
  },
  {
    title: 'Compare and analyse',
    tools: [
      { tab: 'matrix', name: 'Value Matrix', what: 'Price against performance for every CPU or GPU in the catalog.' },
      { tab: 'compare', name: 'Head-to-Head', what: 'Two parts side by side across six workload types.' },
      { tab: 'synergy', name: 'Bottleneck Lab', what: 'How well a CPU and GPU pair at each resolution, with FPS estimates.' },
      { tab: 'benchmarks', name: 'Benchmarks', what: 'Estimated frame rates for specific games, presets and upscalers.' },
      { tab: 'storagelab', name: 'Storage Lab', what: 'HDD, SATA and NVMe load times and transfer speeds.' },
      { tab: 'ramlab', name: 'RAM Lab', what: 'Frequency, timings and channel count, and what they do to latency.' }
    ]
  },
  {
    title: 'Visualise and learn',
    tools: [
      { tab: 'spatial3d', name: '3D Studio', what: 'Assemble the case in 3D and check clearances, airflow and lighting.' },
      { tab: 'battlestation', name: 'Dream Setup', what: 'Your build on a desk with monitor, peripherals and power draw.' },
      { tab: 'anatomy', name: 'Component Anatomy', what: 'What each part does and the common buying mistakes.' },
      { tab: 'challengemode', name: 'Build Challenges', what: 'Hit a performance target under a budget cap.' },
      { tab: 'community', name: 'Build Gallery', what: 'Sample builds and the builds you save.' },
      { tab: 'catalog', name: 'Catalog', what: 'Full spec sheet for every CPU and GPU.' }
    ]
  }
];

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  BALANCED: { label: 'Balanced pairing', tone: 'text-emerald-400' },
  CPU_BOTTLENECK: { label: 'CPU is the limit', tone: 'text-amber-400' },
  GPU_BOTTLENECK: { label: 'GPU is the limit', tone: 'text-cyan-400' }
};

export const IntroPage: React.FC<IntroPageProps> = ({ onEnterWorkspace, onSelectPreset, onOpenSynergy, cpus, gpus }) => {
  const [cpuId, setCpuId] = useState('cpu-amd-7800x3d');
  const [gpuId, setGpuId] = useState('gpu-nvidia-4070-super');
  const [resolution, setResolution] = useState<ResolutionMode>('1440p');

  const cpu = cpus.find((c) => c.id === cpuId) ?? cpus[0];
  const gpu = gpus.find((g) => g.id === gpuId) ?? gpus[0];
  const result = useMemo(() => calculateSynergyMetrics(cpu, gpu, resolution), [cpu, gpu, resolution]);
  const status = STATUS_COPY[result.status];

  const sortedCpus = useMemo(() => [...cpus].sort((a, b) => a.Model.localeCompare(b.Model)), [cpus]);
  const sortedGpus = useMemo(() => [...gpus].sort((a, b) => a.Model.localeCompare(b.Model)), [gpus]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Intro */}
      <section className="space-y-5 pt-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">PC Hardware Performance Matrix</h1>
        <p className="max-w-2xl text-sm sm:text-base text-zinc-300 leading-relaxed">
          Plan, compare and check PC builds with Indian street prices. The catalog covers {cpus.length} processors and {gpus.length} graphics
          cards, from 2007 parts to current flagships.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onEnterWorkspace('myspecs')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-sm cursor-pointer"
          >
            <ScanLine className="w-4 h-4" /> Scan my PC
          </button>
          <button
            onClick={() => onEnterWorkspace('builder')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-100 font-semibold text-sm cursor-pointer"
          >
            <Wrench className="w-4 h-4" /> Plan a build
          </button>
          <button
            onClick={() => onEnterWorkspace('compare')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-100 font-semibold text-sm cursor-pointer"
          >
            <GitCompare className="w-4 h-4" /> Compare two parts
          </button>
        </div>
      </section>

      {/* Working demo: the same pairing model the Bottleneck Lab uses */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Try it: will this CPU hold back this GPU?</h2>
          <p className="text-xs text-zinc-400 mt-1">Pick any two parts. The result updates as you change them.</p>
        </div>
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-mono uppercase text-zinc-400">Processor</span>
              <select
                value={cpu.id}
                onChange={(e) => setCpuId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                {sortedCpus.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.Model}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-mono uppercase text-zinc-400">Graphics card</span>
              <select
                value={gpu.id}
                onChange={(e) => setGpuId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                {sortedGpus.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.Model}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase text-zinc-400">Resolution</span>
              <div className="inline-flex rounded-md border border-zinc-800 p-0.5 bg-zinc-950">
                {(['1080p', '1440p', '4k'] as ResolutionMode[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className={`px-3 py-1 rounded text-xs font-mono font-semibold cursor-pointer ${
                      resolution === r ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4" aria-live="polite">
            <div>
              <div className={`text-2xl font-bold ${status.tone}`}>{status.label}</div>
              <div className="text-sm text-zinc-400 font-mono">{result.bottleneckPercentage}% imbalance at {resolution.toUpperCase()}</div>
            </div>
            {[
              { name: 'CPU load', value: result.cpuUtilization, bar: 'bg-cyan-500' },
              { name: 'GPU load', value: result.gpuUtilization, bar: 'bg-purple-500' }
            ].map((m) => (
              <div key={m.name} className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>{m.name}</span>
                  <span className="text-zinc-200">{m.value}%</span>
                </div>
                <div className="h-2 rounded-sm bg-zinc-800">
                  <div className={`h-2 rounded-sm ${m.bar}`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
            <p className="text-sm text-zinc-300 leading-relaxed">{result.verdict}</p>
            {result.adverseWarning.severity !== 'NONE' && (
              <p className="text-sm text-amber-400">{result.adverseWarning.title}</p>
            )}
            <button
              onClick={() => onOpenSynergy(cpu.id, gpu.id)}
              className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer"
            >
              See game-by-game FPS for this pair
            </button>
          </div>
        </div>
      </section>

      {/* Tool index */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">All tools</h2>
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {TOOL_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 pb-2 border-b border-zinc-800">{group.title}</h3>
              <ul>
                {group.tools.map((tool) => (
                  <li key={tool.tab} className="border-b border-zinc-800/70">
                    <button
                      onClick={() => onEnterWorkspace(tool.tab)}
                      className="w-full text-left py-3 flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 hover:bg-zinc-900 px-1 cursor-pointer"
                    >
                      <span className="sm:w-40 shrink-0 text-sm font-semibold text-zinc-100">{tool.name}</span>
                      <span className="text-sm text-zinc-400">{tool.what}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Presets as a comparable table rather than marketing cards */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Starting-point builds</h2>
          <p className="text-xs text-zinc-400 mt-1">Load one into Rig Architect and change any part.</p>
        </div>
        <div className="relative overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs font-mono uppercase text-zinc-500">
              <tr>
                <th className="text-left font-semibold px-4 py-2.5">Build</th>
                <th className="text-left font-semibold px-4 py-2.5">Target</th>
                <th className="text-left font-semibold px-4 py-2.5">CPU / GPU</th>
                <th className="text-right font-semibold px-4 py-2.5">Budget</th>
                <th className="px-4 py-2.5"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {budgetPresets.map((preset) => {
                const pc = cpus.find((c) => c.id === preset.cpuId);
                const pg = gpus.find((g) => g.id === preset.gpuId);
                return (
                  <tr key={preset.id} className="border-t border-zinc-800">
                    <td className="px-4 py-3 text-zinc-100 font-medium">{preset.name}</td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{preset.resolutionTier}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {pc?.Model ?? preset.cpuId} / {pg?.Model ?? preset.gpuId}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-100 whitespace-nowrap">{formatINR(preset.targetBudgetINR)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectPreset(preset.id)}
                        className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 whitespace-nowrap cursor-pointer"
                      >
                        Load build
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
