'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Message, chatApi } from '@/lib/api';

export default function ChatPanel({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

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
      const data = await chatApi.listMessages(projectId);
      setMessages(data);
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
    <div className="flex h-[600px] flex-col rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="font-semibold text-gray-900">Chat do projeto</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="text-sm text-gray-500">Carregando mensagens...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma mensagem ainda. Comece a conversa!
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {(message.sender_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {message.sender_name || 'Usuário'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          placeholder="Escreva uma mensagem..."
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
