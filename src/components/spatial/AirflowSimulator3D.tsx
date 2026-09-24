import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Fan,
  Wind,
  Flame,
  Thermometer,
  Zap,
  RotateCcw,
  Sliders,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Volume2
} from 'lucide-react';

export type CoolingArchitecture = 'aio-top' | 'aio-front' | 'custom-loop' | 'air-tower';

export interface AirflowSimulator3DProps {
  initialArchitecture?: CoolingArchitecture;
  rgbColorHex?: string;
}

export const AirflowSimulator3D: React.FC<AirflowSimulator3DProps> = ({
  initialArchitecture = 'aio-top',
  rgbColorHex = '#06b6d4'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [coolingArch, setCoolingArch] = useState<CoolingArchitecture>(initialArchitecture);
  const [fanSpeedRpm, setFanSpeedRpm] = useState<number>(1400);
  const [frontFanCount, setFrontFanCount] = useState<number>(3); // 3x 140mm
  const [topFanCount, setTopFanCount] = useState<number>(3); // 3x 120mm
  const [rearFanCount, setRearFanCount] = useState<number>(1); // 1x 120mm
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [showStreamlineArrows, setShowStreamlineArrows] = useState<boolean>(true);
  const [isDustFilterOn, setIsDustFilterOn] = useState<boolean>(true);

  // Three.js runtime state
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animId: number;
    particles: THREE.Points;
    particlePositions: Float32Array;
    particleVelocities: Float32Array;
    particleColors: Float32Array;
    arrowHelpers: THREE.ArrowHelper[];
    fanRotators: THREE.Mesh[];
    isDragging: boolean;
    prevX: number;
    prevY: number;
    rotX: number;
    rotY: number;
  } | null>(null);

  // CFM & Thermal Dynamics Calculation
  // 140mm fan ~ 75 CFM, 120mm fan ~ 55 CFM at 1400 RPM
  const rpmFactor = fanSpeedRpm / 1400;
  const intakeCFM = Math.round(frontFanCount * 72 * rpmFactor * (isDustFilterOn ? 0.88 : 1.0));
  const exhaustCFM = Math.round((topFanCount * 54 + rearFanCount * 56) * rpmFactor);
  const cfmBalance = intakeCFM - exhaustCFM;

  // Thermal estimates based on cooling architecture & CFM
  const thermalStats = {
    'aio-top': {
      cpuTemp: Math.max(58, Math.round(72 - (fanSpeedRpm - 800) * 0.008)),
      gpuTemp: Math.max(62, Math.round(68 - (fanSpeedRpm - 800) * 0.005)),
      ambientTemp: 34,
      desc: 'Top AIO exhausts CPU heat straight out the chassis roof. Ideal balance: GPU stays 4-6°C cooler than front AIO mount.'
    },
    'aio-front': {
      cpuTemp: Math.max(54, Math.round(66 - (fanSpeedRpm - 800) * 0.009)),
      gpuTemp: Math.max(67, Math.round(74 - (fanSpeedRpm - 800) * 0.004)),
      ambientTemp: 38,
      desc: 'Front AIO draws fresh ambient room air across radiator. CPU runs 4°C cooler, but warmer intake air slightly raises GPU temps.'
    },
    'custom-loop': {
      cpuTemp: Math.max(48, Math.round(60 - (fanSpeedRpm - 800) * 0.007)),
      gpuTemp: Math.max(50, Math.round(58 - (fanSpeedRpm - 800) * 0.006)),
      ambientTemp: 31,
      desc: 'Custom Dual-Block Open Loop with D5 pump reservoir and 360mm + 280mm dual radiators. Maximum thermal headroom.'
    },
    'air-tower': {
      cpuTemp: Math.max(62, Math.round(76 - (fanSpeedRpm - 800) * 0.007)),
      gpuTemp: Math.max(64, Math.round(70 - (fanSpeedRpm - 800) * 0.005)),
      ambientTemp: 35,
      desc: 'Traditional high-mass dual-tower heatsink with push-pull fans. Zero pump failure risk, ultra-reliable front-to-back wind tunnel.'
    }
  }[coolingArch];

  const noiseDBA = Math.round(24 + (fanSpeedRpm / 2400) * 22);

  // Initialize Three.js Airflow Simulation Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b); // zinc-950

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(28, 16, 32);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 30, 20);
    scene.add(dirLight);

    // Floor grid
    const grid = new THREE.GridHelper(60, 30, 0x06b6d4, 0x27272a);
    grid.position.y = -8;
    scene.add(grid);

    // Semi-transparent Chassis Skeleton
    const caseWireMat = new THREE.MeshBasicMaterial({
      color: 0x3f3f46,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const caseGeo = new THREE.BoxGeometry(22, 22, 11);
    const caseMesh = new THREE.Mesh(caseGeo, caseWireMat);
    caseMesh.position.set(0, 3, 0);
    scene.add(caseMesh);

    // Solid inner trays
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const moboTray = new THREE.Mesh(new THREE.BoxGeometry(16, 16, 0.3), innerMat);
    moboTray.position.set(0, 4, -4);
    scene.add(moboTray);

    const psuShroud = new THREE.Mesh(new THREE.BoxGeometry(21.8, 4, 10.8), innerMat);
    psuShroud.position.set(0, -6, 0);
    scene.add(psuShroud);

    // Simulated GPU & CPU Blocks for thermal transfer visualization
    const gpuMesh = new THREE.Mesh(
      new THREE.BoxGeometry(13, 3.5, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 })
    );
    gpuMesh.position.set(-1, 2, -1.5);
    scene.add(gpuMesh);

    // Cooler representation based on active architecture
    const coolerGroup = new THREE.Group();
    const fanRotators: THREE.Mesh[] = [];

    if (coolingArch === 'air-tower') {
      // Dual-tower air heatsink
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 5, 4),
        new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.8, roughness: 0.3 })
      );
      tower.position.set(1, 6.5, -2);
      coolerGroup.add(tower);
    } else if (coolingArch === 'custom-loop') {
      // Acrylic reservoir with glowing coolant
      const resGeo = new THREE.CylinderGeometry(1.2, 1.2, 6, 24);
      const resMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(rgbColorHex),
        transmission: 0.8,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85
      });
      const res = new THREE.Mesh(resGeo, resMat);
      res.position.set(-5, 4, -2);
      coolerGroup.add(res);

      // Top 360mm Rad
      const rad = new THREE.Mesh(
        new THREE.BoxGeometry(16, 1.2, 5),
        new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7 })
      );
      rad.position.set(0, 11.5, 0);
      coolerGroup.add(rad);
    } else {
      // AIO Radiator
      const isTop = coolingArch === 'aio-top';
      const rad = new THREE.Mesh(
        new THREE.BoxGeometry(isTop ? 16 : 1.5, isTop ? 1.2 : 16, 5),
        new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7 })
      );
      if (isTop) {
        rad.position.set(0, 11.5, 0);
      } else {
        rad.position.set(-9.5, 3, 0);
      }
      coolerGroup.add(rad);

      // CPU Pump block
      const pump = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 1.2, 24),
        new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 })
      );
      pump.rotation.x = Math.PI / 2;
      pump.position.set(1, 6.5, -3);
      coolerGroup.add(pump);
    }
    scene.add(coolerGroup);

    // Directional 3D Arrows (Intake Cool Blue & Exhaust Hot Red)
    const arrowHelpers: THREE.ArrowHelper[] = [];
    const arrowMatBlue = new THREE.Color(0x38bdf8); // Cool blue intake
    const arrowMatRed = new THREE.Color(0xf43f5e); // Hot crimson exhaust

    // 1. Front Intake Arrows (Blue)
    for (let i = 0; i < frontFanCount; i++) {
      const y = -1 + i * 4.2;
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0).normalize(),
        new THREE.Vector3(-14, y, 0),
        5.5,
        arrowMatBlue.getHex(),
        1.5,
        0.8
      );
      scene.add(arrow);
      arrowHelpers.push(arrow);
    }

    // 2. GPU Internal Path Arrows (Blue entering from front, heating up)
    const gpuIntakeArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0).normalize(),
      new THREE.Vector3(-2, 0.5, -1.5),
      2.5,
      arrowMatBlue.getHex(),
      1.0,
      0.5
    );
    scene.add(gpuIntakeArrow);
    arrowHelpers.push(gpuIntakeArrow);

    // 3. Top Exhaust Arrows (Red Hot Air rising)
    for (let j = 0; j < topFanCount; j++) {
      const x = -5 + j * 5;
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0).normalize(),
        new THREE.Vector3(x, 11.5, 0),
        4.5,
        arrowMatRed.getHex(),
        1.4,
        0.7
      );
      scene.add(arrow);
      arrowHelpers.push(arrow);
    }

    // 4. Rear Exhaust Arrow (Red Hot Air pushed out the back)
    for (let k = 0; k < rearFanCount; k++) {
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0).normalize(),
        new THREE.Vector3(8.5, 6.5, -2),
        5.0,
        arrowMatRed.getHex(),
        1.4,
        0.7
      );
      scene.add(arrow);
      arrowHelpers.push(arrow);
    }

    // Dynamic Flowing Particles (Blue -> Heat up -> Red)
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      // Spawn at front intake zone
      positions[p * 3] = -12 + Math.random() * 4;
      positions[p * 3 + 1] = -3 + Math.random() * 12;
      positions[p * 3 + 2] = -4 + Math.random() * 8;

      velocities[p * 3] = 0.12 + Math.random() * 0.08;
      velocities[p * 3 + 1] = 0.02 + Math.random() * 0.04;
      velocities[p * 3 + 2] = (Math.random() - 0.5) * 0.02;

      // Start as cool blue
      colors[p * 3] = 0.2;
      colors[p * 3 + 1] = 0.75;
      colors[p * 3 + 2] = 0.98;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Orbit Drag Controls
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotX = 0.3;
    let rotY = 0.6;
    const distance = 42;

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

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const speedMult = (fanSpeedRpm / 1400) * 1.5;

      // Update camera position from orbit angles
      camera.position.x = distance * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = distance * Math.sin(rotX) + 3;
      camera.position.z = distance * Math.cos(rotY) * Math.cos(rotX);
      camera.lookAt(0, 3, 0);

      // Animate flowing thermal particles
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = particleGeo.getAttribute('color') as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const colArr = colAttr.array as Float32Array;

      for (let p = 0; p < particleCount; p++) {
        const idx = p * 3;
        posArr[idx] += velocities[idx] * speedMult;
        posArr[idx + 1] += velocities[idx + 1] * speedMult;
        posArr[idx + 2] += velocities[idx + 2] * speedMult;

        const px = posArr[idx];
        const py = posArr[idx + 1];

        // Transition particle color from Cool Blue -> Heat Up -> Crimson Red
        if (px < -2) {
          // Intake fresh zone (Blue)
          colArr[idx] = 0.22;
          colArr[idx + 1] = 0.74;
          colArr[idx + 2] = 0.98;
        } else if (px < 4) {
          // Passing over GPU & CPU thermal block (Amber warming)
          colArr[idx] = 0.98;
          colArr[idx + 1] = 0.65;
          colArr[idx + 2] = 0.12;
          // Convection lift
          posArr[idx + 1] += 0.04 * speedMult;
        } else {
          // Exhaust zone (Hot Crimson)
          colArr[idx] = 0.98;
          colArr[idx + 1] = 0.22;
          colArr[idx + 2] = 0.35;
        }

        // Recycle particle once it exits top or rear
        if (posArr[idx] > 14 || posArr[idx + 1] > 14) {
          posArr[idx] = -12 + (Math.random() - 0.5) * 3;
          posArr[idx + 1] = -3 + Math.random() * 12;
          posArr[idx + 2] = -4 + Math.random() * 8;
        }
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    threeRef.current = {
      scene,
      camera,
      renderer,
      animId,
      particles: particleSystem,
      particlePositions: positions,
      particleVelocities: velocities,
      particleColors: colors,
      arrowHelpers,
      fanRotators,
      isDragging,
      prevX,
      prevY,
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
  }, [coolingArch, frontFanCount, topFanCount, rearFanCount]);

  return (
    <div className="space-y-6">
      {/* 3D Airflow Viewport Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[540px] sm:h-[600px] rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl"
      >
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Floating HUD: Pressure Balance & Architecture */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-zinc-950/85 backdrop-blur-md p-2 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/80 text-cyan-300 font-mono text-xs font-bold border border-cyan-800">
              <Wind className="w-3.5 h-3.5" />
              <span>CFM Airflow Vector Dynamics</span>
            </div>

            {/* Positive vs Negative Pressure Badge */}
            <div
              className={`px-3 py-1 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 border ${
                cfmBalance > 15
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                  : cfmBalance < -15
                  ? 'bg-amber-950/90 text-amber-300 border-amber-700'
                  : 'bg-blue-950/90 text-blue-300 border-blue-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {cfmBalance > 15
                  ? 'Positive Air Pressure (Optimal Dust Shield)'
                  : cfmBalance < -15
                  ? 'Negative Air Pressure (Dust Ingress Alert)'
                  : 'Balanced Neutral Pressure'}
              </span>
            </div>
          </div>

          {/* Quick Stats Telemetry Badge */}
          <div className="pointer-events-auto flex items-center gap-2 bg-zinc-950/85 backdrop-blur-md p-2 rounded-2xl border border-zinc-800 font-mono text-xs">
            <div className="px-3 py-1 rounded-xl bg-zinc-900 text-zinc-300 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              <span>CPU: {thermalStats.cpuTemp}°C</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-zinc-900 text-cyan-300 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              <span>GPU: {thermalStats.gpuTemp}°C</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-zinc-900 text-amber-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{noiseDBA} dBA</span>
            </div>
          </div>
        </div>

        {/* Bottom Floating Legend: Thermal Color Gradient */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="pointer-events-auto bg-zinc-950/90 backdrop-blur-md p-3 rounded-2xl border border-zinc-800 flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-zinc-300">Cool Intake Fresh Air (~24°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              <span className="text-zinc-300">Thermal Die Absorption</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              <span className="text-zinc-300">Hot Exhaust Air (~52°C)</span>
            </div>
          </div>

          <div className="pointer-events-auto text-[11px] font-mono text-zinc-400 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800">
            Click & drag to rotate 3D view | Scroll to zoom
          </div>
        </div>
      </div>

      {/* Control Panel: Cooling Architecture Decision Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Architecture Switcher */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Select Cooling Architecture</span>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: 'aio-top',
                name: '360mm AIO (Top Exhaust Mount)',
                desc: 'Balanced setup. Exhausts CPU heat straight out the roof so the GPU gets pure front ambient air.',
                badge: 'Recommended'
              },
              {
                id: 'aio-front',
                name: '360mm AIO (Front Intake Mount)',
                desc: 'Draws fresh outside air through the radiator. CPU runs cooler, but GPU receives pre-warmed case air.',
                badge: 'CPU Focused'
              },
              {
                id: 'custom-loop',
                name: 'Custom Hardline Liquid Loop',
                desc: 'Dual blocks (CPU + GPU) with transparent coolant & D5 reservoir pump. Ultimate thermal headroom.',
                badge: 'Enthusiast'
              },
              {
                id: 'air-tower',
                name: 'Dual-Tower High-Mass Air Cooler',
                desc: 'Twin fin stacks with dual push-pull fans. Zero pump noise, zero leak risk, lifetime mechanical durability.',
                badge: 'Ultra Reliable'
              }
            ].map((arch) => (
              <button
                key={arch.id}
                onClick={() => setCoolingArch(arch.id as CoolingArchitecture)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  coolingArch === arch.id
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-lg'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-white">{arch.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-300">
                    {arch.badge}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{arch.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Col 2: Interactive CFM Balance Calculator */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
            <Wind className="w-4 h-4 text-emerald-400" />
            <span>CFM Static Pressure Balancer</span>
          </div>

          <div className="space-y-3">
            {/* Fan RPM Slider */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                  <Fan className="w-3.5 h-3.5 text-cyan-400" /> Chassis Fan PWM Velocity:
                </span>
                <span className="text-cyan-400 font-bold">{fanSpeedRpm} RPM</span>
              </div>
              <input
                type="range"
                min="600"
                max="2400"
                step="50"
                value={fanSpeedRpm}
                onChange={(e) => setFanSpeedRpm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>600 RPM (Silent)</span>
                <span>1400 RPM (Balanced)</span>
                <span>2400 RPM (Overclock Turbo)</span>
              </div>
            </div>

            {/* Fan Config Count Toggles */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 block uppercase">Front Intake</span>
                <span className="text-sm font-bold text-cyan-400">{frontFanCount}x 140mm</span>
                <div className="text-[10px] text-zinc-400 mt-1">{intakeCFM} CFM</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 block uppercase">Top Exhaust</span>
                <span className="text-sm font-bold text-rose-400">{topFanCount}x 120mm</span>
                <div className="text-[10px] text-zinc-400 mt-1">{Math.round(topFanCount * 54 * rpmFactor)} CFM</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 block uppercase">Rear Exhaust</span>
                <span className="text-sm font-bold text-rose-400">{rearFanCount}x 120mm</span>
                <div className="text-[10px] text-zinc-400 mt-1">{Math.round(rearFanCount * 56 * rpmFactor)} CFM</div>
              </div>
            </div>

            {/* Net CFM Delta */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-mono block font-bold">
                  Net Pressure Differential
                </span>
                <span
                  className={`text-base font-extrabold font-mono ${
                    cfmBalance > 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {cfmBalance > 0 ? `+${cfmBalance}` : cfmBalance} CFM (
                  {cfmBalance > 0 ? 'Positive Pressure' : 'Negative Pressure'})
                </span>
              </div>
              <button
                onClick={() => setIsDustFilterOn(!isDustFilterOn)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer border ${
                  isDustFilterOn
                    ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                    : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                }`}
              >
                Dust Filter: {isDustFilterOn ? 'ON (-12% CFM)' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Col 3: Thermal Decision Breakdown */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
            <Thermometer className="w-4 h-4 text-rose-400" />
            <span>Thermal Decision Analysis</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <p className="text-xs text-zinc-300 leading-relaxed font-mono">{thermalStats.desc}</p>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Chassis Internal Delta T:</span>
                <span className="text-white font-bold">+{thermalStats.ambientTemp - 24}°C above ambient</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Dust Accumulation Risk:</span>
                <span className={`font-bold ${cfmBalance > 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {cfmBalance > 10 ? 'Minimal (Positive Sealing)' : 'High (Seams suck in dust)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Pump Failure Risk:</span>
                <span className="text-zinc-300 font-bold">
                  {coolingArch === 'air-tower' ? '0% (Passive Heatsink)' : 'MTTF ~70,000 Hours'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-cyan-200 leading-relaxed">
              <strong>Pro Tip:</strong> For tropical Indian ambient rooms (32°C+ summer), positive case pressure prevents fine particulate dust from entering through un-filtered expansion slot covers!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
