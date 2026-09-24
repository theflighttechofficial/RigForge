import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TROUBLESHOOTING_CATEGORIES,
  DECISION_NODES,
  POPULAR_BSOD_CODES,
  TroubleshootingCategory,
  DecisionNode,
  DiagnosticSolution
} from '../data/troubleshootingData';
import {
  Stethoscope,
  Power,
  AlertTriangle,
  MonitorX,
  Thermometer,
  Sparkles,
  Usb,
  Wifi,
  Clock,
  HardDrive,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Search,
  ArrowRight,
  ShieldAlert,
  Wrench,
  ChevronRight,
  Info
} from 'lucide-react';

interface TroubleshootingWizardProps {
  onNavigateToBuilder?: () => void;
  theme?: 'dark' | 'light';
}

export const TroubleshootingWizard: React.FC<TroubleshootingWizardProps> = ({
  onNavigateToBuilder,
  theme = 'dark'
}) => {
  const [activeCategory, setActiveCategory] = useState<TroubleshootingCategory | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [historyNodeIds, setHistoryNodeIds] = useState<string[]>([]);
  const [activeSolution, setActiveSolution] = useState<DiagnosticSolution | null>(null);

  // BSOD Search State
  const [bsodSearchQuery, setBsodSearchQuery] = useState<string>('');

  // Start Category Diagnostic
  const handleStartCategory = (category: TroubleshootingCategory) => {
    setActiveCategory(category);
    setCurrentNodeId(category.startNodeId);
    setHistoryNodeIds([category.startNodeId]);
    setActiveSolution(null);
  };

  // Reset Diagnostic Flow
  const handleReset = () => {
    setActiveCategory(null);
    setCurrentNodeId(null);
    setHistoryNodeIds([]);
    setActiveSolution(null);
  };

  // Select Option Answer
  const handleSelectOption = (option: DecisionNode['options'][number]) => {
    if (option.solution) {
      setActiveSolution(option.solution);
      setCurrentNodeId(null);
    } else if (option.nextStepId) {
      setCurrentNodeId(option.nextStepId);
      setHistoryNodeIds((prev) => [...prev, option.nextStepId!]);
    }
  };

  // Filter BSOD Search
  const filteredBsodCodes = useMemo(() => {
    if (!bsodSearchQuery) return POPULAR_BSOD_CODES;
    return POPULAR_BSOD_CODES.filter(
      (b) =>
        b.code.toLowerCase().includes(bsodSearchQuery.toLowerCase()) ||
        b.commonName.toLowerCase().includes(bsodSearchQuery.toLowerCase()) ||
        b.likelyCause.toLowerCase().includes(bsodSearchQuery.toLowerCase())
    );
  }, [bsodSearchQuery]);

  // Current Node
  const currentNode = currentNodeId ? DECISION_NODES[currentNodeId] : null;

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 font-mono">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-black shrink-0">
            <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
                Interactive Decision Tree
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300">
                TROUBLESHOOTING WIZARD
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              PC Hardware Diagnostic Assistant
            </h1>
          </div>
        </div>

        {/* Reset Diagnostic */}
        {activeCategory && (
          <button
            onClick={handleReset}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-700"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>START OVER / CHOOSE DIFFERENT ISSUE</span>
          </button>
        )}
      </div>

      {/* STEP 1: CATEGORY SELECTION (IF NOT IN DIAGNOSTIC FLOW) */}
      {!activeCategory && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              What seems to be wrong with your PC?
            </h2>
            <p className="text-xs text-zinc-400">
              Select a hardware symptom below to launch the step-by-step diagnostic decision tree.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TROUBLESHOOTING_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleStartCategory(cat)}
                className="p-6 rounded-3xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-rose-500/50 text-left transition-all cursor-pointer space-y-3 group shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-rose-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{cat.description}</p>
                </div>

                <div className="pt-3 flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
                  <span>Start Diagnostic</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          {/* BSOD QUICK LOOKUP TOOL */}
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6 shadow-2xl mt-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-xs text-rose-400 font-bold uppercase tracking-widest block">
                  QUICK STOP-CODE DATABASE
                </span>
                <h2 className="text-xl font-extrabold text-white">Blue Screen (BSOD) Error Code Lookup</h2>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search BSOD code (e.g. IRQL, MEMORY)..."
                  value={bsodSearchQuery}
                  onChange={(e) => setBsodSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBsodCodes.map((entry) => (
                <div
                  key={entry.code}
                  className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                      {entry.code}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-bold">{entry.commonName}</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    <strong className="text-zinc-500">Likely Cause:</strong> {entry.likelyCause}
                  </p>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1 text-xs">
                    <span className="text-rose-400 font-bold block">Recommended Action Steps:</span>
                    {entry.fixProcedure.map((step, idx) => (
                      <div key={idx} className="text-zinc-400">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ACTIVE DIAGNOSTIC FLOW */}
      {activeCategory && (
        <div className="space-y-8">
          {/* Active Category Header */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 uppercase font-bold">Active Diagnostic:</span>
              <strong className="text-sm font-extrabold text-white">{activeCategory.title}</strong>
            </div>
            <span className="text-xs font-mono text-zinc-500">Step {historyNodeIds.length}</span>
          </div>

          {/* QUESTION NODE CARD */}
          {currentNode && !activeSolution && (
            <motion.div
              key={currentNode.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 sm:p-10 rounded-3xl bg-zinc-950 border-2 border-rose-500/30 space-y-8 shadow-2xl max-w-3xl mx-auto"
            >
              <div className="space-y-2 text-center">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block">
                  DIAGNOSTIC QUESTION
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  {currentNode.question}
                </h2>
                {currentNode.contextNote && (
                  <p className="text-xs text-zinc-400 max-w-xl mx-auto pt-1">
                    💡 {currentNode.contextNote}
                  </p>
                )}
              </div>

              {/* Option Selection Buttons */}
              <div className="space-y-3">
                {currentNode.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    className="w-full p-4 sm:p-5 rounded-2xl bg-zinc-900 hover:bg-rose-950/80 border border-zinc-800 hover:border-rose-500 text-left transition-all cursor-pointer font-bold text-sm text-white flex items-center justify-between group shadow-md"
                  >
                    <span>{opt.label}</span>
                    <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* FINAL DIAGNOSTIC SOLUTION & ACTION PLAN */}
          {activeSolution && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-10 rounded-3xl bg-zinc-950 border-2 border-emerald-500/40 space-y-8 shadow-2xl max-w-4xl mx-auto font-mono"
            >
              {/* Solution Title & Component */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
                      DIAGNOSIS COMPLETE
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        activeSolution.severity === 'Critical' || activeSolution.severity === 'High'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {activeSolution.severity} Severity
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1">{activeSolution.title}</h2>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center shrink-0">
                  <span className="text-[10px] text-zinc-500 font-bold block">RESPONSIBLE MODULE</span>
                  <span className="text-sm font-black text-rose-400">{activeSolution.responsibleComponent}</span>
                </div>
              </div>

              {/* Probable Cause */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                <span className="text-xs text-rose-400 font-bold uppercase block">Root Cause Analysis</span>
                <p className="text-xs text-zinc-200 leading-relaxed">{activeSolution.probableCause}</p>
              </div>

              {/* Action Steps Guide */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span>Step-by-step Resolution Procedure</span>
                </h3>

                <div className="space-y-2.5">
                  {activeSolution.actionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 text-xs text-zinc-200 leading-relaxed font-mono"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preventative Tip */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                <strong className="font-bold uppercase tracking-wider text-emerald-400 block">
                  💡 Hardware Architect Preventative Tip
                </strong>
                <p>{activeSolution.preventativeTip}</p>
              </div>

              {/* Restart or Builder Redirect */}
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Troubleshoot Another Issue</span>
                </button>

                <button
                  onClick={() => onNavigateToBuilder?.()}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Open Rig Architect to Replace Component</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
