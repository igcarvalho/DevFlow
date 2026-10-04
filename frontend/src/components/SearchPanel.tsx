'use client';

import { FormEvent, useState } from 'react';
import { SearchResponse, searchApi } from '@/lib/api';

export default function SearchPanel({ projectId }: { projectId: string }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'documents' | 'messages'>('all');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError('Digite pelo menos 2 caracteres');
      return;
    }
    setError('');
    setLoading(true);
    try {
      setResults(await searchApi.query(projectId, q, type));
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">Buscar no projeto</h2>
            <p className="text-xs text-slate-500">
              Encontre informações em documentos e mensagens
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input flex-1"
            placeholder="Buscar por documentos, conteúdo ou mensagens..."
          />
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as 'all' | 'documents' | 'messages')
            }
            className="input sm:w-40"
          >
            <option value="all">Tudo</option>
            <option value="documents">Documentos</option>
            <option value="messages">Mensagens</option>
          </select>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      {searched && results && (
        <div className="animate-fade-in space-y-6">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {results.total}
            </span>{' '}
            resultado(s) para &ldquo;{results.query}&rdquo;
          </p>

          {results.documents.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                Documentos ({results.documents.length})
              </h3>
              <ul className="space-y-3">
                {results.documents.map((doc) => (
                  <li
                    key={`${doc.id}-${doc.version_id}`}
                    className="card card-hover p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                          <path
                            d="M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <p className="font-medium text-slate-900">{doc.title}</p>
                    </div>
                    {doc.snippet && (
                      <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                        {doc.snippet}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.messages.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Mensagens ({results.messages.length})
              </h3>
              <ul className="space-y-3">
                {results.messages.map((message) => (
                  <li key={message.id} className="card card-hover p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-xs font-semibold text-white">
                        {(message.sender_name || '?').charAt(0).toUpperCase()}
                      </span>
                      <p className="text-xs font-medium text-slate-600">
                        {message.sender_name || 'Usuário'}
                      </p>
                      <span className="text-xs text-slate-400">
                        {new Date(message.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-800">
                      {message.snippet || message.content}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.total === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                Nenhum resultado encontrado
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tente outros termos ou verifique a ortografia.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
