import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Maximize2,
  Cpu,
  Monitor,
  HardDrive,
  Fan,
  Layers,
  Sparkles
} from 'lucide-react';

export interface PowerConsumptionChartProps {
  gpuModel: string;
  gpuWatts: number;
  cpuModel: string;
  cpuWatts: number;
  moboWatts: number;
  ramCapacity: number;
  ramWatts: number;
  cooler: string;
  coolerWatts: number;
  storageCount: number;
  storageWatts: number;
  caseFansWatts: number;
  totalWatts: number;
  psuWattage: number;
  psuName: string;
  isOver80Percent: boolean;
  isOverloaded: boolean;
}

interface ComponentSegment {
  id: string;
  name: string;
  detail: string;
  watts: number;
  color: string;
  hoverColor: string;
  category: 'GPU' | 'CPU' | 'Motherboard' | 'RAM' | 'Storage' | 'Cooling';
}

export const PowerConsumptionChart: React.FC<PowerConsumptionChartProps> = ({
  gpuModel,
  gpuWatts,
  cpuModel,
  cpuWatts,
  moboWatts,
  ramCapacity,
  ramWatts,
  cooler,
  coolerWatts,
  storageCount,
  storageWatts,
  caseFansWatts,
  totalWatts,
  psuWattage,
  psuName,
  isOver80Percent,
  isOverloaded
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [activeHoveredId, setActiveHoveredId] = useState<string | null>(null);
  const [showTransientSim, setShowTransientSim] = useState<boolean>(false);

  // Measure container width with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Component Segments Breakdown
  const segments: ComponentSegment[] = useMemo(() => {
    return [
      {
        id: 'gpu',
        name: 'Graphics Card (GPU)',
        detail: `${gpuModel} (TGP Rating)`,
        watts: gpuWatts,
        color: '#06b6d4', // cyan-500
        hoverColor: '#22d3ee',
        category: 'GPU'
      },
      {
        id: 'cpu',
        name: 'Processor (CPU)',
        detail: `${cpuModel} (TDP Package)`,
        watts: cpuWatts,
        color: '#8b5cf6', // violet-500
        hoverColor: '#a78bfa',
        category: 'CPU'
      },
      {
        id: 'mobo',
        name: 'Motherboard & PCIe Bus',
        detail: 'VRM dissipation & chipset controller',
        watts: moboWatts,
        color: '#3b82f6', // blue-500
        hoverColor: '#60a5fa',
        category: 'Motherboard'
      },
      {
        id: 'ram',
        name: 'System Memory (RAM)',
        detail: `${ramCapacity}GB High-Speed DDR Modules`,
        watts: ramWatts,
        color: '#10b981', // emerald-500
        hoverColor: '#34d399',
        category: 'RAM'
      },
      {
        id: 'storage',
        name: 'Storage Subsystem',
        detail: `${storageCount}x NVMe PCIe 4.0 SSDs`,
        watts: storageWatts,
        color: '#f59e0b', // amber-500
        hoverColor: '#fbbf24',
        category: 'Storage'
      },
      {
        id: 'cooling',
        name: 'Cooler & Chassis Fans',
        detail: `${cooler} + Case Aerodynamics`,
        watts: coolerWatts + caseFansWatts,
        color: '#ec4899', // pink-500
        hoverColor: '#f472b6',
        category: 'Cooling'
      }
    ];
  }, [gpuModel, gpuWatts, cpuModel, cpuWatts, moboWatts, ramCapacity, ramWatts, storageCount, storageWatts, cooler, coolerWatts, caseFansWatts]);

  // Transient spike estimate (Modern GPU spikes up to +70% on TGP)
  const transientSpikeWatts = Math.round(gpuWatts * 0.7);
  const effectiveTotalWatts = showTransientSim ? totalWatts + transientSpikeWatts : totalWatts;

  const maxContinuousSafeWatts = Math.round(psuWattage * 0.8);
  const headroomWatts = psuWattage - effectiveTotalWatts;
  const loadPercentage = Math.round((effectiveTotalWatts / psuWattage) * 1000) / 10;

  // D3 Chart Rendering
  useEffect(() => {
    if (!svgRef.current || containerWidth <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 32, right: 28, bottom: 44, left: 16 };
    const width = containerWidth - margin.left - margin.right;
    const height = 150;

    // Scale domain: from 0 up to max of (PSU * 1.15, effectiveTotal * 1.15, or 600)
    const maxDomain = Math.max(psuWattage * 1.15, effectiveTotalWatts * 1.15, 600);
    const xScale = d3.scaleLinear().domain([0, maxDomain]).range([0, width]);

    const g = svg
      .attr('width', containerWidth)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define gradients and filters
    const defs = svg.append('defs');

    // Striped pattern for remaining headroom or safe zone
    const pattern = defs
      .append('pattern')
      .attr('id', 'headroom-stripes')
      .attr('width', 8)
      .attr('height', 8)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternTransform', 'rotate(45)');

    pattern
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 8)
      .attr('stroke', '#3f3f46')
      .attr('stroke-width', 2);

    // Glow filter for threshold lines
    const glowFilter = defs.append('filter').attr('id', 'glow-amber');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // 1. Background Grid Lines
    const tickValues = xScale.ticks(Math.max(4, Math.floor(width / 80)));
    const gridGroup = g.append('g').attr('class', 'grid');

    gridGroup
      .selectAll('line.grid-line')
      .data(tickValues)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', 90)
      .attr('stroke', '#27272a')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);

    // 2. Reference Capacity Bar (Top Track)
    // 0 to 80% (Green / Cyan), 80% to 100% (Amber Warning), >100% (Red)
    const psuTrackY = 6;
    const psuTrackHeight = 16;

    // Safe 0-80% track
    g.append('rect')
      .attr('x', xScale(0))
      .attr('y', psuTrackY)
      .attr('width', Math.max(0, xScale(maxContinuousSafeWatts) - xScale(0)))
      .attr('height', psuTrackHeight)
      .attr('rx', 4)
      .attr('fill', '#059669')
      .attr('fill-opacity', 0.25)
      .attr('stroke', '#10b981')
      .attr('stroke-opacity', 0.4);

    // 80%-100% caution track
    g.append('rect')
      .attr('x', xScale(maxContinuousSafeWatts))
      .attr('y', psuTrackY)
      .attr('width', Math.max(0, xScale(psuWattage) - xScale(maxContinuousSafeWatts)))
      .attr('height', psuTrackHeight)
      .attr('fill', '#d97706')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#f59e0b')
      .attr('stroke-opacity', 0.5);

    // Label for PSU Capacity Track
    g.append('text')
      .attr('x', xScale(0) + 4)
      .attr('y', psuTrackY - 6)
      .attr('fill', '#71717a')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', '600')
      .text(`PSU RATED CAPACITY: ${psuWattage}W (80% CONTINUOUS CEILING: ${maxContinuousSafeWatts}W)`);

    // 3. Main Stacked Bar (Bottom Track)
    const barY = 32;
    const barHeight = 32;

    // Calculate stacked segment offsets
    let currentX = 0;
    const stackedData = segments.map((seg) => {
      const startX = currentX;
      currentX += seg.watts;
      return {
        ...seg,
        startX,
        endX: currentX,
        widthWatts: seg.watts
      };
    });

    // Render Component Segments
    const segmentGroup = g.append('g').attr('class', 'segments');

    stackedData.forEach((seg, index) => {
      const xPos = xScale(seg.startX);
      const segWidth = Math.max(0, xScale(seg.endX) - xPos);
      const isHovered = activeHoveredId === seg.id;
      const isFirst = index === 0;
      const isLast = index === stackedData.length - 1 && !showTransientSim;

      const rect = segmentGroup
        .append('rect')
        .attr('x', xPos)
        .attr('y', barY)
        .attr('width', 0) // animate from 0
        .attr('height', barHeight)
        .attr('fill', isHovered ? seg.hoverColor : seg.color)
        .attr('rx', isFirst ? 6 : isLast ? 6 : 0)
        .attr('stroke', '#18181b')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .style('transition', 'fill 0.2s ease');

      // Animate width
      rect.transition().duration(500).ease(d3.easeCubicOut).attr('width', segWidth);

      // Label inside segment if width is sufficient (>38px)
      if (segWidth > 42) {
        segmentGroup
          .append('text')
          .attr('x', xPos + segWidth / 2)
          .attr('y', barY + barHeight / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#09090b')
          .attr('font-size', segWidth > 70 ? '11px' : '9.5px')
          .attr('font-family', 'ui-monospace, monospace')
          .attr('font-weight', '800')
          .style('pointer-events', 'none')
          .text(`${seg.category} ${seg.watts}W`);
      }

      // Event handlers
      rect
        .on('mouseenter', () => setActiveHoveredId(seg.id))
        .on('mouseleave', () => setActiveHoveredId(null));
    });

    // Transient Spike Extension (if active)
    if (showTransientSim) {
      const transX = xScale(totalWatts);
      const transWidth = xScale(totalWatts + transientSpikeWatts) - transX;

      segmentGroup
        .append('rect')
        .attr('x', transX)
        .attr('y', barY)
        .attr('width', transWidth)
        .attr('height', barHeight)
        .attr('fill', '#ef4444')
        .attr('fill-opacity', 0.85)
        .attr('stroke', '#b91c1c')
        .attr('stroke-width', 1.5)
        .attr('rx', 4);

      if (transWidth > 45) {
        segmentGroup
          .append('text')
          .attr('x', transX + transWidth / 2)
          .attr('y', barY + barHeight / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '10px')
          .attr('font-family', 'ui-monospace, monospace')
          .attr('font-weight', '800')
          .text(`+${transientSpikeWatts}W SPIKE`);
      }
    }

    // Remaining Headroom Zone on the bar (if total < psuWattage)
    if (effectiveTotalWatts < psuWattage) {
      const hrX = xScale(effectiveTotalWatts);
      const hrWidth = xScale(psuWattage) - hrX;

      segmentGroup
        .append('rect')
        .attr('x', hrX)
        .attr('y', barY)
        .attr('width', hrWidth)
        .attr('height', barHeight)
        .attr('fill', 'url(#headroom-stripes)')
        .attr('stroke', '#52525b')
        .attr('stroke-dasharray', '2,2')
        .attr('rx', 4);

      if (hrWidth > 55) {
        segmentGroup
          .append('text')
          .attr('x', hrX + hrWidth / 2)
          .attr('y', barY + barHeight / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#a1a1aa')
          .attr('font-size', '10px')
          .attr('font-family', 'ui-monospace, monospace')
          .attr('font-weight', '700')
          .text(`+${headroomWatts}W BUFFER`);
      }
    }

    // 4. Vertical Reference Markers:
    // 80% Continuous Safe Threshold Line
    const safe80X = xScale(maxContinuousSafeWatts);
    const lineGroup = g.append('g').attr('class', 'reference-lines');

    lineGroup
      .append('line')
      .attr('x1', safe80X)
      .attr('x2', safe80X)
      .attr('y1', 0)
      .attr('y2', barY + barHeight + 14)
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,3')
      .attr('filter', 'url(#glow-amber)');

    // 80% Tag pill on top
    lineGroup
      .append('rect')
      .attr('x', Math.min(width - 70, Math.max(0, safe80X - 35)))
      .attr('y', -24)
      .attr('width', 72)
      .attr('height', 18)
      .attr('rx', 4)
      .attr('fill', '#78350f')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1);

    lineGroup
      .append('text')
      .attr('x', Math.min(width - 70, Math.max(0, safe80X - 35)) + 36)
      .attr('y', -11)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fde68a')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', '700')
      .text('80% CEILING');

    // 100% PSU Capacity Line
    const psu100X = xScale(psuWattage);
    lineGroup
      .append('line')
      .attr('x1', psu100X)
      .attr('x2', psu100X)
      .attr('y1', 0)
      .attr('y2', barY + barHeight + 14)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '2,2');

    lineGroup
      .append('rect')
      .attr('x', Math.min(width - 75, Math.max(0, psu100X - 38)))
      .attr('y', -24)
      .attr('width', 76)
      .attr('height', 18)
      .attr('rx', 4)
      .attr('fill', '#450a0a')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1);

    lineGroup
      .append('text')
      .attr('x', Math.min(width - 75, Math.max(0, psu100X - 38)) + 38)
      .attr('y', -11)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fca5a5')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', '700')
      .text(`${psuWattage}W (100%)`);

    // Total System Draw Marker Needle
    const totalX = xScale(effectiveTotalWatts);
    lineGroup
      .append('line')
      .attr('x1', totalX)
      .attr('x2', totalX)
      .attr('y1', barY - 6)
      .attr('y2', barY + barHeight + 6)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5);

    // Indicator bubble for Current Total Load
    lineGroup
      .append('circle')
      .attr('cx', totalX)
      .attr('cy', barY + barHeight + 8)
      .attr('r', 4)
      .attr('fill', isOverloaded ? '#ef4444' : isOver80Percent ? '#f59e0b' : '#10b981');

    // 5. Bottom Axis
    const axisGroup = g.append('g').attr('transform', `translate(0, ${barY + barHeight + 18})`);

    const axis = d3
      .axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat((d) => `${d}W`);

    axisGroup
      .call(axis)
      .call((g) => g.select('.domain').attr('stroke', '#3f3f46'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#3f3f46'))
      .call((g) =>
        g
          .selectAll('.tick text')
          .attr('fill', '#a1a1aa')
          .attr('font-size', '10px')
          .attr('font-family', 'ui-monospace, monospace')
      );
  }, [containerWidth, segments, totalWatts, psuWattage, maxContinuousSafeWatts, effectiveTotalWatts, isOver80Percent, isOverloaded, showTransientSim, activeHoveredId, transientSpikeWatts, headroomWatts]);

  const activeSegment = segments.find((s) => s.id === activeHoveredId);

  return (
    <div
      ref={containerRef}
      className="rounded-2xl bg-zinc-950 border border-zinc-800/90 p-5 space-y-4 shadow-xl backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Real-Time Power Consumption Breakdown (D3 Visualization)
            </h4>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">
            Direct silicon power dissipation vs chosen {psuWattage}W PSU rating
          </p>
        </div>

        {/* Transient Spike Simulator Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTransientSim(!showTransientSim)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              showTransientSim
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
            }`}
            title="Simulate sub-millisecond GPU transient spike excursion (+70% GPU load)"
          >
            <Sparkles className={`w-3.5 h-3.5 ${showTransientSim ? 'text-rose-400 animate-pulse' : 'text-zinc-400'}`} />
            <span>Simulate GPU Transient Spike (+{transientSpikeWatts}W)</span>
          </button>
        </div>
      </div>

      {/* Real-Time Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block">Total Active Consumption</span>
          <div className="text-lg font-black text-white mt-0.5">
            ~{effectiveTotalWatts}W
            {showTransientSim && (
              <span className="text-[10px] text-rose-400 font-normal ml-1">
                (includes {transientSpikeWatts}W spike)
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-500">Peak Gaming Workload</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block">Chosen PSU Rating</span>
          <div className="text-lg font-black text-amber-400 mt-0.5">{psuWattage}W</div>
          <span className="text-[10px] text-zinc-500">80% Cap: {maxContinuousSafeWatts}W</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block">Current Continuous Load</span>
          <div
            className={`text-lg font-black mt-0.5 ${
              loadPercentage > 100
                ? 'text-rose-400'
                : loadPercentage > 80
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {loadPercentage}%
          </div>
          <span className="text-[10px] text-zinc-500">
            {loadPercentage > 80 ? 'Breaches 80% Rule' : 'Safely Headroomed'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block">Headroom Margin</span>
          <div
            className={`text-lg font-black mt-0.5 ${
              headroomWatts < 0
                ? 'text-rose-400'
                : headroomWatts < psuWattage * 0.2
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {headroomWatts >= 0 ? `+${headroomWatts}W` : `${headroomWatts}W (DEFICIT)`}
          </div>
          <span className="text-[10px] text-zinc-500">
            {headroomWatts >= 0 ? `${(100 - loadPercentage).toFixed(1)}% buffer remaining` : 'Immediate trip danger'}
          </span>
        </div>
      </div>

      {/* D3 SVG Canvas */}
      <div className="w-full overflow-x-auto pt-4 pb-1">
        <svg ref={svgRef} className="w-full select-none overflow-visible" />
      </div>

      {/* Interactive Hover Inspection Panel */}
      {activeSegment ? (
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 font-mono text-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: activeSegment.color }} />
            <div>
              <span className="font-bold text-white">{activeSegment.name}:</span>{' '}
              <span className="text-zinc-300">{activeSegment.detail}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-white font-bold">{activeSegment.watts} Watts</span>
            <span className="text-cyan-400">
              {(totalWatts > 0 ? (activeSegment.watts / totalWatts) * 100 : 0).toFixed(1)}% of System Load
            </span>
            <span className="text-amber-400">
              {(psuWattage > 0 ? (activeSegment.watts / psuWattage) * 100 : 0).toFixed(1)}% of PSU Capacity
            </span>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
          <span>Tip: Hover over any stacked component segment on the D3 chart to inspect its individual power share.</span>
          <span className="text-zinc-500 hidden sm:inline">D3 SVG Vector Engine</span>
        </div>
      )}

      {/* Interactive Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 font-mono text-xs">
        {segments.map((seg) => {
          const isSelected = activeHoveredId === seg.id;
          const share = ((seg.watts / totalWatts) * 100).toFixed(0);
          return (
            <button
              key={seg.id}
              type="button"
              onMouseEnter={() => setActiveHoveredId(seg.id)}
              onMouseLeave={() => setActiveHoveredId(null)}
              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-800 border-zinc-600 shadow-md'
                  : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[11px] font-bold text-zinc-200 truncate">{seg.category}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between text-[10px]">
                <span className="font-extrabold text-white">{seg.watts}W</span>
                <span className="text-zinc-400">{share}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
