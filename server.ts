import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './app.js';

async function startServer() {
  const app = createApp();
  // Hosts like Render/Railway assign the port through the environment
  const PORT = Number(process.env.PORT) || 3000;

  // Vite development vs production static handler
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Build Doctor Full-Stack Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
