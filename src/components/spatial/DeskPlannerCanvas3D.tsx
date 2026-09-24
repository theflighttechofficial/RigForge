import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { spatialAudio } from '../../utils/audioFx';
import {
  Maximize2,
  Minimize2,
  Sliders,
  RotateCcw,
  Sparkles,
  Move,
  Monitor,
  Armchair,
  Layers,
  CheckCircle2,
  Eye,
  Sun,
  Moon,
  Info,
  ChevronRight
} from 'lucide-react';

export type DeskType = 'standing' | 'standard' | 'lshaped' | 'compact';
export type DeskFinish = 'walnut' | 'oak' | 'carbon' | 'black' | 'white';
export type ChairType = 'mesh' | 'racing' | 'executive';
export type MonitorArmConfig = 'single' | 'dual' | 'stacked' | 'triple' | 'ultrawide49';

export interface DeskPlannerCanvas3DProps {
  initialDeskType?: DeskType;
  initialFinish?: DeskFinish;
  initialChair?: ChairType;
  initialMonitorConfig?: MonitorArmConfig;
  rgbColorHex?: string;
}

export const DeskPlannerCanvas3D: React.FC<DeskPlannerCanvas3DProps> = ({
  initialDeskType = 'standing',
  initialFinish = 'walnut',
  initialChair = 'mesh',
  initialMonitorConfig = 'dual',
  rgbColorHex = '#06b6d4'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Desk Configuration
  const [deskType, setDeskType] = useState<DeskType>(initialDeskType);
  const [deskFinish, setDeskFinish] = useState<DeskFinish>(initialFinish);
  const [deskHeightCm, setDeskHeightCm] = useState<number>(74); // 70 to 120cm
  const [deskWidthCm, setDeskWidthCm] = useState<number>(160); // 120 to 200cm
  const [chairType, setChairType] = useState<ChairType>(initialChair);
  const [monitorConfig, setMonitorConfig] = useState<MonitorArmConfig>(initialMonitorConfig);
  const [towerPlacement, setTowerPlacement] = useState<'desk-right' | 'desk-left' | 'floor'>('desk-right');
  const [roomLighting, setRoomLighting] = useState<'cyber' | 'daylight' | 'sunset' | 'stealth'>('cyber');
  const [showAccessories, setShowAccessories] = useState<boolean>(true);

  // Three.js References
  const threeState = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animFrameId: number;
    deskMeshGroup: THREE.Group;
    chairMeshGroup: THREE.Group;
    monitorMeshGroup: THREE.Group;
    towerMeshGroup: THREE.Group;
    accessoriesGroup: THREE.Group;
    rgbBacklight: THREE.PointLight;
    deskMotorY: number;
    isDragging: boolean;
    prevX: number;
    prevY: number;
    rotX: number;
    rotY: number;
    distance: number;
  } | null>(null);

  // Finish Color Map
  const finishColors: Record<DeskFinish, { color: number; roughness: number; metalness: number }> = {
    walnut: { color: 0x3e2723, roughness: 0.6, metalness: 0.05 },
    oak: { color: 0xb58a58, roughness: 0.55, metalness: 0.05 },
    carbon: { color: 0x18181b, roughness: 0.4, metalness: 0.4 },
    black: { color: 0x09090b, roughness: 0.35, metalness: 0.1 },
    white: { color: 0xf4f4f5, roughness: 0.25, metalness: 0.05 }
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0c0e);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 35, 65);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Room Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const ceilingLight = new THREE.DirectionalLight(0xffffff, 1.2);
    ceilingLight.position.set(20, 50, 20);
    ceilingLight.castShadow = true;
    scene.add(ceilingLight);

    const rgbBacklight = new THREE.PointLight(new THREE.Color(rgbColorHex), 4.0, 45);
    rgbBacklight.position.set(0, 18, -12);
    scene.add(rgbBacklight);

    // Floor (Dark Wood Parquet)
    const floorGeo = new THREE.PlaneGeometry(160, 160);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.7, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid accent
    const grid = new THREE.GridHelper(160, 80, 0x06b6d4, 0x27272a);
    grid.position.y = 0.05;
    scene.add(grid);

    // Back Wall
    const wallGeo = new THREE.PlaneGeometry(160, 80);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 40, -25);
    wall.receiveShadow = true;
    scene.add(wall);

    // Acoustic Sound Hexagon Panels on Wall
    for (let row = 0; row < 3; row++) {
      for (let col = -3; col <= 3; col++) {
        const hexGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.4, 6);
        const hexMat = new THREE.MeshStandardMaterial({
          color: (row + col) % 2 === 0 ? 0x27272a : 0x06b6d4,
          roughness: 0.8
        });
        const hex = new THREE.Mesh(hexGeo, hexMat);
        hex.rotation.x = Math.PI / 2;
        hex.position.set(col * 4.6 + (row % 2 ? 2.3 : 0), 32 + row * 4, -24.7);
        scene.add(hex);
      }
    }

    // Dynamic Groups
    const deskMeshGroup = new THREE.Group();
    scene.add(deskMeshGroup);

    const chairMeshGroup = new THREE.Group();
    scene.add(chairMeshGroup);

    const monitorMeshGroup = new THREE.Group();
    scene.add(monitorMeshGroup);

    const towerMeshGroup = new THREE.Group();
    scene.add(towerMeshGroup);

    const accessoriesGroup = new THREE.Group();
    scene.add(accessoriesGroup);

    threeState.current = {
      scene,
      camera,
      renderer,
      animFrameId: 0,
      deskMeshGroup,
      chairMeshGroup,
      monitorMeshGroup,
      towerMeshGroup,
      accessoriesGroup,
      rgbBacklight,
      deskMotorY: 14.8, // maps from deskHeightCm (74cm ~ 14.8 world units)
      isDragging: false,
      prevX: 0,
      prevY: 0,
      rotX: 0.0,
      rotY: 0.35,
      distance: 65
    };

    const clock = new THREE.Clock();
    const animate = () => {
      if (!threeState.current) return;
      const state = threeState.current;

      const x = state.distance * Math.cos(state.rotY) * Math.sin(state.rotX);
      const y = Math.max(10, state.distance * Math.sin(state.rotY));
      const z = state.distance * Math.cos(state.rotY) * Math.cos(state.rotX);

      state.camera.position.set(x, y, z);
      state.camera.lookAt(0, 16, 0);

      state.renderer.render(state.scene, state.camera);
      state.animFrameId = requestAnimationFrame(animate);
    };

    animate();

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

  // REBUILD 3D DESK & LEGS
  useEffect(() => {
    if (!threeState.current) return;
    const group = threeState.current.deskMeshGroup;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const finish = finishColors[deskFinish];
    const topMat = new THREE.MeshStandardMaterial({
      color: finish.color,
      roughness: finish.roughness,
      metalness: finish.metalness
    });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.7 });

    const worldHeight = (deskHeightCm / 74) * 14.8;
    const worldWidth = (deskWidthCm / 160) * 32;
    const worldDepth = 15;

    // Desktop Platter
    const tableTopGeo = new THREE.BoxGeometry(worldWidth, 0.8, worldDepth);
    const tableTop = new THREE.Mesh(tableTopGeo, topMat);
    tableTop.position.set(0, worldHeight, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);

    // L-Shape Wing extension if selected
    if (deskType === 'lshaped') {
      const wingGeo = new THREE.BoxGeometry(14, 0.8, 22);
      const wing = new THREE.Mesh(wingGeo, topMat);
      wing.position.set(-worldWidth / 2 + 7, worldHeight, 14);
      group.add(wing);

      // Extra legs for L-wing
      const wingLegGeo = new THREE.BoxGeometry(1.2, worldHeight, 1.2);
      const wingLeg = new THREE.Mesh(wingLegGeo, legMat);
      wingLeg.position.set(-worldWidth / 2 + 3, worldHeight / 2, 22);
      group.add(wingLeg);
    }

    // Legs
    if (deskType === 'standing') {
      // Motorized Dual-Column Telescoping Legs
      for (const lx of [-worldWidth / 2 + 3.5, worldWidth / 2 - 3.5]) {
        // Upper sleeve
        const colUpper = new THREE.Mesh(new THREE.BoxGeometry(1.6, worldHeight / 2, 1.8), legMat);
        colUpper.position.set(lx, worldHeight * 0.75, 0);
        group.add(colUpper);

        // Lower sleeve
        const colLower = new THREE.Mesh(new THREE.BoxGeometry(2.0, worldHeight / 2, 2.2), legMat);
        colLower.position.set(lx, worldHeight * 0.25, 0);
        group.add(colLower);

        // Foot pad
        const footPad = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, worldDepth - 1), legMat);
        footPad.position.set(lx, 0.3, 0);
        group.add(footPad);
      }

      // Motorized Keypad with LED Display
      const keypadGeo = new THREE.BoxGeometry(2.2, 0.5, 1.2);
      const keypadMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
      const keypad = new THREE.Mesh(keypadGeo, keypadMat);
      keypad.position.set(worldWidth / 2 - 2, worldHeight - 0.5, worldDepth / 2 - 0.2);
      group.add(keypad);
    } else {
      // 4 Standard Fixed Heavy-Duty Legs
      for (const [lx, lz] of [
        [-worldWidth / 2 + 2, -worldDepth / 2 + 2],
        [-worldWidth / 2 + 2, worldDepth / 2 - 2],
        [worldWidth / 2 - 2, -worldDepth / 2 + 2],
        [worldWidth / 2 - 2, worldDepth / 2 - 2]
      ]) {
        const legGeo = new THREE.CylinderGeometry(0.8, 0.8, worldHeight, 16);
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, worldHeight / 2, lz);
        group.add(leg);
      }
    }

    // RGB Undermount Light Strip
    const stripGeo = new THREE.BoxGeometry(worldWidth - 4, 0.2, 0.2);
    const stripMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(rgbColorHex) });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, worldHeight - 0.5, -worldDepth / 2 + 0.5);
    group.add(strip);
  }, [deskType, deskFinish, deskHeightCm, deskWidthCm, rgbColorHex]);

  // REBUILD 3D CHAIR
  useEffect(() => {
    if (!threeState.current) return;
    const group = threeState.current.chairMeshGroup;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const chairBaseMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.8 });
    const chairCushionMat = new THREE.MeshStandardMaterial({
      color: chairType === 'racing' ? 0x06b6d4 : chairType === 'executive' ? 0x27272a : 0x1f2937,
      roughness: 0.6
    });

    const chairZ = 18;

    // 5-Star Caster Wheel Base
    const baseHub = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16), chairBaseMat);
    baseHub.position.set(0, 1.5, chairZ);
    group.add(baseHub);

    for (let c = 0; c < 5; c++) {
      const angle = (c * Math.PI * 2) / 5;
      const legGeo = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
      const leg = new THREE.Mesh(legGeo, chairBaseMat);
      leg.rotation.z = Math.PI / 2;
      leg.rotation.y = angle;
      leg.position.set(Math.sin(angle) * 2.5, 1.2, chairZ + Math.cos(angle) * 2.5);
      group.add(leg);
    }

    // Gas Lift Cylinder
    const gasLift = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 7, 16), chairBaseMat);
    gasLift.position.set(0, 5, chairZ);
    group.add(gasLift);

    // Seat Cushion
    const seatGeo = new THREE.BoxGeometry(7, 1.5, 7);
    const seat = new THREE.Mesh(seatGeo, chairCushionMat);
    seat.position.set(0, 9, chairZ);
    group.add(seat);

    // Backrest
    if (chairType === 'racing') {
      // Racing High Back with Wings
      const backGeo = new THREE.BoxGeometry(6.5, 13, 1.2);
      const back = new THREE.Mesh(backGeo, chairCushionMat);
      back.position.set(0, 16, chairZ + 3.2);
      group.add(back);

      // Neck Pillow
      const pillowGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 16);
      const pillow = new THREE.Mesh(pillowGeo, new THREE.MeshStandardMaterial({ color: 0x09090b }));
      pillow.rotation.z = Math.PI / 2;
      pillow.position.set(0, 20.5, chairZ + 2.5);
      group.add(pillow);
    } else if (chairType === 'mesh') {
      // Herman Miller Ergonomic Mesh Spine
      const spineGeo = new THREE.BoxGeometry(1.2, 12, 1);
      const spine = new THREE.Mesh(spineGeo, chairBaseMat);
      spine.position.set(0, 15, chairZ + 3.5);
      group.add(spine);

      const meshBackGeo = new THREE.BoxGeometry(6.5, 11, 0.4);
      const meshBackMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.9, transparent: true, opacity: 0.85 });
      const meshBack = new THREE.Mesh(meshBackGeo, meshBackMat);
      meshBack.position.set(0, 15.5, chairZ + 3.0);
      group.add(meshBack);
    } else {
      // Executive Leather
      const execBackGeo = new THREE.BoxGeometry(7, 12, 2);
      const execBack = new THREE.Mesh(execBackGeo, chairCushionMat);
      execBack.position.set(0, 15.5, chairZ + 3.2);
      group.add(execBack);
    }

    // 4D Armrests
    for (const ax of [-3.8, 3.8]) {
      const armPole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 8), chairBaseMat);
      armPole.position.set(ax, 11, chairZ);
      group.add(armPole);

      const armPad = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 4), chairBaseMat);
      armPad.position.set(ax, 13, chairZ);
      group.add(armPad);
    }
  }, [chairType]);

  // REBUILD 3D MONITORS & ARTICULATED MOUNTING ARMS
  useEffect(() => {
    if (!threeState.current) return;
    const group = threeState.current.monitorMeshGroup;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const worldHeight = (deskHeightCm / 74) * 14.8;
    const armMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.8 });
    const screenFrameMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3, metalness: 0.5 });
    const screenDisplayMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45
    });

    // Heavy-Duty Desk Clamp Mount (clamped to rear edge)
    const clampBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3, 2.4), armMat);
    clampBase.position.set(0, worldHeight, -6.5);
    group.add(clampBase);

    // Vertical Steel Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 9, 16), armMat);
    pole.position.set(0, worldHeight + 4.5, -6.5);
    group.add(pole);

    if (monitorConfig === 'single') {
      // 1x 32" OLED Monitor
      const monGroup = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(15, 9, 0.6), screenFrameMat);
      const display = new THREE.Mesh(new THREE.BoxGeometry(14.6, 8.6, 0.1), screenDisplayMat);
      display.position.z = 0.32;
      monGroup.add(frame);
      monGroup.add(display);
      monGroup.position.set(0, worldHeight + 7.5, -4.5);
      group.add(monGroup);
    } else if (monitorConfig === 'dual') {
      // 2x 27" Side-by-Side Dual Arm
      for (const [side, xPos, angle] of [
        ['left', -7.2, 0.12],
        ['right', 7.2, -0.12]
      ] as const) {
        const monGroup = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(13.5, 8, 0.5), screenFrameMat);
        const display = new THREE.Mesh(new THREE.BoxGeometry(13.1, 7.6, 0.1), screenDisplayMat);
        display.position.z = 0.28;
        monGroup.add(frame);
        monGroup.add(display);
        monGroup.position.set(xPos, worldHeight + 7.5, -4.5);
        monGroup.rotation.y = angle;
        group.add(monGroup);
      }
    } else if (monitorConfig === 'stacked') {
      // Stacked Dual (34" Ultrawide Bottom + 27" Top)
      // Bottom 34" Ultrawide
      const btmGroup = new THREE.Group();
      const btmFrame = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 0.6), screenFrameMat);
      const btmDisplay = new THREE.Mesh(new THREE.BoxGeometry(17.6, 7.6, 0.1), screenDisplayMat);
      btmDisplay.position.z = 0.32;
      btmGroup.add(btmFrame);
      btmGroup.add(btmDisplay);
      btmGroup.position.set(0, worldHeight + 5.5, -4.5);
      group.add(btmGroup);

      // Top 27" Streamer Display (tilted down 15 degrees)
      const topGroup = new THREE.Group();
      const topFrame = new THREE.Mesh(new THREE.BoxGeometry(13.5, 7.5, 0.5), screenFrameMat);
      const topDisplay = new THREE.Mesh(new THREE.BoxGeometry(13.1, 7.1, 0.1), screenDisplayMat);
      topDisplay.position.z = 0.28;
      topGroup.add(topFrame);
      topGroup.add(topDisplay);
      topGroup.position.set(0, worldHeight + 13.8, -4.8);
      topGroup.rotation.x = 0.22;
      group.add(topGroup);
    } else if (monitorConfig === 'triple') {
      // Triple Wrap 3x 27" Cockpit Surround
      for (const [xPos, rotY] of [
        [-12.5, 0.45],
        [0, 0],
        [12.5, -0.45]
      ]) {
        const monGroup = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(12.5, 7.5, 0.5), screenFrameMat);
        const display = new THREE.Mesh(new THREE.BoxGeometry(12.1, 7.1, 0.1), screenDisplayMat);
        display.position.z = 0.28;
        monGroup.add(frame);
        monGroup.add(display);
        monGroup.position.set(xPos, worldHeight + 7.5, -3.5 - Math.abs(xPos) * 0.2);
        monGroup.rotation.y = rotY;
        group.add(monGroup);
      }
    } else {
      // 49" Super-Ultrawide 32:9 Curved Monster
      const uwGroup = new THREE.Group();
      const uwFrame = new THREE.Mesh(new THREE.BoxGeometry(26, 8, 0.8), screenFrameMat);
      const uwDisplay = new THREE.Mesh(new THREE.BoxGeometry(25.4, 7.5, 0.1), screenDisplayMat);
      uwDisplay.position.z = 0.42;
      uwGroup.add(uwFrame);
      uwGroup.add(uwDisplay);
      uwGroup.position.set(0, worldHeight + 7.5, -4.5);
      group.add(uwGroup);
    }

    // Monitor Lightbar (ScreenBar shining down onto desk)
    const barGeo = new THREE.BoxGeometry(8, 0.4, 0.5);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, worldHeight + 12.3, -4.0);
    group.add(bar);

    const barLight = new THREE.PointLight(0xfff1e6, 1.8, 12);
    barLight.position.set(0, worldHeight + 11.5, -2.5);
    group.add(barLight);
  }, [deskHeightCm, monitorConfig]);

  // REBUILD 3D PC TOWER ON DESK
  useEffect(() => {
    if (!threeState.current) return;
    const group = threeState.current.towerMeshGroup;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const worldHeight = (deskHeightCm / 74) * 14.8;
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.7 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x09090b,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      transmission: 0.8
    });

    const tower = new THREE.Group();
    // Chassis box
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.8, 10, 8.5), towerMat);
    chassis.position.y = 5.2;
    tower.add(chassis);

    // Tempered glass panel
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 9.6, 8.2), glassMat);
    glass.position.set(-2.45, 5.2, 0);
    tower.add(glass);

    // Inside glowing GPU & RAM
    const insideRgb = new THREE.PointLight(new THREE.Color(rgbColorHex), 2.5, 8);
    insideRgb.position.set(-0.5, 5, 0);
    tower.add(insideRgb);

    if (towerPlacement === 'desk-right') {
      tower.position.set(13, worldHeight + 0.4, 0);
    } else if (towerPlacement === 'desk-left') {
      tower.position.set(-13, worldHeight + 0.4, 0);
    } else {
      // Floor stand on rubber riser
      tower.position.set(15, 0.4, 2);
    }

    group.add(tower);
  }, [deskHeightCm, towerPlacement, rgbColorHex]);

  // REBUILD PERIPHERALS & DESK ACCESSORIES
  useEffect(() => {
    if (!threeState.current) return;
    const group = threeState.current.accessoriesGroup;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (!showAccessories) return;

    const worldHeight = (deskHeightCm / 74) * 14.8;

    // Extended XXL Deskmat (900mm × 400mm)
    const matGeo = new THREE.BoxGeometry(18, 0.1, 7.5);
    const matMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
    const deskmat = new THREE.Mesh(matGeo, matMat);
    deskmat.position.set(0, worldHeight + 0.45, 1.5);
    group.add(deskmat);

    // 75% Mechanical Keyboard
    const kbGeo = new THREE.BoxGeometry(6.5, 0.35, 2.6);
    const kbMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
    const keyboard = new THREE.Mesh(kbGeo, kbMat);
    keyboard.position.set(-2.5, worldHeight + 0.65, 1.8);
    group.add(keyboard);

    // Ergonomic Gaming Mouse
    const mouseGeo = new THREE.BoxGeometry(1.2, 0.4, 2.2);
    const mouseMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
    const mouse = new THREE.Mesh(mouseGeo, mouseMat);
    mouse.position.set(4.5, worldHeight + 0.65, 1.8);
    group.add(mouse);

    // Pair of Studio Monitor Desktop Speakers (Audioengine style)
    for (const sx of [-9.5, 9.5]) {
      const spkGeo = new THREE.BoxGeometry(2.5, 4.5, 2.8);
      const spkMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 });
      const spk = new THREE.Mesh(spkGeo, spkMat);
      spk.position.set(sx, worldHeight + 2.6, -3);
      spk.rotation.y = sx < 0 ? 0.25 : -0.25;
      group.add(spk);
    }
  }, [deskHeightCm, showAccessories]);

  // Orbit controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!threeState.current) return;
    threeState.current.isDragging = true;
    threeState.current.prevX = e.clientX;
    threeState.current.prevY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!threeState.current || !threeState.current.isDragging) return;
    const deltaX = e.clientX - threeState.current.prevX;
    const deltaY = e.clientY - threeState.current.prevY;
    threeState.current.prevX = e.clientX;
    threeState.current.prevY = e.clientY;

    threeState.current.rotX -= deltaX * 0.007;
    threeState.current.rotY = Math.max(0.1, Math.min(1.2, threeState.current.rotY + deltaY * 0.007));
  };

  const handleMouseUp = () => {
    if (threeState.current) threeState.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!threeState.current) return;
    threeState.current.distance = Math.max(30, Math.min(110, threeState.current.distance + e.deltaY * 0.05));
  };

  return (
    <div className="space-y-4">
      {/* 3D Room & Desk Viewport Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-[520px] sm:h-[600px] rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

        {/* Top Left Tag */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            <span className="font-bold text-white uppercase tracking-wider">
              Desk & Room Ecosystem 3D Planner
            </span>
          </div>

          <div className="px-3 py-1 rounded-lg bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-[11px] font-mono text-zinc-400">
            Rotate view 360° • Zoom • Adjust height live
          </div>
        </div>

        {/* Top Right Quick Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => {
              if (!threeState.current) return;
              threeState.current.rotX = 0;
              threeState.current.rotY = 0.35;
              threeState.current.distance = 65;
            }}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Camera View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAccessories((s) => !s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              showAccessories
                ? 'bg-zinc-800 text-cyan-300 border border-cyan-500/40'
                : 'bg-zinc-900 text-zinc-500'
            }`}
          >
            Peripherals {showAccessories ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Bottom Floating Ergonomics HUD */}
        <div className="absolute bottom-4 left-4 right-4 z-10 p-3 sm:p-4 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          {/* Motorized Height Slider */}
          <div className="flex-1 w-full flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5" /> Desk Height
            </span>
            <input
              type="range"
              min="70"
              max="120"
              value={deskHeightCm}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDeskHeightCm(val);
                spatialAudio.playMotorWhirr(0.1);
              }}
              className="flex-1 accent-violet-400 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs font-mono text-white font-bold w-12 text-right">
                {deskHeightCm} cm
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800 font-bold">
                {deskHeightCm >= 105 ? 'STANDING' : 'SEATED'}
              </span>
            </div>
          </div>

          {/* Quick Ergonomic Height Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setDeskHeightCm(73);
                spatialAudio.playMotorWhirr(0.3);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                deskHeightCm === 73
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              Preset: Seated (73cm)
            </button>
            <button
              onClick={() => {
                setDeskHeightCm(112);
                spatialAudio.playMotorWhirr(0.4);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                deskHeightCm === 112
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              Preset: Standing (112cm)
            </button>
          </div>
        </div>
      </div>

      {/* Desk Environment Customization Studio Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Desk Selection */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-zinc-400">Desk Architecture</span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">{deskWidthCm}cm Width</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'standing', label: 'Dual-Motor Stand', sub: '70-120cm Lift' },
                { id: 'standard', label: 'Fixed Solid Desk', sub: 'Heavy-Duty Steel' },
                { id: 'lshaped', label: 'L-Shaped Corner', sub: 'Battlestation Wing' },
                { id: 'compact', label: 'Compact Studio', sub: 'Dorm / Minimal' }
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setDeskType(item.id)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  deskType === item.id
                    ? 'bg-violet-950/60 border-violet-500 text-white shadow-sm'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div className="text-[10px] font-mono text-zinc-500">{item.sub}</div>
              </button>
            ))}
          </div>

          {/* Desktop Tabletop Finish */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
            <span className="text-[11px] font-mono text-zinc-400">Finish Material:</span>
            <div className="grid grid-cols-5 gap-1.5">
              {(
                [
                  { id: 'walnut', name: 'Walnut', color: 'bg-amber-950' },
                  { id: 'oak', name: 'Oak', color: 'bg-amber-700' },
                  { id: 'carbon', name: 'Carbon', color: 'bg-zinc-900 border border-zinc-700' },
                  { id: 'black', name: 'Obsidian', color: 'bg-black border border-zinc-800' },
                  { id: 'white', name: 'Polar', color: 'bg-zinc-100' }
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDeskFinish(f.id)}
                  className={`h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${f.color} ${
                    deskFinish === f.id ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-zinc-950 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={f.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 2. Ergonomic Seating */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-zinc-400">Ergonomic Chair</span>
            <Armchair className="w-4 h-4 text-violet-400" />
          </div>

          <div className="space-y-2">
            {(
              [
                { id: 'mesh', name: 'Ergonomic Breathable Mesh', desc: 'Spine lumbar support + 4D armrests' },
                { id: 'racing', name: 'High-Back Bucket Racing', desc: 'Neck pillow + bolster side-wings' },
                { id: 'executive', name: 'Plush Stitched Executive', desc: 'High-density foam + aluminum frame' }
              ] as const
            ).map((chair) => (
              <button
                key={chair.id}
                onClick={() => setChairType(chair.id)}
                className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  chairType === chair.id
                    ? 'bg-violet-950/60 border-violet-500 text-white'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{chair.name}</div>
                <div className="text-[10px] font-mono text-zinc-500">{chair.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Monitor Arm Arrangements */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-zinc-400">Monitor Mounts</span>
            <Monitor className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="space-y-1.5">
            {(
              [
                { id: 'single', name: 'Single 32" 4K OLED', desc: 'Gas-spring heavy duty' },
                { id: 'dual', name: 'Dual 27" Side-by-Side', desc: 'Dual articulated arm' },
                { id: 'stacked', name: 'Stacked Dual Vertical', desc: '34" UW + 27" Top Chat' },
                { id: 'triple', name: 'Triple 27" Wrap-Around', desc: '30° Immersion Cockpit' },
                { id: 'ultrawide49', name: 'Single 49" 32:9 Super UW', desc: 'Curved Monster Desk Clamp' }
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMonitorConfig(m.id)}
                className={`w-full px-3 py-1.5 rounded-xl text-left border transition-all cursor-pointer ${
                  monitorConfig === m.id
                    ? 'bg-cyan-950/60 border-cyan-500 text-white'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{m.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Tower Location & Room Footprint */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-zinc-400">Tower Placement</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">160 × 80cm Area</span>
          </div>

          <div className="space-y-1.5">
            {(
              [
                { id: 'desk-right', label: 'On Desk (Right Showcase)', note: 'Exposes tempered glass' },
                { id: 'desk-left', label: 'On Desk (Left Corner)', note: 'Opens right mouse area' },
                { id: 'floor', label: 'Under Desk (Floor Riser)', note: 'Maximizes tabletop area' }
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setTowerPlacement(item.id)}
                className={`w-full px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                  towerPlacement === item.id
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div className="text-[10px] font-mono text-zinc-500">{item.note}</div>
              </button>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 space-y-1">
            <div className="flex justify-between text-zinc-300">
              <span>Bedroom Floor Area:</span>
              <span className="font-bold text-white">1.28 m² (13.8 sq ft)</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Chair Rollout Clearance:</span>
              <span className="text-emerald-400">+85 cm Minimum</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
