-- 1. Tabla de Notificaciones
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references auth.users not null, -- Quién recibe la notificación
  sender_id uuid references auth.users,             -- Quién causó la acción (el seguidor)
  type text not null check (type in ('NEW_FOLLOWER', 'ASSET_ALERT', 'SYSTEM')),
  meta_data jsonb default '{}'::jsonb,              -- Datos extra (ej. nombre del seguidor)
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.notifications enable row level security;

-- Los usuarios solo pueden ver SUS notificaciones
create policy "Users manage own notifications" on public.notifications
  for all using (auth.uid() = recipient_id);

-- 2. Función Trigger: Crear notificación al seguir
create or replace function public.handle_new_follow()
returns trigger as $$
begin
  insert into public.notifications (recipient_id, sender_id, type)
  values (new.following_id, new.follower_id, 'NEW_FOLLOWER');
  return new;
end;
$$ language plpgsql security definer;

-- 3. Trigger en tabla Follows
drop trigger if exists on_new_follow on public.follows;
create trigger on_new_follow
  after insert on public.follows
  for each row execute procedure public.handle_new_follow();
