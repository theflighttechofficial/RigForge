import { CPUItem, GPUItem } from '../types';

export interface ChallengeRequirement {
  id: string;
  label: string;
  targetDescription: string;
  checkFn: (config: ChallengeUserConfig, cpus: CPUItem[], gpus: GPUItem[]) => { met: boolean; detail: string };
}

export interface ChallengeUserConfig {
  cpuId: string;
  gpuId: string;
  ramGb: number;
  ramType: 'DDR4' | 'DDR5';
  storageGb: number;
  wifiEnabled: boolean;
  psuWatts: number;
  psuRating: string;
  motherboardModel: string;
  caseModel: string;
}

export interface BuildChallengeSpec {
  id: string;
  code: string; // e.g. "CHALLENGE #001"
  title: string;
  budgetINR: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  xpReward: number;
  badgeReward: string;
  objectiveText: string;
  description: string;
  requirements: ChallengeRequirement[];
}

export interface ChallengeScoreResult {
  requirementsMet: boolean;
  requirementChecklist: { id: string; label: string; met: boolean; detail: string }[];
  scores: {
    budgetUtilization: number; // 0 to 100
    performanceEstimate: number;
    powerEfficiency: number;
    upgradeHeadroom: number;
    compatibilityChecks: number;
    totalComposite: number;
  };
  rankTier: 'S' | 'A' | 'B' | 'C' | 'FAILED';
  totalCostINR: number;
  remainingBudgetINR: number;
  summaryFeedback: string;
}

export const BUILD_CHALLENGES: BuildChallengeSpec[] = [
  {
    id: 'challenge-001',
    code: 'CHALLENGE #001',
    title: 'The ₹80,000 1440p Sweet Spot',
    budgetINR: 80000,
    difficulty: 'Medium',
    xpReward: 500,
    badgeReward: '1440p Master Architect',
    objectiveText: 'Build a high-value 1440p gaming rig under ₹80,000 that meets all connectivity and memory standards.',
    description: 'Construct a balanced gaming setup that hits 60+ FPS at 2560x1440 resolution without exceeding ₹80,000.',
    requirements: [
      {
        id: 'req-budget',
        label: 'Budget Cap: ≤ ₹80,000',
        targetDescription: 'Total component cost must stay under ₹80,000',
        checkFn: (cfg, cpus, gpus) => {
          const cpu = cpus.find((c) => c.id === cfg.cpuId);
          const gpu = gpus.find((g) => g.id === cfg.gpuId);
          const total = (cpu?.Price_INR || 0) + (gpu?.Price_INR || 0) + 7500 + 5200 + 10500 + 5800 + 4200;
          const met = total <= 80000;
          return { met, detail: `Total Cost: ₹${total.toLocaleString()} / ₹80,000` };
        }
      },
      {
        id: 'req-1440p',
        label: '1440p Gaming Target',
        targetDescription: 'Estimated 1440p gaming FPS must exceed 60 FPS',
        checkFn: (cfg, cpus, gpus) => {
          const gpu = gpus.find((g) => g.id === cfg.gpuId);
          const fps1440p = gpu ? Math.round(gpu.Gaming_Score * 0.85) : 0;
          const met = fps1440p >= 60;
          return { met, detail: `Estimated 1440p High FPS: ~${fps1440p} FPS` };
        }
      },
      {
        id: 'req-ram',
        label: '32GB System RAM',
        targetDescription: 'System memory must be at least 32GB',
        checkFn: (cfg) => {
          const met = cfg.ramGb >= 32;
          return { met, detail: `Installed RAM: ${cfg.ramGb}GB ${cfg.ramType}` };
        }
      },
      {
        id: 'req-ssd',
        label: '1TB+ NVMe SSD',
        targetDescription: 'Storage capacity must be at least 1000GB (1TB)',
        checkFn: (cfg) => {
          const met = cfg.storageGb >= 1000;
          return { met, detail: `Storage Capacity: ${cfg.storageGb}GB NVMe` };
        }
      },
      {
        id: 'req-wifi',
        label: 'Wi-Fi Onboard Support',
        targetDescription: 'Motherboard or adapter must support built-in Wi-Fi 6',
        checkFn: (cfg) => {
          return { met: cfg.wifiEnabled, detail: cfg.wifiEnabled ? 'Wi-Fi 6 Enabled' : 'No Wi-Fi Selected' };
        }
      },
      {
        id: 'req-psu',
        label: 'Minimum 650W PSU',
        targetDescription: 'Power supply must be rated at 650W or higher',
        checkFn: (cfg) => {
          const met = cfg.psuWatts >= 650;
          return { met, detail: `Selected PSU: ${cfg.psuWatts}W ${cfg.psuRating}` };
        }
      }
    ]
  },
  {
    id: 'challenge-002',
    code: 'CHALLENGE #002',
    title: 'The ₹1,20,000 Local AI Workstation',
    budgetINR: 120000,
    difficulty: 'Hard',
    xpReward: 850,
    badgeReward: 'AI Neural Engineer',
    objectiveText: 'Assemble an AI local LLM workstation with heavy GPU VRAM and 32GB+ system memory under ₹1,20,000.',
    description: 'Configure a rig optimized for local PyTorch tensor processing, Ollama models, and 1440p gaming.',
    requirements: [
      {
        id: 'req-budget-2',
        label: 'Budget Cap: ≤ ₹1,20,000',
        targetDescription: 'Total cost must stay under ₹1,20,000',
        checkFn: (cfg, cpus, gpus) => {
          const cpu = cpus.find((c) => c.id === cfg.cpuId);
          const gpu = gpus.find((g) => g.id === cfg.gpuId);
          const total = (cpu?.Price_INR || 0) + (gpu?.Price_INR || 0) + 10500 + 7200 + 14500 + 7800 + 5500;
          return { met: total <= 120000, detail: `Total Cost: ₹${total.toLocaleString()} / ₹1,20,000` };
        }
      },
      {
        id: 'req-vram-2',
        label: 'Min 12GB+ GPU VRAM',
        targetDescription: 'Graphics card must have at least 12GB VRAM for local AI models',
        checkFn: (cfg, cpus, gpus) => {
          const gpu = gpus.find((g) => g.id === cfg.gpuId);
          const vram = gpu?.VRAM_GB || 8;
          return { met: vram >= 12, detail: `GPU VRAM: ${vram}GB GDDR6X` };
        }
      },
      {
        id: 'req-ram-2',
        label: '32GB+ DDR5 Memory',
        targetDescription: 'System memory must be 32GB or higher',
        checkFn: (cfg) => {
          return { met: cfg.ramGb >= 32 && cfg.ramType === 'DDR5', detail: `Installed: ${cfg.ramGb}GB ${cfg.ramType}` };
        }
      },
      {
        id: 'req-psu-2',
        label: 'Minimum 750W 80+ Gold PSU',
        targetDescription: 'Power supply must be rated at 750W Gold or better',
        checkFn: (cfg) => {
          return { met: cfg.psuWatts >= 750, detail: `PSU Rating: ${cfg.psuWatts}W ${cfg.psuRating}` };
        }
      }
    ]
  }
];

export function calculateChallengeScore(
  challenge: BuildChallengeSpec,
  userConfig: ChallengeUserConfig,
  cpus: CPUItem[],
  gpus: GPUItem[]
): ChallengeScoreResult {
  const chosenCpu = cpus.find((c) => c.id === userConfig.cpuId) || cpus[0];
  const chosenGpu = gpus.find((g) => g.id === userConfig.gpuId) || gpus[0];

  // Base costs
  const ramCost = userConfig.ramType === 'DDR5' ? 10500 : 6500;
  const ssdCost = userConfig.storageGb >= 2000 ? 11500 : 5800;
  const boardCost = userConfig.wifiEnabled ? 14500 : 10500;
  const psuCost = userConfig.psuWatts >= 750 ? 7800 : 5800;
  const caseCost = 4500;

  const totalCostINR = chosenCpu.Price_INR + chosenGpu.Price_INR + ramCost + ssdCost + boardCost + psuCost + caseCost;
  const remainingBudgetINR = challenge.budgetINR - totalCostINR;

  // Evaluate requirements
  const requirementChecklist = challenge.requirements.map((req) => {
    const res = req.checkFn(userConfig, cpus, gpus);
    return {
      id: req.id,
      label: req.label,
      met: res.met,
      detail: res.detail
    };
  });

  const allReqsMet = requirementChecklist.every((r) => r.met);

  // METRICS SCORING
  // 1. Budget Utilization Score (92% - 99.5% is ideal)
  const utilRatio = totalCostINR / challenge.budgetINR;
  let budgetUtilization = 0;
  if (utilRatio > 1.0) {
    budgetUtilization = 0; // Overshot budget!
  } else if (utilRatio >= 0.92) {
    budgetUtilization = Math.round(90 + (utilRatio - 0.92) * 125); // 90 to 100
  } else {
    budgetUtilization = Math.round(utilRatio * 90);
  }

  // 2. Performance Estimate Score
  const perfScore = Math.min(100, Math.round((chosenCpu.Gaming_Score + chosenGpu.Gaming_Score) / 2));

  // 3. Power Efficiency Score
  const systemTdpWatts = chosenCpu.TDP_Watts + chosenGpu.TGP_Watts + 80;
  const psuLoadRatio = systemTdpWatts / userConfig.psuWatts;
  let powerEfficiency = 85;
  if (psuLoadRatio >= 0.5 && psuLoadRatio <= 0.75) powerEfficiency = 98; // Sweet spot!
  else if (psuLoadRatio > 0.85) powerEfficiency = 65;

  // 4. Upgrade Headroom Score
  let upgradeHeadroom = 75;
  if (chosenCpu.Socket === 'AM5' && userConfig.ramType === 'DDR5') upgradeHeadroom = 95;
  if (userConfig.psuWatts >= 750) upgradeHeadroom += 5;

  // 5. Compatibility Checks Score
  let compatibilityChecks = 100;
  if (chosenCpu.TDP_Watts > 150 && caseCost < 3000) compatibilityChecks -= 15;

  // Total Composite
  const totalComposite = allReqsMet
    ? Math.round(
        budgetUtilization * 0.25 +
          perfScore * 0.35 +
          powerEfficiency * 0.15 +
          upgradeHeadroom * 0.15 +
          compatibilityChecks * 0.1
      )
    : 0;

  let rankTier: ChallengeScoreResult['rankTier'] = 'FAILED';
  if (allReqsMet) {
    if (totalComposite >= 92) rankTier = 'S';
    else if (totalComposite >= 82) rankTier = 'A';
    else if (totalComposite >= 72) rankTier = 'B';
    else rankTier = 'C';
  }

  let feedback = 'All requirements satisfied! Balanced hardware selection.';
  if (!allReqsMet) feedback = 'Configuration failed one or more mandatory challenge requirements.';
  else if (rankTier === 'S') feedback = '🏆 Masterful allocation! Maximum FPS extracted per Rupee spent.';

  return {
    requirementsMet: allReqsMet,
    requirementChecklist,
    scores: {
      budgetUtilization: Math.min(100, Math.max(0, budgetUtilization)),
      performanceEstimate: Math.min(100, Math.max(0, perfScore)),
      powerEfficiency: Math.min(100, Math.max(0, powerEfficiency)),
      upgradeHeadroom: Math.min(100, Math.max(0, upgradeHeadroom)),
      compatibilityChecks: Math.min(100, Math.max(0, compatibilityChecks)),
      totalComposite: Math.min(100, Math.max(0, totalComposite))
    },
    rankTier,
    totalCostINR,
    remainingBudgetINR,
    summaryFeedback: feedback
  };
}
