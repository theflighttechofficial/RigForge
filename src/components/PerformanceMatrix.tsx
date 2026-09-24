import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import {
  CPUItem,
  GPUItem,
  HardwareItem,
  ComponentCategory,
  WorkloadProfile,
  Brand,
  RecommendationSet
} from '../types';
import {
  formatINR,
  formatScore,
  getWorkloadScore,
  getValueIndex,
  getPowerEfficiency,
  calculateParetoCurve
} from '../utils/formatters';
import { evaluateUsedMarketPrice, UsedMarketValuation } from '../utils/usedMarketPricing';
import { Sliders, RotateCcw, IndianRupee, Target, Layers, Award, Zap, Leaf, Info, GitCompare, GitMerge, ShoppingBag, ShieldAlert, CheckCircle2 } from 'lucide-react';

Chart.register(...registerables);

interface PerformanceMatrixProps {
  category: ComponentCategory;
  items: HardwareItem[];
  onSelectForCompare: (item: HardwareItem) => void;
  onSelectForSynergy: (item: HardwareItem) => void;
  onInspectDetails: (item: HardwareItem) => void;
}

export const PerformanceMatrix: React.FC<PerformanceMatrixProps> = ({
  category,
  items,
  onSelectForCompare,
  onSelectForSynergy,
  onInspectDetails
}) => {
  // Budget Ceiling in INR
  const defaultBudget = category === 'CPU' ? 35000 : 70000;
  const maxBudget = category === 'CPU' ? 65000 : 190000;
  const minBudget = category === 'CPU' ? 5000 : 15000;

  const [budgetCeiling, setBudgetCeiling] = useState<number>(defaultBudget);
  const [workload, setWorkload] = useState<WorkloadProfile>('gaming');
  const [brandFilter, setBrandFilter] = useState<Brand | 'ALL'>('ALL');
  const [useUsedMarketPricing, setUseUsedMarketPricing] = useState<boolean>(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [inspectedItem, setInspectedItem] = useState<HardwareItem | null>(null);

  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Helper to get either retail MSRP or evaluated Indian used street price
  const getItemPrice = (item: HardwareItem): number => {
    if (useUsedMarketPricing) {
      return evaluateUsedMarketPrice(item).fairUsedMarketValueINR;
    }
    return item.Price_INR;
  };

  // Filter items by brand
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (brandFilter === 'ALL') return true;
      return item.Brand === brandFilter;
    });
  }, [items, brandFilter]);

  // Calculate Recommendations
  const recommendations: RecommendationSet<HardwareItem> = useMemo(() => {
    if (filteredItems.length === 0) {
      return { budgetChampion: null, performancePeak: null, efficiencySweetSpot: null };
    }

    // 1. Budget Champion: Highest (workloadScore / Price_INR) under budget ceiling
    const affordable = filteredItems.filter(i => getItemPrice(i) <= budgetCeiling);
    let budgetChamp: HardwareItem | null = null;
    let maxRatio = -1;

    const candidates = affordable.length > 0 ? affordable : [...filteredItems].sort((a, b) => getItemPrice(a) - getItemPrice(b)).slice(0, 1);
    candidates.forEach(item => {
      const score = getWorkloadScore(item, workload);
      const effPrice = getItemPrice(item);
      const ratio = score / (effPrice || 1);
      if (ratio > maxRatio) {
        maxRatio = ratio;
        budgetChamp = item;
      }
    });

    // 2. Performance Peak: Highest score in category
    let peak: HardwareItem | null = null;
    let maxScore = -1;
    filteredItems.forEach(item => {
      const score = getWorkloadScore(item, workload);
      if (score > maxScore) {
        maxScore = score;
        peak = item;
      }
    });

    // 3. Efficiency Sweet Spot: Points per Watt
    let sweetSpot: HardwareItem | null = null;
    let maxEff = -1;
    filteredItems.forEach(item => {
      const eff = getPowerEfficiency(item);
      if (eff > maxEff) {
        maxEff = eff;
        sweetSpot = item;
      }
    });

    return {
      budgetChampion: budgetChamp,
      performancePeak: peak,
      efficiencySweetSpot: sweetSpot
    };
  }, [filteredItems, budgetCeiling, workload, useUsedMarketPricing]);

  // Set default inspected item
  useEffect(() => {
    if (recommendations.budgetChampion && !inspectedItem) {
      setInspectedItem(recommendations.budgetChampion);
    }
  }, [recommendations, inspectedItem]);

  // Reset budget ceiling when category flips
  useEffect(() => {
    setBudgetCeiling(category === 'CPU' ? 35000 : 70000);
    setHighlightedId(null);
  }, [category]);

  // Build / Update Chart.js Scatter Plot
  useEffect(() => {
    if (!chartCanvasRef.current) return;
    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Group items by brand for distinct scatter dataset styling
    const amdItems = filteredItems.filter(i => i.Brand === 'AMD');
    const intelItems = filteredItems.filter(i => i.Brand === 'Intel');
    const nvidiaItems = filteredItems.filter(i => i.Brand === 'NVIDIA');

    // Threshold Pareto curve
    const paretoPoints = calculateParetoCurve(filteredItems, workload, getItemPrice);

    const formatDataPoints = (list: HardwareItem[]) => {
      return list.map(item => ({
        x: getItemPrice(item),
        y: getWorkloadScore(item, workload),
        rawItem: item
      }));
    };

    chartInstanceRef.current = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          // Pareto Frontier curve
          {
            type: 'line',
            label: 'Pareto Efficiency Frontier',
            data: paretoPoints,
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
            tension: 0.35,
            order: 2
          },
          // AMD points
          {
            label: 'AMD',
            data: formatDataPoints(amdItems),
            backgroundColor: '#ef4444',
            borderColor: '#b91c1c',
            borderWidth: 1.5,
            pointRadius: (context) => {
              const raw = (context.raw as any)?.rawItem;
              if (raw && highlightedId === raw.id) return 10;
              return 6.5;
            },
            pointHoverRadius: 9,
            order: 1
          },
          // Intel points
          {
            label: 'Intel',
            data: formatDataPoints(intelItems),
            backgroundColor: '#06b6d4',
            borderColor: '#0891b2',
            borderWidth: 1.5,
            pointRadius: (context) => {
              const raw = (context.raw as any)?.rawItem;
              if (raw && highlightedId === raw.id) return 10;
              return 6.5;
            },
            pointHoverRadius: 9,
            order: 1
          },
          // NVIDIA points
          {
            label: 'NVIDIA',
            data: formatDataPoints(nvidiaItems),
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1.5,
            pointRadius: (context) => {
              const raw = (context.raw as any)?.rawItem;
              if (raw && highlightedId === raw.id) return 10;
              return 6.5;
            },
            pointHoverRadius: 9,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 400
        },
        interaction: {
          mode: 'nearest',
          intersect: true
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const first = elements[0];
            const datasetIndex = first.datasetIndex;
            const index = first.index;
            const dataPoint = chartInstanceRef.current?.data.datasets[datasetIndex]?.data[index] as any;
            if (dataPoint?.rawItem) {
              setInspectedItem(dataPoint.rawItem);
              setHighlightedId(dataPoint.rawItem.id);
            }
          }
        },
        onHover: (event, elements) => {
          if (elements.length > 0) {
            const first = elements[0];
            const datasetIndex = first.datasetIndex;
            const index = first.index;
            const dataPoint = chartInstanceRef.current?.data.datasets[datasetIndex]?.data[index] as any;
            if (dataPoint?.rawItem) {
              setInspectedItem(dataPoint.rawItem);
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#18181b',
            titleColor: '#f4f4f5',
            bodyColor: '#a1a1aa',
            borderColor: '#3f3f46',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              title: (tooltipItems) => {
                const item = (tooltipItems[0]?.raw as any)?.rawItem;
                return item ? item.Model : 'Component';
              },
              label: (tooltipItem) => {
                const item = (tooltipItem.raw as any)?.rawItem;
                if (!item) return '';
                const score = getWorkloadScore(item, workload);
                const valueIdx = getValueIndex(score, item.Price_INR);
                return [
                  `Price: ${formatINR(item.Price_INR)}`,
                  `Benchmark Score: ${formatScore(score)}`,
                  `Value: ${valueIdx} pts / ₹1k`,
                  `Power: ${item.category === 'CPU' ? (item as CPUItem).TDP_Watts : (item as GPUItem).TGP_Watts}W`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            grid: {
              color: 'rgba(255, 255, 255, 0.04)'
            },
            ticks: {
              color: '#71717a',
              font: { family: 'JetBrains Mono', size: 11 },
              callback: (val) => formatINR(Number(val))
            },
            title: {
              display: true,
              text: 'Market Price in INR (₹)',
              color: '#a1a1aa',
              font: { family: 'JetBrains Mono', size: 12, weight: 'bold' }
            }
          },
          y: {
            type: 'linear',
            grid: {
              color: 'rgba(255, 255, 255, 0.04)'
            },
            ticks: {
              color: '#71717a',
              font: { family: 'JetBrains Mono', size: 11 },
              callback: (val) => formatScore(Number(val))
            },
            title: {
              display: true,
              text: `${workload === 'gaming' ? 'Gaming Index' : workload === 'productivity' ? 'Multi-Core / Compute Score' : 'Composite Benchmark Score'}`,
              color: '#a1a1aa',
              font: { family: 'JetBrains Mono', size: 12, weight: 'bold' }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [filteredItems, workload, highlightedId, category, useUsedMarketPricing]);

  const handleBadgeClick = (item: HardwareItem | null) => {
    if (!item) return;
    setHighlightedId(item.id);
    setInspectedItem(item);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Controls & Smart Recommendation Cards */}
      <div className="lg:col-span-4 space-y-6">
        {/* Filter Controls Card */}
        <div id="matrix-controls-card" className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Matrix Parameters</h2>
            </div>
            <button
              onClick={() => {
                setBudgetCeiling(category === 'CPU' ? 35000 : 70000);
                setWorkload('gaming');
                setBrandFilter('ALL');
                setHighlightedId(null);
              }}
              className="text-xs font-mono text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Budget Ceiling Slider (in INR) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="budget-slider" className="font-medium text-zinc-300 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                Budget Ceiling (₹)
              </label>
              <span id="budget-display" className="font-mono font-bold text-sm text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-800/40">
                {formatINR(budgetCeiling)}
              </span>
            </div>
            <input
              type="range"
              id="budget-slider"
              min={minBudget}
              max={maxBudget}
              step={category === 'CPU' ? 1000 : 2500}
              value={budgetCeiling}
              onChange={(e) => setBudgetCeiling(Number(e.target.value))}
              className="w-full cursor-pointer accent-cyan-500"
            />
            {/* Quick INR presets */}
            <div className="flex items-center justify-between pt-1 font-mono text-xs text-zinc-400">
              {category === 'CPU' ? (
                <>
                  <button onClick={() => setBudgetCeiling(10000)} className="hover:text-cyan-300">₹10k</button>
                  <button onClick={() => setBudgetCeiling(20000)} className="hover:text-cyan-300">₹20k</button>
                  <button onClick={() => setBudgetCeiling(35000)} className="hover:text-cyan-300 text-cyan-400 font-bold">₹35k</button>
                  <button onClick={() => setBudgetCeiling(50000)} className="hover:text-cyan-300">₹50k</button>
                  <button onClick={() => setBudgetCeiling(maxBudget)} className="hover:text-cyan-300">Max</button>
                </>
              ) : (
                <>
                  <button onClick={() => setBudgetCeiling(25000)} className="hover:text-cyan-300">₹25k</button>
                  <button onClick={() => setBudgetCeiling(50000)} className="hover:text-cyan-300">₹50k</button>
                  <button onClick={() => setBudgetCeiling(75000)} className="hover:text-cyan-300 text-cyan-400 font-bold">₹75k</button>
                  <button onClick={() => setBudgetCeiling(100000)} className="hover:text-cyan-300">₹1L</button>
                  <button onClick={() => setBudgetCeiling(maxBudget)} className="hover:text-cyan-300">Max</button>
                </>
              )}
            </div>
          </div>

          {/* Workload Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              Target Workload Profile
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <button
                onClick={() => setWorkload('gaming')}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-all text-center ${
                  workload === 'gaming'
                    ? 'bg-purple-600 text-white shadow-glow-purple'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Gaming
              </button>
              <button
                onClick={() => setWorkload('productivity')}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-all text-center ${
                  workload === 'productivity'
                    ? 'bg-purple-600 text-white shadow-glow-purple'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Workstation
              </button>
              <button
                onClick={() => setWorkload('balanced')}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-all text-center ${
                  workload === 'balanced'
                    ? 'bg-purple-600 text-white shadow-glow-purple'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Overall
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 italic">
              {workload === 'gaming'
                ? 'Optimizing for 3D V-Cache, single-core IPC, and gaming frame rates.'
                : workload === 'productivity'
                ? 'Prioritizing heavy multithreading, compute bandwidth, and VRAM.'
                : 'Balanced composite score across 3D rasterization and computing.'}
            </p>
          </div>

          {/* Manufacturer Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Manufacturer Filter
            </label>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'AMD', 'Intel', 'NVIDIA'] as const).map(b => (
                <button
                  key={b}
                  onClick={() => setBrandFilter(b)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    brandFilter === b
                      ? 'bg-zinc-800 text-white border border-zinc-600'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {b === 'ALL' ? 'All Brands' : b}
                </button>
              ))}
            </div>
          </div>

          {/* Anti-Scalper: Second-Hand Market Pricing Toggle */}
          <div className="space-y-2 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                Anti-Scalper: Used Market Value
              </label>
              <button
                type="button"
                onClick={() => setUseUsedMarketPricing(prev => !prev)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  useUsedMarketPricing ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    useUsedMarketPricing ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              {useUsedMarketPricing ? (
                <span className="text-amber-300 font-semibold">
                  Active: Recalculating Pareto frontier using fair depreciated prices from Techenclave, Zoukart & IVG classifieds.
                </span>
              ) : (
                <span>Switch from New Retail MSRP to fair second-hand street values with silicon degradation & mining risk checks.</span>
              )}
            </p>
          </div>
        </div>

        {/* Smart Recommendations Module */}
        <div id="smart-recommendations-module" className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Algorithmic Recommendations</h2>
            </div>
            <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
              Live INR Analysis
            </span>
          </div>

          <div className="space-y-3">
            {/* 1. Budget Champion Badge */}
            {recommendations.budgetChampion && (
              <div
                onClick={() => handleBadgeClick(recommendations.budgetChampion)}
                className={`group rounded-xl bg-zinc-950/90 border p-3.5 transition-all duration-300 cursor-pointer ${
                  highlightedId === recommendations.budgetChampion.id
                    ? 'border-cyan-400 shadow-glow-cyan bg-cyan-950/20'
                    : 'border-cyan-500/30 hover:border-cyan-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold uppercase font-mono">
                      <Award className="w-3 h-3" />
                      <span>Budget Champion</span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {recommendations.budgetChampion.Model}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-cyan-400 font-mono">
                      {formatINR(recommendations.budgetChampion.Price_INR)}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      {getValueIndex(
                        getWorkloadScore(recommendations.budgetChampion, workload),
                        recommendations.budgetChampion.Price_INR
                      )}{' '}
                      pts/₹1k
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Score: {formatScore(getWorkloadScore(recommendations.budgetChampion, workload))}</span>
                  <span>{recommendations.budgetChampion.category === 'CPU' ? `${(recommendations.budgetChampion as CPUItem).Cores_Threads}` : `${(recommendations.budgetChampion as GPUItem).VRAM_GB}GB VRAM`}</span>
                </div>
              </div>
            )}

            {/* 2. Performance Peak Badge */}
            {recommendations.performancePeak && (
              <div
                onClick={() => handleBadgeClick(recommendations.performancePeak)}
                className={`group rounded-xl bg-zinc-950/90 border p-3.5 transition-all duration-300 cursor-pointer ${
                  highlightedId === recommendations.performancePeak.id
                    ? 'border-purple-400 shadow-glow-purple bg-purple-950/20'
                    : 'border-purple-500/30 hover:border-purple-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase font-mono">
                      <Zap className="w-3 h-3" />
                      <span>Performance Peak</span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {recommendations.performancePeak.Model}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-purple-400 font-mono">
                      {formatINR(recommendations.performancePeak.Price_INR)}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">Raw Performance Leader</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Score: {formatScore(getWorkloadScore(recommendations.performancePeak, workload))}</span>
                  <span>Top of Matrix</span>
                </div>
              </div>
            )}

            {/* 3. Efficiency Sweet Spot Badge */}
            {recommendations.efficiencySweetSpot && (
              <div
                onClick={() => handleBadgeClick(recommendations.efficiencySweetSpot)}
                className={`group rounded-xl bg-zinc-950/90 border p-3.5 transition-all duration-300 cursor-pointer ${
                  highlightedId === recommendations.efficiencySweetSpot.id
                    ? 'border-emerald-400 shadow-glow-emerald bg-emerald-950/20'
                    : 'border-emerald-500/30 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase font-mono">
                      <Leaf className="w-3 h-3" />
                      <span>Efficiency Sweet Spot</span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {recommendations.efficiencySweetSpot.Model}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-emerald-400 font-mono">
                      {formatINR(recommendations.efficiencySweetSpot.Price_INR)}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      {getPowerEfficiency(recommendations.efficiencySweetSpot)} pts / Watt
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Score: {formatScore(getWorkloadScore(recommendations.efficiencySweetSpot, workload))}</span>
                  <span>
                    {recommendations.efficiencySweetSpot.category === 'CPU'
                      ? `${(recommendations.efficiencySweetSpot as CPUItem).TDP_Watts}W TDP`
                      : `${(recommendations.efficiencySweetSpot as GPUItem).TGP_Watts}W TGP`}
                  </span>
                </div>
              </div>
            )}
          </div>
          <p className="text-[11px] font-mono text-zinc-400 text-center">
            Click any badge to highlight & pin point on the visualizer.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: 2D Scatter Matrix & Inspector */}
      <div className="lg:col-span-8 space-y-6">
        <div id="scatter-chart-card" className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between min-h-[540px]">
          {/* Chart Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {category} Performance vs. Price Matrix (INR ₹)
                </h2>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                X-Axis: Market Price (₹) &bull; Y-Axis: {workload === 'gaming' ? 'Gaming Score' : workload === 'productivity' ? 'Multicore / Compute' : 'Composite Score'}
              </p>
            </div>

            {/* Legend Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> AMD
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Intel
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> NVIDIA
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-amber-500/30 text-amber-300">
                <span className="w-3.5 h-0.5 bg-amber-400 border-dashed" /> Pareto Frontier
              </span>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative w-full h-[370px] sm:h-[410px] my-3">
            <canvas ref={chartCanvasRef} />
          </div>

          {/* Point Inspector Strip */}
          <div className="rounded-xl bg-zinc-950/90 border border-zinc-800 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30 uppercase text-[10px]">
                Active Inspector
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  {inspectedItem ? inspectedItem.Model : 'Click or hover a scatter point'}
                </span>
                {inspectedItem && (
                  <span className="ml-2 text-zinc-400 text-xs">({inspectedItem.Architecture})</span>
                )}
              </div>
            </div>

            {inspectedItem ? (
              <div className="flex items-center gap-3 sm:gap-4 text-zinc-300 flex-wrap">
                <div>
                  Price:{' '}
                  <span className="text-white font-bold">
                    {formatINR(useUsedMarketPricing ? evaluateUsedMarketPrice(inspectedItem).fairUsedMarketValueINR : inspectedItem.Price_INR)}
                  </span>
                  {useUsedMarketPricing && (
                    <span className="text-zinc-500 line-through text-[10px] ml-1">
                      {formatINR(inspectedItem.Price_INR)}
                    </span>
                  )}
                </div>
                <div>
                  Score: <span className="text-cyan-400 font-bold">{formatScore(getWorkloadScore(inspectedItem, workload))}</span>
                </div>
                <div>
                  Value:{' '}
                  <span className="text-emerald-400 font-bold">
                    {getValueIndex(getWorkloadScore(inspectedItem, workload), getItemPrice(inspectedItem))} pts/₹1k
                  </span>
                </div>
                {/* Quick actions for inspected item */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectForCompare(inspectedItem)}
                    title="Send to Head-to-Head Duel"
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                  <button
                    onClick={() => onSelectForSynergy(inspectedItem)}
                    title="Send to Synergy Simulator"
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                  >
                    <GitMerge className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => onInspectDetails(inspectedItem)}
                    title="View Full Technical Specifications"
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-zinc-400 text-xs italic">Point hover reveals instant specs and quick actions</span>
            )}
          </div>

          {/* Used Market Street Valuation Box */}
          {inspectedItem && (
            <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              {(() => {
                const usedVal = evaluateUsedMarketPrice(inspectedItem);
                return (
                  <div className="w-full flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-400 text-[11px]">Fair Used Market Value:</span>
                          <span className="text-amber-400 font-bold text-sm">{formatINR(usedVal.fairUsedMarketValueINR)}</span>
                          <span className="text-zinc-500 text-[10px] line-through">Launch MRP: {formatINR(usedVal.originalMrpINR)}</span>
                          <span className="text-emerald-400 font-bold text-[10px]">(-{usedVal.depreciationPct}% dep.)</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          Classifieds Benchmark: Techenclave, Zoukart & OLX India
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-[11px]">
                        <span className="text-zinc-500 block text-[10px]">Crypto Mining Risk:</span>
                        <span className={`font-bold flex items-center gap-1 ${
                          usedVal.miningRiskFactor === 'HIGH' ? 'text-rose-400' :
                          usedVal.miningRiskFactor === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {usedVal.miningRiskFactor === 'HIGH' && <ShieldAlert className="w-3 h-3" />}
                          {usedVal.miningRiskFactor}
                        </span>
                      </div>

                      <div className="text-[11px]">
                        <span className="text-zinc-500 block text-[10px]">Estimated Warranty:</span>
                        <span className={`font-bold ${
                          usedVal.warrantyStatus === 'ACTIVE_WARRANTY' ? 'text-emerald-400' :
                          usedVal.warrantyStatus === 'EXPIRING_SOON' ? 'text-amber-400' : 'text-zinc-400'
                        }`}>
                          {usedVal.warrantyStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-[11px]">
                        <span className="text-zinc-500 block text-[10px]">Buyer Verification:</span>
                        <span className="text-cyan-400 font-bold">FurMark 20m + GPU-Z Hotspot</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
