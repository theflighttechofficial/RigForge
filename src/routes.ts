import { ActiveTab } from './types';

// One URL, page title and search description per workspace.
// scripts/generate-sitemap.mjs reads the paths from this file, so keep it the single source.
export interface RouteInfo {
  path: string;
  title: string;
  description: string;
  // Excluded from the sitemap and marked noindex
  hidden?: boolean;
}

export const ROUTES: Record<ActiveTab, RouteInfo> = {
  intro: { path: '/overview', title: 'Overview', description: 'Plan, compare and check PC builds with Indian street prices across 91 CPUs and 78 GPUs. Try the live CPU and GPU pairing check.' },
  myspecs: { path: '/my-pc', title: 'My PC Specs', description: 'Scan your computer with permission and see its processor, RAM type, drives, graphics cards and Wi-Fi adapter in one place.' },
  digitaltwin: { path: '/my-rig', title: 'My Rig', description: 'Keep a record of your PC build with purchase prices, warranties, thermals and upgrade notes.' },
  doctor: { path: '/build-doctor', title: 'Build Doctor', description: 'Enter a CPU, GPU and RAM size for a build health report with bottlenecks at 1080p, 1440p and 4K and a ranked upgrade plan.' },
  matrix: { path: '/value-matrix', title: 'Value Matrix', description: 'Price against performance for every CPU and GPU in the catalog, with Indian rupee pricing.' },
  compare: { path: '/compare', title: 'Head-to-Head Compare', description: 'Compare two CPUs or two GPUs side by side across gaming, ray tracing, video editing, 3D rendering and AI workloads.' },
  synergy: { path: '/bottleneck', title: 'Bottleneck Lab', description: 'Check whether a CPU will hold back a GPU at 1080p, 1440p and 4K, with estimated FPS in popular games.' },
  storagelab: { path: '/storage', title: 'Storage Lab', description: 'Compare HDD, SATA SSD and NVMe Gen 3, 4 and 5 load times and transfer speeds.' },
  ramlab: { path: '/ram', title: 'RAM Lab', description: 'See how memory frequency, CL timings and channel count change latency and bandwidth.' },
  costoptimizer: { path: '/budget', title: 'Budget Optimizer', description: 'Split a fixed rupee budget across CPU, GPU, RAM and storage for gaming, editing or AI work.' },
  challengemode: { path: '/challenges', title: 'Build Challenges', description: 'Hit a performance target under a budget cap and get a score for your parts choice.' },
  community: { path: '/gallery', title: 'Build Gallery', description: 'Sample PC builds plus the builds you save, ready to load into the planner.' },
  troubleshoot: { path: '/troubleshoot', title: 'Troubleshooting', description: 'Step through no power, no display, boot loops and crashes to find the likely faulty part.' },
  builder: { path: '/builder', title: 'Rig Architect', description: 'Pick PC parts, size the power supply with an 80% safety margin and total the build cost in rupees.' },
  spatial3d: { path: '/3d-studio', title: '3D Studio', description: 'Assemble your build in 3D, check GPU and cooler clearance, airflow and RGB lighting.' },
  battlestation: { path: '/dream-setup', title: 'Dream Setup', description: 'Put your build on a desk with a monitor and peripherals and see total cost and power draw.' },
  anatomy: { path: '/anatomy', title: 'Component Anatomy', description: 'What each PC part does, what the specs mean and the most common buying mistakes.' },
  benchmarks: { path: '/benchmarks', title: 'Benchmarks', description: 'Estimated frame rates for specific games by resolution, quality preset, upscaler and frame generation.' },
  roi: { path: '/upgrade-roi', title: 'Upgrade ROI', description: 'See how much extra performance an upgrade buys per rupee spent.' },
  cost: { path: '/power-cost', title: 'Power & Running Cost', description: 'Yearly electricity cost of your PC by Indian state tariff, plus UPS sizing.' },
  catalog: { path: '/catalog', title: 'Hardware Catalog', description: 'Full specifications for every CPU and GPU in the database.' },
  privacy: { path: '/privacy', title: 'Privacy Policy', description: 'What Silicon Matrix collects, why, how long it is kept and your choices.' },
  terms: { path: '/terms', title: 'Terms of Use', description: 'The terms for using Silicon Matrix and its estimates.' },
  contact: { path: '/contact', title: 'Contact', description: 'How to reach the people behind Silicon Matrix.' },
  thanks: { path: '/thanks', title: 'Thank you', description: 'Your build was saved.', hidden: true },
  notfound: { path: '/404', title: 'Page not found', description: 'This page does not exist.', hidden: true }
};

export const LANDING_META = {
  title: 'Silicon Matrix | PC hardware planner with Indian prices',
  description: 'Plan, compare and check PC builds: bottlenecks, FPS estimates, power supply sizing, running costs and a hardware scan of your own PC.'
};

export function tabFromPath(pathname: string): ActiveTab | 'landing' {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return 'landing';
  const hit = (Object.keys(ROUTES) as ActiveTab[]).find((t) => ROUTES[t].path === clean && t !== 'notfound');
  return hit ?? 'notfound';
}
