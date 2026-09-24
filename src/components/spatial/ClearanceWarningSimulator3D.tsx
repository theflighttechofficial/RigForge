import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  Wrench,
  Info,
  Layers,
  Box,
  Cpu
} from 'lucide-react';
import { CPUItem, GPUItem } from '../../types';

export interface ClearanceWarningSimulator3DProps {
  selectedCpu?: CPUItem;
  selectedGpu?: GPUItem;
}

export const ClearanceWarningSimulator3D: React.FC<ClearanceWarningSimulator3DProps> = ({
  selectedCpu,
  selectedGpu
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clearance Parameters
  const [gpuLengthMm, setGpuLengthMm] = useState<number>(selectedGpu?.Length_mm || 336);
  const [frontCoolingType, setFrontCoolingType] = useState<'fans-only' | 'aio-28mm' | 'aio-push-pull'>('aio-28mm');
  const [coolerHeightMm, setCoolerHeightMm] = useState<number>(165); // e.g. Noctua NH-D15 is 165mm
  const [caseMaxCoolerHeightMm, setCaseMaxCoolerHeightMm] = useState<number>(160); // 160mm case side panel limit
  const [ramHeightMm, setRamHeightMm] = useState<number>(44); // 44mm tall RGB vs 33mm low-profile
  const [topRadiatorMount, setTopRadiatorMount] = useState<boolean>(true);
  const [psuLengthMm, setPsuLengthMm] = useState<number>(180); // 180mm 1000W PSU
  const [hasHddCage, setHasHddCage] = useState<boolean>(true);

  // Calculated Clearances & Collisions
  // Chassis base internal depth: 370mm total inside from PCIe slot backplate to front frame
  const frontCoolingDepthMm = frontCoolingType === 'fans-only' ? 25 : frontCoolingType === 'aio-28mm' ? 52 : 75;
  const maxGpuClearanceMm = 370 - frontCoolingDepthMm;
  const isGpuCollision = gpuLengthMm > maxGpuClearanceMm;
  const gpuOverlapMm = Math.max(0, gpuLengthMm - maxGpuClearanceMm);

  const isCoolerHeightCollision = coolerHeightMm > caseMaxCoolerHeightMm;
  const coolerOverlapMm = Math.max(0, coolerHeightMm - caseMaxCoolerHeightMm);

  const isRamRadiatorCollision = topRadiatorMount && ramHeightMm > 40; // thick top rad blocks tall RAM
  const isPsuCageCollision = hasHddCage && psuLengthMm > 165;

  const totalConflicts =
    (isGpuCollision ? 1 : 0) +
    (isCoolerHeightCollision ? 1 : 0) +
    (isRamRadiatorCollision ? 1 : 0) +
    (isPsuCageCollision ? 1 : 0);

  // Three.js internal references
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animId: number;
    gpuMesh: THREE.Mesh;
    frontRadiatorMesh: THREE.Mesh;
    coolerMesh: THREE.Mesh;
    glassMesh: THREE.Mesh;
    ramMesh: THREE.Mesh;
    psuMesh: THREE.Mesh;
    hddCageMesh: THREE.Mesh;
    collisionBoxGpu: THREE.Mesh;
    collisionBoxCooler: THREE.Mesh;
    rotX: number;
    rotY: number;
  } | null>(null);

  // Auto-Resolve function
  const handleAutoResolve = () => {
    // 1. Move front AIO to top or fans-only so GPU clears
    if (isGpuCollision) {
      setFrontCoolingType('fans-only');
    }
    // 2. Adjust case clearance or switch to 155mm cooler
    if (isCoolerHeightCollision) {
      setCaseMaxCoolerHeightMm(170); // Upgrade to roomier mid-tower
    }
    // 3. Switch to low-profile RAM (33mm)
    if (isRamRadiatorCollision) {
      setRamHeightMm(33);
    }
    // 4. Remove HDD cage for long PSU
    if (isPsuCageCollision) {
      setHasHddCage(false);
    }
  };

  // Build Three.js 3D Clearance Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b); // zinc-950

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(26, 18, 28);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 30, 25);
    scene.add(dirLight);

    const redLight = new THREE.PointLight(0xef4444, totalConflicts > 0 ? 3.0 : 0.0, 30);
    redLight.position.set(-6, 3, 0);
    scene.add(redLight);

    // Grid floor
    const grid = new THREE.GridHelper(60, 30, 0x06b6d4, 0x27272a);
    grid.position.y = -8;
    scene.add(grid);

    // Chassis Outer Wireframe Bounds
    const chassisWire = new THREE.Mesh(
      new THREE.BoxGeometry(22, 22, 11),
      new THREE.MeshBasicMaterial({ color: 0x3f3f46, wireframe: true, transparent: true, opacity: 0.3 })
    );
    chassisWire.position.set(0, 3, 0);
    scene.add(chassisWire);

    // Motherboard Tray & PSU Shroud
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const moboTray = new THREE.Mesh(new THREE.BoxGeometry(16, 16, 0.4), innerMat);
    moboTray.position.set(0, 4, -4.2);
    scene.add(moboTray);

    const psuShroud = new THREE.Mesh(new THREE.BoxGeometry(21.8, 4, 10.8), innerMat);
    psuShroud.position.set(0, -6, 0);
    scene.add(psuShroud);

    // 1. GPU MODEL & COLLISION ZONE
    // Scale: 1 unit ~ 20mm
    const gpuLengthUnits = gpuLengthMm / 22;
    const gpuGeo = new THREE.BoxGeometry(gpuLengthUnits, 3.8, 2.6);
    const gpuMat = new THREE.MeshStandardMaterial({
      color: isGpuCollision ? 0xf43f5e : 0x1f2937,
      roughness: 0.4,
      metalness: 0.8
    });
    const gpuMesh = new THREE.Mesh(gpuGeo, gpuMat);
    // Align rear PCIe bracket at fixed rear position x = 8.5
    gpuMesh.position.set(8.5 - gpuLengthUnits / 2, 2, -1.8);
    scene.add(gpuMesh);

    // Pulsing Red Collision Volume for GPU Overlap
    const collisionBoxGpuGeo = new THREE.BoxGeometry(Math.max(0.2, (gpuOverlapMm / 22) * 1.2), 4.2, 3.2);
    const collisionBoxGpuMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: isGpuCollision ? 0.85 : 0
    });
    const collisionBoxGpu = new THREE.Mesh(collisionBoxGpuGeo, collisionBoxGpuMat);
    collisionBoxGpu.position.set(-10 + (frontCoolingDepthMm / 22) / 2, 2, -1.8);
    scene.add(collisionBoxGpu);

    // 2. FRONT COOLING (FANS / RADIATOR)
    const frontDepthUnits = frontCoolingDepthMm / 22;
    const frontRadGeo = new THREE.BoxGeometry(frontDepthUnits, 18, 8);
    const frontRadMat = new THREE.MeshStandardMaterial({
      color: isGpuCollision ? 0xef4444 : 0x27272a,
      roughness: 0.5,
      metalness: 0.6,
      transparent: isGpuCollision,
      opacity: isGpuCollision ? 0.7 : 1.0
    });
    const frontRadiatorMesh = new THREE.Mesh(frontRadGeo, frontRadMat);
    frontRadiatorMesh.position.set(-10.5 + frontDepthUnits / 2, 3, 0);
    scene.add(frontRadiatorMesh);

    // 3. CPU AIR COOLER & SIDE GLASS PANEL
    // Scale cooler height from motherboard plane (z = -4.2) toward side glass (z = 5.3)
    const coolerHeightUnits = (coolerHeightMm / 20) * 1.1;
    const coolerGeo = new THREE.BoxGeometry(4.8, 5.2, coolerHeightUnits);
    const coolerMat = new THREE.MeshStandardMaterial({
      color: isCoolerHeightCollision ? 0xf43f5e : 0x52525b,
      metalness: 0.8,
      roughness: 0.3
    });
    const coolerMesh = new THREE.Mesh(coolerGeo, coolerMat);
    coolerMesh.position.set(1, 6.5, -4.2 + coolerHeightUnits / 2);
    scene.add(coolerMesh);

    // Side Glass Panel
    const maxGlassZ = -4.2 + (caseMaxCoolerHeightMm / 20) * 1.1;
    const glassGeo = new THREE.BoxGeometry(21.5, 21.5, 0.2);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: isCoolerHeightCollision ? 0xef4444 : 0x0a0a0f,
      transparent: true,
      opacity: isCoolerHeightCollision ? 0.65 : 0.3,
      transmission: 0.7,
      roughness: 0.1
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(0, 3, maxGlassZ);
    scene.add(glassMesh);

    // Pulsing Red Collision Volume for Cooler
    const collisionBoxCooler = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 5.6, Math.max(0.2, coolerOverlapMm / 15)),
      new THREE.MeshBasicMaterial({
        color: 0xef4444,
        wireframe: true,
        transparent: true,
        opacity: isCoolerHeightCollision ? 0.9 : 0
      })
    );
    collisionBoxCooler.position.set(1, 6.5, maxGlassZ);
    scene.add(collisionBoxCooler);

    // 4. RAM STICKS
    const ramHeightUnits = ramHeightMm / 15;
    const ramMat = new THREE.MeshStandardMaterial({
      color: isRamRadiatorCollision ? 0xef4444 : 0x38bdf8,
      roughness: 0.4
    });
    const ramMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, ramHeightUnits, 0.4), ramMat);
    ramMesh.position.set(-3.8, 6.5, -3.4);
    scene.add(ramMesh);

    // 5. PSU & HDD SHROUD CAGE
    const psuLengthUnits = psuLengthMm / 22;
    const psuGeo = new THREE.BoxGeometry(psuLengthUnits, 3.2, 5.5);
    const psuMat = new THREE.MeshStandardMaterial({
      color: isPsuCageCollision ? 0xef4444 : 0x27272a,
      roughness: 0.6
    });
    const psuMesh = new THREE.Mesh(psuGeo, psuMat);
    psuMesh.position.set(10 - psuLengthUnits / 2, -6, 0);
    scene.add(psuMesh);

    // 3.5" HDD Cage
    const hddCageGeo = new THREE.BoxGeometry(4.5, 3.4, 5.8);
    const hddCageMat = new THREE.MeshStandardMaterial({
      color: isPsuCageCollision ? 0xf43f5e : 0x3f3f46,
      transparent: !hasHddCage,
      opacity: hasHddCage ? 1.0 : 0.15
    });
    const hddCageMesh = new THREE.Mesh(hddCageGeo, hddCageMat);
    hddCageMesh.position.set(0, -6, 0);
    scene.add(hddCageMesh);

    // Orbit Mouse Controls
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotX = 0.3;
    let rotY = 0.55;
    const distance = 40;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      rotY += dx * 0.008;
      rotX = Math.max(-0.2, Math.min(1.2, rotX + dy * 0.008));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const canvasEl = canvasRef.current;
    canvasEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop with Collision Pulse
    let animId = 0;
    let pulseTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      pulseTime += 0.05;

      camera.position.x = distance * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = distance * Math.sin(rotX) + 3;
      camera.position.z = distance * Math.cos(rotY) * Math.cos(rotX);
      camera.lookAt(0, 3, 0);

      // Pulse collision volumes in red if active
      if (isGpuCollision) {
        const pulseScale = 1.0 + Math.sin(pulseTime * 3) * 0.08;
        collisionBoxGpu.scale.set(pulseScale, pulseScale, pulseScale);
      }
      if (isCoolerHeightCollision) {
        const pulseScale2 = 1.0 + Math.sin(pulseTime * 3 + 1) * 0.08;
        collisionBoxCooler.scale.set(pulseScale2, pulseScale2, pulseScale2);
      }

      renderer.render(scene, camera);
    };

    animate();

    threeRef.current = {
      scene,
      camera,
      renderer,
      animId,
      gpuMesh,
      frontRadiatorMesh,
      coolerMesh,
      glassMesh,
      ramMesh,
      psuMesh,
      hddCageMesh,
      collisionBoxGpu,
      collisionBoxCooler,
      rotX,
      rotY
    };

    const handleResize = () => {
      if (!containerRef.current || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvasEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [
    gpuLengthMm,
    frontCoolingType,
    coolerHeightMm,
    caseMaxCoolerHeightMm,
    ramHeightMm,
    topRadiatorMount,
    psuLengthMm,
    hasHddCage,
    isGpuCollision,
    isCoolerHeightCollision,
    isRamRadiatorCollision,
    isPsuCageCollision
  ]);

  return (
    <div className="space-y-6">
      {/* 3D Collision Viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-[520px] sm:h-[580px] rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl"
      >
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Floating Conflict Status HUD */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-zinc-950/90 backdrop-blur-md p-2 rounded-2xl border border-zinc-800">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${
                totalConflicts === 0
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                  : 'bg-rose-950/90 text-rose-300 border-rose-700 animate-pulse'
              }`}
            >
              {totalConflicts === 0 ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {totalConflicts === 0
                  ? 'Zero Clearance Conflicts Detected (100% Fit Verified)'
                  : `${totalConflicts} Physical Collision Zone(s) Detected!`}
              </span>
            </div>
          </div>

          {/* Auto Resolve Button */}
          {totalConflicts > 0 && (
            <button
              onClick={handleAutoResolve}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Auto-Resolve 3D Conflicts</span>
            </button>
          )}
        </div>

        {/* Active Overlap Alert Banners */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2 pointer-events-none">
          {isGpuCollision && (
            <div className="pointer-events-auto p-3.5 rounded-2xl bg-rose-950/90 backdrop-blur-md border border-rose-700 text-rose-200 text-xs font-mono flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>GPU Collision:</strong> Graphics card length ({gpuLengthMm}mm) exceeds max clearance (
                  {maxGpuClearanceMm}mm) by <strong>{gpuOverlapMm}mm</strong> with front {frontCoolingType} installed!
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900 font-bold uppercase">Overlap Red Zone</span>
            </div>
          )}

          {isCoolerHeightCollision && (
            <div className="pointer-events-auto p-3.5 rounded-2xl bg-rose-950/90 backdrop-blur-md border border-rose-700 text-rose-200 text-xs font-mono flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Cooler Height Collision:</strong> CPU tower cooler ({coolerHeightMm}mm) exceeds chassis side
                  glass panel clearance ({caseMaxCoolerHeightMm}mm) by <strong>{coolerOverlapMm}mm</strong>!
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900 font-bold uppercase">Side Glass Blocks</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Clearance Adjustment Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario 1: GPU Length & Front Cooling */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between text-sm font-mono font-bold text-white">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" />
              <span>1. GPU Length vs Front Fans</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono ${
                isGpuCollision ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-zinc-800 text-emerald-400'
              }`}
            >
              {isGpuCollision ? `-${gpuOverlapMm}mm Collision` : 'Pass'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-400">Card Length:</span>
                <span className="text-cyan-400 font-bold">{gpuLengthMm}mm</span>
              </div>
              <input
                type="range"
                min="240"
                max="375"
                step="5"
                value={gpuLengthMm}
                onChange={(e) => setGpuLengthMm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>240mm (Dual-Fan)</span>
                <span>336mm (RTX 4080)</span>
                <span>365mm (ROG Strix 4090)</span>
              </div>
            </div>

            {/* Front Mount Radiator Option */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-zinc-400 font-bold block">Front Intake Thickness:</span>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                {[
                  { id: 'fans-only', label: 'Fans (25mm)', max: 345 },
                  { id: 'aio-28mm', label: '28mm AIO (52mm)', max: 318 },
                  { id: 'aio-push-pull', label: 'Push-Pull (75mm)', max: 295 }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFrontCoolingType(item.id as typeof frontCoolingType)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      frontCoolingType === item.id
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="text-[11px] block">{item.label}</span>
                    <span className="text-[9px] text-zinc-500 block">Max: {item.max}mm</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scenario 2: CPU Cooler Height vs Glass */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between text-sm font-mono font-bold text-white">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>2. Air Cooler vs Side Glass</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono ${
                isCoolerHeightCollision
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-zinc-800 text-emerald-400'
              }`}
            >
              {isCoolerHeightCollision ? `+${coolerOverlapMm}mm Block` : 'Pass'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-400">Cooler Height:</span>
                <span className="text-amber-400 font-bold">{coolerHeightMm}mm</span>
              </div>
              <input
                type="range"
                min="135"
                max="175"
                step="1"
                value={coolerHeightMm}
                onChange={(e) => setCoolerHeightMm(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>135mm (Low-profile)</span>
                <span>157mm (Peerless Assassin)</span>
                <span>165mm (NH-D15)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-400">Case Max Clearance:</span>
                <span className="text-white font-bold">{caseMaxCoolerHeightMm}mm</span>
              </div>
              <div className="flex gap-2">
                {[155, 160, 170, 185].map((h) => (
                  <button
                    key={h}
                    onClick={() => setCaseMaxCoolerHeightMm(h)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                      caseMaxCoolerHeightMm === h
                        ? 'bg-amber-950 text-amber-300 border-amber-600'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {h}mm
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scenario 3 & 4: RAM Height & PSU Shroud Clearance */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between text-sm font-mono font-bold text-white">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>3. RAM & PSU Shroud Clearance</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono ${
                isRamRadiatorCollision || isPsuCageCollision
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-zinc-800 text-emerald-400'
              }`}
            >
              {isRamRadiatorCollision ? 'RAM Blocked' : isPsuCageCollision ? 'PSU Blocked' : 'All Cleared'}
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {/* RAM Module Profile */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">RAM Heatsink Profile:</span>
                <span className="text-cyan-400 font-bold">{ramHeightMm}mm</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRamHeightMm(33)}
                  className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                    ramHeightMm === 33
                      ? 'bg-zinc-800 text-emerald-300 border-emerald-600'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Low-Profile (33mm)
                </button>
                <button
                  onClick={() => setRamHeightMm(44)}
                  className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                    ramHeightMm === 44
                      ? 'bg-zinc-800 text-cyan-300 border-cyan-600'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Tall RGB (44mm)
                </button>
              </div>
            </div>

            {/* PSU Length & HDD Cage */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">PSU Shroud Cage:</span>
                <button
                  onClick={() => setHasHddCage(!hasHddCage)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    hasHddCage ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {hasHddCage ? '3.5" Cage Fitted' : 'Cage Removed'}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">PSU Length ({psuLengthMm}mm):</span>
                <span className={isPsuCageCollision ? 'text-rose-400 font-bold' : 'text-zinc-300'}>
                  {isPsuCageCollision ? 'Collides with Drive Cage' : 'Ample Cable Room'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
