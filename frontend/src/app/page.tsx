import Link from 'next/link';
import Logo from '@/components/Logo';

const FEATURES = [
  {
    icon: (
      <path
        d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
    title: 'Documentos versionados',
    description:
      'Envie PDFs e apresentações, visualize na plataforma e mantenha o histórico completo de versões.',
  },
  {
    icon: (
      <path
        d="M8 10h8M8 14h5M21 12a9 9 0 1 1-3.6-7.2L21 4l-1 4.2A8.9 8.9 0 0 1 21 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    title: 'Conversas por projeto',
    description:
      'Chat dedicado com respostas e menções, mantendo cada discussão isolada no seu contexto.',
  },
  {
    icon: (
      <path
        d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    title: 'Tarefas com kanban',
    description:
      'Transforme discussões em ações com prioridade, responsável, prazo e quadro visual.',
  },
  {
    icon: (
      <path
        d="M12 3l1.9 4.6L18 9l-4.1 1.4L12 15l-1.9-4.6L6 9l4.1-1.4L12 3Zm7 11l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
    title: 'Assistente de IA',
    description:
      'Resumos automáticos, perguntas sobre o conteúdo e sugestão de tarefas a partir das conversas.',
  },
  {
    icon: (
      <path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    ),
    title: 'Busca inteligente',
    description:
      'Encontre informações em documentos e mensagens com trechos de contexto em segundos.',
  },
  {
    icon: (
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 1-.1 1.2l2 1.6-2 3.4-2.4-.9a8 8 0 0 1-2 1.2L15 21H9l-.5-2.5a8 8 0 0 1-2-1.2l-2.4.9-2-3.4 2-1.6A8 8 0 0 1 4 12c0-.4 0-.8.1-1.2l-2-1.6 2-3.4 2.4.9a8 8 0 0 1 2-1.2L9 3h6l.5 2.5a8 8 0 0 1 2 1.2l2.4-.9 2 3.4-2 1.6c.1.4.1.8.1 1.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
    title: 'Isolamento por projeto',
    description:
      'Apenas membros convidados acessam documentos, conversas, tarefas e anotações.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-mesh">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">
              Entrar
            </Link>
            <Link href="/register" className="btn-primary">
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center">
        <div className="animate-slide-up">
          <span className="badge border border-primary-200 bg-primary-50 text-primary-700">
            ✨ Colaboração técnica em um só lugar
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Documente, discuta e{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              evolua seus projetos
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            O DevFlow centraliza documentos, conversas, tarefas e anotações por
            projeto — com um assistente de IA que entende o seu contexto.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              Começar agora
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base">
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* Mock visual */}
        <div className="mx-auto mt-16 max-w-4xl animate-scale-in">
          <div className="card overflow-hidden p-2 shadow-card">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-slate-400">
                devflow.app/projetos
              </span>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-primary-50/40 p-8">
              <div className="grid gap-3 sm:grid-cols-3">
                {['Documentos', 'Chat', 'Tarefas'].map((item, i) => (
                  <div
                    key={item}
                    className="card p-4 text-left"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="mb-2 h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 opacity-90" />
                    <p className="text-sm font-semibold text-slate-800">{item}</p>
                    <div className="mt-3 space-y-1.5">
                      <div className="h-2 w-full rounded-full bg-slate-100" />
                      <div className="h-2 w-3/4 rounded-full bg-slate-100" />
                      <div className="h-2 w-1/2 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200/60 bg-white/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Tudo que um projeto técnico precisa
            </h2>
            <p className="mt-4 text-slate-600">
              Uma plataforma organizada por projetos, com isolamento de acesso e
              recursos pensados para o dia a dia de times técnicos.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card card-hover p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-accent-600 px-8 py-14 text-center shadow-glow">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <h2 className="relative text-3xl font-bold text-white">
              Pronto para organizar seus projetos?
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-primary-50">
              Crie sua conta gratuitamente e comece a centralizar o conhecimento
              do seu time.
            </p>
            <Link
              href="/register"
              className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50 active:scale-[0.98]"
            >
              Criar minha conta
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo />
          <p className="text-sm text-slate-500">
            Plataforma colaborativa para projetos técnicos
          </p>
        </div>
      </footer>
    </div>
  );
}
