# Makefile for Honeycomb API V2
.PHONY: help docker-build docker-run docker-stop docker-clean

# Variables
DOCKER_REGISTRY ?= ghcr.io
DOCKER_REPO ?= your-org/honeycomb-api-v2
DOCKER_TAG ?= latest
ENV ?= development

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help: ## Show this help message
	@echo '${GREEN}Honeycomb API V2 - Docker Commands${NC}'
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${NC} ${GREEN}<target>${NC}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${YELLOW}%-20s${NC} %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Local Development with Docker
dev-build: ## Build development Docker image
	@echo "${GREEN}Building development Docker image...${NC}"
	docker build -f ops/dev/dockerfile -t honeycomb-api-v2:dev .

dev-up: ## Start development environment with docker-compose
	@echo "${GREEN}Starting development environment...${NC}"
	cd ops/docker/dev && docker-compose up -d
	@echo "${GREEN}Development environment is running!${NC}"
	@echo "API V2: http://localhost:8082"
	@echo "API V2 Docs: http://localhost:8082/docs"
	@echo "Adminer: http://localhost:8080"

dev-down: ## Stop development environment
	@echo "${YELLOW}Stopping development environment...${NC}"
	cd ops/docker/dev && docker-compose down

dev-restart: ## Restart development environment
	@make dev-down
	@make dev-up

dev-logs: ## Show development container logs
	cd ops/docker/dev && docker-compose logs -f api-v2

dev-shell: ## Open shell in development container
	cd ops/docker/dev && docker-compose exec api-v2 sh

dev-db-shell: ## Open MySQL shell
	cd ops/docker/dev && docker-compose exec mysql mysql -u honeycomb -p

# Production Docker
prod-build: ## Build production Docker image
	@echo "${GREEN}Building production Docker image...${NC}"
	docker build -f ops/docker/prod/Dockerfile -t $(DOCKER_REPO):$(DOCKER_TAG) .
	@echo "${GREEN}Production image built: $(DOCKER_REPO):$(DOCKER_TAG)${NC}"

prod-run: ## Run production Docker container locally
	@echo "${GREEN}Running production container...${NC}"
	docker run -d \
		--name honeycomb-api-v2-prod \
		-p 8082:8082 \
		--env-file .env \
		-e NODE_ENV=production \
		-e DB_HOST=host.docker.internal \
		-e REDIS_HOST=host.docker.internal \
		$(DOCKER_REPO):$(DOCKER_TAG)
	@echo "${GREEN}Production container running on http://localhost:8082${NC}"

prod-run-custom: ## Run production container with custom env file (usage: make prod-run-custom ENV_FILE=.env.production)
	@echo "${GREEN}Running production container with ${ENV_FILE}...${NC}"
	docker run -d \
		--name honeycomb-api-v2-prod \
		-p 8082:8082 \
		--env-file ${ENV_FILE} \
		-e NODE_ENV=production \
		-e DB_HOST=host.docker.internal \
		-e REDIS_HOST=host.docker.internal \
		$(DOCKER_REPO):$(DOCKER_TAG)
	@echo "${GREEN}Production container running on http://localhost:8082${NC}"

prod-stop: ## Stop production container
	@echo "${YELLOW}Stopping production container...${NC}"
	docker stop honeycomb-api-v2-prod && docker rm honeycomb-api-v2-prod

prod-logs: ## Show production container logs
	docker logs -f honeycomb-api-v2-prod

# Docker Registry
docker-login: ## Login to Docker registry
	@echo "${GREEN}Logging in to Docker registry...${NC}"
	docker login $(DOCKER_REGISTRY)

docker-push: prod-build ## Push Docker image to registry
	@echo "${GREEN}Pushing image to registry...${NC}"
	docker tag $(DOCKER_REPO):$(DOCKER_TAG) $(DOCKER_REGISTRY)/$(DOCKER_REPO):$(DOCKER_TAG)
	docker push $(DOCKER_REGISTRY)/$(DOCKER_REPO):$(DOCKER_TAG)
	@echo "${GREEN}Image pushed: $(DOCKER_REGISTRY)/$(DOCKER_REPO):$(DOCKER_TAG)${NC}"

docker-pull: ## Pull Docker image from registry
	@echo "${GREEN}Pulling image from registry...${NC}"
	docker pull $(DOCKER_REGISTRY)/$(DOCKER_REPO):$(DOCKER_TAG)

# Testing
test-local: ## Run tests locally
	pnpm test

test-docker: ## Run tests in Docker container
	@echo "${GREEN}Running tests in Docker...${NC}"
	docker run --rm \
		-v $(PWD):/app \
		-w /app \
		node:22-alpine \
		sh -c "corepack enable && pnpm install --frozen-lockfile && pnpm test"

# Database
db-migrate: ## Run database migrations
	cd ops/docker/dev && docker-compose exec api-v2 pnpm run db:migrate

db-seed: ## Seed database
	cd ops/docker/dev && docker-compose exec api-v2 pnpm run db:seed

db-reset: ## Reset database
	cd ops/docker/dev && docker-compose exec mysql mysql -u root -proot_password -e "DROP DATABASE IF EXISTS honeycomb_v2_dev; CREATE DATABASE honeycomb_v2_dev;"
	@make db-migrate
	@make db-seed

# Utility Commands
clean: ## Clean up all containers and images
	@echo "${RED}Cleaning up containers and images...${NC}"
	-docker stop honeycomb-api-v2-prod 2>/dev/null || true
	-docker rm honeycomb-api-v2-prod 2>/dev/null || true
	-cd ops/docker/dev && docker-compose down -v
	-docker rmi honeycomb-api-v2:dev 2>/dev/null || true
	-docker rmi $(DOCKER_REPO):$(DOCKER_TAG) 2>/dev/null || true
	@echo "${GREEN}Cleanup complete!${NC}"

status: ## Show status of all containers
	@echo "${GREEN}Container Status:${NC}"
	@docker ps -a --filter "name=honeycomb"

logs-all: ## Show all logs
	cd ops/docker/dev && docker-compose logs

prune: ## Prune Docker system
	@echo "${RED}Pruning Docker system...${NC}"
	docker system prune -af --volumes
	@echo "${GREEN}Docker system pruned!${NC}"

# Quick Commands
dev: dev-up dev-logs ## Start dev environment and show logs
prod: prod-build prod-run prod-logs ## Build and run production locally
restart: dev-restart ## Restart dev environment

# Installation
install: ## Install dependencies
	pnpm install

build: ## Build TypeScript
	pnpm run build

# Git hooks
pre-commit: ## Run pre-commit checks
	pnpm run type-check
	pnpm run lint
	pnpm test
