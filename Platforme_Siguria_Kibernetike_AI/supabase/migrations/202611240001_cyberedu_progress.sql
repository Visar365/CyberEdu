create table if not exists public.cyberedu_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  completed_lessons integer[] not null default '{}',
  quiz_score integer not null default 0 check (quiz_score >= 0 and quiz_score <= 100000),
  earned_achievements text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.cyberedu_progress enable row level security;
revoke all on table public.cyberedu_progress from anon, authenticated;
grant all on table public.cyberedu_progress to service_role;
