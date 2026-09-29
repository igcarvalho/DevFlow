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
| Armazenamento de arquivos | MinIO (S3-compatible) |
| Inteligência artificial | OpenAI |
| Containerização | Docker Compose |

## 📁 Estrutura do repositório

```
DevFlow/
├── backend/            # API FastAPI
├── frontend/           # Aplicação Next.js
├── docs/               # Documentação do produto e arquitetura
├── docker-compose.yml  # Orquestração dos serviços
└── README.md
```

## 🚀 Como executar localmente

```bash
# Clone o repositório
git clone https://github.com/igcarvalho/DevFlow.git
cd DevFlow

# Inicie todos os serviços
docker-compose up -d

# Acesse a aplicação
# Frontend: http://localhost:3000
# API:      http://localhost:8000/docs
```

## 📚 Documentação

- [Visão do produto](./docs/product.md)
- [Arquitetura](./docs/architecture.md)
- [Modelo de dados](./docs/data-model.md)
- [Roadmap](./docs/roadmap.md)

## 🤝 Contribuição

Este é um projeto pessoal em desenvolvimento ativo. Sugestões e ideias são sempre bem-vindas!
