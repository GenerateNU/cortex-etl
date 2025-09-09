# Cortex ETL System - Source Code

Private repository containing source code for the Cortex multi-tenant ETL system.

## Architecture

- **Backend**: FastAPI for ETL processing and API
- **Frontend**: Next.js for upload/management interface
- **Database**: PostgreSQL with schema-per-tenant isolation
- **Storage**: MinIO (local) / S3 (production)

## Development Setup

### Prerequisites

- Docker Desktop
- Python 3.11+
- Node.js 18+
- VS Code (recommended)

### Initial Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/GenerateNU/cortex-etl-source.git
   cd cortex-etl-source
   ```

2. **Copy the Example Environment Files**

   ```bash
   cp backend/.env.local.example backend/.env.local
   cp frontend/.env.local.example frontend/.env.local
   ```

3. **Start the Docker Compose Stack**

   ```bash
   docker-compose up
   ```

4. **Set up backend linting (one-time)**

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # Mac/Linux
   pip install -r requirements-dev.txt
   ```

5. **Set up pre-commit hooks (one-time)**
   ```bash
   pre-commit install
   ```

### Access Points

- Frontend: http://localhost:3000
- API: http://localhost:8000
- MinIO: http://localhost:9001 (minioadmin/minioadmin)

## Code Quality

### Linting Commands

**Frontend:**

```bash
cd frontend
npm run lint       # Check for issues
npm run lint:fix   # Auto-fix issues
npm run format     # Prettier formatting
```

**Backend:**

```bash
cd backend
.venv\Scripts\activate  # Activate virtual environment first
black .           # Format Python code
flake8 .          # Check style issues
isort .           # Sort imports
```

### VS Code Extensions

Install for auto-formatting on save:

- Prettier
- ESLint
- Black Formatter

### Pre-commit

```bash
pre-commit run --all-files  # Run all checks manually
```

### Testing Credentials

- Admin: admin@cortex.com / password
- Tenant user: user@example.com / password

## Deployment

Production images are built and pushed to AWS ECR via GitHub Actions on main branch commits.
