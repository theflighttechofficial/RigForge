import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildPartModel, Callout, PART_INFO, PcPartKey, setupRenderer } from '../three/pcModel';
import { RotateCw } from './icons';

interface PartViewer3DProps {
  part: PcPartKey;
}

// A representative build for the close-ups
const SAMPLE = {
  gpuLengthCm: 30.4,
  gpuName: 'GeForce RTX 4070 Super',
  gpuBrand: 'NVIDIA' as const,
  coolerType: 'Tower Air' as const,
  cpuBrand: 'AMD' as const,
  ramSticks: 2 as const,
  ramType: 'DDR5' as const,
  rgbHex: '#06b6d4'
};

/** Isolated, rotatable 3D model of one part with numbered labels for its sub-parts */
export const PartViewer3D: React.FC<PartViewer3DProps> = ({ part }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const state = useRef<{ controls: OrbitControls; callouts: Callout[] } | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const light = document.documentElement.classList.contains('light');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(light ? 0xf1f3f6 : 0x111216);
    const disposeEnv = setupRenderer(renderer, scene);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(30, 50, 60);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe8ff, 0.9);
    rim.position.set(-40, 20, -40);
    scene.add(rim);

    const { group, callouts: cs, rotors, focusSize, dispose } = buildPartModel(part, { ...SAMPLE, finish: light ? 'white' : 'black' });
    // The case is shown without its glass; it carries the most useful callouts that way
    scene.add(group);
    setCallouts(cs);
    setActive(null);

    // Frame the part
    // Small parts (CPU, M.2) get a minimum distance so the board around them stays readable
    const size = Math.max(focusSize.length(), 9);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 2000);
    camera.position.set(size * 0.7, size * 0.45, size * 1.35);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.minDistance = size * 0.4;
    controls.maxDistance = size * 3;
    controls.target.set(0, 0, 0);
    state.current = { controls, callouts: cs };

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.zoom = Math.min(1, camera.aspect / 1.25);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    const v = new THREE.Vector3();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      controls.update();
      rotors.forEach((r) => (r.rotation.y += 0.08));
      renderer.render(scene, camera);
      const layer = labelRef.current;
      if (!layer) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      cs.forEach((c, i) => {
        const el = layer.children[i] as HTMLElement | undefined;
        if (!el) return;
        c.anchor.getWorldPosition(v).project(camera);
        el.style.display = v.z < 1 ? 'block' : 'none';
        el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
        el.style.opacity = activeRef.current === null || activeRef.current === i ? '1' : '0.35';
      });
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      dispose();
      disposeEnv();
      renderer.dispose();
      state.current = null;
    };
  }, [part]);

  useEffect(() => {
    if (state.current) state.current.controls.autoRotate = autoRotate;
  }, [autoRotate]);

  const info = PART_INFO[part];

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="grid md:grid-cols-[minmax(0,1fr)_16rem]">
        <div ref={wrapRef} className="relative h-72 sm:h-96 touch-none">
          <canvas ref={canvasRef} className="block w-full h-full cursor-grab active:cursor-grabbing" onPointerDown={() => setAutoRotate(false)} />
          <div ref={labelRef} className="absolute inset-0 pointer-events-none" aria-hidden>
            {callouts.map((c, i) => (
              <div key={c.key} className="absolute left-0 top-0" style={{ display: 'none' }}>
                <span className="-translate-x-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 rounded-full bg-cyan-500 text-zinc-950 text-xs font-bold ring-2 ring-white">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setAutoRotate((a) => !a)}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/90 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 cursor-pointer"
            aria-pressed={autoRotate}
          >
            <RotateCw className="w-3.5 h-3.5" /> {autoRotate ? 'Stop turning' : 'Turn automatically'}
          </button>
          <p className="absolute bottom-3 right-3 hidden sm:block text-[11px] text-zinc-500">Drag to rotate, scroll to zoom</p>
        </div>
        <div className="border-t md:border-t-0 md:border-l border-zinc-800 p-4 space-y-3">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Inside the {info.title.toLowerCase()}</p>
          <ol className="space-y-2">
            {callouts.map((c, i) => (
              <li key={c.key}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="flex gap-2.5 text-left text-sm cursor-default"
                >
                  <span className="grid place-items-center w-5 h-5 shrink-0 rounded-full bg-cyan-500 text-zinc-950 text-[11px] font-bold">{i + 1}</span>
                  <span>
                    <span className="font-medium text-zinc-100">{c.label}.</span> <span className="text-zinc-400">{c.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};
