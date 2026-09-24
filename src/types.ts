export type Brand = 'AMD' | 'Intel' | 'NVIDIA';
export type ComponentCategory = 'CPU' | 'GPU';
export type HardwareEra = 'vintage' | 'mainstream' | 'enthusiast' | 'workstation';
export type WorkloadProfile = 'gaming' | 'productivity' | 'balanced';
export type ResolutionMode = '1080p' | '1440p' | '4k' | 'workstation';

export interface WorkloadRadarScores {
  esports1080p: number;
  raster1440p4k: number;
  rayTracing: number;
  videoEditing: number;
  render3D: number;
  aiCompute: number;
}

export interface CPUItem {
  id: string;
  category: 'CPU';
  Model: string;
  Brand: 'AMD' | 'Intel';
  Architecture: string;
  Socket: string;
  ReleaseYear: number;
  Era: HardwareEra;
  Price_INR: number;
  Price_USD: number;
  Benchmark_Score: number;
  SingleCore_Score: number;
  MultiCore_Score: number;
  Gaming_Score: number;
  Cores_Threads: string;
  Cores: number;
  Threads: number;
  Base_Boost_GHz: string;
  TDP_Watts: number;
  Cache_MB: number;
  Has_iGPU: boolean;
  PCIe_Gen: string;
  Memory_Support: string;
  RadarScores: WorkloadRadarScores;
  Description: string;
}

export interface GPUItem {
  id: string;
  category: 'GPU';
  Model: string;
  Brand: 'AMD' | 'NVIDIA' | 'Intel';
  Architecture: string;
  ReleaseYear: number;
  Era: HardwareEra;
  Price_INR: number;
  Price_USD: number;
  Benchmark_Score: number;
  Gaming_Score: number;
  RayTracing_Score: number;
  Compute_Score: number;
  VRAM_GB: number;
  Memory_Type: string;
  Bus_Width_Bit: number;
  Bandwidth_GBs: number;
  TGP_Watts: number;
  Recommended_PSU_Watts: number;
  PCIe_Interface: string;
  Length_mm: number;
  RadarScores: WorkloadRadarScores;
  Description: string;
}

export type HardwareItem = CPUItem | GPUItem;

export interface RecommendationSet<T extends HardwareItem> {
  budgetChampion: T | null;
  performancePeak: T | null;
  efficiencySweetSpot: T | null;
}

export interface AdverseWarning {
  severity: 'NONE' | 'MODERATE' | 'SEVERE' | 'CATASTROPHIC';
  title: string;
  details: string[];
}

export interface SynergyResult {
  bottleneckPercentage: number;
  status: 'BALANCED' | 'CPU_BOTTLENECK' | 'GPU_BOTTLENECK';
  cpuUtilization: number;
  gpuUtilization: number;
  summary: string;
  verdict: string;
  adverseWarning: AdverseWarning;
  gameFpsEstimates: {
    game: string;
    fps: number;
    quality: string;
    setting: string;
  }[];
}

export interface SystemBuild {
  cpuId: string;
  gpuId: string;
  ramGb: number;
  ramType: 'DDR4' | 'DDR5';
  storageCount: number;
  coolerType: 'Stock' | 'Tower Air' | '240mm AIO' | '360mm AIO';
}

export type ActiveTab = 'intro' | 'digitaltwin' | 'doctor' | 'matrix' | 'compare' | 'synergy' | 'storagelab' | 'ramlab' | 'costoptimizer' | 'challengemode' | 'community' | 'troubleshoot' | 'builder' | 'spatial3d' | 'battlestation' | 'anatomy' | 'benchmarks' | 'roi' | 'cost' | 'catalog';

export interface ComponentRecord {
  model: string;
  hardwareId?: string;
  priceINR: number;
  purchaseDate: string;
  warrantyExpiry: string;
  retailStore: string;
  notes?: string;
}

export interface DigitalTwinStorageDrive {
  id: string;
  type: 'Gen5 NVMe' | 'Gen4 NVMe' | 'Gen3 NVMe' | 'SATA SSD' | 'HDD';
  model: string;
  capacityGb: number;
  usedGb: number;
  readSpeedMBps: number;
  writeSpeedMBps: number;
  healthPercent: number;
  priceINR: number;
  purchaseDate: string;
  warrantyExpiry: string;
}

export interface DigitalTwinFanConfig {
  location: 'Front Intake' | 'Top Exhaust' | 'Rear Exhaust' | 'Bottom Intake' | 'Side Intake';
  fanCount: number;
  fanSizeMm: number;
  rpm: number;
  direction: 'Intake' | 'Exhaust';
}

export interface DigitalTwinPC {
  id: string;
  name: string;
  tagline: string;
  updatedAt: string;
  themeColor: string;
  isPrimary: boolean;

  // Core Hardware Specs
  cpu: ComponentRecord & {
    coresThreads: string;
    socket: string;
    tdpWatts: number;
  };
  gpu: ComponentRecord & {
    vramGb: number;
    tgpWatts: number;
    lengthMm: number;
  };
  motherboard: ComponentRecord & {
    chipset: string;
    formFactor: 'ATX' | 'Micro-ATX' | 'Mini-ITX' | 'E-ATX';
    pcieVersion: string;
  };
  ram: ComponentRecord & {
    capacityGb: number;
    type: 'DDR4' | 'DDR5';
    speedMhz: number;
    timing: string;
    channels: 'Dual Channel' | 'Quad Channel' | 'Single Channel';
    expoXmpProfile: 'EXPO I' | 'EXPO II' | 'XMP 3.0' | 'Manual' | 'Stock JEDEC';
  };
  storageDrives: DigitalTwinStorageDrive[];
  psu: ComponentRecord & {
    wattage: number;
    efficiencyRating: '80+ Bronze' | '80+ Gold' | '80+ Platinum' | '80+ Titanium';
    atxStandard: 'ATX 3.1' | 'ATX 3.0' | 'ATX 2.4';
  };
  cabinet: ComponentRecord & {
    caseModel: string;
    formFactor: 'Mid-Tower' | 'Full-Tower' | 'Mini-ITX';
    widthMm: number;
    heightMm: number;
    depthMm: number;
    maxGpuLengthMm: number;
    maxCoolerHeightMm: number;
  };

  // Cooling & Airflow Dynamics
  cooling: {
    coolerModel: string;
    coolerType: 'Stock Air' | 'Twin-Tower Air' | '240mm AIO' | '280mm AIO' | '360mm AIO' | 'Custom Liquid Loop';
    radiatorMount: 'Top' | 'Front' | 'Side' | 'None';
    thermalPaste: string;
    pasteAppliedDate: string;
    fans: DigitalTwinFanConfig[];
    staticPressure: 'Positive' | 'Neutral' | 'Negative';
  };

  // Thermal & Sensor Telemetry
  telemetry: {
    ambientRoomTempC: number;
    cpuIdleTempC: number;
    cpuLoadTempC: number;
    gpuIdleTempC: number;
    gpuLoadTempC: number;
    gpuHotspotTempC: number;
    vramTempC: number;
    totalPowerDrawLoadWatts: number;
    totalPowerDrawIdleWatts: number;
  };

  // Firmware & BIOS Configuration
  bios: {
    biosVersion: string;
    releaseDate: string;
    resizableBar: boolean;
    secureBoot: boolean;
    tpmActive: boolean;
    curveOptimizer: string;
    fclkMhz: number;
    expoEnabled: boolean;
  };

  // Display & Peripherals
  display: {
    model: string;
    resolution: '1080p' | '1440p' | '4K' | 'Ultrawide 3440x1440';
    refreshRateHz: number;
    panelType: 'OLED' | 'Fast IPS' | 'Mini-LED' | 'VA';
    syncTechnology: 'G-Sync Compatible' | 'FreeSync Premium' | 'None';
  };
  peripherals: {
    keyboard: string;
    mouse: string;
    headsetAudio: string;
    upsModel: string;
    upsVa: number;
    upsBatteryMinutesGaming: number;
  };

  // Computed / Assessed Dimension Scores (Out of 100)
  scores: DigitalTwinScores;
}

export interface DigitalTwinScores {
  performance: number;
  thermals: number;
  powerEfficiency: number;
  upgradeability: number;
  value: number;
  compositeScore: number;
}

export interface BuildDoctorReport {
  timestamp: string;
  config: {
    cpu: string;
    gpu: string;
    ram: string;
  };
  overallHealthScore: number;
  overallVerdict: string;
  balance: {
    res1080p: {
      status: 'CPU constrained' | 'GPU dominant' | 'Balanced';
      explanation: string;
      cpuLoadEst: number;
      gpuLoadEst: number;
    };
    res1440p: {
      status: 'CPU constrained' | 'GPU dominant' | 'Balanced';
      explanation: string;
      cpuLoadEst: number;
      gpuLoadEst: number;
    };
    res4k: {
      status: 'CPU constrained' | 'GPU dominant' | 'Balanced';
      explanation: string;
      cpuLoadEst: number;
      gpuLoadEst: number;
    };
  };
  memory: {
    capacity: string;
    statusText: string;
    severity: 'optimal' | 'moderate' | 'critical';
    analysis: string;
    hitchingRisk: string;
  };
  platform: {
    socket: string;
    statusText: string;
    upgradePotential: 'high' | 'moderate' | 'dead_end';
    analysis: string;
    maxRecommendedCpu: string;
  };
  upgradeSequence: {
    step: number;
    target: string;
    priority: 'Immediate' | 'Secondary' | 'Future' | 'Keep';
    costINR: number;
    rationale: string;
  }[];
  detailedRationale: string[];
  aiGenerated?: boolean;
}

export interface SavedCustomPreset {
  id: string;
  name: string;
  createdAt: number;
  cpuId: string;
  gpuId: string;
  ramCapacity: number;
  ramType: 'DDR4' | 'DDR5';
  storageCount: number;
  cooler: 'Air Cooler' | '240mm AIO' | '360mm AIO';
  cabinetId: string;
  psuId: string;
  customPsuWattage?: number | null;
  totalBuildCostINR: number;
  totalWatts: number;
  notes?: string;
}

export interface BudgetPreset {
  id: string;
  name: string;
  tierCategory: 'Budget' | 'Mid-Range' | 'High-End' | 'Enthusiast' | 'Workstation';
  targetBudgetINR: number;
  resolutionTier: '1080p Esports' | '1080p Ultra' | '1440p Sweet Spot' | '4K High Refresh' | 'Deep Learning / 3D Workstation';
  cpuId: string;
  gpuId: string;
  ram: string;
  psuWatts: number;
  description: string;
  highlights: string[];
}
