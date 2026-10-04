# Arquitetura — DevFlow

## Visão geral

O DevFlow segue uma arquitetura modular em camadas, containerizada com Docker Compose. A separação por domínios permite evoluir partes do sistema de forma independente.

```
┌─────────────────────────────────────────┐
│           Next.js (Frontend)            │
│         localhost:3000                  │
└─────────────────┬───────────────────────┘
                  │ HTTP / REST
┌─────────────────▼───────────────────────┐
│           FastAPI (Backend)             │
│         localhost:8000                  │
│  auth · projects · documents · chats   │
│  issues · ai · tasks                   │
└──────┬────────────────────┬─────────────┘
       │                    │
       │ SQLAlchemy         │ Celery + Redis
       ▼                    ▼
┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │
│   (dados)    │    │  (fila/cache)│
└──────────────┘    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │Celery Workers│
                    │(processamento│
                    │  de docs e IA)│
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    MinIO     │
                    │  (arquivos)  │
└─────────────────────────────────────┘
```

## Componentes

### Frontend (Next.js)

- **Framework:** Next.js 14+ com App Router
- **Linguagem:** TypeScript
- **Estilos:** Tailwind CSS
- **Gerenciamento de estado:** Zustand (estado global leve)
- **Chamadas à API:** React Query / SWR
- **Upload:** componente com barra de progresso
- **Responsabilidades:**
  - Autenticação e rotas protegidas
  - Interface de projetos, documentos, chat e tarefas
  - Visualização de PDFs
  - Exibição de status de processamento em tempo real

### Backend (FastAPI)

- **Framework:** FastAPI
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Validação:** Pydantic v2
- **Autenticação:** JWT (access token)
- **Estrutura de pastas:**
  ```
  backend/app/
  ├── api/v1/          # routers
  ├── core/            # config, security, exceptions
  ├── db/              # session, base model
  ├── models/          # SQLAlchemy models
  ├── schemas/         # Pydantic schemas
  ├── services/        # lógica de negócio
  ├── repositories/    # acesso ao banco
  └── tasks/           # tarefas Celery
  ```

### Banco de dados (PostgreSQL)

- Banco relacional principal
- Armazena usuários, projetos, documentos, versões, mensagens, tarefas e jobs de IA
- Soft delete em registros críticos
- Índices em campos de busca frequentes

### Fila e cache (Redis)

- **Redis** atua como:
  - Broker da fila do Celery
  - Backend de resultados de tarefas
  - Cache de sessões e tokens (opcional)

### Processamento assíncrono (Celery)

- Workers processam documentos e jobs de IA
- Estados de processamento: `pending`, `processing`, `completed`, `failed`
- Progresso reportado via backend para frontend (SSE ou polling)

### Armazenamento (MinIO)

- Buckets S3-like para armazenar arquivos originais e derivados
- Estrutura sugerida:
  ```
  devflow-uploads/
  └── {project_id}/
      └── {document_id}/
          ├── original.pdf
          ├── v1/
          │   ├── extracted_text.txt
          │   └── preview/
          └── v2/
              ├── extracted_text.txt
              └── preview/
  ```

### IA (provedor configurável)

- Serviço dedicado para chamadas a provedores compatíveis com a API da OpenAI
- Provedor padrão: **Groq** (gratuito); alternativas: OpenAI, Ollama (local), OpenRouter e Gemini
- Provedor definido por variável de ambiente (`AI_PROVIDER`), sem alteração de código
- Sempre filtra o contexto pela permissão do usuário no projeto
- Funcionalidades:
  - Resumo de documento
  - Perguntas e respostas sobre conteúdo
  - Sugestão de tarefas a partir de texto

## Comunicação entre serviços

| De | Para | Protocolo | Uso |
|---|---|---|---|
| Frontend | Backend | HTTP/REST + JWT | Dados e autenticação |
| Frontend | Backend | SSE / polling | Progresso de upload e processamento |
| Backend | PostgreSQL | SQLAlchemy + psycopg | Persistência |
| Backend | Redis | redis-py | Fila e cache |
| Celery Worker | Redis | redis-py | Consumo de tarefas |
| Celery Worker | MinIO | boto3 | Leitura/escrita de arquivos |
| Celery Worker | Provedor de IA | HTTP/REST | Jobs de IA |

## Segurança

- Senhas hasheadas com bcrypt
- Tokens JWT com expiração curta
- Todas as rotas protegem o acesso por projeto
- Upload limitado por tamanho e tipo MIME
- Arquivos armazenados com chaves únicas e não previsíveis
- IA recebe apenas contexto permitido ao usuário

## Escalabilidade futura

- Separar workers de documentos e IA em filas distintas
- Adicionar CDN para entrega de arquivos estáticos
- Cachear resultados de IA com Redis
- Migrar para Kubernetes quando necessário
