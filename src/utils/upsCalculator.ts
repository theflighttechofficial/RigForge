/**
 * Indian Inverter & UPS Backup Runtime Calculator
 * Computes battery backup duration under full gaming load vs idle desktop load,
 * detecting instant overload trip hazards.
 */

export interface UpsPreset {
  id: string;
  name: string;
  va: number;
  maxWatts: number;
  batteryWh: number; // Watt-hours of internal or external battery
  batteryType: string;
  typicalCostINR: number;
  recommendedBrands: string[];
}

export const INDIAN_UPS_PRESETS: UpsPreset[] = [
  {
    id: 'ups-600va',
    name: '600 VA / 360W (Entry Home UPS)',
    va: 600,
    maxWatts: 360,
    batteryWh: 84, // 1x 12V 7Ah
    batteryType: '1x 12V 7Ah Lead-Acid (Internal)',
    typicalCostINR: 2899,
    recommendedBrands: ['APC Back-UPS BX600C-IN', 'Microtek Legend 650', 'Frontech 725VA']
  },
  {
    id: 'ups-1100va',
    name: '1100 VA / 660W (Mid-Tier Gaming UPS)',
    va: 1100,
    maxWatts: 660,
    batteryWh: 168, // 2x 12V 7Ah
    batteryType: '2x 12V 7Ah Lead-Acid (Internal)',
    typicalCostINR: 6499,
    recommendedBrands: ['APC Back-UPS BX1100C-IN', 'CyberPower BU1000EA', 'Artis 1000VA']
  },
  {
    id: 'ups-1500va',
    name: '1500 VA / 900W (Performance Enthusiast UPS)',
    va: 1500,
    maxWatts: 900,
    batteryWh: 216, // 2x 12V 9Ah
    batteryType: '2x 12V 9Ah High-Rate VRLA',
    typicalCostINR: 11499,
    recommendedBrands: ['APC Back-UPS Pro BR1500G-IN', 'CyberPower CP1500EPFCLCD']
  },
  {
    id: 'inverter-150ah',
    name: 'Home Inverter + 150Ah Tubular Battery',
    va: 1000,
    maxWatts: 800,
    batteryWh: 1440, // 12V * 150Ah * 0.8 DoD = ~1440Wh usable
    batteryType: '12V 150Ah Tall Tubular Lead-Acid (External)',
    typicalCostINR: 18500,
    recommendedBrands: ['Luminous Zelio+ 1100', 'Microtek Luxe 1050 Pure Sine Wave', 'Exide Tubeler']
  }
];

export interface UpsCalculationResult {
  upsName: string;
  upsMaxWatts: number;
  gamingLoadWatts: number;
  idleLoadWatts: number;
  isGamingOverloaded: boolean;
  isIdleOverloaded: boolean;
  gamingRuntimeMinutes: number;
  idleRuntimeMinutes: number;
  minimumRecommendedVA: number;
  verdict: 'SAFE_RUN' | 'TIGHT_BUFFER' | 'CRITICAL_OVERLOAD';
  adviceMessage: string;
}

export function calculateUpsRuntime(
  gamingWatts: number,
  selectedPreset: UpsPreset
): UpsCalculationResult {
  const idleLoadWatts = 95; // Base monitor + idling motherboard & GPU
  const actualGamingLoad = gamingWatts + 45; // Include gaming monitor (~45W)

  const isGamingOverloaded = actualGamingLoad > selectedPreset.maxWatts;
  const isIdleOverloaded = idleLoadWatts > selectedPreset.maxWatts;

  // Inverter DC-to-AC conversion efficiency ~82%
  const efficiency = 0.82;
  const usableWh = selectedPreset.batteryWh * efficiency;

  let gamingRuntimeMinutes = 0;
  if (!isGamingOverloaded) {
    // Battery discharge rate in minutes
    gamingRuntimeMinutes = Math.max(1, Math.round((usableWh / actualGamingLoad) * 60));
  }

  let idleRuntimeMinutes = 0;
  if (!isIdleOverloaded) {
    idleRuntimeMinutes = Math.max(1, Math.round((usableWh / idleLoadWatts) * 60));
  }

  // Determine minimum recommended VA
  let minimumRecommendedVA = 600;
  if (actualGamingLoad > 850) minimumRecommendedVA = 1500;
  else if (actualGamingLoad > 550) minimumRecommendedVA = 1100;
  else if (actualGamingLoad > 320) minimumRecommendedVA = 1100;

  let verdict: UpsCalculationResult['verdict'] = 'SAFE_RUN';
  let adviceMessage = '';

  if (isGamingOverloaded) {
    verdict = 'CRITICAL_OVERLOAD';
    adviceMessage = `CRITICAL OVERLOAD: Your gaming power draw (${actualGamingLoad}W including monitor) exceeds the ${selectedPreset.name} inverter limit (${selectedPreset.maxWatts}W). During a power outage in-game, this UPS will trip immediately within 2-3 seconds with a continuous beep!`;
  } else if (gamingRuntimeMinutes < 6) {
    verdict = 'TIGHT_BUFFER';
    adviceMessage = `Emergency Buffer: You have approximately ${gamingRuntimeMinutes} minutes to save your game and safely shut down Windows during a power cut.`;
  } else {
    verdict = 'SAFE_RUN';
    adviceMessage = `Comfortable Backup: Provides ~${gamingRuntimeMinutes} minutes of uninterrupted gaming or up to ${Math.floor(idleRuntimeMinutes / 60)}h ${idleRuntimeMinutes % 60}m of desktop/coding work.`;
  }

  return {
    upsName: selectedPreset.name,
    upsMaxWatts: selectedPreset.maxWatts,
    gamingLoadWatts: actualGamingLoad,
    idleLoadWatts,
    isGamingOverloaded,
    isIdleOverloaded,
    gamingRuntimeMinutes,
    idleRuntimeMinutes,
    minimumRecommendedVA,
    verdict,
    adviceMessage
  };
}
