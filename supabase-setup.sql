-- Run this in your Supabase SQL editor
-- Dashboard → SQL Editor → New Query → paste this → Run

create table if not exists downloads (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,
  filename   text not null,
  platform   text not null default 'Video',
  created_at timestamptz default now()
);

-- Allow anyone to read/write (no auth needed for personal use)
alter table downloads enable row level security;

create policy "Public access" on downloads
  for all using (true) with check (true);
