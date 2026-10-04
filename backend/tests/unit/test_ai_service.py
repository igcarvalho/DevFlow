from unittest.mock import patch

import pytest

from app.services import ai


def test_default_groq_base_url_and_model():
    with patch("app.services.ai.settings.AI_PROVIDER", "groq"), patch(
        "app.services.ai.settings.AI_BASE_URL", ""
    ), patch("app.services.ai.settings.AI_MODEL", ""):
        assert ai._resolve_base_url() == "https://api.groq.com/openai/v1"
        assert ai._resolve_model() == "llama-3.3-70b-versatile"


def test_openai_defaults():
    with patch("app.services.ai.settings.AI_PROVIDER", "openai"), patch(
        "app.services.ai.settings.AI_BASE_URL", ""
    ), patch("app.services.ai.settings.AI_MODEL", ""):
        assert ai._resolve_base_url() == "https://api.openai.com/v1"
        assert ai._resolve_model() == "gpt-4o-mini"


def test_custom_overrides_defaults():
    with patch("app.services.ai.settings.AI_PROVIDER", "groq"), patch(
        "app.services.ai.settings.AI_BASE_URL", "https://custom.example/v1"
    ), patch("app.services.ai.settings.AI_MODEL", "meu-modelo"):
        assert ai._resolve_base_url() == "https://custom.example/v1"
        assert ai._resolve_model() == "meu-modelo"


def test_client_raises_when_not_configured():
    with patch("app.services.ai.settings.AI_PROVIDER", "groq"), patch(
        "app.services.ai.settings.AI_API_KEY", ""
    ), patch("app.services.ai.settings.OPENAI_API_KEY", ""):
        with pytest.raises(ai.AiNotConfiguredError):
            ai._client()


def test_client_uses_api_key():
    with patch("app.services.ai.settings.AI_PROVIDER", "groq"), patch(
        "app.services.ai.settings.AI_API_KEY", "gsk-test"
    ), patch("app.services.ai.settings.AI_BASE_URL", ""), patch(
        "app.services.ai.settings.AI_MODEL", ""
    ):
        client = ai._client()
        assert str(client.base_url).startswith("https://api.groq.com")


def test_ollama_does_not_require_key():
    with patch("app.services.ai.settings.AI_PROVIDER", "ollama"), patch(
        "app.services.ai.settings.AI_API_KEY", ""
    ), patch("app.services.ai.settings.AI_BASE_URL", ""), patch(
        "app.services.ai.settings.AI_MODEL", ""
    ):
        client = ai._client()
        assert "11434" in str(client.base_url)


def test_openai_fallback_to_legacy_key():
    with patch("app.services.ai.settings.AI_PROVIDER", "openai"), patch(
        "app.services.ai.settings.AI_API_KEY", ""
    ), patch("app.services.ai.settings.OPENAI_API_KEY", "sk-legacy"), patch(
        "app.services.ai.settings.AI_BASE_URL", ""
    ):
        client = ai._client()
        assert str(client.base_url).startswith("https://api.openai.com")
