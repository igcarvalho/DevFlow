import json

from openai import OpenAI

from app.core.config import settings

MAX_CONTEXT_CHARS = 12000


class AiNotConfiguredError(Exception):
    """Raised when the OpenAI API key is not configured."""


def _client() -> OpenAI:
    if not settings.OPENAI_API_KEY:
        raise AiNotConfiguredError(
            "OPENAI_API_KEY não configurada. Defina a variável para usar os recursos de IA."
        )
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def _truncate(text: str) -> str:
    if len(text) <= MAX_CONTEXT_CHARS:
        return text
    return text[:MAX_CONTEXT_CHARS] + "\n\n[... conteúdo truncado ...]"


def summarize_document(title: str, text: str) -> str:
    client = _client()
    prompt = (
        "Você é um assistente que resume documentos técnicos em português.\n"
        f"Título do documento: {title}\n\n"
        "Gere um resumo claro e objetivo em tópicos, destacando os pontos principais.\n\n"
        f"Conteúdo:\n{_truncate(text)}"
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Você resume documentos técnicos de forma clara e objetiva."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


def answer_question(title: str, text: str, question: str) -> str:
    client = _client()
    prompt = (
        f"Documento: {title}\n\n"
        f"Conteúdo:\n{_truncate(text)}\n\n"
        f"Pergunta: {question}\n\n"
        "Responda apenas com base no conteúdo do documento. "
        "Se a resposta não estiver no documento, diga que não encontrou a informação."
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Você responde perguntas com base apenas no documento fornecido."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content or ""


def suggest_tasks(context: str) -> list[dict]:
    client = _client()
    prompt = (
        "Analise a conversa abaixo e sugira tarefas técnicas acionáveis.\n"
        "Responda APENAS com um array JSON válido, sem texto adicional.\n"
        'Formato: [{"title": "...", "description": "...", "priority": "low|medium|high|urgent"}]\n'
        "Sugira no máximo 5 tarefas.\n\n"
        f"Conversa:\n{_truncate(context)}"
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Você transforma discussões técnicas em tarefas acionáveis."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
    )
    content = response.choices[0].message.content or "[]"
    content = content.strip()
    if content.startswith("```"):
        content = content.strip("`")
        content = content.replace("json", "", 1).strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return []
