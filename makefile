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
BLUE=\033[0;34m
NC=\033[0m # No Color

help: ## Show this help message
	@echo '${GREEN}Honeycomb API V2 - Docker Commands${NC}'
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${NC} ${GREEN}<target>${NC}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${YELLOW}%-20s${NC} %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Environment check
check-env: ## Check if .env file exists
	@if [ ! -f .env ]; then \
		echo "${RED}Error: .env file not found!${NC}"; \
		echo "${YELLOW}Creating .env from .env.example...${NC}"; \
		cp .env.example .env; \
		echo "${GREEN}.env file created. Please update it with your settings.${NC}"; \
		exit 1; \
	else \
		echo "${GREEN}✓ .env file found${NC}"; \
	fi

# Local Development with Docker
dev-build: check-env ## Build development Docker image
	@echo "${GREEN}Building development Docker image...${NC}"
	docker build -f ops/docker/dev/dockerfile -t honeycomb-api-v2:dev .

dev-up: check-env ## Start development environment with docker-compose
	@echo "${GREEN}Starting development environment...${NC}"
	@echo "${BLUE}Using environment variables from .env file${NC}"
	cd ops/docker/dev && docker-compose --env-file ../../../.env up -d
	@echo "${GREEN}Development environment is running!${NC}"
	@echo "API V2: http://localhost:8082"
	@echo "API V2 Docs: http://localhost:8082/docs"
	@echo "Adminer: http://localhost:8080"
	@echo ""
	@echo "${YELLOW}MySQL Credentials:${NC}"
	@echo "  Host: localhost:3306"
	@echo "  Database: Check DB_NAME in .env"
	@echo "  User: Check DB_USERNAME in .env"
	@echo "  Password: Check DB_PASSWORD in .env"

dev-down: ## Stop development environment
	@echo "${YELLOW}Stopping development environment...${NC}"
	cd ops/docker/dev && docker-compose down

dev-restart: ## Restart development environment
	@make dev-down
	@make dev-up

dev-logs: ## Show development container logs
	cd ops/docker/dev && docker-compose logs -f api-v2

dev-logs-all: ## Show all container logs
	cd ops/docker/dev && docker-compose logs -f

dev-logs-mysql: ## Show MySQL container logs
	cd ops/docker/dev && docker-compose logs -f mysql

dev-shell: ## Open shell in development container
	cd ops/docker/dev && docker-compose exec api-v2 sh

dev-db-shell: ## Open MySQL shell
	@echo "${YELLOW}Connecting to MySQL...${NC}"
	@echo "${BLUE}Use the password from DB_PASSWORD in your .env file${NC}"
	cd ops/docker/dev && docker-compose exec mysql mysql -u $$(grep DB_USERNAME ../../../.env | cut -d '=' -f2) -p$$(grep DB_PASSWORD ../../../.env | cut -d '=' -f2) $$(grep DB_NAME ../../../.env | cut -d '=' -f2)

# Troubleshooting commands
dev-clean-volumes: ## Clean Docker volumes (WARNING: This will delete all data!)
	@echo "${RED}WARNING: This will delete all database data!${NC}"
	@echo "${YELLOW}Press Ctrl+C to cancel, or wait 5 seconds to continue...${NC}"
	@sleep 5
	cd ops/docker/dev && docker-compose down -v
	@echo "${GREEN}Volumes cleaned!${NC}"

dev-rebuild: dev-clean-volumes dev-build dev-up ## Complete rebuild (clean volumes, rebuild image, start)
	@echo "${GREEN}Complete rebuild finished!${NC}"

dev-health: ## Check health of all containers
	@echo "${GREEN}Checking container health...${NC}"
	@docker ps --filter "name=honeycomb" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

dev-mysql-test: ## Test MySQL connection
	@echo "${GREEN}Testing MySQL connection...${NC}"
	@docker exec honeycomb-mysql-dev mysqladmin ping -h localhost --silent && echo "${GREEN}✓ MySQL is healthy${NC}" || echo "${RED}✗ MySQL is not responding${NC}"

dev-redis-test: ## Test Redis connection
	@echo "${GREEN}Testing Redis connection...${NC}"
	@docker exec honeycomb-redis-dev redis-cli ping | grep -q PONG && echo "${GREEN}✓ Redis is healthy${NC}" || echo "${RED}✗ Redis is not responding${NC}"

dev-fix-mysql: ## Try to fix MySQL issues
	@echo "${YELLOW}Attempting to fix MySQL issues...${NC}"
	@echo "${BLUE}1. Stopping containers...${NC}"
	cd ops/docker/dev && docker-compose down
	@echo "${BLUE}2. Removing MySQL volume...${NC}"
	docker volume rm dev_mysql_data 2>/dev/null || true
	@echo "${BLUE}3. Starting MySQL only...${NC}"
	cd ops/docker/dev && docker-compose up -d mysql
	@echo "${BLUE}4. Waiting for MySQL to be ready (30 seconds)...${NC}"
	@sleep 30
	@echo "${BLUE}5. Checking MySQL health...${NC}"
	@make dev-mysql-test
	@echo "${BLUE}6. Starting all services...${NC}"
	cd ops/docker/dev && docker-compose up -d
	@echo "${GREEN}MySQL fix attempted. Check logs if issues persist.${NC}"

# Production Docker
prod-build: ## Build production Docker image
	@echo "${GREEN}Building production Docker image...${NC}"
	docker build -f ops/docker/prod/dockerfile -t $(DOCKER_REPO):$(DOCKER_TAG) .
	@echo "${GREEN}Production image built: $(DOCKER_REPO):$(DOCKER_TAG)${NC}"

prod-run: check-env ## Run production Docker container locally
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

prod-stop: ## Stop production container
	@echo "${YELLOW}Stopping production container...${NC}"
	docker stop honeycomb-api-v2-prod && docker rm honeycomb-api-v2-prod

prod-logs: ## Show production container logs
	docker logs -f honeycomb-api-v2-prod

# Database
db-migrate: ## Run database migrations
	cd ops/docker/dev && docker-compose exec api-v2 pnpm run db:migrate

db-seed: ## Seed database
	cd ops/docker/dev && docker-compose exec api-v2 pnpm run db:seed

db-reset: ## Reset database
	@echo "${YELLOW}Resetting database...${NC}"
	cd ops/docker/dev && docker-compose exec mysql mysql -u root -p$$(grep DB_PASSWORD ../../../.env | cut -d '=' -f2) -e "DROP DATABASE IF EXISTS $$(grep DB_NAME ../../../.env | cut -d '=' -f2); CREATE DATABASE $$(grep DB_NAME ../../../.env | cut -d '=' -f2);"
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

prune: ## Prune Docker system
	@echo "${RED}Pruning Docker system...${NC}"
	docker system prune -af --volumes
	@echo "${GREEN}Docker system pruned!${NC}"

# Quick Commands
dev: dev-up dev-logs ## Start dev environment and show logs
fix: dev-fix-mysql ## Try to fix common issues
restart: dev-restart ## Restart dev environment

# Installation
install: ## Install dependencies
	pnpm install

build: ## Build TypeScript
	pnpm run
