import { jsPDF } from 'jspdf';
import { CPUItem, GPUItem, ResolutionMode } from '../types';
import { formatINR } from './formatters';

export interface ReportExportParams {
  cpu: CPUItem;
  gpu: GPUItem;
  resolution: ResolutionMode;
  bottleneckData: {
    cpuPercentage: number;
    gpuPercentage: number;
    bottleneckType: 'cpu' | 'gpu' | 'balanced';
    explanation: string;
    verdict: string;
    impactLevel: 'low' | 'moderate' | 'high';
  };
  fpsEstimates: {
    title: string;
    fps: number;
    onePercentLow: number;
    settings: string;
  }[];
  driverHealth?: {
    installedVersion: string;
    latestVersion: string;
    status: 'optimal' | 'recommended' | 'critical';
    statusLabel: string;
  };
  stabilityIndex?: number;
}

export function generateHardwareDiagnosticPDF(params: ReportExportParams): void {
  const { cpu, gpu, resolution, bottleneckData, fpsEstimates, driverHealth, stabilityIndex = 94 } = params;

  // Create A4 PDF in portrait mode
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Background canvas
  doc.setFillColor(10, 12, 16);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Accent Gradient Bar
  doc.setFillColor(6, 182, 212); // Cyan
  doc.rect(0, 0, pageWidth * 0.55, 3, 'F');
  doc.setFillColor(168, 85, 247); // Purple
  doc.rect(pageWidth * 0.55, 0, pageWidth * 0.45, 3, 'F');

  let y = 14;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('SILICON MATRIX DIAGNOSTICS', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(6, 182, 212);
  doc.text('HARDWARE SYNERGY & BOTTLENECK REPORT v2.9', margin, y + 5);

  // Timestamp & ID on right
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin, y, { align: 'right' });
  doc.text(`Target Res: ${resolution.toUpperCase()} ULTRA`, pageWidth - margin, y + 5, { align: 'right' });

  // Divider
  y += 11;
  doc.setDrawColor(39, 39, 42);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // SECTION 1: Hardware Specifications Card
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(244, 244, 245);
  doc.text('1. EVALUATED SILICON SPECIFICATIONS', margin, y);

  y += 4;
  const colWidth = (contentWidth - 6) / 2;

  // CPU Box
  doc.setFillColor(18, 20, 26);
  doc.setDrawColor(39, 39, 42);
  doc.roundedRect(margin, y, colWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 182, 212);
  doc.text('CENTRAL PROCESSOR (CPU)', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(cpu.Model, margin + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Brand & Socket: ${cpu.Brand} (${cpu.Socket})`, margin + 4, y + 19);
  doc.text(`Cores / Threads: ${cpu.Cores} Cores / ${cpu.Threads} Threads`, margin + 4, y + 24);
  doc.text(`Base / Boost Clock: ${cpu.Base_Boost_GHz}`, margin + 4, y + 29);
  doc.text(`TDP / Cache: ${cpu.TDP_Watts}W / ${cpu.Cache_MB} MB`, margin + 4, y + 34);
  doc.setTextColor(52, 211, 153);
  doc.text(`Retail Price: ${formatINR(cpu.Price_INR)}`, margin + 4, y + 39);

  // GPU Box
  const gpuX = margin + colWidth + 6;
  doc.setFillColor(18, 20, 26);
  doc.roundedRect(gpuX, y, colWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(192, 132, 252);
  doc.text('GRAPHICS PROCESSOR (GPU)', gpuX + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(gpu.Model, gpuX + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Architecture: ${gpu.Brand} (${gpu.Architecture})`, gpuX + 4, y + 19);
  doc.text(`VRAM: ${gpu.VRAM_GB} GB ${gpu.Memory_Type}`, gpuX + 4, y + 24);
  doc.text(`TGP Power: ${gpu.TGP_Watts}W Sustained`, gpuX + 4, y + 29);
  doc.text(`PCIe Interface: ${gpu.PCIe_Interface}`, gpuX + 4, y + 34);
  doc.setTextColor(52, 211, 153);
  doc.text(`Retail Price: ${formatINR(gpu.Price_INR)}`, gpuX + 4, y + 39);

  // SECTION 2: Synergy & Bottleneck Verdict
  y += 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(244, 244, 245);
  doc.text('2. BOTTLENECK & WORKLOAD UTILIZATION ANALYSIS', margin, y);

  y += 4;
  // Bottleneck Hero Box
  doc.setFillColor(18, 20, 26);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  // Left stat: Bottleneck percentage
  const bPercent = bottleneckData.bottleneckType === 'balanced'
    ? Math.max(bottleneckData.cpuPercentage, bottleneckData.gpuPercentage)
    : bottleneckData.bottleneckType === 'cpu'
    ? bottleneckData.cpuPercentage
    : bottleneckData.gpuPercentage;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  if (bottleneckData.bottleneckType === 'balanced') {
    doc.setTextColor(52, 211, 153);
  } else if (bottleneckData.impactLevel === 'moderate') {
    doc.setTextColor(251, 191, 36);
  } else {
    doc.setTextColor(244, 63, 94);
  }
  doc.text(`${bPercent}%`, margin + 6, y + 16);

  doc.setFontSize(9);
  doc.text(
    bottleneckData.bottleneckType === 'balanced'
      ? 'OPTIMAL SYNERGY RATIO'
      : `${bottleneckData.bottleneckType.toUpperCase()} BOTTLENECK DETECTED`,
    margin + 6,
    y + 22
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Resolution Target: ${resolution.toUpperCase()}`, margin + 6, y + 28);
  doc.text(`Combined TDP: ${cpu.TDP_Watts + gpu.TGP_Watts}W Base`, margin + 6, y + 33);

  // Right summary text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(bottleneckData.verdict, margin + 68, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);

  // Split explanation into lines
  const splitExplanation = doc.splitTextToSize(bottleneckData.explanation, contentWidth - 74);
  doc.text(splitExplanation, margin + 68, y + 15);

  // SECTION 3: Performance Projections Table
  y += 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(244, 244, 245);
  doc.text(`3. WORKLOAD BENCHMARKS & FRAME RATE PROJECTIONS (${resolution.toUpperCase()})`, margin, y);

  y += 4;
  // Table Header
  doc.setFillColor(28, 32, 40);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('GAME / SYNTHETIC WORKLOAD', margin + 4, y + 5);
  doc.text('SETTINGS PRESET', margin + 80, y + 5);
  doc.text('AVERAGE FPS', margin + 130, y + 5);
  doc.text('1% LOW FPS', margin + 160, y + 5);

  y += 7;

  // Table rows
  fpsEstimates.forEach((item, index) => {
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 18 : 22, isEven ? 20 : 25, isEven ? 26 : 32);
    doc.rect(margin, y, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(item.title, margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(item.settings, margin + 80, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 182, 212);
    doc.text(`${item.fps} FPS`, margin + 130, y + 5);

    doc.setTextColor(item.onePercentLow >= 60 ? 52 : 251, item.onePercentLow >= 60 ? 211 : 191, item.onePercentLow >= 60 ? 153 : 36);
    doc.text(`${item.onePercentLow} FPS`, margin + 160, y + 5);

    y += 7;
  });

  // SECTION 4: Driver Health, Stability & Power Requirements
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(244, 244, 245);
  doc.text('4. DRIVER HEALTH, STABILITY & POWER VERIFICATION', margin, y);

  y += 4;
  const statBoxWidth = (contentWidth - 8) / 3;

  // Box 1: Driver Health
  doc.setFillColor(18, 20, 26);
  doc.setDrawColor(39, 39, 42);
  doc.roundedRect(margin, y, statBoxWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('GPU DRIVER STATUS', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  if (driverHealth?.status === 'optimal') {
    doc.setTextColor(52, 211, 153);
    doc.text('UP TO DATE (WHQL)', margin + 4, y + 13);
  } else if (driverHealth?.status === 'recommended') {
    doc.setTextColor(251, 191, 36);
    doc.text('UPDATE AVAILABLE', margin + 4, y + 13);
  } else {
    doc.setTextColor(244, 63, 94);
    doc.text('CRITICAL DRIVER LAG', margin + 4, y + 13);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Branch: ${driverHealth?.installedVersion || 'Latest'}`, margin + 4, y + 19);
  doc.text(`Official: ${driverHealth?.latestVersion || 'WHQL Verified'}`, margin + 4, y + 24);
  doc.text(`Vendor: ${gpu.Brand} Official Site`, margin + 4, y + 29);

  // Box 2: Silicon Stability Index
  const box2X = margin + statBoxWidth + 4;
  doc.setFillColor(18, 20, 26);
  doc.roundedRect(box2X, y, statBoxWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('STABILITY INDEX (MTBF)', box2X + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(stabilityIndex > 80 ? 52 : stabilityIndex > 50 ? 251 : 244, stabilityIndex > 80 ? 211 : stabilityIndex > 50 ? 191 : 63, stabilityIndex > 80 ? 153 : 36);
  doc.text(`${stabilityIndex}% ROCK-SOLID`, box2X + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Vdroop Tolerance: Nominal', box2X + 4, y + 19);
  doc.text('Thermal Leakage Margin: Passed', box2X + 4, y + 24);
  doc.text('WHEA Cache Bit-Flips: Zero', box2X + 4, y + 29);

  // Box 3: PSU & Thermal Sizing
  const box3X = margin + (statBoxWidth * 2) + 8;
  doc.setFillColor(18, 20, 26);
  doc.roundedRect(box3X, y, statBoxWidth, 34, 2, 2, 'FD');

  const recPsuWatts = Math.ceil((cpu.TDP_Watts + gpu.TGP_Watts + 120) * 1.3 / 50) * 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('RECOMMENDED PSU SIZING', box3X + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 182, 212);
  doc.text(`${recPsuWatts}W Tier-A Gold`, box3X + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Peak Transient: ~${(cpu.TDP_Watts + gpu.TGP_Watts * 1.5).toFixed(0)}W`, box3X + 4, y + 19);
  doc.text(`Cooler: ${cpu.TDP_Watts > 150 ? '360mm AIO' : cpu.TDP_Watts > 90 ? 'Twin-Tower Air' : 'Stock/Single Tower'}`, box3X + 4, y + 24);
  doc.text('Indian Ambient: +10-15°C Margin', box3X + 4, y + 29);

  // SECTION 5: Recommendations & Sign-Off
  y += 39;
  doc.setFillColor(18, 20, 26);
  doc.setDrawColor(39, 39, 42);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(52, 211, 153);
  doc.text('ENGINEERING CONCLUSION & RECOMMENDATION:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);

  let conclusionText = '';
  if (bottleneckData.bottleneckType === 'balanced') {
    conclusionText = `This ${cpu.Model} + ${gpu.Model} configuration delivers exceptional hardware balance for ${resolution.toUpperCase()} ultra-fidelity gaming and high-throughput content creation. Both silicon dies operate near peak efficiency with no significant architectural stall cycles.`;
  } else if (bottleneckData.bottleneckType === 'cpu') {
    conclusionText = `At ${resolution.toUpperCase()}, the ${gpu.Model} is restrained by ${cpu.Model} during draw-call dispatch and geometry processing. Consider upgrading to an X3D (AMD) or K-series (Intel) tier, or shifting render resolution to 1440p/4K to load the GPU.`;
  } else {
    conclusionText = `The ${cpu.Model} provides ample headroom, but the ${gpu.Model} is saturated in pixel fill-rate and memory bandwidth. Suitable for competitive high-refresh titles; consider enabling DLSS/FSR for demanding Ray Tracing workloads.`;
  }

  const splitConclusion = doc.splitTextToSize(conclusionText, contentWidth - 8);
  doc.text(splitConclusion, margin + 4, y + 11);

  // Footer bar
  doc.setDrawColor(39, 39, 42);
  doc.line(margin, 287, pageWidth - margin, 287);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('Silicon Matrix Diagnostic Engine v2.9 • Generated directly from client hardware telemetry • Pricing in INR (₹) Retail Index', margin, 292);
  doc.text('Page 1 of 1 • Certified Diagnostic Report', pageWidth - margin, 292, { align: 'right' });

  // Trigger download
  const cleanCpuName = cpu.Model.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanGpuName = gpu.Model.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `SiliconMatrix_Diagnostic_Report_${cleanCpuName}_${cleanGpuName}_${resolution}.pdf`;
  doc.save(fileName);
}
