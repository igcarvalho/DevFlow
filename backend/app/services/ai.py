import json

from openai import OpenAI

from app.core.config import settings

MAX_CONTEXT_CHARS = 12000

# Provedores compatíveis com a API da OpenAI: base_url padrão e modelo padrão.
PROVIDER_DEFAULTS: dict[str, dict[str, str]] = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "model": "openai/gpt-oss-120b",
    },
    "ollama": {
        "base_url": "http://ollama:11434/v1",
        "model": "llama3.2",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "model": "gemini-1.5-flash",
    },
}


class AiNotConfiguredError(Exception):
    """Raised when the AI provider is not configured."""


def _resolve_base_url() -> str:
    if settings.AI_BASE_URL:
        return settings.AI_BASE_URL
    defaults = PROVIDER_DEFAULTS.get(settings.AI_PROVIDER.lower())
    return defaults["base_url"] if defaults else ""


def _resolve_model() -> str:
    if settings.AI_MODEL:
        return settings.AI_MODEL
    defaults = PROVIDER_DEFAULTS.get(settings.AI_PROVIDER.lower())
    return defaults["model"] if defaults else ""


def _client() -> OpenAI:
    if not settings.ai_configured:
        raise AiNotConfiguredError(
            "Recurso de IA não configurado. Defina AI_API_KEY (ex.: chave do Groq) "
            "para usar resumos, perguntas e sugestões de tarefas."
        )
    # Ollama não exige chave; o SDK exige um valor não vazio.
    api_key = settings.ai_api_key or "ollama"
    return OpenAI(api_key=api_key, base_url=_resolve_base_url())


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
        model=_resolve_model(),
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
        model=_resolve_model(),
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
        "Escreva os títulos e descrições em português do Brasil.\n"
        "Responda APENAS com um array JSON válido, sem texto adicional.\n"
        'Formato: [{"title": "...", "description": "...", "priority": "low|medium|high|urgent"}]\n'
        "Sugira no máximo 5 tarefas.\n\n"
        f"Conversa:\n{_truncate(context)}"
    )
    response = client.chat.completions.create(
        model=_resolve_model(),
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
