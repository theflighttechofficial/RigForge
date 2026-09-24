import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CommunityBuild,
  getStoredCommunityBuilds,
  saveCommunityBuild,
  toggleLikeCommunityBuild,
  incrementForkCommunityBuild
} from '../data/communityGalleryData';
import { CPUItem, GPUItem } from '../types';
import { formatINR } from '../utils/formatters';
import {
  GitFork,
  Heart,
  Box,
  Wrench,
  Search,
  PlusCircle,
  Share2,
  Sparkles,
  Users,
  MessageSquare,
  Tag,
  Check,
  X,
  Layers,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Flame,
  ArrowUpRight
} from 'lucide-react';

interface CommunityBuildGalleryProps {
  cpus: CPUItem[];
  gpus: GPUItem[];
  onForkToBuilder?: (build: CommunityBuild) => void;
  onOpen3DView?: (build: CommunityBuild) => void;
  theme?: 'dark' | 'light';
}

export const CommunityBuildGallery: React.FC<CommunityBuildGalleryProps> = ({
  cpus,
  gpus,
  onForkToBuilder,
  onOpen3DView,
  theme = 'dark'
}) => {
  const [builds, setBuilds] = useState<CommunityBuild[]>(() => getStoredCommunityBuilds());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for Publishing Build
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newTag, setNewTag] = useState<CommunityBuild['tag']>('Gaming');
  const [newCpuId, setNewCpuId] = useState<string>(cpus[0]?.id || '');
  const [newGpuId, setNewGpuId] = useState<string>(gpus[0]?.id || '');
  const [newRam, setNewRam] = useState<string>('32GB (2x16GB) DDR5-6000 CL30');
  const [newStorage, setNewStorage] = useState<string>('2TB PCIe 4.0 NVMe SSD');
  const [newDescription, setNewDescription] = useState<string>('');

  // Filtered builds
  const filteredBuilds = useMemo(() => {
    return builds.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.specs.cpu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.specs.gpu.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === 'ALL' || b.tag === selectedTag;
      return matchesSearch && matchesTag;
    });
  }, [builds, searchQuery, selectedTag]);

  // Handle Like Action
  const handleLike = (id: string) => {
    const updated = toggleLikeCommunityBuild(id);
    setBuilds(updated);
  };

  // Handle Fork Action
  const handleFork = (build: CommunityBuild) => {
    const updated = incrementForkCommunityBuild(build.id);
    setBuilds(updated);
    onForkToBuilder?.(build);
  };

  // Handle Share Action
  const handleShare = (build: CommunityBuild) => {
    const shareText = `${build.title} by ${build.author}\n` +
      `Specs: ${build.specs.cpu} | ${build.specs.gpu} | ${build.specs.ram}\n` +
      `Price: ${formatINR(build.totalPriceINR)}\n` +
      `Explore on Silicon PC Builder Community Gallery!`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(build.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Handle Publish Form Submission
  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor) return;

    const chosenCpu = cpus.find((c) => c.id === newCpuId) || cpus[0];
    const chosenGpu = gpus.find((g) => g.id === newGpuId) || gpus[0];

    const totalPrice = (chosenCpu?.Price_INR || 0) + (chosenGpu?.Price_INR || 0) + 10500 + 7500 + 12500 + 6500 + 4500;

    const publishedBuild: CommunityBuild = {
      id: `build-user-${Date.now()}`,
      title: newTitle.toUpperCase().startsWith('🖥️') ? newTitle : `🖥️ ${newTitle.toUpperCase()}`,
      author: newAuthor,
      authorRole: 'Community Architect',
      likes: 1,
      forksCount: 0,
      tag: newTag,
      totalPriceINR: totalPrice,
      specs: {
        cpu: chosenCpu ? `${chosenCpu.Model}` : 'Custom CPU',
        gpu: chosenGpu ? `${chosenGpu.Model}` : 'Custom GPU',
        ram: newRam,
        storage: newStorage,
        motherboard: 'B650 / B760 Gaming Wi-Fi',
        psu: '750W 80+ Gold Fully Modular ATX 3.0',
        case: 'Mid-Tower ARGB Airflow Chassis'
      },
      description: newDescription || 'Custom custom community build shared via Silicon PC Builder.',
      publishedAt: 'Just now',
      commentsCount: 0
    };

    const updated = saveCommunityBuild(publishedBuild);
    setBuilds(updated);
    setShowPublishModal(false);
    // Reset form
    setNewTitle('');
    setNewAuthor('');
    setNewDescription('');
  };

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 font-mono">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                GitHub for PC Builds
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                COMMUNITY GALLERY
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Community Build Social Layer
            </h1>
          </div>
        </div>

        {/* Publish Action Button */}
        <button
          onClick={() => setShowPublishModal(true)}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/10 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-black" />
          <span>PUBLISH YOUR BUILD</span>
        </button>
      </div>

      {/* SEARCH AND TAG FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search builds by name, author, CPU (e.g. 7800X3D), or GPU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'Gaming', 'AI / ML', 'Workstation', 'Budget', 'Minimalist', 'RGB Monster'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* BUILD CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuilds.map((build) => (
          <motion.div
            key={build.id}
            whileHover={{ y: -4 }}
            className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/40 transition-all space-y-5 shadow-xl flex flex-col justify-between"
          >
            {/* Card Header: Title, Tag, Author */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {build.tag}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">{build.publishedAt}</span>
              </div>

              <div>
                <h2 className="text-lg font-black text-white leading-snug tracking-tight">
                  {build.title}
                </h2>
                <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                  <span className="text-zinc-500">By</span>
                  <strong className="text-zinc-200">{build.author}</strong>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-cyan-400/80 text-[11px]">{build.authorRole}</span>
                </div>
              </div>

              {/* SPECIFICATION CARD (Clean User-Requested Style) */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-500">CPU</span>
                  <strong className="text-white font-bold">{build.specs.cpu}</strong>
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-500">GPU</span>
                  <strong className="text-emerald-400 font-bold">{build.specs.gpu}</strong>
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-500">RAM</span>
                  <strong className="text-purple-300">{build.specs.ram}</strong>
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-500">SSD</span>
                  <strong className="text-amber-300">{build.specs.storage}</strong>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-xs text-zinc-400 uppercase font-bold">Total Cost</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatINR(build.totalPriceINR)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed italic line-clamp-2">
                "{build.description}"
              </p>
            </div>

            {/* ACTION BAR: 3D VIEW | OPEN / FORK BUILD | LIKES */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {/* 3D View Button */}
                <button
                  onClick={() => onOpen3DView?.(build)}
                  className="px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D VIEW</span>
                </button>

                {/* Fork Build Button */}
                <button
                  onClick={() => handleFork(build)}
                  className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>FORK BUILD</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                {/* Like / Star */}
                <button
                  onClick={() => handleLike(build.id)}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                  <span className="font-bold">{build.likes} Likes</span>
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{build.forksCount} forks</span>
                  </span>

                  <button
                    onClick={() => handleShare(build)}
                    className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedId === build.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* PUBLISH BUILD MODAL */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-6 font-mono"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">Publish Rig to Community Gallery</h2>
                </div>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePublishSubmit} className="space-y-4 text-xs">
                {/* Title & Author */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 block">Build Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VARUN'S BLACKOUT BUILD"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-400 block">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Varun Sharma"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-400 block">Category Tag</label>
                    <select
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value as any)}
                      className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Gaming">Gaming</option>
                      <option value="AI / ML">AI / ML</option>
                      <option value="Workstation">Workstation</option>
                      <option value="Budget">Budget</option>
                      <option value="Minimalist">Minimalist</option>
                      <option value="RGB Monster">RGB Monster</option>
                    </select>
                  </div>
                </div>

                {/* CPU & GPU Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 block">Select Processor (CPU)</label>
                  <select
                    value={newCpuId}
                    onChange={(e) => setNewCpuId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none cursor-pointer"
                  >
                    {cpus.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.Model} ({formatINR(c.Price_INR)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 block">Select Graphics Card (GPU)</label>
                  <select
                    value={newGpuId}
                    onChange={(e) => setNewGpuId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none cursor-pointer"
                  >
                    {gpus.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.Model} ({formatINR(g.Price_INR)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 block">Architect Notes / Story</label>
                  <textarea
                    rows={3}
                    placeholder="Describe tuning choices, airflow direction, or budget optimization decisions..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(false)}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold cursor-pointer"
                  >
                    Publish Build
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
