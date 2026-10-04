import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CPUItem, GPUItem } from '../../types';
import { formatINR } from '../../utils/formatters';
import { spatialAudio } from '../../utils/audioFx';
import { buildPcModel, gpuOptions, PART_INFO, PcModel, PcPartKey, setupRenderer, Callout } from '../../three/pcModel';
import { Eye, EyeOff, Sliders, Maximize2, Volume2, VolumeX, CheckCircle2, Fan, Info, Tag } from '../icons';

export interface AssemblyCanvas3DProps {
  selectedCpu: CPUItem;
  selectedGpu: GPUItem;
  ramType: 'DDR4' | 'DDR5';
  ramCapacity: number;
  coolerType: 'Tower Air' | '360mm AIO' | 'Stock';
  rgbColorHex: string;
  onSelectComponent?: (compName: string) => void;
  theme?: 'dark' | 'light';
}

export type AssemblyStep = PcPartKey;

type CamPreset = 'iso' | 'side' | 'top' | 'gpu' | 'front';
type Env = 'studio' | 'dark' | 'cad';

// Camera position and look-at target per preset (cm, model space)
const CAMERA_PRESETS: Record<CamPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  iso: { pos: [44, 50, 82], target: [2, 25, 0] },
  side: { pos: [0, 26, 96], target: [0, 25, 0] },
  top: { pos: [4, 104, 30], target: [2, 26, 0] },
  gpu: { pos: [24, 14, 52], target: [8, 25, -2] },
  front: { pos: [-96, 30, 20], target: [0, 25, 0] }
};

// How far each part moves when exploded, in cm
const EXPLODE: Record<PcPartKey, [number, number, number]> = {
  case: [0, 0, 0],
  motherboard: [0, 0, 8],
  cpu: [0, 4, 20],
  ram: [0, 10, 24],
  storage: [0, -6, 18],
  gpu: [0, -4, 34],
  cooler: [0, 8, 34],
  psu: [0, -4, 22],
  glass: [0, 0, 48]
};

const ENV_STYLE: Record<Env, { bg: number; floor: number; shadow: number; exposure: number }> = {
  studio: { bg: 0xeef0f3, floor: 0xe4e7eb, shadow: 0.18, exposure: 1.05 },
  dark: { bg: 0x0c0d10, floor: 0x15171b, shadow: 0.4, exposure: 1.15 },
  cad: { bg: 0x0b1222, floor: 0x0f1a30, shadow: 0.3, exposure: 1.1 }
};

const PART_ORDER: PcPartKey[] = ['motherboard', 'cpu', 'ram', 'storage', 'gpu', 'cooler', 'psu', 'case', 'glass'];

export const AssemblyCanvas3D: React.FC<AssemblyCanvas3DProps> = ({
  selectedCpu,
  selectedGpu,
  ramType,
  ramCapacity,
  coolerType,
  rgbColorHex,
  onSelectComponent,
  theme = 'light'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelLayerRef = useRef<HTMLDivElement>(null);

  const [assemblyProgress, setAssemblyProgress] = useState(100);
  const [isGlassInstalled, setIsGlassInstalled] = useState(false);
  const [activeCamPreset, setActiveCamPreset] = useState<CamPreset>('iso');
  const [env, setEnv] = useState<Env>(theme === 'light' ? 'studio' : 'dark');
  const [finish, setFinish] = useState<'black' | 'white'>(theme === 'light' ? 'white' : 'black');
  const [powerState, setPowerState] = useState<'off' | 'idle' | 'turbo'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [inspectedPart, setInspectedPart] = useState<PcPartKey>('gpu');
  const [showLabels, setShowLabels] = useState(true);
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [snappedParts, setSnappedParts] = useState<Record<PcPartKey, boolean>>({
    case: true, motherboard: true, cpu: true, ram: true, storage: true, gpu: true, cooler: true, psu: true, glass: true
  });

  const fanRpm = powerState === 'off' ? 0 : powerState === 'idle' ? 1100 : 2200;

  const three = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    floor: THREE.Mesh;
    grid: THREE.GridHelper;
    outline: THREE.Box3Helper;
    model: PcModel | null;
    camGoal: { pos: THREE.Vector3; target: THREE.Vector3 } | null;
    rpm: number;
    raf: number;
  } | null>(null);
  // Latest values for the render loop without re-running effects
  const live = useRef({ inspected: inspectedPart, showLabels, callouts });
  live.current = { inspected: inspectedPart, showLabels, callouts };

  // Scene setup, once
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const disposeEnv = setupRenderer(renderer, scene);

    const camera = new THREE.PerspectiveCamera(35, 1, 1, 1000);
    camera.position.set(...CAMERA_PRESETS.iso.pos);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(...CAMERA_PRESETS.iso.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 35;
    controls.maxDistance = 220;
    controls.maxPolarAngle = Math.PI * 0.53;
    controls.screenSpacePanning = true;
    controls.addEventListener('start', () => {
      if (three.current) three.current.camGoal = null;
    });

    // Key light with soft shadows, a cool fill and a rim from behind
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(60, 110, 90);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0004;
    Object.assign(key.shadow.camera, { left: -60, right: 60, top: 70, bottom: -10, near: 10, far: 300 });
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6);
    fill.position.set(-80, 40, 60);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(20, 60, -100);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b0, 0.35));

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ opacity: 0.18 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(300, 60, 0x3b82f6, 0x1e3a5f);
    grid.visible = false;
    scene.add(grid);

    const outline = new THREE.Box3Helper(new THREE.Box3(), new THREE.Color(0x06b6d4));
    scene.add(outline);

    three.current = { scene, camera, renderer, controls, floor, grid, outline, model: null, camGoal: null, rpm: 0, raf: 0 };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Narrow (portrait) viewports zoom out so the whole case still fits
      camera.zoom = Math.min(1, camera.aspect / 1.25);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let last = performance.now();
    const tmp = new THREE.Vector3();
    const loop = () => {
      const t = three.current;
      if (!t) return;
      t.raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (t.camGoal) {
        t.camera.position.lerp(t.camGoal.pos, 0.12);
        t.controls.target.lerp(t.camGoal.target, 0.12);
        if (t.camera.position.distanceTo(t.camGoal.pos) < 0.2) t.camGoal = null;
      }
      t.controls.update();
      if (t.model) {
        const spin = (t.rpm / 60) * Math.PI * 2 * dt;
        t.model.rotors.forEach((r) => (r.rotation.y += spin));
        const part = t.model.parts[live.current.inspected];
        if (part?.visible) {
          t.outline.box.setFromObject(part).expandByScalar(0.6);
          t.outline.visible = true;
        } else {
          t.outline.visible = false;
        }
      }
      t.renderer.render(t.scene, t.camera);

      // Position the HTML callout labels over their 3D anchors
      const layer = labelLayerRef.current;
      if (layer) {
        const w = t.renderer.domElement.clientWidth;
        const h = t.renderer.domElement.clientHeight;
        live.current.callouts.forEach((c, i) => {
          const el = layer.children[i] as HTMLElement | undefined;
          if (!el) return;
          c.anchor.getWorldPosition(tmp);
          const visible = live.current.showLabels && isObjectShown(c.anchor);
          tmp.project(t.camera);
          const onScreen = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
          el.style.display = visible && onScreen ? 'block' : 'none';
          el.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
        });
      }
    };
    loop();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(three.current?.raf ?? 0);
      three.current?.model?.dispose();
      controls.dispose();
      disposeEnv();
      renderer.dispose();
      three.current = null;
    };
  }, []);

  // (Re)build the PC whenever the parts or finish change
  const cpuBrand = selectedCpu.Brand === 'Intel' ? 'Intel' : 'AMD';
  const ramSticks: 2 | 4 = ramCapacity >= 64 ? 4 : 2;
  useEffect(() => {
    const t = three.current;
    if (!t) return;
    t.model?.root.removeFromParent();
    t.model?.dispose();
    const model = buildPcModel({
      ...gpuOptions(selectedGpu),
      coolerType,
      cpuBrand,
      ramSticks,
      ramType,
      rgbHex: rgbColorHex,
      finish
    });
    t.scene.add(model.root);
    t.model = model;
    applyLayout();
    setCallouts((model.parts[inspectedPart].userData.callouts ?? []) as Callout[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGpu.id, coolerType, cpuBrand, ramSticks, ramType, finish]);

  // RGB colour updates in place
  useEffect(() => {
    const m = three.current?.model?.rgbMaterial;
    if (!m) return;
    m.color.set(rgbColorHex);
    m.emissive.set(rgbColorHex);
  }, [rgbColorHex]);

  // Explode slider, snap toggles and glass
  const applyLayout = () => {
    const model = three.current?.model;
    if (!model) return;
    const t = (100 - assemblyProgress) / 100;
    PART_ORDER.forEach((key) => {
      const g = model.parts[key];
      const off = EXPLODE[key];
      const seated = snappedParts[key];
      const k = key === 'glass' ? (isGlassInstalled ? t : 1) : seated ? t : 1;
      g.position.set(off[0] * k, off[1] * k, off[2] * k);
    });
    model.parts.glass.visible = isGlassInstalled;
  };
  useEffect(applyLayout, [assemblyProgress, snappedParts, isGlassInstalled]);

  // Inspector callouts follow the selected part
  useEffect(() => {
    const model = three.current?.model;
    if (model) setCallouts((model.parts[inspectedPart].userData.callouts ?? []) as Callout[]);
  }, [inspectedPart]);

  // Environment
  useEffect(() => {
    const t = three.current;
    if (!t) return;
    const s = ENV_STYLE[env];
    t.scene.background = new THREE.Color(s.bg);
    (t.floor.material as THREE.ShadowMaterial).opacity = s.shadow;
    t.renderer.toneMappingExposure = s.exposure;
    t.grid.visible = env === 'cad';
  }, [env]);

  useEffect(() => {
    setEnv(theme === 'light' ? 'studio' : 'dark');
  }, [theme]);

  useEffect(() => {
    if (three.current) three.current.rpm = fanRpm;
    if (powerState === 'turbo') spatialAudio.playOverclockSuccess();
  }, [fanRpm, powerState]);

  const setCameraPreset = (preset: CamPreset) => {
    const t = three.current;
    if (!t) return;
    setActiveCamPreset(preset);
    t.camGoal = { pos: new THREE.Vector3(...CAMERA_PRESETS[preset].pos), target: new THREE.Vector3(...CAMERA_PRESETS[preset].target) };
  };

  // Click (not drag) selects the part under the pointer
  const down = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = down.current;
    down.current = null;
    const t = three.current;
    if (!start || !t?.model || !canvasRef.current) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), t.camera);
    const hits = ray.intersectObject(t.model.root, true);
    for (const hit of hits) {
      let o: THREE.Object3D | null = hit.object;
      while (o && !o.userData.partKey) o = o.parent;
      const key = o?.userData.partKey as PcPartKey | undefined;
      // The glass and case shell would block every click; only pick them when nothing else is behind
      if (!key || ((key === 'glass' || key === 'case') && hits.some((h) => findPart(h.object) && !['glass', 'case'].includes(findPart(h.object)!)))) continue;
      setInspectedPart(key);
      spatialAudio.playClick();
      onSelectComponent?.(key);
      break;
    }
  };

  const toggleSnapPart = (key: PcPartKey) => {
    const next = !snappedParts[key];
    setSnappedParts((prev) => ({ ...prev, [key]: next }));
    if (next) {
      if (key === 'ram') spatialAudio.playRamLatch();
      else if (key === 'glass') spatialAudio.playScrewTighten();
      else spatialAudio.playSnapIn();
    }
  };

  const partName = (key: PcPartKey) =>
    key === 'gpu' ? selectedGpu.Model
      : key === 'cpu' ? selectedCpu.Model
      : key === 'cooler' ? (coolerType === 'Tower Air' ? 'Dual-tower air cooler' : coolerType === 'Stock' ? 'Stock box cooler' : '360 mm liquid AIO')
      : key === 'ram' ? `${ramCapacity} GB ${ramType} (${ramSticks} sticks)`
      : key === 'psu' ? '850 W 80 PLUS Gold modular'
      : key === 'storage' ? '2 TB PCIe 4.0 NVMe SSD'
      : key === 'motherboard' ? `${selectedCpu.Socket} ATX motherboard`
      : key === 'glass' ? 'Tempered glass side panel'
      : 'Mid-tower ATX case';

  const partFacts = (key: PcPartKey): [string, string][] => {
    switch (key) {
      case 'gpu':
        return [['Length', `${selectedGpu.Length_mm || 300} mm`], ['Board power', `${selectedGpu.TGP_Watts} W`], ['Memory', `${selectedGpu.VRAM_GB} GB ${selectedGpu.Memory_Type}`], ['Price', formatINR(selectedGpu.Price_INR)]];
      case 'cpu':
        return [['Cores / threads', `${selectedCpu.Cores} / ${selectedCpu.Threads}`], ['Socket', selectedCpu.Socket], ['TDP', `${selectedCpu.TDP_Watts} W`], ['Price', formatINR(selectedCpu.Price_INR)]];
      case 'cooler':
        return coolerType === 'Tower Air'
          ? [['Height', '158 mm'], ['Heatpipes', '6 × 6 mm copper'], ['Fans', '2 × 120 mm']]
          : coolerType === 'Stock'
          ? [['Height', '~70 mm'], ['Fan', '1 × 92 mm'], ['Best for', '65 W CPUs']]
          : [['Radiator', '360 × 120 × 27 mm'], ['Fans', '3 × 120 mm'], ['Mount', 'Case top, exhaust']];
      case 'ram':
        return [['Capacity', `${ramCapacity} GB`], ['Type', ramType], ['Layout', ramSticks === 2 ? 'Slots A2 + B2 (dual channel)' : 'All four slots']];
      case 'psu':
        return [['Rated output', '850 W'], ['Efficiency', '80 PLUS Gold'], ['GPU cable', '12V-2x6 (16-pin)']];
      case 'storage':
        return [['Form factor', 'M.2 2280'], ['Interface', 'PCIe 4.0 x4 NVMe'], ['Sequential read', '~7,400 MB/s']];
      case 'motherboard':
        return [['Form factor', 'ATX, 305 × 244 mm'], ['Socket', selectedCpu.Socket], ['Memory', `${ramType}, 4 slots`]];
      case 'case':
        return [['Size', '460 × 476 × 230 mm'], ['Fans', '3 front intake, 1 rear exhaust'], ['GPU clearance', 'up to 360 mm']];
      default:
        return [['Thickness', '4 mm'], ['Fixing', '4 thumb screws']];
    }
  };

  const info = PART_INFO[inspectedPart];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Viewport */}
        <div ref={containerRef} className="relative w-full h-[500px] sm:h-[560px] xl:h-[640px] rounded-lg border border-zinc-800 overflow-hidden select-none touch-none bg-zinc-900">
          <canvas ref={canvasRef} className="block w-full h-full cursor-grab active:cursor-grabbing" onPointerDown={onPointerDown} onPointerUp={onPointerUp} />

          {/* Callout labels for the selected part */}
          <div ref={labelLayerRef} className="absolute inset-0 pointer-events-none" aria-hidden>
            {callouts.map((c, i) => (
              <div key={c.key} className="absolute left-0 top-0" style={{ display: 'none' }}>
                <div className="-translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="grid place-items-center w-5 h-5 rounded-full bg-cyan-500 text-zinc-950 text-[11px] font-bold ring-2 ring-white/80">{i + 1}</span>
                  <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-zinc-950/85 text-white text-[11px] font-medium whitespace-nowrap">{c.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* View controls */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
            <div className="pointer-events-auto flex flex-wrap gap-1 rounded-md border border-zinc-700 bg-zinc-900/90 p-1 text-[11px] font-semibold">
              {(['iso', 'side', 'top', 'gpu', 'front'] as CamPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setCameraPreset(p)}
                  className={`px-2 py-1 rounded cursor-pointer ${activeCamPreset === p ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-800'}`}
                >
                  {p === 'iso' ? '3/4 view' : p === 'side' ? 'Side' : p === 'top' ? 'Top' : p === 'gpu' ? 'GPU close-up' : 'Front'}
                </button>
              ))}
            </div>
            <div className="pointer-events-auto hidden sm:flex gap-1 rounded-md border border-zinc-700 bg-zinc-900/90 p-1 text-[11px] font-semibold">
              {(['studio', 'dark', 'cad'] as Env[]).map((e) => (
                <button key={e} onClick={() => setEnv(e)} className={`px-2 py-1 rounded capitalize cursor-pointer ${env === e ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                  {e}
                </button>
              ))}
            </div>
            <div className="pointer-events-auto flex gap-1 rounded-md border border-zinc-700 bg-zinc-900/90 p-1 text-[11px] font-semibold">
              {(['white', 'black'] as const).map((f) => (
                <button key={f} onClick={() => setFinish(f)} className={`px-2 py-1 rounded capitalize cursor-pointer ${finish === f ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                  {f} case
                </button>
              ))}
            </div>
            <div className="pointer-events-auto ml-auto flex gap-1">
              <button
                onClick={() => setShowLabels((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md border text-[11px] font-semibold cursor-pointer ${showLabels ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300' : 'border-zinc-700 bg-zinc-900/90 text-zinc-300'}`}
                aria-pressed={showLabels}
              >
                <Tag className="w-3.5 h-3.5" /> Labels
              </button>
              <button
                onClick={() => setIsGlassInstalled((g) => !g)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-zinc-700 bg-zinc-900/90 text-zinc-300 text-[11px] font-semibold cursor-pointer"
                aria-pressed={isGlassInstalled}
              >
                {isGlassInstalled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} Glass
              </button>
              <button
                onClick={() => {
                  const el = containerRef.current;
                  if (!el) return;
                  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
                  else el.requestFullscreen?.().catch(() => {});
                }}
                className="p-1.5 rounded-md border border-zinc-700 bg-zinc-900/90 text-zinc-300 cursor-pointer"
                aria-label="Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="absolute left-3 bottom-[4.5rem] hidden sm:block text-[11px] text-zinc-400 pointer-events-none">
            Drag to rotate, scroll or pinch to zoom, right-drag to pan. Click a part to inspect it.
          </p>

          {/* Explode and power */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-zinc-700 bg-zinc-900/90 p-2.5">
            <label className="flex flex-1 items-center gap-3 text-xs font-semibold text-zinc-300">
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span className="shrink-0">Exploded view</span>
              <input
                type="range"
                min={0}
                max={100}
                value={100 - assemblyProgress}
                onChange={(e) => setAssemblyProgress(100 - Number(e.target.value))}
                className="flex-1 accent-cyan-500"
                aria-label="Exploded view amount"
              />
              <span className="w-10 text-right font-mono">{100 - assemblyProgress}%</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex rounded border border-zinc-700 p-0.5 text-[11px] font-semibold">
                {(['off', 'idle', 'turbo'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPowerState(s)}
                    className={`px-2 py-0.5 rounded uppercase cursor-pointer ${powerState === s ? (s === 'turbo' ? 'bg-rose-500 text-white' : 'bg-cyan-500 text-zinc-950') : 'text-zinc-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="flex items-center gap-1 text-xs font-mono text-zinc-300">
                <Fan className="w-3.5 h-3.5" /> {fanRpm} RPM
              </span>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <aside className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-4 xl:h-[640px] xl:overflow-y-auto">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">{info.title}</p>
            <h3 className="text-base font-semibold text-white leading-snug">{partName(inspectedPart)}</h3>
            <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed">{info.role}</p>
          </div>
          <dl className="divide-y divide-zinc-800 border-y border-zinc-800 text-sm">
            {partFacts(inspectedPart).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1.5">
                <dt className="text-zinc-400">{k}</dt>
                <dd className="text-right font-medium text-zinc-100">{v}</dd>
              </div>
            ))}
          </dl>
          {callouts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 mb-2">Parts of the {info.title.toLowerCase()}</p>
              <ol className="space-y-2">
                {callouts.map((c, i) => (
                  <li key={c.key} className="flex gap-2.5 text-sm">
                    <span className="grid place-items-center w-5 h-5 shrink-0 rounded-full bg-cyan-500 text-zinc-950 text-[11px] font-bold">{i + 1}</span>
                    <span>
                      <span className="font-medium text-zinc-100">{c.label}.</span> <span className="text-zinc-400">{c.description}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <ul className="space-y-1 text-xs text-zinc-400">
            {info.details.map((d) => (
              <li key={d} className="flex gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {d}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button onClick={() => toggleSnapPart(inspectedPart)} className="flex-1 py-2 rounded-md border border-zinc-700 hover:bg-zinc-800 text-sm font-semibold text-zinc-100 cursor-pointer">
              {snappedParts[inspectedPart] ? 'Pull out' : 'Put back'}
            </button>
            {onSelectComponent && (
              <button onClick={() => onSelectComponent(inspectedPart)} className="px-3 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-sm font-semibold text-zinc-950 cursor-pointer">
                Full specs
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Part list: select, then pull out or put back */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Parts in this build
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAssemblyProgress(100);
                setSnappedParts({ case: true, motherboard: true, cpu: true, ram: true, storage: true, gpu: true, cooler: true, psu: true, glass: true });
                spatialAudio.playSnapIn();
              }}
              className="px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-zinc-950 cursor-pointer"
            >
              Assemble all
            </button>
            <button
              onClick={() => {
                setAssemblyProgress(0);
                spatialAudio.playScrewTighten();
              }}
              className="px-3 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 cursor-pointer"
            >
              Explode all
            </button>
            <button
              onClick={() => {
                spatialAudio.setMuted(!isMuted);
                setIsMuted(!isMuted);
              }}
              className="p-1.5 rounded-md border border-zinc-700 text-zinc-300 cursor-pointer"
              aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {PART_ORDER.map((key) => (
            <div
              key={key}
              className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${inspectedPart === key ? 'border-cyan-500' : 'border-zinc-800'}`}
            >
              <button onClick={() => setInspectedPart(key)} className="min-w-0 text-left cursor-pointer">
                <span className="block text-[11px] font-mono uppercase text-zinc-500">{PART_INFO[key].title}</span>
                <span className="block truncate text-sm font-medium text-zinc-100">{partName(key)}</span>
              </button>
              {key !== 'case' && (
                <button
                  onClick={() => (key === 'glass' ? setIsGlassInstalled((g) => !g) : toggleSnapPart(key))}
                  className="shrink-0 text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {(key === 'glass' ? isGlassInstalled : snappedParts[key]) ? 'Remove' : 'Fit'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

function findPart(o: THREE.Object3D | null): PcPartKey | undefined {
  while (o && !o.userData.partKey) o = o.parent;
  return o?.userData.partKey;
}

function isObjectShown(o: THREE.Object3D | null): boolean {
  while (o) {
    if (!o.visible) return false;
    o = o.parent;
  }
  return true;
}
