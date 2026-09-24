import React, { useState, useMemo } from 'react';
import { CPUItem, GPUItem, HardwareItem, ComponentCategory, Brand, HardwareEra } from '../types';
import { formatINR, formatScore, getValueIndex, getPowerEfficiency } from '../utils/formatters';
import { Search, SlidersHorizontal, ArrowUpDown, GitCompare, GitMerge, Info, Cpu, Monitor, Zap, History, Sparkles, Server } from 'lucide-react';

interface HardwareCatalogProps {
  category: ComponentCategory;
  setCategory: (cat: ComponentCategory) => void;
  cpus: CPUItem[];
  gpus: GPUItem[];
  onSelectForCompare: (item: HardwareItem) => void;
  onSelectForSynergy: (item: HardwareItem) => void;
  onOpenDetails: (item: HardwareItem) => void;
}

type SortKey = 'priceAsc' | 'priceDesc' | 'scoreDesc' | 'gamingDesc' | 'valueDesc' | 'effDesc' | 'yearDesc';

export const HardwareCatalog: React.FC<HardwareCatalogProps> = ({
  category,
  setCategory,
  cpus,
  gpus,
  onSelectForCompare,
  onSelectForSynergy,
  onOpenDetails
}) => {
  const [search, setSearch] = useState<string>('');
  const [brand, setBrand] = useState<Brand | 'ALL'>('ALL');
  const [era, setEra] = useState<HardwareEra | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('valueDesc');

  const rawList = category === 'CPU' ? cpus : gpus;

  const filteredAndSorted = useMemo(() => {
    let result = rawList.filter(item => {
      const matchBrand = brand === 'ALL' || item.Brand === brand;
      const matchEra = era === 'ALL' || item.Era === era;
      const matchSearch =
        item.Model.toLowerCase().includes(search.toLowerCase()) ||
        item.Architecture.toLowerCase().includes(search.toLowerCase()) ||
        item.Description.toLowerCase().includes(search.toLowerCase());
      return matchBrand && matchEra && matchSearch;
    });

    result.sort((a, b) => {
      if (sortBy === 'priceAsc') return a.Price_INR - b.Price_INR;
      if (sortBy === 'priceDesc') return b.Price_INR - a.Price_INR;
      if (sortBy === 'scoreDesc') return b.Benchmark_Score - a.Benchmark_Score;
      if (sortBy === 'gamingDesc') return b.Gaming_Score - a.Gaming_Score;
      if (sortBy === 'yearDesc') return (b.ReleaseYear || 2024) - (a.ReleaseYear || 2024);
      if (sortBy === 'valueDesc') {
        const valA = getValueIndex(a.Benchmark_Score, a.Price_INR);
        const valB = getValueIndex(b.Benchmark_Score, b.Price_INR);
        return valB - valA;
      }
      if (sortBy === 'effDesc') {
        return getPowerEfficiency(b) - getPowerEfficiency(a);
      }
      return 0;
    });

    return result;
  }, [rawList, search, brand, era, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
              Master Spec Index & Adverse Era Archive
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Hardware Catalog & Specifications Table
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Complete database of {cpus.length} CPUs and {gpus.length} GPUs spanning vintage classics (FX-8350, GTX 1060), mainstream staples, enthusiast flagships, and extreme HEDT workstations.
          </p>
        </div>

        {/* Category Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategory('CPU')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              category === 'CPU'
                ? 'bg-cyan-500 text-zinc-950 shadow-glow-cyan'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>CPUs ({cpus.length})</span>
          </button>
          <button
            onClick={() => setCategory('GPU')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              category === 'GPU'
                ? 'bg-purple-500 text-zinc-950 shadow-glow-purple'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>GPUs ({gpus.length})</span>
          </button>
        </div>
      </div>

      {/* Hardware Era Fast Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
        <span className="text-zinc-500 whitespace-nowrap text-[11px]">Hardware Era:</span>
        <button
          onClick={() => setEra('ALL')}
          className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
            era === 'ALL'
              ? 'bg-zinc-100 text-zinc-950 border-white font-bold'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          All Eras ({rawList.length})
        </button>
        <button
          onClick={() => setEra('mainstream')}
          className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
            era === 'mainstream'
              ? 'bg-cyan-500 text-zinc-950 border-cyan-400 font-bold'
              : 'bg-zinc-900 text-cyan-400/80 border-zinc-800 hover:text-cyan-300'
          }`}
        >
          Mainstream Retail
        </button>
        <button
          onClick={() => setEra('enthusiast')}
          className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
            era === 'enthusiast'
              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
              : 'bg-zinc-900 text-emerald-400/80 border-zinc-800 hover:text-emerald-300'
          }`}
        >
          Enthusiast Flagship
        </button>
        <button
          onClick={() => setEra('workstation')}
          className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
            era === 'workstation'
              ? 'bg-purple-500 text-zinc-950 border-purple-400 font-bold'
              : 'bg-zinc-900 text-purple-400/80 border-zinc-800 hover:text-purple-300'
          }`}
        >
          HEDT / Workstation
        </button>
        <button
          onClick={() => setEra('vintage')}
          className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
            era === 'vintage'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
              : 'bg-zinc-900 text-amber-400/80 border-zinc-800 hover:text-amber-300'
          }`}
        >
          Vintage / Retro (2012-2019)
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${category} by name, architecture (e.g., Zen 4, Ada, FX, Pascal)...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none font-medium"
          />
        </div>

        {/* Brand Selector */}
        <div className="md:col-span-3">
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value as any)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Manufacturers</option>
            <option value="AMD">AMD Only</option>
            <option value="Intel">Intel Only</option>
            {category === 'GPU' && <option value="NVIDIA">NVIDIA Only</option>}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="md:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
          >
            <option value="valueDesc">Sort: Best Value (pts / ₹1k)</option>
            <option value="scoreDesc">Sort: Highest Benchmark Score</option>
            <option value="gamingDesc">Sort: Highest Gaming Index</option>
            <option value="effDesc">Sort: Power Efficiency (pts/W)</option>
            <option value="yearDesc">Sort: Release Year (Newest First)</option>
            <option value="priceAsc">Sort: Price (Low to High)</option>
            <option value="priceDesc">Sort: Price (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Hardware Table */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3.5">Component Model</th>
                <th className="px-4 py-3.5">Era & Arch</th>
                <th className="px-4 py-3.5 text-right">Price (INR ₹)</th>
                <th className="px-4 py-3.5 text-right">Benchmark</th>
                <th className="px-4 py-3.5 text-right">Gaming Index</th>
                <th className="px-4 py-3.5 text-right">Value (pts/₹1k)</th>
                <th className="px-4 py-3.5 text-right">Power (W)</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredAndSorted.map(item => {
                const valueIdx = getValueIndex(item.Benchmark_Score, item.Price_INR);
                const eff = getPowerEfficiency(item);
                const watts = item.category === 'CPU' ? (item as CPUItem).TDP_Watts : (item as GPUItem).TGP_Watts;

                const eraBadge =
                  item.Era === 'vintage' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800 font-semibold">
                      Vintage ({item.ReleaseYear})
                    </span>
                  ) : item.Era === 'workstation' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800 font-semibold">
                      HEDT
                    </span>
                  ) : item.Era === 'enthusiast' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-semibold">
                      Flagship
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                      Mainstream
                    </span>
                  );

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                    onClick={() => onOpenDetails(item)}
                  >
                    {/* Model */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {item.Model}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-xs font-sans">
                        {item.category === 'CPU' ? (item as CPUItem).Cores_Threads : `${(item as GPUItem).VRAM_GB}GB VRAM &bull; ${(item as GPUItem).Bandwidth_GBs} GB/s`}
                      </div>
                    </td>

                    {/* Era & Architecture */}
                    <td className="px-4 py-3.5 space-y-1">
                      <div>{eraBadge}</div>
                      <div className="text-[11px] text-zinc-400">{item.Architecture}</div>
                    </td>

                    {/* Price in INR */}
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                      {formatINR(item.Price_INR)}
                    </td>

                    {/* Benchmark Score */}
                    <td className="px-4 py-3.5 text-right text-zinc-200">
                      {formatScore(item.Benchmark_Score)}
                    </td>

                    {/* Gaming Index */}
                    <td className="px-4 py-3.5 text-right text-cyan-300 font-semibold">
                      {formatScore(item.Gaming_Score)}
                    </td>

                    {/* Value Index */}
                    <td className="px-4 py-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded font-bold ${valueIdx > 1.2 ? 'text-emerald-400 bg-emerald-950/40' : 'text-zinc-400'}`}>
                        {valueIdx}
                      </span>
                    </td>

                    {/* Power */}
                    <td className="px-4 py-3.5 text-right text-zinc-400">
                      {watts}W
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          title="Compare in Head-to-Head Duel"
                          onClick={() => onSelectForCompare(item)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-purple-600/30 hover:text-purple-400 text-zinc-400 transition-colors"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Simulate in Synergy Lab"
                          onClick={() => onSelectForSynergy(item)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600/30 hover:text-emerald-400 text-zinc-400 transition-colors"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="View Technical Dossier"
                          onClick={() => onOpenDetails(item)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-600/30 hover:text-cyan-400 text-zinc-400 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
