import React, { useEffect, useRef } from 'react';
import type { ActiveTab } from '../types';

interface SiliconOSIntroProps {
  onLaunch: () => void;
  onDirectLaunchWorkspace?: (tab?: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const COOL = '#5CE1FF';
const HEAT = '#FF8A3D';

/**
 * Ported from silicon-os-intro.html. The intro plays a five-chapter cinematic
 * (power-on -> assembly -> thermal sim -> die map -> wordmark reveal), then
 * settles into a landing screen whose nav/CTA buttons route into the real app
 * via the onLaunch / onDirectLaunchWorkspace callbacks instead of `#` links.
 */
export const SiliconOSIntro: React.FC<SiliconOSIntroProps> = ({ onLaunch, onDirectLaunchWorkspace }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const navigateRef = useRef({ onLaunch, onDirectLaunchWorkspace });
  navigateRef.current = { onLaunch, onDirectLaunchWorkspace };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const cleanup = mountSiliconIntro(host, {
      goTab: (tab: string) => navigateRef.current.onDirectLaunchWorkspace?.(tab as ActiveTab),
      goOverview: () => navigateRef.current.onLaunch()
    });
    return cleanup;
  }, []);

  return (
    <div ref={hostRef} className="fixed inset-0 z-0" style={{ background: '#09090B' }} />
  );
};

interface NavCallbacks {
  goTab: (tab: string) => void;
  goOverview: () => void;
}

function mountSiliconIntro(host: HTMLElement, nav: NavCallbacks): () => void {
  const styleEl = document.createElement('style');
  styleEl.textContent = INTRO_CSS;
  host.appendChild(styleEl);

  const stageWrap = document.createElement('div');
  stageWrap.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#09090B;font-family:"Instrument Sans","Helvetica Neue",sans-serif;color:#E4E4E7';
  stageWrap.innerHTML = `
    <div id="stage" class="som-stage">
      <svg id="bg-grid" style="position:absolute;left:0;top:0;pointer-events:none" aria-hidden="true">
        <defs><pattern id="som-g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#141418" stroke-width="1"/></pattern></defs>
        <rect id="bg-rect" fill="url(#som-g)"/>
      </svg>
      <svg id="corners" style="position:absolute;left:0;top:0;pointer-events:none" aria-hidden="true">
        <path d="M24 48V24H48" stroke="#3F3F46" stroke-width="1.5" fill="none"/>
        <path id="c-tr" d="M0 24H-24V48" stroke="#3F3F46" stroke-width="1.5" fill="none" style="transform-box:fill-box"/>
        <path id="c-bl" d="M24 0V24H48" stroke="#3F3F46" stroke-width="1.5" fill="none"/>
        <path id="c-br" d="M0 0V24H-24" stroke="#3F3F46" stroke-width="1.5" fill="none" style="transform-box:fill-box"/>
      </svg>
      <div id="scenes" style="position:absolute;left:0;top:0;width:100%;height:100%"></div>
      <div id="player-bar" style="display:none">
        <button id="btn-play" aria-label="Pause intro" title="Play / Pause"><svg id="ico-pause" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 3v10M11 3v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><svg id="ico-play" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:none"><path d="M5 3.5v9l7.5-4.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="currentColor"/></svg></button>
        <button id="btn-replay" aria-label="Replay from start" title="Replay"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 4v5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <span id="timecode">00:00 / 00:24</span>
        <div id="chapters"></div>
      </div>
      <button id="btn-skip" class="som-abs" style="right:32px;top:72px;display:flex;align-items:center;gap:8px;height:44px;padding:0 18px;border-radius:8px;border:1px solid ${COOL};background:${COOL};color:#04141A;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 0 18px rgba(92,225,255,.45)">
        Skip intro
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 5l8 7-8 7M17 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div id="boot-header" class="som-abs som-row" style="left:0;top:0;width:1440px;height:56px;align-items:center;justify-content:space-between;padding:0 32px;background:linear-gradient(#09090B,rgba(9,9,11,.82));border-bottom:1px solid #1A1A1F;z-index:5">
        <span style="display:flex;align-items:baseline;gap:10px">
          <span style="font:800 19px/1 'Big Shoulders Display','Barlow Condensed',sans-serif;letter-spacing:.02em;color:#FAFAFA">RIGFORGE</span>
          <span style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:${COOL};letter-spacing:.03em">// SILICON OS</span>
        </span>
        <span id="boot-status" style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#8A8A93;letter-spacing:.02em;display:flex;align-items:center;gap:8px">
          <span style="width:6px;height:6px;border-radius:3px;background:${COOL};display:block;animation:pulse 1.4s ease-in-out infinite"></span>
          <span id="boot-status-text">Booting up…</span>
        </span>
      </div>
    </div>
  `;
  host.appendChild(stageWrap);

  const q = <T extends Element = Element>(sel: string): T | null => stageWrap.querySelector<T>(sel);

  // ── responsive scale ──────────────────────────────────────
  const W = 1440, H = 810;
  function resize() {
    const sw = window.innerWidth, sh = window.innerHeight;
    const scale = Math.min(sw / W, sh / H);
    const el = q<HTMLElement>('#stage');
    if (!el) return;
    el.style.width = W + 'px'; el.style.height = H + 'px';
    el.style.transform = 'scale(' + scale + ')';
    el.style.transformOrigin = 'top left';
    el.style.position = 'absolute';
    el.style.left = ((sw - W * scale) / 2) + 'px';
    el.style.top = ((sh - H * scale) / 2) + 'px';
    const bg = q('#bg-rect'); bg?.setAttribute('width', String(W)); bg?.setAttribute('height', String(H));
    const s = q('#bg-grid'); s?.setAttribute('width', String(W)); s?.setAttribute('height', String(H));
    const c = q('#corners'); c?.setAttribute('width', String(W)); c?.setAttribute('height', String(H));
    q('#c-tr')?.setAttribute('transform', 'translate(' + W + ',0)');
    q('#c-bl')?.setAttribute('transform', 'translate(0,' + H + ')');
    q('#c-br')?.setAttribute('transform', 'translate(' + W + ',' + H + ')');
  }
  window.addEventListener('resize', resize);
  resize();

  // ── chapters ──────────────────────────────────────────────
  const CHAPTERS = [
    { name: 'Power on', start: 0, end: 4500 },
    { name: 'Assemble', start: 4500, end: 9500 },
    { name: 'Simulate', start: 9500, end: 14000 },
    { name: 'Into the die', start: 14000, end: 19000 },
    { name: 'Silicon OS', start: 19000, end: 24000 }
  ];
  const TOTAL = 24000;

  let t = 0, playing = true, blankUntil = 0, landing = false;
  let reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches; } catch { /* noop */ }
  if (reduced) { t = TOTAL; playing = false; landing = true; }

  const sceneEl = q<HTMLElement>('#scenes')!;
  const tcEl = q<HTMLElement>('#timecode')!;
  const chDiv = q<HTMLElement>('#chapters')!;
  const bootHeaderEl = q<HTMLElement>('#boot-header')!;
  const bootStatusEl = q<HTMLElement>('#boot-status-text')!;
  const icoPause = q<HTMLElement>('#ico-pause')!;
  const icoPlay = q<HTMLElement>('#ico-play')!;

  type ChapterBtn = HTMLButtonElement & { _label: HTMLSpanElement; _fill: HTMLSpanElement; _idx: number };
  const chBtns: ChapterBtn[] = [];
  CHAPTERS.forEach((c, i) => {
    const wrap = document.createElement('button') as ChapterBtn;
    wrap.style.cssText = 'flex-grow:' + ((c.end - c.start) / 1000) + ';flex-basis:0;min-height:44px;padding:6px 0;border:0;background:transparent;display:flex;flex-direction:column;justify-content:center;gap:8px;text-align:left;cursor:pointer';
    const label = document.createElement('span');
    label.style.cssText = 'font-size:13px;color:#8A8A93';
    label.textContent = c.name;
    const track = document.createElement('span');
    track.style.cssText = 'display:block;width:100%;height:3px;border-radius:2px;background:#26262C;overflow:hidden';
    const fill = document.createElement('span');
    fill.style.cssText = 'display:block;width:0%;height:100%;background:' + COOL + ';transition:width .1s linear';
    track.appendChild(fill);
    wrap.appendChild(label);
    wrap.appendChild(track);
    wrap.addEventListener('click', () => jump(c.start));
    wrap._label = label; wrap._fill = fill; wrap._idx = i;
    chDiv.appendChild(wrap);
    chBtns.push(wrap);
  });

  function currentChapter() {
    for (let i = 0; i < CHAPTERS.length; i++) {
      if (t >= CHAPTERS[i].start && t < CHAPTERS[i].end) return i;
    }
    return -1;
  }
  function fmt(ms: number) { const s = Math.floor(ms / 1000); return '00:' + (s < 10 ? '0' : '') + s; }
  function jump(to: number) {
    blankUntil = Date.now() + 60;
    sceneEl.innerHTML = '';
    t = to; playing = (to < TOTAL);
    if (to >= TOTAL) { showLanding(); }
  }

  let rafId = 0;
  let lastTime = performance.now();
  function loop(now: number) {
    const dt = Math.min(now - lastTime, 100); lastTime = now;
    if (playing && Date.now() > blankUntil) {
      t = Math.min(t + dt, TOTAL);
      if (t >= TOTAL) { playing = false; t = TOTAL; showLanding(); }
    }
    update();
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  let lastScene = -99;
  function update() {
    if (landing) return;
    const idx = currentChapter();
    tcEl.textContent = fmt(t) + ' / ' + fmt(TOTAL);
    chBtns.forEach((b) => {
      const c = CHAPTERS[b._idx];
      const p = Math.max(0, Math.min(1, (t - c.start) / (c.end - c.start)));
      b._fill.style.width = (p * 100).toFixed(1) + '%';
      b._label.style.color = b._idx === idx ? '#FAFAFA' : '#8A8A93';
    });
    if (playing) { icoPause.style.display = ''; icoPlay.style.display = 'none'; }
    else { icoPause.style.display = 'none'; icoPlay.style.display = ''; }
    if (idx >= 0 && bootStatusEl.textContent !== CHAPTERS[idx].name) {
      bootStatusEl.textContent = CHAPTERS[idx].name + '…';
    }
    if (idx !== lastScene) { lastScene = idx; buildScene(idx); }
    const stg = q<HTMLElement>('#stage');
    if (stg) {
      if (!playing && !landing) stg.classList.add('paused');
      else stg.classList.remove('paused');
    }
  }

  function a(delay: number, dur: number, name: string, extra?: string) {
    return 'animation:' + name + ' ' + (dur / 1000) + 's ease ' + (delay / 1000) + 's both' + (extra ? ';' + extra : '');
  }
  function an(delay: number, dur: number, name: string, extra?: string) {
    return 'animation:' + name + ' ' + (dur / 1000) + 's cubic-bezier(.2,.8,.2,1) ' + (delay / 1000) + 's both' + (extra ? ';' + extra : '');
  }
  function buildScene(idx: number) {
    sceneEl.innerHTML = '';
    if (idx < 0) return;
    if (idx === 0) buildS0();
    if (idx === 1) buildS1();
    if (idx === 2) buildS2();
    if (idx === 3) buildS3();
    if (idx === 4) buildS4();
  }

  // ── Scene 0: Power-on / POST ──────────────────────────────
  function buildS0() {
    const h = document.createElement('div');
    h.style.cssText = 'position:absolute;left:0;top:0;width:1440px;height:810px';
    const line = document.createElement('div');
    line.style.cssText = 'position:absolute;left:0;top:404px;width:1440px;height:2px;background:' + COOL + ';box-shadow:0 0 28px ' + COOL + ';transform-origin:center;animation:grow .55s cubic-bezier(.2,.8,.2,1) .15s both,out .5s ease .8s forwards';
    h.appendChild(line);
    const panel = document.createElement('div');
    panel.style.cssText = 'position:absolute;left:400px;top:196px;width:640px;display:flex;flex-direction:column;gap:16px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:16px;color:#E4E4E7;' + a(900, 400, 'fade');
    const rows = [
      { k: 'CPU', v: 'Ryzen 7 7800X3D', delay: 1250 },
      { k: 'GPU', v: 'RTX 4070 SUPER', delay: 1550 },
      { k: 'MEMORY', v: '32 GB DDR5', delay: 1850 },
      { k: 'STORAGE', v: '2 TB NVMe', delay: 2150 },
      { k: 'PSU', v: '850 W', delay: 2450 }
    ];
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;padding-bottom:14px;border-bottom:1px solid #27272A';
    header.innerHTML = '<span style="font-weight:700;color:' + COOL + '">SILICON OS</span><span style="font-size:13px;color:#8A8A93">power-on self test</span>';
    panel.appendChild(header);
    rows.forEach((r) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:baseline;gap:16px;' + a(r.delay, 450, 'type');
      row.innerHTML = '<span style="width:88px;color:#8A8A93">' + r.k + '</span><span>' + r.v + '</span><span style="flex-grow:1;border-bottom:1px dotted #3F3F46;transform:translateY(-4px)"></span><span style="font-weight:700;color:' + COOL + '">OK</span>';
      panel.appendChild(row);
    });
    const prog = document.createElement('div');
    prog.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding-top:14px;border-top:1px solid #27272A;' + a(2800, 300, 'fade');
    prog.innerHTML = '<div style="display:flex;justify-content:space-between"><span>Building digital twin</span><span style="color:#8A8A93">my-rig</span></div><div style="height:6px;background:#18181B;border-radius:3px;overflow:hidden"><div style="width:100%;height:100%;background:' + COOL + ';transform-origin:left;' + a(2900, 1100, 'grow') + '"></div></div>';
    panel.appendChild(prog);
    const cur = document.createElement('div');
    cur.style.cssText = 'display:flex;align-items:center;gap:8px;' + a(4000, 200, 'fade');
    cur.innerHTML = '<span style="color:' + COOL + '">Ready</span><span style="display:block;width:10px;height:18px;background:' + COOL + ';animation:blink 1s steps(1) infinite"></span>';
    panel.appendChild(cur);
    h.appendChild(panel);
    sceneEl.appendChild(h);
  }

  // ── Scene 1: 3-D Case + Compatibility ─────────────────────
  function buildS1() {
    const h = document.createElement('div');
    h.style.cssText = 'position:absolute;left:0;top:0;width:1440px;height:810px';
    h.appendChild(makeCaseSVG(460, 92));
    const scan = document.createElement('div');
    scan.style.cssText = 'position:absolute;left:444px;top:92px;width:552px;height:2px;background:' + COOL + ';box-shadow:0 0 20px ' + COOL + ';' + a(1600, 1500, 'scan-y');
    h.appendChild(scan);
    const left = document.createElement('div');
    left.style.cssText = 'position:absolute;left:64px;top:128px;width:330px;display:flex;flex-direction:column;gap:18px;' + a(1200, 500, 'fade');
    left.innerHTML = '<div class="som-col" style="gap:4px"><span style="font-size:17px;font-weight:600;color:#FAFAFA">Compatibility and clearance</span><span style="font-size:14px;line-height:1.45;color:#8A8A93">Physical and electrical checks, run on the whole machine</span></div>';
    const checks = [
      { label: 'CPU ↔ motherboard', sub: 'Socket AM5', checkAt: 2100 },
      { label: 'RAM ↔ CPU cooler', sub: 'Height clearance', checkAt: 2400 },
      { label: 'GPU ↔ case', sub: 'Length and thickness', checkAt: 2700 },
      { label: 'PSU ↔ case', sub: 'Shroud and cable space', checkAt: 3000 },
      { label: 'System ↔ PSU', sub: '850 W capacity', checkAt: 3300 }
    ];
    const list = document.createElement('div'); list.className = 'som-col';
    checks.forEach((c, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid #1F1F24;' + a(1600 + i * 300, 300, 'fade');
      row.innerHTML = '<div class="som-col" style="gap:3px"><span style="font-size:15px;color:#E4E4E7">' + c.label + '</span><span style="font-size:13px;color:#8A8A93">' + c.sub + '</span></div>'
        + '<div style="position:relative;width:72px;height:24px">'
        + '<span style="position:absolute;right:0;top:3px;font-size:13px;color:#8A8A93;' + a(1600 + i * 300, 300, 'fade') + ';' + a(c.checkAt, 150, 'out') + '">Checking</span>'
        + '<span style="position:absolute;right:0;top:0;height:24px;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:' + COOL + ';' + a(c.checkAt, 200, 'fade') + '"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Pass</span>'
        + '</div>';
      list.appendChild(row);
    });
    left.appendChild(list);
    h.appendChild(left);
    const right = document.createElement('div');
    right.style.cssText = 'position:absolute;left:1048px;top:128px;width:328px;display:flex;flex-direction:column;gap:18px;' + a(1400, 500, 'fade');
    right.innerHTML = '<div class="som-col" style="gap:4px"><span style="font-size:17px;font-weight:600;color:#FAFAFA">Compatibility graph</span><span style="font-size:14px;line-height:1.45;color:#8A8A93">Every link between parts, not a checklist</span></div>'
      + graphSVG()
      + '<div class="som-row" style="gap:18px;font-size:13px;color:#A1A1AA;' + a(3100, 400, 'fade') + '"><span class="som-row" style="align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:4px;background:' + COOL + ';display:block"></span>Compatible</span><span class="som-row" style="align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:4px;background:#F5C542;display:block"></span>Conditional</span><span class="som-row" style="align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:4px;background:#D9434B;display:block"></span>Conflict</span></div>';
    h.appendChild(right);
    const tag = document.createElement('div');
    tag.style.cssText = 'position:absolute;left:220px;top:672px;width:1000px;text-align:center;font-size:22px;line-height:1.4;color:#E4E4E7;' + a(500, 600, 'fade');
    tag.textContent = 'Not just "will these parts fit?" but "what happens when they become one computer?"';
    h.appendChild(tag);
    sceneEl.appendChild(h);
  }

  function graphSVG() {
    return '<svg width="320" height="300" viewBox="0 0 320 300" fill="none" aria-hidden="true">'
      + '<path d="M110 37H180" stroke="' + COOL + '" stroke-width="1.4" style="stroke-dasharray:400;' + a(1800, 600, 'dash') + '"/>'
      + '<path d="M60 54V117H180" stroke="' + COOL + '" stroke-width="1.4" style="stroke-dasharray:400;' + a(2100, 700, 'dash') + '"/>'
      + '<path d="M60 54V197H180" stroke="' + COOL + '" stroke-width="1.4" style="stroke-dasharray:400;' + a(2400, 800, 'dash') + '"/>'
      + '<path d="M245 214V256" stroke="' + COOL + '" stroke-width="1.4" style="stroke-dasharray:400;' + a(2700, 500, 'dash') + '"/>'
      + '<g fill="#8A8A93" style="font:500 12px \'Instrument Sans\',sans-serif;' + a(2200, 400, 'fade') + '"><text x="145" y="29" text-anchor="middle">socket</text><text x="120" y="109" text-anchor="middle">memory</text><text x="120" y="189" text-anchor="middle">PCIe</text><text x="253" y="240">power</text></g>'
      + node(10, 20, 100, 34, 'CPU', 1700) + node(180, 20, 130, 34, 'Motherboard', 1950) + node(180, 100, 130, 34, 'Memory', 2250) + node(180, 180, 130, 34, 'GPU', 2550) + node(180, 256, 130, 34, 'PSU', 2850)
      + '</svg>';
  }
  function node(x: number, y: number, w: number, h: number, label: string, delay: number) {
    return '<g style="' + a(delay, 300, 'fade') + '">'
      + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="#111114" stroke="' + COOL + '" stroke-width="1.4"/>'
      + '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 5) + '" text-anchor="middle" fill="#FAFAFA" style="font:600 13px \'Instrument Sans\',sans-serif">' + label + '</text>'
      + '</g>';
  }

  // ── Scene 2: Thermal ──────────────────────────────────────
  function buildS2() {
    const h = document.createElement('div');
    h.style.cssText = 'position:absolute;left:0;top:0;width:1440px;height:810px';
    h.appendChild(makeCaseSVG(460, 92));
    h.appendChild(makeHeatOverlay());
    const left = document.createElement('div');
    left.style.cssText = 'position:absolute;left:64px;top:128px;width:330px;display:flex;flex-direction:column;gap:22px;' + a(300, 500, 'fade');
    left.innerHTML = '<div class="som-col" style="gap:4px"><span style="font-size:17px;font-weight:600;color:#FAFAFA">Thermal simulation</span><span style="font-size:14px;line-height:1.45;color:#8A8A93">Ambient, cooling, fan curves and load, modelled together</span></div>'
      + '<div class="som-col" style="gap:10px"><span style="font-size:14px;color:#8A8A93">Room ambient</span>'
      + '<div style="position:relative;height:104px">'
      + '<span style="position:absolute;left:0;top:0;font:800 112px/0.92 \'Big Shoulders Display\',\'Barlow Condensed\',sans-serif;color:#FAFAFA;animation:win 1.4s ease .2s both">25°C</span>'
      + '<span style="position:absolute;left:0;top:0;font:800 112px/0.92 \'Big Shoulders Display\',\'Barlow Condensed\',sans-serif;color:#FAFAFA;animation:win 1.4s ease 1.6s both">35°C</span>'
      + '<span style="position:absolute;left:0;top:0;font:800 112px/0.92 \'Big Shoulders Display\',\'Barlow Condensed\',sans-serif;color:' + HEAT + ';' + a(3000, 300, 'fade') + '">45°C</span>'
      + '</div>'
      + '<div style="height:6px;border-radius:3px;background:linear-gradient(90deg,' + COOL + ',' + HEAT + ',#FFE7B0)"></div>'
      + '<div class="som-row" style="justify-content:space-between;font-size:13px;color:#8A8A93"><span>Cool</span><span>Hot</span></div>'
      + '</div>'
      + '<div class="som-col" style="gap:6px;padding-top:18px;border-top:1px solid #1F1F24"><span style="font-size:14px;color:#8A8A93">Airflow</span><span style="font-size:17px;color:#E4E4E7">3 intake fans, 1 exhaust</span><span style="font-size:15px;font-weight:600;color:' + COOL + '">Positive pressure</span></div>';
    h.appendChild(left);
    const right = document.createElement('div');
    right.style.cssText = 'position:absolute;left:1048px;top:128px;width:328px;display:flex;flex-direction:column;gap:20px;' + a(500, 500, 'fade');
    const bars = [
      { label: 'CPU hotspot', pct: 82 },
      { label: 'GPU hotspot', pct: 74 },
      { label: 'VRM', pct: 58 },
      { label: 'NVMe SSD', pct: 46 },
      { label: 'Memory', pct: 34 }
    ];
    let barHTML = '<div class="som-col" style="gap:4px"><span style="font-size:17px;font-weight:600;color:#FAFAFA">Thermal camera</span><span style="font-size:14px;line-height:1.45;color:#8A8A93">Where the heat collects as the room warms up</span></div><div class="som-col" style="gap:16px">';
    bars.forEach((b) => {
      barHTML += '<div class="som-col" style="gap:8px"><span style="font-size:15px;color:#E4E4E7">' + b.label + '</span>'
        + '<div style="height:6px;background:#1C1C21;border-radius:3px;overflow:hidden"><div style="width:' + b.pct + '%;height:100%;border-radius:3px;background:linear-gradient(90deg,' + COOL + ',' + HEAT + ');transform-origin:left;animation:heatbar 4.2s ease .4s both"></div></div>'
        + '</div>';
    });
    barHTML += '</div><span style="font-size:13px;line-height:1.5;color:#8A8A93;padding-top:14px;border-top:1px solid #1F1F24">Simulated, not measured. Real benchmark data is always labelled as a measurement.</span>';
    right.innerHTML = barHTML;
    h.appendChild(right);
    const tag = document.createElement('div');
    tag.style.cssText = 'position:absolute;left:220px;top:672px;width:1000px;text-align:center;font-size:22px;line-height:1.4;color:#E4E4E7;' + a(600, 600, 'fade');
    tag.textContent = 'Simulate the machine: heat, airflow and power, before you spend a single rupee.';
    h.appendChild(tag);
    sceneEl.appendChild(h);
  }

  // ── Scene 3: Die map ──────────────────────────────────────
  function buildS3() {
    const h = document.createElement('div');
    h.style.cssText = 'position:absolute;left:0;top:0;width:1440px;height:810px';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;left:400px;top:120px;width:640px;height:440px;' + a(1200, 1000, 'die');
    wrap.innerHTML = dieSVG();
    h.appendChild(wrap);
    const left = document.createElement('div');
    left.style.cssText = 'position:absolute;left:64px;top:150px;width:290px;display:flex;flex-direction:column;gap:20px;' + a(2100, 500, 'fade');
    left.innerHTML = '<div class="som-col" style="gap:6px"><span style="font-size:14px;color:#8A8A93">Silicon anatomy</span>'
      + '<span style="font:800 40px/0.95 \'Big Shoulders Display\',\'Barlow Condensed\',sans-serif;color:#FAFAFA">RYZEN 7<br>7800X3D</span>'
      + '<span style="font-size:14px;line-height:1.45;color:#A1A1AA">One compute die, one I/O die, and 3D V-Cache stacked on top</span></div>'
      + '<div class="som-col" style="gap:10px;padding:18px;background:#111114;border:1px solid #27272A;border-radius:6px">'
      + '<div class="som-row" style="align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:4px;background:' + HEAT + ';display:block"></span><span style="font-size:14px;font-weight:600;color:#FAFAFA">Explain this: L3 cache</span></div>'
      + '<span style="font-size:15px;line-height:1.5;color:#D4D4D8">A large cache the cores share, so they reach for slower system memory less often.</span>'
      + '<span style="font-size:14px;line-height:1.5;color:#8A8A93">More isn\'t automatically faster. Latency, clocks and the workload all matter.</span>'
      + '</div>';
    h.appendChild(left);
    const right = document.createElement('div');
    right.style.cssText = 'position:absolute;left:1096px;top:150px;width:280px;display:flex;flex-direction:column;gap:14px;' + a(2300, 500, 'fade');
    const nodes = ['180 nm', '130 nm', '90 nm', '65 nm', '45 nm', '32 nm', '22 nm', '14 nm', '7 nm', '5 nm', '3 nm'];
    const tickerHTML = nodes.map((n, i) => '<span style="height:40px;font:800 30px/40px \'Big Shoulders Display\',\'Barlow Condensed\',sans-serif;color:' + (i === nodes.length - 1 ? '#FAFAFA' : '#E4E4E7') + '">' + n + '</span>').join('');
    right.innerHTML = '<span style="font-size:14px;color:#8A8A93">Process node explorer</span>'
      + '<div style="position:relative;height:200px;overflow:hidden;border-top:1px solid #1F1F24;border-bottom:1px solid #1F1F24">'
      + '<div style="position:absolute;left:0;right:0;top:80px;height:40px;background:' + COOL + '14;border-top:1px solid ' + COOL + ';border-bottom:1px solid ' + COOL + '"></div>'
      + '<div style="position:absolute;left:16px;top:80px;display:flex;flex-direction:column;animation:ticker 2.2s cubic-bezier(.65,0,.25,1) 2.4s both">' + tickerHTML + '</div>'
      + '<div style="position:absolute;left:0;right:0;top:0;height:56px;background:linear-gradient(#09090B,rgba(9,9,11,0))"></div>'
      + '<div style="position:absolute;left:0;right:0;bottom:0;height:56px;background:linear-gradient(rgba(9,9,11,0),#09090B)"></div>'
      + '</div>'
      + '<span style="font-size:14px;line-height:1.5;color:#A1A1AA">Two decades of shrinking transistors, and what each step made possible.</span>';
    h.appendChild(right);
    const tag = document.createElement('div');
    tag.style.cssText = 'position:absolute;left:220px;top:672px;width:1000px;text-align:center;font-size:22px;line-height:1.4;color:#E4E4E7;' + a(2400, 600, 'fade');
    tag.textContent = 'Understand the silicon, from the case all the way down to the die.';
    h.appendChild(tag);
    sceneEl.appendChild(h);
  }

  // ── Scene 4: wordmark reveal ──────────────────────────────
  function buildS4() {
    const h = document.createElement('div');
    h.style.cssText = 'position:absolute;left:0;top:0;width:1440px;height:810px';
    const letters = 'SILICON'.split('').concat(['O', 'S']);
    const wrapper = document.createElement('div');
    wrapper.setAttribute('aria-label', 'Silicon OS');
    wrapper.style.cssText = 'position:absolute;left:0;top:190px;width:1440px;display:flex;justify-content:center;align-items:flex-end';
    const hollowIdx = [7, 8];
    letters.forEach((l, i) => {
      const spacer = i === 6 ? ' margin-right:56px;' : '';
      const hollow = hollowIdx.includes(i);
      const span = document.createElement('span');
      span.style.cssText = 'display:block;overflow:hidden;height:236px;' + spacer;
      const inner = document.createElement('span');
      inner.style.cssText = 'display:block;font:900 260px/236px \'Big Shoulders Display\',\'Barlow Condensed\',sans-serif;' + (hollow ? 'color:transparent;-webkit-text-stroke:3px #FAFAFA' : 'color:#FAFAFA') + ';animation:letter .9s cubic-bezier(.2,.9,.1,1) ' + (0.2 + i * 0.06) + 's both';
      inner.textContent = l;
      span.appendChild(inner);
      wrapper.appendChild(span);
    });
    h.appendChild(wrapper);
    const rule = document.createElement('div');
    rule.style.cssText = 'position:absolute;left:340px;top:452px;width:760px;height:1px;background:#3F3F46;transform-origin:center;animation:grow .8s cubic-bezier(.2,.8,.2,1) 1s both';
    h.appendChild(rule);
    const sub = document.createElement('div');
    sub.style.cssText = 'position:absolute;left:0;top:476px;width:1440px;text-align:center;font-size:22px;color:#A1A1AA;' + a(1100, 600, 'fade');
    sub.textContent = 'PC hardware intelligence, simulation and digital twin platform';
    h.appendChild(sub);
    const steps = ['Design', 'Simulate', 'Analyze', 'Understand', 'Diagnose', 'Upgrade', 'Share'];
    const flow = document.createElement('div');
    flow.style.cssText = 'position:absolute;left:0;top:548px;width:1440px;display:flex;justify-content:center;align-items:center;gap:14px;font-size:17px;font-weight:500;color:#FAFAFA';
    steps.forEach((s, i) => {
      const sp = document.createElement('span');
      sp.style.cssText = (i === steps.length - 1 ? 'color:' + COOL : '') + ';animation:lite .4s ease ' + (1.5 + i * 0.3) + 's both';
      sp.textContent = s;
      flow.appendChild(sp);
      if (i < steps.length - 1) {
        const arrow = document.createElement('span');
        arrow.style.cssText = 'color:#52525B;' + a(1650 + i * 300, 300, 'fade');
        arrow.textContent = '→';
        flow.appendChild(arrow);
      }
    });
    h.appendChild(flow);
    sceneEl.appendChild(h);
  }

  // ── Shared: case SVG ──────────────────────────────────────
  function makeCaseSVG(left: number, top: number) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '520'); svg.setAttribute('height', '560');
    svg.setAttribute('viewBox', '0 0 520 560'); svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;left:' + left + 'px;top:' + top + 'px;overflow:visible';
    svg.innerHTML = '<defs>'
      + '<pattern id="fins" width="6" height="5" patternUnits="userSpaceOnUse"><path d="M0 2.5H6" stroke="#3F3F46" stroke-width="1"/></pattern>'
      + '<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke="#34343B" stroke-width="1"/></pattern>'
      + '</defs>'
      + '<rect x="4" y="4" width="512" height="552" rx="16" stroke="#52525B" stroke-width="2" style="stroke-dasharray:2200;' + a(0, 1400, 'draw') + '"/>'
      + '<rect x="16" y="16" width="488" height="528" rx="10" stroke="#232328" stroke-width="1" style="' + a(700, 600, 'fade') + '"/>'
      + '<path d="M509 34V526" stroke="#3F3F46" stroke-width="2" stroke-dasharray="2 5" style="' + a(800, 600, 'fade') + '"/>'
      + '<g style="' + an(250, 1000, 'in-l') + '">'
      + '<rect x="60" y="36" width="262" height="340" rx="4" fill="#0E0E11" stroke="#52525B" stroke-width="1.5"/>'
      + '<path d="M76 52H240V72H100V180H76Z" fill="url(#fins)" stroke="#52525B" stroke-width="1"/>'
      + '<rect x="248" y="54" width="12" height="160" rx="2" stroke="#34343B" stroke-width="1"/>'
      + '<rect x="262" y="54" width="12" height="160" rx="2" stroke="#34343B" stroke-width="1"/>'
      + '<rect x="276" y="54" width="12" height="160" rx="2" stroke="#34343B" stroke-width="1"/>'
      + '<rect x="290" y="54" width="12" height="160" rx="2" stroke="#34343B" stroke-width="1"/>'
      + '</g>'
      + '<g style="' + an(650, 1000, 'in-t') + '">'
      + '<rect x="106" y="70" width="112" height="132" rx="4" fill="url(#fins)" stroke="' + COOL + '" stroke-width="1.6"/>'
      + '<path d="M128 76V196M146 76V196M178 76V196M196 76V196" stroke="' + COOL + '" stroke-width="1" stroke-opacity=".45"/>'
      + '<rect x="220" y="70" width="18" height="132" rx="3" fill="#0E0E11" stroke="' + COOL + '" stroke-width="1.2" stroke-opacity=".8"/>'
      + '</g>'
      + '<g style="' + an(850, 900, 'in-t') + '">'
      + '<rect x="264" y="60" width="8" height="150" rx="1.5" fill="#15151A" stroke="' + COOL + '" stroke-width="1.2"/>'
      + '<rect x="292" y="60" width="8" height="150" rx="1.5" fill="#15151A" stroke="' + COOL + '" stroke-width="1.2"/>'
      + '</g>'
      + '<g style="' + an(1150, 800, 'in-l') + '">'
      + '<rect x="112" y="210" width="100" height="12" rx="2" fill="#15151A" stroke="' + COOL + '" stroke-width="1.2"/>'
      + '<circle cx="206" cy="216" r="2" fill="' + COOL + '"/>'
      + '</g>'
      + '<g style="' + an(1000, 1100, 'in-r') + '">'
      + '<rect x="64" y="240" width="376" height="68" rx="8" fill="#101014" stroke="' + COOL + '" stroke-width="1.6"/>'
      + '<path d="M76 252H428" stroke="#26262C" stroke-width="6" stroke-linecap="round"/>'
      + '<path d="M96 272H408M96 290H408" stroke="#26262C" stroke-width="1"/>'
      + '</g>'
      + '<g style="' + an(500, 900, 'in-l') + '">'
      + '<rect x="20" y="56" width="22" height="124" rx="3" fill="url(#hatch)" stroke="#71717A" stroke-width="1.5"/>'
      + '</g>'
      + '<g style="' + an(500, 900, 'in-r') + '">'
      + '<rect x="478" y="40" width="22" height="124" rx="3" fill="url(#hatch)" stroke="#71717A" stroke-width="1.5"/>'
      + '<rect x="478" y="172" width="22" height="124" rx="3" fill="url(#hatch)" stroke="#71717A" stroke-width="1.5"/>'
      + '<rect x="478" y="304" width="22" height="124" rx="3" fill="url(#hatch)" stroke="#71717A" stroke-width="1.5"/>'
      + '</g>'
      + '<g style="' + an(400, 1000, 'in-b') + '">'
      + '<rect x="16" y="452" width="488" height="92" rx="8" fill="#0C0C0F" stroke="#52525B" stroke-width="1.5"/>'
      + '<rect x="30" y="466" width="176" height="64" rx="5" fill="url(#hatch)" stroke="' + COOL + '" stroke-width="1.4"/>'
      + '</g>';
    return svg;
  }

  function makeHeatOverlay() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '520'); svg.setAttribute('height', '560');
    svg.setAttribute('viewBox', '0 0 520 560'); svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;left:460px;top:92px;overflow:visible;mix-blend-mode:screen;animation:heatup 4.2s ease .2s both';
    svg.innerHTML = '<defs>'
      + '<radialGradient id="hCore"><stop offset="0" stop-color="#FFE7B0" stop-opacity=".9"/><stop offset=".4" stop-color="' + HEAT + '" stop-opacity=".6"/><stop offset="1" stop-color="' + HEAT + '" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="hSoft"><stop offset="0" stop-color="' + HEAT + '" stop-opacity=".55"/><stop offset="1" stop-color="' + HEAT + '" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="cSoft"><stop offset="0" stop-color="' + COOL + '" stop-opacity=".3"/><stop offset="1" stop-color="' + COOL + '" stop-opacity="0"/></radialGradient>'
      + '</defs>'
      + '<ellipse cx="490" cy="236" rx="46" ry="210" fill="url(#cSoft)"/>'
      + '<ellipse cx="118" cy="498" rx="120" ry="44" fill="url(#hSoft)" opacity=".55"/>'
      + '<circle cx="88" cy="112" r="48" fill="url(#hSoft)"/>'
      + '<circle cx="162" cy="216" r="38" fill="url(#hSoft)"/>'
      + '<g style="animation:pulse 2.6s ease-in-out infinite"><circle cx="162" cy="136" r="96" fill="url(#hCore)"/><ellipse cx="240" cy="274" rx="196" ry="64" fill="url(#hCore)"/></g>'
      + '<g stroke="' + COOL + '" stroke-width="1.6" stroke-linecap="round" style="stroke-dasharray:8 24;animation:flow 1.1s linear infinite">'
      + '<path d="M474 96C400 96 330 62 290 60S120 90 48 104"/>'
      + '<path d="M474 150C400 150 300 146 244 138S120 126 48 126"/>'
      + '<path d="M474 232C420 232 380 218 330 216S200 206 150 196 82 164 48 148"/>'
      + '<path d="M474 330C430 330 400 322 350 322S160 326 66 318"/>'
      + '<path d="M474 404C420 404 376 396 300 384S200 364 160 330"/>'
      + '</g>';
    return svg;
  }

  function dieSVG() {
    const c = COOL, hc = HEAT;
    return '<svg width="640" height="440" viewBox="0 0 640 440" fill="none" aria-hidden="true" style="overflow:visible">'
      + '<defs><pattern id="cell" width="8" height="8" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="6" height="6" stroke="#232329" stroke-width="1"/></pattern></defs>'
      + '<rect x="8" y="8" width="624" height="424" rx="20" fill="#0C0C0F" stroke="#52525B" stroke-width="1.5"/>'
      + '<text x="56" y="70" fill="' + c + '" style="font:600 13px \'Instrument Sans\',sans-serif">Compute die (CCD)</text>'
      + '<rect x="56" y="82" width="238" height="276" rx="8" fill="#111114" stroke="' + c + '" stroke-width="1.6"/>'
      + '<rect x="138" y="96" width="74" height="248" rx="4" fill="url(#cell)" stroke="#3F3F46" stroke-width="1"/>'
      + '<text x="175" y="214" text-anchor="middle" fill="#D4D4D8" style="font:600 13px \'Instrument Sans\',sans-serif">L3</text>'
      + '<text x="175" y="232" text-anchor="middle" fill="#8A8A93" style="font:500 12px \'Instrument Sans\',sans-serif">cache</text>'
      + coreRect(70, 96, 'C0', 1900) + coreRect(70, 158, 'C1', 2000) + coreRect(70, 220, 'C2', 2100) + coreRect(70, 282, 'C3', 2200)
      + coreRect(222, 96, 'C4', 2300) + coreRect(222, 158, 'C5', 2400) + coreRect(222, 220, 'C6', 2500) + coreRect(222, 282, 'C7', 2600)
      + '<text x="340" y="48" fill="#D4D4D8" style="font:600 13px \'Instrument Sans\',sans-serif">I/O die</text>'
      + '<rect x="340" y="58" width="252" height="322" rx="8" fill="#111114" stroke="#71717A" stroke-width="1.4"/>'
      + '<g stroke="#3F3F46" stroke-width="1" style="' + a(2200, 400, 'fade') + '">'
      + '<rect x="356" y="74" width="220" height="60" rx="4"/><rect x="356" y="146" width="104" height="94" rx="4"/>'
      + '<rect x="472" y="146" width="104" height="94" rx="4"/><rect x="356" y="252" width="220" height="52" rx="4"/>'
      + '<rect x="356" y="316" width="220" height="48" rx="4"/></g>'
      + '<g fill="#D4D4D8" style="font:500 12px \'Instrument Sans\',sans-serif;' + a(2350, 400, 'fade') + '">'
      + '<text x="368" y="96">DDR5 memory controller</text><text x="368" y="168">PCIe 5.0</text>'
      + '<text x="484" y="168">USB and I/O</text><text x="368" y="274">Integrated graphics</text>'
      + '<text x="368" y="338">Infinity Fabric</text></g>'
      + '<g stroke="' + c + '" stroke-width="1.4" style="stroke-dasharray:4 12;animation:flow .9s linear infinite;' + a(2400, 400, 'fade') + '">'
      + '<path d="M294 180H340M294 220H340M294 260H340"/></g>'
      + '<g style="' + a(2700, 500, 'fade') + '">'
      + '<rect x="132" y="90" width="86" height="260" rx="6" stroke="' + hc + '" stroke-width="1.4" stroke-dasharray="5 4" fill="' + hc + '" fill-opacity=".07"/>'
      + '<text x="56" y="386" fill="' + hc + '" style="font:600 13px \'Instrument Sans\',sans-serif">3D V-Cache, stacked on the L3</text>'
      + '<path d="M132 240H-46" stroke="' + hc + '" stroke-width="1.2" style="stroke-dasharray:400;' + a(2900, 700, 'dash') + '"/>'
      + '<circle cx="132" cy="240" r="4" fill="' + hc + '"/></g>'
      + '<rect x="8" y="8" width="3" height="424" fill="' + c + '" style="' + a(1600, 2000, 'scan') + '"/>'
      + '</svg>';
  }
  function coreRect(x: number, y: number, label: string, delay: number) {
    return '<rect x="' + x + '" y="' + y + '" width="58" height="58" rx="4" fill="#0E0E11" stroke="#3F3F46" stroke-width="1"/>'
      + '<rect x="' + x + '" y="' + y + '" width="58" height="58" rx="4" fill="' + COOL + '" style="animation:core 1.1s ease ' + (delay / 1000) + 's both"/>'
      + '<text x="' + (x + 8) + '" y="' + (y + 18) + '" fill="#E4E4E7" style="font:600 11px \'JetBrains Mono\',monospace">' + label + '</text>';
  }

  // ── Landing page ──────────────────────────────────────────
  function showLanding() {
    landing = true;
    (q<HTMLElement>('#btn-skip'))!.style.display = 'none';
    bootHeaderEl.style.display = 'none';
    sceneEl.innerHTML = '';
    const h = document.createElement('div');
    h.style.cssText = 'position:absolute;left:0;top:0;width:1440px;height:810px;animation:fade .7s ease both';
    h.innerHTML = navHTML() + rigCard() + heroText() + ctaButtons() + taglineBar();
    h.appendChild(caseInLanding());
    sceneEl.appendChild(h);
  }

  function navHTML() {
    return '<div class="som-row abs" style="align-items:center;justify-content:space-between;left:0;top:0;width:1440px;height:72px;padding:0 64px;border-bottom:1px solid #1A1A1F;background:#09090B;position:absolute">'
      + '<span aria-label="Silicon OS home" style="display:flex;align-items:center;gap:12px;text-decoration:none;cursor:default">'
      + '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="6" y="6" width="16" height="16" rx="3" stroke="' + COOL + '" stroke-width="1.6"/><rect x="10.5" y="10.5" width="7" height="7" rx="1" fill="' + COOL + '"/><path d="M10 2v4M14 2v4M18 2v4M10 22v4M14 22v4M18 22v4M2 10h4M2 14h4M2 18h4M22 10h4M22 14h4M22 18h4" stroke="' + COOL + '" stroke-width="1.4" stroke-linecap="round"/></svg>'
      + '<span style="font:800 24px/1 \'Big Shoulders Display\',\'Barlow Condensed\',sans-serif;letter-spacing:.02em;color:#FAFAFA">SILICON <span style="color:transparent;-webkit-text-stroke:1.5px #FAFAFA">OS</span></span>'
      + '</span>'
      + '<nav aria-label="Main" style="display:flex;gap:32px">'
      + '<button data-tab="intro" class="som-navlink">Workspace</button>'
      + '<button data-tab="digitaltwin" class="som-navlink">Digital twin</button>'
      + '<button data-tab="synergy" class="som-navlink">Simulation labs</button>'
      + '<button data-tab="spatial3d" class="som-navlink">Silicon lab</button>'
      + '<button data-tab="community" class="som-navlink">Gallery</button>'
      + '</nav>'
      + '<div class="som-row" style="align-items:center;gap:8px">'
      + '<button id="btn-replay-landing" style="display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;border:0;border-radius:8px;background:transparent;color:#E4E4E7;font-size:15px;cursor:pointer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 4v5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Replay intro</button>'
      + '<button data-action="overview" style="display:flex;align-items:center;height:44px;padding:0 18px;border:1px solid #2E2E35;border-radius:8px;background:transparent;color:#FAFAFA;font-size:15px;font-weight:500;cursor:pointer">Open workspace</button>'
      + '</div></div>';
  }
  function heroText() {
    const lines = [['BUILD', 'the machine.'], ['SIMULATE', 'the machine.'], ['UNDERSTAND', 'the silicon.'], ['EVOLVE', 'the system.']];
    let out = '<h1 class="som-abs" style="left:64px;top:128px;margin:0;display:grid;grid-template-columns:auto auto;column-gap:22px;align-items:baseline;font-weight:400">';
    lines.forEach((l) => {
      out += '<span style="font:800 86px/0.9 \'Big Shoulders Display\',\'Barlow Condensed\',sans-serif;color:#FAFAFA">' + l[0] + '</span>'
        + '<span style="font-size:26px;color:#A1A1AA">' + l[1] + '</span>';
    });
    return out + '</h1>';
  }
  function ctaButtons() {
    return '<p class="som-abs" style="left:64px;top:470px;width:540px;margin:0;font-size:18px;line-height:1.55;color:#A1A1AA">A browser-based lab for PC builders, gamers, creators and local-AI tinkerers. Assemble in 3D, check every clearance, simulate heat and airflow, estimate FPS, compare Indian prices and plan upgrades, all around one digital twin.</p>'
      + '<div class="som-abs som-row" style="left:64px;top:608px;gap:12px">'
      + '<button data-tab="digitaltwin" style="display:flex;align-items:center;height:52px;padding:0 24px;border:0;border-radius:8px;background:' + COOL + ';color:#04141A;font-size:16px;font-weight:600;cursor:pointer">Create your digital twin</button>'
      + '<button data-tab="community" style="display:flex;align-items:center;height:52px;padding:0 22px;border:1px solid #2E2E35;border-radius:8px;background:transparent;color:#E4E4E7;font-size:16px;cursor:pointer">Browse community builds</button>'
      + '</div>'
      + '<p class="som-abs" style="left:64px;top:682px;margin:0;font-size:14px;color:#8A8A93">Runs in your browser. No account needed for the core tools. Prices in ₹, with GST.</p>';
  }
  const TAGLINE_MAP: Record<string, string> = {
    'My Rig': 'digitaltwin',
    'Silicon Lab': 'spatial3d',
    Games: 'benchmarks',
    Build: 'builder',
    Power: 'cost',
    Thermal: 'synergy',
    Matrix: 'matrix',
    Anatomy: 'anatomy',
    Repair: 'troubleshoot',
    Market: 'catalog',
    Upgrade: 'roi',
    Desk: 'battlestation',
    'AI Lab': 'doctor',
    Challenges: 'challengemode',
    Gallery: 'community'
  };
  function taglineBar() {
    return '<div class="som-abs" style="left:0;top:738px;width:1440px;height:72px;padding:0 64px;display:flex;align-items:center;gap:40px;border-top:1px solid #1A1A1F;background:#09090B">'
      + '<span style="font-size:14px;color:#8A8A93;white-space:nowrap">Inside the workspace</span>'
      + '<div style="flex-grow:1;display:flex;justify-content:space-between">'
      + Object.keys(TAGLINE_MAP).map((m) => '<button data-tab="' + TAGLINE_MAP[m] + '" class="som-navlink" style="color:#D4D4D8;white-space:nowrap">' + m + '</button>').join('')
      + '</div></div>';
  }
  function caseInLanding() {
    const svg = makeCaseSVG(936, 96);
    svg.style.transform = 'scale(0.8)';
    svg.style.transformOrigin = '0 0';
    const ho = makeHeatOverlay();
    ho.style.left = '936px'; ho.style.top = '96px';
    ho.style.transform = 'scale(0.8)'; ho.style.transformOrigin = '0 0';
    const wrap = document.createElement('div');
    wrap.appendChild(svg);
    wrap.appendChild(ho);
    return wrap;
  }
  function rigCard() {
    const bars = [
      { label: 'Performance', pct: 94, val: '94' },
      { label: 'Thermal profile', pct: 87, val: '87' },
      { label: 'Power efficiency', pct: 91, val: '91' },
      { label: 'Upgradeability', pct: 82, val: '82' },
      { label: 'Value', pct: 89, val: '89' }
    ];
    const rows = bars.map((b, i) => '<div class="som-row" style="align-items:center;gap:12px">'
      + '<span style="width:118px;font-size:13px;color:#A1A1AA">' + b.label + '</span>'
      + '<div style="flex-grow:1;height:4px;background:#1C1C21;border-radius:2px;overflow:hidden"><div style="width:' + b.pct + '%;height:100%;background:' + COOL + ';transform-origin:left;animation:grow .9s cubic-bezier(.2,.8,.2,1) ' + (1.6 + i * 0.1) + 's both"></div></div>'
      + '<span style="width:26px;text-align:right;font:800 20px/1 \'Big Shoulders Display\',\'Barlow Condensed\',sans-serif;color:#FAFAFA">' + b.val + '</span>'
      + '</div>').join('');
    return '<div data-tab="digitaltwin" class="som-abs som-col" style="left:800px;top:400px;width:320px;padding:20px;gap:16px;background:#0F0F12;border:1px solid #2A2A30;border-radius:6px;animation:fade .6s ease 1.2s both;cursor:pointer">'
      + '<div class="som-row" style="justify-content:space-between;align-items:center">'
      + '<span style="font:800 30px/1 \'Big Shoulders Display\',\'Barlow Condensed\',sans-serif;color:#FAFAFA">MY RIG</span>'
      + '<span class="som-row" style="align-items:center;gap:8px;font-size:13px;color:#A1A1AA"><span style="width:8px;height:8px;border-radius:4px;background:' + COOL + ';display:block"></span>Twin synced</span>'
      + '</div>'
      + '<div class="som-col" style="gap:2px;font-size:14px;line-height:1.45;color:#A1A1AA"><span>Ryzen 7 7800X3D, RTX 4070 Super</span><span>32 GB DDR5, 2 TB NVMe, 850 W PSU</span></div>'
      + '<div class="som-col" style="gap:10px;padding-top:16px;border-top:1px solid #1F1F24">' + rows + '</div>'
      + '</div>';
  }

  // ── Controls ──────────────────────────────────────────────
  function restart() {
    landing = false;
    (q<HTMLElement>('#btn-skip'))!.style.display = '';
    bootHeaderEl.style.display = '';
    bootStatusEl.textContent = 'Booting up…';
    lastScene = -99;
    jump(0);
    playing = true; lastTime = performance.now();
  }
  const onPlayClick = () => {
    if (t >= TOTAL) return;
    playing = !playing;
    lastTime = performance.now();
  };
  const onSkipClick = () => jump(TOTAL);
  q<HTMLButtonElement>('#btn-play')?.addEventListener('click', onPlayClick);
  q<HTMLButtonElement>('#btn-replay')?.addEventListener('click', restart);
  q<HTMLButtonElement>('#btn-skip')?.addEventListener('click', onSkipClick);

  const onDelegatedClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    if (target.closest('#btn-replay-landing')) { restart(); return; }
    const overviewBtn = target.closest('[data-action="overview"]');
    if (overviewBtn) { nav.goOverview(); return; }
    const tabBtn = target.closest<HTMLElement>('[data-tab]');
    if (tabBtn) {
      const tab = tabBtn.getAttribute('data-tab');
      if (tab) nav.goTab(tab);
    }
  };
  stageWrap.addEventListener('click', onDelegatedClick);

  if (!reduced) { buildScene(0); } else { showLanding(); }

  return () => {
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(rafId);
    stageWrap.removeEventListener('click', onDelegatedClick);
    host.removeChild(stageWrap);
    host.removeChild(styleEl);
  };
}

const INTRO_CSS = `
.som-stage{position:relative;background:#09090B;color:#E4E4E7;overflow:hidden}
.som-stage a{color:${COOL}}
.som-stage a:hover{color:#A8F0FF}
.som-stage button{font-family:inherit}
.som-stage button:focus-visible,.som-stage a:focus-visible{outline:2px solid ${COOL};outline-offset:3px}
.som-stage .hollow{color:transparent;-webkit-text-stroke:3px #FAFAFA}
.som-stage .hollow-sm{color:transparent;-webkit-text-stroke:1.5px #FAFAFA}
.som-stage.paused *{animation-play-state:paused!important}
.som-navlink{background:transparent;border:0;font-size:15px;color:#A1A1AA;cursor:pointer;padding:0}
.som-navlink:hover{color:#FAFAFA}
.som-abs{position:absolute}
.som-col{display:flex;flex-direction:column}
.som-row{display:flex;flex-direction:row}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes out{from{opacity:1}to{opacity:0}}
@keyframes win{0%{opacity:0}12%{opacity:1}85%{opacity:1}100%{opacity:0}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes type{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes draw{from{stroke-dashoffset:2200}to{stroke-dashoffset:0}}
@keyframes dash{from{stroke-dashoffset:400}to{stroke-dashoffset:0}}
@keyframes in-l{from{opacity:0;transform:translateX(-180px)}to{opacity:1;transform:translateX(0)}}
@keyframes in-r{from{opacity:0;transform:translateX(220px)}to{opacity:1;transform:translateX(0)}}
@keyframes in-t{from{opacity:0;transform:translateY(-170px)}to{opacity:1;transform:translateY(0)}}
@keyframes in-b{from{opacity:0;transform:translateY(170px)}to{opacity:1;transform:translateY(0)}}
@keyframes flow{to{stroke-dashoffset:-64}}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes heatup{0%{opacity:.2}33%{opacity:.45}66%{opacity:.75}100%{opacity:1}}
@keyframes heatbar{0%{transform:scaleX(.25)}33%{transform:scaleX(.55)}66%{transform:scaleX(.8)}100%{transform:scaleX(1)}}
@keyframes scan-y{0%{transform:translateY(0);opacity:0}12%{opacity:.9}88%{opacity:.9}100%{transform:translateY(556px);opacity:0}}
@keyframes scan{0%{transform:translateX(0);opacity:0}10%{opacity:.8}90%{opacity:.8}100%{transform:translateX(620px);opacity:0}}
@keyframes die{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
@keyframes core{0%{opacity:0}35%{opacity:.9}100%{opacity:.2}}
@keyframes ticker{from{transform:translateY(0)}to{transform:translateY(-400px)}}
@keyframes letter{from{transform:translateY(105%)}to{transform:translateY(0)}}
@keyframes lite{from{opacity:.16}to{opacity:1}}
@media(prefers-reduced-motion:reduce){.som-stage *{animation-duration:.001s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition:none!important}}
`;
