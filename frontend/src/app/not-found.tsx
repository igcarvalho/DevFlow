import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-mesh px-6 text-center">
      <Logo />
      <p className="mt-10 text-7xl font-bold tracking-tight text-slate-900">
        404
      </p>
      <h1 className="mt-3 text-xl font-semibold text-slate-800">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard" className="btn-primary">
          Ir para meus projetos
        </Link>
        <Link href="/" className="btn-secondary">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
