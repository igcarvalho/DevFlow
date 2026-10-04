'use client';

import { useEffect, useState } from 'react';
import { AiJob, Document, aiApi, documentsApi } from '@/lib/api';

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
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {job.error_message || 'Falha ao processar'}
        </div>
      );
    }
    if (job.status !== 'completed' || !job.result) {
      return (
        <p className="text-sm text-gray-500">
          {job.status === 'pending' || job.status === 'processing'
            ? 'Processando... isso pode levar alguns segundos.'
            : 'Sem resultado'}
        </p>
      );
    }

    if (job.type === 'summarize') {
      return (
        <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
          {String(job.result.summary || '')}
        </div>
      );
    }
    if (job.type === 'ask') {
      return (
        <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
          {String(job.result.answer || '')}
        </div>
      );
    }
    const tasks = (job.result.tasks as Array<Record<string, string>>) || [];
    if (tasks.length === 0) {
      return <p className="text-sm text-gray-500">Nenhuma tarefa sugerida.</p>;
    }
    return (
      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li key={index} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-sm font-medium text-gray-900">{task.title}</p>
            {task.description && (
              <p className="mt-1 text-xs text-gray-600">{task.description}</p>
            )}
            <span className="mt-2 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {task.priority || 'medium'}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Assistente de IA
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Resuma documentos, faça perguntas sobre o conteúdo ou gere tarefas a
          partir da conversa do projeto.
        </p>

        {error && error.toLowerCase().includes('indisponível') && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <p className="font-medium">Como ativar a IA</p>
            <p className="mt-1">
              Configure uma chave gratuita do Groq em{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                console.groq.com/keys
              </a>{' '}
              e defina <code className="rounded bg-blue-100 px-1">AI_API_KEY</code>{' '}
              no arquivo <code className="rounded bg-blue-100 px-1">.env</code>.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Documento
            </label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              {documents.length === 0 && <option value="">Nenhum documento</option>}
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => run('summarize')}
              disabled={loading || !selectedDoc}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              Resumir documento
            </button>
            <button
              onClick={() => run('suggest')}
              disabled={loading}
              className="rounded-lg border border-primary-600 px-4 py-2 text-sm font-medium text-primary-600 transition hover:bg-primary-50 disabled:opacity-50"
            >
              Sugerir tarefas do chat
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Perguntar sobre o documento
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Ex: Quais são os requisitos principais?"
              />
              <button
                onClick={() => run('ask')}
                disabled={loading || !selectedDoc}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                Perguntar
              </button>
            </div>
          </div>
        </div>
      </div>

      {(job || loading) && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Resultado</h3>
          {loading && !job ? (
            <p className="text-sm text-gray-500">Processando...</p>
          ) : (
            renderResult()
          )}
        </div>
      )}
    </div>
  );
}
