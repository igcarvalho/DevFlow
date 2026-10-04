'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Message, chatApi, getTokenPayload } from '@/lib/api';

function initials(name: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

const AVATAR_COLORS = [
  'from-primary-500 to-accent-500',
  'from-sky-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
];

export default function ChatPanel({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const payload = getTokenPayload();
    setCurrentUserId(payload?.sub ?? null);
  }, []);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function loadMessages() {
    try {
      setMessages(await chatApi.listMessages(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSending(true);
    setError('');
    try {
      const message = await chatApi.sendMessage(projectId, text);
      setMessages((prev) => [...prev, message]);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M8 10h8M8 14h5M21 12a9 9 0 1 1-3.6-7.2L21 4l-1 4.2A8.9 8.9 0 0 1 21 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Chat do projeto
            </h2>
            <p className="text-xs text-slate-500">
              {messages.length}{' '}
              {messages.length === 1 ? 'mensagem' : 'mensagens'}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          ao vivo
        </span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {loading ? (
          <p className="text-sm text-slate-500">Carregando mensagens...</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path
                  d="M8 10h8M8 14h5M21 12a9 9 0 1 1-3.6-7.2L21 4l-1 4.2A8.9 8.9 0 0 1 21 12Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Nenhuma mensagem ainda
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Comece a conversa com sua equipe.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            const colorIndex =
              (message.sender_name?.length ?? 0) % AVATAR_COLORS.length;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${AVATAR_COLORS[colorIndex]}`}
                >
                  {initials(message.sender_name)}
                </span>
                <div
                  className={`min-w-0 max-w-[75%] ${isOwn ? 'items-end text-right' : ''}`}
                >
                  <div
                    className={`flex items-baseline gap-2 ${isOwn ? 'justify-end' : ''}`}
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {isOwn ? 'Você' : message.sender_name || 'Usuário'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`mt-1 inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                      isOwn
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-slate-100 bg-slate-50/50 p-3"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input"
          placeholder="Escreva uma mensagem..."
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="btn-primary shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
          </svg>
          Enviar
        </button>
      </form>
    </div>
  );
}
