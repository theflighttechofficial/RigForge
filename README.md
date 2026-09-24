# ⚡ PC Hardware Performance Matrix & Synergy Engine

> **A browser-based hardware intelligence platform** — 3D assembly visualization, Pareto-efficiency price/performance analysis, AI-powered build diagnostics, and full system simulation, localized for the Indian PC building market (₹ INR).

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white">
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-WebGL-000000?logo=three.js&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-Proprietary-lightgrey">
</p>

---

## 🚀 Overview

**PC Hardware Performance Matrix & Synergy Engine** turns the desktop PC-building experience into an interactive engineering lab. Assemble rigs in a real-time 3D WebGL viewport, hunt for CPU/GPU bottlenecks across resolutions, stress-test voltage and thermal stability, inspect silicon die floorplans, and evaluate price-to-performance frontiers spanning nearly two decades of hardware — all client-side, all localized to the Indian retail market.

It ships as a single-page React app with an optional Express + Gemini backend that powers the natural-language **AI Build Doctor** diagnostic assistant.

---

## 📑 Table of Contents

- [Feature Modules](#-feature-modules)
- [Global UX & Design](#-global-ux--design)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## 🛠️ Feature Modules

### 🧊 3D Spatial Computing & Assembly Studio
Real-time WebGL/Three.js assembly viewport with orbit/pan/zoom camera controls.
- **Exploded View** — separate the chassis to inspect the motherboard, GPU, RAM, AIO, and PSU.
- **Render Modes** — photorealistic PBR, wireframe CAD, and thermal heat-signature overlays.
- **Clearance & Collision Lab** — flags RAM-vs-cooler clashes, GPU-vs-radiator length limits, and PSU shroud/HDD bay conflicts with 3D warning zones.
- **Airflow Simulator** — particle-based intake/exhaust flow, static pressure (positive/neutral/negative), and dust-accumulation forecasting.
- **RGB Lighting Sandbox** — curated presets (Cyberpunk Cyan, Tokyo Violet, Matrix Emerald, and more) with static/breathing/spectrum modes.
- **AR Floor Projector** — WebXR-based 1:1 scale projection of your tower or desk setup via mobile camera.
- **Desk Planner** — plans monitor arms, peripherals, and cable routing in 3D.

### 📊 2D Price-to-Performance Value Matrix
Scatter plot of ₹ price vs. synthetic compute/gaming benchmarks with a dynamically calculated **Pareto efficiency frontier**. Filter by category, market era (2007–2025), and manufacturer; route any part directly into Head-to-Head or Synergy Lab.

### ⚔️ Head-to-Head Architectural Duel
Side-by-side breakdown of clocks, core/thread topology, lithography, TDP, memory bus, and cache — plus a 6-axis normalized workload radar (Esports, 4K Rasterization, Ray Tracing, Video Encoding, 3D Rendering, Local AI/LLM compute) with a contextual value verdict.

### 🔬 Synergy & Bottleneck Lab
- Resolution-sensitive CPU/GPU queue-physics simulation across 1080p/1440p/4K/Workstation loads.
- Adverse mismatch detection (e.g. FX-8350 + RTX 4090) with PCIe/memory-bandwidth chokepoint warnings.
- Real-world FPS projections for demanding AAA titles.
- **Driver Health Panel** — WHQL/branch-age checks with links to official NVIDIA/AMD/Intel driver portals and a DDU clean-install checklist.
- **Stability Test Lab** — Vcore offset & LLC vdroop simulation, 12V transient excursions, thermal-runaway modeling, and a live 15-second stress run with MTBF scoring.
- **Thermal Throttling Panel** — calibrated for high-ambient Indian summers (up to 45°C) across stock/air/AIO cooling tiers.
- **Vector PDF Export** — jsPDF-generated diagnostic engineering reports.

### 🩺 AI Build Doctor
Natural-language build diagnostics (e.g. `Ryzen 5 3600 + RTX 4070 + 16GB RAM`) powered by a server-side Gemini endpoint with a deterministic heuristics fallback — zero client-side API key exposure. Produces a full health report: CPU/GPU balance per resolution, memory headroom audit, socket/platform lifespan, and a prioritized upgrade sequence with engineering rationale.

### 🧙 Troubleshooting Wizard
Guided, decision-tree diagnostics for common build issues — boot failures, black screens, thermal shutdowns, and driver instability — walking the user step-by-step to a root cause.

### 🖥️ Rig Architect (Indian PC Builder)
8-component configurator (CPU, GPU, motherboard, RAM, storage, PSU, cabinet, cooler) with automated socket/VRM/wattage validation, real-time ₹ pricing with 18% GST breakdown, and curated presets from ₹50,000 budget builds to ₹2,50,000 4K titans.

### 💰 Build Cost Optimizer
Suggests component swaps and price-tier alternatives to hit a target budget while minimizing performance loss, with a cost-distribution breakdown.

### 🏆 Build Challenge Mode
Gamified budget/performance challenges — build a rig against constraints (e.g. "best 1440p rig under ₹80,000") and get scored against an optimal target.

### 🖼️ Community Build Gallery
Browse curated example builds with specs, cost breakdowns, and use-case tags for inspiration.

### 🧬 Digital Twin Dashboard
A live, simulated telemetry view of a configured rig — temperatures, clocks, and utilization — mirroring the Stability/Thermal labs in a persistent dashboard format.

### ⏱️ Live Real-Time Benchmark Lab
In-browser canvas stress test measuring real FPS, frame-time variance, and endurance under simulated load.

### 🎛️ RAM Configuration Lab
Models dual/quad-channel population, XMP/EXPO profile impact, and frequency/timing trade-offs on effective bandwidth and latency.

### 💾 Storage Performance Lab
Compares HDD/SATA SSD/NVMe Gen3/Gen4/Gen5 sequential & random I/O, and models real-world load-time impact.

### 🔋 TDP & Battery Estimator
Estimates total system power draw and, for laptop/handheld configurations, projected battery runtime under gaming vs. idle loads.

### 🔬 Silicon Anatomy & Die Inspector
Interactive die floorplans for AMD Zen 4/5 (CCDs, 3D V-Cache, IOD), Intel Raptor/Arrow Lake (compute tiles, P/E-cores, Xe-LPG), and NVIDIA Ada/Blackwell (SMs, Tensor/RT cores) — with transistor density and interconnect tooltips.

### 🪑 Battlestation Desk & Ergonomics Simulator
3D desk/monitor-arm planning with viewing-distance/angle analysis, an ergonomics & health index, and cable-management scoring.

### 📈 Upgrade ROI Engine
Models generational upgrade jumps, computes ₹/FPS gained, and estimates depreciated resale value in the Indian used market.

### ⚡ Electricity & TCO Calculator
State-wise DISCOM tariff modeling (MSEDCL, BESCOM, BSES, TANGEDCO, TSSPDCL, UPPCL, WBSEDCL) for 3-year total cost of ownership comparisons.

### 📚 Hardware Catalog
Searchable spec database of desktop CPUs and GPUs from 2007 to 2025 with full architecture details and launch MSRPs.

---

## 🎨 Global UX & Design

- **Adaptive Theming** — cyberpunk dark mode and a high-contrast light mode, both WCAG AA compliant.
- **Global Search** (`Ctrl+K` / `Cmd+K`) — fuzzy search across every CPU, GPU, and architecture tag.
- **Indian Localization** — Lakhs/Crores numbering and ₹ INR formatting throughout.
- **Motion** — smooth route/modal transitions via `motion/react`.
- **Privacy-first** — runs entirely client-side with `localStorage` persistence; the only network calls are the optional AI Build Doctor requests.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build tool | [Vite 6](https://vitejs.dev/) |
| 3D / WebGL | [Three.js](https://threejs.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Animation | [motion](https://motion.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Charts | Chart.js, D3.js |
| PDF export | [jsPDF](https://github.com/parallax/jsPDF) |
| Server | [Express](https://expressjs.com/) + [tsx](https://github.com/privatenumber/tsx) |
| AI | [Gemini API](https://ai.google.dev/) via `@google/genai` |

---

## 🏃 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- npm (or Bun, since `bun.lock` is included)

### Installation

```bash
git clone <repo-url>
cd pc-hardware-performance-matrix-synergy-engine
npm install
```

### Development

```bash
npm run dev
```

This starts the Express server (`server.ts`) with Vite in middleware mode, serving the app at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build   # bundles the client with Vite + compiles the server with esbuild
npm start       # runs the compiled server from dist/
```

### Type Checking

```bash
npm run lint    # tsc --noEmit
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Enables AI-generated (vs. deterministic fallback) reports in the **AI Build Doctor**. Without it, the app still works using a heuristics-based diagnostic engine. |
| `APP_URL` | Optional | Self-referential base URL, used when deployed behind a proxy/Cloud Run. |

---

## 📁 Project Structure

```
src/
├── components/          # Feature modules (Rig Architect, Synergy Lab, AI Build Doctor, ...)
│   └── spatial/          # Three.js 3D scenes (assembly, airflow, RGB, AR, desk planner)
├── data/                 # Static hardware datasets, presets, and lexicons
└── App.tsx               # Root routing & layout
server.ts                 # Express server + Gemini-backed Build Doctor API
```

---

## 📄 License

This project is built and maintained for PC hardware enthusiasts, system architects, and builders. All manufacturer names, logos, and trademarks (Intel, AMD, NVIDIA) belong to their respective owners.
