'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Document,
  ProjectWithMembers,
  documentsApi,
  projectsApi,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import ChatPanel from '@/components/ChatPanel';
import IssuesBoard from '@/components/IssuesBoard';
import AiPanel from '@/components/AiPanel';
import SearchPanel from '@/components/SearchPanel';
import DocumentAnnotations from '@/components/DocumentAnnotations';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
  loading: () => (
    <p className="mt-3 text-sm text-slate-500">Carregando visualizador...</p>
  ),
});

const STATUS_LABELS: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: 'Aguardando',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  processing: {
    label: 'Processando',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500 animate-pulse',
  },
  completed: {
    label: 'Concluído',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: 'Erro',
    className: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
};

const TABS = [
  {
    id: 'documents',
    label: 'Documentos',
    icon: (
      <path
        d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: (
      <path
        d="M8 10h8M8 14h5M21 12a9 9 0 1 1-3.6-7.2L21 4l-1 4.2A8.9 8.9 0 0 1 21 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: 'issues',
    label: 'Tarefas',
    icon: (
      <path
        d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: 'ai',
    label: 'IA',
    icon: (
      <path
        d="M12 3l1.9 4.6L18 9l-4.1 1.4L12 15l-1.9-4.6L6 9l4.1-1.4L12 3Zm7 11l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: 'search',
    label: 'Busca',
    icon: (
      <path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    ),
  },
] as const;

type TabId = (typeof TABS)[number]['id'];

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
  const [showMemberForm, setShowMemberForm] = useState(false);

  const [activeTab, setActiveTab] = useState<TabId>('documents');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

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
      <div className="min-h-screen bg-mesh">
        <AppHeader />
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-slate-500">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <AppHeader />

      {/* Cabeçalho do projeto */}
      <div className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <nav className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/dashboard"
              className="transition hover:text-primary-600"
            >
              Projetos
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-700">{project?.name}</span>
          </nav>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
                {project?.name}
              </h1>
              {project?.description && (
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="badge border border-slate-200 bg-white text-slate-600">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="mr-1 h-3.5 w-3.5 text-slate-400"
                >
                  <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
                </svg>
                {project?.members.length ?? 0}{' '}
                {(project?.members.length ?? 0) === 1 ? 'membro' : 'membros'}
              </span>
              <span className="badge border border-slate-200 bg-white text-slate-600">
                {documents.length}{' '}
                {documents.length === 1 ? 'documento' : 'documentos'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Abas */}
            <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-soft">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 shrink-0"
                  >
                    {tab.icon}
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'chat' ? (
              <ChatPanel projectId={projectId} />
            ) : activeTab === 'issues' ? (
              <IssuesBoard projectId={projectId} />
            ) : activeTab === 'ai' ? (
              <AiPanel projectId={projectId} />
            ) : activeTab === 'search' ? (
              <SearchPanel projectId={projectId} />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Documentos
                  </h2>
                  <button
                    onClick={refreshStatuses}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition hover:text-primary-700"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Atualizar
                  </button>
                </div>

                {/* Upload */}
                <form
                  onSubmit={handleUpload}
                  className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px]">
                        <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                        <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Enviar documento
                      </h3>
                      <p className="text-xs text-slate-500">
                        PDF ou PowerPoint, até 50 MB
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label text-xs">Arquivo</label>
                      <input
                        id="file-input"
                        type="file"
                        accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setFile(f);
                          if (f && !title)
                            setTitle(f.name.replace(/\.[^.]+$/, ''));
                        }}
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Título</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input py-2"
                        placeholder="Título do documento"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!file || uploading}
                    className="btn-primary"
                  >
                    {uploading ? 'Enviando...' : 'Enviar documento'}
                  </button>
                </form>

                {/* Lista */}
                {documents.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-12 text-center">
                    <p className="text-sm text-slate-600">
                      Nenhum documento ainda.
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Envie um PDF ou PowerPoint para começar.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {documents.map((doc) => {
                      const status =
                        STATUS_LABELS[doc.status] || STATUS_LABELS.pending;
                      const isExpanded = expandedDoc === doc.id;
                      return (
                        <li
                          key={doc.id}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition hover:border-slate-300"
                        >
                          <div className="flex items-center justify-between gap-3 p-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                  doc.mime_type === 'application/pdf'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-orange-50 text-orange-600'
                                }`}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className="h-5 w-5"
                                >
                                  <path
                                    d="M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900">
                                  {doc.title}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(doc.created_at).toLocaleDateString(
                                    'pt-BR',
                                    {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    },
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={`badge border ${status.className}`}
                              >
                                <span
                                  className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status.dot}`}
                                />
                                {status.label}
                              </span>
                              <button
                                onClick={() =>
                                  setExpandedDoc(isExpanded ? null : doc.id)
                                }
                                className="btn-secondary px-3 py-1.5 text-xs"
                              >
                                {isExpanded ? 'Fechar' : 'Abrir'}
                              </button>
                            </div>
                          </div>

                          {isExpanded && doc.current_version_id && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                              {doc.mime_type === 'application/pdf' ? (
                                <PdfViewer
                                  projectId={projectId}
                                  documentId={doc.id}
                                  versionId={doc.current_version_id}
                                />
                              ) : (
                                <DocumentAnnotations
                                  projectId={projectId}
                                  documentId={doc.id}
                                  versionId={doc.current_version_id}
                                />
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Membros</h2>
                <button
                  onClick={() => setShowMemberForm((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-primary-50 hover:text-primary-600"
                  title="Adicionar membro"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                </button>
              </div>

              <ul className="space-y-3">
                {project?.members.map((member) => (
                  <li key={member.id} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-xs font-semibold text-white">
                      {(member.full_name || member.email || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {member.full_name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {member.email}
                      </p>
                    </div>
                    <span
                      className={`badge shrink-0 ${
                        member.role === 'owner'
                          ? 'bg-primary-50 text-primary-700'
                          : member.role === 'admin'
                            ? 'bg-violet-50 text-violet-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {member.role === 'owner'
                        ? 'Dono'
                        : member.role === 'admin'
                          ? 'Admin'
                          : 'Membro'}
                    </span>
                  </li>
                ))}
              </ul>

              {showMemberForm && (
                <form
                  onSubmit={handleAddMember}
                  className="mt-4 animate-scale-in space-y-2 border-t border-slate-100 pt-4"
                >
                  <label className="label text-xs">
                    Adicionar por email
                  </label>
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="input py-2 text-sm"
                    placeholder="pessoa@email.com"
                  />
                  <button type="submit" className="btn-secondary w-full py-2 text-sm">
                    Adicionar membro
                  </button>
                  {memberMessage && (
                    <p className="text-xs text-slate-600">{memberMessage}</p>
                  )}
                </form>
              )}
            </section>

            <section className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-accent-50/40 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path
                      d="M12 3l1.9 4.6L18 9l-4.1 1.4L12 15l-1.9-4.6L6 9l4.1-1.4L12 3Zm7 11l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="text-sm font-semibold text-slate-900">
                  Dica
                </h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Use a aba <strong>IA</strong> para resumir documentos, fazer
                perguntas sobre o conteúdo ou gerar tarefas a partir da conversa
                do projeto.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
