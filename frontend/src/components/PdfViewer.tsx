'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  Annotation,
  AnnotationType,
  annotationsApi,
  documentFileUrl,
} from '@/lib/api';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const TYPE_LABELS: Record<AnnotationType, string> = {
  note: 'Nota',
  highlight: 'Destaque',
  comment: 'Comentário',
};

const TYPE_STYLES: Record<AnnotationType, string> = {
  note: 'bg-amber-50 text-amber-700 border border-amber-200',
  highlight: 'bg-blue-50 text-blue-700 border border-blue-200',
  comment: 'bg-violet-50 text-violet-700 border border-violet-200',
};

interface Props {
  projectId: string;
  documentId: string;
  versionId: string;
}

export default function PdfViewer({ projectId, documentId, versionId }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [type, setType] = useState<AnnotationType>('note');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const fileUrl = documentFileUrl(projectId, documentId, versionId);

  useEffect(() => {
    loadAnnotations();
  }, [projectId, documentId]);

  async function loadAnnotations() {
    try {
      setAnnotations(await annotationsApi.list(projectId, documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar anotações');
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

  const pageAnnotations = annotations.filter((a) => a.page_number === page);

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 disabled:opacity-40"
            >
              ←
            </button>
            <span className="text-sm text-slate-600">
              Página {page} de {numPages || '?'}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(numPages || 1, p + 1))}
              disabled={page >= numPages}
              className="rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 disabled:opacity-40"
            >
              →
            </button>
          </div>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary-600 hover:underline"
          >
            Abrir em nova aba
          </a>
        </div>

        <div className="flex max-h-[600px] justify-center overflow-auto rounded border border-slate-200 bg-slate-200 p-2">
          {loadError ? (
            <p className="p-6 text-sm text-red-600">{loadError}</p>
          ) : (
            <Document
              file={fileUrl}
              onLoadSuccess={({ numPages: total }) => setNumPages(total)}
              onLoadError={() =>
                setLoadError('Não foi possível carregar o PDF no visualizador.')
              }
              loading={<p className="p-6 text-sm text-slate-600">Carregando PDF...</p>}
            >
              <Page
                pageNumber={page}
                width={560}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Document>
          )}
        </div>
      </div>

      <aside className="flex flex-col">
        <h4 className="mb-2 text-sm font-semibold text-slate-800">
          Anotações da página {page}
        </h4>

        {error && (
          <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="mb-3 flex-1 space-y-2 overflow-y-auto">
          {pageAnnotations.length === 0 ? (
            <p className="text-xs text-slate-500">
              Nenhuma anotação nesta página.
            </p>
          ) : (
            pageAnnotations.map((annotation) => (
              <div
                key={annotation.id}
                className="rounded border border-slate-200 bg-white p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_STYLES[annotation.type]}`}
                  >
                    {TYPE_LABELS[annotation.type]}
                  </span>
                  <button
                    onClick={() => handleRemove(annotation)}
                    className="text-xs text-slate-400 hover:text-red-600"
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-800">
                  {annotation.content}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {annotation.author_name}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAdd} className="space-y-2 border-t border-slate-200 pt-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AnnotationType)}
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-primary-500"
          >
            <option value="note">Nota</option>
            <option value="highlight">Destaque</option>
            <option value="comment">Comentário</option>
          </select>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-primary-500"
            placeholder={`Anotar na página ${page}...`}
          />
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Adicionar anotação'}
          </button>
        </form>
      </aside>
    </div>
  );
}
