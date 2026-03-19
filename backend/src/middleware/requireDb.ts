import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

export function requireDb(_req: Request, res: Response, next: NextFunction) {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    message: 'Database unavailable. Check MongoDB Atlas Network Access (IP whitelist) and MONGO_URI.',
  });
}

