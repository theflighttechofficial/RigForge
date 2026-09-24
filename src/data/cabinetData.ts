/**
 * Indian Market PC Cabinets with Internal Physical Clearances
 */

export interface CabinetSpecs {
  id: string;
  name: string;
  brand: string;
  formFactor: 'Mid-Tower' | 'Micro-ATX' | 'Full-Tower';
  maxGpuLengthMm: number;
  maxCpuCoolerHeightMm: number;
  topRadiatorSupportMm: number; // 0, 240, 280, 360
  frontRadiatorSupportMm: number; // 240, 280, 360, 420
  topRadiatorMaxRamHeightMm: number; // Max RAM heatsink height before radiator fan collides
  priceINR: number;
  description: string;
}

export const POPULAR_INDIAN_CABINETS: CabinetSpecs[] = [
  {
    id: 'cab-corsair-4000d',
    name: 'Corsair 4000D Airflow',
    brand: 'Corsair',
    formFactor: 'Mid-Tower',
    maxGpuLengthMm: 360,
    maxCpuCoolerHeightMm: 170,
    topRadiatorSupportMm: 240, // 280 fits only with low profile RAM (<35mm), 360 does not fit top!
    frontRadiatorSupportMm: 360,
    topRadiatorMaxRamHeightMm: 38,
    priceINR: 6499,
    description: 'Bestselling high-airflow chassis in India. Top mounting 280mm requires low-profile RAM.'
  },
  {
    id: 'cab-montech-air903',
    name: 'Montech Air 903 Max',
    brand: 'Montech',
    formFactor: 'Mid-Tower',
    maxGpuLengthMm: 400,
    maxCpuCoolerHeightMm: 180,
    topRadiatorSupportMm: 360,
    frontRadiatorSupportMm: 360,
    topRadiatorMaxRamHeightMm: 45,
    priceINR: 5999,
    description: 'Enthusiast mid-tower with massive GPU and top 360mm radiator clearance.'
  },
  {
    id: 'cab-deepcool-cc560',
    name: 'Deepcool CC560 V2',
    brand: 'Deepcool',
    formFactor: 'Mid-Tower',
    maxGpuLengthMm: 370,
    maxCpuCoolerHeightMm: 163,
    topRadiatorSupportMm: 240,
    frontRadiatorSupportMm: 360,
    topRadiatorMaxRamHeightMm: 36,
    priceINR: 3999,
    description: 'Popular budget Indian mid-tower with 4 pre-installed LED fans. Top 240 only.'
  },
  {
    id: 'cab-ant-ice511mt',
    name: 'Ant Esports ICE-511MT',
    brand: 'Ant Esports',
    formFactor: 'Mid-Tower',
    maxGpuLengthMm: 330,
    maxCpuCoolerHeightMm: 155,
    topRadiatorSupportMm: 240,
    frontRadiatorSupportMm: 360,
    topRadiatorMaxRamHeightMm: 34,
    priceINR: 3499,
    description: 'Extreme value domestic chassis. Triple-fan long GPUs (>330mm) will hit front chassis frame!'
  },
  {
    id: 'cab-lianli-o11d',
    name: 'Lian Li O11 Dynamic EVO',
    brand: 'Lian Li',
    formFactor: 'Mid-Tower',
    maxGpuLengthMm: 426,
    maxCpuCoolerHeightMm: 167,
    topRadiatorSupportMm: 360,
    frontRadiatorSupportMm: 360,
    topRadiatorMaxRamHeightMm: 52,
    priceINR: 13999,
    description: 'Dual-chamber showpiece. Wide clearance accommodates top 360mm AIO with tall RGB RAM.'
  },
  {
    id: 'cab-nzxt-h5flow',
    name: 'NZXT H5 Flow RGB',
    brand: 'NZXT',
    formFactor: 'Mid-Tower',
    maxGpuLengthMm: 365,
    maxCpuCoolerHeightMm: 165,
    topRadiatorSupportMm: 240,
    frontRadiatorSupportMm: 280,
    topRadiatorMaxRamHeightMm: 38,
    priceINR: 7999,
    description: 'Clean aesthetic with bottom dedicated GPU fan duct. Top supports up to 240mm only.'
  }
];

export interface ClearanceValidationResult {
  isGpuFit: boolean;
  gpuMarginMm: number;
  gpuStatus: 'CLEARED' | 'TIGHT' | 'COLLISION';
  isRadiatorFit: boolean;
  radiatorStatus: 'CLEARED' | 'FRONT_ONLY' | 'INCOMPATIBLE';
  isRamRadiatorFit: boolean;
  ramClearanceStatus: 'CLEARED' | 'WARNING_TIGHT' | 'COLLISION';
  overallCleared: boolean;
  clearanceWarnings: string[];
}

export function validateCabinetClearances(
  cabinet: CabinetSpecs,
  gpuLengthMm: number,
  coolerType: 'Stock' | 'Tower Air' | '240mm AIO' | '360mm AIO',
  coolerHeightMm: number,
  ramProfile: 'Low-Profile (33mm)' | 'Standard (42mm)' | 'High-Profile RGB (52mm)'
): ClearanceValidationResult {
  const warnings: string[] = [];
  const ramHeightMm = ramProfile.includes('33mm') ? 33 : ramProfile.includes('42mm') ? 42 : 52;

  // 1. GPU Length check
  const gpuMarginMm = cabinet.maxGpuLengthMm - gpuLengthMm;
  let isGpuFit = true;
  let gpuStatus: ClearanceValidationResult['gpuStatus'] = 'CLEARED';

  if (gpuMarginMm < 0) {
    isGpuFit = false;
    gpuStatus = 'COLLISION';
    warnings.push(`GPU Length (${gpuLengthMm}mm) exceeds ${cabinet.name} maximum limit (${cabinet.maxGpuLengthMm}mm) by ${Math.abs(gpuMarginMm)}mm. GPU will hit front intake fans or cabinet framework!`);
  } else if (gpuMarginMm < 15) {
    gpuStatus = 'TIGHT';
    warnings.push(`Extremely tight GPU clearance (${gpuMarginMm}mm remaining). Cable management and front AIO mounting may be blocked.`);
  }

  // 2. Cooler / Radiator fitment
  let isRadiatorFit = true;
  let radiatorStatus: ClearanceValidationResult['radiatorStatus'] = 'CLEARED';

  if (coolerType === 'Tower Air') {
    if (coolerHeightMm > cabinet.maxCpuCoolerHeightMm) {
      isRadiatorFit = false;
      radiatorStatus = 'INCOMPATIBLE';
      warnings.push(`Tower Air Cooler height (${coolerHeightMm}mm) exceeds side panel clearance (${cabinet.maxCpuCoolerHeightMm}mm). Glass panel will not close!`);
    }
  } else if (coolerType === '360mm AIO') {
    if (cabinet.topRadiatorSupportMm < 360) {
      if (cabinet.frontRadiatorSupportMm >= 360) {
        radiatorStatus = 'FRONT_ONLY';
        warnings.push(`360mm AIO cannot be mounted on TOP in ${cabinet.name} (max top is ${cabinet.topRadiatorSupportMm}mm). Must be mounted at the FRONT, reducing available GPU clearance!`);
      } else {
        isRadiatorFit = false;
        radiatorStatus = 'INCOMPATIBLE';
        warnings.push(`360mm AIO is completely unsupported in ${cabinet.name}. Consider a 240mm AIO or dual tower air cooler.`);
      }
    }
  }

  // 3. Top Radiator vs RAM Heatsink Clearance
  let isRamRadiatorFit = true;
  let ramClearanceStatus: ClearanceValidationResult['ramClearanceStatus'] = 'CLEARED';

  if (coolerType.includes('AIO') && cabinet.topRadiatorSupportMm >= 240) {
    if (ramHeightMm > cabinet.topRadiatorMaxRamHeightMm) {
      isRamRadiatorFit = false;
      ramClearanceStatus = 'COLLISION';
      warnings.push(`Top radiator fans will physically collide with ${ramProfile} heatsinks (Max clearance above motherboard is ${cabinet.topRadiatorMaxRamHeightMm}mm, RAM is ${ramHeightMm}mm). Switch to Low-Profile RAM (like Corsair LPX) or front-mount radiator.`);
    } else if (cabinet.topRadiatorMaxRamHeightMm - ramHeightMm <= 3) {
      ramClearanceStatus = 'WARNING_TIGHT';
      warnings.push(`Top radiator is within 2-3mm of RAM heatspreaders. Installation requires installing RAM before mounting the radiator.`);
    }
  }

  const overallCleared = isGpuFit && isRadiatorFit && isRamRadiatorFit;

  return {
    isGpuFit,
    gpuMarginMm,
    gpuStatus,
    isRadiatorFit,
    radiatorStatus,
    isRamRadiatorFit,
    ramClearanceStatus,
    overallCleared,
    clearanceWarnings: warnings
  };
}
