/**
 * Silicon Matrix IndexedDB Local Cache Manager
 * Provides fast client-side caching of CPU and GPU datasets with schema versioning.
 */

import { CPUItem, GPUItem } from '../types';

export const SILICON_CACHE_VERSION = '3.1.0';
const DB_NAME = 'silicon_matrix_store';
const STORE_NAME = 'hardware_cache';

interface CachePayload {
  version: string;
  timestamp: number;
  cpus: CPUItem[];
  gpus: GPUItem[];
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedHardware(): Promise<{ cpus: CPUItem[]; gpus: GPUItem[] } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get('dataset');

      request.onsuccess = () => {
        const data = request.result as CachePayload | undefined;
        if (data && data.version === SILICON_CACHE_VERSION) {
          resolve({ cpus: data.cpus, gpus: data.gpus });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedHardware(cpus: CPUItem[], gpus: GPUItem[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const payload: CachePayload = {
        version: SILICON_CACHE_VERSION,
        timestamp: Date.now(),
        cpus,
        gpus
      };

      const request = store.put(payload, 'dataset');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Non-blocking fallback
  }
}
