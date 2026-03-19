import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../state/auth/AuthContext';
import { useMessages } from '../state/messages/useMessages';
import { fetchMessages, sendMessage } from '../state/messages/messagesApi';
import type { IMessage, IThread } from '@shared-types/index';
import { Button } from '../components/Button';

function ThreadItem({
  thread,
  selected,
  onSelect,
}: {
  thread: IThread;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${
        selected ? 'bg-slate-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="truncate text-sm font-semibold text-slate-900">{thread.complaintTitle}</div>
        <div className="text-xs text-slate-500">
          {thread.lastMessage ? new Date(thread.lastMessage.createdAt).toLocaleDateString() : ''}
        </div>
      </div>
      <div className="mt-1 truncate text-xs text-slate-500">
        {thread.lastMessage ? thread.lastMessage.text : 'No messages yet'}
      </div>
      {thread.unreadCount > 0 && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
          {thread.unreadCount}
        </span>
      )}
    </button>
  );
}

function MessageBubble({ msg, isMe }: { msg: IMessage; isMe: boolean }) {
  if (msg.isSystem) {
    return (
      <div className="my-4 flex justify-center">
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-4 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">{msg.senderName}</div>
      <div
        className={`relative max-w-[85%] rounded-2xl p-2 text-sm ${
          isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-900 rounded-bl-sm'
        }`}
      >
        {msg.imageUrl && (
          <img
            src={msg.imageUrl}
            alt="Attachment"
            className="mb-2 max-h-60 w-auto rounded-xl object-contain"
          />
        )}
        {msg.text && (
          <div className="px-2 pb-1 whitespace-pre-wrap">{msg.text}</div>
        )}
        {isMe && (
          <div className="mt-1 flex justify-end px-2 text-[10px] opacity-70">
            {msg.seenAt ? '✓✓ Seen' : '✓ Delivered'}
          </div>
        )}
      </div>
    </div>
  );
}

export function MessagesPage() {
  const { token, user } = useAuth();
  const { threads, reloadThreads } = useMessages(token);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeThread = threads.find((t) => t.complaintId === activeThreadId);

  // Load messages when thread changes or threads list updates (for real-time incoming msgs)
  useEffect(() => {
    if (!activeThreadId || !token) return;
    let valid = true;
    const fetchIt = async () => {
      if (messages.length === 0) setLoadingMsgs(true);
      try {
        const msgs = await fetchMessages(activeThreadId, token);
        if (!valid) return;
        setMessages(msgs);
        if (activeThread?.unreadCount) {
          void reloadThreads(); // clear the badge
        }
      } finally {
        if (valid) setLoadingMsgs(false);
      }
    };
    void fetchIt();

    return () => {
      valid = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, token, threads]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageBase64(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again if removed
    e.target.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !imageBase64) || !activeThreadId || !token) return;
    setSending(true);
    try {
      const msg = await sendMessage(
        activeThreadId,
        { text: text.trim() || undefined, imageBase64: imageBase64 || undefined },
        token
      );
      setMessages((prev) => [...prev, msg]);
      setText('');
      setImageBase64('');
      void reloadThreads(); // Update thread list preview
    } catch {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-6xl overflow-hidden bg-white shadow-sm md:my-4 md:h-[calc(100vh-5.5rem)] md:rounded-xl md:border">
      {/* Sidebar: Threads */}
      <div
        className={`flex w-full flex-col border-r border-slate-200 md:w-80 md:flex-shrink-0 ${
          activeThreadId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-bold text-slate-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && (
            <div className="p-4 text-center text-sm text-slate-500">No active conversations.</div>
          )}
          {threads.map((t) => (
            <ThreadItem
              key={t.complaintId}
              thread={t}
              selected={t.complaintId === activeThreadId}
              onSelect={() => setActiveThreadId(t.complaintId)}
            />
          ))}
        </div>
      </div>

      {/* Main pane: Active Chat */}
      <div
        className={`flex flex-1 flex-col bg-slate-50 ${
          !activeThreadId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {!activeThread ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-4">
              <button
                className="md:hidden text-slate-500 hover:text-slate-900"
                onClick={() => setActiveThreadId(null)}
              >
                ←
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-slate-900">
                  {activeThread.complaintTitle}
                </div>
                <div className="text-xs text-slate-500">
                  Status: {activeThread.complaintStatus} • {activeThread.complaintCategory}
                </div>
              </div>
            </div>

            {/* Messages list */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
              {loadingMsgs && messages.length === 0 ? (
                <div className="text-center text-sm text-slate-400">Loading...</div>
              ) : (
                messages.map((m) => (
                  <MessageBubble key={m._id} msg={m} isMe={m.senderId === user?._id} />
                ))
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-slate-200 bg-white p-4">
              {activeThread.complaintStatus === 'Resolved' ? (
                <div className="text-center text-sm text-slate-500">
                  This issue is resolved. Chat is closed.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {imageBase64 && (
                    <div className="relative inline-block w-max">
                      <img src={imageBase64} alt="Preview" className="h-20 w-auto rounded-md border border-slate-200 object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageBase64('')}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs text-white hover:bg-rose-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleImagePick}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center rounded-full bg-slate-100 px-4 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                      title="Attach image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </button>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 rounded-full border-slate-300 bg-slate-100 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Button type="submit" disabled={(!text.trim() && !imageBase64) || sending} className="rounded-full px-6">
                      {sending ? '...' : 'Send'}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
