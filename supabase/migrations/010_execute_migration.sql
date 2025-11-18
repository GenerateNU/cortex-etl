create or replace function execute_sql(query text)
returns void
language plpgsql
security definer
as $$
begin
  execute query;
end;
$$;