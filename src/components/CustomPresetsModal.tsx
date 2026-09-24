import React, { useState, useEffect } from 'react';
import { SavedCustomPreset, CPUItem, GPUItem } from '../types';
import {
  getSavedCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  exportPresetsAsJSON,
  importPresetsFromJSON
} from '../utils/customPresetsStorage';
import { formatINR } from '../utils/formatters';
import {
  Bookmark,
  X,
  Plus,
  Trash2,
  FolderOpen,
  Download,
  Upload,
  Check,
  Cpu,
  Monitor,
  HardDrive,
  Zap,
  Box,
  Copy,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

interface CustomPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cpus: CPUItem[];
  gpus: GPUItem[];
  currentConfig: {
    cpuId: string;
    gpuId: string;
    ramCapacity: number;
    ramType: 'DDR4' | 'DDR5';
    storageCount: number;
    cooler: 'Air Cooler' | '240mm AIO' | '360mm AIO';
    cabinetId: string;
    psuId: string;
    totalBuildCostINR: number;
    totalWatts: number;
  };
  onLoadPreset: (preset: SavedCustomPreset) => void;
  onNotify: (msg: string) => void;
}

export const CustomPresetsModal: React.FC<CustomPresetsModalProps> = ({
  isOpen,
  onClose,
  cpus,
  gpus,
  currentConfig,
  onLoadPreset,
  onNotify
}) => {
  const [presets, setPresets] = useState<SavedCustomPreset[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetNotes, setNewPresetNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPresets(getSavedCustomPresets());
      setShowSaveForm(false);
      setShowImport(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCpu = cpus.find((c) => c.id === currentConfig.cpuId);
  const currentGpu = gpus.find((g) => g.id === currentConfig.gpuId);

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const saved = saveCustomPreset({
      name: newPresetName.trim(),
      cpuId: currentConfig.cpuId,
      gpuId: currentConfig.gpuId,
      ramCapacity: currentConfig.ramCapacity,
      ramType: currentConfig.ramType,
      storageCount: currentConfig.storageCount,
      cooler: currentConfig.cooler,
      cabinetId: currentConfig.cabinetId,
      psuId: currentConfig.psuId,
      totalBuildCostINR: currentConfig.totalBuildCostINR,
      totalWatts: currentConfig.totalWatts,
      notes: newPresetNotes.trim() || undefined
    });

    setPresets(getSavedCustomPresets());
    setShowSaveForm(false);
    setNewPresetName('');
    setNewPresetNotes('');
    onNotify(`Saved build preset "${saved.name}" to localStorage!`);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete preset "${name}"?`)) {
      const updated = deleteCustomPreset(id);
      setPresets(updated);
      onNotify(`Deleted preset "${name}".`);
    }
  };

  const handleExport = () => {
    const json = exportPresetsAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silicon-matrix-presets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Exported presets as JSON backup!');
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = importPresetsFromJSON(importText);
      setPresets(updated);
      setShowImport(false);
      setImportText('');
      onNotify('Successfully imported presets from JSON!');
    } catch {
      alert('Invalid JSON preset format. Please verify the copied structure.');
    }
  };

  const copyConfigDetails = (preset: SavedCustomPreset) => {
    const cpu = cpus.find((c) => c.id === preset.cpuId)?.Model || preset.cpuId;
    const gpu = gpus.find((g) => g.id === preset.gpuId)?.Model || preset.gpuId;
    const text = `🖥️ [Silicon Matrix Rig Preset: ${preset.name}]\n- CPU: ${cpu}\n- GPU: ${gpu}\n- RAM: ${preset.ramCapacity}GB ${preset.ramType}\n- Cooler: ${preset.cooler}\n- Estimated Power: ${preset.totalWatts}W\n- Approx Cost: ${formatINR(preset.totalBuildCostINR)}\n${preset.notes ? `- Notes: ${preset.notes}\n` : ''}`;

    navigator.clipboard.writeText(text);
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId(null), 2500);
    onNotify(`Copied spec sheet for "${preset.name}" to clipboard!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Custom Component Presets
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/80 text-cyan-400">
                  localStorage
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Save, load, and manage your personalized custom build configurations offline in browser storage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-zinc-900/30 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveForm((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showSaveForm ? 'Cancel Save' : 'Save Current Build'}</span>
            </button>
            <span className="text-xs text-zinc-500 font-mono">
              ({presets.length} preset{presets.length !== 1 ? 's' : ''} stored)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              title="Download your presets as JSON file"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => setShowImport((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              title="Import presets from JSON"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* Form to Save Current Config */}
        {showSaveForm && (
          <form
            onSubmit={handleSaveCurrent}
            className="p-5 bg-cyan-950/20 border-b border-cyan-900/40 space-y-3 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Save Active Build as Preset
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {currentCpu?.Model.slice(0, 18)} + {currentGpu?.Model.slice(0, 18)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-300 font-medium mb-1">
                  Preset Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My 1440p White Lian Li Battlestation"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 font-medium mb-1">
                  Notes or Purpose (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Optimized for Premiere Pro 4K + CS2 high FPS"
                  value={newPresetNotes}
                  onChange={(e) => setNewPresetNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm & Save to Storage
              </button>
            </div>
          </form>
        )}

        {/* Import JSON Drawer */}
        {showImport && (
          <form
            onSubmit={handleImportSubmit}
            className="p-5 bg-zinc-900/80 border-b border-zinc-800 space-y-3"
          >
            <label className="block text-xs text-zinc-300 font-medium">
              Paste JSON Presets Array
            </label>
            <textarea
              rows={4}
              required
              placeholder='[ { "id": "...", "name": "...", "cpuId": "...", ... } ]'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold"
              >
                Import Presets
              </button>
            </div>
          </form>
        )}

        {/* Preset List Container */}
        <div className="flex-1 p-6 overflow-y-auto divide-y divide-zinc-800/80 space-y-4">
          {presets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FolderOpen className="w-12 h-12 mx-auto text-zinc-600 stroke-[1.5]" />
              <p className="text-sm text-zinc-400 font-medium">No custom presets saved yet.</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Configure your preferred CPU, GPU, and parts in Rig Architect, then click &ldquo;Save Current Build&rdquo; to store it.
              </p>
            </div>
          ) : (
            presets.map((preset) => {
              const cpu = cpus.find((c) => c.id === preset.cpuId);
              const gpu = gpus.find((g) => g.id === preset.gpuId);

              return (
                <div
                  key={preset.id}
                  className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(preset.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 font-bold">
                        {formatINR(preset.totalBuildCostINR)}
                      </span>
                    </div>

                    {/* Spec tags */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="flex items-center gap-1 font-mono text-zinc-300">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        {cpu ? cpu.Model : preset.cpuId}
                      </span>
                      <span className="text-zinc-600">&bull;</span>
                      <span className="flex items-center gap-1 font-mono text-zinc-300">
                        <Monitor className="w-3 h-3 text-purple-400" />
                        {gpu ? gpu.Model : preset.gpuId}
                      </span>
                      <span className="text-zinc-600">&bull;</span>
                      <span className="font-mono text-zinc-400">
                        {preset.ramCapacity}GB {preset.ramType}
                      </span>
                      <span className="text-zinc-600">&bull;</span>
                      <span className="font-mono text-zinc-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        ~{preset.totalWatts}W
                      </span>
                    </div>

                    {preset.notes && (
                      <p className="text-xs text-zinc-500 italic flex items-center gap-1">
                        <Info className="w-3 h-3 shrink-0 text-zinc-600" />
                        {preset.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyConfigDetails(preset)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy spec sheet to clipboard"
                    >
                      {copiedId === preset.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(preset.id, preset.name)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800/60 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete this saved preset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onLoadPreset(preset);
                        onClose();
                        onNotify(`Loaded custom preset: "${preset.name}"!`);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Load into Rig</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-500">
          <span>Presets are securely retained across browser sessions.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
