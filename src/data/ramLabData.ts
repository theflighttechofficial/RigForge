export interface RAMPresetConfig {
  id: string;
  name: string;
  type: 'DDR4' | 'DDR5';
  frequencyMhz: number;
  casLatencyCL: number;
  tRCD: number;
  tRP: number;
  tRAS: number;
  channels: 'Single' | 'Dual';
  dimmCount: 2 | 4;
  capacityGb: number;
  gearMode: 'Gear 1 (1:1)' | 'Gear 2 (1:2)' | 'Gear 4 (1:4)';
  priceINR: number;
  description: string;
  badge?: string;
}

export interface CapacityWorkloadSuitability {
  capacityGb: number;
  dimmConfig: string;
  label: string;
  recommendedFor: string;
  priceINR: number;
  gamingScore: number; // out of 100
  multitaskingScore: number;
  contentCreationScore: number;
  aiWorkstationScore: number;
  suitabilityBullets: {
    workload: string;
    suitability: 'Ideal' | 'Sufficient' | 'Stuttered / Constrained' | 'Overkill';
    notes: string;
  }[];
}

export const RAM_PRESETS: RAMPresetConfig[] = [
  {
    id: 'ddr4-3200-cl16',
    name: 'DDR4-3200 CL16 Dual Channel',
    type: 'DDR4',
    frequencyMhz: 3200,
    casLatencyCL: 16,
    tRCD: 18,
    tRP: 18,
    tRAS: 36,
    channels: 'Dual',
    dimmCount: 2,
    capacityGb: 16,
    gearMode: 'Gear 1 (1:1)',
    priceINR: 3800,
    description: 'Standard budget DDR4 configuration. solid baseline for entry-level gaming builds.'
  },
  {
    id: 'ddr4-3600-cl16',
    name: 'DDR4-3600 CL16 Dual Channel',
    type: 'DDR4',
    frequencyMhz: 3600,
    casLatencyCL: 16,
    tRCD: 19,
    tRP: 19,
    tRAS: 39,
    channels: 'Dual',
    dimmCount: 2,
    capacityGb: 32,
    gearMode: 'Gear 1 (1:1)',
    priceINR: 6500,
    badge: 'DDR4 Sweet Spot',
    description: 'The absolute sweet spot for AMD AM4 (Ryzen 5000) with 1:1 1800MHz Infinity Fabric ratio.'
  },
  {
    id: 'ddr5-5200-cl40',
    name: 'DDR5-5200 CL40 JEDEC Standard',
    type: 'DDR5',
    frequencyMhz: 5200,
    casLatencyCL: 40,
    tRCD: 40,
    tRP: 40,
    tRAS: 76,
    channels: 'Dual',
    dimmCount: 2,
    capacityGb: 32,
    gearMode: 'Gear 2 (1:2)',
    priceINR: 8200,
    description: 'Baseline JEDEC DDR5 kit. Higher latency (15.38ns) offsets initial bandwidth gains.'
  },
  {
    id: 'ddr5-6000-cl30',
    name: 'DDR5-6000 CL30 EXPO / XMP 3.0',
    type: 'DDR5',
    frequencyMhz: 6000,
    casLatencyCL: 30,
    tRCD: 36,
    tRP: 36,
    tRAS: 76,
    channels: 'Dual',
    dimmCount: 2,
    capacityGb: 32,
    gearMode: 'Gear 1 (1:1)',
    priceINR: 10500,
    badge: 'AMD AM5 Gold Standard',
    description: 'The universal sweet spot for AMD AM5 (Ryzen 7000/9000). Perfect 10.0ns first-word latency and 96 GB/s bandwidth in Gear 1 (1:1 UCLK).'
  },
  {
    id: 'ddr5-7200-cl34',
    name: 'DDR5-7200 CL34 Intel XMP 3.0',
    type: 'DDR5',
    frequencyMhz: 7200,
    casLatencyCL: 34,
    tRCD: 42,
    tRP: 42,
    tRAS: 84,
    channels: 'Dual',
    dimmCount: 2,
    capacityGb: 32,
    gearMode: 'Gear 2 (1:2)',
    priceINR: 14800,
    badge: 'Intel 14th Gen Sweet Spot',
    description: 'High-frequency kit designed for Intel LGA1700 platforms running Gear 2. Massive 115.2 GB/s memory bandwidth.'
  },
  {
    id: 'ddr5-8000-cl38',
    name: 'DDR5-8000 CL38 Enthusiast OC',
    type: 'DDR5',
    frequencyMhz: 8000,
    casLatencyCL: 38,
    tRCD: 48,
    tRP: 48,
    tRAS: 96,
    channels: 'Dual',
    dimmCount: 2,
    capacityGb: 48,
    gearMode: 'Gear 2 (1:2)',
    priceINR: 22500,
    badge: 'Bleeding Edge Enthusiast',
    description: 'Pushes memory bandwidth up to 128 GB/s on 2-DIMM Z790/Z890 motherboards.'
  }
];

export const CAPACITY_SUITABILITY: CapacityWorkloadSuitability[] = [
  {
    capacityGb: 16,
    dimmConfig: '2 x 8GB Dual Channel',
    label: '16GB (Entry Baseline)',
    recommendedFor: 'Budget Gaming & Daily Office Tasks',
    priceINR: 3800,
    gamingScore: 72,
    multitaskingScore: 60,
    contentCreationScore: 45,
    aiWorkstationScore: 20,
    suitabilityBullets: [
      {
        workload: '1080p eSports Gaming (Valorant, CS2)',
        suitability: 'Ideal',
        notes: 'Sufficient memory headroom for competitive title frame rates.'
      },
      {
        workload: 'Modern AAA Games (Starfield, Cyberpunk 2077, Hogwarts Legacy)',
        suitability: 'Stuttered / Constrained',
        notes: 'Asset streaming causes micro-stutters when RAM usage exceeds 14.5GB.'
      },
      {
        workload: '4K Video Editing (Premiere Pro / DaVinci Resolve)',
        suitability: 'Stuttered / Constrained',
        notes: 'Timeline scrubbing causes system disk swap paging.'
      },
      {
        workload: 'Local AI LLM Inference (Ollama / Llama 3 8B)',
        suitability: 'Stuttered / Constrained',
        notes: 'Insufficient RAM buffer to fit 8B parameter weights on system RAM.'
      }
    ]
  },
  {
    capacityGb: 32,
    dimmConfig: '2 x 16GB Dual Channel',
    label: '32GB (The Gold Standard)',
    recommendedFor: '1440p / 4K Gaming, Streaming & Content Creation',
    priceINR: 9500,
    gamingScore: 98,
    multitaskingScore: 92,
    contentCreationScore: 82,
    aiWorkstationScore: 60,
    suitabilityBullets: [
      {
        workload: '1440p / 4K AAA Gaming with Ray Tracing',
        suitability: 'Ideal',
        notes: 'Zero micro-stutters. Comfortably runs Discord, Chrome & Spotify in the background.'
      },
      {
        workload: 'Game Live Streaming (OBS Studio + Virtual Camera)',
        suitability: 'Ideal',
        notes: 'Prevents encoder frame dropping during intense multi-app multitasking.'
      },
      {
        workload: '4K Video Editing & Motion Graphics',
        suitability: 'Sufficient',
        notes: 'Handles 4K ProRes timeline previews with light motion effects.'
      },
      {
        workload: 'Local AI LLM Inference (Llama 3 8B / Qwen 2.5 14B Q4)',
        suitability: 'Sufficient',
        notes: 'Fits 8B-14B quantized models into system RAM with smooth token generation.'
      }
    ]
  },
  {
    capacityGb: 64,
    dimmConfig: '2 x 32GB Dual Channel',
    label: '64GB (Heavy Creator & Pro Suite)',
    recommendedFor: 'Heavy 4K/8K Editing, 3D Rendering & Virtualization',
    priceINR: 19200,
    gamingScore: 99,
    multitaskingScore: 98,
    contentCreationScore: 96,
    aiWorkstationScore: 85,
    suitabilityBullets: [
      {
        workload: '8K RED / ProRes Video Editing & After Effects',
        suitability: 'Ideal',
        notes: 'Generous RAM cache for multi-layered After Effects motion tracking.'
      },
      {
        workload: 'Unreal Engine 5 & Blender 3D Scene Assembly',
        suitability: 'Ideal',
        notes: 'Maintains stability when compiling massive Nanite geometry assets.'
      },
      {
        workload: 'Multi-Container Docker & VM Virtualization',
        suitability: 'Ideal',
        notes: 'Run multiple development environments simultaneously without swapping.'
      },
      {
        workload: 'Local AI LLM Inference (Llama 3 70B Quantized)',
        suitability: 'Sufficient',
        notes: 'Capable of loading 70B parameter Q4 models on system RAM.'
      }
    ]
  },
  {
    capacityGb: 128,
    dimmConfig: '4 x 32GB or 2 x 64GB Workstation',
    label: '128GB (Enterprise Workstation)',
    recommendedFor: 'Local AI Model Training, VFX Compositing & Massive Data Science',
    priceINR: 42000,
    gamingScore: 95, // 4 DIMMs on DDR5 might drop memory clock slightly
    multitaskingScore: 100,
    contentCreationScore: 100,
    aiWorkstationScore: 98,
    suitabilityBullets: [
      {
        workload: 'Pure Gaming',
        suitability: 'Overkill',
        notes: 'No gaming performance benefit over 32GB/64GB. Note: 4 DIMMs on DDR5 may drop MAX memory frequency.'
      },
      {
        workload: 'Local LLM Inference (70B / 120B Parameter Models)',
        suitability: 'Ideal',
        notes: 'Enables CPU/RAM offloading for massive open-source AI models.'
      },
      {
        workload: 'Massive CFD, FEA Engineering & CAD Assemblies',
        suitability: 'Ideal',
        notes: 'Prevents out-of-memory crashes on complex finite element simulations.'
      }
    ]
  }
];

// Physics calculations
export function calculateFirstWordLatencyNs(frequencyMhz: number, casLatencyCL: number): number {
  if (!frequencyMhz || !casLatencyCL) return 0;
  // First word latency (ns) = (2000 * CL) / Frequency (MT/s)
  return Number(((2000 * casLatencyCL) / frequencyMhz).toFixed(2));
}

export function calculateMemoryBandwidthGBps(
  frequencyMhz: number,
  channels: 'Single' | 'Dual',
  type: 'DDR4' | 'DDR5'
): number {
  if (!frequencyMhz) return 0;
  // Single Channel = 64-bit bus (8 bytes)
  // Dual Channel = 128-bit bus (16 bytes)
  const bytesPerCycle = channels === 'Dual' ? 16 : 8;
  const bandwidth = (frequencyMhz * bytesPerCycle) / 1000;
  return Number(bandwidth.toFixed(1));
}

export function calculateEffectiveTotalLatencyNs(
  firstWordLatencyNs: number,
  gearMode: 'Gear 1 (1:1)' | 'Gear 2 (1:2)' | 'Gear 4 (1:4)',
  dimmCount: 2 | 4,
  type: 'DDR4' | 'DDR5'
): number {
  let gearPenaltyNs = 0;
  if (gearMode === 'Gear 2 (1:2)') gearPenaltyNs = 6.5;
  if (gearMode === 'Gear 4 (1:4)') gearPenaltyNs = 14.0;

  // 4 DIMMs on DDR5 adds signal noise / controller strain (~3.5ns)
  let dimmPenaltyNs = 0;
  if (type === 'DDR5' && dimmCount === 4) dimmPenaltyNs = 4.0;

  return Number((firstWordLatencyNs + gearPenaltyNs + dimmPenaltyNs).toFixed(2));
}

export function calculateFPSStabilityScore(effectiveLatencyNs: number, bandwidthGBps: number): number {
  // Lower latency + higher bandwidth = better 1% low FPS stability
  let score = 100 - (effectiveLatencyNs - 8) * 4 + (bandwidthGBps / 100) * 15;
  return Math.max(50, Math.min(99, Math.round(score)));
}
