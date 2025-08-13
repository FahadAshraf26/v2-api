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
│   ├── campaign/        # Campaign aggregate
│   │   ├── entity/      # Campaign entity
│   │   └── errors/      # Campaign-specific errors
│   ├── dashboard-campaign-info/ # Dashboard campaign info aggregate
│   │   ├── entity/      # Dashboard campaign info entity
│   │   ├── events/      # Domain events
│   │   └── errors/      # Domain-specific errors
│   └── dashboard-campaign-summary/ # Dashboard campaign summary aggregate
│       ├── entity/      # Dashboard campaign summary entity
│       ├── events/      # Domain events
│       └── errors/      # Domain-specific errors
├── infrastructure/       # Infrastructure Layer (External System Adapters)
│   ├── cache/           # Redis caching implementation
│   ├── database/        # Database models & connections
│   │   ├── models/      # ORM model schemas
│   │   └── database.service.ts # Database service
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
│   ├── global-setup.ts # Global test setup for Node.js 22
│   └── test-helpers.ts # Unit test utilities & mocks
└── unit/               # Unit Tests Only
    ├── domain/         # Domain layer tests
    │   ├── core/       # Core domain primitive tests
    │   ├── campaign/   # Campaign entity tests
    │   └── dashboard-campaign-info/ # Dashboard campaign info tests
    ├── application/    # Application service tests
    │   └── services/   # Service layer unit tests
    └── infrastructure/ # Infrastructure tests
        ├── mappers/    # Data mapper tests
        └── repositories/ # Repository unit tests

ops/                    # Operations & Deployment
├── docker/            # Docker configurations
│   ├── dev/          # Development environment
│   │   ├── dockerfile # Development Dockerfile
│   │   └── docker-compose.yml # Dev services
│   └── prod/         # Production environment
│       └── dockerfile # Production Dockerfile
└── scripts/          # Deployment scripts
```

## 🎯 Domain-Driven Design

This project implements **Domain-Driven Design (DDD)** principles:

### Core Concepts

- **Entities**: Objects with identity that persist over time
- **Value Objects**: Immutable objects defined by their attributes
- **Aggregates**: Clusters of domain objects with consistency boundaries
- **Domain Events**: Signals that something important happened in the domain
- **Repositories**: Abstractions for data access
- **Services**: Domain logic that doesn't belong to entities

### Bounded Contexts

- **Campaign Management**: Core campaign lifecycle and properties
- **Dashboard Content**: User-submitted campaign information and approval workflow

## 🧪 Testing Strategy

### Focus: Domain Layer Testing

This project prioritizes **domain layer testing** to ensure business logic correctness:

```bash
# Run all domain tests
pnpm test:domain

# Run specific test categories
pnpm test:services      # Application services
pnpm test:mappers       # Data mappers
pnpm test:repos         # Repository implementations

# Test with coverage (focused on business logic)
pnpm test:coverage:domain

# Interactive testing
pnpm test:ui
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
pnpm type-check        # TypeScript type checking

# Testing (Domain-focused)
pnpm test              # Run all unit tests
pnpm test:domain       # Domain layer tests only
pnpm test:coverage     # Coverage report
pnpm test:ui           # Interactive test UI
pnpm test:watch        # Watch mode

# Docker Development
make dev-up            # Start development environment
make dev-down          # Stop development environment
make dev-logs          # View container logs
make dev-shell         # Access container shell
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

---

Built with ❤️ using **Node.js 22**, **TypeScript**, **Clean Architecture**, and **Domain-Driven Design**
