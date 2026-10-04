'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Issue, IssuePriority, IssueStatus, issuesApi } from '@/lib/api';

const COLUMNS: { status: IssueStatus; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'todo', label: 'A fazer' },
  { status: 'in_progress', label: 'Em progresso' },
  { status: 'done', label: 'Concluído' },
];

const PRIORITY_STYLES: Record<IssuePriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export default function IssuesBoard({ projectId }: { projectId: string }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadIssues();
  }, [projectId]);

  async function loadIssues() {
    setLoading(true);
    try {
      setIssues(await issuesApi.list(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError('');
    try {
      const issue = await issuesApi.create(projectId, {
        title: title.trim(),
        priority,
      });
      setIssues((prev) => [issue, ...prev]);
      setTitle('');
      setPriority('medium');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa');
    } finally {
      setCreating(false);
    }
  }

  async function moveIssue(issue: Issue, status: IssueStatus) {
    try {
      const updated = await issuesApi.update(projectId, issue.id, { status });
      setIssues((prev) => prev.map((i) => (i.id === issue.id ? updated : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover tarefa');
    }
  }

  async function removeIssue(issue: Issue) {
    try {
      await issuesApi.remove(projectId, issue.id);
      setIssues((prev) => prev.filter((i) => i.id !== issue.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover tarefa');
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tarefas</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          {showForm ? 'Cancelar' : 'Nova tarefa'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="O que precisa ser feito?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Prioridade
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as IssuePriority)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {creating ? 'Criando...' : 'Criar tarefa'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando tarefas...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnIssues = issues.filter((i) => i.status === column.status);
            return (
              <div key={column.status} className="rounded-xl bg-gray-100 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {column.label}
                  </h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500">
                    {columnIssues.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {issue.title}
                        </p>
                        <button
                          onClick={() => removeIssue(issue)}
                          className="shrink-0 text-xs text-gray-400 hover:text-red-600"
                          title="Remover"
                        >
                          ✕
                        </button>
                      </div>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[issue.priority]}`}
                      >
                        {PRIORITY_LABELS[issue.priority]}
                      </span>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {COLUMNS.filter((c) => c.status !== issue.status).map(
                          (c) => (
                            <button
                              key={c.status}
                              onClick={() => moveIssue(issue, c.status)}
                              className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 transition hover:bg-gray-50"
                            >
                              → {c.label}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                  {columnIssues.length === 0 && (
                    <p className="px-1 py-2 text-xs text-gray-400">
                      Nenhuma tarefa
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
