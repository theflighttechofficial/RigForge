import React, { useRef, useState, useEffect } from 'react';
import { ActiveTab, ComponentCategory } from '../types';
import {
  Cpu,
  Monitor,
  BarChart3,
  GitCompare,
  GitMerge,
  Wrench,
  TableProperties,
  TrendingUp,
  Zap,
  Sparkles,
  Activity,
  Gauge,
  Sun,
  Moon,
  Search,
  BookOpen,
  Laptop,
  Box,
  ChevronDown,
  ArrowRight,
  LayoutGrid,
  Stethoscope,
  HardDrive,
  Calculator,
  Trophy,
  Users,
  ScanLine
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  category: ComponentCategory;
  setCategory: (cat: ComponentCategory) => void;
  cpuCount: number;
  gpuCount: number;
  onRunDiagnostics?: () => void;
  onOpenSearch?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const navTabs: { id: ActiveTab; label: string; shortLabel: string; icon: React.FC<{ className?: string }>; color: string }[] = [
  { id: 'intro', label: 'Overview', shortLabel: 'Overview', icon: Sparkles, color: 'text-cyan-400' },
  { id: 'myspecs', label: 'My PC Specs', shortLabel: 'My Specs', icon: ScanLine, color: 'text-cyan-400' },
  { id: 'digitaltwin', label: 'My Rig (Digital Twin)', shortLabel: 'My Rig', icon: Laptop, color: 'text-cyan-400' },
  { id: 'doctor', label: 'AI Build Doctor', shortLabel: 'AI Doctor', icon: Stethoscope, color: 'text-cyan-400' },
  { id: 'matrix', label: '2D Value Matrix', shortLabel: '2D Matrix', icon: BarChart3, color: 'text-cyan-400' },
  { id: 'compare', label: 'Head-to-Head Duel', shortLabel: 'Duel', icon: GitCompare, color: 'text-purple-400' },
  { id: 'synergy', label: 'Bottleneck Lab', shortLabel: 'Synergy', icon: GitMerge, color: 'text-emerald-400' },
  { id: 'storagelab', label: 'Storage Performance Lab', shortLabel: 'Storage', icon: HardDrive, color: 'text-amber-400' },
  { id: 'ramlab', label: 'RAM Config Lab', shortLabel: 'RAM Lab', icon: Cpu, color: 'text-cyan-400' },
  { id: 'costoptimizer', label: 'Build Cost Optimizer', shortLabel: 'Cost Optimizer', icon: Calculator, color: 'text-emerald-400' },
  { id: 'challengemode', label: 'PC Build Challenge', shortLabel: 'Challenge', icon: Trophy, color: 'text-amber-400' },
  { id: 'community', label: 'Community Build Gallery', shortLabel: 'Community', icon: Users, color: 'text-cyan-400' },
  { id: 'troubleshoot', label: 'Troubleshooting Wizard', shortLabel: 'Troubleshoot', icon: Stethoscope, color: 'text-rose-400' },
  { id: 'builder', label: 'Rig Architect', shortLabel: 'Architect', icon: Wrench, color: 'text-blue-400' },
  { id: 'spatial3d', label: '3D Hardware Simulators & AR', shortLabel: 'Simulators', icon: Box, color: 'text-cyan-400' },
  { id: 'battlestation', label: 'Dream Setup Lab', shortLabel: 'Dream Rig', icon: Laptop, color: 'text-violet-400' },
  { id: 'anatomy', label: 'Component Anatomy', shortLabel: 'Anatomy', icon: BookOpen, color: 'text-emerald-400' },
  { id: 'benchmarks', label: 'Live Benchmarks', shortLabel: 'Benchmarks', icon: Gauge, color: 'text-cyan-400' },
  { id: 'roi', label: 'Upgrade ROI', shortLabel: 'ROI', icon: TrendingUp, color: 'text-emerald-400' },
  { id: 'cost', label: 'Power & TCO', shortLabel: 'Power', icon: Zap, color: 'text-amber-400' },
  { id: 'catalog', label: 'Catalog', shortLabel: 'Catalog', icon: TableProperties, color: 'text-rose-400' }
];

// Max 5 tabs stay in the bar; the rest live in the "More" dropdown
const PRIMARY_TAB_IDS: ActiveTab[] = ['intro', 'myspecs', 'digitaltwin', 'builder', 'catalog'];
const primaryTabs = PRIMARY_TAB_IDS.map((id) => navTabs.find((t) => t.id === id)!);
const moreTabs = navTabs.filter((t) => !PRIMARY_TAB_IDS.includes(t.id));

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  category,
  setCategory,
  cpuCount,
  gpuCount,
  onRunDiagnostics,
  onOpenSearch,
  theme = 'dark',
  onToggleTheme
}) => {
  const [moreOpen, setMoreOpen] = useState<boolean>(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const activeMoreTab = moreTabs.find((t) => t.id === activeTab);
  const [showMoreHint, setShowMoreHint] = useState<boolean>(() => {
    try {
      return localStorage.getItem('silicon_matrix_more_hint_seen') !== '1';
    } catch {
      return true;
    }
  });
  const dismissMoreHint = () => {
    setShowMoreHint(false);
    try {
      localStorage.setItem('silicon_matrix_more_hint_seen', '1');
    } catch {
      // ignore
    }
  };

  // Close the dropdown on outside click or Escape
  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const isLight = theme === 'light';
  const activeClass = isLight
    ? 'bg-cyan-600 text-white font-bold border border-cyan-500 shadow-md shadow-cyan-600/20'
    : 'bg-zinc-800 text-white font-bold border border-zinc-600/80 shadow-md shadow-cyan-950/20';
  const idleClass = isLight
    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 border border-transparent'
    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/90 border border-transparent';
  const iconClass = (active: boolean, color: string) =>
    active ? (isLight ? 'text-white' : color) : isLight ? 'text-slate-500 group-hover:text-slate-900' : 'text-zinc-400 group-hover:text-zinc-200';

  return (
    <header
      id="app-main-header"
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-all ${
        isLight
          ? 'border-slate-200/90 bg-white/95 text-slate-900 shadow-sm'
          : 'border-zinc-800 bg-zinc-950/90 text-zinc-100 shadow-lg'
      }`}
    >
      <div className="w-full px-2.5 sm:px-6 lg:px-8">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4">
          {/* Brand & Identity */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <button
              onClick={() => setActiveTab('intro')}
              className="flex items-center gap-2 sm:gap-3 text-left group cursor-pointer focus:outline-none min-w-0"
              title="Return to System Overview"
            >
              <div
                className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-colors shadow-sm shrink-0 ${
                  isLight
                    ? 'bg-cyan-50 border border-cyan-200 text-cyan-700 group-hover:border-cyan-500'
                    : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400'
                }`}
              >
                <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span
                    className={`text-xs sm:text-base font-black tracking-wider font-mono transition-colors truncate ${
                      isLight ? 'text-slate-900 group-hover:text-cyan-700' : 'text-white group-hover:text-cyan-300'
                    }`}
                  >
                    SILICON MATRIX
                  </span>
                  <span
                    className={`hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0 ${
                      isLight
                        ? 'bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold'
                        : 'bg-cyan-950/80 border border-cyan-800/60 text-cyan-400'
                    }`}
                  >
                    v3.0
                  </span>
                </div>
                <div
                  className={`hidden sm:flex items-center gap-2 text-[10px] font-mono ${
                    isLight ? 'text-slate-500' : 'text-zinc-400'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                  <span className={isLight ? 'text-slate-300' : 'text-zinc-700'}>&bull;</span>
                  <span className={isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400 font-semibold'}>
                    INR (₹) Retail Engine
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Quick Hardware Finder Button */}
          {onOpenSearch && (
            <button
              id="btn-global-quick-search"
              onClick={onOpenSearch}
              className={`hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer shadow-inner w-72 justify-between ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-cyan-500/50'
                  : 'bg-zinc-900/90 hover:bg-zinc-900 border-zinc-800 hover:border-cyan-500/50 text-zinc-400 hover:text-white'
              }`}
              title="Quick Search all CPUs & GPUs (Press Ctrl+K or ⌘K)"
            >
              <div className="flex items-center gap-2">
                <Search className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                <span>Search silicon database...</span>
              </div>
              <div
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                  isLight ? 'bg-white text-slate-600 border-slate-300' : 'bg-zinc-800 text-zinc-400 border-zinc-700/80'
                }`}
              >
                <kbd>⌘</kbd>
                <kbd>K</kbd>
              </div>
            </button>
          )}

          {/* Right Action Tools: Category Toggle & Diagnostics */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile/Compact Search Icon Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className={`lg:hidden flex items-center justify-center p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-cyan-700'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-cyan-400'
                }`}
                title="Search Silicon Database"
              >
                <Search className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
              </button>
            )}

            {/* Quick CPU / GPU Category Toggle */}
            <div
              className={`inline-flex p-1 rounded-xl border shadow-inner shrink-0 ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <button
                id="btn-cat-cpu"
                onClick={() => setCategory('CPU')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  category === 'CPU'
                    ? 'bg-cyan-500 text-zinc-950 shadow-sm font-black'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Filter by Desktop Processors"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CPUs</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    category === 'CPU'
                      ? 'bg-cyan-950/40 text-zinc-950 font-extrabold'
                      : isLight
                      ? 'bg-slate-200 text-slate-700 font-bold'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {cpuCount}
                </span>
              </button>

              <button
                id="btn-cat-gpu"
                onClick={() => setCategory('GPU')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  category === 'GPU'
                    ? 'bg-purple-500 text-white shadow-sm font-black'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Filter by Graphics Cards"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GPUs</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    category === 'GPU'
                      ? 'bg-purple-950/40 text-white font-extrabold'
                      : isLight
                      ? 'bg-slate-200 text-slate-700 font-bold'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {gpuCount}
                </span>
              </button>
            </div>

            {/* Quick Diagnostic Calibration Button */}
            {onRunDiagnostics && (
              <button
                onClick={onRunDiagnostics}
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer shadow-sm ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-cyan-700'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-cyan-500/50 text-zinc-300 hover:text-cyan-300'
                }`}
                title="Re-run Silicon Hardware Diagnostic Calibration"
              >
                <Activity className={`w-3.5 h-3.5 animate-pulse ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                <span>Diagnostics</span>
              </button>
            )}

            {/* Global High-Contrast / Light Theme Toggle Button */}
            {onToggleTheme && (
              <button
                id="btn-global-theme-toggle"
                onClick={onToggleTheme}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer shadow-sm ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 hover:border-purple-300'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-amber-500/50 text-zinc-300'
                }`}
                title={isLight ? 'Switch to High-Contrast Dark Theme' : 'Switch to Clean Light Theme'}
                aria-label="Toggle visual theme"
              >
                {isLight ? (
                  <Moon className="w-4 h-4 text-purple-600" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                <span className={`hidden sm:inline text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                  {isLight ? 'Dark' : 'Light'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Top Navigation: primary tabs plus a "More" dropdown for everything else */}
        <div className={`relative border-t ${isLight ? 'border-slate-200' : 'border-zinc-900/90'}`}>
          {/* 3-column grid keeps the primary tabs centred with "More" pinned right */}
          <nav className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 pt-2 pb-2.5 select-none" aria-label="Application sections navigation">
            <div aria-hidden />
            <div className="flex items-center justify-center gap-1.5">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={`group flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer min-w-0 ${
                    isActive ? activeClass : idleClass
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClass(isActive, tab.color)}`} />
                  <span className="hidden lg:inline">{tab.label}</span>
                  <span className="hidden sm:inline lg:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}

            </div>

            <div ref={moreRef} className="relative justify-self-end flex items-center gap-2">
              {/* Hint pointing at "More" until the user opens it once */}
              {showMoreHint && !moreOpen && (
                <span
                  aria-hidden
                  className={`hidden md:flex items-center gap-1 text-[11px] font-bold whitespace-nowrap pointer-events-none animate-pulse ${
                    isLight ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  Explore more
                  <ArrowRight className="w-3.5 h-3.5 animate-[nudge_1s_ease-in-out_infinite]" />
                </span>
              )}
              <button
                id="tab-more"
                onClick={() => {
                  setMoreOpen((o) => !o);
                  dismissMoreHint();
                }}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                className={`group flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeMoreTab ? activeClass : idleClass
                }`}
              >
                {activeMoreTab ? (
                  <activeMoreTab.icon className={`w-3.5 h-3.5 shrink-0 ${iconClass(true, activeMoreTab.color)}`} />
                ) : (
                  <LayoutGrid className={`w-3.5 h-3.5 shrink-0 ${iconClass(false, '')}`} />
                )}
                <span className="max-w-[9rem] truncate">{activeMoreTab ? activeMoreTab.shortLabel : 'More'}</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div
                  role="menu"
                  className={`absolute right-0 top-full mt-2 z-50 w-[min(34rem,calc(100vw-1.25rem))] rounded-2xl border p-2 shadow-2xl grid grid-cols-1 sm:grid-cols-2 gap-0.5 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  {moreTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        role="menuitem"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMoreOpen(false);
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer ${
                          isActive
                            ? isLight
                              ? 'bg-cyan-50 text-cyan-800'
                              : 'bg-zinc-800 text-white'
                            : isLight
                            ? 'text-slate-700 hover:bg-slate-100'
                            : 'text-zinc-300 hover:bg-zinc-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${tab.color}`} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
