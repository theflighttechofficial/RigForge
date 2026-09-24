import { SavedCustomPreset } from '../types';

const STORAGE_KEY = 'silicon_matrix_user_custom_presets_v1';

// Starter default templates to inspire users on their first visit
const DEFAULT_STARTER_PRESETS: SavedCustomPreset[] = [
  {
    id: 'starter-zen5-rtx5080',
    name: 'Esports God-Tier (9800X3D + RTX 5080)',
    createdAt: Date.now() - 86400000 * 2,
    cpuId: 'cpu-amd-9800x3d',
    gpuId: 'gpu-nvidia-5080',
    ramCapacity: 32,
    ramType: 'DDR5',
    storageCount: 2,
    cooler: '360mm AIO',
    cabinetId: 'cab-lianli-o11d-evo',
    psuId: 'psu-corsair-rm850x-shift',
    totalBuildCostINR: 289999,
    totalWatts: 615,
    notes: 'Sub-CCD 3D V-Cache paired with 32 Gbps GDDR7 memory. Configured for 1440p 360Hz esports and 4K Path Tracing.'
  },
  {
    id: 'starter-pure-value-1440p',
    name: '1440p Pure Value Sleeper (5700X3D + 7800 XT)',
    createdAt: Date.now() - 86400000 * 5,
    cpuId: 'cpu-amd-5700x3d',
    gpuId: 'gpu-amd-7800xt',
    ramCapacity: 32,
    ramType: 'DDR4',
    storageCount: 1,
    cooler: 'Air Cooler',
    cabinetId: 'cab-deepcool-ch560',
    psuId: 'psu-deepcool-pm750d',
    totalBuildCostINR: 114999,
    totalWatts: 475,
    notes: 'Maximum FPS per Indian Rupee spent with 16GB VRAM and AM4 drop-in affordability.'
  }
];

export function getSavedCustomPresets(): SavedCustomPreset[] {
  if (typeof window === 'undefined') return DEFAULT_STARTER_PRESETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed initial starter presets
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STARTER_PRESETS));
      return DEFAULT_STARTER_PRESETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_STARTER_PRESETS;
  } catch (err) {
    console.warn('Failed to parse saved custom presets from localStorage:', err);
    return DEFAULT_STARTER_PRESETS;
  }
}

export function saveCustomPreset(presetData: Omit<SavedCustomPreset, 'id' | 'createdAt'>): SavedCustomPreset {
  const all = getSavedCustomPresets();
  const newPreset: SavedCustomPreset = {
    ...presetData,
    id: 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    createdAt: Date.now()
  };
  const updated = [newPreset, ...all];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom preset to localStorage:', err);
  }
  return newPreset;
}

export function updateCustomPreset(preset: SavedCustomPreset): SavedCustomPreset[] {
  const all = getSavedCustomPresets();
  const index = all.findIndex((p) => p.id === preset.id);
  if (index >= 0) {
    all[index] = preset;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      console.error('Failed to update custom preset in localStorage:', err);
    }
  }
  return all;
}

export function deleteCustomPreset(id: string): SavedCustomPreset[] {
  const all = getSavedCustomPresets();
  const filtered = all.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete custom preset from localStorage:', err);
  }
  return filtered;
}

export function exportPresetsAsJSON(): string {
  const all = getSavedCustomPresets();
  return JSON.stringify(all, null, 2);
}

export function importPresetsFromJSON(jsonStr: string): SavedCustomPreset[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch (err) {
    throw new Error('Invalid JSON format for custom presets');
  }
  return getSavedCustomPresets();
}
