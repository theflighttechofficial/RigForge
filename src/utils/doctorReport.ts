import { cpuDataset, gpuDataset } from '../data/hardwareData.js';
import { calculateSynergyMetrics } from './formatters.js';
import { buildIntegratedGpu } from './integratedGraphics.js';
import { matchCatalog } from './hardwareMatch.js';
import type { BuildDoctorReport, CPUItem, GPUItem, ResolutionMode } from '../types';

// Build Doctor report used by the server when no Gemini key is set (or the AI call fails),
// and by the browser when the API is unreachable.
// Everything here is derived from the catalog entry of the parts the user picked, so the
// report never describes hardware the user does not have.

type Status = 'CPU constrained' | 'GPU dominant' | 'Balanced';
type Potential = 'high' | 'moderate' | 'dead_end';
type Priority = 'Immediate' | 'Secondary' | 'Future' | 'Keep';

// Exact catalog match first, then the item sharing the most name tokens
function findItem<T extends { id: string; Model: string }>(input: string, items: T[]): T | undefined {
  const exact = matchCatalog(input, items);
  if (exact) return items.find((i) => i.id === exact);
  const split = (v: string) => v.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1);
  const tokens = split(input);
  let best: { item: T; score: number } | undefined;
  for (const item of items) {
    const name = split(item.Model);
    // Model numbers count most; extra catalog words (e.g. "Super", "Ti") the user did not type count against
    const hits = tokens.filter((t) => name.includes(t));
    if (!hits.some((t) => /\d/.test(t))) continue;
    const score = hits.reduce((n, t) => n + (/\d/.test(t) ? 3 : 1), 0) - name.filter((t) => !tokens.includes(t) && !/^\d+gb$/.test(t)).length * 0.5;
    if (!best || score > best.score) best = { item, score };
  }
  return best?.item;
}

function platformInfo(cpu: CPUItem): { potential: Potential; statusText: string; analysis: string; maxCpu: string } {
  const s = cpu.Socket;
  const isX3D = /x3d/i.test(cpu.Model);
  if (!/^(LGA|AM)/.test(s)) {
    return {
      potential: 'dead_end',
      statusText: `${s} → soldered laptop CPU`,
      analysis: `The ${cpu.Model} is soldered to the motherboard (${s}), so the processor cannot be replaced. Upgrades are limited to RAM (if socketed), storage and an external GPU where supported.`,
      maxCpu: 'Not upgradeable (soldered BGA)'
    };
  }
  if (s === 'AM4') {
    return isX3D
      ? { potential: 'dead_end', statusText: 'AM4 → already at the top gaming CPU', analysis: `The ${cpu.Model} is already the fastest AM4 gaming chip. The next CPU step needs an AM5 motherboard and DDR5.`, maxCpu: `${cpu.Model} (current)` }
      : { potential: 'high', statusText: 'AM4 → drop-in upgrade path available', analysis: 'AM4 boards accept the Ryzen 5000X3D chips after a BIOS update, giving a large gaming uplift without a new motherboard or DDR5.', maxCpu: 'Ryzen 7 5700X3D / 5800X3D' };
  }
  if (s === 'AM5') {
    return { potential: 'high', statusText: 'AM5 → long-term upgrade path', analysis: 'AM5 supports Ryzen 7000 and 9000 today, with AMD committing to the socket for future generations. DDR5 and PCIe 5.0 are already in place.', maxCpu: 'Ryzen 7 9800X3D / Ryzen 9 9950X3D' };
  }
  if (s === 'LGA 1700') {
    return { potential: 'moderate', statusText: 'LGA 1700 → final generation reached', analysis: 'LGA 1700 tops out at 14th Gen Core. Intel has moved to LGA 1851, so any upgrade beyond a 14700K/14900K needs a new motherboard. Keep the BIOS on microcode 0x129 or newer.', maxCpu: 'Core i7-14700K / i9-14900K' };
  }
  if (s === 'LGA 1851') {
    return { potential: 'moderate', statusText: 'LGA 1851 → current Intel platform', analysis: 'LGA 1851 hosts Core Ultra 200S. Intel has not confirmed how many further generations it will support.', maxCpu: 'Core Ultra 9 285K' };
  }
  if (s === 'LGA 1200') {
    return { potential: 'dead_end', statusText: 'LGA 1200 → end of life', analysis: 'LGA 1200 stops at 11th Gen Rocket Lake with DDR4 and PCIe 4.0 at best. A meaningful CPU upgrade means a new platform.', maxCpu: 'Core i9-11900K' };
  }
  return { potential: 'dead_end', statusText: `${s} → legacy platform`, analysis: `${s} is several generations old. Modern CPUs need a new motherboard and memory, so plan a full platform rebuild.`, maxCpu: 'Requires CPU + motherboard + RAM rebuild' };
}

function toStatus(r: ReturnType<typeof calculateSynergyMetrics>): Status {
  return r.status === 'BALANCED' ? 'Balanced' : r.status === 'CPU_BOTTLENECK' ? 'CPU constrained' : 'GPU dominant';
}

export function generateDeterministicReport(cpuInput: string, gpuInput: string, ramInput: string): BuildDoctorReport & { matched: { cpu: string; gpu: string } } {
  const cpu = findItem(cpuInput || '', cpuDataset) ?? cpuDataset[0];
  const igpu = buildIntegratedGpu(cpu);
  const wantsIgpu = /igpu|integrated|uhd|iris|hd graphics|radeon graphics|radeon \d{3}m|vega graphics/i.test(gpuInput || '');
  const gpu: GPUItem = (wantsIgpu && igpu) || findItem(gpuInput || '', gpuDataset) || gpuDataset[0];
  const isIgpu = gpu.id.startsWith('igpu-');

  const ramGB = parseInt(String(ramInput).replace(/[^\d]/g, ''), 10) || 16;
  const ddrTypes = [...new Set(cpu.Memory_Support.match(/DDR\d/g) ?? ['DDR4'])];
  const ddr = ddrTypes.join('/');

  const res: Record<string, ReturnType<typeof calculateSynergyMetrics>> = {};
  for (const r of ['1080p', '1440p', '4k'] as ResolutionMode[]) res[r] = calculateSynergyMetrics(cpu, gpu, r);
  const explain = (r: ResolutionMode) => {
    const m = res[r];
    return `${m.summary} ${m.verdict} Estimated ${m.bottleneckPercentage}% pipeline imbalance at ${r.toUpperCase()}.`;
  };

  // Memory
  let memSeverity: 'optimal' | 'moderate' | 'critical' = ramGB >= 32 ? 'optimal' : ramGB >= 16 ? 'moderate' : 'critical';
  if (isIgpu && ramGB <= 16) memSeverity = ramGB <= 8 ? 'critical' : 'moderate';
  const memStatus = {
    optimal: `${ramGB}GB → ample headroom for gaming and multitasking`,
    moderate: `${ramGB}GB → workable, tight in modern AAA titles`,
    critical: `${ramGB}GB → critical bottleneck`
  }[memSeverity];
  const memAnalysis = [
    memSeverity === 'critical'
      ? `${ramGB}GB leaves little room once Windows (3–4GB) and a browser are loaded, so games page to disk and stutter.`
      : memSeverity === 'moderate'
      ? `${ramGB}GB runs most games, but recent Unreal Engine 5 titles use 14–18GB alongside Discord and a browser, which pushes the page file.`
      : `${ramGB}GB covers current games, streaming and background apps without paging.`,
    isIgpu ? `The ${gpu.Model} borrows system RAM as video memory, so run two sticks in dual-channel and treat 2–4GB as reserved for graphics.` : '',
    `This platform uses ${ddr}.`
  ].filter(Boolean).join(' ');

  const platform = platformInfo(cpu);

  // Upgrade sequence, most urgent first
  type Step = { target: string; priority: Priority; costINR: number; rationale: string };
  const steps: Step[] = [];
  if (ramGB < 32) {
    const cost = ddr === 'DDR5' ? 8999 : ddr === 'DDR3' ? 2999 : 3999;
    steps.push({
      target: `RAM → 32GB ${ddr.includes('/') ? '' : ddr}`.trim(),
      priority: ramGB < 16 ? 'Immediate' : 'Secondary',
      costINR: cost,
      rationale: `A 2x16GB ${ddr.includes('/') ? 'kit matching your board' : ddr + ' kit'} removes page-file stutter and gives dual-channel bandwidth${isIgpu ? ', which directly raises integrated graphics performance' : ''}.`
    });
  }

  if (isIgpu || res['1440p'].status === 'GPU_BOTTLENECK' && res['1440p'].bottleneckPercentage > 20) {
    // Cheapest catalog GPU that pairs within ~10% at 1440p
    const pick = gpuDataset
      .filter((g) => calculateSynergyMetrics(cpu, g, '1440p').bottleneckPercentage <= 10 && g.Gaming_Score > gpu.Gaming_Score)
      .sort((a, b) => a.Price_INR - b.Price_INR)[0];
    if (pick) {
      steps.push({
        target: `GPU → ${pick.Model}`,
        priority: isIgpu ? 'Immediate' : 'Secondary',
        costINR: pick.Price_INR,
        rationale: isIgpu
          ? `The ${gpu.Model} is fine for desktop work and esports at low settings. The ${pick.Model} is the lowest-cost card that the ${cpu.Model} can fully feed at 1440p.`
          : `The ${gpu.Model} is the limiting part at 1440p. The ${pick.Model} is the lowest-cost card that balances with the ${cpu.Model}.`
      });
    }
  }

  if (res['1080p'].status === 'CPU_BOTTLENECK' && res['1080p'].bottleneckPercentage > 15) {
    // Fastest gaming CPU on the same socket; only suggest it if it actually beats the current one
    const target = platform.potential === 'dead_end'
      ? undefined
      : (() => {
          // Cheapest faster CPU on this socket that clears the 1080p limit; otherwise the fastest one
          const faster = cpuDataset.filter((c) => c.Socket === cpu.Socket && c.Gaming_Score > cpu.Gaming_Score * 1.15);
          const fixes = faster.filter((c) => calculateSynergyMetrics(c, gpu, '1080p').bottleneckPercentage <= 10).sort((a, b) => a.Price_INR - b.Price_INR);
          if (fixes[0]) return fixes[0];
          // Otherwise the cheapest chip within 3% of the socket's best gaming score
          const top = Math.max(0, ...faster.map((c) => c.Gaming_Score));
          return faster.filter((c) => c.Gaming_Score >= top * 0.97).sort((a, b) => a.Price_INR - b.Price_INR)[0];
        })();
    if (target && target.Gaming_Score > cpu.Gaming_Score * 1.08) {
      steps.push({ target: `CPU → ${target.Model}`, priority: 'Secondary', costINR: target.Price_INR, rationale: `${platform.analysis} The ${target.Model} is the most cost-effective drop-in CPU for this socket that removes most of the 1080p CPU limit.` });
    } else if (platform.potential === 'dead_end' && res['1080p'].bottleneckPercentage > 25) {
      steps.push({ target: 'Platform → new CPU + motherboard', priority: 'Future', costINR: 45000, rationale: `${platform.analysis} The ${cpu.Model} holds back the ${gpu.Model} at 1080p, and no faster CPU fits this socket.` });
    }
  }

  if (!steps.some((s) => s.target.startsWith('GPU'))) {
    steps.push({ target: `GPU → keep ${gpu.Model}`, priority: 'Keep', costINR: 0, rationale: `The ${gpu.Model} (${gpu.VRAM_GB}GB ${gpu.Memory_Type}) is well matched to the ${cpu.Model}. Spend on the items above first.` });
  }
  if (!steps.some((s) => s.target.startsWith('CPU') || s.target.startsWith('Platform'))) {
    steps.push({ target: `CPU → keep ${cpu.Model}`, priority: 'Keep', costINR: 0, rationale: `The ${cpu.Model} (${cpu.Cores_Threads}) keeps up with the ${gpu.Model}. ${platform.statusText}.` });
  }
  const order: Record<Priority, number> = { Immediate: 0, Secondary: 1, Future: 2, Keep: 3 };
  const upgradeSequence = steps
    .sort((a, b) => order[a.priority] - order[b.priority])
    .slice(0, 3)
    .map((s, i) => ({ step: i + 1, ...s }));

  // Score: pipeline balance (weighted to 1440p), memory, platform
  const balancePenalty = res['1080p'].bottleneckPercentage * 0.2 + res['1440p'].bottleneckPercentage * 0.5 + res['4k'].bottleneckPercentage * 0.3;
  const score = Math.round(
    Math.min(98, Math.max(30, 100 - balancePenalty - { optimal: 0, moderate: 8, critical: 22 }[memSeverity] - (platform.potential === 'dead_end' ? 5 : 0) - (isIgpu ? 15 : 0)))
  );
  const bestRes = (['4k', '1440p', '1080p'] as const).find((r) => res[r].status !== 'CPU_BOTTLENECK' && gpu.VRAM_GB >= { '4k': 16, '1440p': 10, '1080p': 0 }[r]) ?? '1080p';
  const verdict = isIgpu
    ? `Integrated-graphics build: good for desktop work and light esports on the ${gpu.Model}; add a GPU for modern AAA gaming`
    : `${bestRes === '4k' ? '4K-capable' : bestRes === '1440p' ? 'Strong 1440p' : '1080p-focused'} rig${res['1080p'].status === 'CPU_BOTTLENECK' ? ' with a CPU limit at high refresh rates' : ''}${memSeverity !== 'optimal' ? `; ${ramGB}GB RAM is the next constraint` : ''}`;

  const detailedRationale = [
    `Resolution scaling: at 1080p the pairing is ${toStatus(res['1080p']).toLowerCase()} (${res['1080p'].bottleneckPercentage}% imbalance); at 1440p it is ${toStatus(res['1440p']).toLowerCase()} (${res['1440p'].bottleneckPercentage}%); at 4K it is ${toStatus(res['4k']).toLowerCase()} (${res['4k'].bottleneckPercentage}%). Higher resolutions shift work onto the GPU.`,
    `Memory: ${memAnalysis}`,
    `Platform (${cpu.Socket}): ${platform.analysis} Best drop-in CPU: ${platform.maxCpu}.`,
    `Graphics: the ${gpu.Model} has ${isIgpu ? 'no dedicated VRAM (it shares system RAM)' : `${gpu.VRAM_GB}GB ${gpu.Memory_Type} on a ${gpu.Bus_Width_Bit}-bit bus`}. ${res['1440p'].adverseWarning.severity !== 'NONE' ? res['1440p'].adverseWarning.title + '.' : 'No mismatch warnings for this pairing.'}`
  ];

  const bal = (r: ResolutionMode) => ({ status: toStatus(res[r]), explanation: explain(r), cpuLoadEst: res[r].cpuUtilization, gpuLoadEst: res[r].gpuUtilization });

  return {
    timestamp: new Date().toISOString(),
    config: { cpu: cpuInput, gpu: gpuInput, ram: ramInput },
    matched: { cpu: cpu.Model, gpu: gpu.Model },
    overallHealthScore: score,
    overallVerdict: verdict,
    balance: { res1080p: bal('1080p'), res1440p: bal('1440p'), res4k: bal('4k') },
    memory: { capacity: `${ramGB}GB`, statusText: memStatus, severity: memSeverity, analysis: memAnalysis, hitchingRisk: { optimal: 'Minimal memory-related frame-time variance.', moderate: 'Moderate risk in large open-world titles with background apps.', critical: 'High risk of stutter and asset pop-in.' }[memSeverity] },
    platform: { socket: cpu.Socket, statusText: platform.statusText, upgradePotential: platform.potential, analysis: platform.analysis, maxRecommendedCpu: platform.maxCpu },
    upgradeSequence,
    detailedRationale,
    aiGenerated: false
  };
}
