from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "DevFlow"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str = "postgresql+psycopg2://devflow:devflow@postgres:5432/devflow"
    REDIS_URL: str = "redis://redis:6379/0"

    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "devflow-uploads"
    MINIO_USE_SSL: bool = False

    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    # Provedor de IA: openai | groq | ollama | openrouter | gemini
    # AI_MODEL e AI_BASE_URL vazios usam o padrão do provedor escolhido.
    AI_PROVIDER: str = "groq"
    AI_API_KEY: str = ""
    AI_MODEL: str = ""
    AI_BASE_URL: str = ""

    # Mantido para retrocompatibilidade
    OPENAI_API_KEY: str = ""

    @property
    def ai_api_key(self) -> str:
        """Resolve a chave de API efetiva do provedor de IA."""
        if self.AI_API_KEY:
            return self.AI_API_KEY
        if self.AI_PROVIDER == "openai":
            return self.OPENAI_API_KEY
        return ""

    @property
    def ai_configured(self) -> bool:
        # Ollama roda localmente e não exige chave
        if self.AI_PROVIDER == "ollama":
            return True
        return bool(self.ai_api_key)

    class Config:
        env_file = ".env"


settings = Settings()
