import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import type { ComplaintCategory, ComplaintStatus } from '../../../types';
import { Complaint } from '../models/Complaint';
import { Message } from '../models/Message';
import { requireAdmin, requireAuth, type AuthedRequest } from '../middleware/auth';

const router = Router();

function serializeComplaint(c: any) {
  return {
    _id: String(c._id),
    title: c.title,
    description: c.description,
    category: c.category,
    status: c.status,
    location: c.location,
    imageUrl: c.imageUrl,
    upvotes: (c.upvotes ?? []).map((id: any) => String(id)),
    reporter: String(c.reporter),
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : undefined,
    statusHistory: Array.isArray(c.statusHistory)
      ? c.statusHistory.map((h: any) => ({
          status: h.status,
          at: h.at instanceof Date ? h.at.toISOString() : String(h.at),
          by: h.by ? String(h.by) : undefined,
        }))
      : undefined,
    feedback: c.feedback?.rating
      ? {
          rating: Number(c.feedback.rating),
          note: c.feedback.note ?? undefined,
          createdAt:
            c.feedback.createdAt instanceof Date
              ? c.feedback.createdAt.toISOString()
              : String(c.feedback.createdAt),
        }
      : undefined,
    refiledFrom: c.refiledFrom ? String(c.refiledFrom) : undefined,
  };
}

router.get('/', async (_req, res) => {
  const complaints = await Complaint.find()
    .sort({ createdAt: -1 })
    .select(
      '_id title description category status location imageUrl upvotes reporter createdAt updatedAt statusHistory feedback refiledFrom'
    )
    .lean();

  return res.json({
    complaints: complaints.map(serializeComplaint),
  });
});

// Admin-only feed: scoped to admin department and sorted by upvote count (desc)
router.get('/admin', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const department = req.user!.department;
  if (!department) return res.status(400).json({ message: 'Admin department missing' });

  const docs = await Complaint.aggregate([
    { $match: { category: department } },
    { $addFields: { upvoteCount: { $size: { $ifNull: ['$upvotes', []] } } } },
    { $sort: { upvoteCount: -1, createdAt: -1 } },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        category: 1,
        status: 1,
        location: 1,
        imageUrl: 1,
        upvotes: 1,
        reporter: 1,
        createdAt: 1,
        updatedAt: 1,
        statusHistory: 1,
        feedback: 1,
        refiledFrom: 1,
      },
    },
  ]);

  return res.json({ complaints: docs.map(serializeComplaint) });
});

router.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
  const complaints = await Complaint.find({ reporter: req.user!.id })
    .sort({ createdAt: -1 })
    .select(
      '_id title description category status location imageUrl upvotes reporter createdAt updatedAt statusHistory feedback refiledFrom'
    )
    .lean();
  return res.json({ complaints: complaints.map(serializeComplaint) });
});

router.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

  const complaint = await Complaint.findById(id)
    .select(
      '_id title description category status location imageUrl upvotes reporter createdAt updatedAt statusHistory feedback refiledFrom'
    )
    .lean();
  if (!complaint) return res.status(404).json({ message: 'Not found' });

  const isOwner = String(complaint.reporter) === req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
  if (isAdmin && req.user!.department && complaint.category !== req.user!.department) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return res.json({ complaint: serializeComplaint(complaint) });
});

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['Road', 'Lighting', 'Drainage', 'Garbage']) as z.ZodType<ComplaintCategory>,
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]), // [lng, lat]
  imageBase64: z.string().min(1).optional(),
  refiledFrom: z.string().optional(),
});

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const body = createSchema.parse(req.body);

  // Mock upload: store base64 string as "imageUrl"
  const imageUrl = body.imageBase64;

  const complaint = await Complaint.create({
    title: body.title,
    description: body.description,
    category: body.category,
    status: 'Pending',
    location: { type: 'Point', coordinates: body.coordinates },
    imageUrl,
    upvotes: [],
    reporter: new mongoose.Types.ObjectId(req.user!.id),
    statusHistory: [{ status: 'Pending', at: new Date() }],
    refiledFrom: body.refiledFrom && mongoose.isValidObjectId(body.refiledFrom) ? body.refiledFrom : undefined,
  });

  return res.status(201).json({
    complaint: serializeComplaint(complaint),
  });
});

const statusSchema = z.object({
  status: z.enum(['Pending', 'In-Progress', 'Resolved']) as z.ZodType<ComplaintStatus>,
});

router.patch('/:id/status', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const body = statusSchema.parse(req.body);

  const existing = await Complaint.findById(id).select('_id category status').lean();
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (req.user!.department && existing.category !== req.user!.department) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updated = await Complaint.findByIdAndUpdate(
    id,
    {
      $set: { status: body.status },
      $push: { statusHistory: { status: body.status, at: new Date(), by: req.user!.id } },
    },
    { new: true }
  )
    .select('_id status')
    .lean();

  if (!updated) return res.status(404).json({ message: 'Not found' });

  // Auto-generate system message if status actually changed
  if (existing.status !== body.status) {
    await Message.create({
      complaintId: updated._id,
      senderName: 'System',
      text: `Status updated to ${body.status} by ${req.user!.name}`,
      isSystem: true,
    });
  }

  return res.json({ _id: String(updated._id), status: updated.status });
});

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
});

router.post('/:id/feedback', requireAuth, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const body = feedbackSchema.parse(req.body);

  const complaint = await Complaint.findById(id).select('_id reporter status feedback').lean();
  if (!complaint) return res.status(404).json({ message: 'Not found' });
  if (String(complaint.reporter) !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
  if (complaint.status !== 'Resolved') return res.status(400).json({ message: 'Only resolved complaints can be rated' });

  const updated = await Complaint.findByIdAndUpdate(
    id,
    { $set: { feedback: { rating: body.rating, note: body.note, createdAt: new Date() } } },
    { new: true }
  )
    .select('_id feedback')
    .lean();
  return res.json({
    _id: String(updated!._id),
    feedback: {
      rating: Number(updated!.feedback!.rating),
      note: updated!.feedback!.note ?? undefined,
      createdAt: updated!.feedback!.createdAt.toISOString(),
    },
  });
});

const refileSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

router.post('/:id/refile', requireAuth, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const body = refileSchema.parse(req.body);

  const prev = await Complaint.findById(id)
    .select('_id reporter category location imageUrl status')
    .lean();
  if (!prev) return res.status(404).json({ message: 'Not found' });
  if (String(prev.reporter) !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
  if (prev.status !== 'Resolved') {
    return res.status(400).json({ message: 'Only resolved complaints can be refiled' });
  }

  const complaint = await Complaint.create({
    title: body.title,
    description: body.description,
    category: prev.category,
    status: 'Pending',
    location: prev.location,
    imageUrl: prev.imageUrl,
    upvotes: [],
    reporter: new mongoose.Types.ObjectId(req.user!.id),
    statusHistory: [{ status: 'Pending', at: new Date() }],
    refiledFrom: prev._id,
  });

  return res.status(201).json({ complaint: serializeComplaint(complaint) });
});

router.post('/:id/upvote', requireAuth, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const updated = await Complaint.findOneAndUpdate(
    { _id: id, upvotes: { $ne: userId } },
    { $addToSet: { upvotes: userId } },
    { new: true }
  )
    .select('_id upvotes')
    .lean();

  if (!updated) {
    const existing = await Complaint.findById(id).select('_id upvotes').lean();
    if (!existing) return res.status(404).json({ message: 'Not found' });
    return res.json({ _id: String(existing._id), upvotes: existing.upvotes.map(String) });
  }

  return res.json({ _id: String(updated._id), upvotes: updated.upvotes.map(String) });
});

router.delete('/:id', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const existing = await Complaint.findById(id).select('_id category').lean();
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (req.user!.department && existing.category !== req.user!.department) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const deleted = await Complaint.findByIdAndDelete(id).select('_id').lean();
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  return res.status(204).send();
});

export default router;

