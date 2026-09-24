import { CPUItem, GPUItem } from '../types';

export type BuildObjective = 'gaming' | 'ai' | 'editing' | 'streaming' | 'rendering' | 'balanced';

export interface ObjectiveProfile {
  id: BuildObjective;
  title: string;
  shortLabel: string;
  iconName: string;
  description: string;
  priorityNote: string;
  allocations: {
    gpuPct: number;
    cpuPct: number;
    ramPct: number;
    ssdPct: number;
    boardPct: number;
    psuPct: number;
    casePct: number;
  };
}

export const OBJECTIVE_PROFILES: ObjectiveProfile[] = [
  {
    id: 'gaming',
    title: 'Gaming Focused',
    shortLabel: 'Gaming',
    iconName: 'Gamepad2',
    description: 'Maximized GPU allocation (43%) for high frame rates and graphics settings, paired with an efficient gaming CPU.',
    priorityNote: 'Prioritizes maximum graphics card horsepower. 16GB-32GB RAM is sufficient.',
    allocations: {
      gpuPct: 43,
      cpuPct: 19,
      ramPct: 8,
      ssdPct: 7,
      boardPct: 10,
      psuPct: 7,
      casePct: 6
    }
  },
  {
    id: 'ai',
    title: 'AI & Machine Learning',
    shortLabel: 'AI / ML',
    iconName: 'Brain',
    description: 'Heavy VRAM GPU allocation (46%) for CUDA tensor acceleration, coupled with 32GB+ system RAM for large model weights.',
    priorityNote: 'Prioritizes NVIDIA Tensor Cores & VRAM capacity for Local LLMs & PyTorch model execution.',
    allocations: {
      gpuPct: 46,
      cpuPct: 16,
      ramPct: 12,
      ssdPct: 8,
      boardPct: 9,
      psuPct: 6,
      casePct: 3
    }
  },
  {
    id: 'editing',
    title: 'Video Editing & VFX',
    shortLabel: 'Video Editing',
    iconName: 'Film',
    description: 'Balanced CPU multi-core power (28%), high RAM capacity (14%), and high-speed NVMe storage (12%) for timeline scrubbing.',
    priorityNote: 'Prioritizes CPU cores for H.264/H.265 export rendering & RAM scratch disk capacity.',
    allocations: {
      gpuPct: 26,
      cpuPct: 28,
      ramPct: 14,
      ssdPct: 12,
      boardPct: 10,
      psuPct: 6,
      casePct: 4
    }
  },
  {
    id: 'streaming',
    title: 'Live Streaming & Content',
    shortLabel: 'Streaming',
    iconName: 'Video',
    description: 'Robust GPU NVENC encoder (36%) + strong CPU multi-threading (22%) for OBS encoding without game frame drops.',
    priorityNote: 'Prevents video encoder overload while gaming and streaming simultaneously.',
    allocations: {
      gpuPct: 36,
      cpuPct: 22,
      ramPct: 10,
      ssdPct: 8,
      boardPct: 11,
      psuPct: 8,
      casePct: 5
    }
  },
  {
    id: 'rendering',
    title: '3D Rendering & CAD',
    shortLabel: '3D Rendering',
    iconName: 'Box',
    description: 'Heavy CPU thread count (28%) for V-Ray / Blender CPU rendering + CUDA GPU acceleration (32%).',
    priorityNote: 'Handles complex viewport Nanite geometry, Blender cycles, and CAD assemblies.',
    allocations: {
      gpuPct: 32,
      cpuPct: 28,
      ramPct: 12,
      ssdPct: 8,
      boardPct: 10,
      psuPct: 6,
      casePct: 4
    }
  },
  {
    id: 'balanced',
    title: 'Balanced All-Rounder',
    shortLabel: 'Balanced',
    iconName: 'Scale',
    description: 'Versatile allocation split for mixed gaming, programming, general productivity, and longevity.',
    priorityNote: 'Balanced spend across all hardware modules with zero severe bottlenecks.',
    allocations: {
      gpuPct: 35,
      cpuPct: 22,
      ramPct: 9,
      ssdPct: 8,
      boardPct: 12,
      psuPct: 8,
      casePct: 6
    }
  }
];

export interface OptimizedBuildResult {
  budgetINR: number;
  objective: ObjectiveProfile;
  allocatedInr: {
    gpu: number;
    cpu: number;
    ram: number;
    ssd: number;
    board: number;
    psu: number;
    case: number;
  };
  recommendedParts: {
    cpu: CPUItem;
    gpu: GPUItem;
    ramModel: string;
    ramPriceINR: number;
    ssdModel: string;
    ssdPriceINR: number;
    boardModel: string;
    boardPriceINR: number;
    psuModel: string;
    psuPriceINR: number;
    caseModel: string;
    casePriceINR: number;
  };
  totalActualINR: number;
  remainingBufferINR: number;
}

export function generateOptimizedBuild(
  budgetINR: number,
  objective: ObjectiveProfile,
  cpus: CPUItem[],
  gpus: GPUItem[]
): OptimizedBuildResult {
  const alloc = objective.allocations;

  const targetGpuINR = Math.round((budgetINR * alloc.gpuPct) / 100);
  const targetCpuINR = Math.round((budgetINR * alloc.cpuPct) / 100);
  const targetRamINR = Math.round((budgetINR * alloc.ramPct) / 100);
  const targetSsdINR = Math.round((budgetINR * alloc.ssdPct) / 100);
  const targetBoardINR = Math.round((budgetINR * alloc.boardPct) / 100);
  const targetPsuINR = Math.round((budgetINR * alloc.psuPct) / 100);
  const targetCaseINR = Math.round((budgetINR * alloc.casePct) / 100);

  // Pick closest CPU in price
  const sortedCpus = [...cpus].sort((a, b) => Math.abs(a.Price_INR - targetCpuINR) - Math.abs(b.Price_INR - targetCpuINR));
  const chosenCpu = sortedCpus[0] || cpus[0];

  // Pick closest GPU in price
  const sortedGpus = [...gpus].sort((a, b) => Math.abs(a.Price_INR - targetGpuINR) - Math.abs(b.Price_INR - targetGpuINR));
  const chosenGpu = sortedGpus[0] || gpus[0];

  // Smart RAM model selection
  let ramModel = '16GB (2x8GB) DDR4-3200 CL16';
  let ramPrice = targetRamINR;
  if (targetRamINR >= 18000) {
    ramModel = '64GB (2x32GB) DDR5-6000 CL30 EXPO';
  } else if (targetRamINR >= 9000) {
    ramModel = '32GB (2x16GB) DDR5-6000 CL30 EXPO';
  } else if (targetRamINR >= 5000) {
    ramModel = '32GB (2x16GB) DDR4-3600 CL16 Dual Channel';
  }

  // Smart SSD model selection
  let ssdModel = '1TB PCIe 3.0 NVMe SSD';
  let ssdPrice = targetSsdINR;
  if (targetSsdINR >= 14000) {
    ssdModel = '2TB PCIe 5.0 x4 NVMe SSD (12,000 MB/s)';
  } else if (targetSsdINR >= 7000) {
    ssdModel = '2TB PCIe 4.0 x4 NVMe SSD (7,400 MB/s)';
  } else if (targetSsdINR >= 4500) {
    ssdModel = '1TB PCIe 4.0 x4 NVMe SSD (5,000 MB/s)';
  }

  // Motherboard
  let boardModel = 'B650 / B760 Wi-Fi Motherboard';
  if (chosenCpu.Socket === 'AM5') {
    boardModel = targetBoardINR > 18000 ? 'X670E / B650E Extreme Gaming Wi-Fi' : 'MSI / Gigabyte B650 Gaming Wi-Fi';
  } else if (chosenCpu.Socket === 'LGA1700') {
    boardModel = targetBoardINR > 18000 ? 'Z790 DDR5 Gaming Motherboard' : 'B760M Wi-Fi DDR5 Motherboard';
  }

  // PSU
  let psuModel = '650W 80+ Bronze Power Supply';
  if (targetPsuINR >= 12000) psuModel = '850W / 1000W 80+ Gold Fully Modular PCIe 5.0 ATX 3.0';
  else if (targetPsuINR >= 7000) psuModel = '750W 80+ Gold ATX 3.0 Power Supply';

  // Case
  let caseModel = 'Mid-Tower Cabinet with 3x ARGB Mesh Fans';
  if (targetCaseINR >= 9000) caseModel = 'Lian Li O11 Dynamic / NZXT H7 Flow Dual Chamber';

  const totalActual = chosenCpu.Price_INR + chosenGpu.Price_INR + ramPrice + ssdPrice + targetBoardINR + targetPsuINR + targetCaseINR;
  const remainingBuffer = budgetINR - totalActual;

  return {
    budgetINR,
    objective,
    allocatedInr: {
      gpu: targetGpuINR,
      cpu: targetCpuINR,
      ram: targetRamINR,
      ssd: targetSsdINR,
      board: targetBoardINR,
      psu: targetPsuINR,
      case: targetCaseINR
    },
    recommendedParts: {
      cpu: chosenCpu,
      gpu: chosenGpu,
      ramModel,
      ramPriceINR: ramPrice,
      ssdModel,
      ssdPriceINR: ssdPrice,
      boardModel,
      boardPriceINR: targetBoardINR,
      psuModel,
      psuPriceINR: targetPsuINR,
      caseModel,
      casePriceINR: targetCaseINR
    },
    totalActualINR: totalActual,
    remainingBufferINR: remainingBuffer
  };
}
