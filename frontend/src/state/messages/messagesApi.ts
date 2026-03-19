import { apiFetch } from '../../lib/api';
import type { IThread, IMessage } from '@shared-types/index';

export async function fetchThreads(token: string): Promise<IThread[]> {
  const res = await apiFetch<{ threads: IThread[] }>('/api/messages', { token });
  return res.threads;
}

export async function fetchMessages(complaintId: string, token: string): Promise<IMessage[]> {
  const res = await apiFetch<{ messages: IMessage[] }>(`/api/messages/${complaintId}`, { token });
  return res.messages;
}

export async function sendMessage(complaintId: string, payload: { text?: string; imageBase64?: string }, token: string): Promise<IMessage> {
  const res = await apiFetch<{ message: IMessage }>(`/api/messages/${complaintId}`, {
    method: 'POST',
    body: payload,
    token,
  });
  return res.message;
}
