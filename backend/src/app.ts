import express from 'express';
import { env } from './config/env';
import authRoutes from './routes/auth';
import complaintRoutes from './routes/complaints';
import messagesRoutes from './routes/messages';
import mongoose from 'mongoose';
import cors from 'cors';
import { requireDb } from './middleware/requireDb';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) =>
    res.json({ ok: true, dbConnected: mongoose.connection.readyState === 1 })
  );

  app.use('/api/auth', requireDb, authRoutes);
  app.use('/api/complaints', requireDb, complaintRoutes);
  app.use('/api/messages', requireDb, messagesRoutes);

  // Basic error handler for Zod + unexpected errors
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid request', issues: (err as any).issues });
    }
    return res.status(500).json({ message: 'Server error' });
  });

  return app;
}

