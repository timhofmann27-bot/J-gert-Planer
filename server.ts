import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { db } from './src/db/index.ts';
import { apiRouter } from './src/api/index.ts';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to prevent blocking inline styles/scripts in Vite/React
    crossOriginEmbedderPolicy: false // Disabled for map tiles (Leaflet)
  }));
  app.disable('x-powered-by'); // Security: hide Express signature

  app.use(express.json({ limit: '1mb' })); // Limit JSON payload size to prevent DoS
  app.use(cookieParser());

  // API Routes
  app.use('/api', apiRouter);

  // Vite middleware for development
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

  console.log(`Attempting to listen on port ${PORT}...`);
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});