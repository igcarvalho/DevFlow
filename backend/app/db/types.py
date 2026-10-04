from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

# JSONB no PostgreSQL, JSON genérico em outros bancos (ex.: SQLite nos testes)
JsonType = JSON().with_variant(JSONB, "postgresql")
