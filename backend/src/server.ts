import { createApp } from './app';
import { connectDb } from './db';
import { env } from './config/env';
import path from 'node:path';
import express from 'express';

async function main() {
  const app = createApp();

  const tryConnect = async () => {
    try {
      await connectDb();
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection failed. Retrying in 10s…');
      console.error(err);
      setTimeout(() => void tryConnect(), 10_000);
    }
  };

  void tryConnect();

  // Serve frontend on the same port (dev + prod) from built assets
  const distPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`CivicTrack listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

