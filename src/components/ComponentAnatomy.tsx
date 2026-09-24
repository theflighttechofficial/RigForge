import React, { useState } from 'react';
import {
  Cpu,
  Monitor,
  Layers,
  HardDrive,
  Zap,
  Fan,
  Box,
  Laptop,
  Keyboard,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Microchip,
  Thermometer,
  Gauge,
  Activity
} from 'lucide-react';

interface ComponentSection {
  id: string;
  name: string;
  shortName: string;
  category: string;
  icon: React.FC<{ className?: string }>;
  tagline: string;
  color: string;
  accentBg: string;
  beginnerExplanation: {
    analogy: string;
    whatItDoes: string;
    keySpecsToLookFor: string[];
    howMuchToSpend: string;
  };
  deepTechnical: {
    siliconArchitecture: string;
    howItWorksAtPhysicalLevel: string;
    advancedMetrics: { name: string; value: string; desc: string }[];
    engineeringTradeoffs: string;
  };
  buyingTraps: string[];
  proTips: string[];
}

const PC_COMPONENTS_DATA: ComponentSection[] = [
  {
    id: 'cpu',
    name: 'Central Processing Unit (CPU)',
    shortName: 'CPU',
    category: 'Core Compute',
    icon: Cpu,
    tagline: 'The brain and master conductor of the PC that coordinates all operations and logic.',
    color: 'text-cyan-400',
    accentBg: 'bg-cyan-950/60 border-cyan-500/40',
    beginnerExplanation: {
      analogy: 'Think of the CPU like the master chef in a busy restaurant kitchen. Even if the kitchen has giant storage freezers and ovens, the chef decides what gets cooked, in what order, and directs all the assistants.',
      whatItDoes: 'Executes software instructions, calculates game physics and AI paths, coordinates data transfers between your graphics card and memory, and runs your operating system.',
      keySpecsToLookFor: [
        'Cores & Threads: Cores are physical processors; threads let each core handle two tasks at once (Hyperthreading/SMT). 6 cores is great for gaming; 8-16 for heavy content creation.',
        'Clock Speed (GHz): How many billions of clock cycles the chip completes per second (e.g., 5.0 GHz = 5 billion cycles/sec).',
        'L3 Cache (MB): Super-fast memory built right onto the chip die. High cache (like AMD 3D V-Cache) dramatically boosts gaming frame rates.'
      ],
      howMuchToSpend: '15% to 25% of your total PC budget. For gaming, an AMD Ryzen 5 or 7, or Intel Core i5/i7 hits the sweet spot.'
    },
    deepTechnical: {
      siliconArchitecture: 'Modern x86-64 processors utilize complex superscalar out-of-order execution pipelines with branch predictors, instruction decoders, and integer/floating-point arithmetic logic units (ALUs). Chips are manufactured on advanced 3nm–5nm FinFET or GAA (Gate-All-Around) lithography nodes.',
      howItWorksAtPhysicalLevel: 'At the physical level, billions of microscopic transistors switch electrical voltages on and off billions of times per second. Cache hierarchy (L1 at ~1ns latency, L2 at ~3-4ns, L3 at ~10-12ns) prevents the CPU execution units from starving for data, as retrieving instructions from system DRAM takes ~60-70ns.',
      advancedMetrics: [
        { name: 'IPC (Instructions Per Clock)', value: '+15-20% per gen', desc: 'Measures architectural efficiency regardless of frequency.' },
        { name: 'TDP / PL2 Peak Watts', value: '65W - 253W', desc: 'Thermal Design Power and short-duration power limits (Tau window).' },
        { name: 'V-Cache Stacking', value: '3D TSV Direct Bonding', desc: 'Direct copper-to-copper micro-bumps stacking 64MB+ SRAM directly over CCD logic.' }
      ],
      engineeringTradeoffs: 'Higher clock speeds and core counts demand exponentially more voltage ($V^2 \\times f$), creating extreme heat densities that require high-performance thermal throttling mechanisms ($T_j \\text{ Max}$ at 95°C-100°C).'
    },
    buyingTraps: [
      'Buying an expensive high-end CPU but pairing it with a cheap GPU for gaming — you will be GPU bottlenecked at 1440p and 4K.',
      'Buying a power-hungry 200W+ CPU without buying a capable cooler or putting it on an uncooled budget motherboard that throttles its VRMs.',
      'Assuming more cores automatically means faster gaming. Single-core speed and L3 cache often matter much more than having 24 cores in games.'
    ],
    proTips: [
      'For purely gaming builds, chips with AMD 3D V-Cache (e.g. 7800X3D, 9800X3D) often outperform CPUs costing twice as much.',
      'Don’t forget that Intel "F" suffix CPUs (e.g. 14400F) lack integrated graphics and require a dedicated GPU to output a display.'
    ]
  },
  {
    id: 'gpu',
    name: 'Graphics Processing Unit (GPU / Video Card)',
    shortName: 'GPU',
    category: 'Visual Compute',
    icon: Monitor,
    tagline: 'The visual engine designed with thousands of parallel cores to render 3D graphics and compute AI matrices.',
    color: 'text-purple-400',
    accentBg: 'bg-purple-950/60 border-purple-500/40',
    beginnerExplanation: {
      analogy: 'While the CPU is one genius mathematician who solves one very hard problem at a time, the GPU is an army of 10,000 workers who each paint one pixel simultaneously.',
      whatItDoes: 'Draws every 3D polygon, shadow, texture, and light ray on your screen 60 to 360 times per second. Also powers video editing rendering and local AI models (Stable Diffusion, LLMs).',
      keySpecsToLookFor: [
        'VRAM (Video RAM in GB): The graphics card’s private memory. 8GB is bare minimum today; 12GB–16GB is recommended for modern 1440p and 4K AAA titles.',
        'Architecture: Generation matters more than model numbers (e.g., Ada Lovelace, RDNA 3, Blackwell). Newer architectures bring DLSS 3, AV1 encoding, and better ray tracing.',
        'Power Consumption (TGP): How many watts the card draws under full gaming load (e.g., 115W to 450W).'
      ],
      howMuchToSpend: '35% to 50% of your total budget for a dedicated gaming PC. It has the single highest impact on in-game visual fidelity and frame rate.'
    },
    deepTechnical: {
      siliconArchitecture: 'GPUs comprise arrays of Streaming Multiprocessors (SMs on NVIDIA) or Compute Units (CUs on AMD). Each block contains SIMD (Single Instruction, Multiple Data) pipelines, dedicated BVH Ray Tracing traversal cores, and matrix Tensor/XMX units for FP8/FP16 AI tensor math.',
      howItWorksAtPhysicalLevel: 'Vertex shaders transform 3D coordinates into camera space, the rasterizer converts triangles into fragments, and pixel shaders compute lighting, textures, and normal mapping. GDDR6/GDDR6X/GDDR7 memory runs across wide 128-bit to 384-bit buses at up to 28 Gbps, feeding terabytes of raw bandwidth per second.',
      advancedMetrics: [
        { name: 'Memory Bandwidth', value: '288 to 1,008 GB/s', desc: 'Raw throughput feeding textures and framebuffers to shaders.' },
        { name: 'Ray Tracing BVH Acceleration', value: 'Dedicated RT Hardware', desc: 'Hardware box and triangle intersection testing bypassing general compute shaders.' },
        { name: 'Tensor/AI TFLOPs', value: 'Up to 1,300+ AI TOPS', desc: 'Powers neural upscaling (DLSS 3.7 / FSR 3 / XeSS) and frame interpolation.' }
      ],
      engineeringTradeoffs: 'High-speed GDDR6X and GDDR7 memories run very hot (~85°C–105°C junction) and draw significant power. Card cooling solutions often weigh 1.5kg–2.2kg, requiring anti-sag brackets to prevent PCIe slot damage.'
    },
    buyingTraps: [
      'Buying an 8GB VRAM card for high-end 1440p or 4K gaming in 2024–2026. High-res textures will overflow system RAM, causing stuttering.',
      'Not checking physical card length against your cabinet — modern 3-fan GPUs can be 300mm–340mm long and won’t fit in budget cases.',
      'Buying a monster GPU without checking if your power supply has the necessary PCIe 8-pin or ATX 3.0 12V-2x6 connectors.'
    ],
    proTips: [
      'If you play competitive esports titles (CS2, Valorant, Apex), you want high raster frame rates and low input latency (NVIDIA Reflex / AMD Anti-Lag).',
      'For 4K gaming with ray tracing enabled, DLSS Frame Generation or FSR 3 can double perceived smoothness without adding excessive power draw.'
    ]
  },
  {
    id: 'motherboard',
    name: 'Motherboard (Mainboard / Mobo)',
    shortName: 'Motherboard',
    category: 'System Backbone',
    icon: Layers,
    tagline: 'The foundational nervous system connecting every component and regulating power distribution.',
    color: 'text-blue-400',
    accentBg: 'bg-blue-950/60 border-blue-500/40',
    beginnerExplanation: {
      analogy: 'The motherboard is like the city road network and electrical power grid. It connects the airport (CPU), industrial park (GPU), and warehouses (SSD/RAM), and delivers clean electricity to each one.',
      whatItDoes: 'Holds the CPU socket, RAM slots, PCIe graphics slots, and M.2 SSD slots. It houses the BIOS/UEFI software and supplies clean stepped-down voltage to components.',
      keySpecsToLookFor: [
        'Socket Type: Must match your CPU exactly! (e.g. AMD AM5 for Ryzen 7000/9000; Intel LGA 1700 for 12th/13th/14th Gen).',
        'Form Factor: ATX (standard full-size), Micro-ATX (compact budget favorite), or Mini-ITX (ultra-small form factor).',
        'VRM Heat Dissipation: Metal heatsinks over the power chips next to the CPU socket to prevent thermal throttling.'
      ],
      howMuchToSpend: '10% to 15% of your total build budget. Spending more than ₹18,000 on a motherboard rarely gives you more FPS unless you need extreme overclocking or 4+ M.2 slots.'
    },
    deepTechnical: {
      siliconArchitecture: 'The board combines a multilayer printed circuit board (PCB with 6 to 10 copper layers) with a platform chipset (e.g., AMD B650/X670, Intel B760/Z790). High-speed differential pairs route PCIe Gen 5 lanes directly from the CPU die to GPU and primary M.2 slots.',
      howItWorksAtPhysicalLevel: 'The Voltage Regulator Module (VRM) converts raw +12V DC input from the power supply down to ~0.8V–1.4V required by modern CPU silicon cores. Multi-phase PWM controllers modulate high-side and low-side DrMOS power stages (e.g. 12+2+1 phases rated for 60A–90A per phase) to ensure clean current delivery with minimal ripple voltage.',
      advancedMetrics: [
        { name: 'PCB Layer Count', value: '6 to 10 Layers', desc: 'Denser layer count insulates high-speed DDR5 memory traces from electrical crosstalk.' },
        { name: 'PCIe Signal Integrity', value: 'PCIe 5.0 (32 GT/s)', desc: 'Requires redrivers or retimers to maintain eye-diagram compliance over distances.' },
        { name: 'VRM Current Capacity', value: 'Up to 1,000+ Amps', desc: 'Combined DrMOS stage capacity preventing overheating during sustained Cinebench loads.' }
      ],
      engineeringTradeoffs: 'Adding more PCIe 5.0 M.2 slots often forces lane-sharing (bifurcation), dropping the primary GPU PCIe slot from x16 to x8 bandwidth when all slots are populated.'
    },
    buyingTraps: [
      'Buying an entry-level motherboard without VRM heatsinks (bare MOSFET chips) for a 150W+ CPU. The VRMs will hit 110°C and throttle CPU performance.',
      'Buying an Intel motherboard for an AMD CPU or vice-versa. CPU sockets are completely proprietary and physically incompatible.',
      'Buying a Mini-ITX motherboard unless you are intentionally building a shoebox PC — Mini-ITX carries a steep price premium and has only 2 RAM slots.'
    ],
    proTips: [
      'A quality B-series chipset (AMD B650 or Intel B760) gives 95% of users identical gaming performance to high-end X670 or Z790 boards at half the price.',
      'Look for boards with a "BIOS Flashback" physical button on the rear I/O shield — it allows updating BIOS using a USB drive without needing a working CPU installed.'
    ]
  },
  {
    id: 'ram',
    name: 'Random Access Memory (RAM)',
    shortName: 'RAM',
    category: 'Memory Subsystem',
    icon: HardDrive,
    tagline: 'Ultra-fast volatile working scratchpad holding currently active games, applications, and operating system data.',
    color: 'text-emerald-400',
    accentBg: 'bg-emerald-950/60 border-emerald-500/40',
    beginnerExplanation: {
      analogy: 'Imagine your office desk surface. Your SSD is the storage filing cabinet across the room, but the desk is where you lay out the papers you are currently reading right now. A bigger desk (32GB vs 8GB) lets you keep more books open without clutter.',
      whatItDoes: 'Gives the CPU instantaneous access to loaded game assets, open browser tabs, textures, and code. When you turn off the PC, RAM completely wipes clean (volatile).',
      keySpecsToLookFor: [
        'Capacity (GB): 16GB is the bare minimum for budget gaming; 32GB is the modern sweet spot for smooth gaming with Discord and Chrome open. 64GB is for heavy 4K video editing and 3D work.',
        'Generation: DDR4 (affordable, mature) vs DDR5 (next-gen, faster bandwidth). Your motherboard determines which generation you must buy.',
        'Speed & Timings: e.g., DDR5-6000 MT/s CL30. Lower CL (CAS Latency) means faster response times.'
      ],
      howMuchToSpend: '5% to 10% of total build budget (₹4,000 to ₹11,000 for a quality 32GB dual-channel kit).'
    },
    deepTechnical: {
      siliconArchitecture: 'Synchronous Dynamic Random-Access Memory (SDRAM) consisting of microscopic capacitor-transistor pairs where charged capacitors represent a binary 1 and discharged represent 0. Because capacitors naturally bleed charge, memory must be refreshed every few milliseconds (tREFI).',
      howItWorksAtPhysicalLevel: 'Data travels across parallel 64-bit channels (or dual 32-bit subchannels in DDR5) synchronized to the memory controller clock. Enabling AMD EXPO or Intel XMP applies factory overclock profiles, tightening sub-timings (tCL, tRCD, tRP, tRAS) and boosting voltages from JEDEC standard 1.1V up to 1.35V–1.4V.',
      advancedMetrics: [
        { name: 'Transfer Rate', value: '3,200 to 7,200 MT/s', desc: 'MegaTransfers per second along the memory bus.' },
        { name: 'First Word Latency', value: '~10 nanoseconds', desc: 'Calculated as: (CAS Latency / Data Rate) × 2000. CL30 @ 6000 MT/s = 10.0ns.' },
        { name: 'Dual Channel Multiplier', value: '2x Bandwidth', desc: 'Using 2 sticks doubles the memory bus from 64-bit to 128-bit wide.' }
      ],
      engineeringTradeoffs: 'Running 4 sticks of DDR5 is much harder on the CPU memory controller than 2 sticks, often forcing speeds to downgrade from 6000 MT/s to 4800 MT/s.'
    },
    buyingTraps: [
      'Using a single stick of RAM (single-channel mode). This cuts memory bandwidth in half and can penalize 1% low gaming FPS by 20% to 35%!',
      'Buying high-speed RAM and forgetting to enable XMP or EXPO in the BIOS — it will run at slow default base speeds (e.g. 4800 MT/s instead of 6000 MT/s).',
      'Buying giant tall RGB RAM heatspreaders that collide with your CPU air cooler tower.'
    ],
    proTips: [
      'Always install two sticks in slots 2 and 4 (counting left to right from CPU socket) for proper dual-channel routing on 4-slot motherboards.',
      'For AMD AM5 (Ryzen 7000/9000), 6000 MT/s with CL30 latency is the absolute gold standard for optimal 1:1 memory controller (UCLK:MCLK) sync.'
    ]
  },
  {
    id: 'storage',
    name: 'Storage: NVMe M.2 SSD & Hard Drives',
    shortName: 'Storage (SSD)',
    category: 'Persistent Storage',
    icon: HardDrive,
    tagline: 'Non-volatile high-speed solid state storage housing your operating system, games, and files permanently.',
    color: 'text-amber-400',
    accentBg: 'bg-amber-950/60 border-amber-500/40',
    beginnerExplanation: {
      analogy: 'If RAM is your desk surface, the SSD is your ultra-fast electronic filing cabinet. An old mechanical hard drive (HDD) was like having a filing clerk who had to walk across the warehouse on foot.',
      whatItDoes: 'Boots Windows in 6 to 10 seconds, loads modern open-world games almost instantaneously, and allows smooth file transfers without stuttering.',
      keySpecsToLookFor: [
        'Form Factor: M.2 NVMe (looks like a stick of chewing gum that screws directly into the motherboard — zero cables!).',
        'PCIe Generation: Gen 3 (~3,500 MB/s), Gen 4 (~7,000 MB/s, standard today), Gen 5 (up to 14,000 MB/s, runs very hot).',
        'DRAM Cache vs HMB: SSDs with dedicated onboard DRAM or Host Memory Buffer maintain fast write speeds when moving large multi-gigabyte files.'
      ],
      howMuchToSpend: '5% to 10% of total build budget. A 1TB Gen4 NVMe costs ₹5,500 to ₹7,500; 2TB is ₹10,500 to ₹14,000.'
    },
    deepTechnical: {
      siliconArchitecture: '3D NAND flash memory arrays consisting of floating-gate or charge-trap flash cells stacked vertically in 128 to 232+ layers. Data is organized into pages (typically 16KB) and blocks (typically several MBs). Cells store 3 bits (TLC - Triple Level Cell) or 4 bits (QLC - Quad Level Cell) per transistor.',
      howItWorksAtPhysicalLevel: 'The SSD controller manages wear leveling, bad block retirement, error-correction code (LDPC), and garbage collection. NVMe (Non-Volatile Memory Express) protocol interfaces directly over the PCIe bus with up to 64,000 queues of 64,000 commands each, dwarfing legacy SATA’s single 32-command queue.',
      advancedMetrics: [
        { name: 'Sequential Read/Write', value: '3,500 to 7,400 MB/s', desc: 'Speed when loading massive continuous game files.' },
        { name: 'Random 4K IOPS', value: 'Up to 1,000,000 IOPS', desc: 'Input/Output operations per second when launching applications and booting OS.' },
        { name: 'Endurance (TBW)', value: '600TB to 1200TB Written', desc: 'Terabytes Written guaranteed before NAND cell wear.' }
      ],
      engineeringTradeoffs: 'QLC drives offer cheaper high capacities but suffer severe write-speed cliffs (dropping to HDD-like 80 MB/s) once their high-speed SLC cache fills up during massive downloads.'
    },
    buyingTraps: [
      'Buying an old mechanical HDD (Hard Disk Drive) as your main OS boot drive. Windows 11 on an HDD is painfully sluggish and unresponsive.',
      'Forgetting to remove the blue protective plastic peel from the motherboard’s M.2 metal heatsink before installing the SSD.',
      'Buying a Gen 5 SSD when your motherboard only supports Gen 4, or buying a Gen 5 without a massive heatsink (they thermal throttle quickly).'
    ],
    proTips: [
      'Look for TLC NAND SSDs with DRAM cache (e.g. Samsung 980 Pro/990 Pro, Kingston KC3000, WD Black SN850X) for the best reliability.',
      'Modern games using Microsoft DirectStorage stream assets directly from the NVMe SSD into GPU VRAM, virtually eliminating loading screens.'
    ]
  },
  {
    id: 'psu',
    name: 'Power Supply Unit (PSU)',
    shortName: 'Power Supply (PSU)',
    category: 'Power Delivery',
    icon: Zap,
    tagline: 'The beating heart delivering stable, clean, filtered DC electricity to protect your multi-thousand rupee hardware.',
    color: 'text-rose-400',
    accentBg: 'bg-rose-950/60 border-rose-500/40',
    beginnerExplanation: {
      analogy: 'The power supply is the heart and cardiovascular system. If your heart is weak or pumping erratic blood pressure, all your healthy organs will fail or die. Never starve your components of clean power.',
      whatItDoes: 'Converts dangerous, alternating 230V AC current from your wall socket into clean, regulated +12V, +5V, and +3.3V Direct Current (DC) electricity.',
      keySpecsToLookFor: [
        'Wattage (e.g., 650W, 750W, 850W, 1000W): Needs to exceed your components’ combined peak power by at least 25% to 30%.',
        '80-Plus Efficiency Rating: Bronze (82%), Gold (87-90%), Platinum (92%). Gold is the modern quality benchmark.',
        'Modularity: Non-modular (all cables permanently attached), Semi-modular (essential cables attached), Full-modular (attach only the cables you need for a tidy build).'
      ],
      howMuchToSpend: '7% to 12% of total build budget (₹5,000 to ₹12,000). A good PSU will outlast 2 or 3 computer builds and comes with a 7 to 10 year warranty.'
    },
    deepTechnical: {
      siliconArchitecture: 'Modern high-end PSUs use resonant LLC half-bridge or full-bridge topologies with Synchronous Rectification and DC-to-DC converters for the minor +5V and +3.3V rails. Premium units incorporate 105°C Japanese electrolytic capacitors (Nippon Chemi-Con, Nichicon, Rubycon).',
      howItWorksAtPhysicalLevel: 'High-frequency switching transistors (MOSFETs) chop incoming rectified high-voltage DC at 100kHz+, transforming it across a high-efficiency ferrite transformer. ATX 3.0 / ATX 3.1 standards mandate the ability to absorb massive transient power spikes (power excursions up to 200% of rated capacity for 100 microseconds) triggered by modern GPUs without tripping Over-Current Protection (OCP).',
      advancedMetrics: [
        { name: 'Transient Excursion Ceiling', value: '200% for 100µs', desc: 'ATX 3.0 standard requirement preventing instant black-screen shutdowns on GPU load spikes.' },
        { name: '12V-2x6 Connector', value: 'Native 16-Pin 600W', desc: 'Dedicated 600W PCIe 5.0 GPU cable with shortened sense pins to detect loose connections.' },
        { name: 'Voltage Ripple Tolerance', value: '<20mV on +12V Rail', desc: 'Clean, flat voltage output extending the silicon lifespan of CPU and GPU VRMs.' }
      ],
      engineeringTradeoffs: 'Higher wattage PSUs are not inefficient at low loads anymore thanks to modern 80-Plus Gold/Titanium low-load curve standards.'
    },
    buyingTraps: [
      'NEVER buy a cheap, unbranded, or generic power supply (e.g. "free PSU included with ₹1,200 case"). When cheap PSUs fail, they frequently take out the motherboard and GPU with them.',
      'NEVER mix and match modular cables between different PSU brands or models — pinouts at the power supply side are NOT standardized and will fry your drives!',
      'Under-sizing your PSU for high-end GPUs like the RTX 4080/5080 or RX 7900 XTX that produce sudden transient micro-spikes.'
    ],
    proTips: [
      'Always aim for a PSU where your estimated system load sits between 50% and 75% of the rated capacity — this is the efficiency and fan-silence sweet spot.',
      'Check the independent Cultists Network PSU Tier List — aim for Tier A or Tier B for any build with a dedicated graphics card.'
    ]
  },
  {
    id: 'cooling',
    name: 'Cooling: Air Towers & Liquid AIO Coolers',
    shortName: 'Cooling & Thermals',
    category: 'Thermodynamics',
    icon: Fan,
    tagline: 'Heat dissipation solutions transferring thermal energy away from microscopic silicon dies to maintain boost clocks.',
    color: 'text-cyan-300',
    accentBg: 'bg-cyan-950/40 border-cyan-500/30',
    beginnerExplanation: {
      analogy: 'Like sweating and drinking ice water when running a marathon. When your CPU works hard, it generates intense heat in an area smaller than a postage stamp. If heat isn’t stripped away fast, the CPU slows down (thermal throttles) to save itself from melting.',
      whatItDoes: 'Pulls heat off the CPU heatspreader and exhausts it out of the chassis so the CPU can maintain maximum boost clocks for hours without thermal throttling.',
      keySpecsToLookFor: [
        'Air Cooler vs AIO Liquid: Air coolers use copper heatpipes and fans (bulletproof reliability, zero leak risk). AIOs use pumped liquid coolant running to a 240mm or 360mm radiator.',
        'TDP Rating: A 65W CPU is fine with an air cooler; a 150W–250W Intel i7/i9 or AMD 9950X benefits greatly from a 360mm AIO liquid cooler.',
        'Thermal Paste: Conductive compound that fills microscopic air pockets between the cooler base and CPU lid.'
      ],
      howMuchToSpend: '3% to 8% of total budget (₹1,800 for great air coolers like AG400/Peerless Assassin; ₹5,500 to ₹9,500 for high-performance 240mm/360mm AIOs).'
    },
    deepTechnical: {
      siliconArchitecture: 'Heat originates inside the silicon die ($T_{\\text{junction}}$) with heat flux densities exceeding 100 Watts per square centimeter. Heat conducts through Indium solder TIM to the nickel-plated copper Integrated Heat Spreader (IHS), then through thermal paste to the cooler cold plate.',
      howItWorksAtPhysicalLevel: 'Air cooler heatpipes contain sintered copper powder wicks and a vacuum filled with a tiny amount of liquid water. At the hot end, water boils into vapor, travels to the cold end, condenses along aluminum cooling fins, and capillary action pulls the liquid back to the heat source. Liquid AIOs continuously circulate water-glycol coolant via an impeller pump through micro-channel copper skived fins.',
      advancedMetrics: [
        { name: 'Thermal Resistance ($R_{\\theta}$)', value: '< 0.08 °C/W', desc: 'Lower is better; measures temperature rise per Watt dissipated.' },
        { name: 'Fan Static Pressure', value: '2.0 to 3.5 mmH2O', desc: 'Ability to push air through dense radiator fins vs open-air airflow.' },
        { name: 'Pump Impeller RPM', value: '2,400 to 3,200 RPM', desc: 'Maintains steady coolant flow rate through 27mm–38mm thick radiator cores.' }
      ],
      engineeringTradeoffs: 'AIO liquid coolers look cleaner and absorb sudden heat spikes better due to the specific heat capacity of water, but contain mechanical pumps that have a 4 to 6 year lifespan compared to air coolers that last forever.'
    },
    buyingTraps: [
      'The #1 builder mistake: Forgetting to peel off the clear plastic protective sticker on the bottom of the cooler cold plate before mounting it with thermal paste!',
      'Buying a 360mm AIO cooler without verifying that your PC cabinet has clearance at the top or front to mount a 395mm long radiator assembly.',
      'Putting too much thermal paste (overflow mess) or too little (dry hotspots). A pea-sized dot or "X" pattern in the center works best.'
    ],
    proTips: [
      'Modern dual-tower air coolers (like Thermalright Peerless Assassin or DeepCool AK620) cost under ₹4,000 and can easily cool 200W CPUs while being virtually silent.',
      'Ensure positive case pressure (more intake fans than exhaust fans) with dust filters to prevent dust from being sucked in through cracks.'
    ]
  },
  {
    id: 'case',
    name: 'PC Cabinet / Chassis & Airflow Dynamics',
    shortName: 'Cabinet / Chassis',
    category: 'Enclosure',
    icon: Box,
    tagline: 'The structural skeleton, electromagnetic shield, and aerodynamic thermal chamber housing your rig.',
    color: 'text-zinc-300',
    accentBg: 'bg-zinc-800/60 border-zinc-700/60',
    beginnerExplanation: {
      analogy: 'The cabinet is the house for your computer. It needs good ventilation (open mesh windows) so fresh cool air can flow in and hot exhaust can blow out. A solid glass box with no vents turns your PC into an oven.',
      whatItDoes: 'Protects components from physical bumps and dust, provides front-panel USB ports, and organizes fan airflow from front to back.',
      keySpecsToLookFor: [
        'Front Panel Material: Mesh front panel (best for airflow) vs Solid glass/plastic (runs 8°C–15°C hotter).',
        'Component Clearances: Max GPU Length (mm), Max CPU Cooler Height (mm), and Top Radiator Support (mm).',
        'Included Fans: Cabinets that come with 3 or 4 pre-installed PWM fans save you ₹1,500 to ₹3,000 in extra fan purchases.'
      ],
      howMuchToSpend: '5% to 8% of total budget (₹3,500 to ₹8,500). Great budget mesh cases include DeepCool CH560, Montech Air 903, and Corsair 4000D Airflow.'
    },
    deepTechnical: {
      siliconArchitecture: 'Chassis design involves computational fluid dynamics (CFD) modeling intake velocity vectors, pressure deltas, and acoustic resonance damping. Construction uses 0.7mm–0.9mm SGCC steel and 4mm tempered safety glass.',
      howItWorksAtPhysicalLevel: 'Front fans pull dense room-temperature air (~24°C–32°C in Indian ambient environments) across the GPU intake and CPU cooler. Heat transferred to the air reduces its density, causing it to naturally rise where top and rear exhaust fans evacuate it, preventing recirculation pockets.',
      advancedMetrics: [
        { name: 'Steel Gauge Thickness', value: '0.7mm - 0.8mm SPCC', desc: 'Resists GPU sagging torque and dampens mechanical fan vibrations.' },
        { name: 'Front I/O Bandwidth', value: 'USB 3.2 Gen 2x2 (20 Gbps)', desc: 'High-speed Type-C header connecting directly to motherboard internal header.' },
        { name: 'GPU Sag Clearance', value: 'Up to 400mm Clearance', desc: 'Accommodates long triple-fan cards with front radiator mounted.' }
      ],
      engineeringTradeoffs: 'Fish-tank dual-chamber cases with glass front and sides look spectacular with RGB, but require side intake fans and bottom intake configurations to achieve acceptable thermals.'
    },
    buyingTraps: [
      'Buying an all-glass case with zero front ventilation holes. Components will run 10°C hotter and fans will spin at maximum noisy RPMs.',
      'Buying a case that doesn’t have enough clearance for your GPU length or your CPU cooler height.',
      'Buying a case without removable dust filters in dusty room environments.'
    ],
    proTips: [
      'Always check if the case includes a built-in GPU anti-sag support bracket — modern 3-fan graphics cards will bend your PCIe slot over time without one.',
      'A case with a rubber grommet cable management track behind the motherboard tray makes building 10x easier and keeps airflow paths clean.'
    ]
  }
];

export const ComponentAnatomy: React.FC = () => {
  const [selectedComponentId, setSelectedComponentId] = useState<string>('cpu');
  const [depthMode, setDepthMode] = useState<'beginner' | 'technical'>('beginner');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentComponent = PC_COMPONENTS_DATA.find((c) => c.id === selectedComponentId) || PC_COMPONENTS_DATA[0];

  const filteredComponents = PC_COMPONENTS_DATA.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Interactive Hardware Encyclopedia & Architecture Guide
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            PC Component Anatomy & Engineering Deep Dive
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            From absolute first-timer basics to microscopic silicon engineering: understand how every part of a computer functions, how they interact, and avoid costly purchasing pitfalls.
          </p>
        </div>

        {/* Dual Depth Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950 border border-zinc-800 shrink-0">
          <button
            onClick={() => setDepthMode('beginner')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              depthMode === 'beginner'
                ? 'bg-emerald-500 text-zinc-950 shadow-md scale-102'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Absolute Beginner</span>
          </button>
          <button
            onClick={() => setDepthMode('technical')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              depthMode === 'technical'
                ? 'bg-cyan-500 text-zinc-950 shadow-md scale-102'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Microchip className="w-3.5 h-3.5" />
            <span>Silicon Geek / Technical</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Left Component Nav + Right In-Depth Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Component Index & Selector */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search components, specs, concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Component Buttons List */}
          <div className="space-y-2">
            {filteredComponents.map((comp) => {
              const isSelected = comp.id === currentComponent.id;
              const Icon = comp.icon;

              return (
                <button
                  key={comp.id}
                  onClick={() => setSelectedComponentId(comp.id)}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 border-cyan-500/80 shadow-lg ring-1 ring-cyan-500/40'
                      : 'bg-zinc-950/70 hover:bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-cyan-950 border-cyan-500/60 text-cyan-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                        {comp.shortName}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">{comp.category}</div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-cyan-400 translate-x-1' : 'text-zinc-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Architecture Map Teaser */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs text-zinc-400">
            <span className="font-bold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> The PC Interconnect Bus
            </span>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              The CPU connects to the GPU and primary NVMe over high-speed direct PCIe lanes. Secondary ports, audio, Ethernet, and USB headers route through the Motherboard Chipset.
            </p>
          </div>
        </div>

        {/* Right Side: Detailed Component Study View */}
        <div className="lg:col-span-8 space-y-6">
          {/* Component Banner Card */}
          <div className={`p-6 rounded-3xl border shadow-xl bg-zinc-900/90 ${currentComponent.accentBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-700 flex items-center justify-center shadow-md">
                  <currentComponent.icon className={`w-6 h-6 ${currentComponent.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-zinc-400 font-bold">
                      {currentComponent.category}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">Essential Subsystem</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    {currentComponent.name}
                  </h2>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-mono text-zinc-300 shrink-0">
                Mode: <span className="font-bold text-cyan-400 uppercase">{depthMode}</span>
              </div>
            </div>

            <p className="text-sm text-zinc-300 font-medium mt-4 leading-relaxed">
              {currentComponent.tagline}
            </p>
          </div>

          {/* DUAL DEPTH VIEW */}
          {depthMode === 'beginner' ? (
            /* BEGINNER EXPLANATION VIEW */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Real World Analogy Card */}
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                  <Lightbulb className="w-4 h-4 text-emerald-400" /> Simple Real-World Analogy
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed">
                  {currentComponent.beginnerExplanation.analogy}
                </p>
              </div>

              {/* What It Does in Plain English */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" /> What It Does In Your PC
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {currentComponent.beginnerExplanation.whatItDoes}
                </p>
              </div>

              {/* Key Specs to Look For */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-400" /> Key Specs You Should Care About
                </h3>
                <ul className="space-y-2.5">
                  {currentComponent.beginnerExplanation.keySpecsToLookFor.map((spec, idx) => (
                    <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2.5 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How Much to Spend Budget Rule */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                <span className="font-mono text-zinc-400">Recommended Budget Allocation:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {currentComponent.beginnerExplanation.howMuchToSpend}
                </span>
              </div>
            </div>
          ) : (
            /* TECHNICAL SILICON LEVEL VIEW */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Architecture & Lithography */}
              <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                  <Microchip className="w-4 h-4 text-cyan-400" /> Silicon & Microarchitecture
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                  {currentComponent.deepTechnical.siliconArchitecture}
                </p>
              </div>

              {/* Physical Operation */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" /> Physical & Electrical Operation
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {currentComponent.deepTechnical.howItWorksAtPhysicalLevel}
                </p>
              </div>

              {/* Advanced Engineering Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentComponent.deepTechnical.advancedMetrics.map((metric, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">{metric.name}</div>
                    <div className="text-sm font-mono font-bold text-white">{metric.value}</div>
                    <div className="text-[10px] text-zinc-500 leading-tight">{metric.desc}</div>
                  </div>
                ))}
              </div>

              {/* Engineering Tradeoffs */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Engineering Tradeoffs:
                </span>
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  {currentComponent.deepTechnical.engineeringTradeoffs}
                </p>
              </div>
            </div>
          )}

          {/* COMMON BUYING TRAPS & MISTAKES (Crucial for all users) */}
          <div className="p-5 rounded-2xl bg-red-950/20 border border-red-900/50 space-y-3">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Common Buying Traps & Mistakes to Avoid
            </h3>
            <ul className="space-y-2">
              {currentComponent.buyingTraps.map((trap, idx) => (
                <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  <span>{trap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PRO TIPS & ADVICE */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Pro Builder Wisdom
            </h3>
            <ul className="space-y-2">
              {currentComponent.proTips.map((tip, idx) => (
                <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
