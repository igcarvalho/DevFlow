export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-primary-700 mb-4">
        DevFlow
      </h1>
      <p className="text-lg text-gray-600 text-center max-w-2xl">
        Plataforma colaborativa para documentar, discutir e gerenciar projetos técnicos.
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/login"
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          Entrar
        </a>
        <a
          href="/register"
          className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition"
        >
          Criar conta
        </a>
      </div>
    </main>
  );
}
