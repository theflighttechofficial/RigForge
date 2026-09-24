import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  HardDrive,
  Calculator,
  Trophy,
  Users
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
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const updateScrollState = useCallback(() => {
    const el = navContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < maxScroll - 6);
    setScrollProgress(maxScroll > 0 ? Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100)) : 0);
  }, []);

  useEffect(() => {
    const el = navContainerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  // Center active tab smoothly on change
  useEffect(() => {
    const activeTabEl = document.getElementById(`tab-${activeTab}`);
    if (activeTabEl && navContainerRef.current) {
      activeTabEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
      // update scroll indicators after smooth scroll
      setTimeout(updateScrollState, 250);
    }
  }, [activeTab, updateScrollState]);

  // Convert mouse wheel vertical scroll into smooth horizontal panning inside topnavbar
  useEffect(() => {
    const el = navContainerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollBy({
          left: e.deltaY * 1.2,
          behavior: 'auto'
        });
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleScrollStep = (direction: 'left' | 'right') => {
    if (!navContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -220 : 220;
    navContainerRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };
  const isLight = theme === 'light';

  return (
    <header
      id="app-main-header"
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-all ${
        isLight
          ? 'border-slate-200/90 bg-white/95 text-slate-900 shadow-sm'
          : 'border-zinc-800 bg-zinc-950/90 text-zinc-100 shadow-lg'
      }`}
    >
      <div className="w-full px-3 sm:px-6 lg:px-8">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('intro')}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
              title="Return to System Overview"
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors shadow-sm ${
                  isLight
                    ? 'bg-cyan-50 border border-cyan-200 text-cyan-700 group-hover:border-cyan-500'
                    : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400'
                }`}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm sm:text-base font-black tracking-wider font-mono transition-colors ${
                      isLight ? 'text-slate-900 group-hover:text-cyan-700' : 'text-white group-hover:text-cyan-300'
                    }`}
                  >
                    SILICON MATRIX
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      isLight
                        ? 'bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold'
                        : 'bg-cyan-950/80 border border-cyan-800/60 text-cyan-400'
                    }`}
                  >
                    v3.0
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 text-[10px] font-mono ${
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
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mobile/Compact Search Icon Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className={`lg:hidden flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
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
              className={`inline-flex p-1 rounded-xl border shadow-inner ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <button
                id="btn-cat-cpu"
                onClick={() => setCategory('CPU')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer shadow-sm ${
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
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                  {isLight ? 'Dark' : 'Light'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Top Navigation Bar with Perfect Scrollbar */}
        <div className={`relative border-t group/nav ${isLight ? 'border-slate-200' : 'border-zinc-900/90'}`}>
          {/* Left Overflow Fade Mask & Scroll Button */}
          {canScrollLeft && (
            <div
              className={`absolute left-0 top-0 bottom-0 z-20 flex items-center pr-4 pl-0 pointer-events-none ${
                isLight
                  ? 'bg-gradient-to-r from-white via-white/95 to-transparent'
                  : 'bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent'
              }`}
            >
              <button
                onClick={() => handleScrollStep('left')}
                className={`pointer-events-auto p-1.5 rounded-lg border transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-cyan-700'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-cyan-400'
                }`}
                title="Scroll left (or use mouse wheel)"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Right Overflow Fade Mask & Scroll Button */}
          {canScrollRight && (
            <div
              className={`absolute right-0 top-0 bottom-0 z-20 flex items-center pl-4 pr-0 pointer-events-none ${
                isLight
                  ? 'bg-gradient-to-l from-white via-white/95 to-transparent'
                  : 'bg-gradient-to-l from-zinc-950 via-zinc-950/90 to-transparent'
              }`}
            >
              <button
                onClick={() => handleScrollStep('right')}
                className={`pointer-events-auto p-1.5 rounded-lg border transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-cyan-700'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-cyan-400'
                }`}
                title="Scroll right (or use mouse wheel)"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Nav Tabs Container with custom smooth scrollbar */}
          <nav
            ref={navContainerRef}
            className="flex items-center gap-1.5 pt-2 pb-2.5 overflow-x-auto perfect-nav-scrollbar scroll-smooth select-none"
            aria-label="Application sections navigation"
          >
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? isLight
                        ? 'bg-cyan-600 text-white font-bold border border-cyan-500 shadow-md shadow-cyan-600/20'
                        : 'bg-zinc-800 text-white font-bold border border-zinc-600/80 shadow-md shadow-cyan-950/20'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 border border-transparent'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/90 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive
                        ? isLight
                          ? 'text-white'
                          : tab.color
                        : isLight
                        ? 'text-slate-500 group-hover:text-slate-900'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Micro Progress Bar Track for Scroll Context */}
          <div className={`h-[2px] w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-zinc-900/60'}`}>
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 transition-all duration-150 ease-out"
              style={{
                width: canScrollLeft || canScrollRight ? `${Math.max(8, scrollProgress)}%` : '100%',
                opacity: canScrollLeft || canScrollRight ? 0.85 : 0.2
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
