export interface PSUItem {
  id: string;
  name: string;
  brand: string;
  wattage: number;
  efficiency: '80+ White' | '80+ Bronze' | '80+ Gold' | '80+ Platinum' | '80+ Titanium';
  modular: 'Non-Modular' | 'Semi-Modular' | 'Full Modular';
  atxStandard: 'ATX 2.4' | 'ATX 3.0' | 'ATX 3.1';
  pcieGen5: boolean;
  priceINR: number;
  tier: 'Tier A (Enthusiast / Flagship)' | 'Tier B (Mid-Range Reliable)' | 'Tier C (Entry-Level Budget)';
  warrantyYears: number;
  description: string;
}

export const POPULAR_INDIAN_PSUS: PSUItem[] = [
  {
    id: 'psu-deepcool-pk450d',
    name: 'Deepcool PK450D 450W',
    brand: 'Deepcool',
    wattage: 450,
    efficiency: '80+ Bronze',
    modular: 'Non-Modular',
    atxStandard: 'ATX 2.4',
    pcieGen5: false,
    priceINR: 2799,
    tier: 'Tier C (Entry-Level Budget)',
    warrantyYears: 5,
    description: 'Reliable entry-level Bronze power supply for sub-₹40k budget esports builds.'
  },
  {
    id: 'psu-cm-mwe550',
    name: 'Cooler Master MWE 550 V2 Bronze',
    brand: 'Cooler Master',
    wattage: 550,
    efficiency: '80+ Bronze',
    modular: 'Non-Modular',
    atxStandard: 'ATX 2.4',
    pcieGen5: false,
    priceINR: 4199,
    tier: 'Tier B (Mid-Range Reliable)',
    warrantyYears: 5,
    description: 'The standard mid-range value staple in Indian retail with DC-to-DC LLC topology.'
  },
  {
    id: 'psu-deepcool-pm650d',
    name: 'Deepcool PM650D 650W Gold',
    brand: 'Deepcool',
    wattage: 650,
    efficiency: '80+ Gold',
    modular: 'Non-Modular',
    atxStandard: 'ATX 2.4',
    pcieGen5: false,
    priceINR: 5499,
    tier: 'Tier B (Mid-Range Reliable)',
    warrantyYears: 5,
    description: 'Cost-effective 80+ Gold efficiency with flat black cables for mainstream 1080p/1440p rigs.'
  },
  {
    id: 'psu-corsair-rm750e',
    name: 'Corsair RM750e (2023) ATX 3.0',
    brand: 'Corsair',
    wattage: 750,
    efficiency: '80+ Gold',
    modular: 'Full Modular',
    atxStandard: 'ATX 3.0',
    pcieGen5: true,
    priceINR: 8999,
    tier: 'Tier A (Enthusiast / Flagship)',
    warrantyYears: 7,
    description: 'Full-modular ATX 3.0 certified PSU with dedicated 12VHPWR cable, low-noise fan curve, and 105°C capacitors.'
  },
  {
    id: 'psu-msi-mag-a850gl',
    name: 'MSI MAG A850GL PCIE5 850W',
    brand: 'MSI',
    wattage: 850,
    efficiency: '80+ Gold',
    modular: 'Full Modular',
    atxStandard: 'ATX 3.0',
    pcieGen5: true,
    priceINR: 10499,
    tier: 'Tier A (Enthusiast / Flagship)',
    warrantyYears: 7,
    description: 'PCIe 5.0 ready dual-color 12V-2x6 header designed to visually verify complete plug seating.'
  },
  {
    id: 'psu-corsair-rm1000x',
    name: 'Corsair RM1000x Shift ATX 3.0',
    brand: 'Corsair',
    wattage: 1000,
    efficiency: '80+ Gold',
    modular: 'Full Modular',
    atxStandard: 'ATX 3.0',
    pcieGen5: true,
    priceINR: 16999,
    tier: 'Tier A (Enthusiast / Flagship)',
    warrantyYears: 10,
    description: 'Side-mounted modular interface with Japanese 105°C caps, zero-RPM fan mode, and full 200% transient spike absorption.'
  },
  {
    id: 'psu-seasonic-vertex-gx1200',
    name: 'Seasonic Vertex GX-1200 ATX 3.0',
    brand: 'Seasonic',
    wattage: 1200,
    efficiency: '80+ Gold',
    modular: 'Full Modular',
    atxStandard: 'ATX 3.0',
    pcieGen5: true,
    priceINR: 23999,
    tier: 'Tier A (Enthusiast / Flagship)',
    warrantyYears: 10,
    description: 'Flagship engineering for RTX 4090 / high-power workstation overclocking with fluid dynamic bearing fan.'
  }
];

export interface PSUCompatibilityResult {
  totalWatts: number;
  psuWattage: number;
  loadPercentage: number;
  isOver80Percent: boolean;
  isOverloaded: boolean; // > 100%
  headroomWatts: number;
  maxContinuousSafeWatts: number; // 80% of capacity
  status: 'OPTIMAL' | 'WARNING_EXCEEDS_80' | 'CRITICAL_OVERLOAD';
  badgeLabel: string;
  summary: string;
  recommendation: string;
  recommendedPsuWatts: number;
}

/**
 * Validates total rig wattage against chosen PSU rated capacity.
 * Triggers warning if selected total wattage exceeds 80% of PSU rated capacity.
 */
export function evaluatePsuCompatibility(totalWatts: number, psuWattage: number): PSUCompatibilityResult {
  const loadPercentage = Math.round((totalWatts / psuWattage) * 1000) / 10; // 1 decimal place
  const maxContinuousSafeWatts = Math.round(psuWattage * 0.8);
  const headroomWatts = psuWattage - totalWatts;
  const isOverloaded = totalWatts > psuWattage;
  const isOver80Percent = totalWatts > maxContinuousSafeWatts;

  // Calculate standard recommended PSU tier (at least 35-40% headroom above peak wattage)
  const recommendedPsuWatts = Math.max(550, Math.ceil((totalWatts * 1.35) / 50) * 50);

  if (isOverloaded) {
    return {
      totalWatts,
      psuWattage,
      loadPercentage,
      isOver80Percent: true,
      isOverloaded: true,
      headroomWatts,
      maxContinuousSafeWatts,
      status: 'CRITICAL_OVERLOAD',
      badgeLabel: 'Critical Overload (>100%)',
      summary: `Total system power draw (~${totalWatts}W) exceeds 100% of your chosen ${psuWattage}W PSU rated capacity (${loadPercentage}% load).`,
      recommendation: `Your system will trigger PSU Over-Current (OCP) or Over-Power Protection (OPP) shutoffs during gaming spikes. Upgrade immediately to at least ${recommendedPsuWatts}W.`,
      recommendedPsuWatts
    };
  }

  if (isOver80Percent) {
    return {
      totalWatts,
      psuWattage,
      loadPercentage,
      isOver80Percent: true,
      isOverloaded: false,
      headroomWatts,
      maxContinuousSafeWatts,
      status: 'WARNING_EXCEEDS_80',
      badgeLabel: 'High Load Warning (>80%)',
      summary: `Total system wattage (~${totalWatts}W) is ${loadPercentage}% of your chosen ${psuWattage}W PSU, exceeding the 80% continuous safety limit (${maxContinuousSafeWatts}W max recommended).`,
      recommendation: `Running above 80% capacity lowers efficiency, increases capacitor heat & fan noise, and risks instability from sub-millisecond GPU transient power spikes. Upgrade to a ${recommendedPsuWatts}W unit.`,
      recommendedPsuWatts
    };
  }

  return {
    totalWatts,
    psuWattage,
    loadPercentage,
    isOver80Percent: false,
    isOverloaded: false,
    headroomWatts,
    maxContinuousSafeWatts,
    status: 'OPTIMAL',
    badgeLabel: 'Optimal Headroom (<80%)',
    summary: `Total power draw (~${totalWatts}W) runs at ${loadPercentage}% of your chosen ${psuWattage}W PSU, safely below the 80% continuous threshold (${maxContinuousSafeWatts}W).`,
    recommendation: `Healthy headroom of +${headroomWatts}W (${(100 - loadPercentage).toFixed(1)}% buffer) ensures peak 80+ Gold efficiency (50%–70% load sweet spot) and absorbs transient spikes smoothly.`,
    recommendedPsuWatts
  };
}
