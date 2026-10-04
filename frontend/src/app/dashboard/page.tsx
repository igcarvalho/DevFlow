'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Project, projectsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const { authenticated, loading: authLoading, signOut } = useAuth();
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
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-primary-700">
            DevFlow
          </Link>
          <button
            onClick={signOut}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus projetos</h1>
            <p className="text-sm text-gray-600">
              Espaços colaborativos que você participa
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            {showForm ? 'Cancelar' : 'Novo projeto'}
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
            className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome do projeto
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Ex: Documentação da API"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Descreva o objetivo do projeto"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-60"
            >
              {creating ? 'Criando...' : 'Criar projeto'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500">Carregando projetos...</p>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-600">
              Você ainda não participa de nenhum projeto.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Crie um projeto para começar a colaborar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-primary-300 hover:shadow-md"
              >
                <h2 className="font-semibold text-gray-900">{project.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                  {project.description || 'Sem descrição'}
                </p>
                <p className="mt-3 text-xs text-gray-400">
                  Criado em{' '}
                  {new Date(project.created_at).toLocaleDateString('pt-BR')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
