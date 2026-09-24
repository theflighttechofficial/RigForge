export interface StorageTierSpec {
  id: string;
  name: string;
  shortName: string;
  interfaceType: 'SATA HDD' | 'SATA III' | 'PCIe 3.0 x4' | 'PCIe 4.0 x4' | 'PCIe 5.0 x4';
  typicalModel: string;
  busBandwidthMBps: number;
  seqReadMBps: number;
  seqWriteMBps: number;
  random4kReadIOPS: number;
  random4kWriteIOPS: number;
  gameLoadingSeconds: number; // Starfield / Cyberpunk 2077 DirectStorage test
  windowsBootSeconds: number; // Cold boot to usable desktop
  largeFileTransferSeconds: number; // 100GB 4K Raw video copy
  videoEditingScrubbingFps: number; // 8K multi-stream timeline preview FPS
  randomIoLatencyMs: number;
  powerLoadWatts: number;
  thermalHeatsinkReq: 'None (Bare PCBA)' | 'Standard Metal Shield' | 'Heavy Heatsink Required' | 'Active Fan Heatsink Mandatory';
  pricePerTbINR: number;
  barColor: string;
  asciiBar: string;
  description: string;
  pros: string[];
  cons: string[];
}

export const STORAGE_TIERS: StorageTierSpec[] = [
  {
    id: 'hdd-7200',
    name: 'HDD (7200 RPM Spin Disk)',
    shortName: 'HDD',
    interfaceType: 'SATA HDD',
    typicalModel: 'Seagate BarraCuda 2TB 7200RPM 256MB Cache',
    busBandwidthMBps: 600,
    seqReadMBps: 160,
    seqWriteMBps: 150,
    random4kReadIOPS: 150,
    random4kWriteIOPS: 120,
    gameLoadingSeconds: 48.5,
    windowsBootSeconds: 42.0,
    largeFileTransferSeconds: 672, // ~11.2 mins
    videoEditingScrubbingFps: 12,
    randomIoLatencyMs: 12.5,
    powerLoadWatts: 6.8,
    thermalHeatsinkReq: 'None (Bare PCBA)',
    pricePerTbINR: 2200,
    barColor: 'bg-zinc-500',
    asciiBar: '█',
    description: 'Legacy mechanical magnetic platter drive with spinning actuator arms. High latency and slow sequential throughput make it unusable for modern OS or DirectStorage gaming.',
    pros: ['Lowest cost per TB', 'Ideal for cold offline archives & mass media dumps'],
    cons: ['48s+ game loading times', 'Severe stutter in modern open-world games', 'High mechanical latency (~12.5ms)']
  },
  {
    id: 'sata-ssd',
    name: 'SATA III 2.5" SSD',
    shortName: 'SATA SSD',
    interfaceType: 'SATA III',
    typicalModel: 'Crucial MX500 / Samsung 870 EVO 1TB',
    busBandwidthMBps: 600,
    seqReadMBps: 560,
    seqWriteMBps: 530,
    random4kReadIOPS: 95000,
    random4kWriteIOPS: 88000,
    gameLoadingSeconds: 14.2,
    windowsBootSeconds: 11.5,
    largeFileTransferSeconds: 188, // ~3.1 mins
    videoEditingScrubbingFps: 38,
    randomIoLatencyMs: 0.10,
    powerLoadWatts: 3.2,
    thermalHeatsinkReq: 'None (Bare PCBA)',
    pricePerTbINR: 5800,
    barColor: 'bg-cyan-500',
    asciiBar: '████',
    description: 'NAND Flash storage bottlenecked by legacy SATA III 6Gbps bus interface. Drastically faster than HDDs due to zero seek times, but limited to ~560 MB/s.',
    pros: ['Instant 0.1ms random seek access', 'Silent operation', 'Compatible with all legacy PCs'],
    cons: ['Capped at 560 MB/s SATA bus limits', 'No DirectStorage GPU bypass support']
  },
  {
    id: 'pcie-gen3',
    name: 'PCIe 3.0 NVMe M.2 SSD',
    shortName: 'PCIe 3 NVMe',
    interfaceType: 'PCIe 3.0 x4',
    typicalModel: 'Samsung 970 EVO Plus / Crucial P3 1TB',
    busBandwidthMBps: 3940,
    seqReadMBps: 3500,
    seqWriteMBps: 3300,
    random4kReadIOPS: 600000,
    random4kWriteIOPS: 550000,
    gameLoadingSeconds: 7.8,
    windowsBootSeconds: 6.8,
    largeFileTransferSeconds: 30.3,
    videoEditingScrubbingFps: 60,
    randomIoLatencyMs: 0.04,
    powerLoadWatts: 5.5,
    thermalHeatsinkReq: 'Standard Metal Shield',
    pricePerTbINR: 5200,
    barColor: 'bg-blue-500',
    asciiBar: '█████████',
    description: 'First generation high-speed NVMe flash drives using PCIe Gen3 x4 lanes. Excellent sweet spot for general computing, budget builds, and 1080p video editing.',
    pros: ['6x speed over SATA SSDs', 'Low power consumption', 'Fits in thin laptop M.2 slots'],
    cons: ['Half the bandwidth of Gen4 drives', 'Slower DirectStorage decompression']
  },
  {
    id: 'pcie-gen4',
    name: 'PCIe 4.0 NVMe M.2 SSD',
    shortName: 'PCIe 4 NVMe',
    interfaceType: 'PCIe 4.0 x4',
    typicalModel: 'Kingston KC3000 / Samsung 990 Pro / WD Black SN850X 2TB',
    busBandwidthMBps: 7880,
    seqReadMBps: 7400,
    seqWriteMBps: 7000,
    random4kReadIOPS: 1400000,
    random4kWriteIOPS: 1300000,
    gameLoadingSeconds: 5.2,
    windowsBootSeconds: 5.1,
    largeFileTransferSeconds: 14.3,
    videoEditingScrubbingFps: 118,
    randomIoLatencyMs: 0.025,
    powerLoadWatts: 7.8,
    thermalHeatsinkReq: 'Standard Metal Shield',
    pricePerTbINR: 6800,
    barColor: 'bg-emerald-400',
    asciiBar: '███████████████',
    description: 'The current industry standard sweet spot. Delivers up to 7400 MB/s, PS5 system compatibility, and instant DirectStorage 1.2 GPU asset decompression.',
    pros: ['PS5 certified speed', 'Sub-5.2s game load times', 'Excellent price-to-performance ratio'],
    cons: ['Requires motherboard M.2 metal heatsink']
  },
  {
    id: 'pcie-gen5',
    name: 'PCIe 5.0 NVMe M.2 SSD',
    shortName: 'PCIe 5 NVMe',
    interfaceType: 'PCIe 5.0 x4',
    typicalModel: 'Crucial T700 / Corsair MP700 PRO 2TB',
    busBandwidthMBps: 15750,
    seqReadMBps: 12400,
    seqWriteMBps: 11800,
    random4kReadIOPS: 2200000,
    random4kWriteIOPS: 2000000,
    gameLoadingSeconds: 4.1,
    windowsBootSeconds: 4.3,
    largeFileTransferSeconds: 8.5,
    videoEditingScrubbingFps: 120, // Max panel refresh rate
    randomIoLatencyMs: 0.015,
    powerLoadWatts: 12.5,
    thermalHeatsinkReq: 'Active Fan Heatsink Mandatory',
    pricePerTbINR: 14500,
    barColor: 'bg-purple-400',
    asciiBar: '█████████████████████',
    description: 'Bleeding-edge Enthusiast storage pushing up to 12.4 GB/s. Transfers a full 100GB 4K raw film in under 9 seconds. Generates heavy heat requiring active cooling.',
    pros: ['Unrivaled 12,400 MB/s sequential speeds', 'Blazing 2.2 Million IOPS', 'Instant multi-stream 8K RAW video scrubbing'],
    cons: ['Premium price (~2x cost of Gen4)', 'Generates ~12.5W heat requiring active fan heatsink']
  }
];

export interface StorageBenchmarkMetric {
  id: 'seqRead' | 'seqWrite' | 'gameLoading' | 'windowsBoot' | 'largeFile' | 'videoEditing' | 'randomIo';
  label: string;
  unit: string;
  higherIsBetter: boolean;
  description: string;
}

export const STORAGE_METRICS: StorageBenchmarkMetric[] = [
  {
    id: 'seqRead',
    label: 'Sequential Read Speed',
    unit: 'MB/s',
    higherIsBetter: true,
    description: 'Speed when reading continuous large contiguous files like 4K videos, ISO disk images, and massive archive downloads.'
  },
  {
    id: 'gameLoading',
    label: 'Game Loading Time',
    unit: 'seconds',
    higherIsBetter: false,
    description: 'Time taken to load 15GB Starfield / Cyberpunk 2077 open-world texture assets into VRAM with DirectStorage 1.2 GPU decompression.'
  },
  {
    id: 'windowsBoot',
    label: 'Windows 11 Cold Boot',
    unit: 'seconds',
    higherIsBetter: false,
    description: 'Cold system start to responsive Windows desktop with background startup apps loaded.'
  },
  {
    id: 'largeFile',
    label: '100GB Large-File Transfer',
    unit: 'seconds',
    higherIsBetter: false,
    description: 'Time required to duplicate a 100GB 8K RAW video project directory.'
  },
  {
    id: 'videoEditing',
    label: '8K Video Timeline Scrubbing',
    unit: 'FPS',
    higherIsBetter: true,
    description: 'Multi-stream 8K ProRes video playback responsiveness without dropped preview frames.'
  },
  {
    id: 'randomIo',
    label: 'Random 4K Read I/O (IOPS)',
    unit: 'IOPS',
    higherIsBetter: true,
    description: 'Random small-file access throughput. Dictates operating system snappiness, database queries, and multi-app launches.'
  }
];
