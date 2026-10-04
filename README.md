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
| Inteligência artificial | OpenAI |
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

## 🤝 Contribuição

Este é um projeto pessoal em desenvolvimento ativo. Sugestões e ideias são sempre bem-vindas!
