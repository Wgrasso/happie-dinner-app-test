-- Notification log — records every push/local notification the app has
-- sent (or scheduled to send) so the product owner can see a complete
-- history of the copy that reaches users.
--
-- kind values are free-form strings; the app currently uses:
--   'inactive_reminder'  — user has not voted for N days
--   'first_yes'          — legacy, existing trigger
--
-- Scheduled-but-not-yet-sent rows have sent_at = NULL. A row is updated
-- with sent_at + status when the push actually goes out (or fails).

create table if not exists notification_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          text not null,
  title         text not null,
  body          text not null,
  data          jsonb default '{}'::jsonb,
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  status        text not null default 'sent'
                check (status in ('scheduled', 'sent', 'failed')),
  error         text,
  created_at    timestamptz not null default now()
);

create index if not exists notification_log_user_kind_created_idx
  on notification_log (user_id, kind, created_at desc);

create index if not exists notification_log_kind_created_idx
  on notification_log (kind, created_at desc);

alter table notification_log enable row level security;

-- Users can read their own notification history.
drop policy if exists notification_log_read_own on notification_log;
create policy notification_log_read_own on notification_log
  for select using (auth.uid() = user_id);

-- Users can insert rows for themselves (the client-side scheduler writes
-- its own entries when a local reminder is dispatched).
drop policy if exists notification_log_insert_own on notification_log;
create policy notification_log_insert_own on notification_log
  for insert with check (auth.uid() = user_id);

-- Users can update their own log rows (e.g. mark scheduled → sent).
drop policy if exists notification_log_update_own on notification_log;
create policy notification_log_update_own on notification_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
