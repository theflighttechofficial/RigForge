import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/*
 * Procedural, real-scale model of a mid-tower gaming PC.
 *
 * Units are centimetres. Axes: +x runs from the front panel to the rear I/O, +y is up from the floor,
 * +z points from the motherboard tray towards the glass side panel. Every part is its own group so
 * views can explode, hide or isolate it, and sub-parts register labelled anchors ("callouts") so the
 * UI can point at them and explain what they do.
 */

export type PcPartKey = 'case' | 'motherboard' | 'cpu' | 'ram' | 'storage' | 'gpu' | 'cooler' | 'psu' | 'glass';

export interface PcModelOptions {
  gpuLengthCm: number;
  gpuName: string;
  gpuBrand: 'NVIDIA' | 'AMD' | 'Intel';
  /** Cards over 300 mm usually take 3 slots and carry 3 fans */
  coolerType: 'Tower Air' | '360mm AIO' | 'Stock';
  cpuBrand: 'AMD' | 'Intel';
  ramSticks: 2 | 4;
  ramType: 'DDR4' | 'DDR5';
  rgbHex: string;
  /** Case, fan and cable colour */
  finish?: 'black' | 'white';
}

export interface Callout {
  key: string;
  label: string;
  description: string;
  anchor: THREE.Object3D;
}

export interface PartInfo {
  title: string;
  role: string;
  details: string[];
}

// Plain-language explanation of each part, used by the inspector panels and the anatomy view
export const PART_INFO: Record<PcPartKey, PartInfo> = {
  case: {
    title: 'Case (chassis)',
    role: 'Holds every part in place, guides airflow and shields the parts from dust and knocks.',
    details: ['Front mesh pulls cool air in through the intake fans', 'Rear and top fans push hot air out', 'The bottom shroud hides the power supply and spare cables']
  },
  motherboard: {
    title: 'Motherboard',
    role: 'The main circuit board. Every other part plugs into it and talks through it.',
    details: ['The VRM heatsinks cool the circuits that feed the CPU stable power', 'PCIe slots take the graphics card; M.2 slots take fast SSDs', 'The rear I/O shield carries USB, network and audio ports']
  },
  cpu: {
    title: 'Processor (CPU)',
    role: 'Runs the operating system, game logic, physics and everything that is not drawn by the GPU.',
    details: ['The metal lid (IHS) spreads heat to the cooler', 'Thermal paste fills tiny gaps between the lid and the cooler', 'The socket type decides which motherboards fit']
  },
  ram: {
    title: 'Memory (RAM)',
    role: 'Short-term working memory. Open programs and game data sit here while in use.',
    details: ['Two sticks run in dual channel for twice the bandwidth', 'Heat spreaders cover the memory chips', 'Speed (MT/s) and timings (CL) set how fast the CPU can reach data']
  },
  storage: {
    title: 'NVMe SSD (M.2)',
    role: 'Long-term storage for Windows, games and files. Keeps data when the power is off.',
    details: ['Plugs straight into the motherboard, no cables', 'The controller chip manages the flash memory chips', 'A PCIe 4.0 drive reads around 7,000 MB/s']
  },
  gpu: {
    title: 'Graphics card (GPU)',
    role: 'Draws every frame you see. The most important part for gaming performance.',
    details: ['Fans push air through the heatsink fins below the circuit board', 'VRAM on the card holds textures and frame data', 'Display outputs on the bracket connect your monitor']
  },
  cooler: {
    title: 'CPU cooler',
    role: 'Moves heat away from the processor so it can hold its boost clocks.',
    details: ['Copper heatpipes or liquid carry heat from the CPU', 'Thin aluminium fins give the heat a large surface to leave from', 'Fans push air across the fins and out of the case']
  },
  psu: {
    title: 'Power supply (PSU)',
    role: 'Turns wall power into the steady 12 V, 5 V and 3.3 V the parts need.',
    details: ['Wattage should leave about 20 to 30% headroom over your peak draw', 'The efficiency rating (e.g. 80+ Gold) shows how little power is lost as heat', 'Modular cables only connect what you use']
  },
  glass: {
    title: 'Tempered glass side panel',
    role: 'Lets you see inside while keeping the case closed for airflow and dust control.',
    details: ['Tempered glass shatters into small blunt pieces if it breaks', 'Remove it to work on the parts inside']
  }
};

// ---------------------------------------------------------------------------------------------
// Textures, drawn on canvas so the model needs no image files
// ---------------------------------------------------------------------------------------------

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, srgb = true): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Alpha map with round holes, for perforated steel and mesh panels
function perforationAlpha(holePx = 9, pitchPx = 16): THREE.CanvasTexture {
  const t = canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#000';
    for (let y = 0; y < 256 + pitchPx; y += pitchPx * 0.866) {
      const row = Math.round(y / (pitchPx * 0.866));
      for (let x = (row % 2) * (pitchPx / 2); x < 256 + pitchPx; x += pitchPx) {
        ctx.beginPath();
        ctx.arc(x, y, holePx / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function pcbTexture(): THREE.CanvasTexture {
  return canvasTexture(1024, 1280, (ctx) => {
    ctx.fillStyle = '#121418';
    ctx.fillRect(0, 0, 1024, 1280);
    // Copper traces under the solder mask
    ctx.strokeStyle = 'rgba(70, 82, 96, 0.55)';
    ctx.lineWidth = 2;
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 260; i++) {
      let x = rnd() * 1024;
      let y = rnd() * 1280;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 4; s++) {
        if (rnd() > 0.5) x += (rnd() - 0.5) * 220;
        else y += (rnd() - 0.5) * 220;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Vias
    ctx.fillStyle = 'rgba(160, 150, 120, 0.5)';
    for (let i = 0; i < 500; i++) ctx.fillRect(rnd() * 1024, rnd() * 1280, 3, 3);
    // Silkscreen labels
    ctx.fillStyle = 'rgba(230, 232, 236, 0.75)';
    ctx.font = 'bold 22px monospace';
    const labels: [string, number, number][] = [['CPU_FAN', 560, 70], ['DDR5_A1', 230, 200], ['DDR5_B1', 120, 200], ['PCIEX16_1', 380, 560], ['M2_1', 420, 470], ['ATX_24P', 30, 380], ['EPS_12V', 760, 40], ['SATA6G', 40, 900], ['BIOS', 600, 1150], ['AUDIO', 900, 1180], ['CHA_FAN1', 40, 1220]];
    labels.forEach(([t, x, y]) => ctx.fillText(t, x, y));
    ctx.strokeStyle = 'rgba(230, 232, 236, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(470, 210, 300, 300); // socket outline
  });
}

function labelTexture(lines: { text: string; font: string; color: string }[], bg: string, w = 512, h = 256): THREE.CanvasTexture {
  return canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    let y = h / 2 - ((lines.length - 1) * 44) / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l) => {
      ctx.font = l.font;
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, w / 2, y);
      y += 44;
    });
  });
}

// ---------------------------------------------------------------------------------------------
// Materials (shared, physically based)
// ---------------------------------------------------------------------------------------------

function makeMaterials(rgbHex: string, finish: 'black' | 'white' = 'black') {
  const rgb = new THREE.Color(rgbHex);
  const perf = perforationAlpha();
  const white = finish === 'white';
  return {
    steel: new THREE.MeshStandardMaterial({ color: white ? 0xe4e6e9 : 0x2a2c31, roughness: white ? 0.55 : 0.5, metalness: white ? 0.25 : 0.6 }),
    steelLight: new THREE.MeshStandardMaterial({ color: white ? 0xf3f4f6 : 0x383b42, roughness: 0.5, metalness: white ? 0.2 : 0.55 }),
    mesh: new THREE.MeshStandardMaterial({ color: white ? 0xdfe1e5 : 0x24262b, roughness: 0.6, metalness: 0.4, alphaMap: perf, alphaTest: 0.5, side: THREE.DoubleSide }),
    perf,
    aluminium: new THREE.MeshStandardMaterial({ color: 0xc9ccd1, roughness: 0.32, metalness: 1 }),
    darkAlu: new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.35, metalness: 0.9 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xc8794a, roughness: 0.28, metalness: 1 }),
    nickel: new THREE.MeshStandardMaterial({ color: 0xd9dce1, roughness: 0.18, metalness: 1 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd4a640, roughness: 0.25, metalness: 1 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x1c1d21, roughness: 0.7, metalness: 0.05 }),
    fanPlastic: new THREE.MeshStandardMaterial({ color: white ? 0xf2f3f5 : 0x1f2024, roughness: 0.6, metalness: 0.05 }),
    plasticGrey: new THREE.MeshStandardMaterial({ color: 0x5b5f66, roughness: 0.6, metalness: 0.05 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.95, metalness: 0 }),
    pcb: new THREE.MeshStandardMaterial({ map: pcbTexture(), roughness: 0.55, metalness: 0.15 }),
    pcbPlain: new THREE.MeshStandardMaterial({ color: 0x15231b, roughness: 0.55, metalness: 0.15 }),
    chip: new THREE.MeshStandardMaterial({ color: 0x0e0e10, roughness: 0.45, metalness: 0.2 }),
    sleeve: new THREE.MeshStandardMaterial({ color: white ? 0xe8e8ea : 0x1f1f23, roughness: 0.85, metalness: 0.05 }),
    rgb: new THREE.MeshStandardMaterial({ color: rgb, emissive: rgb, emissiveIntensity: 1.6, roughness: 0.4 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.04,
      transmission: 0.92,
      thickness: 0.4,
      ior: 1.5,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    }),
    glassTint: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.2, metalness: 0.2 })
  };
}
type Materials = ReturnType<typeof makeMaterials>;

// ---------------------------------------------------------------------------------------------
// Small builders
// ---------------------------------------------------------------------------------------------

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, radius = 0): THREE.Mesh {
  const geo = radius > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, Math.min(w, h, d) / 2 - 0.001)) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(r: number, h: number, mat: THREE.Material, seg = 32): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function addCallout(group: THREE.Group, key: string, label: string, description: string, x: number, y: number, z: number) {
  const anchor = new THREE.Object3D();
  anchor.position.set(x, y, z);
  anchor.name = `callout:${key}`;
  group.add(anchor);
  (group.userData.callouts ??= []).push({ key, label, description, anchor } as Callout);
}

/** Many identical thin plates (heatsink fins) drawn in one call */
function finStack(count: number, finW: number, finH: number, finT: number, pitch: number, axis: 'x' | 'y' | 'z', mat: THREE.Material): THREE.InstancedMesh {
  const geo = axis === 'x' ? new THREE.BoxGeometry(finT, finH, finW) : axis === 'y' ? new THREE.BoxGeometry(finW, finT, finH) : new THREE.BoxGeometry(finW, finH, finT);
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4();
  const start = -((count - 1) * pitch) / 2;
  for (let i = 0; i < count; i++) {
    const p = start + i * pitch;
    m.makeTranslation(axis === 'x' ? p : 0, axis === 'y' ? p : 0, axis === 'z' ? p : 0);
    inst.setMatrixAt(i, m);
  }
  inst.castShadow = true;
  inst.receiveShadow = true;
  return inst;
}

/**
 * Axial fan facing local +Y. Returns the whole fan and the rotor, which spins around local Y.
 * size is the frame edge in cm (12 or 14 for case fans, ~9 for GPU fans).
 */
function makeFan(size: number, mats: Materials, opts: { frame?: boolean; blades?: number; rgbRing?: boolean } = {}) {
  const { frame = true, blades = 9, rgbRing = true } = opts;
  const fan = new THREE.Group();
  const depth = size >= 11 ? 2.5 : 1.2;
  const r = size * 0.46;

  if (frame) {
    const shape = new THREE.Shape();
    const h = size / 2;
    const cr = size * 0.08;
    shape.moveTo(-h + cr, -h);
    shape.lineTo(h - cr, -h);
    shape.quadraticCurveTo(h, -h, h, -h + cr);
    shape.lineTo(h, h - cr);
    shape.quadraticCurveTo(h, h, h - cr, h);
    shape.lineTo(-h + cr, h);
    shape.quadraticCurveTo(-h, h, -h, h - cr);
    shape.lineTo(-h, -h + cr);
    shape.quadraticCurveTo(-h, -h, -h + cr, -h);
    const hole = new THREE.Path();
    hole.absarc(0, 0, r + 0.15, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const frameGeo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2, curveSegments: 32 });
    frameGeo.translate(0, 0, -depth / 2);
    frameGeo.rotateX(-Math.PI / 2);
    const frameMesh = new THREE.Mesh(frameGeo, mats.fanPlastic);
    frameMesh.castShadow = true;
    fan.add(frameMesh);
    // Rubber anti-vibration corners
    for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const pad = cyl(size * 0.06, depth + 0.1, mats.rubber, 16);
      pad.position.set(cx * (size / 2 - size * 0.08), 0, cz * (size / 2 - size * 0.08));
      fan.add(pad);
    }
    // Motor struts
    for (let i = 0; i < 4; i++) {
      const strut = box(r, 0.25, 0.35, mats.fanPlastic);
      strut.position.y = -depth / 2 + 0.2;
      strut.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
      strut.position.x = Math.cos(-strut.rotation.y) * r * 0.5;
      strut.position.z = Math.sin(-strut.rotation.y) * r * 0.5;
      fan.add(strut);
    }
  }

  const rotor = new THREE.Group();
  const hubR = r * 0.34;
  const hub = cyl(hubR, depth * 0.85, mats.fanPlastic, 48);
  rotor.add(hub);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(hubR * 0.8, 40), mats.darkAlu);
  cap.rotation.x = -Math.PI / 2;
  cap.position.y = depth * 0.43;
  rotor.add(cap);
  if (rgbRing) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(hubR * 0.92, 0.12, 8, 48), mats.rgb);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = depth * 0.43;
    rotor.add(ring);
  }

  // Swept blades: a curved outline extruded thin, then pitched
  const bladeShape = new THREE.Shape();
  const inner = hubR * 0.95;
  const outer = r - 0.1;
  bladeShape.moveTo(inner, -0.35 * (outer - inner) * 0.4);
  bladeShape.quadraticCurveTo((inner + outer) / 2, -(outer - inner) * 0.55, outer, -(outer - inner) * 0.25);
  bladeShape.quadraticCurveTo(outer + 0.15, (outer - inner) * 0.15, outer * 0.97, (outer - inner) * 0.38);
  bladeShape.quadraticCurveTo((inner + outer) / 2, (outer - inner) * 0.15, inner, (outer - inner) * 0.22);
  bladeShape.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.08, bevelEnabled: false, curveSegments: 12 });
  bladeGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < blades; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / blades) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeo, mats.fanPlastic);
    blade.rotation.x = 0.42; // blade pitch
    blade.castShadow = true;
    pivot.add(blade);
    rotor.add(pivot);
  }
  fan.add(rotor);
  return { fan, rotor };
}

// ---------------------------------------------------------------------------------------------
// Case geometry constants (cm)
// ---------------------------------------------------------------------------------------------

const CASE = { front: -23, rear: 23, bottom: 1.6, top: 47.6, back: -11.5, side: 11.5 };
const SHROUD_TOP = 12.5;
const TRAY_Z = -9.2;
const PCB = { x0: -2.6, x1: 21.8, y0: 15.0, y1: 45.5, z: TRAY_Z + 0.9 };
const SOCKET = { x: 13.2, y: 37.4 };
const PCIE_Y = 31.0;
const CENTER_Y = (CASE.bottom + CASE.top) / 2;

// ---------------------------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------------------------

function buildCase(m: Materials, rotors: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  const W = CASE.rear - CASE.front;
  const H = CASE.top - CASE.bottom;
  const D = CASE.side - CASE.back;
  const cx = (CASE.front + CASE.rear) / 2;

  // Motherboard tray (back wall) with cable cut-outs implied by grommets
  g.add(box(W, H, 0.4, m.steel, cx, CENTER_Y, CASE.back + 0.2, 0.15));
  // Top panel: solid rim with a perforated dust-filter window
  g.add(box(W, 0.5, D, m.steelLight, cx, CASE.top - 0.25, 0, 0.2));
  const topMesh = new THREE.Mesh(new THREE.PlaneGeometry(36, 14), m.mesh);
  m.perf.repeat.set(10, 4);
  topMesh.rotation.x = -Math.PI / 2;
  topMesh.position.set(cx, CASE.top + 0.02, 0.5);
  g.add(topMesh);
  // Bottom plate
  g.add(box(W, 0.4, D, m.steel, cx, CASE.bottom + 0.2, 0));
  // Rear panel (steel) around the I/O and expansion slots
  g.add(box(0.4, H, D, m.steel, CASE.rear - 0.2, CENTER_Y, 0));
  // Expansion slot covers
  for (let i = 0; i < 7; i++) {
    const y = PCIE_Y + 1.6 - i * 2.03;
    g.add(box(0.15, 1.5, 1.8, m.steelLight, CASE.rear + 0.1, y, TRAY_Z + 4.5));
  }
  // Front panel: perforated mesh inside a frame
  const frontFrame = box(1.2, H, D, m.steelLight, CASE.front + 0.6, CENTER_Y, 0, 0.4);
  g.add(frontFrame);
  const frontMesh = new THREE.Mesh(new THREE.PlaneGeometry(D - 3, H - 4), m.mesh.clone());
  frontMesh.rotation.y = -Math.PI / 2;
  frontMesh.position.set(CASE.front - 0.02, CENTER_Y + 1, 0);
  g.add(frontMesh);
  // Front I/O strip on the top edge
  const io = new THREE.Group();
  const power = cyl(0.55, 0.3, m.aluminium, 32);
  power.position.set(CASE.front + 3, CASE.top + 0.15, 6);
  io.add(power);
  io.add(box(0.9, 0.05, 0.45, m.plastic, CASE.front + 5, CASE.top + 0.02, 6)); // USB-C
  io.add(box(1.3, 0.05, 0.5, m.plastic, CASE.front + 7, CASE.top + 0.02, 6)); // USB-A
  io.add(box(1.3, 0.05, 0.5, m.plastic, CASE.front + 9, CASE.top + 0.02, 6));
  g.add(io);
  // PSU shroud with vent slots and a cut-out for the GPU power cable
  const shroudW = W - 6;
  g.add(box(shroudW, 0.4, D - 1.5, m.steel, CASE.rear - shroudW / 2, SHROUD_TOP, -0.75, 0.15));
  g.add(box(shroudW, SHROUD_TOP - CASE.bottom, 0.4, m.steel, CASE.rear - shroudW / 2, (SHROUD_TOP + CASE.bottom) / 2, CASE.side - 1.6, 0.15));
  for (let i = 0; i < 8; i++) g.add(box(2.6, 0.08, 0.3, m.plastic, -12 + i * 3.5, SHROUD_TOP + 0.21, 4));
  // Rubber cable grommets in the tray
  for (const y of [20, 29, 38]) {
    const grom = cyl(1.2, 0.5, m.rubber, 24);
    grom.rotation.x = Math.PI / 2;
    grom.position.set(-4.8, y, CASE.back + 0.45);
    g.add(grom);
  }
  // Feet
  for (const [fx, fz] of [[-19, -8], [-19, 8], [19, -8], [19, 8]]) {
    const foot = cyl(1.4, 1.6, m.rubber, 24);
    foot.position.set(fx, 0.8, fz);
    g.add(foot);
  }
  // Front intake fans (3 x 120 mm) and rear exhaust fan
  for (let i = 0; i < 3; i++) {
    const { fan, rotor } = makeFan(12, m);
    fan.rotation.z = -Math.PI / 2; // face +x, pulling air into the case
    fan.position.set(CASE.front + 2.6, 9.0 + i * 12.4, 0.5);
    g.add(fan);
    rotors.push(rotor);
  }
  const rear = makeFan(12, m);
  rear.fan.rotation.z = -Math.PI / 2;
  rear.fan.position.set(CASE.rear - 1.6, 38.5, -1.5);
  g.add(rear.fan);
  rotors.push(rear.rotor);

  addCallout(g, 'intake', 'Intake fans', 'Pull cool room air in through the front mesh.', CASE.front + 2, 21.4, 7);
  addCallout(g, 'exhaust', 'Exhaust fan', 'Pushes warm air out of the back of the case.', CASE.rear - 1, 38.5, 5);
  addCallout(g, 'shroud', 'PSU shroud', 'Covers the power supply and hides spare cables.', 0, SHROUD_TOP, 9);
  addCallout(g, 'frontio', 'Front I/O', 'Power button plus USB-A and USB-C ports.', CASE.front + 6, CASE.top, 6);
  return g;
}

function buildMotherboard(m: Materials, o: PcModelOptions): THREE.Group {
  const g = new THREE.Group();
  const w = PCB.x1 - PCB.x0;
  const h = PCB.y1 - PCB.y0;
  const pcb = box(w, h, 0.16, m.pcb, (PCB.x0 + PCB.x1) / 2, (PCB.y0 + PCB.y1) / 2, PCB.z);
  g.add(pcb);
  const zf = PCB.z + 0.08; // front face of the board

  // Standoffs
  for (const [sx, sy] of [[-1.7, 44.5], [-1.7, 31], [-1.7, 16], [12, 44.5], [12, 31], [20.8, 44.5], [20.8, 31], [20.8, 16]]) {
    const s = cyl(0.3, 0.8, m.gold, 12);
    s.rotation.x = Math.PI / 2;
    s.position.set(sx, sy, PCB.z - 0.48);
    g.add(s);
  }
  // Rear I/O shroud
  g.add(box(2.6, 8.6, 2.4, m.darkAlu, PCB.x1 - 1.4, 40.6, zf + 1.2, 0.3));
  // VRM heatsinks: one above the socket, one beside it, with milled grooves
  const vrmTop = new THREE.Group();
  vrmTop.add(box(10.5, 2.4, 2.2, m.darkAlu, 0, 0, 0, 0.25));
  vrmTop.add(finStack(9, 2.0, 0.3, 0.12, 1.1, 'x', m.aluminium)).position.set(0, 1.25, 0);
  vrmTop.position.set(SOCKET.x - 1, 43.6, zf + 1.1);
  g.add(vrmTop);
  const vrmSide = box(2.2, 8.5, 2.2, m.darkAlu, SOCKET.x + 5.4, 37.4, zf + 1.1, 0.25);
  g.add(vrmSide);
  // CPU socket (frame + retention arm)
  g.add(box(5.6, 5.6, 0.4, m.plastic, SOCKET.x, SOCKET.y, zf + 0.2, 0.1));
  g.add(box(6.4, 0.25, 0.25, m.nickel, SOCKET.x, SOCKET.y - 3.2, zf + 0.3));
  // DIMM slots with latches
  const dimmX = [4.1, 5.0, 6.15, 7.05];
  dimmX.forEach((x) => {
    g.add(box(0.6, 13.6, 0.75, m.plastic, x, 38.0, zf + 0.37));
    g.add(box(0.7, 0.6, 1.0, m.plasticGrey, x, 44.95, zf + 0.6));
    g.add(box(0.7, 0.6, 1.0, m.plasticGrey, x, 31.05, zf + 0.6));
  });
  // 24-pin ATX power connector and 8-pin EPS
  g.add(box(1.4, 5.4, 1.6, m.plastic, PCB.x0 + 1.0, 36.5, zf + 0.8, 0.1));
  g.add(box(2.2, 1.1, 1.4, m.plastic, SOCKET.x + 4.2, 45.0, zf + 0.7, 0.1));
  // PCIe x16 slot with steel armour, plus a second x16 and an x1
  g.add(box(8.9, 0.75, 0.95, m.plastic, PCB.x1 - 8.6, PCIE_Y, zf + 0.47));
  g.add(box(9.1, 0.85, 1.0, m.nickel, PCB.x1 - 8.6, PCIE_Y, zf + 0.5)).scale.set(1, 1, 0.4);
  g.add(box(8.9, 0.75, 0.95, m.plastic, PCB.x1 - 8.6, PCIE_Y - 6.1, zf + 0.47));
  g.add(box(2.5, 0.75, 0.95, m.plastic, PCB.x1 - 4.4, PCIE_Y - 4.05, zf + 0.47));
  // Chipset heatsink and M.2 heatsink with a stripe
  g.add(box(5.6, 5.0, 1.0, m.darkAlu, 3.4, 20.6, zf + 0.5, 0.3));
  g.add(box(5.6, 0.3, 0.05, m.rgb, 3.4, 22.6, zf + 1.02));
  g.add(box(8.2, 2.6, 0.6, m.darkAlu, PCB.x1 - 9.2, PCIE_Y - 3.0, zf + 0.3, 0.15));
  // SATA ports on the front edge, CMOS battery, audio capacitors
  for (let i = 0; i < 4; i++) g.add(box(1.0, 0.6, 1.2, m.plastic, PCB.x0 + 0.6, 18 + i * 0.9, zf + 0.6));
  const battery = cyl(1.0, 0.3, m.nickel, 32);
  battery.rotation.x = Math.PI / 2;
  battery.position.set(9.5, 18.3, zf + 0.15);
  g.add(battery);
  for (let i = 0; i < 6; i++) {
    const cap = cyl(0.32, 1.0, m.gold, 16);
    cap.rotation.x = Math.PI / 2;
    cap.position.set(PCB.x1 - 1.0 - (i % 2) * 0.9, 16.4 + Math.floor(i / 2) * 0.9, zf + 0.5);
    g.add(cap);
  }

  addCallout(g, 'vrm', 'VRM heatsinks', 'Cool the circuits that feed the CPU clean, steady power.', SOCKET.x - 1, 43.6, zf + 2.4);
  addCallout(g, 'dimm', 'DIMM slots', 'Memory sticks clip in here. Use slots A2 and B2 for two sticks.', 5.5, 42.5, zf + 1);
  addCallout(g, 'pcie', 'PCIe x16 slot', 'The steel-armoured slot holds the graphics card.', PCB.x1 - 5, PCIE_Y, zf + 1);
  addCallout(g, 'atx24', '24-pin power', 'Main power input from the power supply.', PCB.x0 + 1, 39, zf + 1.6);
  addCallout(g, 'chipset', 'Chipset', 'Handles extra USB, SATA and M.2 lanes. Cooled by this heatsink.', 3.4, 20.6, zf + 1.1);
  addCallout(g, 'io', 'Rear I/O', 'USB, Ethernet, Wi-Fi antenna and audio ports at the back.', PCB.x1 - 1.4, 44, zf + 2.4);
  return g;
}

function buildCpu(m: Materials, o: PcModelOptions): THREE.Group {
  const g = new THREE.Group();
  const zf = PCB.z + 0.48;
  // Package substrate and heat spreader. AM5 lids have the cut-out corners; Intel lids are a rounded rectangle.
  g.add(box(4.0, 4.0, 0.12, m.pcbPlain, SOCKET.x, SOCKET.y, zf + 0.06));
  if (o.cpuBrand === 'AMD') {
    const s = new THREE.Shape();
    const a = 1.6;
    const n = 0.45;
    s.moveTo(-a, -a + n);
    s.lineTo(-a + n, -a + n);
    s.lineTo(-a + n, -a);
    s.lineTo(a - n, -a);
    s.lineTo(a - n, -a + n);
    s.lineTo(a, -a + n);
    s.lineTo(a, a - n);
    s.lineTo(a - n, a - n);
    s.lineTo(a - n, a);
    s.lineTo(-a + n, a);
    s.lineTo(-a + n, a - n);
    s.lineTo(-a, a - n);
    s.closePath();
    const ihs = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }), m.nickel);
    ihs.position.set(SOCKET.x, SOCKET.y, zf + 0.12);
    ihs.castShadow = true;
    g.add(ihs);
  } else {
    g.add(box(3.1, 3.4, 0.3, m.nickel, SOCKET.x, SOCKET.y, zf + 0.27, 0.12));
  }
  const engraving = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.2),
    new THREE.MeshStandardMaterial({
      map: labelTexture([{ text: o.cpuBrand === 'AMD' ? 'AMD RYZEN' : 'intel CORE', font: 'bold 60px sans-serif', color: '#55585e' }], '#d9dce1', 512, 256),
      roughness: 0.25,
      metalness: 0.9
    })
  );
  engraving.position.set(SOCKET.x, SOCKET.y, zf + 0.5);
  g.add(engraving);
  addCallout(g, 'ihs', 'Heat spreader (IHS)', 'Metal lid that spreads heat from the chip to the cooler.', SOCKET.x, SOCKET.y, zf + 0.6);
  return g;
}

function buildRam(m: Materials, o: PcModelOptions): THREE.Group {
  const g = new THREE.Group();
  const zf = PCB.z + 0.75;
  const slots = o.ramSticks === 4 ? [4.1, 5.0, 6.15, 7.05] : [5.0, 7.05];
  const label = new THREE.MeshStandardMaterial({
    map: labelTexture([{ text: `${o.ramType} 6000`, font: 'bold 64px monospace', color: '#e5e7eb' }], '#202226', 512, 128),
    roughness: 0.5,
    metalness: 0.6
  });
  slots.forEach((x) => {
    const stick = new THREE.Group();
    stick.add(box(0.12, 13.3, 3.1, m.pcbPlain, 0, 0, 1.55));
    // Memory chips on both faces (only visible in the anatomy view)
    for (let i = 0; i < 8; i++) {
      stick.add(box(0.06, 1.1, 0.9, m.chip, 0.09, -5.6 + i * 1.6, 1.2));
      stick.add(box(0.06, 1.1, 0.9, m.chip, -0.09, -5.6 + i * 1.6, 1.2));
    }
    // Heat spreaders with a ridged top and an RGB diffuser
    stick.add(box(0.5, 13.4, 3.6, m.darkAlu, 0, 0, 1.95, 0.1));
    stick.add(finStack(14, 0.55, 0.5, 0.18, 0.95, 'y', m.aluminium).translateZ(3.95));
    stick.add(box(0.36, 13.2, 0.5, m.rgb, 0, 0, 4.35, 0.12));
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.2), label);
    lab.rotation.y = Math.PI / 2;
    lab.position.set(0.26, 0, 2.2);
    stick.add(lab);
    stick.position.set(x, 38.0, zf);
    g.add(stick);
  });
  addCallout(g, 'spreader', 'Heat spreaders', 'Aluminium covers that keep the memory chips cool.', slots[slots.length - 1], 41, zf + 3.6);
  addCallout(g, 'rgbbar', 'RGB light bar', 'Diffused lighting strip. Purely cosmetic.', slots[0], 35, zf + 4.4);
  return g;
}

function buildStorage(m: Materials): THREE.Group {
  const g = new THREE.Group();
  const zf = PCB.z + 0.22;
  const cx = PCB.x1 - 9.2;
  const y = PCIE_Y - 3.0;
  // The drive itself sits under the board's M.2 heatsink; shown as a 2280 module
  const drive = new THREE.Group();
  drive.add(box(8.0, 2.2, 0.08, m.pcbPlain, 0, 0, 0));
  drive.add(box(1.2, 1.2, 0.12, m.chip, -2.8, 0, 0.1)); // controller
  drive.add(box(1.8, 1.6, 0.12, m.chip, -0.6, 0, 0.1)); // NAND
  drive.add(box(1.8, 1.6, 0.12, m.chip, 1.6, 0, 0.1));
  drive.add(box(0.9, 1.9, 0.02, m.gold, 3.75, 0, 0.03)); // key edge
  const sticker = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 1.9),
    new THREE.MeshStandardMaterial({
      map: labelTexture([{ text: 'NVMe Gen4 2TB', font: 'bold 52px sans-serif', color: '#f5f5f5' }, { text: '7400 MB/s', font: '36px monospace', color: '#a1a1aa' }], '#151618', 512, 192),
      roughness: 0.6
    })
  );
  sticker.position.set(-0.4, 0, 0.17);
  drive.add(sticker);
  drive.position.set(cx, y, zf - 0.05);
  g.add(drive);
  addCallout(g, 'controller', 'Controller', 'Small processor that manages reads, writes and wear on the flash.', cx - 2.8, y, zf + 0.6);
  addCallout(g, 'nand', 'NAND flash', 'Memory chips that keep your files without power.', cx + 1.6, y, zf + 0.6);
  return g;
}

function buildGpu(m: Materials, o: PcModelOptions, rotors: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  const L = THREE.MathUtils.clamp(o.gpuLengthCm, 17, 36);
  const thick = L > 30 ? 6.0 : L > 24 ? 5.0 : 4.0; // 3-slot, 2.5-slot or 2-slot
  const H = L > 24 ? 13.0 : 11.5;
  const x1 = PCB.x1; // bracket side
  const x0 = x1 - L;
  const cx = (x0 + x1) / 2;
  const yTop = PCIE_Y + 0.4;
  const yMid = yTop - H / 2;
  const z0 = PCB.z + 1.0; // PCB of the card sits just off the slot
  const zMid = z0 + thick / 2;

  const shroudMat = new THREE.MeshStandardMaterial({ color: o.gpuBrand === 'AMD' ? 0x1b1c20 : o.gpuBrand === 'Intel' ? 0x22252b : 0x2a2b2e, roughness: 0.45, metalness: 0.6 });
  // Card PCB and gold edge connector
  g.add(box(L - 1, H - 1, 0.16, m.pcbPlain, cx - 0.3, yMid, z0));
  g.add(box(8.6, 0.9, 0.12, m.gold, x1 - 8.6, yTop - 0.1, z0));
  // Backplate on the top (+y) face, with vent cut-outs drawn as a texture
  const back = box(L - 0.4, 0.25, thick + 0.4, m.darkAlu, cx, yTop + 0.2, zMid, 0.1);
  g.add(back);
  // Heatsink fin stack between PCB and fans, visible from the glass side
  // Fins stand in y-z planes, spaced along the card length
  g.add(finStack(Math.floor((L - 2.5) / 0.32), thick - 1.6, H - 3.2, 0.07, 0.32, 'x', m.aluminium).translateX(cx).translateY(yMid + 0.6).translateZ(zMid - 0.1));
  // Copper heatpipes running along the fins
  for (let i = 0; i < 5; i++) {
    const pipe = cyl(0.32, L - 3, m.copper, 16);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(cx, yMid + 2.2 - i * 0.9, zMid + 0.4 - (i % 2) * 0.8);
    g.add(pipe);
  }
  // Shroud: a frame around the fans on the bottom face plus the side wall facing the glass
  g.add(box(L, 0.9, thick, shroudMat, cx, yTop - H + 0.45, zMid, 0.35));
  g.add(box(L, H - 0.6, 0.6, shroudMat, cx, yMid - 0.1, z0 + thick - 0.3, 0.3));
  g.add(box(1.0, H, thick, shroudMat, x0 + 0.5, yMid, zMid, 0.3));
  // Branding and RGB on the side wall
  const brand = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(14, L * 0.5), 2.2),
    new THREE.MeshStandardMaterial({
      map: labelTexture([{ text: o.gpuName.replace(/^(NVIDIA|AMD|Intel)\s+/i, '').toUpperCase(), font: 'bold 54px sans-serif', color: '#e4e4e7' }], '#00000000', 1024, 160),
      transparent: true,
      roughness: 0.4
    })
  );
  brand.position.set(cx - 1, yMid + 2.6, z0 + thick + 0.01);
  g.add(brand);
  g.add(box(L * 0.55, 0.35, 0.08, m.rgb, cx + L * 0.12, yMid - 3.4, z0 + thick + 0.02));
  // Fans on the bottom face, blowing up into the fins
  const fanCount = L > 28 ? 3 : 2;
  const fanSize = Math.min(H - 2.2, (L - 2) / fanCount - 0.3);
  for (let i = 0; i < fanCount; i++) {
    const { fan, rotor } = makeFan(fanSize, m, { frame: false, blades: 11, rgbRing: false });
    fan.rotation.x = Math.PI; // face -y (down)
    const fx = x0 + 1 + (i + 0.5) * ((L - 2) / fanCount);
    fan.position.set(fx, yTop - H + 0.3, zMid);
    g.add(fan);
    rotors.push(rotor);
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(fanSize * 0.47, 0.12, 8, 48), shroudMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(fx, yTop - H + 0.3, zMid);
    g.add(ringMesh);
  }
  // I/O bracket with display outputs
  g.add(box(0.15, 12.0, thick + 0.4, m.nickel, x1 + 0.3, yMid + 0.3, zMid));
  for (let i = 0; i < 4; i++) g.add(box(0.2, 1.0, 1.6, m.plastic, x1 + 0.42, yMid + 3.2 - i * 1.9, zMid - 0.5));
  // 16-pin power connector and its cable down to the PSU shroud
  const plugX = cx + L * 0.12;
  g.add(box(2.0, 0.8, 1.2, m.plastic, plugX, yTop + 0.7, zMid + 1));
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(plugX, yTop + 1.0, zMid + 1),
        new THREE.Vector3(plugX - 2, yTop + 3, zMid + 3),
        new THREE.Vector3(x0 + 2, yTop - 1, zMid + 4.5),
        new THREE.Vector3(x0 + 1, SHROUD_TOP + 2, zMid + 4),
        new THREE.Vector3(x0 + 1.5, SHROUD_TOP - 0.5, zMid + 3.5)
      ]),
      48,
      0.55,
      12
    ),
    m.sleeve
  );
  cable.castShadow = true;
  cable.userData.noFocus = true;
  g.add(cable);

  addCallout(g, 'fans', 'Cooling fans', 'Push air up through the heatsink. They often stop at idle.', x0 + (L - 2) / (2 * fanCount) + 1, yTop - H, zMid + 1);
  addCallout(g, 'fins', 'Heatsink fins', 'Heat from the GPU chip spreads into these thin fins.', cx, yMid, z0 + thick);
  addCallout(g, 'backplate', 'Backplate', 'Stiffens the card and helps cool memory on the back.', x0 + 2.5, yTop + 0.4, zMid);
  addCallout(g, 'power', '16-pin power', 'Main power input. Push the plug fully in.', plugX, yTop + 1, zMid + 1.5);
  addCallout(g, 'outputs', 'Display outputs', 'DisplayPort and HDMI for your monitors.', x1 + 0.5, yMid + 1, zMid);
  return g;
}

function buildCooler(m: Materials, o: PcModelOptions, rotors: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  const zf = PCB.z + 1.05;
  if (o.coolerType === '360mm AIO') {
    // Pump block on the CPU
    const pump = cyl(3.2, 2.6, m.darkAlu, 64);
    pump.rotation.x = Math.PI / 2;
    pump.position.set(SOCKET.x, SOCKET.y, zf + 1.3);
    g.add(pump);
    const glassCap = new THREE.Mesh(new THREE.CircleGeometry(2.7, 64), m.glassTint);
    glassCap.position.set(SOCKET.x, SOCKET.y, zf + 2.62);
    g.add(glassCap);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.16, 12, 64), m.rgb);
    ring.position.set(SOCKET.x, SOCKET.y, zf + 2.62);
    g.add(ring);
    // Radiator under the top panel with three fans below it
    const radY = CASE.top - 2.2;
    const rad = new THREE.Group();
    rad.add(box(39.4, 2.7, 12.0, m.darkAlu, 0, 0, 0, 0.2));
    rad.add(finStack(110, 11.0, 2.0, 0.06, 0.34, 'x', m.aluminium).translateY(-0.2));
    rad.add(box(2.2, 3.2, 12.4, m.steel, -20.2, 0, 0, 0.3));
    rad.add(box(2.2, 3.2, 12.4, m.steel, 20.2, 0, 0, 0.3));
    rad.position.set(-1, radY, 2.6);
    g.add(rad);
    for (let i = 0; i < 3; i++) {
      const { fan, rotor } = makeFan(12, m);
      fan.position.set(-13.4 + i * 12.4, radY - 2.6, 2.6);
      g.add(fan);
      rotors.push(rotor);
    }
    // Two braided coolant tubes
    for (const dz of [-0.8, 0.8]) {
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(SOCKET.x - 2.6, SOCKET.y + dz, zf + 1.3),
            new THREE.Vector3(SOCKET.x - 6, SOCKET.y + 3 + dz, zf + 3.5),
            new THREE.Vector3(-14, radY - 4 + dz, 4.5 + dz),
            new THREE.Vector3(-20.5, radY - 0.4, 2.6 + dz * 2)
          ]),
          64,
          0.6,
          12
        ),
        m.sleeve
      );
      tube.castShadow = true;
      g.add(tube);
    }
    addCallout(g, 'pump', 'Pump block', 'Sits on the CPU and pumps coolant through the loop.', SOCKET.x, SOCKET.y, zf + 2.8);
    addCallout(g, 'radiator', 'Radiator', 'Coolant gives its heat to these fins; the fans push it out of the top.', 0, radY, 8.8);
    addCallout(g, 'tubes', 'Coolant tubes', 'Carry warm liquid to the radiator and cool liquid back.', -12, radY - 4, 5);
  } else if (o.coolerType === 'Stock') {
    // Boxed stock cooler: round aluminium heatsink under a single top-flow fan
    const sink = new THREE.Group();
    const core = cyl(1.6, 3.2, m.copper, 32);
    core.rotation.x = Math.PI / 2;
    sink.add(core);
    for (let i = 0; i < 36; i++) {
      const fin = box(4.6, 0.12, 3.0, m.aluminium);
      fin.rotation.z = (i / 36) * Math.PI;
      sink.add(fin);
    }
    sink.position.set(SOCKET.x, SOCKET.y, zf + 1.6);
    g.add(sink);
    const { fan, rotor } = makeFan(9.2, m, { blades: 7 });
    fan.rotation.x = Math.PI / 2; // face +z, blowing down onto the heatsink
    fan.position.set(SOCKET.x, SOCKET.y, zf + 3.9);
    g.add(fan);
    rotors.push(rotor);
    addCallout(g, 'stocksink', 'Aluminium heatsink', 'Radial fins around a copper core spread the CPU heat.', SOCKET.x + 2.5, SOCKET.y, zf + 2);
    addCallout(g, 'stockfan', 'Top-flow fan', 'Blows air down through the fins and over the VRMs.', SOCKET.x, SOCKET.y + 3.5, zf + 5);
  } else {
    // Dual-tower air cooler: copper base, six heatpipes, two fin stacks and two fans
    const base = box(4.4, 4.0, 1.2, m.copper, SOCKET.x, SOCKET.y, zf + 0.6, 0.15);
    g.add(base);
    g.add(box(4.6, 4.4, 0.7, m.nickel, SOCKET.x, SOCKET.y, zf + 1.45, 0.15));
    const towerZ = zf + 4 + 7.4;
    for (const dx of [-3.9, 3.9]) {
      // Fins stacked along z (towards the glass), each fin in an x-y plane, with a cover plate on top
      const t = new THREE.Group();
      t.add(finStack(40, 5.0, 12.4, 0.05, 0.36, 'z', m.aluminium));
      t.add(box(5.2, 12.6, 0.4, m.steelLight, 0, 0, 7.4, 0.12));
      t.add(box(5.25, 0.25, 0.42, m.rgb, 0, -6.2, 7.4));
      t.position.set(SOCKET.x + dx, SOCKET.y, towerZ);
      g.add(t);
    }
    // Heatpipes: U-shapes rising from the base into both towers
    for (let i = 0; i < 6; i++) {
      const y = SOCKET.y - 1.6 + (i % 3) * 1.6;
      const side = i < 3 ? -1 : 1;
      const x = SOCKET.x + side * (1.0 + (i % 3) * 0.5);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(SOCKET.x, y, zf + 0.8),
        new THREE.Vector3(x, y, zf + 2.5),
        new THREE.Vector3(SOCKET.x + side * 3.9 + (i % 3 - 1) * 0.9, y, zf + 5),
        new THREE.Vector3(SOCKET.x + side * 3.9 + (i % 3 - 1) * 0.9, y, towerZ + 7.6)
      ]);
      const pipe = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.3, 12), m.copper);
      pipe.castShadow = true;
      g.add(pipe);
    }
    // Fans: one in front of the first tower, one between the towers, blowing towards the rear exhaust
    for (const fx of [SOCKET.x - 7.2, SOCKET.x]) {
      const { fan, rotor } = makeFan(12, m);
      fan.rotation.z = -Math.PI / 2;
      fan.position.set(fx, SOCKET.y, towerZ);
      g.add(fan);
      rotors.push(rotor);
    }
    addCallout(g, 'base', 'Copper base', 'Touches the CPU through thermal paste and pulls heat into the heatpipes.', SOCKET.x, SOCKET.y - 2.5, zf + 1.8);
    addCallout(g, 'heatpipes', 'Heatpipes', 'Sealed copper tubes; liquid inside evaporates and carries heat up fast.', SOCKET.x - 4, SOCKET.y - 2, zf + 4);
    addCallout(g, 'towers', 'Fin towers', 'Thin aluminium fins release the heat into the moving air.', SOCKET.x + 3.9, SOCKET.y + 6.5, towerZ);
    addCallout(g, 'coolerfans', 'Cooler fans', 'Push air through both towers towards the rear exhaust.', SOCKET.x - 7.6, SOCKET.y, towerZ + 6);
  }
  return g;
}

function buildPsu(m: Materials): THREE.Group {
  const g = new THREE.Group();
  const cx = 13.5;
  const cy = CASE.bottom + 4.6;
  g.add(box(16, 8.6, 15, m.steel, cx, cy, -2.5, 0.25));
  // Fan grille facing down, honeycomb via the perforation map
  const grille = new THREE.Mesh(new THREE.CircleGeometry(6.2, 48), m.mesh.clone());
  grille.rotation.x = Math.PI / 2;
  grille.position.set(cx, cy - 4.32, -2.5);
  g.add(grille);
  // Modular sockets on the inner face
  for (let i = 0; i < 6; i++) g.add(box(0.4, 1.4, 2.0, m.plastic, cx - 8.05, cy + 2.4 - (i % 3) * 2.0, -6 + Math.floor(i / 3) * 3));
  const sticker = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 5),
    new THREE.MeshStandardMaterial({
      map: labelTexture([{ text: '850W', font: 'bold 92px sans-serif', color: '#f4f4f5' }, { text: '80 PLUS GOLD  ATX 3.1', font: '34px monospace', color: '#d4a640' }], '#18181b', 512, 256),
      roughness: 0.6
    })
  );
  sticker.position.set(cx, cy, 5.02);
  g.add(sticker);
  // 24-pin cable from the shroud grommet to the motherboard
  const atx = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(cx - 8, cy + 1, -5),
        new THREE.Vector3(-4, SHROUD_TOP - 1, -8.6),
        new THREE.Vector3(-4.8, 26, -9.5),
        new THREE.Vector3(-4.2, 34.5, PCB.z + 0.4),
        new THREE.Vector3(PCB.x0 + 0.2, 36.5, PCB.z + 1.6)
      ]),
      64,
      0.9,
      14
    ),
    m.sleeve
  );
  atx.castShadow = true;
  atx.userData.noFocus = true;
  g.add(atx);
  addCallout(g, 'psufan', 'PSU fan', 'Draws air from under the case through a dust filter.', cx, cy - 4.3, 4);
  addCallout(g, 'rating', 'Efficiency label', 'Wattage and 80 PLUS rating. Gold wastes about 10% as heat.', cx, cy, 5.2);
  addCallout(g, 'atxcable', '24-pin cable', 'Routed behind the tray and up to the motherboard.', -4.5, 30, -9);
  return g;
}

function buildGlass(m: Materials): THREE.Group {
  const g = new THREE.Group();
  const W = CASE.rear - CASE.front - 0.6;
  const H = CASE.top - CASE.bottom - 0.6;
  const pane = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.4), m.glass);
  pane.position.set((CASE.front + CASE.rear) / 2, CENTER_Y, CASE.side - 0.2);
  pane.renderOrder = 2;
  g.add(pane);
  // Black ceramic border print
  const border = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.3,
      alphaMap: canvasTexture(256, 256, (ctx) => {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#000';
        ctx.fillRect(6, 6, 244, 244);
      }, false),
      transparent: true
    })
  );
  border.position.copy(pane.position).add(new THREE.Vector3(0, 0, 0.23));
  g.add(border);
  for (const [sx, sy] of [[-21.5, 4], [-21.5, 45], [21.5, 4], [21.5, 45]]) {
    const screw = cyl(0.55, 0.5, m.nickel, 24);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(sx, sy, CASE.side + 0.25);
    g.add(screw);
  }
  addCallout(g, 'glasspanel', 'Tempered glass', 'Removable side panel held by four thumb screws.', 0, 40, CASE.side + 0.3);
  return g;
}

// ---------------------------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------------------------

export interface PcModel {
  root: THREE.Group;
  parts: Record<PcPartKey, THREE.Group>;
  rotors: THREE.Object3D[];
  rgbMaterial: THREE.MeshStandardMaterial;
  /** Overall bounding box in model units (cm) */
  size: THREE.Vector3;
  dispose: () => void;
}

export function buildPcModel(o: PcModelOptions): PcModel {
  const mats = makeMaterials(o.rgbHex, o.finish);
  const rotors: THREE.Object3D[] = [];
  const parts: Record<PcPartKey, THREE.Group> = {
    case: buildCase(mats, rotors),
    motherboard: buildMotherboard(mats, o),
    cpu: buildCpu(mats, o),
    ram: buildRam(mats, o),
    storage: buildStorage(mats),
    gpu: buildGpu(mats, o, rotors),
    cooler: buildCooler(mats, o, rotors),
    psu: buildPsu(mats),
    glass: buildGlass(mats)
  };
  const root = new THREE.Group();
  (Object.keys(parts) as PcPartKey[]).forEach((k) => {
    parts[k].name = k;
    parts[k].userData.partKey = k;
    root.add(parts[k]);
  });
  const size = new THREE.Box3().setFromObject(parts.case).getSize(new THREE.Vector3());
  return {
    root,
    parts,
    rotors,
    rgbMaterial: mats.rgb,
    size,
    dispose: () => disposeObject(root)
  };
}

/** Model of a single part, centred on the origin, for close-up views */
export function buildPartModel(
  key: PcPartKey,
  o: PcModelOptions
): { group: THREE.Group; callouts: Callout[]; rotors: THREE.Object3D[]; focusSize: THREE.Vector3; dispose: () => void } {
  const model = buildPcModel(o);
  const part = model.parts[key];
  // Keep the motherboard under the CPU, RAM and storage so they make sense on their own
  const group = new THREE.Group();
  const keep: PcPartKey[] = key === 'cpu' || key === 'ram' || key === 'storage' ? [key, 'motherboard'] : [key];
  keep.forEach((k) => group.add(model.parts[k]));
  if (key !== 'motherboard' && keep.length > 1) {
    // Dim the board so the focused part stands out
    model.parts.motherboard.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        mat.transparent = true;
        mat.opacity = 0.35;
        mesh.material = mat;
      }
    });
  }
  // Frame the part itself; cables and the dimmed board around it are context only
  const bounds = new THREE.Box3();
  part.updateMatrixWorld(true);
  part.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && !mesh.userData.noFocus) bounds.expandByObject(mesh);
  });
  const centre = bounds.getCenter(new THREE.Vector3());
  group.children.forEach((c) => c.position.sub(centre));
  const focusSize = bounds.getSize(new THREE.Vector3());
  const callouts = (part.userData.callouts ?? []) as Callout[];
  const rotors = model.rotors.filter((r) => {
    let p: THREE.Object3D | null = r;
    while (p) {
      if (p === part) return true;
      p = p.parent;
    }
    return false;
  });
  return { group, callouts, rotors, focusSize, dispose: () => { disposeObject(group); model.dispose(); } };
}

export function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((mm) => {
      Object.values(mm).forEach((v) => {
        if (v instanceof THREE.Texture) v.dispose();
      });
      mm.dispose();
    });
  });
}

/** Physically based renderer setup plus a soft studio reflection environment */
export function setupRenderer(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  pmrem.dispose();
  return () => env.dispose();
}

export function gpuOptions(gpu: { Model: string; Brand: string; Length_mm: number }): Pick<PcModelOptions, 'gpuLengthCm' | 'gpuName' | 'gpuBrand'> {
  return {
    gpuLengthCm: gpu.Length_mm ? gpu.Length_mm / 10 : 30,
    gpuName: gpu.Model,
    gpuBrand: gpu.Brand === 'AMD' ? 'AMD' : gpu.Brand === 'Intel' ? 'Intel' : 'NVIDIA'
  };
}
