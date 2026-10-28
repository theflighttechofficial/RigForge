import WebSocket from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';

function newTarget(port) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/json/new',
      method: 'PUT'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function closeTarget(port, id) {
  return new Promise((resolve) => {
    http.get(`http://127.0.0.1:${port}/json/close/${id}`, () => resolve()).on('error', () => resolve());
  });
}

async function captureScreenshot(port, url, outputPath, width = 1440, height = 900, delay = 3500) {
  console.log(`Navigating to ${url}...`);
  const target = await newTarget(port);
  const wsUrl = target.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1.5,
    mobile: false
  });

  await send('Page.navigate', { url });

  // Wait for rendering and dynamic WebGL/charts
  await new Promise(r => setTimeout(r, delay));

  const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
  console.log(`Saved screenshot to ${outputPath} (${Buffer.from(screenshot.data, 'base64').length} bytes)`);

  ws.close();
  await closeTarget(port, target.id);
}

const screenshots = [
  { url: 'http://localhost:3000/overview', file: 'docs/screenshots/overview.png', delay: 4000 },
  { url: 'http://localhost:3000/3d-studio', file: 'docs/screenshots/3d-studio.png', delay: 6000 },
  { url: 'http://localhost:3000/value-matrix', file: 'docs/screenshots/value-matrix.png', delay: 4500 },
  { url: 'http://localhost:3000/builder', file: 'docs/screenshots/builder.png', delay: 4000 },
  { url: 'http://localhost:3000/build-doctor', file: 'docs/screenshots/build-doctor.png', delay: 4000 },
  { url: 'http://localhost:3000/bottleneck', file: 'docs/screenshots/bottleneck.png', delay: 4000 },
  { url: 'http://localhost:3000/compare', file: 'docs/screenshots/compare.png', delay: 4000 },
  { url: 'http://localhost:3000/benchmarks', file: 'docs/screenshots/benchmarks.png', delay: 4000 },
  { url: 'http://localhost:3000/power-cost', file: 'docs/screenshots/power-cost.png', delay: 4000 }
];

async function main() {
  const tmpProfile = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'edge-screen-profile-' + Date.now());
  for (const item of screenshots) {
    try {
      await captureScreenshot(9333, item.url, path.resolve(item.file), 1440, 900, item.delay);
    } catch (err) {
      console.error(`Error capturing ${item.file}:`, err);
    }
  }
  console.log('All screenshots completed!');
  process.exit(0);
}

main();
