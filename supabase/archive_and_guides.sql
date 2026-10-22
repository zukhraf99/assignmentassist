-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Adds: Guides (public, original content) and the private document archive.
-- All tables are locked with row-level security and NO policies, so only the
-- server (your secret key) can read or write them. Nothing is reachable from the browser.

-- Helper so a text[] can be used inside a generated search column (array_to_string alone is not allowed there)
create or replace function public.aa_arr_text(arr text[]) returns text
language sql immutable parallel safe as $$ select array_to_string(arr, ' ') $$;

-- ---------- shared taxonomy ----------
create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null unique,
  slug text not null unique,
  aliases text[] not null default '{}'
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null unique,
  slug text not null unique,
  keywords text[] not null default '{}'   -- words used to suggest this subject for archive documents
);

-- ---------- guides (public once published) ----------
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique,
  title text not null,
  summary text,
  body text not null default '',
  meta_title text,
  meta_description text,
  university_id uuid references public.universities(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  module_code text,
  topic text,
  official_brief_url text,
  original_confirmed boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  tsv tsvector generated always as (
    to_tsvector('english',
      coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(module_code,'') || ' ' ||
      coalesce(topic,'') || ' ' || coalesce(body,''))
  ) stored
);
create index if not exists guides_tsv_idx on public.guides using gin (tsv);
create index if not exists guides_status_idx on public.guides (status, published_at desc);
create index if not exists guides_subject_idx on public.guides (subject_id);
create index if not exists guides_university_idx on public.guides (university_id);

-- ---------- private archive (never public) ----------
create table if not exists public.archive_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  batch text,
  file_name text not null,
  source_path text,
  storage_path text not null unique,
  mime text,
  size_bytes bigint,
  sha256 text not null,
  status text not null default 'uploaded'
    check (status in ('uploaded','processing','needs_review','reviewed','failed','duplicate','archived')),
  duplicate_of uuid references public.archive_documents(id) on delete set null,
  error text,
  extracted_text text,
  text_source text,
  page_count int,
  title text,
  university_id uuid references public.universities(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  module_code text,
  doc_type text,
  keywords text[] not null default '{}',
  suggested jsonb not null default '{}'::jsonb,
  notes text,
  tsv tsvector generated always as (
    to_tsvector('english',
      coalesce(title,'') || ' ' || regexp_replace(coalesce(file_name,''), '[_.\-]+', ' ', 'g') || ' ' || coalesce(module_code,'') || ' ' ||
      coalesce(doc_type,'') || ' ' || coalesce(public.aa_arr_text(keywords),'') || ' ' ||
      coalesce(left(extracted_text, 200000),''))
  ) stored
);
create index if not exists archive_tsv_idx on public.archive_documents using gin (tsv);
create index if not exists archive_sha_idx on public.archive_documents (sha256);
create index if not exists archive_status_idx on public.archive_documents (status, created_at desc);
create index if not exists archive_university_idx on public.archive_documents (university_id);
create index if not exists archive_subject_idx on public.archive_documents (subject_id);

-- ---------- lock everything down ----------
alter table public.universities enable row level security;
alter table public.subjects enable row level security;
alter table public.guides enable row level security;
alter table public.archive_documents enable row level security;

-- Private storage bucket for archive files (not public)
insert into storage.buckets (id, name, public)
values ('archive', 'archive', false)
on conflict (id) do nothing;

-- ---------- starter subjects (edit freely in Admin > Taxonomy) ----------
insert into public.subjects (name, slug, keywords) values
 ('Business & Management','business-management', array['business','management','marketing plan','swot','pestle','strategy','organisation','stakeholder','leadership','entrepreneur']),
 ('IT & Computer Science','it-computer-science', array['software','programming','algorithm','database','sql','python','java','network','web development','systems analysis']),
 ('Cyber Security','cyber-security', array['cyber','penetration','vulnerability','malware','firewall','threat','encryption','incident response','exploit','forensic']),
 ('Information Security','information-security', array['information security','iso 27001','risk assessment','security policy','confidentiality','integrity','availability','gdpr','compliance','governance']),
 ('Data Science','data-science', array['machine learning','data analysis','dataset','regression','classification','visualisation','pandas','statistics','model','clustering']),
 ('Accounting & Finance','accounting-finance', array['accounting','finance','financial statement','balance sheet','ratio','budget','cash flow','audit','investment','valuation']),
 ('Economics','economics', array['economics','inflation','demand','supply','gdp','monetary','fiscal','elasticity','market failure','microeconomics']),
 ('Marketing','marketing', array['marketing','brand','consumer','segmentation','campaign','advertising','digital marketing','promotion','positioning']),
 ('Nursing & Health','nursing-health', array['nursing','patient','clinical','health','care plan','public health','reflective practice','medication','healthcare']),
 ('Law','law', array['law','legal','tort','contract law','statute','case law','liability','court','oscola','jurisdiction']),
 ('Psychology','psychology', array['psychology','cognitive','behaviour','participants','experiment','mental health','therapy','questionnaire']),
 ('Sociology & Social Sciences','sociology-social-sciences', array['sociology','society','inequality','culture','social policy','qualitative','ethnography','community']),
 ('Engineering','engineering', array['engineering','circuit','mechanical','structural','design project','thermodynamics','materials','calculation','cad']),
 ('Mathematics & Statistics','mathematics-statistics', array['mathematics','calculus','probability','hypothesis','matrix','statistics','spss','equation','distribution']),
 ('Sciences','sciences', array['biology','chemistry','physics','laboratory','experiment','molecule','cell','reaction','energy']),
 ('English & Literature','english-literature', array['literature','novel','poetry','narrative','author','theme','essay analysis','discourse','linguistics']),
 ('Education','education', array['education','teaching','lesson plan','pedagogy','curriculum','classroom','learners','assessment']),
 ('Hospitality & Tourism','hospitality-tourism', array['hospitality','tourism','hotel','destination','guest','event management','travel','restaurant'])
on conflict (name) do nothing;
