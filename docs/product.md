# Visão do produto — DevFlow

## Problema

Projetos técnicos geram muito conhecimento disperso: PDFs, apresentações, conversas em apps de mensagem, planilhas, emails e documentos versionados de forma desorganizada. Isso dificulta:

- Encontrar informações relevantes rapidamente
- Manter o histórico de decisões
- Integrar novos membros
- Transformar discussões em ações

## Solução

O DevFlow é uma plataforma de colaboração e conhecimento técnico organizada por projetos. Cada projeto é um espaço isolado onde membros compartilham documentos, conversam, criam tarefas e utilizam IA para extrair valor do conteúdo.

## Público-alvo

- Equipes técnicas pequenas e médias
- Projetos pessoais e freelancers
- Estudos e grupos de pesquisa

## Diferenciais

- **Isolamento por projeto:** apenas membros convidados acessam documentos, conversas e tarefas
- **Documentos com contexto:** notas, anotações e comentários vinculados a páginas específicas
- **Versionamento simples:** novas versões preservam o histórico sem complicar o fluxo
- **IA contextual:** resumos, perguntas e sugestões de tarefas baseadas apenas no conteúdo acessível ao usuário naquele projeto

## Fluxo principal

1. Usuário cria conta e faz login
2. Cria um novo projeto ou é convidado para um existente
3. Faz upload de documentos (PDF e PowerPoint)
4. O documento é processado de forma assíncrona
5. Membros visualizam, comentam e fazem anotações
6. Discussões no chat do projeto geram tarefas
7. A IA ajuda a resumir, responder perguntas e sugerir próximos passos

## Regras de acesso

- Todo projeto possui um proprietário
- O proprietário pode convidar e remover membros
- Apenas membros do projeto podem visualizar documentos, mensagens, tarefas e anotações
- A IA utiliza apenas conteúdo que o usuário tem permissão de acessar
- Documentos excluídos são soft-deleted, preservando o histórico para administradores

## Limites do MVP

- Edição direta de PDFs e slides não está incluída
- A IA trabalha com texto extraído dos documentos, não com imagens diretamente
- Convites são feitos por email e aceitos via link
- Notificações em tempo real são simples (SSE ou polling curto)

## Futuro próximo

- Convites por link
- Notificações por email
- Integração com GitHub/GitLab
- Edição colaborativa de anotações
- Suporte a mais formatos de documento
