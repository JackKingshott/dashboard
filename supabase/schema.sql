-- Agency HQ - Supabase Schema
-- Run this in the Supabase SQL editor to create all tables

-- ============================================================
-- CLIENTS
-- ============================================================
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text not null,
  phone text,
  address text,
  currency text not null default 'GBP',
  billing_type text not null default 'project'
    check (billing_type in ('retainer', 'project', 'both')),
  retainer_amount decimal(10, 2),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'prospect')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CLIENT NOTES
-- ============================================================
create table if not exists client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  due_date date,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done')),
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INVOICES
-- ============================================================
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  client_id uuid references clients(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  currency text not null default 'GBP',
  subtotal decimal(10, 2) not null default 0,
  tax_rate decimal(5, 2) not null default 0,
  tax_amount decimal(10, 2) not null default 0,
  total decimal(10, 2) not null default 0,
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  stripe_invoice_id text,
  stripe_payment_link text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INVOICE ITEMS
-- ============================================================
create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity decimal(10, 2) not null default 1,
  unit_price decimal(10, 2) not null,
  amount decimal(10, 2) not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SETTINGS (key/value store)
-- ============================================================
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_invoices_client_id on invoices(client_id);
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_invoices_due_date on invoices(due_date);
create index if not exists idx_client_notes_client_id on client_notes(client_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_due_date on tasks(due_date);
create index if not exists idx_tasks_client_id on tasks(client_id);
create index if not exists idx_settings_key on settings(key);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger set_clients_updated_at
  before update on clients
  for each row execute function update_updated_at_column();

create or replace trigger set_client_notes_updated_at
  before update on client_notes
  for each row execute function update_updated_at_column();

create or replace trigger set_tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at_column();

create or replace trigger set_invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at_column();

create or replace trigger set_settings_updated_at
  before update on settings
  for each row execute function update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table clients enable row level security;
alter table client_notes enable row level security;
alter table tasks enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table settings enable row level security;

-- Policies: allow all operations for authenticated users
create policy "Authenticated users can do everything on clients"
  on clients for all to authenticated using (true) with check (true);

create policy "Authenticated users can do everything on client_notes"
  on client_notes for all to authenticated using (true) with check (true);

create policy "Authenticated users can do everything on tasks"
  on tasks for all to authenticated using (true) with check (true);

create policy "Authenticated users can do everything on invoices"
  on invoices for all to authenticated using (true) with check (true);

create policy "Authenticated users can do everything on invoice_items"
  on invoice_items for all to authenticated using (true) with check (true);

create policy "Authenticated users can do everything on settings"
  on settings for all to authenticated using (true) with check (true);

-- Policies: allow all operations for anon (single-user app, protected at network level)
create policy "Anon users can do everything on clients"
  on clients for all to anon using (true) with check (true);

create policy "Anon users can do everything on client_notes"
  on client_notes for all to anon using (true) with check (true);

create policy "Anon users can do everything on tasks"
  on tasks for all to anon using (true) with check (true);

create policy "Anon users can do everything on invoices"
  on invoices for all to anon using (true) with check (true);

create policy "Anon users can do everything on invoice_items"
  on invoice_items for all to anon using (true) with check (true);

create policy "Anon users can do everything on settings"
  on settings for all to anon using (true) with check (true);
