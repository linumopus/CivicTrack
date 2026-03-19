import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';

type JwtPayload = { sub: string };

export type AuthedRequest = Request & {
  user?: {
    id: string;
    role: 'citizen' | 'admin';
    department?: string;
    name: string;
    email: string;
  };
};

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.sub).select('_id name email role department').lean();
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    req.user = {
      id: String(user._id),
      role: user.role,
      department: user.department ?? undefined,
      name: user.name,
      email: user.email,
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  return next();
}

