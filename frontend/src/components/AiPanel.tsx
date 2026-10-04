'use client';

import { useEffect, useState } from 'react';
import { AiJob, Document, aiApi, documentsApi } from '@/lib/api';

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-orange-50 text-orange-700',
  urgent: 'bg-red-50 text-red-700',
};

export default function AiPanel({ projectId }: { projectId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [question, setQuestion] = useState('');
  const [job, setJob] = useState<AiJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  async function loadDocuments() {
    try {
      const docs = await documentsApi.list(projectId);
      setDocuments(docs);
      if (docs.length > 0) setSelectedDoc(docs[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar documentos');
    }
  }

  async function pollJob(projectId: string, jobId: string) {
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const current = await aiApi.getJob(projectId, jobId);
      setJob(current);
      if (current.status === 'completed' || current.status === 'failed') {
        return;
      }
    }
  }

  async function run(action: 'summarize' | 'ask' | 'suggest') {
    setError('');
    setJob(null);
    setLoading(true);
    try {
      let created: AiJob;
      if (action === 'summarize') {
        if (!selectedDoc) throw new Error('Selecione um documento');
        created = await aiApi.summarize(projectId, selectedDoc);
      } else if (action === 'ask') {
        if (!selectedDoc) throw new Error('Selecione um documento');
        if (!question.trim()) throw new Error('Digite uma pergunta');
        created = await aiApi.ask(projectId, selectedDoc, question.trim());
      } else {
        created = await aiApi.suggestTasks(projectId);
      }
      setJob(created);
      await pollJob(projectId, created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar IA');
    } finally {
      setLoading(false);
    }
  }

  function renderResult() {
    if (!job) return null;
    if (job.status === 'failed') {
      return (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {job.error_message || 'Falha ao processar'}
        </div>
      );
    }
    if (job.status !== 'completed' || !job.result) {
      return (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          Processando... isso pode levar alguns segundos.
        </div>
      );
    }

    if (job.type === 'summarize') {
      return (
        <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
          {String(job.result.summary || '')}
        </div>
      );
    }
    if (job.type === 'ask') {
      return (
        <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
          {String(job.result.answer || '')}
        </div>
      );
    }
    const tasks = (job.result.tasks as Array<Record<string, string>>) || [];
    if (tasks.length === 0) {
      return <p className="text-sm text-slate-500">Nenhuma tarefa sugerida.</p>;
    }
    return (
      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li
            key={index}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"
          >
            <p className="text-sm font-medium text-slate-900">{task.title}</p>
            {task.description && (
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {task.description}
              </p>
            )}
            <span
              className={`badge mt-2 ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}
            >
              {task.priority || 'medium'}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const notConfigured = error.toLowerCase().includes('indisponível');

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-accent-50/40 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M12 3l1.9 4.6L18 9l-4.1 1.4L12 15l-1.9-4.6L6 9l4.1-1.4L12 3Zm7 11l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">Assistente de IA</h2>
            <p className="text-xs text-slate-600">
              Resumos, perguntas e tarefas com base no conteúdo do projeto
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {error && !notConfigured && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {notConfigured && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <p className="font-medium">Como ativar a IA</p>
              <p className="mt-1">
                Configure uma chave gratuita do Groq em{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                >
                  console.groq.com/keys
                </a>{' '}
                e defina{' '}
                <code className="rounded bg-blue-100 px-1">AI_API_KEY</code> no
                arquivo <code className="rounded bg-blue-100 px-1">.env</code>.
              </p>
            </div>
          )}

          <div>
            <label className="label">Documento</label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="input"
            >
              {documents.length === 0 && (
                <option value="">Nenhum documento</option>
              )}
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => run('summarize')}
              disabled={loading || !selectedDoc}
              className="btn-primary"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M4 3.5A1.5 1.5 0 0 1 5.5 2h5.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 16 6.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 16.5v-13Zm5.75 3.25a.75.75 0 0 0-1.5 0v3.69l-.97-.97a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l2.25-2.25a.75.75 0 0 0-1.06-1.06l-.97.97V6.75Z"
                  clipRule="evenodd"
                />
              </svg>
              Resumir documento
            </button>
            <button
              onClick={() => run('suggest')}
              disabled={loading}
              className="btn-secondary"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                  clipRule="evenodd"
                />
              </svg>
              Sugerir tarefas do chat
            </button>
          </div>

          <div>
            <label className="label">Perguntar sobre o documento</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="input"
                placeholder="Ex: Quais são os requisitos principais?"
              />
              <button
                onClick={() => run('ask')}
                disabled={loading || !selectedDoc}
                className="btn bg-slate-900 text-white hover:bg-slate-800"
              >
                Perguntar
              </button>
            </div>
          </div>
        </div>
      </div>

      {(job || loading) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Resultado
              {job && (
                <span className="ml-2 font-normal text-slate-400">
                  {job.type === 'summarize'
                    ? 'Resumo'
                    : job.type === 'ask'
                      ? 'Resposta'
                      : 'Tarefas sugeridas'}
                </span>
              )}
            </h3>
          </div>
          {loading && !job ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
              Processando...
            </div>
          ) : (
            renderResult()
          )}
        </div>
      )}
    </div>
  );
}
