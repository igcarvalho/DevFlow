# Roadmap — DevFlow

## Fase 1 — Fundação e documentação

**Objetivo:** deixar o produto e a arquitetura bem definidos antes de escrever código.

- [x] README.md com visão geral
- [x] Documento de visão do produto
- [x] Documento de arquitetura
- [x] Modelo de dados
- [x] Roadmap inicial
- [x] Docker Compose com todos os serviços

## Fase 2 — Setup do backend

**Objetivo:** ter uma API FastAPI funcional, conectada ao banco e com autenticação.

- [x] Estrutura de pastas do backend
- [x] Configuração de variáveis de ambiente
- [x] Conexão com PostgreSQL via SQLAlchemy
- [x] Configuração do Alembic para migrations
- [x] Modelo e CRUD de usuários
- [x] Registro e login com JWT
- [x] Middleware de autenticação
- [ ] Testes unitários iniciais

## Fase 3 — Projetos e permissões

**Objetivo:** criar o conceito de projeto e isolar dados entre projetos.

- [ ] CRUD de projetos
- [ ] Convite e associação de membros
- [ ] Papéis: owner, admin, member
- [ ] Middleware/dependência de permissão por projeto
- [ ] Listagem de projetos do usuário logado

## Fase 4 — Documentos e storage

**Objetivo:** permitir upload, processamento e visualização de documentos.

- [ ] Integração com MinIO
- [ ] Upload de arquivos PDF e PPTX
- [ ] Fila Celery para processamento
- [ ] Extração de texto de PDF
- [ ] Extração/convertimento de PPTX
- [ ] Versionamento de documentos
- [ ] Visualização de documentos no frontend
- [ ] Status e progresso de processamento

## Fase 5 — Anotações e comentários

**Objetivo:** adicionar contexto aos documentos.

- [ ] Criar anotações em páginas
- [ ] Tipos: nota, destaque, comentário
- [ ] Posicionamento na página (opcional)
- [ ] Listagem de anotações por documento/página

## Fase 6 — Chat por projeto

**Objetivo:** comunicação organizada dentro de cada projeto.

- [ ] Criação automática do chat ao criar projeto
- [ ] Envio e listagem de mensagens
- [ ] Respostas a mensagens
- [ ] Menções a membros

## Fase 7 — Issues e tarefas

**Objetivo:** transformar discussões em ações.

- [ ] CRUD de issues
- [ ] Status e prioridade
- [ ] Responsável e prazo
- [ ] Vinculação com documentos e mensagens
- [ ] Listagem por projeto (Kanban simples)

## Fase 8 — Busca

**Objetivo:** encontrar informações rapidamente.

- [ ] Busca full-text em documentos (texto extraído)
- [ ] Busca em mensagens
- [ ] Filtros por projeto e tipo

## Fase 9 — Inteligência artificial

**Objetivo:** extrair valor dos documentos e conversas.

- [ ] Serviço de integração com OpenAI
- [ ] Resumo de documento
- [ ] Perguntas e respostas sobre documento
- [ ] Sugestão de tarefas a partir de chat
- [ ] Fila de jobs de IA
- [ ] Histórico de jobs de IA por projeto

## Fase 10 — Frontend Next.js

**Objetivo:** interface funcional e agradável.

- [ ] Setup do projeto Next.js
- [ ] Layout base e navegação
- [ ] Telas de login e registro
- [ ] Dashboard de projetos
- [ ] Tela de projeto (documentos, chat, tarefas)
- [ ] Visualizador de PDF
- [ ] Upload com progresso
- [ ] Kanban de tarefas
- [ ] Integração com API

## Fase 11 — Polimento e deploy

**Objetivo:** deixar o projeto pronto para uso real.

- [ ] Tratamento de erros e logs
- [ ] Validações de formulários
- [ ] Melhorias de UI/UX
- [ ] Testes de integração
- [ ] Configuração de deploy (Vercel + Render/Railway ou VPS)
- [ ] README de deploy

## Ideias futuras

- Convites por link
- Notificações por email
- Integração com GitHub/GitLab
- Edição colaborativa de anotações
- Suporte a mais formatos (DOCX, XLSX, imagens)
- Assistente de IA com memória de conversa
- Métricas de produtividade por projeto
