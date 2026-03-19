import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import type { UserRole } from '../../../types';

export interface UserDoc extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'admin'], required: true, default: 'citizen' },
    department: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function preSave() {
  if (!this.isModified('password')) return;
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.methods.comparePassword = async function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<UserDoc>('User', userSchema);

