import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Message } from '../models/Message';
import { Complaint } from '../models/Complaint';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import type { IThread, IMessage } from '../../../types';
import { encrypt, decrypt } from '../lib/crypto';

const router = Router();

function serializeMessage(m: any): IMessage {
  return {
    _id: String(m._id),
    complaintId: String(m.complaintId),
    senderId: m.senderId ? String(m.senderId) : undefined,
    senderName: m.senderName,
    text: decrypt(m.text),
    imageUrl: m.imageUrl,
    isSystem: m.isSystem,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
    seenAt: m.seenAt ? (m.seenAt instanceof Date ? m.seenAt.toISOString() : String(m.seenAt)) : undefined,
  };
}

// GET /api/messages -> return list of IThread instances for the current user
router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const department = req.user!.department;

  // 1. Find relevant complaints
  let query: any = {};
  if (!isAdmin) {
    query.reporter = new mongoose.Types.ObjectId(userId);
  } else if (department) {
    query.category = department;
  }
  
  // We only care about complaints that might have messages (which means they have a status other than Pending)
  // Or simpler: just get all relevant complaints and find latest messages.
  const complaints = await Complaint.find(query).select('_id title status category').lean();
  
  if (complaints.length === 0) {
    return res.json({ threads: [] });
  }

  const complaintIds = complaints.map(c => c._id);

  // 2. Fetch all messages for these complaints to compute lastMessage and unread counts
  const messages = await Message.find({ complaintId: { $in: complaintIds } })
    .sort({ createdAt: 1 })
    .lean();

  // Group messages by complaintId
  const messagesByComplaint = new Map<string, any[]>();
  for (const m of messages) {
    const cId = String(m.complaintId);
    if (!messagesByComplaint.has(cId)) {
      messagesByComplaint.set(cId, []);
    }
    messagesByComplaint.get(cId)!.push(m);
  }

  const threads: IThread[] = [];

  for (const c of complaints) {
    const cId = String(c._id);
    const msgs = messagesByComplaint.get(cId) || [];
    
    // Skip complaints with no messages to avoid cluttering the messages list
    if (msgs.length === 0) continue;

    const lastMessage = msgs[msgs.length - 1];

    // Compute unread count.
    // Unread means: seenAt is null/undefined AND senderId is not me (so I received it)
    const unreadCount = msgs.filter(
      (m) =>
        !m.seenAt &&
        (!m.senderId || String(m.senderId) !== userId)
    ).length;

    threads.push({
      complaintId: cId,
      complaintTitle: c.title,
      complaintStatus: c.status,
      complaintCategory: c.category,
      unreadCount,
      lastMessage: serializeMessage(lastMessage),
    });
  }

  // Sort threads by latest message descending
  threads.sort((a, b) => {
    const aTime = new Date(a.lastMessage!.createdAt).getTime();
    const bTime = new Date(b.lastMessage!.createdAt).getTime();
    return bTime - aTime;
  });

  return res.json({ threads });
});

// GET /api/messages/:complaintId -> get all messages for a thread, mark incoming as seen
router.get('/:complaintId', requireAuth, async (req: AuthedRequest, res) => {
  const { complaintId } = req.params;
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const department = req.user!.department;

  if (!mongoose.isValidObjectId(complaintId)) return res.status(400).json({ message: 'Invalid id' });

  const complaint = await Complaint.findById(complaintId).select('reporter category').lean();
  if (!complaint) return res.status(404).json({ message: 'Not found' });

  // Authorization check
  if (!isAdmin && String(complaint.reporter) !== userId) return res.status(403).json({ message: 'Forbidden' });
  if (isAdmin && department && complaint.category !== department) return res.status(403).json({ message: 'Forbidden' });

  // Mark all unread incoming messages as seen
  await Message.updateMany(
    {
      complaintId,
      seenAt: { $exists: false },
      $or: [
        { senderId: { $ne: new mongoose.Types.ObjectId(userId) } },
        { senderId: { $exists: false } } // system messages
      ]
    },
    { $set: { seenAt: new Date() } }
  );

  const messages = await Message.find({ complaintId })
    .sort({ createdAt: 1 })
    .lean();

  return res.json({ messages: messages.map(serializeMessage) });
});

const sendSchema = z.object({
  text: z.string().max(2000).optional(),
  imageBase64: z.string().optional(),
}).refine(data => data.text || data.imageBase64, {
  message: "Either text or imageBase64 is required"
});

// POST /api/messages/:complaintId -> Send a new message
router.post('/:complaintId', requireAuth, async (req: AuthedRequest, res) => {
  const { complaintId } = req.params;
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const department = req.user!.department;

  if (!mongoose.isValidObjectId(complaintId)) return res.status(400).json({ message: 'Invalid id' });
  const body = sendSchema.parse(req.body);

  const complaint = await Complaint.findById(complaintId).select('reporter category status').lean();
  if (!complaint) return res.status(404).json({ message: 'Not found' });

  if (!isAdmin && String(complaint.reporter) !== userId) return res.status(403).json({ message: 'Forbidden' });
  if (isAdmin && department && complaint.category !== department) return res.status(403).json({ message: 'Forbidden' });

  if (complaint.status === 'Resolved') {
    return res.status(400).json({ message: 'Cannot send messages to a resolved thread' });
  }

  const message = await Message.create({
    complaintId: complaint._id,
    senderId: new mongoose.Types.ObjectId(userId),
    senderName: req.user!.name,
    text: encrypt(body.text),
    imageUrl: body.imageBase64,
    isSystem: false,
  });

  return res.status(201).json({ message: serializeMessage(message) });
});

export default router;
