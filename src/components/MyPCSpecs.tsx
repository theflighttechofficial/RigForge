import React, { useCallback, useEffect, useState } from 'react';
import { Cpu, MemoryStick, HardDrive, Wifi, Monitor, RefreshCw, Database, AlertTriangle, CheckCircle2, Cable, ShieldCheck, Copy } from './icons';
import type { SystemSpecsReport, UserHardwareEntry } from '../../systemSpecs';
import { SkeletonBlock } from './Skeleton';
import { CPUItem, GPUItem, HardwareItem } from '../types';

interface MyPCSpecsProps {
  cpus: CPUItem[];
  gpus: GPUItem[];
  onInspectDetails: (item: HardwareItem) => void;
  onOpenPrivacy?: () => void;
}

// Limited data a browser can see on its own, used when the local scan API is unreachable
interface BrowserProbe {
  threads: number | null;
  memoryGB: number | null;
  gpuRenderer: string | null;
  gpuVendor: string | null;
  connection: string | null;
  platform: string;
}

function probeBrowser(): BrowserProbe {
  let gpuRenderer: string | null = null;
  let gpuVendor: string | null = null;
  try {
    const gl = document.createElement('canvas').getContext('webgl') as WebGLRenderingContext | null;
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    if (gl && ext) {
      gpuRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      gpuVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
    }
  } catch {
    // WebGL unavailable
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string; downlink?: number } };
  return {
    threads: nav.hardwareConcurrency || null,
    memoryGB: nav.deviceMemory ?? null,
    gpuRenderer,
    gpuVendor,
    connection: nav.connection?.effectiveType ? `${nav.connection.effectiveType} (~${nav.connection.downlink} Mbps)` : null,
    platform: nav.platform
  };
}

// Survives unmounting (tab switches) but not a page reload, by design
const sessionCache = new Map<string, unknown>();

function useSessionState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => (sessionCache.has(key) ? (sessionCache.get(key) as T) : initial));
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        sessionCache.set(key, resolved);
        return resolved;
      });
    },
    [key]
  );
  return [value, set];
}

type AgentOs = 'windows' | 'mac' | 'linux';

function detectOs(): AgentOs {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const p = `${nav.userAgentData?.platform || ''} ${nav.platform} ${nav.userAgent}`.toLowerCase();
  return /mac/.test(p) ? 'mac' : /linux|x11|cros/.test(p) && !/android/.test(p) ? 'linux' : 'windows';
}

// Static hosts answer /api/* with index.html or an empty 404, which res.json() cannot parse
async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`The scan API is not running on this host (HTTP ${res.status}). Deploy the Node server (server.ts), not only the static build.`);
  }
}

const fmtGB = (gb: number) => (gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb} GB`);

const Card: React.FC<{ title: string; icon: React.FC<{ className?: string }>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cyan-400">
      <Icon className="h-4 w-4" />
      {title}
    </h3>
    {children}
  </section>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between gap-4 border-b border-zinc-800/60 py-1.5 text-sm last:border-0">
    <span className="text-zinc-400">{label}</span>
    <span className="text-right font-mono text-zinc-100">{value ?? 'n/a'}</span>
  </div>
);

const CatalogBadge: React.FC<{ item?: HardwareItem; onInspect: (item: HardwareItem) => void }> = ({ item, onInspect }) =>
  item ? (
    <button
      onClick={() => onInspect(item)}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
    >
      <CheckCircle2 className="h-3.5 w-3.5" /> In catalog: {item.Model}
    </button>
  ) : (
    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
      <Database className="h-3.5 w-3.5" /> Not in catalog, saved to hardware database
    </span>
  );

export const MyPCSpecs: React.FC<MyPCSpecsProps> = ({ cpus, gpus, onInspectDetails, onOpenPrivacy }) => {
  // State lives in a module-level session cache so switching tabs keeps the scan until the page reloads
  const [report, setReport] = useSessionState('report', null as SystemSpecsReport | null);
  const [db, setDb] = useSessionState('db', [] as UserHardwareEntry[]);
  const [error, setError] = useSessionState('error', null as string | null);
  const [scanning, setScanning] = useSessionState('scanning', false);
  const [consent, setConsent] = useSessionState('consent', 'ask' as 'ask' | 'granted' | 'declined');
  const [agent, setAgent] = useSessionState('agent', null as { token: string; agentUrl: string } | null);
  const [copied, setCopied] = useState(false);
  const [agentOs, setAgentOs] = useSessionState('agentOs', detectOs());
  const [browser, setBrowser] = useSessionState('browser', null as BrowserProbe | null);

  const loadDb = useCallback(async () => {
    const dbRes = await fetch('/api/user-hardware-db');
    if (dbRes.ok) setDb(await readJson(dbRes).catch(() => []));
  }, []);

  // Runs only after the user grants permission
  const scan = useCallback(async () => {
    setConsent('granted');
    setBrowser(probeBrowser());
    setScanning(true);
    setError(null);
    setReport(null);
    try {
      const sessionRes = await fetch('/api/system-specs/session', { method: 'POST' });
      const session = await readJson(sessionRes);
      if (!sessionRes.ok) throw new Error(session.error || `Could not start scan (${sessionRes.status})`);
      if (session.local) {
        // Site runs on this PC, so the server can read the hardware directly
        const res = await fetch('/api/system-specs');
        const body = await readJson(res);
        if (!res.ok) throw new Error(body.error || `Scan failed (${res.status})`);
        setReport(body);
        setScanning(false);
        await loadDb();
      } else {
        setAgent({ token: session.token, agentUrl: session.agentUrl });
      }
    } catch (err: any) {
      setError(err?.message || 'Scan failed');
      setScanning(false);
    }
  }, [loadDb]);

  // Hosted flow: wait for the agent on the user's PC to report back
  useEffect(() => {
    if (!agent) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/system-specs/session/${agent.token}`);
        const body = await readJson(res);
        if (!res.ok) throw new Error(body.error);
        if (body.status === 'complete') {
          clearInterval(timer);
          setReport(body.report);
          setAgent(null);
          setScanning(false);
          await loadDb();
        }
      } catch (err: any) {
        clearInterval(timer);
        setAgent(null);
        setScanning(false);
        setError(err?.message || 'Scan session expired');
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [agent, loadDb]);

  const oneLiner = !agent
    ? ''
    : agentOs === 'windows'
      ? `irm '${agent.agentUrl}' | iex`
      : `curl -fsSL '${agent.agentUrl}?os=unix' | sh`;

  const cpuMatch = report?.cpu.matchedId ? cpus.find((c) => c.id === report.cpu.matchedId) : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">My PC Specs</h2>
          <p className="text-sm text-zinc-400">
            {report
              ? `${report.system.manufacturer} ${report.system.model} · ${report.system.os} · scanned ${new Date(report.scannedAt).toLocaleTimeString()}`
              : 'Live hardware scan of this computer'}
          </p>
        </div>
        {consent === 'granted' && <button
          onClick={scan}
          disabled={scanning}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-black hover:bg-cyan-400 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning…' : 'Rescan'}
        </button>}
      </div>

      {consent !== 'granted' && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-cyan-500/30 bg-zinc-900/80 p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="h-5 w-5 text-cyan-400" /> Allow hardware scan?
          </h3>
          <p className="mt-3 text-sm text-zinc-300">This website would like to read your PC's hardware details:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
            <li>Processor, RAM type and capacity, storage drives</li>
            <li>All graphics cards (integrated and dedicated) and displays</li>
            <li>Network adapters, including Wi-Fi model and current network name</li>
          </ul>
          <p className="mt-3 text-sm text-zinc-400">
            The scan is read-only. It does not change settings or read personal files. Components not yet in our catalog are added to the site's hardware
            database, without your computer name or MAC addresses.
          {' '}
            {onOpenPrivacy && (
              <button onClick={onOpenPrivacy} className="text-cyan-400 underline underline-offset-2 cursor-pointer">
                Privacy policy
              </button>
            )}
          </p>
          {consent === 'declined' && <p className="mt-3 text-sm text-amber-400">Scan declined. Nothing was read from your PC.</p>}
          <div className="mt-5 flex gap-3">
            <button onClick={scan} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-black hover:bg-cyan-400">
              Allow and scan
            </button>
            <button onClick={() => setConsent('declined')} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800">
              Don't allow
            </button>
          </div>
        </div>
      )}

      {agent && (
        <div className="rounded-2xl border border-cyan-500/30 bg-zinc-900/80 p-6 text-sm">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" /> Waiting for your PC…
          </h3>
          <p className="mt-2 text-zinc-400">
            Browsers are not allowed to read hardware directly, so one more step is needed: run our read-only scan helper on this computer. This page updates
            on its own when the scan arrives. The link is valid for 15 minutes.
          </p>
          <div className="mt-4 inline-flex rounded-xl border border-zinc-700 p-1">
            {(['windows', 'mac', 'linux'] as const).map((os) => (
              <button
                key={os}
                onClick={() => setAgentOs(os)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${agentOs === os ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-zinc-100'}`}
              >
                {os === 'windows' ? 'Windows' : os === 'mac' ? 'macOS' : 'Linux'}
              </button>
            ))}
          </div>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-zinc-300">
            <li>
              {agentOs === 'windows' ? (
                <>
                  Open PowerShell: right-click the Start button and choose <span className="font-semibold">Terminal</span> (or{' '}
                  <span className="font-semibold">Windows PowerShell</span>). Paste this command with Ctrl + V and press Enter. Leave the window open
                  until it says Done:
                </>
              ) : agentOs === 'mac' ? (
                <>
                  Open <span className="font-semibold">Terminal</span> (Cmd + Space, type "Terminal"), paste this command, then press Return:
                </>
              ) : (
                <>
                  Open a terminal (Ctrl + Alt + T on most desktops), paste this command, then press Enter:
                </>
              )}
              <div className="mt-2 flex items-start gap-2">
                <code className="flex-1 break-all rounded-lg bg-black/60 p-3 text-xs text-cyan-300">{oneLiner}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(oneLiner).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className="rounded-lg border border-zinc-700 p-2 hover:bg-zinc-800"
                  title="Copy command"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              {agentOs === 'linux' && (
                <p className="mt-2 text-xs text-zinc-500">
                  RAM type and speed need root. To include them, run <code className="text-cyan-400">sudo -v</code> first, then the command above.
                </p>
              )}
            </li>
            <li>
              Or{' '}
              <a href={agentOs === 'windows' ? `${agent.agentUrl}?os=cmd` : `${agent.agentUrl}?os=unix`} className="font-semibold text-cyan-400 underline">
                download the scan launcher
              </a>
              {agentOs === 'windows' ? (
                <>
                  {' '}and double-click <code className="text-cyan-400">silicon-matrix-scan.cmd</code>. If Windows shows "Windows protected your PC", choose{' '}
                  <span className="font-semibold">More info</span> then <span className="font-semibold">Run anyway</span>. You can{' '}
                  <a href={agent.agentUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    read the script first
                  </a>
                  .
                </>
              ) : (
                <>
                  {' '}and run <code className="text-cyan-400">sh ~/Downloads/silicon-matrix-scan.sh</code>.
                </>
              )}
            </li>
          </ol>
          <button
            onClick={() => {
              setAgent(null);
              setScanning(false);
              setConsent('ask');
            }}
            className="mt-4 text-xs text-zinc-500 underline"
          >
            Cancel
          </button>
        </div>
      )}

      {agent && browser && (
        <Card title="What your browser can see meanwhile" icon={Monitor}>
          <div className="max-w-xl">
            <Row label="Logical processors" value={browser.threads} />
            <Row label="Memory (browser-rounded, max 8)" value={browser.memoryGB ? `≥ ${browser.memoryGB} GB` : null} />
            <Row label="Active GPU" value={browser.gpuRenderer} />
            <Row label="Network" value={browser.connection} />
          </div>
        </Card>
      )}

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm">
          <p className="flex items-center gap-2 font-semibold text-amber-400">
            <AlertTriangle className="h-4 w-4" /> Scan failed: {error}
          </p>
          <p className="mt-2 text-zinc-400">Press Rescan to start a new scan.</p>
          {browser && (
            <div className="mt-4 max-w-xl">
              <Row label="Logical processors" value={browser.threads} />
              <Row label="Memory (browser-rounded, max 8)" value={browser.memoryGB ? `≥ ${browser.memoryGB} GB` : null} />
              <Row label="Active GPU" value={browser.gpuRenderer} />
              <Row label="GPU vendor" value={browser.gpuVendor} />
              <Row label="Network" value={browser.connection} />
              <Row label="Platform" value={browser.platform} />
            </div>
          )}
        </div>
      )}

      {/* Local scans take a few seconds; show the result layout while waiting */}
      {scanning && !agent && !report && !error && (
        <div className="grid gap-6 lg:grid-cols-2" role="status" aria-label="Scanning hardware">
          {['Processor', 'Memory', 'Graphics', 'Storage'].map((label) => (
            <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-6 w-2/3" />
              {Array.from({ length: 4 }, (_, i) => (
                <SkeletonBlock key={i} className="h-4" />
              ))}
            </div>
          ))}
          <span className="sr-only">Scanning hardware</span>
        </div>
      )}

      {report && (
        <>
          {report.newlyRegistered.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-300">
              Added {report.newlyRegistered.length} new component{report.newlyRegistered.length > 1 ? 's' : ''} to the hardware database:{' '}
              {report.newlyRegistered.map((e) => e.model).join(', ')}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Processor" icon={Cpu}>
              <p className="mb-3 text-lg font-bold">{report.cpu.model}</p>
              <Row label="Cores / Threads" value={`${report.cpu.cores} / ${report.cpu.threads}`} />
              <Row label="Base / Max clock" value={report.cpu.maxGHz ? `${report.cpu.baseGHz} / ${report.cpu.maxGHz} GHz` : null} />
              <Row label="Socket" value={report.cpu.socket} />
              <Row label="L2 / L3 cache" value={`${report.cpu.cacheL2KB} KB / ${report.cpu.cacheL3KB ? `${(report.cpu.cacheL3KB / 1024).toFixed(1)} MB` : 'none'}`} />
              <Row label="Virtualization" value={report.cpu.virtualization ? 'Enabled' : 'Disabled'} />
              <CatalogBadge item={cpuMatch} onInspect={onInspectDetails} />
            </Card>

            <Card title="Memory" icon={MemoryStick}>
              <p className="mb-3 text-lg font-bold">
                {report.ram.totalGB} GB {report.ram.type}
              </p>
              <Row label="Configuration" value={report.ram.channelsHint} />
              {report.ram.modules.map((m, i) => (
                <Row
                  key={i}
                  label={m.slot}
                  value={`${m.sizeGB} GB ${m.type}${m.speedMHz ? ` @ ${m.speedMHz} MT/s` : ''} · ${m.manufacturer}${m.partNumber ? ` ${m.partNumber}` : ''}`}
                />
              ))}
            </Card>
          </div>

          <Card title={`Graphics (${report.gpus.length} detected)`} icon={Monitor}>
            <div className="grid gap-4 md:grid-cols-2">
              {report.gpus.map((g, i) => {
                const match = g.matchedId ? gpus.find((x) => x.id === g.matchedId) : undefined;
                return (
                  <div key={i} className="rounded-xl border border-zinc-800 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-bold">{g.model}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          g.kind === 'Dedicated' ? 'bg-purple-500/15 text-purple-300' : g.kind === 'Integrated' ? 'bg-sky-500/15 text-sky-300' : 'bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {g.kind}
                      </span>
                    </div>
                    <Row label="Vendor" value={g.vendor} />
                    <Row label="VRAM" value={g.vramGB ? `${g.vramGB} GB` : g.kind === 'Integrated' ? 'Shared system memory' : null} />
                    <Row label="Bus" value={g.bus || null} />
                    <Row label="Driver" value={g.driverVersion || null} />
                    <CatalogBadge item={match} onInspect={onInspectDetails} />
                  </div>
                );
              })}
            </div>
            {report.displays.length > 0 && (
              <div className="mt-4">
                {report.displays.map((d, i) => (
                  <Row key={i} label={`${d.model}${d.main ? ' (main)' : ''}`} value={`${d.resolution}${d.refreshHz ? ` @ ${d.refreshHz} Hz` : ''}`} />
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Storage" icon={HardDrive}>
              {report.storage.map((d, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="font-bold">{d.model}</p>
                  <Row label="Type" value={d.type} />
                  <Row label="Capacity" value={fmtGB(d.sizeGB)} />
                  <Row label="Interface" value={d.interface} />
                  <Row label="SMART" value={d.smartStatus} />
                </div>
              ))}
            </Card>

            <Card title="Network adapters" icon={Wifi}>
              {report.network.map((n, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="flex items-center gap-2 font-bold">
                    {n.kind === 'Wi-Fi' ? <Wifi className="h-4 w-4 text-cyan-400" /> : <Cable className="h-4 w-4 text-zinc-400" />}
                    {n.model}
                  </p>
                  <Row label="Kind" value={n.kind} />
                  <Row label="Status" value={n.connected ? 'Connected' : 'Disconnected'} />
                  <Row label="Link speed" value={n.speedMbps ? `${n.speedMbps} Mbps` : null} />
                  {n.ssid && <Row label="SSID" value={n.ssid} />}
                  {n.frequencyMHz ? <Row label="Band" value={n.frequencyMHz >= 5900 ? '6 GHz' : n.frequencyMHz >= 4900 ? '5 GHz' : '2.4 GHz'} /> : null}
                  {n.signalDbm ? <Row label="Signal" value={`${n.signalDbm} dBm`} /> : null}
                  <Row label="MAC" value={n.mac} />
                </div>
              ))}
            </Card>
          </div>

          <Card title={`Local hardware database (${db.length} entries)`} icon={Database}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Model</th>
                    <th className="py-2 pr-4">Vendor</th>
                    <th className="py-2 pr-4">First seen</th>
                    <th className="py-2">Scans</th>
                  </tr>
                </thead>
                <tbody>
                  {db.map((e) => (
                    <tr key={e.id} className="border-t border-zinc-800/60">
                      <td className="py-2 pr-4 text-cyan-400">{e.category}</td>
                      <td className="py-2 pr-4 font-mono">{e.model}</td>
                      <td className="py-2 pr-4 text-zinc-400">{e.vendor}</td>
                      <td className="py-2 pr-4 text-zinc-400">{new Date(e.firstSeen).toLocaleDateString()}</td>
                      <td className="py-2">{e.timesSeen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
