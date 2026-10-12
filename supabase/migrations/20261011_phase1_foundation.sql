-- ==============================================================================
-- PHASE 1: FOUNDATION MIGRATION
-- Tables: words, word_cards, user_words, review_log
-- Strict Row-Level Security (RLS) & Performance Indexes
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- 1. Words table: dictionary entries
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  pos text,                         -- part of speech: noun, verb, adj, etc.
  ipa text,                         -- phonetic transcription e.g. /rɪˈzɪl.jəns/
  uz_meaning text not null,         -- concise Uzbek meaning
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 2. Word cards: AI-generated card content (generated once per word)
create table if not exists public.word_cards (
  word_id uuid primary key references public.words(id) on delete cascade,
  content jsonb not null,           -- structured card payload: collocations, mnemonics, sentences, prompt
  created_at timestamptz not null default now()
);

-- 3. User words: Personal learning track & FSRS spaced repetition state
create table if not exists public.user_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  chosen_mnemonic jsonb,           -- user-selected or custom mnemonic object
  own_sentence text,               -- user's personal sentence
  stability real not null default 0.0,
  difficulty real not null default 0.0,
  due_at timestamptz not null default now(),
  state integer not null default 0, -- 0: New, 1: Learning, 2: Review, 3: Relearning
  reps integer not null default 0,
  lapses integer not null default 0,
  last_review timestamptz,
  recog_ok boolean not null default false,   -- recognition / reading mastery
  listen_ok boolean not null default false,  -- listening comprehension mastery
  write_ok boolean not null default false,   -- writing / production mastery
  speak_ok boolean not null default false,   -- pronunciation / speaking mastery
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_user_word unique (user_id, word_id)
);

-- 4. Review log: FSRS practice & task audit trail
create table if not exists public.review_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_word_id uuid not null references public.user_words(id) on delete cascade,
  task_type text not null,          -- recog | listen | write | speak | choose | dictation | uz_to_en | gap_fill | conversation
  rating integer not null check (rating in (1, 2, 3, 4)), -- 1: Again, 2: Hard, 3: Good, 4: Easy
  ts timestamptz not null default now()
);

-- Performance index: fast queries for due cards per user
create index if not exists idx_user_words_due on public.user_words(user_id, due_at);
create index if not exists idx_words_word on public.words(word);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.words enable row level security;
alter table public.word_cards enable row level security;
alter table public.user_words enable row level security;
alter table public.review_log enable row level security;

-- words policies:
-- Authenticated users can read all dictionary words
create policy "Authenticated users can read words" on public.words
  for select to authenticated using (true);

-- Authenticated users can insert words they create
create policy "Users can insert words" on public.words
  for insert to authenticated with check (auth.uid() = created_by or created_by is null);

-- Users can update/delete only words they created
create policy "Users can update own words" on public.words
  for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- word_cards policies:
-- Authenticated users can read generated word cards
create policy "Authenticated users can read word_cards" on public.word_cards
  for select to authenticated using (true);

-- word_cards can be written/updated exclusively by service_role (Edge Functions)
-- (No insert/update policy for authenticated users guarantees only service role writes)

-- user_words policies:
-- Users have complete CRUD on their own user_words records only
create policy "Users can view own user_words" on public.user_words
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own user_words" on public.user_words
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own user_words" on public.user_words
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own user_words" on public.user_words
  for delete to authenticated using (auth.uid() = user_id);

-- review_log policies:
-- Users can view and insert their own review logs
create policy "Users can view own review_log" on public.review_log
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own review_log" on public.review_log
  for insert to authenticated with check (auth.uid() = user_id);
