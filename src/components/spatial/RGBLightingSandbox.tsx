import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  Palette,
  Sun,
  Activity,
  Music,
  Thermometer,
  RotateCcw,
  Zap,
  Check,
  Power,
  RefreshCw,
  Layers,
  Flame,
  Volume2
} from 'lucide-react';

export type RGBPattern =
  | 'wave'
  | 'breathing'
  | 'cycle'
  | 'audio'
  | 'thermal'
  | 'static'
  | 'starlight'
  | 'blackout';

export interface RGBZoneConfig {
  enabled: boolean;
  color: string;
  secondaryColor?: string;
  pattern: RGBPattern;
  speed: number; // 0.2 to 3.0
  brightness: number; // 0 to 100
}

export interface RGBLightingSandboxProps {
  currentMasterColor: string;
  onMasterColorChange: (hex: string) => void;
  onSyncAllChange?: (zones: Record<string, RGBZoneConfig>) => void;
}

export interface ZoneItem {
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export const RGB_PRESETS = [
  {
    id: 'tokyo-cyberpunk',
    name: 'Neo Tokyo Cyberpunk',
    desc: 'Neon cyan primary with magenta neon accent glow',
    primary: '#06b6d4',
    secondary: '#ec4899',
    pattern: 'wave' as RGBPattern
  },
  {
    id: 'matrix-terminal',
    name: 'Matrix Overclock',
    desc: 'High-contrast phosphor silicon emerald cascade',
    primary: '#10b981',
    secondary: '#059669',
    pattern: 'breathing' as RGBPattern
  },
  {
    id: 'synthwave-80s',
    name: 'Retro Synthwave',
    desc: 'Sunset violet fading into laser electric purple',
    primary: '#a855f7',
    secondary: '#f43f5e',
    pattern: 'cycle' as RGBPattern
  },
  {
    id: 'volcanic-amber',
    name: 'Volcanic Forge',
    desc: 'Molten copper core with deep golden dusk aura',
    primary: '#f59e0b',
    secondary: '#ef4444',
    pattern: 'thermal' as RGBPattern
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Blizzard',
    desc: 'Crystalline glacier white with pale cobalt shimmer',
    primary: '#e0f2fe',
    secondary: '#38bdf8',
    pattern: 'breathing' as RGBPattern
  },
  {
    id: 'deep-space',
    name: 'Deep Space Abyss',
    desc: 'Ultraviolet starlight in pitch void',
    primary: '#6366f1',
    secondary: '#4338ca',
    pattern: 'starlight' as RGBPattern
  },
  {
    id: 'stealth-blackout',
    name: 'Stealth Blackout',
    desc: 'All diodes unpowered for esports tournament zero-distraction',
    primary: '#27272a',
    secondary: '#18181b',
    pattern: 'blackout' as RGBPattern
  }
];

export const RGBLightingSandbox: React.FC<RGBLightingSandboxProps> = ({
  currentMasterColor,
  onMasterColorChange
}) => {
  const [isMasterSync, setIsMasterSync] = useState<boolean>(true);
  const [activePattern, setActivePattern] = useState<RGBPattern>('wave');
  const [masterBrightness, setMasterBrightness] = useState<number>(90);
  const [masterSpeed, setMasterSpeed] = useState<number>(1.2);
  const [primaryColor, setPrimaryColor] = useState<string>(currentMasterColor || '#06b6d4');
  const [secondaryColor, setSecondaryColor] = useState<string>('#a855f7');
  const [simulatedTempC, setSimulatedTempC] = useState<number>(62);
  const [simulatedAudioFreq, setSimulatedAudioFreq] = useState<number>(68);

  // Independent zones
  const [zones, setZones] = useState<Record<string, ZoneItem>>({
    caseFans: { name: 'Chassis Fans (Front/Rear)', icon: 'Fan', color: primaryColor, enabled: true },
    ram: { name: 'DDR5 RAM Lightbars', icon: 'Memory', color: primaryColor, enabled: true },
    cooler: { name: 'CPU Cooler (Pump/Ring)', icon: 'Cpu', color: primaryColor, enabled: true },
    gpu: { name: 'GPU Shroud & Edge RGB', icon: 'Box', color: primaryColor, enabled: true },
    mobo: { name: 'Motherboard Trace & I/O', icon: 'Layers', color: primaryColor, enabled: true },
    deskStrip: { name: 'Desk Ambient Strip & Wall Glow', icon: 'Sun', color: primaryColor, enabled: true }
  });

  // Keep primaryColor in sync with master
  const handlePrimaryColorChange = (hex: string) => {
    setPrimaryColor(hex);
    onMasterColorChange(hex);
    if (isMasterSync) {
      setZones((prev) => {
        const next: Record<string, ZoneItem> = {};
        for (const [k, v] of Object.entries(prev) as [string, ZoneItem][]) {
          next[k] = { ...v, color: hex };
        }
        return next;
      });
    }
  };

  const handleApplyPreset = (preset: typeof RGB_PRESETS[0]) => {
    handlePrimaryColorChange(preset.primary);
    setSecondaryColor(preset.secondary);
    setActivePattern(preset.pattern);
    if (preset.pattern === 'blackout') {
      setMasterBrightness(0);
    } else if (masterBrightness === 0) {
      setMasterBrightness(90);
    }
  };

  const handleToggleZone = (key: string) => {
    setZones((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled }
    }));
  };

  const handleZoneColorChange = (key: string, hex: string) => {
    setZones((prev) => ({
      ...prev,
      [key]: { ...prev[key], color: hex }
    }));
  };

  // Simulated live reactive ticker
  const [tick, setTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 360);
      if (activePattern === 'audio') {
        setSimulatedAudioFreq(35 + Math.floor(Math.sin(Date.now() / 200) * 30 + Math.random() * 25));
      }
    }, 50);
    return () => clearInterval(timer);
  }, [activePattern]);

  // Compute live preview colors based on pattern
  const computeLiveColor = (zoneKey: string) => {
    const zone = zones[zoneKey];
    if (!zone?.enabled || activePattern === 'blackout' || masterBrightness === 0) {
      return '#18181b';
    }

    const baseHex = isMasterSync ? primaryColor : zone.color;

    if (activePattern === 'static') {
      return baseHex;
    }

    if (activePattern === 'thermal') {
      if (simulatedTempC < 50) return '#10b981'; // Cool Green
      if (simulatedTempC < 75) return '#f59e0b'; // Warm Amber
      return '#ef4444'; // Hot Crimson
    }

    if (activePattern === 'breathing') {
      const alpha = (Math.sin(tick * 0.05 * masterSpeed) + 1) / 2;
      return alpha > 0.4 ? baseHex : secondaryColor;
    }

    if (activePattern === 'wave') {
      const hue = (tick * 2 * masterSpeed) % 360;
      return `hsl(${hue}, 90%, 55%)`;
    }

    if (activePattern === 'audio') {
      const brightnessPct = Math.min(100, Math.max(20, simulatedAudioFreq * 1.2));
      return `color-mix(in srgb, ${baseHex} ${brightnessPct}%, #000000)`;
    }

    return baseHex;
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Explanation */}
      <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 relative overflow-hidden shadow-2xl">
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-500"
          style={{
            backgroundColor: activePattern === 'blackout' ? '#27272a' : primaryColor
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ARGB Virtual Hardware Master Controller</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              RGB & Lighting Sandbox
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Test multi-zone illumination with addressable RGB synchronization. Link your case fans, high-frequency DDR5 memory heatspreaders, AIO infinity mirror pump, and under-desk ambient light strips into one unified light show.
            </p>
          </div>

          {/* Master Sync Switch */}
          <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl shrink-0">
            <div>
              <span className="text-xs font-mono text-zinc-400 block font-bold">Aura Sync Engine</span>
              <span className="text-sm font-bold text-white">
                {isMasterSync ? 'Unified Master Sync' : 'Per-Zone Independent'}
              </span>
            </div>
            <button
              onClick={() => setIsMasterSync(!isMasterSync)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer ${
                isMasterSync ? 'bg-cyan-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-zinc-950 transition-transform ${
                  isMasterSync ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Live Rig Lighting Interactive Visualizer HUD */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80">
          <div className="text-xs font-mono text-zinc-400 font-bold mb-3 flex items-center justify-between">
            <span>LIVE ILLUMINATION RIG MAPPING:</span>
            <span className="text-cyan-400">
              Pattern: <span className="uppercase text-white font-bold">{activePattern}</span> | Speed:{' '}
              <span className="text-white font-bold">{masterSpeed.toFixed(1)}x</span> | Brightness:{' '}
              <span className="text-white font-bold">{masterBrightness}%</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(Object.entries(zones) as [string, ZoneItem][]).map(([key, zone]) => {
              const liveColor = computeLiveColor(key);
              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden ${
                    zone.enabled
                      ? 'bg-zinc-900/90 border-zinc-700/80 shadow-lg'
                      : 'bg-zinc-950/60 border-zinc-850 opacity-40'
                  }`}
                >
                  {/* Glowing backlight trace */}
                  {zone.enabled && masterBrightness > 0 && activePattern !== 'blackout' && (
                    <div
                      className="absolute inset-0 opacity-20 blur-md pointer-events-none transition-colors duration-300"
                      style={{ backgroundColor: liveColor }}
                    />
                  )}

                  <div className="relative z-10 flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-zinc-300 truncate">{zone.name}</span>
                    <button
                      onClick={() => handleToggleZone(key)}
                      className="text-zinc-500 hover:text-white cursor-pointer"
                      title={zone.enabled ? 'Mute zone' : 'Enable zone'}
                    >
                      <Power className={`w-3.5 h-3.5 ${zone.enabled ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    </button>
                  </div>

                  {/* Pulsing Light Bar Demo */}
                  <div className="relative h-5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                    <div
                      className="w-full h-full transition-all duration-150"
                      style={{
                        backgroundColor: liveColor,
                        boxShadow:
                          zone.enabled && masterBrightness > 0 && activePattern !== 'blackout'
                            ? `0 0 12px ${liveColor}`
                            : 'none'
                      }}
                    />
                  </div>

                  {/* Independent color picker if not master synced */}
                  {!isMasterSync && zone.enabled && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-mono">Custom Tint</span>
                      <input
                        type="color"
                        value={zone.color}
                        onChange={(e) => handleZoneColorChange(key, e.target.value)}
                        className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Preset Profiles */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Curated Atmosphere Presets</span>
          </div>

          <div className="space-y-2">
            {RGB_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="w-full p-3 rounded-2xl bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    <span
                      className="w-5 h-5 rounded-full border border-black shadow"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black shadow"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 line-clamp-1">{preset.desc}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                  {preset.pattern}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Patterns & Reactive Physics */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Animation Patterns & Reactive Modes</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'wave', label: 'Rainbow Wave', desc: 'Continuous RGB spectrum ripple', icon: Sparkles },
              { id: 'breathing', label: 'Breathing Pulse', desc: 'Harmonic sinus fade between colors', icon: Activity },
              { id: 'cycle', label: 'Color Cycle', desc: '16.8M hue progression', icon: RefreshCw },
              { id: 'audio', label: 'Audio Reactive', desc: 'Beats per minute music visualizer', icon: Music },
              { id: 'thermal', label: 'Thermal Heatmap', desc: 'Shifts green->amber->crimson with CPU load', icon: Thermometer },
              { id: 'starlight', label: 'Starlight Twinkle', desc: 'Subtle astronomical glimmer', icon: Sun },
              { id: 'static', label: 'Static Monolith', desc: 'Solid precision architectural tone', icon: Sliders },
              { id: 'blackout', label: 'Stealth Blackout', desc: 'Zero light pollution tournament mode', icon: Power }
            ].map((pat) => {
              const Icon = pat.icon;
              const isActive = activePattern === pat.id;
              return (
                <button
                  key={pat.id}
                  onClick={() => setActivePattern(pat.id as RGBPattern)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-md'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
                    <span className="text-xs font-bold font-mono">{pat.label}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-1">{pat.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Pattern-Specific Dynamic Sliders */}
          {activePattern === 'thermal' && (
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Simulated CPU/GPU Temp:
                </span>
                <span
                  className={`font-bold ${
                    simulatedTempC > 75 ? 'text-rose-400' : simulatedTempC > 55 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {simulatedTempC}°C
                </span>
              </div>
              <input
                type="range"
                min="35"
                max="95"
                value={simulatedTempC}
                onChange={(e) => setSimulatedTempC(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>35°C (Idle Green)</span>
                <span>65°C (Gaming Amber)</span>
                <span>95°C (Throttle Red)</span>
              </div>
            </div>
          )}

          {activePattern === 'audio' && (
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Audio Sub-Bass Frequency:
                </span>
                <span className="text-cyan-400 font-bold">{simulatedAudioFreq} Hz</span>
              </div>
              <div className="flex items-end gap-1 h-8 bg-zinc-900/80 p-1.5 rounded-xl">
                {[45, 60, 85, 30, 95, 75, 40, 65, 80, 50, 90, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-cyan-500 rounded-sm transition-all duration-75"
                    style={{
                      height: `${Math.min(100, (h * simulatedAudioFreq) / 60)}%`,
                      opacity: 0.6 + (i % 3) * 0.2
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Telemetry Sliders & Custom Color Wheel */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-5">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Master Dimmers & Chromatics</span>
          </div>

          {/* Primary Color Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-bold">Primary Luminescence Tint:</span>
              <span className="text-cyan-400 font-bold uppercase">{primaryColor}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => handlePrimaryColorChange(e.target.value)}
                className="w-10 h-10 rounded-xl border border-zinc-700 bg-transparent cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5 flex-1">
                {['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#f43f5e', '#ffffff'].map((hex) => (
                  <button
                    key={hex}
                    onClick={() => handlePrimaryColorChange(hex)}
                    className="w-6 h-6 rounded-lg border border-zinc-700 transition-transform hover:scale-115 cursor-pointer shadow"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Color (for breathing / wave) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-bold">Secondary Accent Color:</span>
              <span className="text-violet-400 font-bold uppercase">{secondaryColor}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-zinc-700 bg-transparent cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5 flex-1">
                {['#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#f97316', '#e11d48'].map((hex) => (
                  <button
                    key={hex}
                    onClick={() => setSecondaryColor(hex)}
                    className="w-6 h-6 rounded-lg border border-zinc-700 transition-transform hover:scale-115 cursor-pointer shadow"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Brightness Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Master Brightness:
              </span>
              <span className="text-white font-bold">{masterBrightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masterBrightness}
              onChange={(e) => setMasterBrightness(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Speed Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Cycle Animation Velocity:
              </span>
              <span className="text-white font-bold">{masterSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={masterSpeed}
              onChange={(e) => setMasterSpeed(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0.2x (Subtle Glow)</span>
              <span>1.0x (Standard)</span>
              <span>3.0x (Hyper Pulse)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
