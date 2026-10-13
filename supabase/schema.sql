-- Run this once in Supabase: SQL Editor -> New query -> Run

create table if not exists help_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  whatsapp text,
  subject text not null,
  deadline timestamptz not null,
  details text not null,
  file_path text,
  file_name text,
  status text not null default 'new'
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null unique,
  whatsapp text,
  code text not null unique
);

-- Lock the tables: only the server (service role key) can read/write them.
alter table help_requests enable row level security;
alter table referrals enable row level security;

-- Private bucket for uploaded files
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;
