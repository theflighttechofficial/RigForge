import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CPUItem, GPUItem, HardwareItem } from '../types';
import {
  Search,
  X,
  Cpu,
  Monitor,
  GitCompare,
  GitMerge,
  Wrench,
  Info,
  Zap,
  Tag,
  Check,
  Sparkles,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cpus: CPUItem[];
  gpus: GPUItem[];
  onSelectDuel: (item: HardwareItem) => void;
  onSelectSynergy: (item: HardwareItem) => void;
  onSelectArchitect: (item: HardwareItem) => void;
  onInspect: (item: HardwareItem) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  cpus,
  gpus,
  onSelectDuel,
  onSelectSynergy,
  onSelectArchitect,
  onInspect
}) => {
  const [query, setQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'CPU' | 'GPU'>('ALL');
  const [brandFilter, setBrandFilter] = useState<'ALL' | 'AMD' | 'Intel' | 'NVIDIA'>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Combine and filter hardware items
  const filteredResults = useMemo(() => {
    const allItems: HardwareItem[] = [...cpus, ...gpus];
    const q = query.trim().toLowerCase();

    return allItems
      .filter((item) => {
        // Type filter
        if (filterType !== 'ALL' && item.category !== filterType) return false;
        // Brand filter
        if (brandFilter !== 'ALL' && item.Brand !== brandFilter) return false;

        // Query filter
        if (!q) return true;

        const modelMatch = item.Model.toLowerCase().includes(q);
        const brandMatch = item.Brand.toLowerCase().includes(q);
        const archMatch = item.Architecture.toLowerCase().includes(q);
        const socketMatch =
          item.category === 'CPU' ? (item as CPUItem).Socket?.toLowerCase().includes(q) : false;
        const memoryMatch =
          item.category === 'GPU'
            ? `${(item as GPUItem).VRAM_GB}gb`.includes(q) || (item as GPUItem).Memory_Type?.toLowerCase().includes(q)
            : false;

        return modelMatch || brandMatch || archMatch || socketMatch || memoryMatch;
      })
      .slice(0, 16); // Top 16 matches for performance
  }, [cpus, gpus, query, filterType, brandFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div
        id="global-hardware-search-modal"
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-scaleUp"
      >
        {/* Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/90 flex items-center gap-3 bg-zinc-900/60">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any CPU or GPU (e.g. 9800X3D, RTX 5090, 7800X3D, Arrow Lake, AM5, GDDR7)..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 font-mono focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-mono"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close Search (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 bg-zinc-900/30 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 mr-1 text-[11px]">Type:</span>
            {(['ALL', 'CPU', 'GPU'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterType === t
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 mr-1 text-[11px]">Brand:</span>
            {(['ALL', 'AMD', 'Intel', 'NVIDIA'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBrandFilter(b)}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  brandFilter === b
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-zinc-900">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-sm font-mono text-zinc-400">No hardware found matching "{query}"</div>
              <p className="text-xs text-zinc-500">Try searching by model number, architecture, or brand.</p>
            </div>
          ) : (
            filteredResults.map((item) => {
              const isCpu = item.category === 'CPU';
              const cpu = isCpu ? (item as CPUItem) : null;
              const gpu = !isCpu ? (item as GPUItem) : null;

              return (
                <div
                  key={item.id}
                  className="pt-2.5 first:pt-0 group p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isCpu
                            ? 'bg-cyan-950/60 border-cyan-800/60 text-cyan-400'
                            : 'bg-purple-950/60 border-purple-800/60 text-purple-400'
                        }`}
                      >
                        {isCpu ? <Cpu className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                            {item.Model}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-zinc-800 text-zinc-300">
                            {item.ReleaseYear}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-zinc-800 text-zinc-400">
                            {item.Architecture}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-zinc-400 mt-1">
                          {isCpu && cpu && (
                            <>
                              <span>Socket: <strong className="text-zinc-200">{cpu.Socket}</strong></span>
                              <span>&bull;</span>
                              <span>{cpu.Cores_Threads}</span>
                              <span>&bull;</span>
                              <span>{cpu.Base_Boost_GHz}</span>
                              <span>&bull;</span>
                              <span>TDP: <strong className="text-amber-400">{cpu.TDP_Watts}W</strong></span>
                            </>
                          )}
                          {!isCpu && gpu && (
                            <>
                              <span>VRAM: <strong className="text-emerald-400">{gpu.VRAM_GB}GB {gpu.Memory_Type}</strong></span>
                              <span>&bull;</span>
                              <span>Bus: {gpu.Bus_Width_Bit}-bit</span>
                              <span>&bull;</span>
                              <span>TGP: <strong className="text-amber-400">{gpu.TGP_Watts}W</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price and Score Pill */}
                    <div className="text-right shrink-0 font-mono">
                      <div className="text-sm font-black text-emerald-400">{formatINR(item.Price_INR)}</div>
                      <div className="text-[10px] text-zinc-500">Benchmark: {item.Benchmark_Score.toLocaleString()} pts</div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t border-zinc-800/40">
                    <button
                      onClick={() => {
                        onInspect(item);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-mono font-medium flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Info className="w-3 h-3 text-cyan-400" />
                      <span>Full Specs</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectDuel(item);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 text-purple-300 text-[11px] font-mono font-medium flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <GitCompare className="w-3 h-3 text-purple-400" />
                      <span>Head-to-Head Duel</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectSynergy(item);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-[11px] font-mono font-medium flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <GitMerge className="w-3 h-3 text-emerald-400" />
                      <span>Synergy Lab</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectArchitect(item);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 text-blue-300 text-[11px] font-mono font-medium flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Wrench className="w-3 h-3 text-blue-400" />
                      <span>Rig Architect</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span>Showing top {filteredResults.length} matches</span>
            <span>&bull;</span>
            <span>Database: {cpus.length} CPUs, {gpus.length} GPUs</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] border border-zinc-700">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
