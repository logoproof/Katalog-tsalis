-- Create packages table to persist package SKUs
-- Run this migration in your Supabase SQL editor or via psql

create extension if not exists pgcrypto;

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  skus jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- optional: seed default package rows
insert into packages (name, skus)
values
('silver', '[]'::jsonb),
('gold', '[]'::jsonb),
('platinum', '[]'::jsonb)
on conflict (name) do nothing;

-- trigger to update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger packages_set_updated_at
before update on packages
for each row
execute function set_updated_at();
