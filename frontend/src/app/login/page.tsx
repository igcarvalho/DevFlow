'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-mesh">
      {/* Painel lateral decorativo */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary-600 to-accent-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <Link href="/" className="relative inline-flex">
          <span className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
                <path
                  d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 13.5l2.2 2.2L15.5 11"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-lg font-bold text-white">DevFlow</span>
          </span>
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight text-white">
            O conhecimento do seu time, organizado.
          </h2>
          <p className="mt-4 max-w-md text-primary-50">
            Documentos, conversas, tarefas e IA em um só lugar — com isolamento
            completo por projeto.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Documentos versionados com anotações',
              'Chat e tarefas por projeto',
              'Assistente de IA contextual',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-primary-50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-white">
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-100">
          © {new Date().getFullYear()} DevFlow. Projeto pessoal.
        </p>
      </div>

      {/* Formulário */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bem-vindo de volta
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Entre com sua conta para continuar
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-13a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="voce@email.com"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="text-center text-sm text-slate-600">
              Não tem conta?{' '}
              <Link
                href="/register"
                className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Criar conta
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
