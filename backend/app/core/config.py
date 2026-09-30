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

    OPENAI_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
