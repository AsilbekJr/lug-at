-- ==============================================================================
-- Linguist AI: Postgres Schema with strict Row-Level Security (RLS)
-- Every table restricts access: auth.uid() = user_id
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- 1. Words Table
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  phonetic text,
  part_of_speech text,            -- noun, verb, adjective, adverb, etc.
  definition text not null,       -- Primary English definition
  definition_uz text,             -- Uzbek translation / explanation
  context_sentence text not null, -- High-quality authentic sentence
  context_sentence_uz text,       -- Uzbek sentence translation
  cefr_level text check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  collocations text[] default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Cards Table (FSRS Spaced Repetition State)
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  due timestamptz not null default now(),
  stability real not null default 0.0,
  difficulty real not null default 0.0,
  elapsed_days integer not null default 0,
  scheduled_days integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  state integer not null default 0, -- 0: New, 1: Learning, 2: Review, 3: Relearning
  last_review timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Review Logs Table (Audit trail & analytics for FSRS)
create table if not exists public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  rating integer not null check (rating in (1, 2, 3, 4)), -- 1: Again, 2: Hard, 3: Good, 4: Easy
  state integer not null,
  due timestamptz not null,
  stability real not null,
  difficulty real not null,
  elapsed_days integer not null,
  last_elapsed_days integer not null,
  scheduled_days integer not null,
  review timestamptz not null default now(),
  duration_ms integer
);

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- Users access only their own rows (user_id = auth.uid())
-- ==============================================================================

alter table public.words enable row level security;
alter table public.cards enable row level security;
alter table public.review_logs enable row level security;

-- Words policies
create policy "Users can view own words" on public.words
  for select using (auth.uid() = user_id);

create policy "Users can insert own words" on public.words
  for insert with check (auth.uid() = user_id);

create policy "Users can update own words" on public.words
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own words" on public.words
  for delete using (auth.uid() = user_id);

-- Cards policies
create policy "Users can view own cards" on public.cards
  for select using (auth.uid() = user_id);

create policy "Users can insert own cards" on public.cards
  for insert with check (auth.uid() = user_id);

create policy "Users can update own cards" on public.cards
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own cards" on public.cards
  for delete using (auth.uid() = user_id);

-- Review logs policies
create policy "Users can view own review logs" on public.review_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own review logs" on public.review_logs
  for insert with check (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_words_user on public.words(user_id);
create index if not exists idx_cards_user_due on public.cards(user_id, due);
create index if not exists idx_cards_word on public.cards(word_id);
create index if not exists idx_review_logs_user on public.review_logs(user_id);
create index if not exists idx_review_logs_card on public.review_logs(card_id);
