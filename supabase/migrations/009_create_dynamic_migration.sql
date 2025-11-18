create table if not exists dynamic_migrations (
  migration_id uuid primary key,
  tenant_id uuid not null,
  name text not null unique,
  sql text not null,
  created_at timestamptz not null default now(),
  applied_at timestamptz not null default now()
);