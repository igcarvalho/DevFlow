'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Annotation, AnnotationType, annotationsApi } from '@/lib/api';

const TYPE_LABELS: Record<AnnotationType, string> = {
  note: 'Nota',
  highlight: 'Destaque',
  comment: 'Comentário',
};

const TYPE_STYLES: Record<AnnotationType, string> = {
  note: 'bg-amber-50 text-amber-700 border-amber-200',
  highlight: 'bg-blue-50 text-blue-700 border-blue-200',
  comment: 'bg-violet-50 text-violet-700 border-violet-200',
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Anotações</h4>
          <p className="text-xs text-slate-500">
            {annotations.length}{' '}
            {annotations.length === 1 ? 'anotação' : 'anotações'} neste documento
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-xs text-slate-500">Carregando...</p>
      ) : annotations.length === 0 ? (
        <div className="mb-4 rounded-xl border border-dashed border-slate-200 py-8 text-center">
          <p className="text-xs text-slate-500">
            Nenhuma anotação ainda. Adicione a primeira abaixo.
          </p>
        </div>
      ) : (
        <ul className="mb-4 space-y-2">
          {annotations.map((annotation) => (
            <li
              key={annotation.id}
              className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:bg-white"
            >
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    Pág. {annotation.page_number}
                  </span>
                  <span
                    className={`badge border ${TYPE_STYLES[annotation.type]}`}
                  >
                    {TYPE_LABELS[annotation.type]}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-800">
                  {annotation.content}
                </p>
                <p className="mt-1.5 text-xs text-slate-400">
                  {annotation.author_name} ·{' '}
                  {new Date(annotation.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => handleRemove(annotation)}
                className="shrink-0 text-slate-300 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                title="Remover"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="space-y-2 border-t border-slate-100 pt-4">
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="input w-20 py-2 text-sm"
            placeholder="Pág."
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AnnotationType)}
            className="input py-2 text-sm"
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
          className="input resize-none text-sm"
          placeholder="Escreva sua anotação..."
        />
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="btn bg-slate-900 text-white hover:bg-slate-800"
        >
          {saving ? 'Salvando...' : 'Adicionar anotação'}
        </button>
      </form>
    </div>
  );
}
