'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Annotation, AnnotationType, annotationsApi } from '@/lib/api';

const TYPE_LABELS: Record<AnnotationType, string> = {
  note: 'Nota',
  highlight: 'Destaque',
  comment: 'Comentário',
};

const TYPE_STYLES: Record<AnnotationType, string> = {
  note: 'bg-yellow-100 text-yellow-800',
  highlight: 'bg-blue-100 text-blue-800',
  comment: 'bg-purple-100 text-purple-800',
};

interface Props {
  projectId: string;
  documentId: string;
  versionId: string;
}

export default function DocumentAnnotations({
  projectId,
  documentId,
  versionId,
}: Props) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [type, setType] = useState<AnnotationType>('note');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAnnotations();
  }, [projectId, documentId]);

  async function loadAnnotations() {
    setLoading(true);
    try {
      setAnnotations(await annotationsApi.list(projectId, documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar anotações');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError('');
    try {
      const annotation = await annotationsApi.create(projectId, documentId, {
        version_id: versionId,
        page_number: page,
        type,
        content: content.trim(),
      });
      setAnnotations((prev) => [...prev, annotation]);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar anotação');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(annotation: Annotation) {
    try {
      await annotationsApi.remove(projectId, documentId, annotation.id);
      setAnnotations((prev) => prev.filter((a) => a.id !== annotation.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover anotação');
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-800">Anotações</h4>

      {error && (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-xs text-gray-500">Carregando...</p>
      ) : annotations.length === 0 ? (
        <p className="mb-3 text-xs text-gray-500">
          Nenhuma anotação ainda. Adicione a primeira abaixo.
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {annotations.map((annotation) => (
            <li
              key={annotation.id}
              className="flex items-start justify-between gap-3 rounded border border-gray-200 bg-white p-3"
            >
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    Pág. {annotation.page_number}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_STYLES[annotation.type]}`}
                  >
                    {TYPE_LABELS[annotation.type]}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-800">
                  {annotation.content}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {annotation.author_name} ·{' '}
                  {new Date(annotation.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => handleRemove(annotation)}
                className="shrink-0 text-xs text-gray-400 hover:text-red-600"
                title="Remover"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="space-y-2 border-t border-gray-200 pt-3">
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary-500"
            placeholder="Pág."
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AnnotationType)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary-500"
          >
            <option value="note">Nota</option>
            <option value="highlight">Destaque</option>
            <option value="comment">Comentário</option>
          </select>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary-500"
          placeholder="Escreva sua anotação..."
        />
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Adicionar anotação'}
        </button>
      </form>
    </div>
  );
}
