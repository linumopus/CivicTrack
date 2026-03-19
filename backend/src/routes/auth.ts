import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { User } from '../models/User';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { Complaint } from '../models/Complaint';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['citizen', 'admin']).optional(),
  department: z.enum(['Road', 'Lighting', 'Drainage', 'Garbage']).optional(),
});

router.post('/register', async (req, res) => {
  const body = registerSchema.parse(req.body);
  const existing = await User.findOne({ email: body.email }).lean();
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const role = body.role ?? 'citizen';
  if (role === 'admin' && !body.department) {
    return res.status(400).json({ message: 'department is required for admins' });
  }

  const user = await User.create({
    name: body.name,
    email: body.email,
    password: body.password,
    role,
    department: role === 'admin' ? body.department : undefined,
  });

  const token = jwt.sign({ sub: String(user._id) }, env.JWT_SECRET, { expiresIn: '7d' });
  return res.status(201).json({
    token,
    user: {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department ?? undefined,
    },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await User.findOne({ email: body.email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await user.comparePassword(body.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ sub: String(user._id) }, env.JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    token,
    user: {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department ?? undefined,
    },
  });
});

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  return res.json({ user: req.user });
});

const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['citizen', 'admin']).optional(),
  department: z.enum(['Road', 'Lighting', 'Drainage', 'Garbage']).optional(),
});

router.patch('/me', requireAuth, async (req: AuthedRequest, res) => {
  const body = updateMeSchema.parse(req.body);

  if (body.role === 'admin' && !body.department) {
    return res.status(400).json({ message: 'department is required for admins' });
  }
  if (body.role === 'citizen' && body.department) {
    return res.status(400).json({ message: 'department only applies to admins' });
  }

  const updates: any = {};
  if (body.name) updates.name = body.name;
  if (body.role) updates.role = body.role;
  if (body.role === 'admin') updates.department = body.department;
  if (body.role === 'citizen') updates.department = undefined;

  const user = await User.findByIdAndUpdate(req.user!.id, { $set: updates }, { new: true })
    .select('_id name email role department')
    .lean();
  if (!user) return res.status(404).json({ message: 'Not found' });

  return res.json({
    user: {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department ?? undefined,
    },
  });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.post('/change-password', requireAuth, async (req: AuthedRequest, res) => {
  const body = changePasswordSchema.parse(req.body);
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  const ok = await user.comparePassword(body.currentPassword);
  if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
  user.password = body.newPassword;
  await user.save();
  return res.json({ ok: true });
});

router.delete('/me', requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;

  await User.findByIdAndDelete(userId);
  await Complaint.deleteMany({ reporter: userId });
  await Complaint.updateMany({}, { $pull: { upvotes: userId } });

  return res.status(204).send();
});

export default router;

