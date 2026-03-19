import type { IComplaint, ComplaintStatus } from '@shared-types/index';
import { apiFetch } from '../../lib/api';

export async function fetchComplaints(): Promise<IComplaint[]> {
  const res = await apiFetch<{ complaints: IComplaint[] }>('/api/complaints');
  return res.complaints;
}

export async function fetchMyComplaints(token: string): Promise<IComplaint[]> {
  const res = await apiFetch<{ complaints: IComplaint[] }>('/api/complaints/mine', { token });
  return res.complaints;
}

export async function fetchComplaintById(id: string, token: string): Promise<IComplaint> {
  const res = await apiFetch<{ complaint: IComplaint }>(`/api/complaints/${id}`, { token });
  return res.complaint;
}

export async function createComplaint(input: {
  title: string;
  description: string;
  category: 'Road' | 'Lighting' | 'Drainage' | 'Garbage';
  coordinates: [number, number];
  imageBase64?: string;
  refiledFrom?: string;
  token: string;
}): Promise<IComplaint> {
  const res = await apiFetch<{ complaint: IComplaint }>('/api/complaints', {
    method: 'POST',
    token: input.token,
    body: {
      title: input.title,
      description: input.description,
      category: input.category,
      coordinates: input.coordinates,
      imageBase64: input.imageBase64,
      refiledFrom: input.refiledFrom,
    },
  });
  return res.complaint;
}

export async function upvoteComplaint(id: string, token: string): Promise<{ _id: string; upvotes: string[] }> {
  return apiFetch<{ _id: string; upvotes: string[] }>(`/api/complaints/${id}/upvote`, {
    method: 'POST',
    token,
  });
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  token: string
): Promise<{ _id: string; status: ComplaintStatus }> {
  return apiFetch<{ _id: string; status: ComplaintStatus }>(`/api/complaints/${id}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export async function deleteComplaint(id: string, token: string): Promise<void> {
  await apiFetch<null>(`/api/complaints/${id}`, { method: 'DELETE', token });
}

export async function leaveFeedback(
  id: string,
  input: { rating: number; note?: string },
  token: string
): Promise<{ _id: string; feedback: { rating: number; note?: string; createdAt: string } }> {
  return apiFetch<{ _id: string; feedback: { rating: number; note?: string; createdAt: string } }>(
    `/api/complaints/${id}/feedback`,
    { method: 'POST', token, body: input }
  );
}

export async function refileComplaint(
  id: string,
  input: { title: string; description: string },
  token: string
): Promise<IComplaint> {
  const res = await apiFetch<{ complaint: IComplaint }>(`/api/complaints/${id}/refile`, {
    method: 'POST',
    token,
    body: input,
  });
  return res.complaint;
}

