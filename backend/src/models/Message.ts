import mongoose, { Schema } from 'mongoose';

export interface MessageDoc extends mongoose.Document {
  complaintId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  senderName: string;
  text?: string;
  imageUrl?: string;
  isSystem: boolean;
  seenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageDoc>(
  {
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    senderName: { type: String, required: true },
    text: { type: String, required: false },
    imageUrl: { type: String, required: false },
    isSystem: { type: Boolean, required: true, default: false },
    seenAt: { type: Date, required: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Indexes for fast querying threads by complaint
messageSchema.index({ complaintId: 1, createdAt: 1 });

export const Message = mongoose.model<MessageDoc>('Message', messageSchema);
