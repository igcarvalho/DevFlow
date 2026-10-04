# DevFlow

DevFlow é uma plataforma colaborativa para documentar, discutir e gerenciar projetos técnicos. Cada projeto funciona como um espaço isolado onde membros podem compartilhar documentos, conversar, criar tarefas e utilizar inteligência artificial contextual para resumir conteúdos e sugerir ações.

## 🎯 Propósito

Centralizar o conhecimento técnico de projetos em um único lugar, eliminando a dispersão entre PDFs, conversas em apps de mensagem, planilhas e documentos versionados de forma desorganizada.

## ✨ Funcionalidades principais (MVP)

- **Autenticação e perfis de usuário**
- **Projetos isolados com controle de membros**
- **Upload de documentos (PDF e PowerPoint)**
- **Processamento assíncrono com status e progresso**
- **Visualização de documentos com notas e anotações**
- **Chat por projeto**
- **Issues e tarefas vinculadas a projetos e documentos**
- **Versionamento de documentos com histórico completo**
- **Busca por documentos e mensagens**
- **IA contextual:** resumo de documentos, perguntas sobre conteúdo e sugestão de tarefas

## 🏗️ Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js (App Router, TypeScript, Tailwind CSS) |
| Backend | FastAPI (Python) |
| Banco de dados | PostgreSQL |
| Fila e cache | Redis |
| Processamento async | Celery |
| Armazenamento de arquivos | S3-compatible (moto em desenvolvimento) |
| Inteligência artificial | Groq (gratuito) / OpenAI / Ollama / OpenRouter / Gemini |
| Containerização | Docker Compose |

## 📊 Status do projeto

- ✅ Autenticação (registro, login, JWT)
- ✅ Projetos com membros e papéis (owner/admin/member)
- ✅ Documentos com upload, versionamento e extração de texto (PDF/PPTX)
- ✅ Processamento assíncrono com Celery
- ✅ Chat por projeto com respostas
- ✅ Tarefas com kanban
- ✅ Anotações em documentos por página (nota, destaque, comentário)
- ✅ Busca full-text em documentos e mensagens
- ✅ Assistente de IA (resumo, perguntas, sugestão de tarefas)
- ✅ Frontend Next.js completo (login, dashboard, documentos, chat, tarefas, anotações, busca e IA)
- 🔜 Deploy e polimento final

## 📁 Estrutura do repositório

```
DevFlow/
├── backend/            # API FastAPI
│   ├── app/            # Código da aplicação
│   ├── tests/          # Testes
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/           # Aplicação Next.js
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── docs/               # Documentação do produto e arquitetura
│   ├── product.md
│   ├── architecture.md
│   ├── data-model.md
│   └── roadmap.md
├── docker-compose.yml  # Orquestração dos serviços
├── Makefile            # Comandos úteis
├── .env.example
└── README.md
```

## 🚀 Como executar localmente

```bash
# Clone o repositório
git clone https://github.com/igcarvalho/DevFlow.git
cd DevFlow

# Copie as variáveis de ambiente
cp .env.example .env

# Inicie todos os serviços
make up
# ou: docker-compose up -d

# Acesse a aplicação
# Frontend: http://localhost:3001
# API docs: http://localhost:8000/docs
# PostgreSQL (externo): localhost:5433
```

## 🤖 Configurando a IA (gratuita)

O DevFlow usa por padrão o **Groq**, que é gratuito e compatível com a API da OpenAI.

1. Crie uma chave em [console.groq.com/keys](https://console.groq.com/keys)
2. No arquivo `.env`:

```env
AI_PROVIDER=groq
AI_API_KEY=gsk_sua_chave_aqui
```

3. Reinicie os serviços: `make up`

### Outros provedores

Basta trocar as variáveis — nenhuma alteração de código é necessária:

| Provedor | `AI_PROVIDER` | Chave |
|----------|---------------|-------|
| Groq (padrão) | `groq` | [console.groq.com/keys](https://console.groq.com/keys) |
| OpenAI | `openai` | `OPENAI_API_KEY` |
| Ollama (local, sem chave) | `ollama` | não precisa |
| OpenRouter | `openrouter` | openrouter.ai |
| Google Gemini | `gemini` | Google AI Studio |

Para **Ollama local** (100% offline):

```bash
docker compose --profile ollama up -d ollama
docker compose exec ollama ollama pull llama3.2
# no .env: AI_PROVIDER=ollama
```

Também é possível definir `AI_MODEL` e `AI_BASE_URL` para sobrescrever os padrões.

## 🛠️ Comandos úteis

```bash
make up              # Inicia todos os serviços
make down            # Para todos os serviços
make build           # Rebuilda as imagens
make logs            # Mostra logs em tempo real
make shell-backend   # Acessa o container do backend
make shell-frontend  # Acessa o container do frontend
make migrate         # Executa migrations do banco
make test            # Executa os testes do backend
```

## 📚 Documentação

- [Visão do produto](./docs/product.md)
- [Arquitetura](./docs/architecture.md)
- [Modelo de dados](./docs/data-model.md)
- [Roadmap](./docs/roadmap.md)
- [Deploy](./docs/deploy.md)

## 🚢 Deploy

Para colocar em produção:

```bash
cp .env.production.example .env   # edite as credenciais
make prod-up                      # sobe tudo com Docker
```

Veja o [guia de deploy](./docs/deploy.md) para VPS e alternativas em PaaS (Vercel + Render).

## 🤝 Contribuição

Este é um projeto pessoal em desenvolvimento ativo. Sugestões e ideias são sempre bem-vindas!
