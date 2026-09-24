/**
 * "Anti-Scalper" & Indian Second-Hand Hardware Market Evaluator
 * Benchmarked against Indian enthusiast classifieds (Techenclave, Zoukart, IVG, and OLX).
 */

import { HardwareItem } from '../types';

export interface UsedMarketValuation {
  componentId: string;
  originalMrpINR: number;
  fairUsedMarketValueINR: number;
  depreciationPct: number;
  warrantyStatus: 'ACTIVE_WARRANTY' | 'EXPIRING_SOON' | 'EXPIRED';
  miningRiskFactor: 'HIGH' | 'MODERATE' | 'LOW';
  marketTierVerdict: 'VINTAGE_BUDGET' | 'SWEET_SPOT_VALUE' | 'ENTHUSIAST_CURRENT';
  buyingChecklist: string[];
}

export function evaluateUsedMarketPrice(item: HardwareItem): UsedMarketValuation {
  const currentYear = 2026;
  const ageYears = Math.max(0, currentYear - item.ReleaseYear);
  const originalPrice = item.Price_INR;

  // Depreciation Curve based on age
  let depreciationRate = 0;
  if (ageYears === 0) depreciationRate = 0.12;
  else if (ageYears === 1) depreciationRate = 0.22;
  else if (ageYears === 2) depreciationRate = 0.38;
  else if (ageYears === 3) depreciationRate = 0.52;
  else if (ageYears === 4) depreciationRate = 0.64;
  else depreciationRate = Math.min(0.85, 0.65 + (ageYears - 4) * 0.05);

  // Check mining boom risk (2020-2022 GPUs)
  const isMiningEraGpu =
    item.category === 'GPU' &&
    (item.Model.includes('3060') ||
      item.Model.includes('3070') ||
      item.Model.includes('3080') ||
      item.Model.includes('3090') ||
      item.Model.includes('580') ||
      item.Model.includes('5700'));

  const miningRiskFactor: UsedMarketValuation['miningRiskFactor'] = isMiningEraGpu
    ? 'HIGH'
    : ageYears > 3
    ? 'MODERATE'
    : 'LOW';

  if (isMiningEraGpu) {
    depreciationRate = Math.min(0.88, depreciationRate + 0.08); // Higher depreciation due to thermal pad degradation
  }

  // Calculate Fair Second-hand Value
  let fairUsedMarketValueINR = Math.round((originalPrice * (1 - depreciationRate)) / 500) * 500;

  // Minimum floor prices for working legacy hardware
  if (item.category === 'CPU') {
    fairUsedMarketValueINR = Math.max(fairUsedMarketValueINR, 2000);
  } else {
    fairUsedMarketValueINR = Math.max(fairUsedMarketValueINR, 3500);
  }

  // Warranty status (Indian standard brand warranty is typically 3 years)
  let warrantyStatus: UsedMarketValuation['warrantyStatus'] = 'EXPIRED';
  if (ageYears < 2) warrantyStatus = 'ACTIVE_WARRANTY';
  else if (ageYears <= 3) warrantyStatus = 'EXPIRING_SOON';

  // Market tier
  let marketTierVerdict: UsedMarketValuation['marketTierVerdict'] = 'SWEET_SPOT_VALUE';
  if (ageYears >= 5) marketTierVerdict = 'VINTAGE_BUDGET';
  else if (ageYears <= 1) marketTierVerdict = 'ENTHUSIAST_CURRENT';

  // Buying Checklist
  const checklist: string[] = [];
  checklist.push('Request original GST invoice for warranty transfer claim (vital in India).');
  if (item.category === 'GPU') {
    checklist.push('Run 15-minute FurMark stress test checking for memory artifacts & hotspot delta (<18°C).');
    if (miningRiskFactor === 'HIGH') {
      checklist.push('Inspect PCB backplate for oily thermal pad residue or yellowed VRAM solder balls.');
    }
  } else {
    checklist.push('Inspect LGA socket contact pads / AM4 pins for bent or burned gold traces.');
  }

  return {
    componentId: item.id,
    originalMrpINR: originalPrice,
    fairUsedMarketValueINR,
    depreciationPct: Math.round(depreciationRate * 100),
    warrantyStatus,
    miningRiskFactor,
    marketTierVerdict,
    buyingChecklist: checklist
  };
}

export function checkScalperIndex(
  fairPriceINR: number,
  askingPriceINR: number
): {
  verdict: 'SCALPED_OVERPRICED' | 'FAIR_MARKET' | 'EXCELLENT_DEAL';
  priceDeltaINR: number;
  percentageDiff: number;
  label: string;
} {
  const delta = askingPriceINR - fairPriceINR;
  const pct = Math.round((delta / fairPriceINR) * 100);

  if (pct > 18) {
    return {
      verdict: 'SCALPED_OVERPRICED',
      priceDeltaINR: delta,
      percentageDiff: pct,
      label: `⚠️ Scalped / Overpriced (+${pct}% over fair value)`
    };
  } else if (pct < -15) {
    return {
      verdict: 'EXCELLENT_DEAL',
      priceDeltaINR: delta,
      percentageDiff: pct,
      label: `🔥 Bargain Deal (${Math.abs(pct)}% below fair value)`
    };
  } else {
    return {
      verdict: 'FAIR_MARKET',
      priceDeltaINR: delta,
      percentageDiff: pct,
      label: `✅ Fair Market Price (${pct >= 0 ? '+' : ''}${pct}%)`
    };
  }
}
