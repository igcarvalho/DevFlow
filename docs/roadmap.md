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
