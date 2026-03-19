import { useState, useEffect, useCallback } from 'react';
import { fetchThreads } from './messagesApi';
import type { IThread } from '@shared-types/index';

export function useMessages(token: string | null) {
  const [threads, setThreads] = useState<IThread[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestUnreadThread, setLatestUnreadThread] = useState<IThread | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchThreads(token);
      setThreads(data);
      const totalUnread = data.reduce((acc, thread) => acc + thread.unreadCount, 0);
      setUnreadCount(totalUnread);

      let latest: IThread | null = null;
      let maxTime = 0;
      for (const thread of data) {
        if (thread.unreadCount > 0 && thread.lastMessage) {
          const tTime = new Date(thread.lastMessage.createdAt).getTime();
          if (tTime > maxTime) {
            maxTime = tTime;
            latest = thread;
          }
        }
      }
      setLatestUnreadThread(latest);
    } catch (err) {
      console.error('Failed to load threads', err);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    void load();
  }, [load]);

  // Polling every 3s
  useEffect(() => {
    if (!token) return;
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [token, load]);

  return { threads, unreadCount, latestUnreadThread, reloadThreads: load };
}
