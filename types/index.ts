export type UserRole = 'citizen' | 'admin';

export type ComplaintCategory = 'Road' | 'Lighting' | 'Drainage' | 'Garbage';
export type ComplaintStatus = 'Pending' | 'In-Progress' | 'Resolved';

export type LngLat = [number, number]; // [lng, lat]

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export interface IUserAuth extends IUser {
  token: string;
}

export interface IComplaint {
  _id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  location: {
    type: 'Point';
    coordinates: LngLat;
  };
  imageUrl?: string;
  upvotes: string[];
  reporter: string;
  createdAt: string;
  updatedAt?: string;
  statusHistory?: Array<{
    status: ComplaintStatus;
    at: string;
    by?: string; // admin userId when applicable
  }>;
  feedback?: {
    rating: number; // 1-5
    note?: string;
    createdAt: string;
  };
  refiledFrom?: string;
}

export interface ComplaintStatusPatchBody {
  status: ComplaintStatus;
}

export interface IMessage {
  _id: string;
  complaintId: string;
  senderId?: string;
  senderName: string;
  text?: string;
  imageUrl?: string;
  isSystem: boolean;
  createdAt: string;
  seenAt?: string;
}

export interface IThread {
  complaintId: string;
  complaintTitle: string;
  complaintStatus: ComplaintStatus;
  complaintCategory: ComplaintCategory;
  lastMessage?: IMessage;
  unreadCount: number;
}

