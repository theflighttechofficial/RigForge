import React, { useState, useMemo, useEffect } from 'react';
import { CPUItem, GPUItem } from '../types';
import { formatINR } from '../utils/formatters';
import { budgetPresets } from '../data/presetData';
import {
  Wrench,
  Zap,
  Cpu,
  Monitor,
  HardDrive,
  Fan,
  ShieldCheck,
  Copy,
  Check,
  IndianRupee,
  Layers,
  Sparkles,
  Sliders,
  Store,
  ExternalLink,
  RefreshCw,
  Box,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Info,
  HelpCircle,
  Bookmark,
  Plus
} from 'lucide-react';
import { VisualChassisSimulator } from './VisualChassisSimulator';
import { fetchLiveIndianRetailerQuotes, LivePriceFeed } from '../utils/liveRetailerPricing';
import { POPULAR_INDIAN_CABINETS, validateCabinetClearances, CabinetSpecs } from '../data/cabinetData';
import { POPULAR_INDIAN_PSUS, evaluatePsuCompatibility, PSUItem } from '../data/psuData';
import { PowerConsumptionChart } from './PowerConsumptionChart';
import { VramAndThermalAdvisor } from './VramAndThermalAdvisor';
import { CustomPresetsModal } from './CustomPresetsModal';
import { SavedCustomPreset } from '../types';

interface RigArchitectProps {
  cpus: CPUItem[];
  gpus: GPUItem[];
  defaultCpuId?: string;
  defaultGpuId?: string;
  selectedPresetId?: string;
  onOpenBenchmarks?: () => void;
}

export const RigArchitect: React.FC<RigArchitectProps> = ({
  cpus,
  gpus,
  defaultCpuId = 'cpu-amd-7800x3d',
  defaultGpuId = 'gpu-nvidia-4070-super',
  selectedPresetId,
  onOpenBenchmarks
}) => {
  const [cpuId, setCpuId] = useState<string>(defaultCpuId);
  const [gpuId, setGpuId] = useState<string>(defaultGpuId);
  const [ramType, setRamType] = useState<'DDR4' | 'DDR5'>('DDR5');
  const [ramCapacity, setRamCapacity] = useState<number>(32);
  const [cooler, setCooler] = useState<'Stock' | 'Tower Air' | '240mm AIO' | '360mm AIO'>('Tower Air');
  const [storageCount, setStorageCount] = useState<number>(2);
  const [copied, setCopied] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(selectedPresetId || null);

  // Power Supply Unit (PSU) States
  const [selectedPsuId, setSelectedPsuId] = useState<string>('psu-corsair-rm750e');
  const [customPsuWattage, setCustomPsuWattage] = useState<number | null>(null);

  // Live Pricing & Clearance Engine States
  const [useLivePricing, setUseLivePricing] = useState<boolean>(true);
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('cab-corsair-4000d');
  const [ramProfile, setRamProfile] = useState<'Low-Profile (33mm)' | 'Standard (42mm)' | 'High-Profile RGB (52mm)'>('Standard (42mm)');
  const [isSyncingPrices, setIsSyncingPrices] = useState<boolean>(false);
  const [activeRetailerTab, setActiveRetailerTab] = useState<'GPU' | 'CPU'>('GPU');
  const [priceSyncKey, setPriceSyncKey] = useState<number>(0);

  // Sync if selectedPresetId changes externally
  useEffect(() => {
    if (selectedPresetId) {
      applyPreset(selectedPresetId);
    }
  }, [selectedPresetId]);

  const applyPreset = (presetId: string) => {
    const p = budgetPresets.find(b => b.id === presetId);
    if (!p) return;
    setCpuId(p.cpuId);
    setGpuId(p.gpuId);
    setActivePresetId(p.id);

    if (p.ram.includes('DDR5')) {
      setRamType('DDR5');
    } else {
      setRamType('DDR4');
    }

    if (p.ram.includes('64GB')) setRamCapacity(64);
    else if (p.ram.includes('16GB')) setRamCapacity(16);
    else setRamCapacity(32);

    if (p.targetBudgetINR >= 200000) {
      setCooler('360mm AIO');
      setStorageCount(3);
    } else if (p.targetBudgetINR >= 100000) {
      setCooler('240mm AIO');
      setStorageCount(2);
    } else if (p.targetBudgetINR <= 40000) {
      setCooler('Stock');
      setStorageCount(1);
    } else {
      setCooler('Tower Air');
      setStorageCount(1);
    }

    // Auto-align PSU with preset requirements
    if (p.psuWatts) {
      const matchPsu =
        POPULAR_INDIAN_PSUS.find(psu => psu.wattage === p.psuWatts) ||
        POPULAR_INDIAN_PSUS.find(psu => psu.wattage >= p.psuWatts) ||
        POPULAR_INDIAN_PSUS[3];
      if (matchPsu) {
        setSelectedPsuId(matchPsu.id);
        setCustomPsuWattage(null);
      }
    }
  };

  // Custom Presets (localStorage) State
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  const handleLoadCustomPreset = (preset: SavedCustomPreset) => {
    if (preset.cpuId && cpus.some(c => c.id === preset.cpuId)) {
      setCpuId(preset.cpuId);
    }
    if (preset.gpuId && gpus.some(g => g.id === preset.gpuId)) {
      setGpuId(preset.gpuId);
    }
    if (preset.ramCapacity) setRamCapacity(preset.ramCapacity);
    if (preset.ramType) setRamType(preset.ramType);
    if (preset.storageCount) setStorageCount(preset.storageCount);
    if (preset.cooler) {
      if (preset.cooler === 'Air Cooler') setCooler('Tower Air');
      else setCooler(preset.cooler as any);
    }
    if (preset.cabinetId && POPULAR_INDIAN_CABINETS.some(cab => cab.id === preset.cabinetId)) {
      setSelectedCabinetId(preset.cabinetId);
    }
    if (preset.psuId && POPULAR_INDIAN_PSUS.some(psu => psu.id === preset.psuId)) {
      setSelectedPsuId(preset.psuId);
      setCustomPsuWattage(null);
    }
    setActivePresetId(preset.id);
  };

  const selectedCpu = useMemo(() => cpus.find(c => c.id === cpuId) || cpus[0], [cpus, cpuId]);
  const selectedGpu = useMemo(() => gpus.find(g => g.id === gpuId) || gpus[0], [gpus, gpuId]);

  // Live Retailer Quotes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cpuPriceFeed = useMemo(() => fetchLiveIndianRetailerQuotes(selectedCpu), [selectedCpu, priceSyncKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gpuPriceFeed = useMemo(() => fetchLiveIndianRetailerQuotes(selectedGpu), [selectedGpu, priceSyncKey]);

  const effectiveCpuPrice = useLivePricing ? cpuPriceFeed.bestPriceINR : selectedCpu.Price_INR;
  const effectiveGpuPrice = useLivePricing ? gpuPriceFeed.bestPriceINR : selectedGpu.Price_INR;

  const handleSyncPrices = () => {
    setIsSyncingPrices(true);
    setTimeout(() => {
      setPriceSyncKey(k => k + 1);
      setIsSyncingPrices(false);
    }, 600);
  };

  // Selected Cabinet & Physical Clearance Validation
  const selectedCabinet = useMemo(
    () => POPULAR_INDIAN_CABINETS.find(c => c.id === selectedCabinetId) || POPULAR_INDIAN_CABINETS[0],
    [selectedCabinetId]
  );

  const coolerHeightMm = cooler === 'Stock' ? 65 : cooler === 'Tower Air' ? 158 : 55;
  const gpuLengthMm = selectedGpu.Length_mm || 285;

  const clearanceResult = useMemo(() => {
    return validateCabinetClearances(
      selectedCabinet,
      gpuLengthMm,
      cooler,
      coolerHeightMm,
      ramProfile
    );
  }, [selectedCabinet, gpuLengthMm, cooler, coolerHeightMm, ramProfile]);

  // Adjust RAM type if CPU socket requires DDR5 (e.g. AM5 or 9000/7000 series)
  const isDDR5Mandatory = selectedCpu.Socket === 'AM5';

  // Component Cost Estimations in INR
  const moboCost = selectedCpu.Socket === 'AM5' ? 14999 : selectedCpu.Socket === 'LGA 1700' ? 13499 : 6999;
  const ramCost = (ramType === 'DDR5' ? (ramCapacity === 16 ? 5499 : ramCapacity === 32 ? 9499 : 18499) : (ramCapacity === 16 ? 3499 : 6499));
  const coolerCost = cooler === 'Stock' ? 0 : cooler === 'Tower Air' ? 2999 : cooler === '240mm AIO' ? 6499 : 9999;
  const storageCost = storageCount * 5499; // ~1TB NVMe per drive
  const caseCost = selectedCabinet.priceINR;

  // Selected PSU calculation
  const selectedPsu = useMemo(() => {
    return POPULAR_INDIAN_PSUS.find(p => p.id === selectedPsuId) || POPULAR_INDIAN_PSUS[3];
  }, [selectedPsuId]);

  const activePsuWattage = customPsuWattage ?? selectedPsu.wattage;
  const psuCost = selectedPsu.priceINR;

  const totalBuildCost =
    effectiveCpuPrice +
    effectiveGpuPrice +
    moboCost +
    ramCost +
    coolerCost +
    storageCost +
    caseCost +
    psuCost;

  // Wattage Calculation
  const cpuWatts = selectedCpu.TDP_Watts;
  const gpuWatts = selectedGpu.TGP_Watts;
  const moboWatts = 50;
  const ramWatts = ramCapacity === 64 ? 20 : 12;
  const coolerWatts = cooler.includes('AIO') ? 25 : 10;
  const storageWatts = storageCount * 8;
  const caseFansWatts = 15;

  const totalWatts = cpuWatts + gpuWatts + moboWatts + ramWatts + coolerWatts + storageWatts + caseFansWatts;
  const recommendedPsu = Math.max(550, Math.ceil((totalWatts * 1.35) / 50) * 50);

  // PSU 80% Rated Capacity Compatibility Evaluator
  const psuCompatibility = useMemo(() => {
    return evaluatePsuCompatibility(totalWatts, activePsuWattage);
  }, [totalWatts, activePsuWattage]);

  const handleCopyBuild = () => {
    const text = [
      `=== Complete PC Rig Build Architecture (INR) ===`,
      `CPU: ${selectedCpu.Model} (${selectedCpu.Cores_Threads}) - ${formatINR(effectiveCpuPrice)} (via ${useLivePricing ? cpuPriceFeed.bestRetailer.retailerName : 'MSRP'})`,
      `Cooler: ${cooler} - ${formatINR(coolerCost)}`,
      `Motherboard: ${selectedCpu.Socket} Motherboard - ${formatINR(moboCost)}`,
      `RAM: ${ramCapacity}GB ${ramType} [${ramProfile}] - ${formatINR(ramCost)}`,
      `GPU: ${selectedGpu.Model} (${selectedGpu.VRAM_GB}GB, ${gpuLengthMm}mm) - ${formatINR(effectiveGpuPrice)} (via ${useLivePricing ? gpuPriceFeed.bestRetailer.retailerName : 'MSRP'})`,
      `Storage: ${storageCount}x 1TB NVMe PCIe 4.0 SSD - ${formatINR(storageCost)}`,
      `Cabinet: ${selectedCabinet.name} - ${formatINR(caseCost)} [Fitment: ${clearanceResult.overallCleared ? '100% Cleared' : 'Tolerance Warnings'}]`,
      `Power Supply: ${selectedPsu.name} (${activePsuWattage}W, ${selectedPsu.efficiency}) - ${formatINR(psuCost)} [Load: ${psuCompatibility.loadPercentage}% | Status: ${psuCompatibility.status}]`,
      `-----------------------------------------`,
      `Estimated Peak Power Draw: ~${totalWatts} Watts (PSU Load: ${psuCompatibility.loadPercentage}% of ${activePsuWattage}W - ${psuCompatibility.isOver80Percent ? '⚠️ EXCEEDS 80% SAFETY CEILING' : '✅ SAFE'})`,
      `Total Estimated Rig Cost: ${formatINR(totalBuildCost)}`,
      `Live Pricing Engine: ${useLivePricing ? 'Enabled (Best Pan-India Retailer Rates)' : 'MSRP Reference'}`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="p-3 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastNotification}</span>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-cyan-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-cyan-900/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              System Builder & Thermal Sizing
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Rig Architect & PSU Sizing
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Configure system subsystems, compute total thermal load, calculate power supply requirements, and compute total build budget in INR.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPresetsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-xs font-mono text-cyan-300 hover:text-white transition-all border border-cyan-700/60 shadow-md cursor-pointer"
          >
            <Bookmark className="w-4 h-4 text-cyan-400" />
            <span>Saved Presets</span>
          </button>

          <button
            onClick={handleCopyBuild}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-white transition-all border border-zinc-700 shadow-md cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copied ? 'Build Copied!' : 'Copy Full Rig Specs'}</span>
          </button>
        </div>
      </div>

      {/* Quick Indian Budget Rig Presets Carousel / Selector */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              Quick Load Indian Market Presets
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPresetsModalOpen(true)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Manage Custom Presets</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {/* Custom Presets Shortcut Button */}
          <button
            onClick={() => setIsPresetsModalOpen(true)}
            className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-mono transition-all border text-left bg-cyan-950/40 hover:bg-cyan-900/50 border-cyan-800/80 text-cyan-300 cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Bookmark className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>Custom Presets</span>
                <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.2 rounded text-cyan-300">localStorage</span>
              </div>
              <div className="text-[10px] text-zinc-400">Save & Load Your Builds</div>
            </div>
          </button>
          {budgetPresets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-mono transition-all border text-left ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-zinc-950/80 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-zinc-600'}`} />
                  <span className="font-semibold text-zinc-200">{preset.name.split(' ')[0]} {preset.name.split(' ')[1]}</span>
                  <span className="text-emerald-400 font-bold">{formatINR(preset.targetBudgetINR)}</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{preset.resolutionTier}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Component & Subsystem Pickers */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Core Subsystem Configuration
            </h3>

            {/* Processor */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Processor (CPU)
                </span>
                <span className="text-cyan-400 font-bold">{formatINR(selectedCpu.Price_INR)}</span>
              </label>
              <select
                value={cpuId}
                onChange={(e) => setCpuId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                {cpus.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.Model} ({c.Cores_Threads}, {c.TDP_Watts}W) - {formatINR(c.Price_INR)}
                  </option>
                ))}
              </select>
            </div>

            {/* Graphics Card */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-purple-400" /> Graphics Card (GPU)
                </span>
                <span className="text-purple-400 font-bold">{formatINR(selectedGpu.Price_INR)}</span>
              </label>
              <select
                value={gpuId}
                onChange={(e) => setGpuId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-purple-500 focus:outline-none"
              >
                {gpus.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.Model} ({g.VRAM_GB}GB, {g.TGP_Watts}W) - {formatINR(g.Price_INR)}
                  </option>
                ))}
              </select>
            </div>

            {/* RAM Configuration */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-zinc-400">RAM Generation</label>
                <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  <button
                    disabled={isDDR5Mandatory}
                    onClick={() => setRamType('DDR4')}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      ramType === 'DDR4' && !isDDR5Mandatory
                        ? 'bg-zinc-800 text-white'
                        : isDDR5Mandatory
                        ? 'text-zinc-600 cursor-not-allowed'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    DDR4
                  </button>
                  <button
                    onClick={() => setRamType('DDR5')}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      ramType === 'DDR5' || isDDR5Mandatory
                        ? 'bg-cyan-600 text-white shadow-glow-cyan'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    DDR5
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-zinc-400">Capacity</label>
                <select
                  value={ramCapacity}
                  onChange={(e) => setRamCapacity(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cyan-500 focus:outline-none"
                >
                  <option value={16}>16 GB Dual-Channel</option>
                  <option value={32}>32 GB Dual-Channel</option>
                  <option value={64}>64 GB Quad/Dual</option>
                </select>
              </div>
            </div>

            {/* Cooler & Storage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1">
                  <Fan className="w-3.5 h-3.5 text-cyan-400" /> CPU Cooler
                </label>
                <select
                  value={cooler}
                  onChange={(e) => setCooler(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Stock">Stock Box Cooler (₹0)</option>
                  <option value="Tower Air">Dual Tower Air Cooler (₹2,999)</option>
                  <option value="240mm AIO">240mm Liquid AIO (₹6,499)</option>
                  <option value="360mm AIO">360mm Liquid AIO (₹9,999)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> NVMe Storage
                </label>
                <select
                  value={storageCount}
                  onChange={(e) => setStorageCount(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cyan-500 focus:outline-none"
                >
                  <option value={1}>1x 1TB PCIe 4.0 SSD (₹5,499)</option>
                  <option value={2}>2x 1TB PCIe 4.0 SSD (₹10,998)</option>
                  <option value={3}>3x 1TB High Speed NVMe (₹16,497)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form: PSU Selection, Compatibility & Total Cost Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          {/* PSU Selection & 80% Compatibility Verification Box */}
          <div
            className={`rounded-2xl bg-zinc-900/90 border-2 p-5 backdrop-blur-xl shadow-xl space-y-4 transition-all ${
              psuCompatibility.isOverloaded
                ? 'border-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.3)]'
                : psuCompatibility.isOver80Percent
                ? 'border-amber-500/80 shadow-[0_0_24px_rgba(245,158,11,0.25)]'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {/* Header with Status Badge */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                PSU Sizing & 80% Safety Check
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
                  psuCompatibility.isOverloaded
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : psuCompatibility.isOver80Percent
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {psuCompatibility.isOverloaded ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    Critical Overload ({psuCompatibility.loadPercentage}%)
                  </>
                ) : psuCompatibility.isOver80Percent ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Warning: &gt;80% Load ({psuCompatibility.loadPercentage}%)
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Optimal (&lt;80% Safe)
                  </>
                )}
              </span>
            </div>

            {/* PSU Selection Controls */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <span>Selected Power Supply Model:</span>
                </label>
                <span className="text-cyan-400 font-bold">{selectedPsu.efficiency}</span>
              </div>

              <select
                value={selectedPsuId}
                onChange={(e) => {
                  setSelectedPsuId(e.target.value);
                  setCustomPsuWattage(null);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-amber-500 focus:outline-none"
              >
                {POPULAR_INDIAN_PSUS.map((psu) => (
                  <option key={psu.id} value={psu.id}>
                    {psu.brand} {psu.name} ({psu.wattage}W, {psu.efficiency}, {psu.atxStandard}) — {formatINR(psu.priceINR)}
                  </option>
                ))}
              </select>

              {/* Quick Wattage Preset Switcher */}
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                  <span>Quick Test Rated Capacities:</span>
                  <span className="text-[10px] text-zinc-500">Click to test 80% threshold</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[450, 550, 650, 750, 850, 1000, 1200].map((watts) => {
                    const isSelected = activePsuWattage === watts;
                    return (
                      <button
                        key={watts}
                        type="button"
                        onClick={() => {
                          const matched = POPULAR_INDIAN_PSUS.find((p) => p.wattage === watts);
                          if (matched) {
                            setSelectedPsuId(matched.id);
                            setCustomPsuWattage(null);
                          } else {
                            setCustomPsuWattage(watts);
                          }
                        }}
                        className={`py-1 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                            : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        {watts}W
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Side-by-Side Wattage & Headroom Display */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center font-mono">
              <div className="space-y-0.5">
                <div className="text-[10px] text-zinc-400">Total System Draw</div>
                <div className="text-lg font-black text-white">~{totalWatts}W</div>
                <div className="text-[9px] text-zinc-500">Peak Gaming</div>
              </div>
              <div className="space-y-0.5 border-x border-zinc-800/80">
                <div className="text-[10px] text-zinc-400">PSU Rated Capacity</div>
                <div className="text-lg font-black text-amber-400">{activePsuWattage}W</div>
                <div className="text-[9px] text-zinc-500">{selectedPsu.efficiency.replace('80+ ', '')}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-zinc-400">Continuous Load</div>
                <div
                  className={`text-lg font-black ${
                    psuCompatibility.isOverloaded
                      ? 'text-rose-400'
                      : psuCompatibility.isOver80Percent
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {psuCompatibility.loadPercentage}%
                </div>
                <div className="text-[9px] text-zinc-500">80% Cap: {psuCompatibility.maxContinuousSafeWatts}W</div>
              </div>
            </div>

            {/* Interactive Multi-Zone Continuous Load Meter */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Load Factor vs 80% Safe Continuous Ceiling:</span>
                <span
                  className={`font-bold ${
                    psuCompatibility.isOverloaded
                      ? 'text-rose-400'
                      : psuCompatibility.isOver80Percent
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {psuCompatibility.loadPercentage}% Load {psuCompatibility.isOver80Percent ? '⚠️ EXCEEDS 80%' : '✅ SAFE'}
                </span>
              </div>

              {/* Progress Gauge with 80% Tick Mark */}
              <div className="relative w-full h-3.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                {/* Background Zone Indicators */}
                <div className="absolute inset-0 flex">
                  <div className="w-[80%] h-full bg-emerald-950/20 border-r border-amber-500/40" />
                  <div className="w-[20%] h-full bg-amber-950/30" />
                </div>

                {/* Actual Load Fill */}
                <div
                  className={`h-full rounded-full transition-all duration-300 relative z-10 ${
                    psuCompatibility.isOverloaded
                      ? 'bg-rose-500 w-full'
                      : psuCompatibility.isOver80Percent
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{
                    width: `${Math.min(100, psuCompatibility.loadPercentage)}%`
                  }}
                />

                {/* 80% Tick Mark Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_#fff] z-20"
                  style={{ left: '80%' }}
                  title="80% Continuous Safe Load Ceiling"
                />
              </div>

              <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                <span>0W (Idle)</span>
                <span className="text-amber-300 font-semibold">80% Ceiling ({psuCompatibility.maxContinuousSafeWatts}W)</span>
                <span>{activePsuWattage}W (100% Max)</span>
              </div>
            </div>

            {/* PSU COMPATIBILITY WARNING / VERIFIED BANNER */}
            {psuCompatibility.isOver80Percent ? (
              <div
                className={`p-3.5 rounded-xl border space-y-2.5 font-mono ${
                  psuCompatibility.isOverloaded
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                    : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      psuCompatibility.isOverloaded ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                    }`}
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-bold tracking-wide uppercase">
                      {psuCompatibility.isOverloaded
                        ? 'CRITICAL: Total Draw Exceeds PSU Capacity (>100%)'
                        : 'PSU Compatibility Warning: Exceeds 80% Rated Capacity'}
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Total system power draw (<strong className="text-white">~{totalWatts}W</strong>) consumes{' '}
                      <strong className={psuCompatibility.isOverloaded ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                        {psuCompatibility.loadPercentage}%
                      </strong>{' '}
                      of your chosen {activePsuWattage}W PSU capacity, breaching the 80% continuous safety ceiling (
                      <strong className="text-white">{psuCompatibility.maxContinuousSafeWatts}W</strong>).
                    </p>
                  </div>
                </div>

                {/* Technical significance of the 80% threshold */}
                <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 text-[10.5px] text-zinc-300 space-y-1">
                  <div className="text-zinc-400 font-semibold flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Technical Significance of the 80% Threshold:</span>
                  </div>
                  <p className="text-zinc-400 leading-normal">
                    Modern high-performance GPUs (e.g. Ada Lovelace RTX 40-series and AMD RDNA 3) generate sub-millisecond transient power spikes of up to 150%–200% of their rated TGP. Operating continuous base loads above 80% leaves dangerously narrow buffer room, risking Over-Current Protection (OCP) shutdowns during intense gaming spikes, lowering electrical efficiency, and elevating capacitor temperatures.
                  </p>
                </div>

                {/* 1-Click Auto Upgrade Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-zinc-300">
                    Recommended Unit: <strong className="text-white">{psuCompatibility.recommendedPsuWatts}W 80+ Gold</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const upgrade =
                        POPULAR_INDIAN_PSUS.find((p) => p.wattage >= psuCompatibility.recommendedPsuWatts) ||
                        POPULAR_INDIAN_PSUS[POPULAR_INDIAN_PSUS.length - 1];
                      setSelectedPsuId(upgrade.id);
                      setCustomPsuWattage(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Auto-Upgrade to {psuCompatibility.recommendedPsuWatts}W PSU</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold">PSU Compatibility Verified & Cleared</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    +{psuCompatibility.headroomWatts}W Headroom
                  </span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Total power draw (~{totalWatts}W) operates comfortably at <strong className="text-emerald-400">{psuCompatibility.loadPercentage}%</strong> of your {activePsuWattage}W PSU, safely below the 80% ceiling ({psuCompatibility.maxContinuousSafeWatts}W). Your rig retains ample margin for GPU transient load spikes and operates within the PSU's peak 50%–70% efficiency curve.
                </p>
              </div>
            )}

            {/* Wattage Distribution Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-400">
              <div className="flex justify-between">
                <span>CPU TDP ({selectedCpu.Model.split(' ')[0]}):</span>
                <span className="text-white font-bold">{cpuWatts}W</span>
              </div>
              <div className="flex justify-between">
                <span>GPU TGP ({selectedGpu.Model.split(' ')[0]}):</span>
                <span className="text-white font-bold">{gpuWatts}W</span>
              </div>
              <div className="flex justify-between">
                <span>Motherboard, RAM ({ramCapacity}GB) & NVMe:</span>
                <span className="text-white font-bold">{moboWatts + ramWatts + storageWatts}W</span>
              </div>
              <div className="flex justify-between">
                <span>Cooler ({cooler}) & Chassis Fans:</span>
                <span className="text-white font-bold">{coolerWatts + caseFansWatts}W</span>
              </div>
            </div>
          </div>

          {/* Budget Summary Card in INR */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 backdrop-blur-xl shadow-xl space-y-4">
            <h4 className="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
              Total Estimated Rig Budget (INR)
            </h4>

            <div className="space-y-1.5 text-xs font-mono text-zinc-400">
              <div className="flex justify-between">
                <span>Core CPU & GPU:</span>
                <span className="text-white font-bold">{formatINR(effectiveCpuPrice + effectiveGpuPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Motherboard:</span>
                <span className="text-white">{formatINR(moboCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Memory ({ramCapacity}GB {ramType}):</span>
                <span className="text-white">{formatINR(ramCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage & Cooler:</span>
                <span className="text-white">{formatINR(storageCost + coolerCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Chassis ({selectedCabinet.name.split(' ')[0]}):</span>
                <span className="text-white">{formatINR(caseCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Power Supply ({selectedPsu.name.split(' ')[0]} {activePsuWattage}W):</span>
                <span className="text-white font-bold">{formatINR(psuCost)}</span>
              </div>
            </div>

            {/* Pricing Mode Toggle */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                Live Indian Retailer Pricing:
              </span>
              <button
                onClick={() => setUseLivePricing(!useLivePricing)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
                  useLivePricing
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {useLivePricing ? 'Best Live Rates' : 'MSRP Reference'}
              </button>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white">Full Build Total</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {formatINR(totalBuildCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* D3 Real-Time Power Consumption Breakdown & PSU Headroom Analysis */}
      <PowerConsumptionChart
        gpuModel={selectedGpu.Model}
        gpuWatts={gpuWatts}
        cpuModel={selectedCpu.Model}
        cpuWatts={cpuWatts}
        moboWatts={moboWatts}
        ramCapacity={ramCapacity}
        ramWatts={ramWatts}
        cooler={cooler}
        coolerWatts={coolerWatts}
        storageCount={storageCount}
        storageWatts={storageWatts}
        caseFansWatts={caseFansWatts}
        totalWatts={totalWatts}
        psuWattage={activePsuWattage}
        psuName={selectedPsu.name}
        isOver80Percent={psuCompatibility.isOver80Percent}
        isOverloaded={psuCompatibility.isOverloaded}
      />

      {/* VRAM & Resolution Capability Advisor and CPU Thermal Dissipation Engine */}
      <VramAndThermalAdvisor
        cpu={selectedCpu}
        gpu={selectedGpu}
        cooler={cooler}
        onUpgradeCooler={(newCooler) => setCooler(newCooler)}
      />

      {/* Live Indian Hardware Retailer Comparator Engine */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Indian Hardware E-Commerce Price Engine
              </span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Live Indian Retailer Price Comparator
            </h3>
            <p className="text-xs text-zinc-400">
              Aggregated live pricing and inventory status across dominant Indian PC distributors: MDComputers, PrimeABGB, Vedant Computers, EliteHubs, and Amazon.in.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
              <button
                onClick={() => setActiveRetailerTab('GPU')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeRetailerTab === 'GPU' ? 'bg-purple-600 text-white shadow-glow-purple' : 'text-zinc-400 hover:text-white'
                }`}
              >
                GPU Quotes
              </button>
              <button
                onClick={() => setActiveRetailerTab('CPU')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeRetailerTab === 'CPU' ? 'bg-cyan-600 text-white shadow-glow-cyan' : 'text-zinc-400 hover:text-white'
                }`}
              >
                CPU Quotes
              </button>
            </div>

            <button
              onClick={handleSyncPrices}
              disabled={isSyncingPrices}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 border border-zinc-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPrices ? 'animate-spin text-emerald-400' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">{isSyncingPrices ? 'Scraping...' : 'Sync Live'}</span>
            </button>
          </div>
        </div>

        {/* Selected Component Price Feed Banner */}
        {(() => {
          const feed = activeRetailerTab === 'GPU' ? gpuPriceFeed : cpuPriceFeed;
          return (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Item:</span>
                  <span className="text-white font-bold">{feed.componentModel}</span>
                  <span className="text-zinc-500">| MRP: {formatINR(feed.mrpINR)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">
                    Best Deal: {formatINR(feed.bestPriceINR)} on {feed.bestRetailer.retailerName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                    Save up to {formatINR(feed.maxSavingsINR)}
                  </span>
                </div>
              </div>

              {/* Retailer Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {feed.quotes.map((quote) => (
                  <div
                    key={quote.retailerId}
                    className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col justify-between space-y-2.5 hover:border-zinc-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white truncate">{quote.retailerName}</span>
                        {quote.hasDeal && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                            DEAL
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-black font-mono text-white">
                        {formatINR(quote.priceINR)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${quote.stockStatus === 'IN_STOCK' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className="text-[10px] font-mono text-zinc-400">
                          {quote.stockStatus === 'IN_STOCK' ? 'In Stock' : 'Low Stock'}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {quote.shippingDays}
                      </div>
                    </div>

                    <a
                      href={quote.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white border border-zinc-800 transition-all"
                    >
                      <span>Check Store</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Cabinet Internal Clearance Engine */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Physical Form Factor & Tolerance Verification
              </span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Cabinet Internal Clearance Engine
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Validates millimeter clearances for GPU length, CPU cooler height, top/front radiator bracket sizes, and RAM heatsink collision hazards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
                clearanceResult.overallCleared
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {clearanceResult.overallCleared ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  All Clearances Verified
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Physical Collision Detected
                </>
              )}
            </span>
          </div>
        </div>

        {/* Cabinet Selection & RAM Profile Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
              <span>Selected PC Cabinet / Chassis:</span>
              <span className="text-cyan-400 font-bold">{formatINR(selectedCabinet.priceINR)}</span>
            </label>
            <select
              value={selectedCabinetId}
              onChange={(e) => setSelectedCabinetId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              {POPULAR_INDIAN_CABINETS.map((cab) => (
                <option key={cab.id} value={cab.id}>
                  {cab.name} (Max GPU: {cab.maxGpuLengthMm}mm, Top Rad: {cab.topRadiatorSupportMm || 'None'}mm) - {formatINR(cab.priceINR)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-400">{selectedCabinet.description}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
              <span>RAM Heatspreader Profile:</span>
              <span className="text-purple-400 font-bold">{ramProfile}</span>
            </label>
            <select
              value={ramProfile}
              onChange={(e) => setRamProfile(e.target.value as any)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="Low-Profile (33mm)">Low-Profile (33mm, e.g. Corsair Vengeance LPX)</option>
              <option value="Standard (42mm)">Standard (42mm, e.g. G.Skill Ripjaws / Kingston Fury)</option>
              <option value="High-Profile RGB (52mm)">High-Profile RGB (52mm, e.g. Trident Z5 RGB / Dominator)</option>
            </select>
            <p className="text-[11px] text-zinc-400">
              Crucial when mounting top radiators: tall heatsinks collide with thick 360mm/240mm fans.
            </p>
          </div>
        </div>

        {/* Clearance Diagnostics Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* GPU Clearance */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">GPU Length Fitment:</span>
              <span
                className={`font-bold ${
                  clearanceResult.gpuStatus === 'CLEARED'
                    ? 'text-emerald-400'
                    : clearanceResult.gpuStatus === 'TIGHT'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {clearanceResult.gpuStatus}
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white">
              {gpuLengthMm}mm <span className="text-xs text-zinc-500 font-normal">/ {selectedCabinet.maxGpuLengthMm}mm max</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  clearanceResult.gpuStatus === 'COLLISION'
                    ? 'bg-rose-500 w-full'
                    : clearanceResult.gpuStatus === 'TIGHT'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{
                  width: clearanceResult.gpuStatus === 'COLLISION' ? '100%' : `${Math.min(100, Math.round((gpuLengthMm / selectedCabinet.maxGpuLengthMm) * 100))}%`
                }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              Margin: {clearanceResult.gpuMarginMm >= 0 ? `+${clearanceResult.gpuMarginMm}mm clearance` : `${clearanceResult.gpuMarginMm}mm collision!`}
            </p>
          </div>

          {/* Cooler Height */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">CPU Cooler Clearance:</span>
              <span
                className={`font-bold ${
                  clearanceResult.isRadiatorFit ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {clearanceResult.radiatorStatus}
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white">
              {coolerHeightMm}mm <span className="text-xs text-zinc-500 font-normal">/ {selectedCabinet.maxCpuCoolerHeightMm}mm max</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((coolerHeightMm / selectedCabinet.maxCpuCoolerHeightMm) * 100))}%`
                }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              Cooler Type: {cooler}
            </p>
          </div>

          {/* Top Radiator vs RAM Clearance */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Top AIO vs RAM Heatsink:</span>
              <span
                className={`font-bold ${
                  clearanceResult.ramClearanceStatus === 'CLEARED'
                    ? 'text-emerald-400'
                    : clearanceResult.ramClearanceStatus === 'WARNING_TIGHT'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {clearanceResult.ramClearanceStatus}
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white">
              {ramProfile.split(' ')[0]} <span className="text-xs text-zinc-500 font-normal">({selectedCabinet.topRadiatorMaxRamHeightMm}mm max allowed)</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              {cooler.includes('AIO')
                ? `Radiator Top Support: ${selectedCabinet.topRadiatorSupportMm}mm`
                : 'Air Cooler Active: No Top Radiator Conflict'}
            </p>
          </div>
        </div>

        {/* Warning messages if any */}
        {clearanceResult.clearanceWarnings.length > 0 && (
          <div className="space-y-2 pt-2">
            {clearanceResult.clearanceWarnings.map((warn, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-2.5 text-xs text-zinc-300"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive 2D Silicon Chassis & Physical Fitment Simulator */}
      <VisualChassisSimulator
        cpu={selectedCpu}
        gpu={selectedGpu}
        ramType={ramType}
        ramCapacity={ramCapacity}
        cooler={cooler}
        storageCount={storageCount}
        totalWatts={totalWatts}
        recommendedPsu={recommendedPsu}
        chosenPsuName={selectedPsu.name}
        chosenPsuWattage={activePsuWattage}
        chosenPsuLoadPct={psuCompatibility.loadPercentage}
        isPsuOver80={psuCompatibility.isOver80Percent}
        isPsuOverloaded={psuCompatibility.isOverloaded}
        onOpenBenchmarks={onOpenBenchmarks}
      />

      {/* LocalStorage Custom Presets Modal */}
      <CustomPresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        cpus={cpus}
        gpus={gpus}
        currentConfig={{
          cpuId,
          gpuId,
          ramCapacity,
          ramType,
          storageCount,
          cooler: cooler === 'Stock' || cooler === 'Tower Air' ? 'Air Cooler' : cooler,
          cabinetId: selectedCabinetId,
          psuId: selectedPsuId,
          totalBuildCostINR: totalBuildCost,
          totalWatts
        }}
        onLoadPreset={handleLoadCustomPreset}
        onNotify={showNotification}
      />
    </div>
  );
};
