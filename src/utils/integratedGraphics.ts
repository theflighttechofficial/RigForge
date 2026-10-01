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
    const isLaptop = !cpu.Socket.startsWith('LGA');
    if (arch.includes('arrow lake-s')) {
      name = 'Intel Graphics 4 Xe-core (iGPU)';
      tier = 20;
    } else if (arch.includes('arrow lake') || arch.includes('meteor lake') || arch.includes('lunar lake')) {
      name = 'Intel Arc Graphics (iGPU)';
      tier = 38;
    } else if ((arch.includes('alder lake') || arch.includes('raptor lake')) && isLaptop && !arch.includes('-hx')) {
      name = 'Intel Iris Xe Graphics 96EU (iGPU)';
      tier = 18;
    } else if (arch.includes('alder lake') || arch.includes('raptor lake')) {
      // Desktop parts and HX laptops use the 32EU UHD block
      name = isLaptop ? 'Intel UHD Graphics 32EU (iGPU)' : 'Intel UHD Graphics 770 (iGPU)';
      tier = 12;
    } else if (arch.includes('tiger lake') || arch.includes('ice lake')) {
      name = 'Intel Iris Xe Graphics (iGPU)';
      tier = 18;
    } else if (arch.includes('rocket lake')) {
      name = 'Intel UHD Graphics 750 (iGPU)';
      tier = 9;
    } else if (arch.includes('comet lake') || arch.includes('coffee lake') || arch.includes('kaby lake')) {
      name = arch.includes('kaby lake') ? 'Intel HD Graphics 630 (iGPU)' : 'Intel UHD Graphics 630 (iGPU)';
      tier = 6;
    } else if (arch.includes('haswell')) {
      name = 'Intel HD Graphics 4600 (iGPU)';
      tier = 4;
    } else if (arch.includes('sandy bridge') || arch.includes('ivy bridge')) {
      name = arch.includes('ivy') ? 'Intel HD Graphics 4000 (iGPU)' : 'Intel HD Graphics 3000 (iGPU)';
      tier = 2;
    } else {
      name = 'Intel HD / UHD Graphics (iGPU)';
      tier = 10;
    }
  } else if (cpu.Brand === 'AMD') {
    const isApu = /\d{4}G\b/i.test(cpu.Model) || /phoenix|hawk|strix|rembrandt|cezanne|renoir/.test(arch);
    if (arch.includes('dragon range') || arch.includes('fire range')) {
      name = 'AMD Radeon 610M (iGPU)';
      tier = 10;
    } else if (cpu.Socket === 'AM5' && !isApu) {
      // Desktop Ryzen 7000/9000 (Raphael / Granite Ridge) carry only a 2-CU display iGPU
      name = 'AMD Radeon Graphics 2CU (iGPU)';
      tier = 10;
    } else if (arch.includes('strix') || arch.includes('zen 5')) {
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
    // Calibrated so a Radeon 780M (tier 40) lands near a GTX 1650 in the catalog
    Benchmark_Score: tier * 200,
    Gaming_Score: tier * 195,
    RayTracing_Score: Math.round(tier * 60),
    Compute_Score: tier * 180,
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
    Description: `No discrete GPU installed, rendering handled entirely by ${cpu.Model}'s built-in graphics, sharing system RAM as VRAM.`
  };
}
