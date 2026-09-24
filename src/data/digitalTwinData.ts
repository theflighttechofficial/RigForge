import { DigitalTwinPC, DigitalTwinScores } from '../types';

export const DEFAULT_DIGITAL_TWIN: DigitalTwinPC = {
  id: 'twin-primary-rig',
  name: 'Vanguard Alpha // Battlestation',
  tagline: 'High-Refresh 1440p OLED Gaming & Content Creation Rig',
  updatedAt: new Date().toISOString(),
  themeColor: '#06b6d4', // Cyan
  isPrimary: true,

  // Core Hardware
  cpu: {
    model: 'AMD Ryzen 7 7800X3D',
    hardwareId: 'cpu-amd-7800x3d',
    coresThreads: '8 Cores / 16 Threads (96MB 3D V-Cache)',
    socket: 'AM5',
    tdpWatts: 120,
    priceINR: 36999,
    purchaseDate: '2024-11-15',
    warrantyExpiry: '2027-11-15',
    retailStore: 'PrimeABGB Mumbai',
    notes: 'Silicon Lottery gold sample. -20mV all-core stable.'
  },
  gpu: {
    model: 'NVIDIA GeForce RTX 4070 Super 12GB',
    hardwareId: 'gpu-nvidia-4070-super',
    vramGb: 12,
    tgpWatts: 220,
    lengthMm: 267,
    priceINR: 59999,
    purchaseDate: '2024-12-02',
    warrantyExpiry: '2027-12-02',
    retailStore: 'Vedant Computers Kolkata',
    notes: 'Dual-slot compact card with zero coil whine.'
  },
  motherboard: {
    model: 'MSI MAG B650 TOMAHAWK WIFI',
    chipset: 'AMD B650',
    formFactor: 'ATX',
    pcieVersion: 'PCIe 4.0 x16 + PCIe 5.0 M.2',
    priceINR: 21499,
    purchaseDate: '2024-11-15',
    warrantyExpiry: '2027-11-15',
    retailStore: 'MDComputers Kolkata',
    notes: '14+2+1 80A SPS VRM. Excellent thermal dissipation.'
  },
  ram: {
    model: 'G.Skill Flare X5 32GB (2x16GB) DDR5-6000 CL30',
    capacityGb: 32,
    type: 'DDR5',
    speedMhz: 6000,
    timing: 'CL30-38-38-96 @ 1.35V',
    channels: 'Dual Channel',
    expoXmpProfile: 'EXPO I',
    priceINR: 10499,
    purchaseDate: '2024-11-15',
    warrantyExpiry: '2034-11-15', // Lifetime 10-year
    retailStore: 'PrimeABGB Mumbai',
    notes: 'SK Hynix A-die chips. Low profile 33mm clearance.'
  },
  storageDrives: [
    {
      id: 'drive-nvme-1',
      type: 'Gen4 NVMe',
      model: 'Kingston KC3000 2TB PCIe 4.0 M.2',
      capacityGb: 2048,
      usedGb: 1240,
      readSpeedMBps: 7000,
      writeSpeedMBps: 7000,
      healthPercent: 99,
      priceINR: 12999,
      purchaseDate: '2024-11-15',
      warrantyExpiry: '2029-11-15'
    },
    {
      id: 'drive-nvme-2',
      type: 'Gen4 NVMe',
      model: 'Crucial P3 Plus 1TB PCIe 4.0 M.2',
      capacityGb: 1024,
      usedGb: 480,
      readSpeedMBps: 5000,
      writeSpeedMBps: 4200,
      healthPercent: 100,
      priceINR: 5499,
      purchaseDate: '2025-01-10',
      warrantyExpiry: '2030-01-10'
    }
  ],
  psu: {
    model: 'Corsair RM850e Fully Modular (2023)',
    wattage: 850,
    efficiencyRating: '80+ Gold',
    atxStandard: 'ATX 3.1',
    priceINR: 10899,
    purchaseDate: '2024-11-15',
    warrantyExpiry: '2031-11-15', // 7-year warranty
    retailStore: 'Amazon India',
    notes: 'Native 12V-2x6 PCIe Gen 5 connector with zero-RPM fan mode.'
  },
  cabinet: {
    model: 'Lian Li Lancool 216 RGB Black',
    caseModel: 'Lian Li Lancool 216',
    formFactor: 'Mid-Tower',
    widthMm: 235,
    heightMm: 491,
    depthMm: 480,
    maxGpuLengthMm: 392,
    maxCoolerHeightMm: 180,
    priceINR: 7899,
    purchaseDate: '2024-11-15',
    warrantyExpiry: '2026-11-15',
    retailStore: 'PrimeABGB Mumbai'
  },

  // Cooling & Airflow
  cooling: {
    coolerModel: 'DeepCool LT720 360mm AIO Liquid Cooler',
    coolerType: '360mm AIO',
    radiatorMount: 'Top',
    thermalPaste: 'Arctic MX-6 High Performance Carbon Paste',
    pasteAppliedDate: '2024-11-15',
    fans: [
      { location: 'Front Intake', fanCount: 2, fanSizeMm: 160, rpm: 1100, direction: 'Intake' },
      { location: 'Top Exhaust', fanCount: 3, fanSizeMm: 120, rpm: 1350, direction: 'Exhaust' },
      { location: 'Rear Exhaust', fanCount: 1, fanSizeMm: 140, rpm: 950, direction: 'Exhaust' }
    ],
    staticPressure: 'Positive'
  },

  // Temperatures & Power Telemetry
  telemetry: {
    ambientRoomTempC: 28,
    cpuIdleTempC: 38,
    cpuLoadTempC: 68,
    gpuIdleTempC: 33,
    gpuLoadTempC: 62,
    gpuHotspotTempC: 72,
    vramTempC: 65,
    totalPowerDrawLoadWatts: 440,
    totalPowerDrawIdleWatts: 68
  },

  // Firmware & BIOS
  bios: {
    biosVersion: 'E7D75AMS.1J0 (AGESA 1.2.0.2)',
    releaseDate: '2024-10-18',
    resizableBar: true,
    secureBoot: true,
    tpmActive: true,
    curveOptimizer: 'All-Core -20mV (Scalar 1X)',
    fclkMhz: 2000,
    expoEnabled: true
  },

  // Display & Peripherals
  display: {
    model: 'LG UltraGear 27GR95QE-B 27" OLED 240Hz',
    resolution: '1440p',
    refreshRateHz: 240,
    panelType: 'OLED',
    syncTechnology: 'G-Sync Compatible'
  },
  peripherals: {
    keyboard: 'Keychron Q1 Pro Wireless Custom Mechanical (Banana Switches)',
    mouse: 'Logitech G Pro X Superlight 2 Wireless',
    headsetAudio: 'Sennheiser HD 560S + FiiO K5 Pro ESS Desktop DAC/Amp',
    upsModel: 'APC Back-UPS Pro BR1100M-IN 1100VA / 660W',
    upsVa: 1100,
    upsBatteryMinutesGaming: 22
  },

  // Evaluated Scores
  scores: {
    performance: 94,
    thermals: 87,
    powerEfficiency: 91,
    upgradeability: 82,
    value: 89,
    compositeScore: 89
  }
};

export const PRESET_TWINS: DigitalTwinPC[] = [
  DEFAULT_DIGITAL_TWIN,
  {
    id: 'twin-titan-4k',
    name: 'Titan Apex // 4K Enthusiast Studio',
    tagline: 'Flagship Zen 5 3D V-Cache with Blackwell Ray Tracing Flagship',
    updatedAt: new Date().toISOString(),
    themeColor: '#8b5cf6', // Violet
    isPrimary: false,
    cpu: {
      model: 'AMD Ryzen 7 9800X3D',
      hardwareId: 'cpu-amd-9800x3d',
      coresThreads: '8 Cores / 16 Threads (2nd Gen 3D V-Cache)',
      socket: 'AM5',
      tdpWatts: 120,
      priceINR: 48999,
      purchaseDate: '2025-01-20',
      warrantyExpiry: '2028-01-20',
      retailStore: 'PrimeABGB Mumbai'
    },
    gpu: {
      model: 'NVIDIA GeForce RTX 4090 24GB',
      hardwareId: 'gpu-nvidia-4090',
      vramGb: 24,
      tgpWatts: 450,
      lengthMm: 336,
      priceINR: 195000,
      purchaseDate: '2024-06-10',
      warrantyExpiry: '2027-06-10',
      retailStore: 'Vedant Computers Kolkata'
    },
    motherboard: {
      model: 'ASUS ROG STRIX X670E-E GAMING WIFI',
      chipset: 'AMD X670E',
      formFactor: 'ATX',
      pcieVersion: 'PCIe 5.0 x16 + Dual PCIe 5.0 M.2',
      priceINR: 46999,
      purchaseDate: '2024-06-10',
      warrantyExpiry: '2027-06-10',
      retailStore: 'MDComputers Kolkata'
    },
    ram: {
      model: 'Corsair Dominator Titanium 64GB (2x32GB) DDR5-6000 CL30',
      capacityGb: 64,
      type: 'DDR5',
      speedMhz: 6000,
      timing: 'CL30-36-36-76',
      channels: 'Dual Channel',
      expoXmpProfile: 'EXPO I',
      priceINR: 24999,
      purchaseDate: '2024-06-10',
      warrantyExpiry: '2034-06-10',
      retailStore: 'PrimeABGB Mumbai'
    },
    storageDrives: [
      {
        id: 'drive-crucial-t700',
        type: 'Gen5 NVMe',
        model: 'Crucial T700 2TB PCIe 5.0 NVMe M.2 (12,400 MB/s)',
        capacityGb: 2048,
        usedGb: 980,
        readSpeedMBps: 12400,
        writeSpeedMBps: 11800,
        healthPercent: 100,
        priceINR: 28999,
        purchaseDate: '2024-06-10',
        warrantyExpiry: '2029-06-10'
      }
    ],
    psu: {
      model: 'Seasonic Vertex GX-1200 1200W ATX 3.0 80+ Gold',
      wattage: 1200,
      efficiencyRating: '80+ Gold',
      atxStandard: 'ATX 3.0',
      priceINR: 21999,
      purchaseDate: '2024-06-10',
      warrantyExpiry: '2034-06-10',
      retailStore: 'Vedant Computers Kolkata'
    },
    cabinet: {
      model: 'Lian Li O11 Dynamic EVO XL',
      caseModel: 'O11 Dynamic EVO XL',
      formFactor: 'Full-Tower',
      widthMm: 304,
      heightMm: 531,
      depthMm: 522,
      maxGpuLengthMm: 460,
      maxCoolerHeightMm: 167,
      priceINR: 23499,
      purchaseDate: '2024-06-10',
      warrantyExpiry: '2026-06-10',
      retailStore: 'PrimeABGB Mumbai'
    },
    cooling: {
      coolerModel: 'NZXT Kraken Elite 360 RGB AIO',
      coolerType: '360mm AIO',
      radiatorMount: 'Top',
      thermalPaste: 'Thermal Grizzly Kryonaut Extreme',
      pasteAppliedDate: '2025-01-20',
      fans: [
        { location: 'Bottom Intake', fanCount: 3, fanSizeMm: 140, rpm: 1200, direction: 'Intake' },
        { location: 'Side Intake', fanCount: 3, fanSizeMm: 140, rpm: 1200, direction: 'Intake' },
        { location: 'Top Exhaust', fanCount: 3, fanSizeMm: 120, rpm: 1500, direction: 'Exhaust' },
        { location: 'Rear Exhaust', fanCount: 1, fanSizeMm: 140, rpm: 1000, direction: 'Exhaust' }
      ],
      staticPressure: 'Positive'
    },
    telemetry: {
      ambientRoomTempC: 27,
      cpuIdleTempC: 37,
      cpuLoadTempC: 72,
      gpuIdleTempC: 34,
      gpuLoadTempC: 66,
      gpuHotspotTempC: 78,
      vramTempC: 72,
      totalPowerDrawLoadWatts: 680,
      totalPowerDrawIdleWatts: 92
    },
    bios: {
      biosVersion: 'ROG STRIX X670E 2403 AGESA 1.2.0.2',
      releaseDate: '2024-11-28',
      resizableBar: true,
      secureBoot: true,
      tpmActive: true,
      curveOptimizer: 'Negative 25 Per-Core',
      fclkMhz: 2133,
      expoEnabled: true
    },
    display: {
      model: 'Alienware AW3225QF 32" 4K QD-OLED 240Hz Curved',
      resolution: '4K',
      refreshRateHz: 240,
      panelType: 'OLED',
      syncTechnology: 'G-Sync Compatible'
    },
    peripherals: {
      keyboard: 'Wooting 60HE+ Analog Hall Effect',
      mouse: 'Razer Viper V3 Pro Wireless (8K Polling)',
      headsetAudio: 'Audeze Maxwell Wireless Audiophile Planar Magnetic',
      upsModel: 'APC Smart-UPS SMT1500I-IN 1500VA / 1000W Pure Sinewave',
      upsVa: 1500,
      upsBatteryMinutesGaming: 28
    },
    scores: {
      performance: 99,
      thermals: 89,
      powerEfficiency: 82,
      upgradeability: 96,
      value: 78,
      compositeScore: 92
    }
  },
  {
    id: 'twin-budget-esports',
    name: 'Ghost // Budget 1080p Esports',
    tagline: 'Value King 6-Core + 8GB High-Efficiency Esports Machine',
    updatedAt: new Date().toISOString(),
    themeColor: '#10b981', // Emerald
    isPrimary: false,
    cpu: {
      model: 'Intel Core i5-12400F',
      hardwareId: 'cpu-intel-12400f',
      coresThreads: '6 Cores / 12 Threads',
      socket: 'LGA 1700',
      tdpWatts: 65,
      priceINR: 9899,
      purchaseDate: '2023-08-14',
      warrantyExpiry: '2026-08-14',
      retailStore: 'MDComputers Kolkata'
    },
    gpu: {
      model: 'NVIDIA GeForce RTX 4060 8GB',
      hardwareId: 'gpu-nvidia-4060',
      vramGb: 8,
      tgpWatts: 115,
      lengthMm: 242,
      priceINR: 28499,
      purchaseDate: '2023-09-01',
      warrantyExpiry: '2026-09-01',
      retailStore: 'PrimeABGB Mumbai'
    },
    motherboard: {
      model: 'MSI PRO B760M-A WIFI DDR4',
      chipset: 'Intel B760',
      formFactor: 'Micro-ATX',
      pcieVersion: 'PCIe 4.0 x16',
      priceINR: 13299,
      purchaseDate: '2023-08-14',
      warrantyExpiry: '2026-08-14',
      retailStore: 'Amazon India'
    },
    ram: {
      model: 'Corsair Vengeance LPX 16GB (2x8GB) DDR4-3200 CL16',
      capacityGb: 16,
      type: 'DDR4',
      speedMhz: 3200,
      timing: 'CL16-20-20-38',
      channels: 'Dual Channel',
      expoXmpProfile: 'XMP 3.0',
      priceINR: 3499,
      purchaseDate: '2023-08-14',
      warrantyExpiry: '2033-08-14',
      retailStore: 'PrimeABGB Mumbai'
    },
    storageDrives: [
      {
        id: 'drive-crucial-p3',
        type: 'Gen4 NVMe',
        model: 'Crucial P3 1TB PCIe 3.0 NVMe M.2',
        capacityGb: 1024,
        usedGb: 680,
        readSpeedMBps: 3500,
        writeSpeedMBps: 3000,
        healthPercent: 96,
        priceINR: 4799,
        purchaseDate: '2023-08-14',
        warrantyExpiry: '2028-08-14'
      }
    ],
    psu: {
      model: 'DeepCool PK550D 550W 80+ Bronze',
      wattage: 550,
      efficiencyRating: '80+ Bronze',
      atxStandard: 'ATX 2.4',
      priceINR: 3499,
      purchaseDate: '2023-08-14',
      warrantyExpiry: '2028-08-14',
      retailStore: 'Vedant Computers Kolkata'
    },
    cabinet: {
      model: 'Ant Esports ICE-100 Air Mini',
      caseModel: 'ICE-100 Air Mini',
      formFactor: 'Mini-ITX',
      widthMm: 210,
      heightMm: 395,
      depthMm: 375,
      maxGpuLengthMm: 310,
      maxCoolerHeightMm: 160,
      priceINR: 3199,
      purchaseDate: '2023-08-14',
      warrantyExpiry: '2024-08-14',
      retailStore: 'Amazon India'
    },
    cooling: {
      coolerModel: 'DeepCool AG400 ARGB Single Tower',
      coolerType: 'Stock Air',
      radiatorMount: 'None',
      thermalPaste: 'Pre-applied Arctic Silver 5',
      pasteAppliedDate: '2023-08-14',
      fans: [
        { location: 'Front Intake', fanCount: 2, fanSizeMm: 120, rpm: 1200, direction: 'Intake' },
        { location: 'Rear Exhaust', fanCount: 1, fanSizeMm: 120, rpm: 1200, direction: 'Exhaust' }
      ],
      staticPressure: 'Positive'
    },
    telemetry: {
      ambientRoomTempC: 30,
      cpuIdleTempC: 39,
      cpuLoadTempC: 66,
      gpuIdleTempC: 36,
      gpuLoadTempC: 65,
      gpuHotspotTempC: 76,
      vramTempC: 68,
      totalPowerDrawLoadWatts: 245,
      totalPowerDrawIdleWatts: 48
    },
    bios: {
      biosVersion: '7D99v1B',
      releaseDate: '2024-05-12',
      resizableBar: true,
      secureBoot: true,
      tpmActive: true,
      curveOptimizer: 'Stock Default PL1=65W PL2=117W',
      fclkMhz: 1600,
      expoEnabled: true
    },
    display: {
      model: 'AOC 24G2SP 24" 1080p 165Hz Fast IPS',
      resolution: '1080p',
      refreshRateHz: 165,
      panelType: 'Fast IPS',
      syncTechnology: 'FreeSync Premium'
    },
    peripherals: {
      keyboard: 'Cosmic Byte CB-GK-16 Firefly Mechanical (Outemu Blue)',
      mouse: 'Razer DeathAdder Essential (6400 DPI)',
      headsetAudio: 'Razer BlackShark V2 X USB',
      upsModel: 'APC Back-UPS 600VA / 360W',
      upsVa: 600,
      upsBatteryMinutesGaming: 12
    },
    scores: {
      performance: 76,
      thermals: 88,
      powerEfficiency: 95,
      upgradeability: 64,
      value: 96,
      compositeScore: 82
    }
  }
];

const LOCAL_STORAGE_KEY = 'silicon_matrix_digital_twins_v2';
const ACTIVE_TWIN_ID_KEY = 'silicon_matrix_active_twin_id_v2';

export function loadSavedDigitalTwins(): DigitalTwinPC[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return PRESET_TWINS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return PRESET_TWINS;
  } catch (err) {
    console.warn('Failed to load digital twins from localStorage, using presets:', err);
    return PRESET_TWINS;
  }
}

export function saveDigitalTwins(twins: DigitalTwinPC[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(twins));
  } catch (err) {
    console.error('Failed to persist digital twins:', err);
  }
}

export function getActiveTwinId(): string {
  try {
    return localStorage.getItem(ACTIVE_TWIN_ID_KEY) || DEFAULT_DIGITAL_TWIN.id;
  } catch {
    return DEFAULT_DIGITAL_TWIN.id;
  }
}

export function setActiveTwinId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_TWIN_ID_KEY, id);
  } catch {
    // ignore
  }
}
