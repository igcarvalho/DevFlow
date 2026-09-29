# Modelo de dados — DevFlow

## Entidades principais

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    users    │◄──────┤project_members│──────►│  projects   │
└─────────────┘       └──────────────┘       └──────┬──────┘
      ▲                                             │
      │                                             │
      │        ┌──────────────┐                   │
      └────────┤   messages   │◄──────────────────┘
               └──────────────┘
                      ▲
                      │
┌─────────────┐  ┌────┴──────────┐  ┌─────────────┐
│  documents  │──┤ document_versions│  │   issues    │
└──────┬──────┘  └───────────────┘  └──────┬──────┘
       │                                    │
       │        ┌──────────────┐           │
       └───────►│ annotations  │◄──────────┘
                └──────────────┘

┌─────────────┐
│   ai_jobs   │
└─────────────┘
```

## Tabelas

### `users`

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | Único, usado no login |
| hashed_password | VARCHAR(255) | Senha com bcrypt |
| full_name | VARCHAR(255) | Nome completo |
| avatar_url | VARCHAR(500) | URL do avatar (opcional) |
| is_active | BOOLEAN | Conta ativa ou não |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### `projects`

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(255) | Nome do projeto |
| description | TEXT | Descrição opcional |
| owner_id | UUID | FK → users |
| is_active | BOOLEAN | Soft delete |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### `project_members`

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → projects |
| user_id | UUID | FK → users |
| role | ENUM | `owner`, `admin`, `member` |
| joined_at | TIMESTAMP | Data de entrada |

**Restrições:**
- Um usuário só pode ter uma associação por projeto
- O proprietário do projeto sempre existe como `owner` aqui

### `documents`

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → projects |
| title | VARCHAR(255) | Título do documento |
| description | TEXT | Descrição opcional |
| current_version_id | UUID | FK → document_versions (nullable) |
| status | ENUM | `pending`, `processing`, `completed`, `failed` |
| created_by | UUID | FK → users |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |
| deleted_at | TIMESTAMP | Soft delete (nullable) |

### `document_versions`

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| document_id | UUID | FK → documents |
| version_number | INT | Número sequencial da versão |
| file_key | VARCHAR(500) | Caminho no MinIO |
| file_size | BIGINT | Tamanho em bytes |
| mime_type | VARCHAR(100) | Tipo MIME |
| extracted_text | TEXT | Texto extraído para busca e IA |
| processing_error | TEXT | Mensagem de erro, se houver |
| created_by | UUID | FK → users |
| created_at | TIMESTAMP | Data de upload |

### `annotations`

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| document_id | UUID | FK → documents |
| version_id | UUID | FK → document_versions |
| page_number | INT | Página referenciada |
| type | ENUM | `note`, `highlight`, `comment` |
| content | TEXT | Conteúdo da anotação |
| position | JSONB | Coordenadas na página (opcional) |
| created_by | UUID | FK → users |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### `chats` (um por projeto)

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → projects (único) |
| created_at | TIMESTAMP | Data de criação |

### `messages`

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| chat_id | UUID | FK → chats |
| sender_id | UUID | FK → users |
| content | TEXT | Conteúdo da mensagem |
| reply_to_id | UUID | FK → messages (nullable) |
| created_at | TIMESTAMP | Data de envio |
| updated_at | TIMESTAMP | Última edição (nullable) |
| deleted_at | TIMESTAMP | Soft delete (nullable) |

### `issues`

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → projects |
| title | VARCHAR(255) | Título da tarefa |
| description | TEXT | Descrição |
| status | ENUM | `backlog`, `todo`, `in_progress`, `done`, `cancelled` |
| priority | ENUM | `low`, `medium`, `high`, `urgent` |
| assignee_id | UUID | FK → users (nullable) |
| due_date | DATE | Prazo (nullable) |
| document_id | UUID | FK → documents (nullable) |
| message_id | UUID | FK → messages (nullable) |
| created_by | UUID | FK → users |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |
| closed_at | TIMESTAMP | Data de fechamento (nullable) |

### `ai_jobs`

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → projects |
| type | ENUM | `summarize`, `ask`, `suggest_tasks` |
| input_data | JSONB | Entrada da requisição |
| result | JSONB | Resultado da IA (nullable) |
| status | ENUM | `pending`, `processing`, `completed`, `failed` |
| error_message | TEXT | Mensagem de erro (nullable) |
| created_by | UUID | FK → users |
| created_at | TIMESTAMP | Data de criação |
| completed_at | TIMESTAMP | Data de conclusão (nullable) |

## Relacionamentos

- Um `user` pode ser dono/membro de vários `projects`
- Um `project` pode ter vários `documents`, `messages` e `issues`
- Um `document` pode ter várias `document_versions`
- Uma `document_version` pode ter várias `annotations`
- Um `chat` pertence a um único `project` e tem várias `messages`
- Uma `message` pode responder outra `message`
- Uma `issue` pode estar vinculada a um `document` e/ou `message`
- Um `ai_job` sempre pertence a um `project`

## Índices recomendados

- `users(email)` — único
- `project_members(project_id, user_id)` — único
- `documents(project_id, status, created_at)`
- `document_versions(document_id, version_number)`
- `annotations(document_id, page_number)`
- `messages(chat_id, created_at)`
- `issues(project_id, status, priority)`
- `ai_jobs(project_id, status, created_at)`

## Convenções

- Todas as tabelas usam `UUID` como chave primária
- Campos de auditoria: `created_at`, `updated_at`
- Soft delete quando faz sentido preservar histórico: `deleted_at` ou `is_active`
- Campos JSONB para metadados flexíveis (`position`, `input_data`, `result`)
