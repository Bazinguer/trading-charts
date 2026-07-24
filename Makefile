.PHONY: install datos api web build lint fix test

install:  ## Dependencias de Python (uv) y del frontend (npm)
	uv sync
	cd web && npm install

datos:  ## Descarga/actualiza las velas diarias (Binance)
	uv run python -m api.datos

api:  ## API en desarrollo (puerto 8010)
	uv run uvicorn api.main:app --reload --port 8010

web:  ## Frontend en desarrollo (Vite, proxy /api -> :8010)
	cd web && npm run dev

build:  ## Build de producción del frontend
	cd web && npm run build

lint:
	uv run ruff check .
	uv run ruff format --check .
	cd web && npx tsc -b --noEmit

fix:
	uv run ruff check --fix .
	uv run ruff format .

test:
	uv run pytest
