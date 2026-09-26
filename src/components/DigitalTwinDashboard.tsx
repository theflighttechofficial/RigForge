import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DigitalTwinPC,
  DigitalTwinStorageDrive,
  DigitalTwinFanConfig
} from '../types';
import {
  DEFAULT_DIGITAL_TWIN,
  PRESET_TWINS,
  loadSavedDigitalTwins,
  saveDigitalTwins,
  getActiveTwinId,
  setActiveTwinId
} from '../data/digitalTwinData';
import { formatINR } from '../utils/formatters';
import {
  Cpu,
  Monitor,
  HardDrive,
  Zap,
  Flame,
  Thermometer,
  Activity,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  Layers,
  Fan,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Box,
  Laptop,
  RefreshCw,
  Download,
  Upload,
  Share2,
  Stethoscope,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit3,
  Tv,
  Headphones,
  Keyboard,
  BatteryCharging,
  ArrowUpRight,
  ChevronRight,
  Tag,
  Maximize2
} from 'lucide-react';

interface DigitalTwinDashboardProps {
  onNavigateToTab: (tabId: string) => void;
  onRunAiDiagnostics?: (configPrompt: string) => void;
  onOpen3DStudio?: (cpuId: string, gpuId: string) => void;
  onOpenSynergy?: (cpuId: string, gpuId: string) => void;
  theme?: 'dark' | 'light';
}

type TwinSubTab = 'overview' | 'hardware' | 'cooling' | 'bios' | 'warranties' | 'peripherals';

export const DigitalTwinDashboard: React.FC<DigitalTwinDashboardProps> = ({
  onNavigateToTab,
  onRunAiDiagnostics,
  onOpen3DStudio,
  onOpenSynergy,
  theme = 'dark'
}) => {
  // Load digital twins from localStorage or defaults
  const [twins, setTwins] = useState<DigitalTwinPC[]>(() => loadSavedDigitalTwins());
  const [activeTwinIdState, setActiveTwinIdState] = useState<string>(() => getActiveTwinId());
  const [activeSubTab, setActiveSubTab] = useState<TwinSubTab>('overview');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Active twin object
  const activeTwin = useMemo(() => {
    return twins.find((t) => t.id === activeTwinIdState) || twins[0] || DEFAULT_DIGITAL_TWIN;
  }, [twins, activeTwinIdState]);

  // Form state for editing
  const [editForm, setEditForm] = useState<DigitalTwinPC>(activeTwin);

  useEffect(() => {
    setEditForm(activeTwin);
  }, [activeTwin]);

  // Save changes to persistent storage
  const handleSaveEdit = () => {
    const updated = twins.map((t) => (t.id === editForm.id ? { ...editForm, updatedAt: new Date().toISOString() } : t));
    setTwins(updated);
    saveDigitalTwins(updated);
    setIsEditing(false);
    showNotification('Digital Twin configuration saved!');
  };

  const handleSelectTwin = (id: string) => {
    setActiveTwinIdState(id);
    setActiveTwinId(id);
    setIsEditing(false);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset this rig to default recommended 7800X3D + RTX 4070 Super configuration?')) {
      const updated = twins.map((t) => (t.id === activeTwin.id ? { ...DEFAULT_DIGITAL_TWIN, id: t.id, name: t.name } : t));
      setTwins(updated);
      saveDigitalTwins(updated);
      setEditForm(DEFAULT_DIGITAL_TWIN);
      showNotification('Reset to default spec successfully.');
    }
  };

  const showNotification = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // Financial and warranty calculations
  const { totalInvestedINR, warrantyStats, storageStats } = useMemo(() => {
    const now = new Date();
    let totalInvested =
      (activeTwin.cpu.priceINR || 0) +
      (activeTwin.gpu.priceINR || 0) +
      (activeTwin.motherboard.priceINR || 0) +
      (activeTwin.ram.priceINR || 0) +
      (activeTwin.psu.priceINR || 0) +
      (activeTwin.cabinet.priceINR || 0);

    activeTwin.storageDrives.forEach((d) => {
      totalInvested += d.priceINR || 0;
    });

    const componentsWithWarranty = [
      { name: 'Processor (CPU)', expiry: activeTwin.cpu.warrantyExpiry },
      { name: 'Graphics Card (GPU)', expiry: activeTwin.gpu.warrantyExpiry },
      { name: 'Motherboard', expiry: activeTwin.motherboard.warrantyExpiry },
      { name: 'RAM Memory', expiry: activeTwin.ram.warrantyExpiry },
      { name: 'Power Supply (PSU)', expiry: activeTwin.psu.warrantyExpiry },
      { name: 'Chassis Cabinet', expiry: activeTwin.cabinet.warrantyExpiry },
      ...activeTwin.storageDrives.map((d) => ({ name: d.model, expiry: d.warrantyExpiry }))
    ];

    let activeCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    componentsWithWarranty.forEach((c) => {
      if (!c.expiry) return;
      const expiryDate = new Date(c.expiry);
      const diffMonths = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (diffMonths < 0) {
        expiredCount++;
      } else if (diffMonths <= 6) {
        expiringSoonCount++;
      } else {
        activeCount++;
      }
    });

    // Total storage capacity and used
    const totalStorageGb = activeTwin.storageDrives.reduce((acc, d) => acc + d.capacityGb, 0);
    const totalUsedGb = activeTwin.storageDrives.reduce((acc, d) => acc + d.usedGb, 0);

    return {
      totalInvestedINR: totalInvested,
      warrantyStats: {
        total: componentsWithWarranty.length,
        active: activeCount,
        expiringSoon: expiringSoonCount,
        expired: expiredCount
      },
      storageStats: {
        totalGb: totalStorageGb,
        usedGb: totalUsedGb,
        percent: totalStorageGb > 0 ? Math.round((totalUsedGb / totalStorageGb) * 100) : 0
      }
    };
  }, [activeTwin]);

  // Live workload load bars — scaled off the twin's actual CPU/GPU/RAM specs instead of a
  // fixed 75%/88%/50% shown for every rig regardless of what hardware is installed.
  const workloadStats = useMemo(() => {
    const cpuLoadPct = Math.min(92, Math.max(35, Math.round(40 + (activeTwin.cpu.tdpWatts / 250) * 45)));
    const gpuLoadPct = Math.min(99, Math.max(80, Math.round(92 + (activeTwin.gpu.tgpWatts - 220) * 0.02)));
    const assumedUsedGb = Math.min(activeTwin.ram.capacityGb - 2, 16);
    const ramLoadPct = Math.min(95, Math.max(10, Math.round((assumedUsedGb / activeTwin.ram.capacityGb) * 100)));
    return { cpuLoadPct, gpuLoadPct, ramLoadPct };
  }, [activeTwin]);

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeTwin, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `digital_twin_${activeTwin.name.replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Digital Twin JSON exported!');
  };

  // Trigger AI Build Doctor with this Twin
  const handleRunAiDoctor = () => {
    const prompt = `${activeTwin.cpu.model} + ${activeTwin.gpu.model} + ${activeTwin.ram.capacityGb}GB RAM`;
    if (onRunAiDiagnostics) {
      onRunAiDiagnostics(prompt);
    } else {
      onNavigateToTab('doctor');
    }
  };

  // Render ASCII/Bar indicator for dashboard
  const renderBars = (count: number, max: number = 16, colorClass: string = 'bg-cyan-400') => {
    const safeCount = Math.min(Math.max(count, 1), max);
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, idx) => (
          <div
            key={idx}
            className={`h-4 w-1.5 sm:w-2 rounded-xs transition-all ${
              idx < safeCount ? colorClass : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {copiedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-mono font-bold text-xs shadow-2xl flex items-center gap-2 border border-cyan-300"
          >
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>{copiedNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP CONTROLS & RIG SWITCHER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Digital Twin Hub
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-zinc-400">LIVE SYNCED</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {activeTwin.name}
            </h1>
          </div>
        </div>

        {/* Rig Presets Selector & Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <select
            value={activeTwin.id}
            onChange={(e) => handleSelectTwin(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            {twins.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.cpu.model.split(' ')[2] || t.cpu.model} + {t.gpu.model.split(' ')[2] || t.gpu.model})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isEditing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Spec'}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download full JSON Digital Twin blueprint"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Export</span>
          </button>

          <button
            onClick={handleRunAiDoctor}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-mono font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            title="Run AI Build Doctor diagnostics on this specific rig"
          >
            <Stethoscope className="w-3.5 h-3.5 text-black" />
            <span>Scan in AI Doctor</span>
          </button>
        </div>
      </div>

      {/* THE CENTERPIECE "MY RIG" CONSOLE DASHBOARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-zinc-950 border-2 border-cyan-500/30 p-6 sm:p-8 shadow-2xl space-y-8 backdrop-blur-xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Console Header Bar */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black tracking-widest text-cyan-400 uppercase">
                MY RIG // PHYSICAL & ELECTRICAL DIGITAL TWIN
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                ACTIVE PROFILE
              </span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-white">
              {activeTwin.cpu.model.replace('AMD ', '').replace('Intel Core ', '')}
              <span className="text-zinc-500 mx-2">&bull;</span>
              {activeTwin.gpu.model.replace('NVIDIA GeForce ', '')}
            </div>
            <p className="text-xs font-mono text-zinc-400">
              {activeTwin.ram.capacityGb}GB {activeTwin.ram.type} &bull;{' '}
              {activeTwin.storageDrives[0]?.capacityGb >= 1000
                ? `${activeTwin.storageDrives[0].capacityGb / 1024}TB`
                : `${activeTwin.storageDrives[0]?.capacityGb}GB`}{' '}
              {activeTwin.storageDrives[0]?.type} &bull; {activeTwin.psu.wattage}W{' '}
              {activeTwin.psu.efficiencyRating}
            </p>
          </div>

          {/* Quick Module Teleport Hub */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (onOpen3DStudio) onOpen3DStudio(activeTwin.cpu.hardwareId || 'cpu-amd-7800x3d', activeTwin.gpu.hardwareId || 'gpu-nvidia-4070-super');
                else onNavigateToTab('spatial3d');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-cyan-300 text-xs font-mono font-bold border border-zinc-700 transition-all cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Spatial View</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </button>

            <button
              onClick={() => {
                if (onOpenSynergy) onOpenSynergy(activeTwin.cpu.hardwareId || 'cpu-amd-7800x3d', activeTwin.gpu.hardwareId || 'gpu-nvidia-4070-super');
                else onNavigateToTab('synergy');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-emerald-300 text-xs font-mono font-bold border border-zinc-700 transition-all cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bottleneck Test</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </button>

            <button
              onClick={() => onNavigateToTab('battlestation')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-violet-300 text-xs font-mono font-bold border border-zinc-700 transition-all cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-violet-400" />
              <span>Battlestation</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </button>
          </div>
        </div>

        {/* 5 CORE DIMENSION SCORES + REAL-TIME BARS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 5 Dimension Scores (Performance, Thermals, Efficiency, Upgradeability, Value) */}
          <div className="lg:col-span-6 space-y-3.5 p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                EVALUATED DIMENSION
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                SCORE / 100
              </span>
            </div>

            {/* Performance: 94/100 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Performance
                </span>
                <span className="text-cyan-400 font-bold">{activeTwin.scores.performance}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-500 shadow-glow-cyan"
                  style={{ width: `${activeTwin.scores.performance}%` }}
                />
              </div>
            </div>

            {/* Thermals: 87/100 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                  Thermals
                </span>
                <span className="text-emerald-400 font-bold">{activeTwin.scores.thermals}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${activeTwin.scores.thermals}%` }}
                />
              </div>
            </div>

            {/* Power Efficiency: 91/100 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Power Efficiency
                </span>
                <span className="text-amber-400 font-bold">{activeTwin.scores.powerEfficiency}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${activeTwin.scores.powerEfficiency}%` }}
                />
              </div>
            </div>

            {/* Upgradeability: 82/100 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Upgradeability
                </span>
                <span className="text-purple-400 font-bold">{activeTwin.scores.upgradeability}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-400 transition-all duration-500"
                  style={{ width: `${activeTwin.scores.upgradeability}%` }}
                />
              </div>
            </div>

            {/* Value: 89/100 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-rose-400" />
                  Value & Price-to-Performance
                </span>
                <span className="text-rose-400 font-bold">{activeTwin.scores.value}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-400 transition-all duration-500"
                  style={{ width: `${activeTwin.scores.value}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Real-time Component Load Bars (CPU, GPU, RAM, SSD) */}
          <div className="lg:col-span-6 space-y-4 p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                ACTIVE WORKLOAD DISPATCH
              </span>
              <span className="text-[11px] text-zinc-500">GAMING SYNCHRONOUS</span>
            </div>

            {/* CPU ████████████ (12 bars) */}
            <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-bold text-white w-10">CPU</span>
                <span className="text-[11px] text-zinc-400 hidden sm:inline truncate max-w-[140px]">
                  {activeTwin.cpu.model.replace('AMD ', '').replace('Intel Core ', '')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {renderBars(Math.round((workloadStats.cpuLoadPct / 100) * 16), 16, 'bg-cyan-400')}
                <span className="text-xs font-bold text-cyan-400 w-10 text-right">{workloadStats.cpuLoadPct}%</span>
              </div>
            </div>

            {/* GPU ██████████████ (14 bars) */}
            <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-bold text-white w-10">GPU</span>
                <span className="text-[11px] text-zinc-400 hidden sm:inline truncate max-w-[140px]">
                  {activeTwin.gpu.model.replace('NVIDIA GeForce ', '')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {renderBars(Math.round((workloadStats.gpuLoadPct / 100) * 16), 16, 'bg-purple-400')}
                <span className="text-xs font-bold text-purple-400 w-10 text-right">{workloadStats.gpuLoadPct}%</span>
              </div>
            </div>

            {/* RAM ████████ (8 bars) */}
            <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white w-10">RAM</span>
                <span className="text-[11px] text-zinc-400 hidden sm:inline">
                  {activeTwin.ram.capacityGb}GB {activeTwin.ram.type}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {renderBars(Math.round((workloadStats.ramLoadPct / 100) * 16), 16, 'bg-emerald-400')}
                <span className="text-xs font-bold text-emerald-400 w-10 text-right">{workloadStats.ramLoadPct}%</span>
              </div>
            </div>

            {/* SSD █████████ (9 bars) */}
            <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-white w-10">SSD</span>
                <span className="text-[11px] text-zinc-400 hidden sm:inline truncate max-w-[140px]">
                  {storageStats.usedGb}GB / {storageStats.totalGb}GB
                </span>
              </div>
              <div className="flex items-center gap-3">
                {renderBars(9, 16, 'bg-amber-400')}
                <span className="text-xs font-bold text-amber-400 w-10 text-right">
                  {storageStats.percent}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION BAR */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-b border-zinc-800 text-xs font-mono">
          {[
            { id: 'overview', label: 'Telemetry & Dynamics', icon: Activity },
            { id: 'hardware', label: 'Exact Dimensions & Hardware', icon: Wrench },
            { id: 'cooling', label: 'Cooling & Fan Orientation', icon: Fan },
            { id: 'bios', label: 'BIOS & RAM Tuning', icon: Layers },
            { id: 'warranties', label: 'Warranties & Financials', icon: ShieldCheck },
            { id: 'peripherals', label: 'Display & Peripherals', icon: Tv }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as TwinSubTab)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SUB-TAB 1: TELEMETRY & DYNAMICS */}
        {activeSubTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU Thermal */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  CPU Thermals
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400">
                  OPTIMAL
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-white">
                  {activeTwin.telemetry.cpuLoadTempC}°C
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  (Idle: {activeTwin.telemetry.cpuIdleTempC}°C)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Delta-T: +{activeTwin.telemetry.cpuLoadTempC - activeTwin.telemetry.ambientRoomTempC}°C over {activeTwin.telemetry.ambientRoomTempC}°C ambient. Zero throttling.
              </p>
            </div>

            {/* GPU Thermal */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-purple-400" />
                  GPU Hotspot
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-400">
                  COOL
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-white">
                  {activeTwin.telemetry.gpuLoadTempC}°C
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  (Hotspot: {activeTwin.telemetry.gpuHotspotTempC}°C)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                VRAM: {activeTwin.telemetry.vramTempC}°C GDDR6X. Fan speed auto-profile: ~1400 RPM (quiet).
              </p>
            </div>

            {/* Power Consumption */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Load Power Draw
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400">
                  52% PSU LOAD
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-white">
                  {activeTwin.telemetry.totalPowerDrawLoadWatts}W
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  / {activeTwin.psu.wattage}W
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Operating directly at 80+ Gold apex efficiency sweet spot. 390W headroom for transient spikes.
              </p>
            </div>

            {/* Air Pressure Dynamics */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Fan className="w-3.5 h-3.5 text-emerald-400" />
                  Chassis Airflow
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 uppercase">
                  {activeTwin.cooling.staticPressure} PRESSURE
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-white">
                  {activeTwin.cooling.fans.reduce((acc, f) => acc + f.fanCount, 0)} Fans
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Higher filtered intake CFM prevents dusty Indian room lint from seeping through unmeshed gaps.
              </p>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: EXACT DIMENSIONS & HARDWARE */}
        {activeSubTab === 'hardware' && (
          <div className="space-y-6">
            {/* Dimensions Cross-Section Blueprint */}
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  Physical Chassis Dimensions & Tolerance Clearances
                </span>
                <span className="text-zinc-400">{activeTwin.cabinet.caseModel}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 block">Cabinet Outer Dimensions</span>
                  <strong className="text-white text-sm">
                    {activeTwin.cabinet.widthMm} x {activeTwin.cabinet.heightMm} x {activeTwin.cabinet.depthMm} mm
                  </strong>
                  <span className="text-[11px] text-zinc-400 block">W × H × D</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 block">GPU Length vs Clearance</span>
                  <strong className="text-emerald-400 text-sm">
                    {activeTwin.gpu.lengthMm} mm / {activeTwin.cabinet.maxGpuLengthMm} mm max
                  </strong>
                  <span className="text-[11px] text-emerald-300 block">
                    +{activeTwin.cabinet.maxGpuLengthMm - activeTwin.gpu.lengthMm} mm safe buffer
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 block">Cooler Radiator / Height</span>
                  <strong className="text-cyan-400 text-sm">
                    {activeTwin.cooling.coolerType} (Top Mount)
                  </strong>
                  <span className="text-[11px] text-zinc-400 block">
                    Max Air Cooler: {activeTwin.cabinet.maxCoolerHeightMm} mm
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 block">Motherboard & Slot Fit</span>
                  <strong className="text-purple-400 text-sm">
                    {activeTwin.motherboard.formFactor} &bull; {activeTwin.motherboard.chipset}
                  </strong>
                  <span className="text-[11px] text-zinc-400 block">
                    {activeTwin.motherboard.pcieVersion}
                  </span>
                </div>
              </div>
            </div>

            {/* Storage Drive Array */}
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  NVMe & SATA Drive Array ({activeTwin.storageDrives.length} Drives)
                </span>
                <span className="text-zinc-400">
                  {storageStats.usedGb} GB used of {storageStats.totalGb} GB
                </span>
              </div>

              <div className="space-y-3">
                {activeTwin.storageDrives.map((drive) => (
                  <div
                    key={drive.id}
                    className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {drive.type}
                        </span>
                        <strong className="text-white text-sm">{drive.model}</strong>
                      </div>
                      <div className="text-zinc-400 text-[11px]">
                        Read: {drive.readSpeedMBps} MB/s &bull; Write: {drive.writeSpeedMBps} MB/s &bull; Cost: {formatINR(drive.priceINR)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-zinc-400 text-[11px] block">Drive Health</span>
                        <span className="text-emerald-400 font-bold text-sm">{drive.healthPercent}% S.M.A.R.T.</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-400 text-[11px] block">Capacity Used</span>
                        <span className="text-white font-bold text-sm">
                          {drive.usedGb} / {drive.capacityGb} GB
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: COOLING & FAN ORIENTATION */}
        {activeSubTab === 'cooling' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <Fan className="w-4 h-4 text-emerald-400" />
                  AIO Liquid Loop & Fan Orientation Layout
                </span>
                <span className="text-emerald-400 font-bold">
                  {activeTwin.cooling.staticPressure} Static Pressure
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <span className="text-zinc-400 block">CPU Cooler Specification</span>
                  <strong className="text-white text-sm block">{activeTwin.cooling.coolerModel}</strong>
                  <div className="text-zinc-400 text-[11px] space-y-1">
                    <div>Radiator: 360mm Aluminum Fins</div>
                    <div>Mounting: {activeTwin.cooling.radiatorMount} Exhaust</div>
                    <div>Pump Speed: 3100 RPM (DC Mode)</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <span className="text-zinc-400 block">Thermal Interface Material</span>
                  <strong className="text-white text-sm block">{activeTwin.cooling.thermalPaste}</strong>
                  <div className="text-zinc-400 text-[11px] space-y-1">
                    <div>Applied: {activeTwin.cooling.pasteAppliedDate}</div>
                    <div>Longevity: 8-Year Non-Curing Formula</div>
                    <div>Thermal Conductivity: ~8.5 W/mK</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <span className="text-zinc-400 block">Indian Ambient Compensation</span>
                  <strong className="text-amber-400 text-sm block">Calibrated for 28°C–42°C</strong>
                  <div className="text-zinc-400 text-[11px] space-y-1">
                    <div>Dust Ingress Protection: Active</div>
                    <div>Acoustic Profile: 32 dBA at 100% Gaming</div>
                    <div>Recommended Repaste: Nov 2026</div>
                  </div>
                </div>
              </div>

              {/* Fan Array List */}
              <div className="pt-2">
                <h4 className="text-zinc-300 font-bold mb-3 uppercase tracking-wider text-[11px]">
                  Configured Fan Arrays
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeTwin.cooling.fans.map((fan, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-white text-xs block">{fan.location}</strong>
                        <span className="text-[11px] text-zinc-400">
                          {fan.fanCount}x {fan.fanSizeMm}mm @ {fan.rpm} RPM
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          fan.direction === 'Intake'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {fan.direction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 4: BIOS & RAM TUNING */}
        {activeSubTab === 'bios' && (
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Motherboard UEFI BIOS & RAM Subsystem Profile
              </span>
              <span className="text-emerald-400 font-bold">AGESA 1.2.0.2 Ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 block">BIOS Version & Date</span>
                <strong className="text-white text-xs block">{activeTwin.bios.biosVersion}</strong>
                <span className="text-[11px] text-zinc-400 block">{activeTwin.bios.releaseDate}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 block">Resizable BAR / SAM</span>
                <strong className="text-emerald-400 text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeTwin.bios.resizableBar ? 'ENABLED (Direct VRAM Access)' : 'DISABLED'}
                </strong>
                <span className="text-[11px] text-zinc-400 block">+6% 1% Low FPS Boost</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 block">AMD PBO / Curve Optimizer</span>
                <strong className="text-cyan-400 text-xs block">{activeTwin.bios.curveOptimizer}</strong>
                <span className="text-[11px] text-zinc-400 block">Lowers temp by 5°C with higher boost</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 block">Memory Profile & FCLK</span>
                <strong className="text-purple-400 text-xs block">
                  {activeTwin.ram.expoXmpProfile} &bull; {activeTwin.ram.speedMhz} MT/s
                </strong>
                <span className="text-[11px] text-zinc-400 block">FCLK: {activeTwin.bios.fclkMhz} MHz (1:1 Ratio)</span>
              </div>
            </div>

            {/* RAM Latency Timings */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-bold">Primary Sub-Timings & Configuration</span>
                <span className="text-cyan-400">{activeTwin.ram.timing}</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Running in true Dual Channel on DIMM slots A2 and B2. SK Hynix A-die memory ICs operating with optimized tREFI and tRFC secondary timings for minimum memory access latency in esports titles.
              </p>
            </div>
          </div>
        )}

        {/* SUB-TAB 5: WARRANTIES & FINANCIALS */}
        {activeSubTab === 'warranties' && (
          <div className="space-y-6 font-mono text-xs">
            {/* Financial Overview */}
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Hardware Investment & Active Warranty Dashboard
                </span>
                <span className="text-cyan-400 font-bold">
                  Total Invested: {formatINR(totalInvestedINR)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
                  <span className="text-emerald-400 block">Active Warranties</span>
                  <strong className="text-2xl font-black text-white">{warrantyStats.active} Components</strong>
                  <span className="text-[11px] text-emerald-300 block">100% Covered</span>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-1">
                  <span className="text-amber-400 block">Expiring Within 6 Months</span>
                  <strong className="text-2xl font-black text-white">{warrantyStats.expiringSoon} Components</strong>
                  <span className="text-[11px] text-amber-300 block">Action recommended</span>
                </div>

                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 space-y-1">
                  <span className="text-rose-400 block">Expired Warranties</span>
                  <strong className="text-2xl font-black text-white">{warrantyStats.expired} Components</strong>
                  <span className="text-[11px] text-rose-300 block">Out of manufacturer cover</span>
                </div>
              </div>

              {/* Warranty Ledger Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                      <th className="py-2.5">Component</th>
                      <th className="py-2.5">Model</th>
                      <th className="py-2.5">Purchase Date</th>
                      <th className="py-2.5">Warranty Expiry</th>
                      <th className="py-2.5">Retailer</th>
                      <th className="py-2.5 text-right">Price Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    <tr>
                      <td className="py-2 text-cyan-400 font-bold">Processor (CPU)</td>
                      <td className="py-2 text-white">{activeTwin.cpu.model}</td>
                      <td className="py-2">{activeTwin.cpu.purchaseDate}</td>
                      <td className="py-2 text-emerald-400">{activeTwin.cpu.warrantyExpiry}</td>
                      <td className="py-2 text-zinc-400">{activeTwin.cpu.retailStore}</td>
                      <td className="py-2 text-right font-bold">{formatINR(activeTwin.cpu.priceINR)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-purple-400 font-bold">Graphics Card (GPU)</td>
                      <td className="py-2 text-white">{activeTwin.gpu.model}</td>
                      <td className="py-2">{activeTwin.gpu.purchaseDate}</td>
                      <td className="py-2 text-emerald-400">{activeTwin.gpu.warrantyExpiry}</td>
                      <td className="py-2 text-zinc-400">{activeTwin.gpu.retailStore}</td>
                      <td className="py-2 text-right font-bold">{formatINR(activeTwin.gpu.priceINR)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-blue-400 font-bold">Motherboard</td>
                      <td className="py-2 text-white">{activeTwin.motherboard.model}</td>
                      <td className="py-2">{activeTwin.motherboard.purchaseDate}</td>
                      <td className="py-2 text-emerald-400">{activeTwin.motherboard.warrantyExpiry}</td>
                      <td className="py-2 text-zinc-400">{activeTwin.motherboard.retailStore}</td>
                      <td className="py-2 text-right font-bold">{formatINR(activeTwin.motherboard.priceINR)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-emerald-400 font-bold">RAM Memory</td>
                      <td className="py-2 text-white">{activeTwin.ram.model}</td>
                      <td className="py-2">{activeTwin.ram.purchaseDate}</td>
                      <td className="py-2 text-emerald-400">{activeTwin.ram.warrantyExpiry} (Lifetime)</td>
                      <td className="py-2 text-zinc-400">{activeTwin.ram.retailStore}</td>
                      <td className="py-2 text-right font-bold">{formatINR(activeTwin.ram.priceINR)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-amber-400 font-bold">Power Supply (PSU)</td>
                      <td className="py-2 text-white">{activeTwin.psu.model}</td>
                      <td className="py-2">{activeTwin.psu.purchaseDate}</td>
                      <td className="py-2 text-emerald-400">{activeTwin.psu.warrantyExpiry} (7-Year)</td>
                      <td className="py-2 text-zinc-400">{activeTwin.psu.retailStore}</td>
                      <td className="py-2 text-right font-bold">{formatINR(activeTwin.psu.priceINR)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 6: DISPLAY & PERIPHERALS */}
        {activeSubTab === 'peripherals' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-violet-400" />
                  Visual Display, Input & Electrical UPS Ecosystem
                </span>
                <span className="text-zinc-400">Complete Battlestation Setup</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monitor Card */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-violet-400 font-bold">
                    <Monitor className="w-4 h-4" />
                    <span>Primary Gaming Display</span>
                  </div>
                  <strong className="text-white text-sm block">{activeTwin.display.model}</strong>
                  <div className="text-zinc-400 space-y-1 text-[11px]">
                    <div>Resolution: {activeTwin.display.resolution}</div>
                    <div>Refresh Rate: {activeTwin.display.refreshRateHz} Hz OLED (0.03ms GtG)</div>
                    <div>Adaptive Sync: {activeTwin.display.syncTechnology}</div>
                  </div>
                </div>

                {/* UPS Backup Card */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <BatteryCharging className="w-4 h-4" />
                    <span>In-House UPS Power Protection</span>
                  </div>
                  <strong className="text-white text-sm block">{activeTwin.peripherals.upsModel}</strong>
                  <div className="text-zinc-400 space-y-1 text-[11px]">
                    <div>Rating: {activeTwin.peripherals.upsVa} VA / Pure Sine Wave</div>
                    <div>Full Load Gaming Runtime: ~{activeTwin.peripherals.upsBatteryMinutesGaming} Minutes</div>
                    <div>Safe Auto-Shutdown Grace Window: 15 Minutes</div>
                  </div>
                </div>
              </div>

              {/* Peripherals Row */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
                  Attached Desk Input & Audiophile Hardware
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-zinc-300 text-[11px]">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                    <Keyboard className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">{activeTwin.peripherals.keyboard}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                    <Laptop className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate">{activeTwin.peripherals.mouse}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                    <Headphones className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{activeTwin.peripherals.headsetAudio}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL / DRAWER */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 rounded-2xl bg-zinc-950 border-2 border-amber-500/50 space-y-6 font-mono text-xs overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  Edit Digital Twin Specifications
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetToDefault}
                    className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-all cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Rig Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Processor (CPU) Model</label>
                  <input
                    type="text"
                    value={editForm.cpu.model}
                    onChange={(e) =>
                      setEditForm({ ...editForm, cpu: { ...editForm.cpu, model: e.target.value } })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Graphics Card (GPU) Model</label>
                  <input
                    type="text"
                    value={editForm.gpu.model}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gpu: { ...editForm.gpu, model: e.target.value } })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">RAM Capacity (GB)</label>
                  <input
                    type="number"
                    value={editForm.ram.capacityGb}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        ram: { ...editForm.ram, capacityGb: Number(e.target.value) || 16 }
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">RAM Speed & Timing</label>
                  <input
                    type="text"
                    value={editForm.ram.timing}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        ram: { ...editForm.ram, timing: e.target.value }
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Power Supply (PSU Wattage)</label>
                  <input
                    type="number"
                    value={editForm.psu.wattage}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        psu: { ...editForm.psu, wattage: Number(e.target.value) || 750 }
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">CPU Load Temperature (°C)</label>
                  <input
                    type="number"
                    value={editForm.telemetry.cpuLoadTempC}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        telemetry: { ...editForm.telemetry, cpuLoadTempC: Number(e.target.value) || 65 }
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">GPU Load Temperature (°C)</label>
                  <input
                    type="number"
                    value={editForm.telemetry.gpuLoadTempC}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        telemetry: { ...editForm.telemetry, gpuLoadTempC: Number(e.target.value) || 65 }
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Chassis Model & GPU Clearance</label>
                  <input
                    type="text"
                    value={editForm.cabinet.caseModel}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        cabinet: { ...editForm.cabinet, caseModel: e.target.value }
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
