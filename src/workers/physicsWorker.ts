/**
 * Web Worker for Offloading Complex Physics, Pareto Frontiers & Thermal Runaway Simulations
 * Keeps UI thread locked at 60+ FPS during heavy computations.
 */

export interface WorkerMessageRequest {
  id: string;
  type: 'CALCULATE_PARETO_FRONTIER' | 'SIMULATE_THERMAL_RUNAWAY_BATCH';
  payload: any;
}

export interface WorkerMessageResponse {
  id: string;
  type: string;
  result: any;
  error?: string;
}

self.onmessage = (e: MessageEvent<WorkerMessageRequest>) => {
  const { id, type, payload } = e.data;

  try {
    if (type === 'CALCULATE_PARETO_FRONTIER') {
      const { items, workload } = payload;
      if (!items || items.length === 0) {
        self.postMessage({ id, type, result: { curve: [], paretoIds: [] } });
        return;
      }

      // 1. Sort by price
      const sorted = [...items].sort((a, b) => a.Price_INR - b.Price_INR);
      const minPrice = sorted[0].Price_INR;
      const maxPrice = sorted[sorted.length - 1].Price_INR;

      // 2. Identify true non-dominated Pareto items (Skyline query)
      const paretoIds: string[] = [];
      let maxScoreSoFar = -Infinity;

      for (const item of sorted) {
        // Approximate workload score
        let score = item.Benchmark_Score;
        if (workload === 'gaming' && item.Gaming_Score) score = item.Gaming_Score;
        else if (workload === 'productivity' && item.MultiCore_Score) score = item.MultiCore_Score;
        else if (workload === 'productivity' && item.Compute_Score) score = item.Compute_Score;

        if (score > maxScoreSoFar) {
          paretoIds.push(item.id);
          maxScoreSoFar = score;
        }
      }

      // 3. Mathematical frontier regression curve
      const points: { x: number; y: number }[] = [];
      const steps = 30;
      const priceStep = Math.max((maxPrice - minPrice) / steps, 100);
      const baseScore = sorted[0].Gaming_Score || sorted[0].Benchmark_Score;

      for (let i = 0; i <= steps; i++) {
        const p = minPrice + i * priceStep;
        const norm = p / Math.max(minPrice, 1);
        const curveScore = baseScore * 0.9 + Math.pow(norm, 0.73) * (baseScore * 1.08);
        points.push({ x: Math.round(p), y: Math.round(curveScore) });
      }

      self.postMessage({
        id,
        type,
        result: {
          curve: points,
          paretoIds
        }
      });
    } else if (type === 'SIMULATE_THERMAL_RUNAWAY_BATCH') {
      const { baseTdp, targetTemp, tjMax, ambientTempC, coolingCondition, voltageDeficitMv, psuTier, leakageMultiplier } = payload;
      const seconds = 15;
      const trajectory = [];
      let currentTemp = 42 + (ambientTempC - 25);
      let cumulativeErrors = 0;

      for (let s = 1; s <= seconds; s++) {
        const stepRate = coolingCondition === 'pump_failure' ? 6.5 : 2.5;
        currentTemp = Math.min(targetTemp, currentTemp + stepRate);

        let errThisSec = 0;
        if (voltageDeficitMv > 0) errThisSec += Math.floor(Math.random() * 3) + 1;
        if (currentTemp > tjMax - 3) errThisSec += Math.floor(Math.random() * 4) + 1;
        if (psuTier === 'degraded' && s % 4 === 0) errThisSec += 2;

        cumulativeErrors += errThisSec;
        const powerW = Math.round(baseTdp * (currentTemp > 85 ? leakageMultiplier : 1.0));

        trajectory.push({
          second: s,
          tempC: Math.round(currentTemp),
          powerW,
          errors: cumulativeErrors
        });
      }

      self.postMessage({
        id,
        type,
        result: trajectory
      });
    }
  } catch (err: any) {
    self.postMessage({ id, type, error: err?.message || 'Worker processing error' });
  }
};
