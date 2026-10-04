.PHONY: up down build logs shell-backend shell-frontend migrate makemigrations test prod-up prod-down prod-build prod-logs

# --- Desenvolvimento ---

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

shell-backend:
	docker compose exec backend bash

shell-frontend:
	docker compose exec frontend sh

migrate:
	docker compose exec backend alembic upgrade head

makemigrations:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

test:
	docker compose exec backend pytest

# --- Produção ---

prod-up:
	docker compose -f docker-compose.prod.yml up -d --build

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-build:
	docker compose -f docker-compose.prod.yml build

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f
