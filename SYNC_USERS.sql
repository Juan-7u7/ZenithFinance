-- SOLUCIÓN: Sincronizar usuarios de Auth a la tabla Profiles
-- Ejecuta este script e el Editor SQL de Supabase para poblar la lista de "Comunidad"

-- 1. Asegurar que la tabla profiles tenga las columnas necesarias
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  name text,
  avatar_url text
);

-- Si la tabla ya existe, nos aseguramos que tenga la columna 'name'
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists avatar_url text;

-- 2. Copiar usuarios existentes de Autenticación a Profiles (Backfill)
insert into public.profiles (id, name, avatar_url)
select 
  id, 
  -- Usar metadatos o el email (antes del @) si no tiene nombre
  coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do update 
set 
  name = excluded.name,
  avatar_url = excluded.avatar_url;

-- 3. Habilitar lectura pública (necesario para el buscador)
alter table public.profiles enable row level security;

-- Borrar política anterior si existe para evitar conflictos
drop policy if exists "Public profiles are viewable by everyone." on profiles;

-- Crear política de lectura pública
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

-- 4. Trigger para mantener sincronizados los NUEVOS usuarios automáticamente
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recrear el trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
