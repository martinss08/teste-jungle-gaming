SHELL := /bin/bash
.DEFAULT_GOAL := help

APP_SERVICE := app
DOCKER_RUN := docker compose run --rm $(APP_SERVICE)

.PHONY: help setup dev build preview verify typecheck lint test test-update test-report lighthouse clean \
	docker-setup docker-dev docker-preview docker-verify docker-down

help:
	@printf "Uso: make <alvo>\n\n"
	@printf "  setup         Prepara tudo: dependencias, Chromium do Playwright, worker do MSW e .env\n"
	@printf "  dev           Vite com mocks em http://localhost:5173\n"
	@printf "  build         Build de demonstracao (mocks habilitados)\n"
	@printf "  preview       Serve o build em http://localhost:4173\n"
	@printf "  test          Playwright desktop + mobile\n"
	@printf "  test-update   Regera as baselines visuais\n"
	@printf "  test-report   Abre o relatorio HTML da ultima execucao\n"
	@printf "  lighthouse    Auditoria Lighthouse (3 medicoes por pagina/perfil)\n"
	@printf "  verify        typecheck + lint + build + test\n"
	@printf "  clean         Remove dist, relatorios e artefatos de teste\n\n"
	@printf "  Docker (opcional): docker-setup, docker-dev, docker-preview, docker-verify, docker-down\n"

setup:
	@command -v node >/dev/null || { printf "Node.js 20+ e necessario. Veja https://nodejs.org\n"; exit 1; }
	@printf "> Node %s / npm %s\n" "$$(node -v)" "$$(npm -v)"
	@if [ -f package-lock.json ]; then npm ci; else npm install; fi
	@printf "> instalando o Chromium do Playwright\n"
	@npx playwright install --with-deps chromium >/dev/null 2>&1 \
		|| { printf "> sem permissao para as libs do sistema (sudo); instalando apenas o navegador\n"; npx playwright install chromium; }
	@npx msw init public --save >/dev/null
	@[ -f .env ] || cp .env.example .env
	@printf "\nPronto. Use 'make dev' para subir a aplicacao com mocks.\n"

dev:
	npm run dev

build:
	VITE_ENABLE_MSW=true npm run build

preview: build
	npm run preview -- --port 4173

typecheck:
	npm run typecheck

lint:
	npm run lint

test:
	npm run test:e2e

test-update:
	npx playwright test --update-snapshots

test-report:
	npm run test:e2e:report

lighthouse:
	npm run lighthouse

verify: typecheck lint build test

clean:
	rm -rf dist test-results reports

docker-setup:
	docker compose build
	$(DOCKER_RUN) npm ci
	$(DOCKER_RUN) npx playwright install --with-deps chromium

docker-dev:
	docker compose up $(APP_SERVICE)

docker-preview:
	docker compose up --build preview

docker-verify:
	$(DOCKER_RUN) npm run typecheck
	$(DOCKER_RUN) npm run lint
	$(DOCKER_RUN) npm run build
	$(DOCKER_RUN) npm run test:e2e

docker-down:
	docker compose down --volumes --remove-orphans
