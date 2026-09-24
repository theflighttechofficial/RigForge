import {
  CPUItem,
  GPUItem,
  HardwareItem,
  ResolutionMode,
  SynergyResult,
  WorkloadProfile,
  AdverseWarning
} from '../types';

/**
 * Format currency nicely in INR (Indian Rupee)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format benchmark scores with commas
 */
export function formatScore(score: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(score));
}

/**
 * Get dynamic benchmark adjusted for active workload
 */
export function getWorkloadScore(item: HardwareItem, workload: WorkloadProfile): number {
  if (item.category === 'CPU') {
    const cpu = item as CPUItem;
    if (workload === 'gaming') {
      return cpu.Gaming_Score;
    } else if (workload === 'productivity') {
      return cpu.MultiCore_Score;
    }
    return cpu.Benchmark_Score;
  } else {
    const gpu = item as GPUItem;
    if (workload === 'gaming') {
      return gpu.Gaming_Score;
    } else if (workload === 'productivity') {
      return gpu.Compute_Score;
    }
    return gpu.Benchmark_Score;
  }
}

/**
 * Compute Points per ₹1,000 (Value Index)
 */
export function getValueIndex(score: number, priceINR: number): number {
  if (priceINR <= 0) return 0;
  return Number(((score / priceINR) * 1000).toFixed(1));
}

/**
 * Compute Points per Watt (Efficiency Index)
 */
export function getPowerEfficiency(item: HardwareItem): number {
  const score = item.Benchmark_Score;
  const watts = item.category === 'CPU' ? (item as CPUItem).TDP_Watts : (item as GPUItem).TGP_Watts;
  if (watts <= 0) return 0;
  return Number((score / watts).toFixed(1));
}

/**
 * Compute Pareto efficiency threshold curve for scatter plot
 */
export function calculateParetoCurve(
  items: HardwareItem[],
  workload: WorkloadProfile,
  priceExtractor?: (item: HardwareItem) => number
): { x: number; y: number }[] {
  if (!items || items.length === 0) return [];
  const getPrice = priceExtractor || ((item: HardwareItem) => item.Price_INR);
  const sorted = [...items].sort((a, b) => getPrice(a) - getPrice(b));
  const minPrice = getPrice(sorted[0]);
  const maxPrice = getPrice(sorted[sorted.length - 1]);

  const points: { x: number; y: number }[] = [];
  const steps = 25;
  const priceStep = (maxPrice - minPrice) / steps;
  const baseScore = getWorkloadScore(sorted[0], workload);

  for (let i = 0; i <= steps; i++) {
    const p = minPrice + i * priceStep;
    const norm = Math.max(1, p / (minPrice || 1));
    // Diminishing returns curve (log-power model)
    const curveScore = baseScore * 0.9 + Math.pow(norm, 0.73) * (baseScore * 1.08);
    points.push({ x: Math.round(p), y: Math.round(curveScore) });
  }
  return points;
}

/**
 * Synergy & Bottleneck Algorithm with Adverse Mismatch Detection
 */
export function calculateSynergyMetrics(
  cpu: CPUItem,
  gpu: GPUItem,
  resolution: ResolutionMode
): SynergyResult {
  const cpuScore = cpu.Gaming_Score;
  const gpuScore = gpu.Gaming_Score;

  // Weightings based on resolution
  let cpuWeight = 0.5;
  let gpuWeight = 0.5;

  if (resolution === '1080p') {
    cpuWeight = 0.65;
    gpuWeight = 0.35;
  } else if (resolution === '1440p') {
    cpuWeight = 0.45;
    gpuWeight = 0.55;
  } else if (resolution === '4k') {
    cpuWeight = 0.22;
    gpuWeight = 0.78;
  } else if (resolution === 'workstation') {
    cpuWeight = 0.50;
    gpuWeight = 0.50;
  }

  const idealRatio = 0.96 * (gpuWeight / cpuWeight);
  const actualRatio = gpuScore / cpuScore;
  const discrepancy = (actualRatio - idealRatio) / idealRatio;
  const rawBottleneck = Math.abs(discrepancy) * 36;
  const bottleneckPct = Math.min(Math.round(rawBottleneck * 10) / 10, 78);

  let status: 'BALANCED' | 'CPU_BOTTLENECK' | 'GPU_BOTTLENECK' = 'BALANCED';
  let cpuUtil = 93;
  let gpuUtil = 96;
  let summary = '';
  let verdict = '';

  if (bottleneckPct <= 7.5) {
    status = 'BALANCED';
    cpuUtil = 92;
    gpuUtil = 97;
    summary = 'Optimal Harmony: Computational instruction dispatch and GPU raster pipelines operate with negligible queue stall.';
    verdict = `The ${cpu.Model} and ${gpu.Model} form an exceptionally symmetrical pairing at ${resolution.toUpperCase()}. Neither component limits the other's potential.`;
  } else if (discrepancy > 0) {
    status = 'CPU_BOTTLENECK';
    cpuUtil = 100;
    gpuUtil = Math.max(100 - Math.round(bottleneckPct * 1.15), 30);
    summary = `CPU Bound Pipeline: The ${cpu.Model} cannot feed frame draw calls fast enough for the ${gpu.Model}.`;
    verdict = `At ${resolution.toUpperCase()}, the graphics card will sit at ~${gpuUtil}% utilization while the processor peaks at 100%. Severe frame time jitter and 1% low stutter will occur.`;
  } else {
    status = 'GPU_BOTTLENECK';
    cpuUtil = Math.max(100 - Math.round(bottleneckPct * 1.1), 25);
    gpuUtil = 100;
    summary = `GPU Limited: The ${gpu.Model} is operating at its maximum rendering capacity.`;
    verdict = `This is the preferred bottleneck for gaming: the ${cpu.Model} has ample headroom for smooth frame pacing, streaming, and future GPU upgrades.`;
  }

  // Detect Adverse / Severe Mismatch Conditions
  const adverseDetails: string[] = [];
  let severity: AdverseWarning['severity'] = 'NONE';
  let title = 'Harmonious System Synergy';

  // Check 1: Vintage CPU paired with modern high-tier GPU
  if (cpu.Era === 'vintage' && (gpu.Price_INR > 40000 || gpu.Era === 'enthusiast')) {
    severity = 'CATASTROPHIC';
    title = 'Severe Generational Hardware Disparity';
    adverseDetails.push(
      `Vintage CPU Architecture (${cpu.Architecture}, ${cpu.ReleaseYear}) paired with Modern Flagship GPU (${gpu.Model}).`
    );
    adverseDetails.push(
      `PCIe Bus Saturation: Motherboard likely limited to ${cpu.PCIe_Gen}, clipping modern GPU bus bandwidth.`
    );
    adverseDetails.push(
      `Severe 1% low frame micro-stutters will ruin gameplay despite high average FPS counters.`
    );
  } else if (cpu.Era === 'workstation' && gpu.Price_INR < 25000) {
    // Workstation HEDT CPU paired with entry GPU
    severity = 'SEVERE';
    title = 'Massive Compute Allocation Imbalance';
    adverseDetails.push(
      `Ultra High-Core HEDT CPU (${cpu.Cores_Threads}) paired with entry-level graphics card.`
    );
    adverseDetails.push(
      `Over 80% of CPU compute throughput will sit idle during gaming; massive capital wasted on unused thread pools.`
    );
  } else if (gpu.VRAM_GB <= 4 && (resolution === '1440p' || resolution === '4k')) {
    // VRAM starvation
    severity = 'SEVERE';
    title = 'Critical VRAM Starvation Warning';
    adverseDetails.push(
      `Target resolution ${resolution.toUpperCase()} requires 8GB-12GB+ VRAM buffer; this GPU has only ${gpu.VRAM_GB}GB.`
    );
    adverseDetails.push(
      `Textures will spill into system system RAM causing catastrophic hitching drops down to 5-10 FPS.`
    );
  } else if (bottleneckPct > 35) {
    severity = 'MODERATE';
    title = 'Substantial Pipeline Imbalance';
    adverseDetails.push(
      `Bottleneck ratio exceeds 35%. One subsystem is heavily constrained while the other possesses unutilized headroom.`
    );
  }

  const adverseWarning: AdverseWarning = {
    severity,
    title,
    details: adverseDetails
  };

  // Realistic Game FPS estimates
  const baseGpuPerfMultiplier = gpu.Gaming_Score / 35000;
  const cpuFactor = Math.min(cpu.Gaming_Score / 32000, 1.4);
  const resScale = resolution === '1080p' ? 1.45 : resolution === '1440p' ? 1.0 : resolution === '4k' ? 0.58 : 0.88;
  const effectiveSpeed = baseGpuPerfMultiplier * (status === 'CPU_BOTTLENECK' ? Math.min(cpuFactor * 0.85, 1.05) : 1.0) * resScale;

  const gameFpsEstimates = [
    {
      game: 'Cyberpunk 2077',
      fps: Math.max(Math.round(62 * effectiveSpeed), 12),
      quality: 'Ultra / Ray Tracing Med',
      setting: `${resolution.toUpperCase()} DLSS/FSR Quality`
    },
    {
      game: 'Black Myth: Wukong',
      fps: Math.max(Math.round(68 * effectiveSpeed), 14),
      quality: 'Cinematic High',
      setting: `${resolution.toUpperCase()} TSR 85%`
    },
    {
      game: 'Valorant / CS2',
      fps: Math.max(Math.min(Math.round((cpu.Gaming_Score / 105) * (resolution === '4k' ? 0.78 : 1)), 620), 45),
      quality: 'Competitive High',
      setting: `${resolution.toUpperCase()} Native`
    },
    {
      game: 'Grand Theft Auto V',
      fps: Math.max(Math.round(135 * Math.min(effectiveSpeed, 1.6)), 24),
      quality: 'Very High / MSAA x2',
      setting: `${resolution.toUpperCase()} Max Draw`
    },
    {
      game: 'Forza Horizon 5',
      fps: Math.max(Math.round(98 * effectiveSpeed), 20),
      quality: 'Extreme Preset',
      setting: `${resolution.toUpperCase()} Native MSAA`
    }
  ];

  return {
    bottleneckPercentage: bottleneckPct,
    status,
    cpuUtilization: cpuUtil,
    gpuUtilization: gpuUtil,
    summary,
    verdict,
    adverseWarning,
    gameFpsEstimates
  };
}

/**
 * Generational Upgrade ROI & Worth-It Calculator
 */
export interface UpgradeROIResult {
  fpsGainPct: number;
  oldFpsEst: number;
  newFpsEst: number;
  costINR: number;
  costPerPercentGain: number;
  verdict: 'NO_BRAINER' | 'SOLID_LEAP' | 'MODERATE' | 'DIMINISHING_RETURNS';
  verdictTitle: string;
  verdictSummary: string;
}

export function calculateUpgradeROI(
  currCpu: CPUItem,
  currGpu: GPUItem,
  nextCpu: CPUItem,
  nextGpu: GPUItem,
  resolution: ResolutionMode
): UpgradeROIResult {
  const currentSynergy = calculateSynergyMetrics(currCpu, currGpu, resolution);
  const nextSynergy = calculateSynergyMetrics(nextCpu, nextGpu, resolution);

  const oldFps = Math.round(
    currentSynergy.gameFpsEstimates.reduce((acc, g) => acc + g.fps, 0) /
      currentSynergy.gameFpsEstimates.length
  );
  const newFps = Math.round(
    nextSynergy.gameFpsEstimates.reduce((acc, g) => acc + g.fps, 0) /
      nextSynergy.gameFpsEstimates.length
  );

  const rawGain = ((newFps - oldFps) / Math.max(oldFps, 1)) * 100;
  const fpsGainPct = Math.round(rawGain);

  const costINR = nextCpu.Price_INR + nextGpu.Price_INR;
  const costPerPercentGain = fpsGainPct > 0 ? Math.round(costINR / fpsGainPct) : 0;

  let verdict: UpgradeROIResult['verdict'] = 'SOLID_LEAP';
  let verdictTitle = 'Worthy Generational Upgrade';
  let verdictSummary = `You gain a massive +${fpsGainPct}% average frame rate leap across modern titles.`;

  if (fpsGainPct >= 110) {
    verdict = 'NO_BRAINER';
    verdictTitle = 'Night & Day Transformation (+100%+)';
    verdictSummary = `Frame rates will more than double (${oldFps} FPS -> ${newFps} FPS). Every game will feel like a completely new generation.`;
  } else if (fpsGainPct >= 45) {
    verdict = 'SOLID_LEAP';
    verdictTitle = 'High-Value Performance Upgrade';
    verdictSummary = `Expect a noticeably smoother gameplay experience (+${fpsGainPct}%), enabling higher graphics presets and ray tracing.`;
  } else if (fpsGainPct >= 20) {
    verdict = 'MODERATE';
    verdictTitle = 'Incremental Gain / Consider Waiting';
    verdictSummary = `A +${fpsGainPct}% boost provides modest improvements. At ₹${costPerPercentGain} per 1% FPS gain, consider skipping to the next generation unless you specifically need new features (like DLSS 3 or AV1).`;
  } else {
    verdict = 'DIMINISHING_RETURNS';
    verdictTitle = 'Diminishing Returns / Sidegrade Warning';
    verdictSummary = `Only +${fpsGainPct}% uplift detected. The performance increase does not justify the ₹${formatINR(costINR)} expense.`;
  }

  return {
    fpsGainPct,
    oldFpsEst: oldFps,
    newFpsEst: newFps,
    costINR,
    costPerPercentGain,
    verdict,
    verdictTitle,
    verdictSummary
  };
}

/**
 * Operating Electricity & Thermal Running Cost Calculator
 */
export interface RunningCostResult {
  dailyKWh: number;
  monthlyKWh: number;
  annualKWh: number;
  monthlyCostINR: number;
  annualCostINR: number;
  carbonKgPerYear: number;
  heatBtuPerHour: number;
}

export function calculateOperatingCost(
  cpuWatts: number,
  gpuWatts: number,
  dailyHours: number,
  tariffPerKWh: number
): RunningCostResult {
  // Add motherboard, fans, RAM, SSD base load (~80W under load)
  const systemWatts = cpuWatts + gpuWatts + 80;

  // Daily kWh
  const dailyKWh = (systemWatts * dailyHours) / 1000;
  const monthlyKWh = dailyKWh * 30.5;
  const annualKWh = dailyKWh * 365;

  const monthlyCostINR = Math.round(monthlyKWh * tariffPerKWh);
  const annualCostINR = Math.round(annualKWh * tariffPerKWh);

  // India grid average ~0.82 kg CO2 per kWh
  const carbonKgPerYear = Math.round(annualKWh * 0.82);

  // 1 Watt = 3.412142 BTU/hr
  const heatBtuPerHour = Math.round(systemWatts * 3.412);

  return {
    dailyKWh: Number(dailyKWh.toFixed(2)),
    monthlyKWh: Number(monthlyKWh.toFixed(1)),
    annualKWh: Number(annualKWh.toFixed(0)),
    monthlyCostINR,
    annualCostINR,
    carbonKgPerYear,
    heatBtuPerHour
  };
}
