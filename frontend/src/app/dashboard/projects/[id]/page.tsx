'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Document,
  ProjectWithMembers,
  documentsApi,
  projectsApi,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Aguardando', className: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Processando', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Erro', className: 'bg-red-100 text-red-800' },
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { authenticated, loading: authLoading } = useAuth();

  const [project, setProject] = useState<ProjectWithMembers | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberMessage, setMemberMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/login');
    }
  }, [authLoading, authenticated, router]);

  useEffect(() => {
    if (!authenticated || !projectId) return;
    loadData();
  }, [authenticated, projectId]);

  async function loadData() {
    setLoading(true);
    try {
      const [projectData, documentsData] = await Promise.all([
        projectsApi.get(projectId),
        documentsApi.list(projectId),
      ]);
      setProject(projectData);
      setDocuments(documentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar projeto');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await documentsApi.upload(projectId, file, title || file.name);
      setFile(null);
      setTitle('');
      const input = document.getElementById('file-input') as HTMLInputElement;
      if (input) input.value = '';
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleAddMember(event: FormEvent) {
    event.preventDefault();
    setMemberMessage('');
    try {
      await projectsApi.addMember(projectId, memberEmail);
      setMemberEmail('');
      setMemberMessage('Membro adicionado!');
      await loadData();
    } catch (err) {
      setMemberMessage(err instanceof Error ? err.message : 'Erro ao adicionar');
    }
  }

  async function refreshStatuses() {
    try {
      setDocuments(await documentsApi.list(projectId));
    } catch {
      // silencioso
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Carregando projeto...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            ← Projetos
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-900">{project?.name}</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {project?.description && (
          <p className="mb-6 text-gray-600">{project.description}</p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Documentos</h2>
              <button
                onClick={refreshStatuses}
                className="text-sm text-primary-600 hover:underline"
              >
                Atualizar status
              </button>
            </div>

            <form
              onSubmit={handleUpload}
              className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-5"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Arquivo (PDF ou PPTX)
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
                  }}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Título do documento"
                />
              </div>
              <button
                type="submit"
                disabled={!file || uploading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
              >
                {uploading ? 'Enviando...' : 'Enviar documento'}
              </button>
            </form>

            {documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-gray-600">Nenhum documento ainda.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc) => {
                  const status = STATUS_LABELS[doc.status] || STATUS_LABELS.pending;
                  return (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <span
                        className={`ml-3 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Membros</h2>
              <ul className="space-y-2">
                {project?.members.map((member) => (
                  <li key={member.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {member.full_name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {member.email}
                      </p>
                    </div>
                    <span className="ml-2 shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {member.role}
                    </span>
                  </li>
                ))}
              </ul>

              <form onSubmit={handleAddMember} className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Adicionar membro por email
                </label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="pessoa@email.com"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg border border-primary-600 px-4 py-2 text-sm font-medium text-primary-600 transition hover:bg-primary-50"
                >
                  Adicionar
                </button>
                {memberMessage && (
                  <p className="text-xs text-gray-600">{memberMessage}</p>
                )}
              </form>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
