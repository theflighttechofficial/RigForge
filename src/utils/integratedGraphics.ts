import { CPUItem, GPUItem } from '../types';

/**
 * Builds a synthetic "GPU" record from a CPU's integrated graphics so any component that
 * already renders/costs a discrete GPUItem can transparently render an iGPU-only build
 * instead. VRAM/TGP/price are 0 (shared with the CPU package / system RAM), so downstream
 * wattage and cost math automatically drops the discrete-GPU line item.
 */
export function buildIntegratedGpu(cpu: CPUItem): GPUItem | null {
  if (!cpu.Has_iGPU) return null;
  const arch = cpu.Architecture.toLowerCase();
  let name = 'Integrated Graphics';
  let tier = 30;

  if (cpu.Brand === 'Intel') {
    if (arch.includes('arrow lake') || arch.includes('meteor lake') || arch.includes('lunar lake')) {
      name = 'Intel Arc Graphics (iGPU)';
      tier = 45;
    } else if (arch.includes('alder lake') || arch.includes('raptor lake')) {
      name = 'Intel UHD Graphics 770 (iGPU)';
      tier = 20;
    } else {
      name = 'Intel Iris Xe Graphics (iGPU)';
      tier = 28;
    }
  } else if (cpu.Brand === 'AMD') {
    if (arch.includes('strix') || arch.includes('zen 5')) {
      name = 'AMD Radeon 890M (iGPU)';
      tier = 48;
    } else if (arch.includes('phoenix') || arch.includes('zen 4')) {
      name = 'AMD Radeon 780M (iGPU)';
      tier = 40;
    } else {
      name = 'AMD Radeon Vega Graphics (iGPU)';
      tier = 22;
    }
  }

  return {
    id: `igpu-${cpu.id}`,
    category: 'GPU',
    Model: name,
    Brand: cpu.Brand === 'AMD' ? 'AMD' : 'Intel',
    Architecture: `${cpu.Architecture} (shared die)`,
    ReleaseYear: cpu.ReleaseYear,
    Era: cpu.Era,
    Price_INR: 0,
    Price_USD: 0,
    Benchmark_Score: tier * 400,
    Gaming_Score: tier * 380,
    RayTracing_Score: Math.round(tier * 120),
    Compute_Score: tier * 350,
    VRAM_GB: 0,
    Memory_Type: 'Shared System RAM',
    Bus_Width_Bit: 128,
    Bandwidth_GBs: 51,
    TGP_Watts: 0,
    Recommended_PSU_Watts: 450,
    PCIe_Interface: 'On-die (no slot)',
    Length_mm: 0,
    RadarScores: {
      esports1080p: tier,
      raster1440p4k: Math.round(tier * 0.5),
      rayTracing: Math.round(tier * 0.35),
      videoEditing: Math.round(tier * 0.7),
      render3D: Math.round(tier * 0.6),
      aiCompute: Math.round(tier * 0.8)
    },
    Description: `No discrete GPU installed — rendering handled entirely by ${cpu.Model}'s built-in graphics, sharing system RAM as VRAM.`
  };
}
