/**
 * Worker Manager
 * Provides a resilient API to offload Pareto frontier and thermal physics to Web Workers,
 * falling back gracefully to the main thread if needed.
 */

import { HardwareItem, WorkloadProfile } from '../types';
import { calculateParetoCurve } from './formatters';

let workerInstance: Worker | null = null;
let messageIdCounter = 0;
const pendingCallbacks = new Map<string, (res: any) => void>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;

  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('../workers/physicsWorker.ts', import.meta.url), {
        type: 'module'
      });

      workerInstance.onmessage = (e) => {
        const { id, result, error } = e.data;
        const callback = pendingCallbacks.get(id);
        if (callback) {
          pendingCallbacks.delete(id);
          callback(error ? null : result);
        }
      };

      workerInstance.onerror = () => {
        workerInstance = null;
      };
    } catch {
      workerInstance = null;
    }
  }

  return workerInstance;
}

export function computeParetoFrontierAsync(
  items: HardwareItem[],
  workload: WorkloadProfile
): Promise<{ curve: { x: number; y: number }[]; paretoIds: string[] }> {
  return new Promise((resolve) => {
    const worker = getWorker();
    if (!worker) {
      // Fallback on main thread
      const curve = calculateParetoCurve(items, workload);
      const sorted = [...items].sort((a, b) => a.Price_INR - b.Price_INR);
      const paretoIds: string[] = [];
      let maxScore = -Infinity;
      for (const it of sorted) {
        const sc = it.Gaming_Score || it.Benchmark_Score;
        if (sc > maxScore) {
          paretoIds.push(it.id);
          maxScore = sc;
        }
      }
      resolve({ curve, paretoIds });
      return;
    }

    const msgId = `msg-${++messageIdCounter}`;
    pendingCallbacks.set(msgId, (result) => {
      if (result) {
        resolve(result);
      } else {
        // Fallback
        const curve = calculateParetoCurve(items, workload);
        resolve({ curve, paretoIds: [] });
      }
    });

    worker.postMessage({
      id: msgId,
      type: 'CALCULATE_PARETO_FRONTIER',
      payload: { items, workload }
    });
  });
}

export function simulateThermalRunawayAsync(payload: {
  baseTdp: number;
  targetTemp: number;
  tjMax: number;
  ambientTempC: number;
  coolingCondition: string;
  voltageDeficitMv: number;
  psuTier: string;
  leakageMultiplier: number;
}): Promise<any[]> {
  return new Promise((resolve) => {
    const worker = getWorker();
    if (!worker) {
      resolve([]);
      return;
    }

    const msgId = `msg-thermal-${++messageIdCounter}`;
    pendingCallbacks.set(msgId, (result) => {
      resolve(result || []);
    });

    worker.postMessage({
      id: msgId,
      type: 'SIMULATE_THERMAL_RUNAWAY_BATCH',
      payload
    });
  });
}
