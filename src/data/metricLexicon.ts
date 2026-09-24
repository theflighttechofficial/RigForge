/**
 * Performance Metric Lexicon & Architectural Explanations
 * Defines the technical significance, gaming impact (e.g. Clock Speed vs IPC),
 * and architectural recommendations for all hardware comparison metrics.
 */

export interface MetricDefinition {
  id: string;
  title: string;
  tag: string;
  definition: string;
  gamingSignificance: string;
  architecturalTip: string;
}

export const METRIC_LEXICON: Record<string, MetricDefinition> = {
  pricing: {
    id: 'pricing',
    title: 'Pricing & Market Valuation (INR)',
    tag: 'STREET PRICE & 18% GST',
    definition: 'Current Indian retail market price inclusive of 18% GST and local distributor margins across major vendors (MDComputers, PrimeABGB, Vedant).',
    gamingSignificance: 'Establishes the investment baseline for return-on-investment (ROI) analysis. Hardware pricing follows sharp diminishing returns: flagship halo components often demand 70% to 100% price premiums for only 15% to 25% higher frame rates.',
    architecturalTip: 'Always evaluate total platform cost (motherboard socket lifespan, DDR4 vs DDR5 RAM, and PSU wattage headroom) rather than standalone component price.'
  },
  gamingScore: {
    id: 'gamingScore',
    title: 'Gaming Performance Index',
    tag: 'FRAME PACING & 1% LOWS',
    definition: 'Normalized geometric mean of average and 1% low frame rates across modern DirectX 12 and Vulkan game engines at standard competitive and AAA test baselines.',
    gamingSignificance: 'Why 1% Lows matter more than Average FPS: Average FPS only reveals how smooth a title runs when nothing happens; 1% lows dictate stutter resistance during heavy particle effects, explosions, or rapid camera turns. A steady 90 FPS feels noticeably smoother than an unstable 140 FPS dipping to 40 FPS.',
    architecturalTip: 'At 1080p, gaming is primarily CPU single-core and L3 cache bound. At 1440p and 4K, the workload shifts heavily to GPU rasterization, memory bandwidth, and VRAM capacity.'
  },
  clockSpeedIpc: {
    id: 'clockSpeedIpc',
    title: 'Clock Speed (GHz) vs. IPC (Instructions Per Cycle)',
    tag: 'CLOCK SPEED VS. IPC',
    definition: 'Effective single-core computational output is calculated as: Effective Performance = Clock Frequency (GHz) × IPC. Clock frequency is the internal cycle oscillation rate, whereas IPC measures how many instructions the core\'s execution engine actually retires per clock cycle.',
    gamingSignificance: 'Why Clock Speed vs IPC Matters for Gaming: High gigahertz alone is deceptive! An older CPU clocked at 5.0 GHz with weak IPC will easily lose in gaming to a modern 4.2 GHz CPU with 30% higher IPC. Game engines are dominated by a primary render thread handling draw-call dispatch, physics, and game-loop logic—making IPC and low cache latency far more crucial than raw frequency.',
    architecturalTip: 'Never compare clock speeds across different architectures (e.g. Intel vs AMD or older vs newer generations). Always evaluate IPC-normalized single-core benchmarks and cache sizes.'
  },
  singleCoreScore: {
    id: 'singleCoreScore',
    title: 'Single-Core Benchmark Score',
    tag: 'SINGLE-THREAD PIPELINE',
    definition: 'Peak computational throughput of an isolated physical CPU core running scalar and vector instructions without thread synchronization overhead.',
    gamingSignificance: 'The single most influential hardware specification for gaming frame dispatch. Even in modern titles with multithreaded engines, the main simulation thread cannot be split, establishing the hard ceiling for frame rates.',
    architecturalTip: 'High single-core performance also directly drives snappy desktop responsiveness, fast browser DOM rendering, and instant Adobe Photoshop brush strokes.'
  },
  multiCoreScore: {
    id: 'multiCoreScore',
    title: 'Multi-Core Compute Throughput',
    tag: 'PARALLEL WORKLOAD MATRIX',
    definition: 'Aggregate simultaneous computing capacity across all physical Performance (P) and Efficiency (E) cores running concurrent SIMD/AVX threads.',
    gamingSignificance: 'Contemporary game engines hit diminishing returns beyond 8 cores / 16 threads. However, high multi-core capacity is invaluable for gamers who stream via OBS, run background Discord voice, or produce 4K video exports.',
    architecturalTip: 'Vital for creators working with Blender 3D rendering, Unreal Engine shader compilation, and heavy code building.'
  },
  clockFrequency: {
    id: 'clockFrequency',
    title: 'Base & Boost Clock Speeds',
    tag: 'DYNAMIC FREQUENCY SCALING',
    definition: 'Base Clock is the guaranteed minimum operational frequency under sustained thermal limits; Boost Clock is the opportunistic peak frequency reached when thermal and electrical margins permit.',
    gamingSignificance: 'Boost frequency dictates short burst responsiveness and high-framerate esports gaming. If cooling is inadequate, the CPU throttles down toward base clock, causing sudden mid-game frame stutter.',
    architecturalTip: 'Keeping CPU junction temperatures below 75°C allows AMD Precision Boost 2 and Intel Thermal Velocity Boost to sustain peak boost indefinitely.'
  },
  cpuCache: {
    id: 'cpuCache',
    title: 'L2 + L3 Cache (Latency Buffer & 3D V-Cache)',
    tag: 'ULTRA-LOW LATENCY SRAM',
    definition: 'On-die Static RAM (SRAM) operating with access latencies under 10–15 nanoseconds, compared to 60–80ns for system DDR5 RAM.',
    gamingSignificance: 'Cache as an IPC Multiplier: In gaming, CPUs constantly query game geometry, animation states, and physics trees. When data is found in L3 cache (a "cache hit"), the CPU never stalls. AMD\'s stacked 3D V-Cache (96MB+) eliminates memory wait states, boosting 1% low frame rates dramatically in simulation-heavy titles (MSFS, Assetto Corsa, Tarkov, Baldur\'s Gate 3).',
    architecturalTip: 'A CPU with 96MB L3 cache at 4.8 GHz will frequently outperform a 5.8 GHz CPU with standard 32MB cache in gaming.'
  },
  coresThreads: {
    id: 'coresThreads',
    title: 'Cores & Multi-Threading (SMT / Hyper-Threading)',
    tag: 'HARDWARE EXECUTION ENGINES',
    definition: 'Physical silicon cores combined with Simultaneous Multi-Threading (SMT) that allows each core to execute two software instruction threads concurrently.',
    gamingSignificance: 'Enables the OS kernel scheduler to allocate background tasks, Discord voice, and antivirus scans to separate threads without stalling game render threads.',
    architecturalTip: '6 Cores / 12 Threads is the recommended entry baseline; 8 Cores / 16 Threads is the enthusiast gaming sweet spot.'
  },
  vramCapacity: {
    id: 'vramCapacity',
    title: 'VRAM Capacity (Video RAM Frame Buffer)',
    tag: 'THE VRAM HARD-WALL',
    definition: 'Dedicated high-bandwidth GDDR6/GDDR6X/GDDR7 memory physically mounted beside the GPU die, storing high-resolution textures, meshes, and frame buffers.',
    gamingSignificance: 'Why 8GB is becoming a gaming trap: Modern AAA titles running ultra textures and Ray Tracing easily demand 10GB–14GB VRAM at 1440p and 4K. When VRAM runs out, assets swap over the PCIe bus into system RAM (10x slower), causing catastrophic 35–50% FPS drops, texture pop-in, and severe hitching.',
    architecturalTip: 'For 1080p, 8GB remains sufficient. For 1440p gaming longevity, aim for a minimum of 12GB to 16GB VRAM.'
  },
  memoryBandwidth: {
    id: 'memoryBandwidth',
    title: 'Memory Bandwidth & Bus Width',
    tag: 'DATA BUS THROUGHPUT',
    definition: 'The maximum volume of graphical data the GPU memory controller can stream per second, calculated from Memory Bus Width (e.g. 128-bit vs 256-bit) and Memory Data Rate (GB/s).',
    gamingSignificance: 'At higher resolutions (1440p and 4K), pixel shaders and rasterization passes read and write gigabytes of texture buffers every frame. Narrow bus widths (such as 128-bit) starve the compute cores, bottlenecking high-resolution performance.',
    architecturalTip: 'High bandwidth is critical for high resolutions (1440p/4K) and generative AI workloads (Stable Diffusion, local LLM token generation).'
  },
  rayTracing: {
    id: 'rayTracing',
    title: 'Hardware Ray Tracing (BVH Acceleration)',
    tag: 'REAL-TIME LIGHT SIMULATION',
    definition: 'Dedicated silicon hardware (NVIDIA RT Cores / AMD Ray Accelerators) engineered specifically for Bounding Volume Hierarchy (BVH) ray-triangle collision calculations.',
    gamingSignificance: 'Offloads computationally punishing light ray calculations (reflections, global illumination, path tracing) from standard shaders. Without dedicated RT silicon, real-time path tracing is unplayable.',
    architecturalTip: 'NVIDIA Ada Lovelace / Blackwell currently holds a ~35–50% performance lead in heavy path tracing over AMD RDNA 3 due to dedicated SER (Shader Execution Reordering) hardware.'
  },
  computeAi: {
    id: 'computeAi',
    title: 'Compute Pipeline & AI / Tensor Cores',
    tag: 'NEURAL INFERENCE & MATRIX FLOPS',
    definition: 'Specialized matrix multiplication hardware (Tensor Cores) and FP32 floating-point compute clusters engineered for deep learning and neural network inferencing.',
    gamingSignificance: 'Powers AI neural upscaling (DLSS Super Resolution, DLSS 3.5 Ray Reconstruction) and AI Frame Generation, doubling perceived motion smoothness with minimal system latency penalty.',
    architecturalTip: 'Also directly dictates performance for local generative AI workloads like Stable Diffusion image generation and offline LLM chatbots.'
  },
  valueIndex: {
    id: 'valueIndex',
    title: 'Value Index (Points per ₹1,000)',
    tag: 'PARETO EFFICIENCY SWEET SPOT',
    definition: 'Rupee-efficiency coefficient calculated as: (Benchmark Score ÷ Price in INR) × 1,000.',
    gamingSignificance: 'Highlights components situated at the inflection point on the Pareto efficiency frontier, maximizing gaming enjoyment per rupee spent without enthusiast pricing markup.',
    architecturalTip: 'Scores above 25 pts/₹1k represent exceptional consumer value in the Indian hardware market.'
  },
  powerConsumption: {
    id: 'powerConsumption',
    title: 'Power Consumption (TDP / TGP)',
    tag: 'THERMAL DISSIPATION & POWER DRAW',
    definition: 'Thermal Design Power (TDP for CPUs) or Total Graphics Power (TGP for GPUs) measuring the continuous electrical power consumed and heat in Watts to be dissipated under load.',
    gamingSignificance: 'Higher power means hotter cabinet internals, louder cooling fans, higher electricity bills, and heavier PSU requirements. In hot Indian summers (35°C–45°C ambient), high-TDP components throttle much faster without premium cooling.',
    architecturalTip: 'Ensure your PSU capacity exceeds combined CPU + GPU wattage by at least 150W–200W to absorb sub-millisecond transient power spikes safely.'
  },
  powerEfficiency: {
    id: 'powerEfficiency',
    title: 'Power Efficiency (Points per Watt)',
    tag: 'SILICON NODE EFFICIENCY',
    definition: 'Normalized compute throughput delivered per continuous Watt consumed: (Score ÷ TDP/TGP).',
    gamingSignificance: 'Reflects the architectural and lithography efficiency (e.g. TSMC 4nm vs older nodes). Efficient chips operate with quieter acoustic profiles, lower VRM temperatures, and reduced UPS battery drain during power cuts.',
    architecturalTip: 'A simple undervolt via AMD Curve Optimizer or MSI Afterburner can reduce power draw by 40W–60W with zero frame rate loss.'
  },
  benchmarkScore: {
    id: 'benchmarkScore',
    title: 'Overall Benchmark Score',
    tag: 'COMPOSITE COMPUTATIONAL INDEX',
    definition: 'Comprehensive multi-metric score blending rasterization, single-thread vector throughput, memory latency, and multi-core rendering speeds.',
    gamingSignificance: 'Provides a macro overview of silicon capability across balanced computing workloads, from background OS operations to rendering and simulation.',
    architecturalTip: 'Ideal for hybrid users who both game and create content (video editing, 3D modeling, coding).'
  }
};
