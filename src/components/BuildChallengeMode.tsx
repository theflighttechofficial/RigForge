import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BUILD_CHALLENGES,
  BuildChallengeSpec,
  ChallengeUserConfig,
  calculateChallengeScore,
  ChallengeScoreResult
} from '../data/challengeData';
import { CPUItem, GPUItem } from '../types';
import { formatINR } from '../utils/formatters';
import {
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  Sparkles,
  Share2,
  Copy,
  Zap,
  Cpu,
  Tv,
  Award,
  BarChart3,
  Check,
  ShieldCheck,
  Flame,
  Wrench,
  RotateCcw
} from 'lucide-react';

interface BuildChallengeModeProps {
  cpus: CPUItem[];
  gpus: GPUItem[];
  onNavigateToBuilder?: () => void;
  theme?: 'dark' | 'light';
}

export const BuildChallengeMode: React.FC<BuildChallengeModeProps> = ({
  cpus,
  gpus,
  onNavigateToBuilder,
  theme = 'dark'
}) => {
  const [activeChallengeId, setActiveChallengeId] = useState<string>('challenge-001');

  // Selected Challenge
  const currentChallenge = useMemo(() => {
    return BUILD_CHALLENGES.find((c) => c.id === activeChallengeId) || BUILD_CHALLENGES[0];
  }, [activeChallengeId]);

  // Default User Assembly Configuration
  const [userConfig, setUserConfig] = useState<ChallengeUserConfig>({
    cpuId: cpus.find((c) => c.Model.includes('7600') || c.Model.includes('13400'))?.id || cpus[0].id,
    gpuId: gpus.find((g) => g.Model.includes('4060 Ti') || g.Model.includes('7700 XT') || g.Model.includes('6700 XT'))?.id || gpus[0].id,
    ramGb: 32,
    ramType: 'DDR5',
    storageGb: 1000,
    wifiEnabled: true,
    psuWatts: 650,
    psuRating: '80+ Bronze',
    motherboardModel: 'MSI B650M Gaming Wi-Fi',
    caseModel: 'Ant Esports ICE-100 Mesh Cabinet'
  });

  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Selected CPU / GPU
  const chosenCpu = useMemo(() => cpus.find((c) => c.id === userConfig.cpuId) || cpus[0], [cpus, userConfig.cpuId]);
  const chosenGpu = useMemo(() => gpus.find((g) => g.id === userConfig.gpuId) || gpus[0], [gpus, userConfig.gpuId]);

  // Calculate Live Challenge Scorecard
  const scoreResult: ChallengeScoreResult = useMemo(() => {
    return calculateChallengeScore(currentChallenge, userConfig, cpus, gpus);
  }, [currentChallenge, userConfig, cpus, gpus]);

  const handleShareBuild = () => {
    const text = `🏆 PC BUILD CHALLENGE: ${currentChallenge.code} (${currentChallenge.title})\n` +
      `Rank: Tier ${scoreResult.rankTier} (${scoreResult.scores.totalComposite}/100 Score)\n` +
      `CPU: ${chosenCpu.Model}\n` +
      `GPU: ${chosenGpu.Model}\n` +
      `RAM: ${userConfig.ramGb}GB ${userConfig.ramType}\n` +
      `Cost: ${formatINR(scoreResult.totalCostINR)} / ${formatINR(currentChallenge.budgetINR)}\n` +
      `Built on Silicon PC Builder`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 font-mono">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                Gamified Builder Quest
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                CHALLENGE MODE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              PC Build Challenge Studio
            </h1>
          </div>
        </div>

        {/* Share Action */}
        <button
          onClick={handleShareBuild}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          {copiedShare ? <Check className="w-4 h-4 text-black" /> : <Share2 className="w-4 h-4 text-black" />}
          <span>{copiedShare ? 'COPIED TO CLIPBOARD!' : 'SHARE SCORECARD'}</span>
        </button>
      </div>

      {/* CHALLENGE SELECTOR CAROUSEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BUILD_CHALLENGES.map((challenge) => {
          const isSelected = activeChallengeId === challenge.id;
          return (
            <button
              key={challenge.id}
              onClick={() => setActiveChallengeId(challenge.id)}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                isSelected
                  ? 'bg-zinc-950 border-amber-500 shadow-xl shadow-amber-500/10'
                  : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400">{challenge.code}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {challenge.difficulty} &bull; +{challenge.xpReward} XP
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white">{challenge.title}</h2>
              <p className="text-xs text-zinc-400">{challenge.objectiveText}</p>
              <div className="text-xs font-mono font-bold text-emerald-400 pt-1">
                Target Budget: {formatINR(challenge.budgetINR)}
              </div>
            </button>
          );
        })}
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: CONFIGURATOR (LEFT) vs SCORECARD (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: INTERACTIVE CONFIGURATOR (7 COLS) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                QUEST CONFIGURATOR
              </span>
              <h2 className="text-lg font-bold text-white">Assemble Component Parts</h2>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Total Cost: {formatINR(scoreResult.totalCostINR)} / {formatINR(currentChallenge.budgetINR)}
            </span>
          </div>

          {/* CPU Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              1. Select Processor (CPU)
            </label>
            <select
              value={userConfig.cpuId}
              onChange={(e) => setUserConfig({ ...userConfig, cpuId: e.target.value })}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none cursor-pointer"
            >
              {cpus.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.Model} ({c.Cores_Threads}, {c.Socket}) &bull; {formatINR(c.Price_INR)}
                </option>
              ))}
            </select>
          </div>

          {/* GPU Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              2. Select Graphics Card (GPU)
            </label>
            <select
              value={userConfig.gpuId}
              onChange={(e) => setUserConfig({ ...userConfig, gpuId: e.target.value })}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none cursor-pointer"
            >
              {gpus.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.Model} ({g.VRAM_GB}GB VRAM) &bull; {formatINR(g.Price_INR)}
                </option>
              ))}
            </select>
          </div>

          {/* RAM & Storage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                System RAM Capacity
              </label>
              <select
                value={userConfig.ramGb}
                onChange={(e) => setUserConfig({ ...userConfig, ramGb: Number(e.target.value) })}
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value={16}>16GB Dual Channel</option>
                <option value={32}>32GB Dual Channel (Recommended)</option>
                <option value={64}>64GB Dual Channel</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                NVMe Storage Capacity
              </label>
              <select
                value={userConfig.storageGb}
                onChange={(e) => setUserConfig({ ...userConfig, storageGb: Number(e.target.value) })}
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value={500}>500GB NVMe SSD</option>
                <option value={1000}>1TB PCIe 4.0 NVMe SSD</option>
                <option value={2000}>2TB PCIe 4.0 NVMe SSD</option>
              </select>
            </div>
          </div>

          {/* PSU & Wi-Fi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Power Supply (PSU) Wattage
              </label>
              <select
                value={userConfig.psuWatts}
                onChange={(e) => setUserConfig({ ...userConfig, psuWatts: Number(e.target.value) })}
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value={550}>550W 80+ Bronze</option>
                <option value={650}>650W 80+ Bronze / Gold</option>
                <option value={750}>750W 80+ Gold ATX 3.0</option>
                <option value={850}>850W 80+ Gold ATX 3.0</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Motherboard Wi-Fi Support
              </label>
              <button
                onClick={() => setUserConfig({ ...userConfig, wifiEnabled: !userConfig.wifiEnabled })}
                className={`w-full p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  userConfig.wifiEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}
              >
                <span>Wi-Fi 6 Onboard Support</span>
                <span>{userConfig.wifiEnabled ? 'ENABLED' : 'DISABLED'}</span>
              </button>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              MANDATORY REQUIREMENT CHECKLIST
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {scoreResult.requirementChecklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/80">
                  {item.met ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={item.met ? 'text-white' : 'text-zinc-400'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ARCHITECT SCORECARD (5 COLS) */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-zinc-950 border-2 border-amber-500/40 space-y-6 shadow-2xl">
          <div className="space-y-1 border-b border-zinc-800 pb-4 text-center">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-widest block">
              FINAL EVALUATION SCORECARD
            </span>
            <div className="text-4xl font-black text-white pt-1">
              Tier <span className="text-amber-400">{scoreResult.rankTier}</span>
            </div>
            <div className="text-sm font-bold text-zinc-400">
              Composite Score: {scoreResult.scores.totalComposite} / 100
            </div>
          </div>

          {/* NON-PRESCRIPTIVE METRICS BREAKDOWN */}
          <div className="space-y-3.5 text-xs">
            {/* Budget Utilization */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-white">Budget Utilization</span>
                <span className="text-emerald-400">{scoreResult.scores.budgetUtilization}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${scoreResult.scores.budgetUtilization}%` }}
                />
              </div>
            </div>

            {/* Performance Estimate */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-white">Performance Estimate</span>
                <span className="text-cyan-400">{scoreResult.scores.performanceEstimate}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${scoreResult.scores.performanceEstimate}%` }}
                />
              </div>
            </div>

            {/* Power Efficiency */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-white">Power Efficiency</span>
                <span className="text-amber-400">{scoreResult.scores.powerEfficiency}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${scoreResult.scores.powerEfficiency}%` }}
                />
              </div>
            </div>

            {/* Upgrade Headroom */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-white">Upgrade Headroom</span>
                <span className="text-purple-400">{scoreResult.scores.upgradeHeadroom}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full"
                  style={{ width: `${scoreResult.scores.upgradeHeadroom}%` }}
                />
              </div>
            </div>

            {/* Compatibility Checks */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-white">Compatibility Checks</span>
                <span className="text-blue-400">{scoreResult.scores.compatibilityChecks}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${scoreResult.scores.compatibilityChecks}%` }}
                />
              </div>
            </div>
          </div>

          {/* Feedback Card */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1">
            <span className="font-bold text-amber-400 block">Architect Review Feedback</span>
            <p className="text-zinc-300 leading-relaxed">{scoreResult.summaryFeedback}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
