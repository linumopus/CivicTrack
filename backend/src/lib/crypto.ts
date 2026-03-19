import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';

// Generate a 32-byte key from the JWT_SECRET
const KEY = crypto.scryptSync(env.JWT_SECRET, 'salt', 32);

export function encrypt(text?: string): string | undefined {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

export function decrypt(text?: string): string | undefined {
  if (!text) return text;
  // If no delimiter is present, it's either an old unencrypted message or a system message
  if (!text.includes(':')) return text;
  
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return text;
    const ivHex = parts[0];
    const encrypted = parts[1];
    
    if (!ivHex || !encrypted) return text;

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return text; // Fallback to raw if decryption fails (e.g. key rotated)
  }
}
