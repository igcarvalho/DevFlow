# Deploy — DevFlow

Este documento descreve como colocar o DevFlow em produção.

## Opção 1 — VPS com Docker Compose (recomendado para começar)

Funciona em qualquer VPS (DigitalOcean, Hetzner, Linode, Contabo) com Docker instalado.

### Pré-requisitos

- VPS com Docker e Docker Compose
- Domínio apontando para o IP da VPS (opcional, mas recomendado)
- Pelo menos 2 GB de RAM

### Passos

```bash
# 1. Clone o repositório na VPS
git clone git@github.com:igcarvalho/DevFlow.git
cd DevFlow

# 2. Crie o arquivo de variáveis de produção
cp .env.production.example .env
# Edite .env com suas credenciais

# 3. Gere uma SECRET_KEY forte
openssl rand -hex 32

# 4. Suba os serviços de produção
docker compose -f docker-compose.prod.yml up -d --build

# 5. Verifique o status
docker compose -f docker-compose.prod.yml ps
```

### Proxy reverso (HTTPS)

Recomendamos o Caddy pela simplicidade (HTTPS automático):

```caddy
# Caddyfile
seudominio.com {
    reverse_proxy localhost:3000
}

api.seudominio.com {
    reverse_proxy localhost:8000
}
```

Com Nginx + Certbot também funciona bem.

### Atualizações

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

As migrations rodam automaticamente na inicialização do backend.

---

## Opção 2 — PaaS (Vercel + Render)

Alternativa gerenciada, sem administrar servidor.

### Frontend — Vercel

1. Importe o repositório na Vercel
2. Configure o diretório raiz como `frontend`
3. Defina a variável de ambiente:
   - `NEXT_PUBLIC_API_URL` = URL pública do backend

### Backend — Render

1. Crie um **Web Service** apontando para `backend/`
2. Build command: `pip install -r requirements.txt`
3. Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Variáveis de ambiente: copie de `.env.production.example`

### Serviços gerenciados

| Serviço | Alternativa gerenciada |
|---------|------------------------|
| PostgreSQL | Neon, Supabase, Railway |
| Redis | Upstash, Railway |
| Storage S3 | AWS S3, Cloudflare R2, Backblaze B2 |
| Worker Celery | Render Background Worker, Railway |

> Para usar storage S3 real, ajuste `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY`
> com as credenciais do provedor. O código usa a API S3 padrão, sem alterações necessárias.

---

## Checklist de segurança

- [ ] `SECRET_KEY` forte e única (nunca use o valor padrão)
- [ ] `DEBUG=false` em produção
- [ ] Senha do PostgreSQL forte
- [ ] HTTPS habilitado (proxy reverso ou provedor)
- [ ] `OPENAI_API_KEY` configurada (ou IA fica indisponível, mas o app funciona)
- [ ] Backups periódicos do PostgreSQL
- [ ] CORS restrito ao domínio do frontend

### Ajustar CORS

Em `backend/app/main.py`, adicione o domínio de produção:

```python
allow_origins=[
    "https://seudominio.com",
],
```

---

## Variáveis de ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `SECRET_KEY` | Chave para assinar JWT | Sim |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciais do banco | Sim |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Credenciais do storage S3 | Sim |
| `MINIO_BUCKET_NAME` | Nome do bucket | Sim |
| `OPENAI_API_KEY` | Chave da OpenAI (recursos de IA) | Não |
| `NEXT_PUBLIC_API_URL` | URL pública da API | Sim |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiração do token em minutos | Não |

---

## Monitoramento

Logs dos serviços:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f worker
```

Health check da API:

```bash
curl https://api.seudominio.com/health
```
