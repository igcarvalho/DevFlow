'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Issue, IssuePriority, IssueStatus, issuesApi } from '@/lib/api';

const COLUMNS: {
  status: IssueStatus;
  label: string;
  accent: string;
  dot: string;
}[] = [
  {
    status: 'backlog',
    label: 'Backlog',
    accent: 'border-slate-300',
    dot: 'bg-slate-400',
  },
  {
    status: 'todo',
    label: 'A fazer',
    accent: 'border-sky-300',
    dot: 'bg-sky-500',
  },
  {
    status: 'in_progress',
    label: 'Em progresso',
    accent: 'border-amber-300',
    dot: 'bg-amber-500',
  },
  {
    status: 'done',
    label: 'Concluído',
    accent: 'border-emerald-300',
    dot: 'bg-emerald-500',
  },
];

const PRIORITY_STYLES: Record<IssuePriority, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
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
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tarefas</h2>
          <p className="text-sm text-slate-500">
            {issues.length} {issues.length === 1 ? 'tarefa' : 'tarefas'} no
            projeto
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? (
            'Cancelar'
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Nova tarefa
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 animate-scale-in space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
        >
          <div>
            <label className="label">Título da tarefa</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="O que precisa ser feito?"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Prioridade</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as IssuePriority)}
              className="input"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-ghost"
            >
              Cancelar
            </button>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? 'Criando...' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnIssues = issues.filter(
              (i) => i.status === column.status,
            );
            return (
              <div
                key={column.status}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${column.dot}`}
                    />
                    <h3 className="text-sm font-semibold text-slate-700">
                      {column.label}
                    </h3>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
                    {columnIssues.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {columnIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`group rounded-xl border-l-[3px] ${column.accent} border-y border-r border-slate-200 bg-white p-3 shadow-soft transition hover:shadow-card`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-slate-900">
                          {issue.title}
                        </p>
                        <button
                          onClick={() => removeIssue(issue)}
                          className="shrink-0 text-slate-300 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                          title="Remover"
                        >
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                        </button>
                      </div>

                      <span
                        className={`badge border ${PRIORITY_STYLES[issue.priority]}`}
                      >
                        {PRIORITY_LABELS[issue.priority]}
                      </span>

                      <div className="mt-3 flex flex-wrap gap-1 opacity-0 transition group-hover:opacity-100">
                        {COLUMNS.filter((c) => c.status !== issue.status).map(
                          (c) => (
                            <button
                              key={c.status}
                              onClick={() => moveIssue(issue, c.status)}
                              className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-500 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                            >
                              {c.label}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  ))}

                  {columnIssues.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center">
                      <p className="text-xs text-slate-400">Vazio</p>
                    </div>
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
