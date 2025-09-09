# Cortex ETL Backend Documentation

## Architecture Overview

FastAPI-based RESTful API serving as the backend for a multi-tenant ETL system. Designed to process manufacturing data (CSV, PDF, databases) into structured knowledge bases for CPQ systems.

## Tech Stack

### Core Framework

- **FastAPI 0.104.1**: Modern async Python web framework
  - Choice rationale: Type safety, automatic OpenAPI docs, high performance
  - Async support for I/O-heavy ETL operations
  - Built-in dependency injection system

### Database Layer

- **PostgreSQL 15**: Primary database
  - Multi-tenant via schema-per-tenant pattern
  - ACID compliance for financial/manufacturing data
- **SQLAlchemy 2.0.23**: ORM
  - Declarative models with type hints
  - Connection pooling for multi-tenant efficiency
- **Alembic 1.12.1**: Database migrations
  - Version-controlled schema changes
  - Tenant-specific migration support planned

### Authentication & Security

- **JWT (python-jose 3.3.0)**: Stateless authentication
  - HS256 algorithm with 30-minute expiry
  - Contains: user email, role, tenant_id
  - No server-side session storage (RESTful)
- **Passlib 1.7.4 + bcrypt**: Password hashing
  - Bcrypt with auto-salt generation
  - Context-aware password verification
- **Role-based access**: Enum-based roles
  - ADMIN: Cross-tenant access
  - TENANT_USER: Single tenant only

### Data Processing (Planned)

- **Pandas 2.1.3**: Data manipulation
- **Camelot/Unstructured.io**: PDF extraction
- **Dagster/Prefect**: ETL orchestration

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/     # Route handlers
│   │   ├── deps.py        # Reusable dependencies
│   │   └── __init__.py    # Router aggregation
│   ├── core/
│   │   ├── config.py      # Settings management
│   │   ├── database.py    # DB connection
│   │   └── security.py    # Auth utilities
│   ├── models/
│   ├── schemas/
│   └── main.py            # Application entry
├── alembic/
│   ├── versions/          # Migration files
│   └── env.py            # Migration config
├── seed_data.py          # Dev data seeding
├── startup.py            # Container startup script
└── requirements.txt      # Dependencies
```

## Design Decisions

### Multi-Tenancy Strategy

**Schema-per-tenant** chosen over alternatives:

- **Why**: Complete data isolation, supports 1000+ tenants per instance
- **Alternative considered**: Row-level security (rejected: complex queries)
- **Implementation**: Dynamic schema creation on tenant onboarding

### Stateless Authentication

**JWT over sessions** for horizontal scaling:

- No shared session store between containers
- Self-contained tokens with tenant context
- Trade-off: Can't instantly revoke (30-min window)

### Database Models

**Enum for roles** instead of separate table:

- Limited, stable role set (ADMIN, TENANT_USER)
- Type safety at application level
- Simpler queries without joins

### Containerization

**Python startup script** instead of shell scripts:

- Windows compatibility (no .sh issues)
- Database health checking with psycopg2
- Conditional seeding based on environment

## API Design

### Endpoints

```
POST /api/auth/login
  Body: {email, password}
  Response: {access_token, token_type, role, tenantId}

GET /health
  Response: {status: "healthy"}
```

## Security Considerations

### Current Implementation

- CORS configured for localhost:3000 only
- Password hashing with bcrypt
- JWT secrets in environment variables
- SQL injection prevention via SQLAlchemy

### Production Requirements

- HTTPS enforcement
- Token refresh mechanism
- Secrets management (AWS Secrets Manager)
