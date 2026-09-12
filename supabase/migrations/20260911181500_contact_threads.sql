create table public.contact_threads (
  ticket_id text primary key,
  topic text not null,
  name text,
  email text not null,
  context_url text,
  message text not null,
  user_id uuid references auth.users(id) on delete set null,
  discord_thread_id text unique,
  discord_parent_channel_id text,
  reply_token text not null unique,
  resend_last_email_id text,
  resend_last_message_id text,
  created_at timestamptz not null default now()
);

alter table public.contact_threads enable row level security;
