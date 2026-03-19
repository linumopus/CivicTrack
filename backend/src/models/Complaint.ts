import mongoose, { Schema } from 'mongoose';
import type { ComplaintCategory, ComplaintStatus, LngLat } from '../../../types';

export interface ComplaintDoc extends mongoose.Document {
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  location: { type: 'Point'; coordinates: LngLat };
  imageUrl?: string;
  upvotes: mongoose.Types.ObjectId[];
  reporter: mongoose.Types.ObjectId;
  statusHistory: Array<{ status: ComplaintStatus; at: Date; by?: mongoose.Types.ObjectId }>;
  feedback?: { rating: number; note?: string; createdAt: Date };
  refiledFrom?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<ComplaintDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Road', 'Lighting', 'Drainage', 'Garbage'], required: true },
    status: {
      type: String,
      enum: ['Pending', 'In-Progress', 'Resolved'],
      required: true,
      default: 'Pending',
    },
    location: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    imageUrl: { type: String, required: false },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    statusHistory: [
      {
        status: { type: String, enum: ['Pending', 'In-Progress', 'Resolved'], required: true },
        at: { type: Date, required: true },
        by: { type: Schema.Types.ObjectId, ref: 'User', required: false },
      },
    ],
    feedback: {
      rating: { type: Number, min: 1, max: 5, required: false },
      note: { type: String, required: false, trim: true },
      createdAt: { type: Date, required: false },
    },
    refiledFrom: { type: Schema.Types.ObjectId, ref: 'Complaint', required: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Required by spec
complaintSchema.index({ location: '2dsphere' });

export const Complaint = mongoose.model<ComplaintDoc>('Complaint', complaintSchema);

