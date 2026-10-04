'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Project, projectsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'há 1 mês';
  return `há ${months} meses`;
}

const PROJECT_COLORS = [
  'from-primary-500 to-accent-500',
  'from-sky-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-violet-500 to-purple-500',
];

export default function DashboardPage() {
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/login');
    }
  }, [authLoading, authenticated, router]);

  useEffect(() => {
    if (!authenticated) return;
    loadProjects();
  }, [authenticated]);

  async function loadProjects() {
    setLoading(true);
    try {
      setProjects(await projectsApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError('');
    try {
      await projectsApi.create(name, description || undefined);
      setName('');
      setDescription('');
      setShowForm(false);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || (!authenticated && loading)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mesh">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-slate-500">Carregando...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Cabeçalho */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Meus projetos
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {projects.length === 0
                ? 'Comece criando seu primeiro espaço de colaboração'
                : `Você participa de ${projects.length} ${
                    projects.length === 1 ? 'projeto' : 'projetos'
                  }`}
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
                Novo projeto
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Formulário de criação */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mt-6 animate-scale-in space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M3.75 3A2.25 2.25 0 0 0 1.5 5.25v9.5A2.25 2.25 0 0 0 3.75 17h12.5a2.25 2.25 0 0 0 2.25-2.25v-9.5A2.25 2.25 0 0 0 16.25 3H3.75Zm.75 4a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5A.75.75 0 0 1 4.5 7Zm0 3a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4.5 10Z" />
                </svg>
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Criar novo projeto
                </h2>
                <p className="text-xs text-slate-500">
                  Um espaço isolado para documentos, conversas e tarefas
                </p>
              </div>
            </div>

            <div>
              <label className="label">Nome do projeto</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Ex: Documentação da API"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Descrição (opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="Descreva o objetivo do projeto"
              />
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
                {creating ? 'Criando...' : 'Criar projeto'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de projetos */}
        {loading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-10 animate-fade-in rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 shadow-glow">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-white">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              Nenhum projeto ainda
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
              Crie seu primeiro projeto para começar a organizar documentos,
              conversas e tarefas com sua equipe.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-6"
            >
              Criar primeiro projeto
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="group card card-hover animate-slide-up overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`h-1.5 w-full bg-gradient-to-r ${
                    PROJECT_COLORS[index % PROJECT_COLORS.length]
                  }`}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                        PROJECT_COLORS[index % PROJECT_COLORS.length]
                      } text-white shadow-sm`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                        <path
                          d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  <h3 className="mt-4 truncate font-semibold text-slate-900">
                    {project.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 h-10 text-sm leading-relaxed text-slate-600">
                    {project.description || 'Sem descrição'}
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Criado {timeAgo(project.created_at)}
                  </div>
                </div>
              </Link>
            ))}

            {/* Card de criar novo */}
            <button
              onClick={() => setShowForm(true)}
              className="group flex min-h-[176px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white/40 p-5 text-slate-500 transition hover:border-primary-300 hover:bg-white hover:text-primary-600"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition group-hover:bg-primary-50">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              </span>
              <span className="text-sm font-medium">Novo projeto</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
