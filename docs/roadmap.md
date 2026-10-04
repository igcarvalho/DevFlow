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
- [x] Testes unitários iniciais

## Fase 3 — Projetos e permissões

**Objetivo:** criar o conceito de projeto e isolar dados entre projetos.

- [x] CRUD de projetos
- [x] Convite e associação de membros
- [x] Papéis: owner, admin, member
- [x] Middleware/dependência de permissão por projeto
- [x] Listagem de projetos do usuário logado

## Fase 4 — Documentos e storage

**Objetivo:** permitir upload, processamento e visualização de documentos.

- [x] Integração com storage S3 (moto server em desenvolvimento)
- [x] Upload de arquivos PDF e PPTX
- [x] Fila Celery para processamento
- [x] Extração de texto de PDF
- [x] Extração/convertimento de PPTX
- [x] Versionamento de documentos
- [ ] Visualização de documentos no frontend
- [ ] Status e progresso de processamento

## Fase 4.5 — Frontend base (antecipado)

**Objetivo:** ter interface utilizável antes de avançar no backend.

- [x] Cliente de API e contexto de autenticação
- [x] Telas de login e registro
- [x] Dashboard de projetos
- [x] Tela de projeto com documentos
- [x] Upload de documentos

## Fase 5 — Anotações e comentários

**Objetivo:** adicionar contexto aos documentos.

- [x] Criar anotações em páginas
- [x] Tipos: nota, destaque, comentário
- [x] Posicionamento na página (opcional)
- [x] Listagem de anotações por documento/página

## Fase 6 — Chat por projeto

**Objetivo:** comunicação organizada dentro de cada projeto.

- [x] Criação automática do chat ao criar projeto
- [x] Envio e listagem de mensagens
- [x] Respostas a mensagens
- [ ] Menções a membros

## Fase 7 — Issues e tarefas

**Objetivo:** transformar discussões em ações.

- [x] CRUD de issues
- [x] Status e prioridade
- [x] Responsável e prazo
- [ ] Vinculação com documentos e mensagens
- [x] Listagem por projeto (Kanban simples)

## Fase 8 — Busca

**Objetivo:** encontrar informações rapidamente.

- [x] Busca full-text em documentos (texto extraído)
- [x] Busca em mensagens
- [x] Filtros por projeto e tipo

## Fase 9 — Inteligência artificial

**Objetivo:** extrair valor dos documentos e conversas.

- [x] Serviço de integração com OpenAI
- [x] Resumo de documento
- [x] Perguntas e respostas sobre documento
- [x] Sugestão de tarefas a partir de chat
- [x] Fila de jobs de IA
- [ ] Histórico de jobs de IA por projeto

## Fase 10 — Frontend Next.js

**Objetivo:** interface funcional e agradável.

- [x] Setup do projeto Next.js
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
