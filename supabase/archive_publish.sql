-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run twice.
-- Lets an archive document remember which public guide (post) was created from it,
-- so publishing again updates that post instead of creating a duplicate.
alter table public.archive_documents
  add column if not exists guide_id uuid references public.guides(id) on delete set null;
create index if not exists archive_guide_idx on public.archive_documents (guide_id);
