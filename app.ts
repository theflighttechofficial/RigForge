import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { scanSystemSpecs, readUserHardwareDb } from './systemSpecs.js';
import { storeKind } from './store.js';
import { generateDeterministicReport } from './src/utils/doctorReport.js';
import { parseUnixDump, unixAgentScript } from './unixAgent.js';
import { completeScanSession, createScanSession, getScanSession, reportFromAgent, windowsAgentScript, windowsLauncherScript } from './deviceAgent.js';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Shared by the local Node server (server.ts) and the Vercel function (api/index.ts)
export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      store: storeKind
    });
  });

  // Hardware scan reads the machine running this server, so only answer loopback callers
  const isLoopback = (req: express.Request) => {
    // Behind a host's proxy (Vercel etc.) the socket is always local, so it proves nothing
    if (process.env.VERCEL || req.headers['x-forwarded-for'] || req.headers['x-real-ip']) return false;
    const ip = req.socket.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  };

  app.get('/api/system-specs', async (req, res) => {
    if (!isLoopback(req)) {
      return res.status(403).json({ error: 'System scan is only available when the site runs on this computer (localhost).' });
    }
    try {
      res.json(await scanSystemSpecs());
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'System scan failed' });
    }
  });

  // Hosted flow: browser gets consent, opens a session, visitor runs the agent, agent posts back
  const originOf = (req: express.Request) => `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;

  app.post('/api/system-specs/session', async (req, res) => {
    let token: string;
    try {
      token = await createScanSession();
    } catch (err: any) {
      return res.status(500).json({ error: `Could not start scan session: ${err?.message || err}` });
    }
    res.json({
      token,
      agentUrl: `${originOf(req)}/api/system-specs/agent/${token}`,
      local: isLoopback(req)
    });
  });

  app.get('/api/system-specs/agent/:token', async (req, res) => {
    if (!(await getScanSession(req.params.token))) return res.status(404).send('# Scan session expired. Start a new scan in the browser.');
    const origin = originOf(req);
    if (req.query.os === 'cmd') {
      res.type('text/plain').attachment('silicon-matrix-scan.cmd').send(windowsLauncherScript(`${origin}/api/system-specs/agent/${req.params.token}`));
    } else if (req.query.os === 'unix') {
      res.type('text/plain').attachment('silicon-matrix-scan.sh').send(unixAgentScript(origin, req.params.token));
    } else {
      res.type('text/plain').attachment('silicon-matrix-scan.ps1').send(windowsAgentScript(origin, req.params.token));
    }
  });

  app.post('/api/system-specs/report/:token', express.json({ limit: '200kb' }), express.text({ limit: '2mb' }), async (req, res) => {
    const session = await getScanSession(req.params.token);
    if (!session) return res.status(404).json({ error: 'Scan session expired' });
    if (session.report) return res.status(409).json({ error: 'Scan session already used' });
    try {
      // Windows agent posts JSON; the macOS/Linux agent posts sectioned command output
      const report = await reportFromAgent(typeof req.body === 'string' ? parseUnixDump(req.body) : req.body);
      await completeScanSession(req.params.token, session, report);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Invalid scan data' });
    }
  });

  app.get('/api/system-specs/session/:token', async (req, res) => {
    const session = await getScanSession(req.params.token);
    if (!session) return res.status(404).json({ error: 'Scan session expired' });
    res.json({ status: session.report ? 'complete' : 'pending', report: session.report });
  });

  app.get('/api/user-hardware-db', async (req, res) => {
    try {
      res.json(await readUserHardwareDb());
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Could not read hardware database' });
    }
  });

  // AI Build Doctor Diagnostic Route
  app.post('/api/build-doctor', async (req, res) => {
    const { cpu = 'AMD Ryzen 5 3600', gpu = 'NVIDIA GeForce RTX 4070 12GB', ram = '16GB DDR4' } = req.body;

    const deterministic = generateDeterministicReport(cpu, gpu, ram);

    const ai = getAIClient();
    if (!ai) {
      return res.json({
        ...deterministic,
        aiGenerated: false,
        note: 'Grounded deterministic hardware diagnostic report (No GEMINI_API_KEY set)'
      });
    }

    try {
      const prompt = `
You are the AI Build Doctor, a senior PC hardware diagnostic architect and silicon engineer.
Analyze this system build:
CPU: ${cpu}
GPU: ${gpu}
RAM: ${ram}

Generate a comprehensive BUILD HEALTH REPORT in strict JSON conforming to this specification:
{
  "overallHealthScore": number (0-100),
  "overallVerdict": string (concise 1-sentence verdict),
  "balance": {
    "res1080p": {
      "status": "CPU constrained" | "GPU dominant" | "Balanced",
      "explanation": string,
      "cpuLoadEst": number (0-100),
      "gpuLoadEst": number (0-100)
    },
    "res1440p": {
      "status": "CPU constrained" | "GPU dominant" | "Balanced",
      "explanation": string,
      "cpuLoadEst": number (0-100),
      "gpuLoadEst": number (0-100)
    },
    "res4k": {
      "status": "CPU constrained" | "GPU dominant" | "Balanced",
      "explanation": string,
      "cpuLoadEst": number (0-100),
      "gpuLoadEst": number (0-100)
    }
  },
  "memory": {
    "capacity": string,
    "statusText": string (e.g. "16GB → potential limitation for modern AAA workloads"),
    "severity": "optimal" | "moderate" | "critical",
    "analysis": string,
    "hitchingRisk": string
  },
  "platform": {
    "socket": string (e.g. "AM4", "AM5", "LGA 1700"),
    "statusText": string (e.g. "AM4 → upgrade path available"),
    "upgradePotential": "high" | "moderate" | "dead_end",
    "analysis": string,
    "maxRecommendedCpu": string
  },
  "upgradeSequence": [
    {
      "step": 1,
      "target": string (e.g. "RAM → 32GB"),
      "priority": "Immediate" | "Secondary" | "Future" | "Keep",
      "costINR": number (approx in INR),
      "rationale": string
    },
    {
      "step": 2,
      "target": string (e.g. "CPU → 5700X3D"),
      "priority": "Immediate" | "Secondary" | "Future" | "Keep",
      "costINR": number,
      "rationale": string
    },
    {
      "step": 3,
      "target": string (e.g. "GPU → keep current"),
      "priority": "Immediate" | "Secondary" | "Future" | "Keep",
      "costINR": 0,
      "rationale": string
    }
  ],
  "detailedRationale": [
    string (Explanation for recommendation 1),
    string (Explanation for recommendation 2),
    string (Explanation for recommendation 3),
    string (Explanation for recommendation 4)
  ]
}

Ensure the report accurately diagnoses resolution behavior (1080p vs 1440p vs 4K), memory limits (e.g., 16GB limit in AAA), platform longevity (e.g., AM4 upgrade path to 5700X3D), upgrade priority sequence, and thoroughly explains WHY each recommendation exists.
Only output valid JSON. Do not include markdown code block markers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);
      return res.json({
        ...parsed,
        timestamp: new Date().toISOString(),
        config: { cpu, gpu, ram },
        aiGenerated: true
      });
    } catch (err: any) {
      console.warn('Gemini API diagnostic call error, falling back to deterministic report:', err?.message || err);
      return res.json({
        ...deterministic,
        aiGenerated: false,
        fallbackReason: err?.message || 'AI service error'
      });
    }
  });

  return app;
}
