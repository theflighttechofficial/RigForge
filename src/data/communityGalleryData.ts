export interface CommunityBuild {
  id: string;
  title: string;
  author: string;
  authorRole: string;
  likes: number;
  forksCount: number;
  tag: 'Gaming' | 'Workstation' | 'Budget' | 'Minimalist' | 'RGB Monster' | 'SFF / ITX' | 'AI / ML';
  totalPriceINR: number;
  specs: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
    motherboard: string;
    psu: string;
    case: string;
    presetId?: string;
  };
  description: string;
  publishedAt: string;
  isForkedFrom?: string;
  commentsCount: number;
}

export const INITIAL_COMMUNITY_BUILDS: CommunityBuild[] = [
  {
    id: 'build-varun-blackout',
    title: "🖥️ VARUN'S BLACKOUT BUILD",
    author: 'Varun Sharma',
    authorRole: 'Enthusiast Overclocker',
    likes: 142,
    forksCount: 38,
    tag: 'Minimalist',
    totalPriceINR: 148000,
    specs: {
      cpu: 'Ryzen 7 7800X3D (8C/16T)',
      gpu: 'NVIDIA RTX 4070 Super 12GB',
      ram: '32GB DDR5-6000 CL30 EXPO',
      storage: '2TB PCIe 4.0 NVMe SSD (7400 MB/s)',
      motherboard: 'MSI MAG B650 Tomahawk Wi-Fi',
      psu: '750W 80+ Gold Fully Modular ATX 3.0',
      case: 'Lian Li O11 Dynamic EVO Black',
      presetId: 'preset-1440p-sweetspot'
    },
    description: 'Zero RGB, all stealth blackout aesthetics. Tuning for max 1440p 240Hz esports frame rates with whisper-quiet fan curves.',
    publishedAt: '2 hours ago',
    commentsCount: 19
  },
  {
    id: 'build-priya-ai-neural',
    title: "⚡ PRIYA'S LOCAL AI NEURAL RIG",
    author: 'Priya Nair',
    authorRole: 'Machine Learning Researcher',
    likes: 218,
    forksCount: 57,
    tag: 'AI / ML',
    totalPriceINR: 315000,
    specs: {
      cpu: 'AMD Ryzen 9 7950X (16C/32T)',
      gpu: 'NVIDIA RTX 4090 24GB GDDR6X',
      ram: '64GB (2x32GB) DDR5-6000 CL30',
      storage: '4TB Gen4 NVMe (7500 MB/s)',
      motherboard: 'ASUS ROG Strix X670E-F Gaming Wi-Fi',
      psu: '1000W 80+ Platinum ATX 3.0',
      case: 'Fractal Design Torrent TG',
      presetId: 'preset-4k-workstation'
    },
    description: 'Dedicated local LLM runner (Llama-3 70B quantized) & PyTorch CUDA tensor cruncher. Built with 24GB VRAM headroom.',
    publishedAt: 'Yesterday',
    commentsCount: 34
  },
  {
    id: 'build-aarav-budget-champ',
    title: "🎮 AARAV'S ₹80K BUDGET CHAMPION",
    author: 'Aarav Patel',
    authorRole: 'College Esports Captain',
    likes: 96,
    forksCount: 29,
    tag: 'Budget',
    totalPriceINR: 82000,
    specs: {
      cpu: 'AMD Ryzen 5 7600 (6C/12T)',
      gpu: 'NVIDIA RTX 4060 Ti 8GB',
      ram: '32GB (2x16GB) DDR5-5600',
      storage: '1TB PCIe 4.0 NVMe SSD',
      motherboard: 'Gigabyte B650M Gaming Wi-Fi',
      psu: '650W 80+ Bronze Power Supply',
      case: 'Ant Esports ICE-100 Mesh Cabinet',
      presetId: 'preset-budget-1080p'
    },
    description: 'Maximum FPS extracted per Rupee spent in India. Clean cable management and future-proof AM5 socket upgrade path.',
    publishedAt: '3 days ago',
    commentsCount: 12
  }
];

const LOCAL_STORAGE_KEY = 'silicon_community_builds_v1';

export function getStoredCommunityBuilds(): CommunityBuild[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return INITIAL_COMMUNITY_BUILDS;
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_COMMUNITY_BUILDS;
  }
}

export function saveCommunityBuild(build: CommunityBuild): CommunityBuild[] {
  const current = getStoredCommunityBuilds();
  const updated = [build, ...current];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save build to LocalStorage', err);
  }
  return updated;
}

export function toggleLikeCommunityBuild(id: string): CommunityBuild[] {
  const current = getStoredCommunityBuilds();
  const updated = current.map((b) => (b.id === id ? { ...b, likes: b.likes + 1 } : b));
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {}
  return updated;
}

export function incrementForkCommunityBuild(id: string): CommunityBuild[] {
  const current = getStoredCommunityBuilds();
  const updated = current.map((b) => (b.id === id ? { ...b, forksCount: b.forksCount + 1 } : b));
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {}
  return updated;
}
