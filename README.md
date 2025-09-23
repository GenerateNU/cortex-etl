# Cortex ETL System

Automated knowledge base creation system for manufacturing CPQ systems. Processes multi-format data (CSV, PDF, APIs) into structured, queryable databases with complete tenant isolation.

## Architecture

- **Backend**: FastAPI for ETL processing and webhook handling
- **Frontend**: Next.js for tenant/admin interfaces
- **Database**: PostgreSQL with schema-per-tenant isolation via Supabase
- **Development**: Local Supabase stack via Docker
- **Production**: Supabase Cloud + AWS ECS Fargate

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js 18+

### Development Setup

```bash
# Clone and start everything
git clone https://github.com/GenerateNU/cortex-etl-source.git
cd cortex-etl-source
npm run dev:fresh
```

This single command:

- Generates all environment variables
- Starts local Supabase stack
- Builds and runs frontend/backend containers

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Supabase Studio**: http://localhost:3001
- **Supabase API**: http://localhost:8000

## Available Commands

```bash
npm run dev:fresh    # Clean start (regenerates environment variables and cleans up containers)
npm run dev         # Start containers
npm run dev:build   # Start and build containers
npm run docker:clean   # Clean up containers and volumes
npm run dev:stop    # Stop all containers
npm run dev:logs    # View container logs
```

## Project Structure

```
├── frontend/           # Next.js tenant interface
├── backend/           # FastAPI ETL processing
├── docker-compose.yml # Application containers
├── docker-compose.supabase.yml # Local Supabase stack
└── init-dev.js       # Environment generator
```

## Production Deployment

Uses Terraform for AWS infrastructure:

- ECS Fargate for containers
- Supabase Cloud for database/auth
- Route53 + ALB for routing

See `terraform/` directory for infrastructure code.

## Key Features

- **Multi-tenant isolation**: Schema-per-tenant with Row Level Security
- **Automated data processing**: PDF extraction, LLM enrichment, pattern recognition
- **Zero-config development**: Single command setup
- **Production-ready**: Terraform infrastructure included
