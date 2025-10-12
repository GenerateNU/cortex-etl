# Cortex ETL System

Automated knowledge base creation system for manufacturing CPQ systems. Processes multi-format data (CSV, PDF, APIs) into structured, queryable databases with complete tenant isolation.

## Architecture

- **Backend**: FastAPI for ETL processing and webhook handling
- **Frontend**: React/TS Vite app for tenant/admin interfaces
- **Database**: PostgreSQL with schema-per-tenant isolation via Supabase
- **Development**: Local Supabase stack via Docker

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js 22

### Development Setup

```bash
# Clone and start everything
git clone https://github.com/GenerateNU/cortex-etl-source.git
cd cortex-etl-source
npm run fresh
```

This single command:

- Generates all environment variables
- Starts local Supabase stack
- Builds and runs frontend/backend containers

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Supabase Studio**: http://localhost:54323

### Development Login Credentials

| Email                        | Password | Role   |
|------------------------------|----------|--------|
| admin@cortex.com             | password | Admin  |
| eng@kawasaki-robotics.com    | password | Tenant |
| eng@kuka.com                 | password | Tenant |
| eng@staubli.com              | password | Tenant |
| eng@milara.com               | password | Tenant |

## Available Commands

```bash
npm run fresh    # Clean start (regenerates environment variables and cleans up containers)
npm run dev         # Start containers
npm run dev:build   # Start and build containers
npm run docker:clean   # Clean up containers and volumes
npm run dev:stop    # Stop all containers
npm run dev:logs    # View container logs
npm run supabase:reset    # Reset Supabase database and run migrations
```

## Project Structure

```
├── frontend/           # React/TS Vite tenant interface
├── backend/           # FastAPI ETL processing
├── docker-compose.yml # Application containers
└── init-dev.js       # Environment generator
```
