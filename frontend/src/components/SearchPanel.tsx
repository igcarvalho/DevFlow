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
      const data = await searchApi.query(projectId, q, type);
      setResults(data);
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
        className="rounded-xl border border-gray-200 bg-white p-5"
      >
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Buscar no projeto
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="Buscar por documentos, conteúdo ou mensagens..."
          />
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as 'all' | 'documents' | 'messages')
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Tudo</option>
            <option value="documents">Documentos</option>
            <option value="messages">Mensagens</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      {searched && results && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            {results.total} resultado(s) para &ldquo;{results.query}&rdquo;
          </p>

          {results.documents.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Documentos ({results.documents.length})
              </h3>
              <ul className="space-y-3">
                {results.documents.map((doc) => (
                  <li
                    key={`${doc.id}-${doc.version_id}`}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    {doc.snippet && (
                      <p className="mt-1 text-sm text-gray-600">{doc.snippet}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.messages.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Mensagens ({results.messages.length})
              </h3>
              <ul className="space-y-3">
                {results.messages.map((message) => (
                  <li
                    key={message.id}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <p className="text-xs font-medium text-gray-500">
                      {message.sender_name || 'Usuário'} ·{' '}
                      {new Date(message.created_at).toLocaleString('pt-BR')}
                    </p>
                    <p className="mt-1 text-sm text-gray-800">
                      {message.snippet || message.content}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.total === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-gray-600">Nenhum resultado encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
