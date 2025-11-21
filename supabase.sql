-- Supabase schema for Nous MVP
-- Run this in the Supabase SQL editor.

-- Profiles table (extension of auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_subscribed boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz default now()
);

-- Notes
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Todos
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  is_done boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Flashcard decks
create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Flashcards
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null,
  back text not null,
  created_at timestamptz default now()
);

-- Password vault (single encrypted blob per user)
create table if not exists public.password_vault (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_blob text not null,
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.todos enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.password_vault enable row level security;

-- Policies: users can manage their own data
create policy "Select own profile" on public.profiles for select using (auth.uid() = id);
create policy "Insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Update own profile" on public.profiles for update using (auth.uid() = id);

create policy "CRUD own notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "CRUD own todos" on public.todos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "CRUD own decks" on public.flashcard_decks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "CRUD own flashcards" on public.flashcards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "CRUD own vault" on public.password_vault for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admin policies (optional: allow service role key full access; handled by backend service role key)
-- Optionally add a read-all policy for profiles for authenticated admins via a function.
