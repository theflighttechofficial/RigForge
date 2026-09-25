import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab, ComponentCategory, HardwareItem, CPUItem, GPUItem } from './types';
import { cpuDataset, gpuDataset } from './data/hardwareData';
import { getCachedHardware, setCachedHardware } from './utils/hardwareCache';
import { Header } from './components/Header';
import { PerformanceMatrix } from './components/PerformanceMatrix';
import { HeadToHead } from './components/HeadToHead';
import { SynergyLab } from './components/SynergyLab';
import { RigArchitect } from './components/RigArchitect';
import { HardwareCatalog } from './components/HardwareCatalog';
import { UpgradeROI } from './components/UpgradeROI';
import { RunningCostLab } from './components/RunningCostLab';
import { IntroPage } from './components/IntroPage';
import { ComponentDetailsModal } from './components/ComponentDetailsModal';
import { LiveBenchmarkLab } from './components/LiveBenchmarkLab';
import { LoadingScreen } from './components/LoadingScreen';
import { SiliconOSIntro } from './components/SiliconOSIntro';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BattlestationSimulator } from './components/BattlestationSimulator';
import { ComponentAnatomy } from './components/ComponentAnatomy';
import { Spatial3DStudio } from './components/Spatial3DStudio';
import { AIBuildDoctor } from './components/AIBuildDoctor';
import { DigitalTwinDashboard } from './components/DigitalTwinDashboard';
import { StoragePerformanceLab } from './components/StoragePerformanceLab';
import { RAMConfigurationLab } from './components/RAMConfigurationLab';
import { BuildCostOptimizer } from './components/BuildCostOptimizer';
import { BuildChallengeMode } from './components/BuildChallengeMode';
import { CommunityBuildGallery } from './components/CommunityBuildGallery';
import { TroubleshootingWizard } from './components/TroubleshootingWizard';

const TAB_DISPLAY_NAMES: Record<ActiveTab, string> = {
  intro: 'System Overview & Architecture Guide',
  digitaltwin: 'My Rig // PC Build Digital Twin Centerpiece',
  doctor: 'AI Build Doctor // Silicon Diagnostic Assistant',
  matrix: '2D Price-to-Performance Matrix',
  compare: 'Head-to-Head Component Duel',
  synergy: 'Synergy & Bottleneck Diagnostic Lab',
  storagelab: 'Storage Performance Lab // HDD vs. SATA vs. NVMe PCIe 3/4/5',
  ramlab: 'RAM Configuration Lab // Frequency, CL Timings & Bandwidth',
  costoptimizer: 'Build Cost Optimizer // Objective Budget Allocation Engine',
  challengemode: 'PC Build Challenge Mode // Gamified Builder Quests',
  community: 'Community Build Gallery // GitHub for PC Builds',
  troubleshoot: 'PC Troubleshooting Wizard // Decision Tree Diagnostic Engine',
  builder: 'Rig Architect // Indian PC Builder',
  spatial3d: 'Immersive 3D Assembly & AR Studio',
  battlestation: 'Dream Setup Battlestation Simulator',
  anatomy: 'PC Component Anatomy & Architecture Guide',
  benchmarks: 'Live Real-Time Benchmark Lab',
  roi: 'Generational Upgrade ROI Engine',
  cost: 'Indian Electricity & TCO Calculator',
  catalog: 'Complete Hardware Spec Database'
};

export default function App() {
  // Navigation stages: 'landing' (opens first) -> 'app' (main website experience)
  const [appStage, setAppStage] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<ActiveTab>('intro');
  const [category, setCategory] = useState<ComponentCategory>('CPU');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTargetTab, setLoadingTargetTab] = useState<ActiveTab>('intro');
  const [loadingDisplayName, setLoadingDisplayName] = useState<string>('System Overview & Architecture Guide');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);

  // Global theme state ('dark' or 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('silicon_matrix_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    try {
      localStorage.setItem('silicon_matrix_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Warm IndexedDB local silicon dataset cache
  useEffect(() => {
    getCachedHardware().then(cached => {
      if (!cached) {
        setCachedHardware(cpuDataset, gpuDataset);
      }
    });
  }, []);

  // Scroll window to top whenever activeTab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [activeTab]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Cross-view state links
  const [duelItemA, setDuelItemA] = useState<HardwareItem | undefined>(undefined);
  const [duelItemB, setDuelItemB] = useState<HardwareItem | undefined>(undefined);
  const [synergyCpuId, setSynergyCpuId] = useState<string>('cpu-amd-7800x3d');
  const [synergyGpuId, setSynergyGpuId] = useState<string>('gpu-nvidia-4070-super');
  const [modalItem, setModalItem] = useState<HardwareItem | null>(null);

  // 3D Spatial Hardware Selection
  const [spatialCpu, setSpatialCpu] = useState<CPUItem>(
    () => cpuDataset.find((c) => c.id === 'cpu-amd-7800x3d') || cpuDataset[0]
  );
  const [spatialGpu, setSpatialGpu] = useState<GPUItem>(
    () => gpuDataset.find((g) => g.id === 'gpu-nvidia-4070-super') || gpuDataset[0]
  );

  // Global Quick Hardware Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K opens quick hardware finder
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Launch transition from Landing Page into the Website
  const handleLaunchFromLanding = (targetTab: ActiveTab = 'intro') => {
    setLoadingTargetTab(targetTab);
    setLoadingDisplayName(TAB_DISPLAY_NAMES[targetTab] || 'System Overview & Architecture Guide');
    setIsLoading(true);
  };

  // Switch tabs
  const handleEnterWorkspace = (targetTab: ActiveTab = 'matrix', targetCat?: ComponentCategory) => {
    if (targetCat) {
      setCategory(targetCat);
    }
    setActiveTab(targetTab);
  };

  // Select a preset from Intro or presets menu
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setActiveTab('builder');
    showToast('Loaded Turnkey Preset into Rig Architect');
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setAppStage('app');
    setActiveTab(loadingTargetTab);
    showToast(`Mounted: ${loadingDisplayName}`);
  };

  const handleSelectForCompare = (item: HardwareItem) => {
    setCategory(item.category);
    if (!duelItemA) {
      setDuelItemA(item);
    } else {
      setDuelItemB(item);
    }
    setActiveTab('compare');
    showToast(`Loaded ${item.Model} into Head-to-Head Duel!`);
  };

  const handleSelectForSynergy = (item: HardwareItem) => {
    if (item.category === 'CPU') {
      setSynergyCpuId(item.id);
    } else {
      setSynergyGpuId(item.id);
    }
    setActiveTab('synergy');
    showToast(`Loaded ${item.Model} into Synergy & Bottleneck Lab!`);
  };

  // 1. Initial Animated Landing Page Experience (Opens First)
  if (appStage === 'landing') {
    return (
      <div
        className={`min-h-screen w-full selection:bg-cyan-500 selection:text-black transition-colors duration-200 ${
          theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-zinc-950 text-zinc-100'
        }`}
      >
        {/* Launch Animation: Plays LoadingScreen when Launch is clicked on Landing Page */}
        {isLoading && (
          <LoadingScreen
            targetTabName={loadingDisplayName}
            onComplete={handleLoadingComplete}
          />
        )}
        <SiliconOSIntro
          onLaunch={() => handleLaunchFromLanding('intro')}
          onDirectLaunchWorkspace={(tab) => handleLaunchFromLanding((tab as ActiveTab) || 'matrix')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    );
  }

  // 2. Main Website UI Experience (Top bar navigation + content views)
  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-black transition-colors duration-200 ${
        theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* High-Tech Diagnostic Calibration Screen Overlay */}
      {isLoading && (
        <LoadingScreen
          targetTabName={loadingDisplayName}
          onComplete={handleLoadingComplete}
        />
      )}

      {/* Redesigned Clean Access Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        category={category}
        setCategory={setCategory}
        cpuCount={cpuDataset.length}
        gpuCount={gpuDataset.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => setIsSearchOpen(true)}
        onRunDiagnostics={() => {
          setLoadingTargetTab(activeTab);
          setLoadingDisplayName('Full Silicon Diagnostics Verification');
          setIsLoading(true);
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {/* Overview Content Page */}
            {activeTab === 'intro' && (
              <IntroPage
                onEnterWorkspace={handleEnterWorkspace}
                onSelectPreset={handleSelectPreset}
                totalCpus={cpuDataset.length}
                totalGpus={gpuDataset.length}
              />
            )}

            {/* PC Build Digital Twin Centerpiece */}
            {activeTab === 'digitaltwin' && (
              <DigitalTwinDashboard
                onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
                onRunAiDiagnostics={(prompt) => {
                  setActiveTab('doctor');
                }}
                onOpen3DStudio={(cpuId, gpuId) => {
                  const foundCpu = cpuDataset.find((c) => c.id === cpuId);
                  const foundGpu = gpuDataset.find((g) => g.id === gpuId);
                  if (foundCpu) setSpatialCpu(foundCpu);
                  if (foundGpu) setSpatialGpu(foundGpu);
                  setActiveTab('spatial3d');
                }}
                onOpenSynergy={(cpuId, gpuId) => {
                  setSynergyCpuId(cpuId);
                  setSynergyGpuId(gpuId);
                  setActiveTab('synergy');
                }}
                theme={theme}
              />
            )}

            {/* AI Build Doctor */}
            {activeTab === 'doctor' && (
              <AIBuildDoctor
                onNavigateToBuilder={(cpuId, gpuId) => {
                  setSynergyCpuId(cpuId);
                  setSynergyGpuId(gpuId);
                  setActiveTab('builder');
                }}
                onNavigateToSynergy={(cpuId, gpuId) => {
                  setSynergyCpuId(cpuId);
                  setSynergyGpuId(gpuId);
                  setActiveTab('synergy');
                }}
              />
            )}

            {/* 2D Value Matrix */}
            {activeTab === 'matrix' && (
              <PerformanceMatrix
                category={category}
                items={category === 'CPU' ? cpuDataset : gpuDataset}
                onSelectForCompare={handleSelectForCompare}
                onSelectForSynergy={handleSelectForSynergy}
                onInspectDetails={setModalItem}
              />
            )}

            {/* Head-to-Head Component Duel */}
            {activeTab === 'compare' && (
              <HeadToHead
                category={category}
                setCategory={setCategory}
                cpus={cpuDataset}
                gpus={gpuDataset}
                defaultItemA={duelItemA}
                defaultItemB={duelItemB}
                onOpenDetails={setModalItem}
              />
            )}

            {/* Synergy Lab */}
            {activeTab === 'synergy' && (
              <SynergyLab
                cpus={cpuDataset}
                gpus={gpuDataset}
                initialCpuId={synergyCpuId}
                initialGpuId={synergyGpuId}
                onOpenBuildDoctor={() => {
                  setActiveTab('doctor');
                }}
              />
            )}

            {/* Storage Performance Lab */}
            {activeTab === 'storagelab' && (
              <StoragePerformanceLab
                onNavigateToBuilder={() => setActiveTab('builder')}
                theme={theme}
              />
            )}

            {/* RAM Configuration Lab */}
            {activeTab === 'ramlab' && (
              <RAMConfigurationLab
                onNavigateToBuilder={() => setActiveTab('builder')}
                theme={theme}
              />
            )}

            {/* Build Cost Optimizer */}
            {activeTab === 'costoptimizer' && (
              <BuildCostOptimizer
                cpus={cpuDataset}
                gpus={gpuDataset}
                onNavigateToBuilder={(presetId) => {
                  if (presetId) setSelectedPresetId(presetId);
                  setActiveTab('builder');
                }}
                theme={theme}
              />
            )}

            {/* PC Build Challenge Mode */}
            {activeTab === 'challengemode' && (
              <BuildChallengeMode
                cpus={cpuDataset}
                gpus={gpuDataset}
                onNavigateToBuilder={() => setActiveTab('builder')}
                theme={theme}
              />
            )}

            {/* Community Build Gallery */}
            {activeTab === 'community' && (
              <CommunityBuildGallery
                cpus={cpuDataset}
                gpus={gpuDataset}
                onForkToBuilder={(build) => {
                  if (build.specs.presetId) setSelectedPresetId(build.specs.presetId);
                  setActiveTab('builder');
                }}
                onOpen3DView={() => setActiveTab('spatial3d')}
                theme={theme}
              />
            )}

            {/* PC Troubleshooting Wizard */}
            {activeTab === 'troubleshoot' && (
              <TroubleshootingWizard
                onNavigateToBuilder={() => setActiveTab('builder')}
                theme={theme}
              />
            )}

            {/* Rig Architect Indian PC Builder */}
            {activeTab === 'builder' && (
              <RigArchitect
                cpus={cpuDataset}
                gpus={gpuDataset}
                presetId={selectedPresetId}
              />
            )}

            {/* 3D Assembly, Airflow, Clearance & AR Studio */}
            {activeTab === 'spatial3d' && (
              <Spatial3DStudio
                selectedCpu={spatialCpu}
                selectedGpu={spatialGpu}
                allCpus={cpuDataset}
                allGpus={gpuDataset}
                onSelectCpu={setSpatialCpu}
                onSelectGpu={setSpatialGpu}
                onOpenRigArchitect={() => setActiveTab('builder')}
                theme={theme}
              />
            )}

            {/* Dream Setup Battlestation Simulator */}
            {activeTab === 'battlestation' && (
              <BattlestationSimulator
                cpus={cpuDataset}
                gpus={gpuDataset}
                onOpenArchitect={() => setActiveTab('builder')}
              />
            )}

            {/* PC Component Anatomy & Deep Dive */}
            {activeTab === 'anatomy' && (
              <ComponentAnatomy />
            )}

            {/* Live Real-Time Benchmark Lab */}
            {activeTab === 'benchmarks' && (
              <LiveBenchmarkLab
                cpus={cpuDataset}
                gpus={gpuDataset}
              />
            )}

            {/* Generational Upgrade ROI Engine */}
            {activeTab === 'roi' && (
              <UpgradeROI
                cpus={cpuDataset}
                gpus={gpuDataset}
              />
            )}

            {/* Indian Electricity & TCO Calculator */}
            {activeTab === 'cost' && (
              <RunningCostLab
                cpus={cpuDataset}
                gpus={gpuDataset}
              />
            )}

            {/* Complete Hardware Spec Catalog */}
            {activeTab === 'catalog' && (
              <HardwareCatalog
                category={category}
                setCategory={setCategory}
                cpus={cpuDataset}
                gpus={gpuDataset}
                onSelectForCompare={handleSelectForCompare}
                onSelectForSynergy={handleSelectForSynergy}
                onOpenDetails={setModalItem}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Hardware Spec Detail Modal */}
      {modalItem && (
        <ComponentDetailsModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onSelectForCompare={handleSelectForCompare}
          onSelectForSynergy={handleSelectForSynergy}
        />
      )}

      {/* Global Quick Hardware Search Modal (Cmd+K / Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        cpus={cpuDataset}
        gpus={gpuDataset}
        onSelectDuel={handleSelectForCompare}
        onSelectSynergy={handleSelectForSynergy}
        onSelectArchitect={(item) => {
          setActiveTab('builder');
          showToast(`Loaded ${item.Model} into Rig Architect!`);
        }}
        onInspect={setModalItem}
      />

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-200 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
