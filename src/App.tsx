import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab, ComponentCategory, HardwareItem, CPUItem, GPUItem } from './types';
import { cpuDataset, gpuDataset } from './data/hardwareData';
import { getCachedHardware, setCachedHardware } from './utils/hardwareCache';
import { Header } from './components/Header';
import { IntroPage } from './components/IntroPage';
import { ComponentDetailsModal } from './components/ComponentDetailsModal';
import { SiliconOSIntro } from './components/SiliconOSIntro';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SiteFooter } from './components/SiteFooter';
import { ConsentBanner } from './components/ConsentBanner';
import { MobileCtaBar } from './components/MobileCtaBar';
import { PageSkeleton } from './components/Skeleton';
import { ROUTES, LANDING_META, tabFromPath } from './routes';
import { SITE } from './siteConfig';

// Each workspace loads on first visit; a skeleton fills the space meanwhile
const PerformanceMatrix = lazy(() => import('./components/PerformanceMatrix').then((m) => ({ default: m.PerformanceMatrix })));
const HeadToHead = lazy(() => import('./components/HeadToHead').then((m) => ({ default: m.HeadToHead })));
const SynergyLab = lazy(() => import('./components/SynergyLab').then((m) => ({ default: m.SynergyLab })));
const RigArchitect = lazy(() => import('./components/RigArchitect').then((m) => ({ default: m.RigArchitect })));
const HardwareCatalog = lazy(() => import('./components/HardwareCatalog').then((m) => ({ default: m.HardwareCatalog })));
const UpgradeROI = lazy(() => import('./components/UpgradeROI').then((m) => ({ default: m.UpgradeROI })));
const RunningCostLab = lazy(() => import('./components/RunningCostLab').then((m) => ({ default: m.RunningCostLab })));
const LiveBenchmarkLab = lazy(() => import('./components/LiveBenchmarkLab').then((m) => ({ default: m.LiveBenchmarkLab })));
const BattlestationSimulator = lazy(() => import('./components/BattlestationSimulator').then((m) => ({ default: m.BattlestationSimulator })));
const ComponentAnatomy = lazy(() => import('./components/ComponentAnatomy').then((m) => ({ default: m.ComponentAnatomy })));
const Spatial3DStudio = lazy(() => import('./components/Spatial3DStudio').then((m) => ({ default: m.Spatial3DStudio })));
const AIBuildDoctor = lazy(() => import('./components/AIBuildDoctor').then((m) => ({ default: m.AIBuildDoctor })));
const DigitalTwinDashboard = lazy(() => import('./components/DigitalTwinDashboard').then((m) => ({ default: m.DigitalTwinDashboard })));
const StoragePerformanceLab = lazy(() => import('./components/StoragePerformanceLab').then((m) => ({ default: m.StoragePerformanceLab })));
const RAMConfigurationLab = lazy(() => import('./components/RAMConfigurationLab').then((m) => ({ default: m.RAMConfigurationLab })));
const BuildCostOptimizer = lazy(() => import('./components/BuildCostOptimizer').then((m) => ({ default: m.BuildCostOptimizer })));
const BuildChallengeMode = lazy(() => import('./components/BuildChallengeMode').then((m) => ({ default: m.BuildChallengeMode })));
const CommunityBuildGallery = lazy(() => import('./components/CommunityBuildGallery').then((m) => ({ default: m.CommunityBuildGallery })));
const TroubleshootingWizard = lazy(() => import('./components/TroubleshootingWizard').then((m) => ({ default: m.TroubleshootingWizard })));
const MyPCSpecs = lazy(() => import('./components/MyPCSpecs').then((m) => ({ default: m.MyPCSpecs })));
const PrivacyPolicy = lazy(() => import('./components/LegalPages').then((m) => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./components/LegalPages').then((m) => ({ default: m.TermsOfService })));
const NotFoundPage = lazy(() => import('./components/SitePages').then((m) => ({ default: m.NotFoundPage })));
const ContactPage = lazy(() => import('./components/SitePages').then((m) => ({ default: m.ContactPage })));
const ThanksPage = lazy(() => import('./components/SitePages').then((m) => ({ default: m.ThanksPage })));


const THEME_KEY = 'silicon_matrix_theme_v2';

export default function App() {
  // Navigation stages: 'landing' (opens first) -> 'app' (main website experience)
  // The URL decides where a visit starts: "/" plays the landing intro, any other path opens that page directly
  const initialRoute = tabFromPath(window.location.pathname);
  const [appStage, setAppStage] = useState<'landing' | 'app'>(initialRoute === 'landing' ? 'landing' : 'app');
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialRoute === 'landing' ? 'intro' : initialRoute);
  const [category, setCategory] = useState<ComponentCategory>('CPU');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  // Parts handed to Rig Architect from other pages; the nonce remounts it with the new defaults
  const [builderParts, setBuilderParts] = useState<{ cpuId: string; gpuId: string; nonce: number } | null>(null);

  // Global theme state ('dark' or 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Light is the default. The key changed when the default did, so earlier visitors start on light once.
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
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
      localStorage.setItem(THEME_KEY, theme);
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

  // Keep the address bar, title, description and canonical link in step with the open page
  useEffect(() => {
    const route = ROUTES[activeTab];
    const path = appStage === 'landing' ? '/' : route.path;
    // A mistyped URL keeps its address so the visitor can see what went wrong
    if (activeTab !== 'notfound' && window.location.pathname !== path) {
      window.history.pushState({ tab: activeTab, stage: appStage }, '', path);
    }
    const meta = appStage === 'landing' ? LANDING_META : { title: `${route.title} | ${SITE.name}`, description: route.description };
    document.title = meta.title;
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLElement>(selector);
      if (!el) {
        el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
        const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/) ?? [];
        if (key) el.setAttribute(key, name);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', 'content', meta.description);
    setMeta('meta[property="og:title"]', 'content', meta.title);
    setMeta('meta[property="og:description"]', 'content', meta.description);
    setMeta('meta[property="og:url"]', 'content', SITE.url + path);
    setMeta('link[rel="canonical"]', 'href', SITE.url + path);
    setMeta('meta[name="robots"]', 'content', route.hidden && appStage === 'app' ? 'noindex' : 'index, follow');
  }, [activeTab, appStage]);

  // Browser back/forward buttons
  useEffect(() => {
    const onPop = () => {
      const next = tabFromPath(window.location.pathname);
      if (next === 'landing') {
        setAppStage('landing');
      } else {
        setAppStage('app');
        setActiveTab(next);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
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

  // Leave the landing intro and open the requested workspace straight away
  const handleLaunchFromLanding = (targetTab: ActiveTab = 'intro') => {
    setAppStage('app');
    setActiveTab(targetTab);
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
      className={`min-h-screen w-full flex flex-col overflow-x-hidden selection:bg-cyan-500 selection:text-black transition-colors duration-200 ${
        theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
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
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            // Cap line length on ultrawide monitors; smaller screens are unaffected
            className="w-full max-w-[1920px] mx-auto"
          >
            <Suspense fallback={<PageSkeleton />}>
            {/* Overview Content Page */}
            {activeTab === 'intro' && (
              <IntroPage
                onEnterWorkspace={handleEnterWorkspace}
                onSelectPreset={handleSelectPreset}
                onOpenSynergy={(cpuId, gpuId) => {
                  setSynergyCpuId(cpuId);
                  setSynergyGpuId(gpuId);
                  setActiveTab('synergy');
                }}
                cpus={cpuDataset}
                gpus={gpuDataset}
              />
            )}

            {/* Live scan of the user's own hardware */}
            {activeTab === 'myspecs' && (
              <MyPCSpecs
                cpus={cpuDataset}
                gpus={gpuDataset}
                onInspectDetails={setModalItem}
                onOpenPrivacy={() => setActiveTab('privacy')}
              />
            )}

            {activeTab === 'privacy' && <PrivacyPolicy />}
            {activeTab === 'contact' && <ContactPage />}
            {activeTab === 'thanks' && <ThanksPage onNavigate={setActiveTab} />}
            {activeTab === 'notfound' && <NotFoundPage onNavigate={setActiveTab} />}
            {activeTab === 'terms' && <TermsOfService />}

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
                  setSelectedPresetId(undefined);
                  setBuilderParts({ cpuId, gpuId, nonce: Date.now() });
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
                onSaved={() => setActiveTab('thanks')}
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
                key={builderParts?.nonce ?? 'default'}
                cpus={cpuDataset}
                gpus={gpuDataset}
                defaultCpuId={builderParts?.cpuId}
                defaultGpuId={builderParts?.gpuId}
                selectedPresetId={selectedPresetId}
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
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <SiteFooter onNavigate={setActiveTab} />
      <ConsentBanner onOpenPrivacy={() => setActiveTab('privacy')} />
      <MobileCtaBar activeTab={activeTab} onNavigate={setActiveTab} />

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
