# 🍯 Honeycomb API V2

> Modern TypeScript API built with Clean Architecture, Domain-Driven Design, and Node.js 22

## 🚀 Tech Stack

- **Runtime**: Node.js 22 LTS
- **Language**: TypeScript 5.7+
- **Package Manager**: pnpm
- **Framework**: Fastify 5
- **Architecture**: Clean Architecture + DDD
- **Database**: MySQL with Sequelize ORM
- **Cache**: Redis
- **Testing**: Vitest (Domain-focused unit tests)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
src/
├── application/           # Application Services & Use Cases
│   ├── core/             # Base use case interfaces
│   └── services/         # Application services
├── config/               # Configuration & DI setup
├── domain/               # Domain Layer (Business Logic)
│   ├── core/            # Core domain primitives
│   │   ├── entity.ts    # Base entity class
│   │   ├── aggregate-root.ts # Base aggregate root
│   │   ├── value-object.ts   # Base value object
│   │   └── repository.interface.ts # Repository contracts
│   └── [aggregates]/    # Domain aggregates (campaign, dashboard-*, etc.)
│       ├── entity/      # Entity definitions
│       ├── events/      # Domain events
│       └── errors/      # Domain-specific errors
├── infrastructure/       # Infrastructure Layer (External System Adapters)
│   ├── cache/           # Redis caching implementation
│   ├── database/        # Database models & connections
│   │   ├── models/      # ORM model schemas
│   │   └── *.service.ts # Database services
│   ├── events/          # Domain event handling
│   ├── logging/         # Structured logging with Pino
│   ├── mappers/         # Data mapping between layers
│   ├── persistence/     # Data persistence abstractions
│   │   ├── orm/         # ORM adapter pattern
│   │   └── query-builder/ # Query builder abstraction
│   └── repositories/    # Repository implementations
├── presentation/         # Presentation Layer (Delivery Mechanisms)
│   ├── controllers/     # HTTP controllers
│   └── routes/          # Route definitions with OpenAPI schemas
├── shared/              # Shared Utilities & Cross-Cutting Concerns
│   ├── enums/          # Shared enumerations
│   ├── errors/         # Base error classes
│   └── utils/          # Cross-cutting concerns
│       └── middleware/ # Authentication, validation, logging middleware
├── types/               # TypeScript type definitions
└── server.ts           # Application entry point

tests/                   # Test Suite (Domain-focused)
├── setup/              # Test configuration & helpers
└── unit/               # Unit Tests Only
    ├── domain/         # Domain layer tests
    ├── application/    # Application layer tests
    └── infrastructure/ # Infrastructure layer tests

ops/                     # Operations & Infrastructure
├── docker/             # Docker configuration
│   ├── dev/           # Development environment
│   │   ├── dockerfile
│   │   └── docker-compose.yml
│   └── prod/          # Production environment
│       └── dockerfile

Configuration Files:
├── .dockerignore       # Docker ignore patterns
├── .env.example        # Environment variables template
├── .gitignore         # Git ignore patterns
├── makefile           # Make commands for Docker operations
├── package.json       # Node.js dependencies & scripts
├── pnpm-lock.yaml    # Lock file for pnpm
├── tsconfig.json      # TypeScript configuration
└── vitest.config.ts   # Vitest test configuration
```

## 🧪 Testing Strategy

### Unit Testing Approach

- **Framework**: Vitest with Node.js 22 optimizations
- **Focus**: Domain layer and business logic
- **Coverage Target**: 85%+ for core components
- **Test Files**: Located in `tests/unit/` directory

### Test Commands

```bash
# Run all unit tests
pnpm test

# Domain layer tests
pnpm test:domain

# Application services
pnpm test:services

# Data mappers
pnpm test:mappers

# Repository implementations
pnpm test:repos

# Test with coverage (focused on business logic)
pnpm test:coverage
pnpm test:coverage:domain

# Interactive testing
pnpm test:ui

# Watch mode for development
pnpm test:watch
```

### Test Structure

- **Unit Tests Only**: No integration or E2E tests
- **Domain-focused**: Core business logic and entities
- **High Coverage**: 85%+ for domain layer
- **Fast Execution**: Optimized for Node.js 22

### Technologies

- **Vitest**: Modern testing framework (Jest-compatible API)
- **Node.js 22**: Latest LTS with performance optimizations
- **TypeScript**: Full type safety in tests
- **pnpm**: Fast package management

## 🏗️ Architecture Principles

### Clean Architecture

- **Dependency Inversion**: Core business logic doesn't depend on external concerns
- **Separation of Concerns**: Each layer has a single responsibility
- **Testability**: Business logic can be tested in isolation

### Hexagonal Architecture (Ports & Adapters)

- **Ports**: Interfaces defined in the domain
- **Adapters**: Implementations in the infrastructure layer
- **ORM Abstraction**: Database-agnostic repository pattern

### SOLID Principles

- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable
- **Interface Segregation**: Clients shouldn't depend on unused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

## 🚀 Quick Start

### Prerequisites

- **Node.js 22 LTS** or higher
- **pnpm** (recommended) or npm
- **Docker** & **Docker Compose** (for development environment)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd honeycomb-api-v2
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development environment**

   ```bash
   make dev-up
   ```

   This starts:
   - API V2 server: `http://localhost:8082`
   - API documentation: `http://localhost:8082/docs`
   - Database admin: `http://localhost:8080` (Adminer)
   - MySQL: `localhost:3306`
   - Redis: `localhost:6379`

### Available Commands

```bash
# Development
pnpm dev                # Start development server
pnpm build             # Build for production
pnpm start             # Start production server

# Code Quality
pnpm lint              # ESLint checking
pnpm lint:fix          # Fix ESLint issues
pnpm format            # Format with Prettier
pnpm format:check      # Check formatting
pnpm type-check        # TypeScript type checking

# Testing (Domain-focused)
pnpm test              # Run all unit tests
pnpm test:domain       # Domain layer tests only
pnpm test:services     # Application services tests
pnpm test:mappers      # Infrastructure mappers tests
pnpm test:repos        # Repository tests
pnpm test:coverage     # Coverage report
pnpm test:coverage:domain # Domain coverage
pnpm test:ui           # Interactive test UI
pnpm test:watch        # Watch mode

# Database
pnpm db:migrate        # Run migrations
pnpm db:seed          # Seed database

# Docker Development
make dev-up            # Start development environment
make dev-down          # Stop development environment
make dev-restart       # Restart development environment
make dev-logs          # View container logs
make dev-logs-all      # View all container logs
make dev-logs-mysql    # View MySQL logs
make dev-shell         # Access container shell
make dev-db-shell      # Access MySQL shell
make dev-clean-volumes # Clean Docker volumes (WARNING: Deletes data!)
make dev-fix-mysql     # Fix MySQL connection issues

# Docker Production
make prod-build        # Build production image
make prod-run         # Run production container
make prod-stop        # Stop production container
make prod-logs        # View production logs

# Utility Commands
make clean            # Clean up all containers and images
make status           # Show container status
make prune           # Prune Docker system
make install         # Install dependencies
make build           # Build TypeScript
```

## 📊 API Documentation

- **Swagger UI**: `http://localhost:8082/docs`
- **Health Check**: `http://localhost:8082/health`
- **OpenAPI Spec**: Auto-generated from route schemas

### TypeScript Configuration

- **Strict mode** enabled
- **Path mapping** for clean imports (`@/...`)
- **Decorators** for dependency injection
- **ES2022** target with **ESNext** modules

## 🛠️ Development Tools

### Code Quality

- **ESLint**: TypeScript-specific rules
- **Prettier**: Code formatting with import sorting
- **Husky**: Git hooks for quality gates
- **Commitizen**: Conventional commit messages
- **Lint-staged**: Pre-commit hooks

### Git Workflow

```bash
# Automatic formatting and linting on commit
git add .
git commit  # Triggers lint-staged + commitlint

# Conventional commits
pnpm cz    # Interactive commit helper
```

## 🚢 Deployment

### Production Build

```bash
# Docker production image
make prod-build

# Run production container
make prod-run
```

### Environment-specific Configs

- **Development**: Hot reload, debug logging, extended timeouts
- **Test**: In-memory database, mocked external services
- **Production**: Optimized builds, error-only logging, health checks

## 🔍 Monitoring & Observability

### Logging

- **Structured logging** with Pino
- **Request tracing** with correlation IDs
- **Performance metrics** built-in

### Health Checks

- Database connectivity
- Redis availability
- Memory usage monitoring
- Response time tracking

## 📦 Key Dependencies

### Core

- **fastify**: ^5.4.0 - High-performance web framework
- **tsyringe**: ^4.10.0 - Dependency injection container
- **sequelize**: ^6.37.7 - ORM for MySQL
- **redis**: ^5.8.0 - Caching layer
- **pino**: ^9.7.0 - High-performance logger
- **zod**: ^4.0.14 - Schema validation
- **jsonwebtoken**: ^9.0.2 - JWT authentication
- **oxide.ts**: ^1.1.0 - Result/Option types for functional error handling

### Development

- **typescript**: ^5.7.3 - Latest TypeScript version
- **vitest**: ^3.2.4 - Modern test runner
- **tsx**: ^4.20.3 - TypeScript execution
- **eslint**: ^9.18.0 - Code linting
- **prettier**: ^3.4.2 - Code formatting

---

Built with ❤️ using **Node.js 22**, **TypeScript**, **Clean Architecture**, and **Domain-Driven Design**
