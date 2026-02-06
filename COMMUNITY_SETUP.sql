-- 1. Tabla de Seguidores (Follows)
create table if not exists public.follows (
  follower_id uuid references auth.users not null,
  following_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  primary key (follower_id, following_id)
);

-- RLS para Follows
alter table public.follows enable row level security;

-- Cualquiera puede ver quién sigue a quién (para contadores)
create policy "Follows are valid public" on public.follows
  for select using (true);

-- Solo el usuario autenticado puede "Seguir" (crear registro con su ID)
create policy "Users can follow others" on public.follows
  for insert with check (auth.uid() = follower_id);

-- Solo el usuario autenticado puede "Dejar de seguir" (borrar su registro)
create policy "Users can unfollow" on public.follows
  for delete using (auth.uid() = follower_id);


-- 2. Tabla Cache de Rendimiento (User Performance)
-- Esta tabla almacenará el ROI calculado para no revelar montos reales en el leaderboard.
-- Se actualizará desde el cliente (o Edge Function) cuando se calculan los precios.
create table if not exists public.user_performance (
  user_id uuid references auth.users primary key,
  roi_total numeric default 0,      -- Porcentaje total de ganancia/pérdida
  roi_24h numeric default 0,        -- Variación en 24h
  last_updated timestamp with time zone default now()
);

-- RLS para Performance
alter table public.user_performance enable row level security;

-- PÚBLICO: Todos pueden ver el ROI de otros (para el Leaderboard)
create policy "Performance is public" on public.user_performance
  for select using (true);

-- UPDATE: Un usuario puede actualizar SU PROPIO récord de rendimiento
-- (Nota: En producción ideal, esto lo haría una Edge Function segura, no el cliente directamente)
create policy "Users update own performance" on public.user_performance
  for update using (auth.uid() = user_id);
create policy "Users insert own performance" on public.user_performance
  for insert with check (auth.uid() = user_id);


-- 3. Vista de Leaderboard (Ranking)
-- Une perfiles con rendimiento para mostrar en la tabla de clasificación
create or replace view public.leaderboard_view as
select 
  p.id as user_id,
  p.username,
  p.name,
  p.avatar_url,
  up.roi_total,
  up.roi_24h,
  -- Calcular ranking basado en ROI Total
  rank() over (order by up.roi_total desc nulls last) as rank_position
from public.profiles p
left join public.user_performance up on p.id = up.user_id
where p.privacy_settings->>'show_analytics' = 'true' -- Respetar privacidad
order by up.roi_total desc nulls last;
