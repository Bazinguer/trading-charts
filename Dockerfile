# Imagen única de producción: FastAPI sirviendo la API y el build de la SPA
# (patrón del dashboard de trading-bot). El dist se construye aquí dentro,
# nunca se copia el local (excluido en .dockerignore).

FROM node:22-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY api/ api/
COPY --from=web /web/dist web/dist
EXPOSE 8010
CMD ["uv", "run", "--no-dev", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8010"]
