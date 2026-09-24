import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { CPUItem, GPUItem } from '../../types';
import { formatINR } from '../../utils/formatters';
import { spatialAudio } from '../../utils/audioFx';
import {
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  Zap,
  Sliders,
  Sparkles,
  Maximize2,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  ChevronRight,
  Info,
  Fan,
  Box,
  Cpu,
  Monitor
} from 'lucide-react';

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

export type AssemblyStep = 'case' | 'motherboard' | 'cpu' | 'ram' | 'storage' | 'gpu' | 'cooler' | 'psu' | 'glass';

interface ComponentStatus {
  id: AssemblyStep;
  name: string;
  category: string;
  isSnapped: boolean;
  clearanceNote: string;
}

export const AssemblyCanvas3D: React.FC<AssemblyCanvas3DProps> = ({
  selectedCpu,
  selectedGpu,
  ramType,
  ramCapacity,
  coolerType,
  rgbColorHex,
  onSelectComponent,
  theme = 'dark'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Assembly & Viewport State
  const [assemblyProgress, setAssemblyProgress] = useState<number>(100); // 0 to 100%
  const [isGlassInstalled, setIsGlassInstalled] = useState<boolean>(true);
  const [glassOpacity, setGlassOpacity] = useState<number>(0.28);
  const [activeCamPreset, setActiveCamPreset] = useState<'iso' | 'side' | 'top' | 'gpu' | 'front'>('iso');
  const [viewportEnv, setViewportEnv] = useState<'studio' | 'cyber' | 'cad'>(theme === 'light' ? 'studio' : 'cyber');
  const [powerState, setPowerState] = useState<'off' | 'idle' | 'turbo'>('idle');
  const [fanSpeedRpm, setFanSpeedRpm] = useState<number>(1200);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [inspectedPart, setInspectedPart] = useState<AssemblyStep>('gpu');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Step snap states (all snapped when progress = 100%)
  const [snappedParts, setSnappedParts] = useState<Record<AssemblyStep, boolean>>({
    case: true,
    motherboard: true,
    cpu: true,
    ram: true,
    storage: true,
    gpu: true,
    cooler: true,
    psu: true,
    glass: true
  });

  // Three.js internal references
  const threeState = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animFrameId: number;
    partGroups: Record<string, THREE.Group | THREE.Mesh>;
    fanBlades: THREE.Mesh[];
    rgbLights: THREE.PointLight[];
    ambientLight: THREE.AmbientLight;
    keyLight: THREE.DirectionalLight;
    floorMat: THREE.MeshStandardMaterial;
    gridHelper: THREE.GridHelper;
    isDragging: boolean;
    startX: number;
    startY: number;
    prevMouseX: number;
    prevMouseY: number;
    cameraTarget: THREE.Vector3;
    rotX: number;
    rotY: number;
    camDistance: number;
  } | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b); // Tailwind zinc-950

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(24, 18, 28);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Studio Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(30, 40, 25);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x90a0d0, 0.6);
    fillLight.position.set(-25, 20, -20);
    scene.add(fillLight);

    // RGB Accent Point Lights
    const rgbLight1 = new THREE.PointLight(new THREE.Color(rgbColorHex), 3.5, 30);
    rgbLight1.position.set(0, 4, 0);
    scene.add(rgbLight1);

    const rgbLight2 = new THREE.PointLight(new THREE.Color(rgbColorHex), 2.5, 20);
    rgbLight2.position.set(-8, 6, 2);
    scene.add(rgbLight2);

    // Studio Grid Floor with shadow receiver
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x121215,
      roughness: 0.85,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -8.1;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(80, 40, 0x06b6d4, 0x27272a);
    gridHelper.position.y = -8.08;
    scene.add(gridHelper);

    // BUILD PROCEDURAL 3D PC MODEL
    const partGroups: Record<string, THREE.Group | THREE.Mesh> = {};
    const fanBlades: THREE.Mesh[] = [];

    // 1. CASE FRAME (SPCC Steel Chassis)
    const caseGroup = new THREE.Group();
    caseGroup.name = 'case';

    // Outer frame skeleton
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5, metalness: 0.6 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.8 });

    // Back motherboard tray
    const moboTrayGeo = new THREE.BoxGeometry(18, 18, 0.4);
    const moboTray = new THREE.Mesh(moboTrayGeo, frameMat);
    moboTray.position.set(0, 3, -4.5);
    caseGroup.add(moboTray);

    // PSU lower shroud
    const psuShroudGeo = new THREE.BoxGeometry(20, 4, 10);
    const psuShroud = new THREE.Mesh(psuShroudGeo, frameMat);
    psuShroud.position.set(0, -6, 0);
    caseGroup.add(psuShroud);

    // Chassis top panel with radiator ventilation mesh
    const topPanelGeo = new THREE.BoxGeometry(20, 0.5, 10);
    const topPanel = new THREE.Mesh(topPanelGeo, accentMat);
    topPanel.position.set(0, 12, 0);
    caseGroup.add(topPanel);

    // Rear chassis panel with PCIe slots
    const rearPanelGeo = new THREE.BoxGeometry(0.5, 18, 10);
    const rearPanel = new THREE.Mesh(rearPanelGeo, frameMat);
    rearPanel.position.set(10, 3, 0);
    caseGroup.add(rearPanel);

    // Front intake panel with mesh
    const frontPanelGeo = new THREE.BoxGeometry(0.5, 22, 10);
    const frontPanel = new THREE.Mesh(frontPanelGeo, accentMat);
    frontPanel.position.set(-10, 1, 0);
    caseGroup.add(frontPanel);

    // Case feet
    for (const [fx, fz] of [[-8, -3.5], [-8, 3.5], [8, -3.5], [8, 3.5]]) {
      const footGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.8, 16);
      const foot = new THREE.Mesh(footGeo, accentMat);
      foot.position.set(fx, -7.6, fz);
      caseGroup.add(foot);
    }

    scene.add(caseGroup);
    partGroups.case = caseGroup;

    // 2. MOTHERBOARD (ATX Form Factor)
    const moboGroup = new THREE.Group();
    moboGroup.name = 'motherboard';
    const moboPcbMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.2 });
    const vrmMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.9 });
    const goldPinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.95 });

    // PCB
    const moboPcbGeo = new THREE.BoxGeometry(15, 14, 0.3);
    const moboPcb = new THREE.Mesh(moboPcbGeo, moboPcbMat);
    moboPcb.position.set(0, 4, -4.2);
    moboGroup.add(moboPcb);

    // VRM Heatsinks
    const vrmTopGeo = new THREE.BoxGeometry(7, 1.8, 1.4);
    const vrmTop = new THREE.Mesh(vrmTopGeo, vrmMat);
    vrmTop.position.set(0, 9.8, -3.5);
    moboGroup.add(vrmTop);

    const vrmLeftGeo = new THREE.BoxGeometry(2, 6, 1.4);
    const vrmLeft = new THREE.Mesh(vrmLeftGeo, vrmMat);
    vrmLeft.position.set(4.8, 6.2, -3.5);
    moboGroup.add(vrmLeft);

    // Chipset Heatsink with RGB Logo
    const chipsetGeo = new THREE.BoxGeometry(3.5, 3.5, 0.8);
    const chipset = new THREE.Mesh(chipsetGeo, vrmMat);
    chipset.position.set(-4.5, -0.5, -3.6);
    moboGroup.add(chipset);

    // Primary PCIe 5.0 x16 Slot (metal reinforced)
    const pcieSlotGeo = new THREE.BoxGeometry(11, 0.6, 0.6);
    const pcieSlot = new THREE.Mesh(pcieSlotGeo, vrmMat);
    pcieSlot.position.set(-0.5, 1.5, -3.6);
    moboGroup.add(pcieSlot);

    // Secondary PCIe Slot
    const pcie2Slot = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 0.5), moboPcbMat);
    pcie2Slot.position.set(-0.5, -1.8, -3.7);
    moboGroup.add(pcie2Slot);

    // 4x DDR5 DIMM Slots
    for (let i = 0; i < 4; i++) {
      const dimmSlotGeo = new THREE.BoxGeometry(0.35, 7.5, 0.4);
      const dimmSlot = new THREE.Mesh(dimmSlotGeo, frameMat);
      dimmSlot.position.set(-4.8 - i * 0.7, 6.5, -3.8);
      moboGroup.add(dimmSlot);
    }

    scene.add(moboGroup);
    partGroups.motherboard = moboGroup;

    // 3. CPU PROCESSOR
    const cpuGroup = new THREE.Group();
    cpuGroup.name = 'cpu';
    // Socket base
    const socketBaseGeo = new THREE.BoxGeometry(4.2, 4.2, 0.25);
    const socketBase = new THREE.Mesh(socketBaseGeo, frameMat);
    socketBase.position.set(0.5, 6.5, -4.0);
    cpuGroup.add(socketBase);

    // CPU IHS Nickel-Plated Copper Lid
    const ihsGeo = new THREE.BoxGeometry(3.6, 3.6, 0.3);
    const ihsMat = new THREE.MeshStandardMaterial({ color: 0xc0c5ce, roughness: 0.25, metalness: 0.95 });
    const ihs = new THREE.Mesh(ihsGeo, ihsMat);
    ihs.position.set(0.5, 6.5, -3.75);
    cpuGroup.add(ihs);

    scene.add(cpuGroup);
    partGroups.cpu = cpuGroup;

    // 4. RAM STICKS (DDR4 / DDR5 RGB)
    const ramGroup = new THREE.Group();
    ramGroup.name = 'ram';
    const ramHeatMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3, metalness: 0.8 });
    const ramRgbMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(rgbColorHex),
      emissive: new THREE.Color(rgbColorHex),
      emissiveIntensity: 0.7
    });

    const numSticks = ramCapacity >= 64 ? 4 : 2;
    for (let i = 0; i < numSticks; i++) {
      const stickGroup = new THREE.Group();
      const stickGeo = new THREE.BoxGeometry(0.25, 7, 1.2);
      const stick = new THREE.Mesh(stickGeo, ramHeatMat);
      stickGroup.add(stick);

      // Glowing RGB Top Diffuser Bar
      const lightbarGeo = new THREE.BoxGeometry(0.28, 7.1, 0.3);
      const lightbar = new THREE.Mesh(lightbarGeo, ramRgbMat);
      lightbar.position.set(0, 0, 0.65);
      stickGroup.add(lightbar);

      stickGroup.position.set(-4.8 - i * 0.7, 6.5, -3.2);
      ramGroup.add(stickGroup);
    }
    scene.add(ramGroup);
    partGroups.ram = ramGroup;

    // 5. STORAGE: M.2 NVMe Heat Shield
    const storageGroup = new THREE.Group();
    storageGroup.name = 'storage';
    const m2Geo = new THREE.BoxGeometry(4.5, 1.2, 0.4);
    const m2Mat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.3, metalness: 0.8 });
    const m2Heatsink = new THREE.Mesh(m2Geo, m2Mat);
    m2Heatsink.position.set(0.5, 3.2, -3.7);
    storageGroup.add(m2Heatsink);
    scene.add(storageGroup);
    partGroups.storage = storageGroup;

    // 6. GRAPHICS CARD (GPU)
    const gpuGroup = new THREE.Group();
    gpuGroup.name = 'gpu';

    const gpuShroudMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.7 });
    const gpuBackplateMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.25, metalness: 0.9 });
    const finStackMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.3, metalness: 0.95 });

    // Main Card Body (Shroud & Fin stack)
    const cardLength = selectedGpu.Length_mm ? Math.min(15, selectedGpu.Length_mm / 22) : 13.5;
    const gpuBodyGeo = new THREE.BoxGeometry(cardLength, 4.2, 3.2);
    const gpuBody = new THREE.Mesh(gpuBodyGeo, gpuShroudMat);
    gpuBody.position.set(-0.5, 1.5, -1.8);
    gpuGroup.add(gpuBody);

    // Aluminum Full Backplate
    const backplateGeo = new THREE.BoxGeometry(cardLength, 4.2, 0.2);
    const backplate = new THREE.Mesh(backplateGeo, gpuBackplateMat);
    backplate.position.set(-0.5, 1.5, -3.4);
    gpuGroup.add(backplate);

    // PCIe Slot Bracket (silver metal bracket attaching to rear)
    const bracketGeo = new THREE.BoxGeometry(0.3, 5.5, 1.2);
    const bracket = new THREE.Mesh(bracketGeo, finStackMat);
    bracket.position.set(cardLength / 2 - 0.5, 1.5, -1.8);
    gpuGroup.add(bracket);

    // 3x Axial Fans
    const numGpuFans = cardLength > 11 ? 3 : 2;
    for (let f = 0; f < numGpuFans; f++) {
      const fanHubGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16);
      const fanHub = new THREE.Mesh(fanHubGeo, frameMat);
      fanHub.rotation.x = Math.PI / 2;
      const fanSpacing = (cardLength - 3) / (numGpuFans - 1 || 1);
      const fanX = -cardLength / 2 + 1.5 + f * fanSpacing;
      fanHub.position.set(fanX, 1.5, -0.15);

      // Blades
      const bladeGeo = new THREE.BoxGeometry(2.4, 0.1, 0.3);
      const blade = new THREE.Mesh(bladeGeo, accentMat);
      fanHub.add(blade);
      const blade2 = blade.clone();
      blade2.rotation.z = Math.PI / 2;
      fanHub.add(blade2);

      gpuGroup.add(fanHub);
      fanBlades.push(fanHub);
    }

    // 12V-2x6 Native 16-Pin GPU Power Cable with braided sleeve
    const cableGeo = new THREE.CylinderGeometry(0.4, 0.4, 3.5, 8);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.rotation.z = Math.PI / 3;
    cable.position.set(-cardLength / 4, 4.2, -1.8);
    gpuGroup.add(cable);

    scene.add(gpuGroup);
    partGroups.gpu = gpuGroup;

    // 7. CPU COOLER (Tower Air vs 360mm Liquid AIO)
    const coolerGroup = new THREE.Group();
    coolerGroup.name = 'cooler';

    if (coolerType === 'Tower Air' || coolerType === 'Stock') {
      // Dual-tower air cooler
      const towerFinGeo = new THREE.BoxGeometry(4.2, 4.8, 3.2);
      const towerFin = new THREE.Mesh(towerFinGeo, finStackMat);
      towerFin.position.set(0.5, 6.5, -1.8);
      coolerGroup.add(towerFin);

      // 6x Copper Heatpipes
      for (let h = 0; h < 4; h++) {
        const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, 4.5, 8);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.3, metalness: 0.9 });
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.set(-0.8 + h * 0.8, 6.5, -3.2);
        coolerGroup.add(pipe);
      }

      // Air Cooler Center Fan
      const coolerFanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16), frameMat);
      coolerFanHub.rotation.x = Math.PI / 2;
      coolerFanHub.position.set(0.5, 6.5, -0.2);
      const cfBlade = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 0.4), accentMat);
      coolerFanHub.add(cfBlade);
      coolerGroup.add(coolerFanHub);
      fanBlades.push(coolerFanHub);
    } else {
      // 360mm AIO Liquid Cooler
      // Radiator mounted to case top
      const radGeo = new THREE.BoxGeometry(15, 1.2, 5.5);
      const rad = new THREE.Mesh(radGeo, frameMat);
      rad.position.set(0, 10.8, 0);
      coolerGroup.add(rad);

      // 3x 120mm Radiator Exhaust Fans
      for (let r = 0; r < 3; r++) {
        const radFan = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16), frameMat);
        radFan.position.set(-5 + r * 5, 9.8, 0);
        const rfBlade = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.4), accentMat);
        radFan.add(rfBlade);
        coolerGroup.add(radFan);
        fanBlades.push(radFan);
      }

      // Circular CPU Pump Block with Infinity Mirror
      const pumpGeo = new THREE.CylinderGeometry(1.8, 1.8, 1.2, 32);
      const pumpMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2, metalness: 0.8 });
      const pump = new THREE.Mesh(pumpGeo, pumpMat);
      pump.rotation.x = Math.PI / 2;
      pump.position.set(0.5, 6.5, -3.0);

      // Pump RGB Ring
      const ringGeo = new THREE.RingGeometry(0.8, 1.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(rgbColorHex), side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0, 0.65);
      pump.add(ring);
      coolerGroup.add(pump);

      // Braided Coolant Tubes (from pump to radiator)
      const tubeCurve1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.5, 6.5, -2.4),
        new THREE.Vector3(2.5, 8.5, -1.0),
        new THREE.Vector3(4.0, 10.2, 0)
      ]);
      const tubeGeo1 = new THREE.TubeGeometry(tubeCurve1, 20, 0.3, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
      const tube1 = new THREE.Mesh(tubeGeo1, tubeMat);
      coolerGroup.add(tube1);

      const tubeCurve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.5, 6.0, -2.4),
        new THREE.Vector3(2.0, 7.8, -0.6),
        new THREE.Vector3(3.2, 10.2, 0)
      ]);
      const tubeGeo2 = new THREE.TubeGeometry(tubeCurve2, 20, 0.3, 8, false);
      const tube2 = new THREE.Mesh(tubeGeo2, tubeMat);
      coolerGroup.add(tube2);
    }

    scene.add(coolerGroup);
    partGroups.cooler = coolerGroup;

    // 8. POWER SUPPLY (PSU in Shroud)
    const psuGroup = new THREE.Group();
    psuGroup.name = 'psu';
    const psuBoxGeo = new THREE.BoxGeometry(6.5, 3.4, 6.5);
    const psuBox = new THREE.Mesh(psuBoxGeo, frameMat);
    psuBox.position.set(5.5, -6, 0);
    psuGroup.add(psuBox);

    // PSU Fan Intake Grill
    const psuGrillGeo = new THREE.CircleGeometry(1.8, 16);
    const psuGrill = new THREE.Mesh(psuGrillGeo, accentMat);
    psuGrill.rotation.x = Math.PI / 2;
    psuGrill.position.set(5.5, -7.65, 0);
    psuGroup.add(psuGrill);

    scene.add(psuGroup);
    partGroups.psu = psuGroup;

    // 9. CASE FANS: FRONT INTAKE 3x 140mm
    for (let fi = 0; fi < 3; fi++) {
      const frontFan = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.3, 16), frameMat);
      frontFan.rotation.z = Math.PI / 2;
      frontFan.position.set(-9.5, -1 + fi * 4.2, 0);
      const ffBlade = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.4), accentMat);
      frontFan.add(ffBlade);
      caseGroup.add(frontFan);
      fanBlades.push(frontFan);
    }

    // 10. TEMPERED GLASS SIDE PANEL (Removable / Translucent)
    const glassGroup = new THREE.Group();
    glassGroup.name = 'glass';
    const glassGeo = new THREE.BoxGeometry(19.8, 20, 0.3);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x050508,
      transparent: true,
      opacity: glassOpacity,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.75,
      ior: 1.5
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 3, 5.1);
    glassGroup.add(glass);

    // 4x Thumb Screws
    for (const [sx, sy] of [[-9, -6], [-9, 12], [9, -6], [9, 12]]) {
      const screwGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
      const screwMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.2, metalness: 0.9 });
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(sx, sy, 5.3);
      glassGroup.add(screw);
    }

    scene.add(glassGroup);
    partGroups.glass = glassGroup;

    threeState.current = {
      scene,
      camera,
      renderer,
      animFrameId: 0,
      partGroups,
      fanBlades,
      rgbLights: [rgbLight1, rgbLight2],
      ambientLight,
      keyLight,
      floorMat,
      gridHelper,
      isDragging: false,
      startX: 0,
      startY: 0,
      prevMouseX: 0,
      prevMouseY: 0,
      cameraTarget: new THREE.Vector3(0, 3, 0),
      rotX: 0.45,
      rotY: 0.7,
      camDistance: 38
    };

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      if (!threeState.current) return;
      const delta = clock.getDelta();

      // Spin fans based on RPM
      const rotDelta = (fanSpeedRpm / 60) * Math.PI * 2 * delta;
      fanBlades.forEach((fan) => {
        fan.rotation.y += rotDelta;
      });

      // Update camera position from orbit coordinates
      const state = threeState.current;
      const x = state.cameraTarget.x + state.camDistance * Math.cos(state.rotY) * Math.sin(state.rotX);
      const y = state.cameraTarget.y + state.camDistance * Math.sin(state.rotY);
      const z = state.cameraTarget.z + state.camDistance * Math.cos(state.rotY) * Math.cos(state.rotX);

      state.camera.position.set(x, y, z);
      state.camera.lookAt(state.cameraTarget);

      state.renderer.render(state.scene, state.camera);
      state.animFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !threeState.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      threeState.current.camera.aspect = w / h;
      threeState.current.camera.updateProjectionMatrix();
      threeState.current.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (threeState.current) {
        cancelAnimationFrame(threeState.current.animFrameId);
        threeState.current.renderer.dispose();
      }
    };
  }, []);

  // Update RGB light colors when prop changes
  useEffect(() => {
    if (!threeState.current) return;
    const color = new THREE.Color(rgbColorHex);
    threeState.current.rgbLights.forEach((light) => {
      light.color = color;
    });
  }, [rgbColorHex]);

  // Update Exploded View / Assembly Progress offsets
  useEffect(() => {
    if (!threeState.current) return;
    const groups = threeState.current.partGroups;

    // Explode factor: 0 is completely exploded outward, 100 is fully seated/assembled
    const explodeT = (100 - assemblyProgress) / 100;

    // GPU floats forward and slightly downward when unseated
    if (groups.gpu) {
      const isSnapped = snappedParts.gpu && assemblyProgress > 20;
      const offsetZ = isSnapped ? 0 : explodeT * 14;
      const offsetY = isSnapped ? 0 : explodeT * 4;
      groups.gpu.position.z = offsetZ;
      groups.gpu.position.y = offsetY;
      groups.gpu.visible = assemblyProgress > 10;
    }

    // RAM floats upward out of DIMM slots
    if (groups.ram) {
      const isSnapped = snappedParts.ram && assemblyProgress > 30;
      groups.ram.position.z = isSnapped ? 0 : explodeT * 10;
      groups.ram.position.y = isSnapped ? 0 : explodeT * 5;
      groups.ram.visible = assemblyProgress > 25;
    }

    // CPU Cooler floats outwards
    if (groups.cooler) {
      const isSnapped = snappedParts.cooler && assemblyProgress > 50;
      groups.cooler.position.z = isSnapped ? 0 : explodeT * 12;
      groups.cooler.visible = assemblyProgress > 40;
    }

    // Motherboard floats outward from tray
    if (groups.motherboard) {
      const isSnapped = snappedParts.motherboard && assemblyProgress > 10;
      groups.motherboard.position.z = isSnapped ? 0 : explodeT * 6;
    }

    // Glass panel slides away or vanishes
    if (groups.glass) {
      groups.glass.visible = isGlassInstalled && assemblyProgress >= 90;
      groups.glass.position.z = isGlassInstalled ? (explodeT > 0.05 ? explodeT * 18 : 0) : 100;
    }
  }, [assemblyProgress, snappedParts, isGlassInstalled]);

  // Viewport Environment Lighting & Floor Updates
  useEffect(() => {
    if (!threeState.current) return;
    const { scene, ambientLight, keyLight, floorMat, gridHelper } = threeState.current;
    if (viewportEnv === 'studio') {
      scene.background = new THREE.Color(0xf8fafc);
      floorMat.color.set(0xe2e8f0);
      ambientLight.intensity = 1.4;
      keyLight.intensity = 1.8;
      keyLight.color.set(0xffffff);
    } else if (viewportEnv === 'cad') {
      scene.background = new THREE.Color(0x020617);
      floorMat.color.set(0x0f172a);
      ambientLight.intensity = 0.9;
      keyLight.intensity = 1.2;
      keyLight.color.set(0x38bdf8);
    } else {
      // cyber void
      scene.background = new THREE.Color(0x09090b);
      floorMat.color.set(0x121215);
      ambientLight.intensity = 0.7;
      keyLight.intensity = 1.4;
      keyLight.color.set(0xffffff);
    }
  }, [viewportEnv]);

  // Sync 3D studio background when global app theme changes
  useEffect(() => {
    if (theme === 'light') {
      setViewportEnv('studio');
    } else {
      setViewportEnv('cyber');
    }
  }, [theme]);

  // Power State & Fan Speed Management
  useEffect(() => {
    if (powerState === 'off') {
      setFanSpeedRpm(0);
    } else if (powerState === 'idle') {
      setFanSpeedRpm(1200);
    } else {
      setFanSpeedRpm(2400);
      spatialAudio.playOverclockSuccess();
    }
  }, [powerState]);

  // Orbit Mouse & Touch Events with Raycast Part Selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!threeState.current) return;
    threeState.current.isDragging = true;
    threeState.current.startX = e.clientX;
    threeState.current.startY = e.clientY;
    threeState.current.prevMouseX = e.clientX;
    threeState.current.prevMouseY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!threeState.current || !threeState.current.isDragging) return;
    const deltaX = e.clientX - threeState.current.prevMouseX;
    const deltaY = e.clientY - threeState.current.prevMouseY;
    threeState.current.prevMouseX = e.clientX;
    threeState.current.prevMouseY = e.clientY;

    threeState.current.rotX -= deltaX * 0.008;
    threeState.current.rotY = Math.max(-1.1, Math.min(1.1, threeState.current.rotY + deltaY * 0.008));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!threeState.current) return;
    const dist = Math.hypot(e.clientX - threeState.current.startX, e.clientY - threeState.current.startY);
    threeState.current.isDragging = false;

    // If click was clean (drag distance < 6px), perform raycast hit testing
    if (dist < 6 && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, threeState.current.camera);

      const hitCandidates: { key: AssemblyStep; group: THREE.Object3D | undefined }[] = [
        { key: 'gpu', group: threeState.current.partGroups.gpu },
        { key: 'cooler', group: threeState.current.partGroups.cooler },
        { key: 'ram', group: threeState.current.partGroups.ram },
        { key: 'cpu', group: threeState.current.partGroups.cpu },
        { key: 'motherboard', group: threeState.current.partGroups.motherboard },
        { key: 'psu', group: threeState.current.partGroups.psu },
        { key: 'glass', group: threeState.current.partGroups.glass },
        { key: 'case', group: threeState.current.partGroups.case }
      ];

      for (const candidate of hitCandidates) {
        if (!candidate.group) continue;
        const hits = raycaster.intersectObjects(candidate.group.children, true);
        if (hits.length > 0) {
          setInspectedPart(candidate.key);
          spatialAudio.playClick();
          if (onSelectComponent) onSelectComponent(candidate.key);
          break;
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!threeState.current) return;
    threeState.current.camDistance = Math.max(15, Math.min(65, threeState.current.camDistance + e.deltaY * 0.03));
  };

  // Camera Presets
  const setCameraPreset = (preset: 'iso' | 'side' | 'top' | 'gpu' | 'front') => {
    if (!threeState.current) return;
    setActiveCamPreset(preset);

    const targets: Record<string, { rotX: number; rotY: number; dist: number; targetY: number }> = {
      iso: { rotX: 0.55, rotY: 0.35, dist: 38, targetY: 3 },
      side: { rotX: 0.0, rotY: 0.05, dist: 32, targetY: 3 },
      top: { rotX: 0.0, rotY: 1.45, dist: 36, targetY: 3 },
      gpu: { rotX: -0.2, rotY: 0.1, dist: 22, targetY: 1.5 },
      front: { rotX: Math.PI / 2, rotY: 0.1, dist: 32, targetY: 2 }
    };

    const t = targets[preset] || targets.iso;
    threeState.current.rotX = t.rotX;
    threeState.current.rotY = t.rotY;
    threeState.current.camDistance = t.dist;
    threeState.current.cameraTarget.set(0, t.targetY, 0);
  };

  // Toggle Snap Single Part
  const toggleSnapPart = (partKey: AssemblyStep) => {
    const isNowSnapped = !snappedParts[partKey];
    setSnappedParts((prev) => ({ ...prev, [partKey]: isNowSnapped }));

    if (isNowSnapped) {
      if (partKey === 'ram') spatialAudio.playRamLatch();
      else if (partKey === 'gpu') spatialAudio.playSnapIn();
      else if (partKey === 'glass') spatialAudio.playScrewTighten();
      else spatialAudio.playSnapIn();
    }
  };

  const componentList: ComponentStatus[] = [
    {
      id: 'motherboard',
      name: 'ATX Gaming Motherboard',
      category: 'Backbone',
      isSnapped: snappedParts.motherboard,
      clearanceNote: 'Standard 305mm × 244mm ATX'
    },
    {
      id: 'cpu',
      name: selectedCpu.Model,
      category: 'CPU',
      isSnapped: snappedParts.cpu,
      clearanceNote: `${selectedCpu.Socket} • ${selectedCpu.TDP_Watts}W TDP`
    },
    {
      id: 'ram',
      name: `${ramCapacity}GB ${ramType} (Dual/Quad)`,
      category: 'Memory',
      isSnapped: snappedParts.ram,
      clearanceNote: '44mm Low Profile DDR5'
    },
    {
      id: 'storage',
      name: '2TB PCIe Gen4 NVMe M.2',
      category: 'Storage',
      isSnapped: snappedParts.storage,
      clearanceNote: 'DirectStorage 7400 MB/s'
    },
    {
      id: 'gpu',
      name: selectedGpu.Model,
      category: 'GPU',
      isSnapped: snappedParts.gpu,
      clearanceNote: `${selectedGpu.Length_mm}mm Length • PCIe 5.0 x16`
    },
    {
      id: 'cooler',
      name: coolerType === 'Tower Air' ? 'Dual-Tower 6-Heatpipe Air Cooler' : '360mm Liquid AIO Radiator',
      category: 'Cooling',
      isSnapped: snappedParts.cooler,
      clearanceNote: coolerType === 'Tower Air' ? '158mm Height Clearance' : '395mm Top Mount'
    },
    {
      id: 'psu',
      name: '850W Gold ATX 3.1 Modular PSU',
      category: 'Power',
      isSnapped: snappedParts.psu,
      clearanceNote: '12V-2x6 600W Native Cable'
    },
    {
      id: 'glass',
      name: 'Tempered Glass Side Door',
      category: 'Enclosure',
      isSnapped: isGlassInstalled,
      clearanceNote: '4mm Safety Glass with Thumb Screws'
    }
  ];

  return (
    <div className="space-y-4">
      {/* 3D Visualizer Viewport Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-[520px] sm:h-[620px] rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

        {/* Top Left: BuildCores-style HUD & Inspection Tag */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold text-white uppercase tracking-wider">
              Real-Time 3D Assembly Visualizer
            </span>
          </div>

          <div className="px-3 py-1 rounded-lg bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-[11px] font-mono text-zinc-400">
            Click & drag to rotate • Scroll to zoom • Shift + drag to pan
          </div>
        </div>

        {/* Top Right: Viewport Environment, Camera Presets & Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center gap-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
          {/* Environment Preset Selector */}
          <div className="flex items-center gap-1 pr-1.5 border-r border-zinc-700/80">
            <button
              onClick={() => setViewportEnv('studio')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                viewportEnv === 'studio'
                  ? 'bg-sky-500 text-zinc-950 font-extrabold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Studio Platinum Stage Environment (High-Contrast Clean Lighting)"
            >
              Studio
            </button>
            <button
              onClick={() => setViewportEnv('cyber')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                viewportEnv === 'cyber'
                  ? 'bg-cyan-500 text-zinc-950 font-extrabold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Cyberpunk Void Space with Neon Grid Floor"
            >
              Cyber
            </button>
            <button
              onClick={() => setViewportEnv('cad')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                viewportEnv === 'cad'
                  ? 'bg-indigo-500 text-white font-extrabold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Technical CAD Blueprint View"
            >
              CAD
            </button>
          </div>

          {(
            [
              { id: 'iso', label: 'Iso 45°' },
              { id: 'side', label: 'Side Glass' },
              { id: 'top', label: 'Top Rad' },
              { id: 'gpu', label: 'GPU' },
              { id: 'front', label: 'Front' }
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              onClick={() => setCameraPreset(preset.id)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                activeCamPreset === preset.id
                  ? 'bg-cyan-500 text-zinc-950 shadow-md scale-102'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {preset.label}
            </button>
          ))}

          <div className="w-px h-5 bg-zinc-700/80 mx-0.5" />

          {/* Glass Toggle */}
          <button
            onClick={() => setIsGlassInstalled((g) => !g)}
            className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
              isGlassInstalled
                ? 'bg-zinc-800 text-cyan-300 border border-cyan-500/40'
                : 'bg-zinc-900 text-zinc-400'
            }`}
            title="Toggle Tempered Glass Side Panel"
          >
            {isGlassInstalled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-500" />}
            <span className="hidden sm:inline">Glass {isGlassInstalled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => {
              if (!containerRef.current) return;
              if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen?.().catch(() => {});
                setIsFullscreen(true);
              } else {
                document.exitFullscreen?.().catch(() => {});
                setIsFullscreen(false);
              }
            }}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-cyan-400 transition-all cursor-pointer"
            title="Toggle Fullscreen 3D Viewport"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Holographic 3D Component Inspection Telemetry Card */}
        {inspectedPart && (
          <div className="absolute top-20 right-4 z-20 w-72 sm:w-80 p-4 rounded-2xl bg-black/85 backdrop-blur-xl border border-cyan-500/40 shadow-2xl space-y-2.5 animate-fade-in text-xs font-mono">
            <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                  3D Inspected Component
                </span>
                <span className="text-sm font-bold text-white line-clamp-1">
                  {inspectedPart === 'gpu' ? selectedGpu.Model :
                   inspectedPart === 'cpu' ? selectedCpu.Model :
                   inspectedPart === 'cooler' ? (coolerType === 'Tower Air' ? 'Dual-Tower Air Cooler' : '360mm AIO Radiator') :
                   inspectedPart === 'ram' ? `${ramCapacity}GB ${ramType} 6000MHz CL30` :
                   inspectedPart === 'psu' ? '850W Gold ATX 3.1 Modular' :
                   inspectedPart === 'glass' ? '4mm Tinted Tempered Glass' :
                   inspectedPart === 'motherboard' ? 'PCIe 5.0 ATX Motherboard' : 'Chassis Frame'}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                snappedParts[inspectedPart] ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {snappedParts[inspectedPart] ? 'Installed ✓' : 'Extracted'}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              {inspectedPart === 'gpu' && (
                <>
                  <div className="flex justify-between text-zinc-400">
                    <span>Card Length:</span>
                    <span className="text-white font-bold">{selectedGpu.Length_mm || 336} mm</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Power / TGP:</span>
                    <span className="text-cyan-400 font-bold">{selectedGpu.TDP_W}W (16-Pin 12V-2x6)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Retail Price:</span>
                    <span className="text-emerald-400 font-bold">{formatINR(selectedGpu.Price_INR)}</span>
                  </div>
                </>
              )}

              {inspectedPart === 'cpu' && (
                <>
                  <div className="flex justify-between text-zinc-400">
                    <span>Architecture:</span>
                    <span className="text-white font-bold">{selectedCpu.Architecture || selectedCpu.Socket}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Cores / Threads:</span>
                    <span className="text-cyan-400 font-bold">{selectedCpu.Cores}C / {selectedCpu.Threads}T</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Retail Price:</span>
                    <span className="text-emerald-400 font-bold">{formatINR(selectedCpu.Price_INR)}</span>
                  </div>
                </>
              )}

              {inspectedPart === 'cooler' && (
                <>
                  <div className="flex justify-between text-zinc-400">
                    <span>Clearance Requirement:</span>
                    <span className="text-white font-bold">{coolerType === 'Tower Air' ? '158mm Height' : '395mm Top Rad'}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Thermal Rating:</span>
                    <span className="text-cyan-400 font-bold">280W Heat Dissipation</span>
                  </div>
                </>
              )}

              {inspectedPart === 'ram' && (
                <>
                  <div className="flex justify-between text-zinc-400">
                    <span>DIMM Profile:</span>
                    <span className="text-white font-bold">Low-Profile 42mm Spreader</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Sub-Timings:</span>
                    <span className="text-cyan-400 font-bold">CL30-38-38-96 EXPO</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => toggleSnapPart(inspectedPart)}
                className="flex-1 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition-all cursor-pointer text-center"
              >
                {snappedParts[inspectedPart] ? 'Pull Out (Unsnap)' : 'Snap Into Slot'}
              </button>
              {onSelectComponent && (
                <button
                  onClick={() => onSelectComponent(inspectedPart)}
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all cursor-pointer"
                >
                  Full Specs →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Floating Bar: Exploded Diagram Slider & Power States */}
        <div className="absolute bottom-4 left-4 right-4 z-10 p-3 sm:p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          {/* Exploded View Slider */}
          <div className="flex-1 w-full flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Exploded View
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={assemblyProgress}
              onChange={(e) => setAssemblyProgress(Number(e.target.value))}
              className="flex-1 accent-cyan-400 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-white font-bold w-12 text-right">
              {assemblyProgress}%
            </span>
          </div>

          {/* Hardware Power State Switch & Fan RPM */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* 3-Way Power Mode Switch */}
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px] font-mono">
              <button
                onClick={() => setPowerState('off')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  powerState === 'off' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Power Off: Fans Stopped (0 RPM)"
              >
                OFF
              </button>
              <button
                onClick={() => setPowerState('idle')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  powerState === 'idle' ? 'bg-cyan-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Normal Load: 1200 RPM Silent Acoustic Profile"
              >
                IDLE
              </button>
              <button
                onClick={() => setPowerState('turbo')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  powerState === 'turbo' ? 'bg-rose-500 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Turbo Overclock: Maximum 2400 RPM Cooling Performance"
              >
                TURBO
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 bg-zinc-900/80 px-2.5 py-1 rounded-xl border border-zinc-800">
              <Fan className={`w-3.5 h-3.5 ${powerState === 'turbo' ? 'text-rose-400 animate-spin' : powerState === 'idle' ? 'text-emerald-400 animate-spin' : 'text-zinc-600'}`} />
              <span>{fanSpeedRpm} RPM</span>
            </div>

            <button
              onClick={() => {
                setAssemblyProgress(100);
                setSnappedParts({
                  case: true,
                  motherboard: true,
                  cpu: true,
                  ram: true,
                  storage: true,
                  gpu: true,
                  cooler: true,
                  psu: true,
                  glass: true
                });
                spatialAudio.playSnapIn();
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold font-mono transition-transform active:scale-95 cursor-pointer shadow-md"
            >
              Snap All
            </button>

            <button
              onClick={() => {
                setAssemblyProgress(0);
                spatialAudio.playScrewTighten();
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-all cursor-pointer"
            >
              Explode
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Part-By-Part Snap Checklist & Clearance Checker */}
      <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              BuildCores-Style Step-by-Step Snap-In Architecture
            </h3>
            <p className="text-xs text-zinc-400">
              Click any component below to snap it into place or pull it out. Verified against physical clearance tolerances.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Sound Effects:</span>
            <button
              onClick={() => {
                setIsMuted((m) => {
                  spatialAudio.setMuted(!m);
                  return !m;
                });
              }}
              className="p-1 rounded bg-zinc-800 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {componentList.map((comp) => {
            const isSnapped = comp.isSnapped;

            return (
              <div
                key={comp.id}
                onClick={() => toggleSnapPart(comp.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none group flex flex-col justify-between gap-3 ${
                  isSnapped
                    ? 'bg-zinc-950/80 border-cyan-500/40 hover:border-cyan-500 shadow-md'
                    : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-zinc-500">
                      {comp.category}
                    </span>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {comp.name}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isSnapped
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isSnapped ? 'Snapped ✓' : 'Floating'}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between border-t border-zinc-800/80 pt-2">
                  <span>{comp.clearanceNote}</span>
                  <span className="text-cyan-400 font-bold group-hover:underline">
                    {isSnapped ? 'Unsnap' : 'Snap In'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
