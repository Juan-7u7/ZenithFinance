-- 1. Añadir columna 'username' única y configuración de privacidad a Profiles
alter table public.profiles 
add column if not exists username text unique,
add column if not exists privacy_settings jsonb default '{"show_balance": false, "show_assets": true, "show_analytics": true}'::jsonb;

-- Llenar username basado en el nombre o email para usuarios existentes
update public.profiles 
set username = lower(regexp_replace(name, '\s+', '', 'g')) 
where username is null;

-- 2. Función segura para obtener portafolio público
-- Esta función verifica si el usuario permite ver sus activos antes de devolverlos
create or replace function get_public_portfolio(target_username text)
returns table (
  asset_id text,
  symbol text,
  name text,
  quantity numeric,
  current_price numeric,
  value numeric,
  allocation_percentage numeric
) language plpgsql security definer as $$
declare
  target_uid uuid;
  privacy_config jsonb;
begin
  -- Obtener ID y config del usuario objetivo
  select id, privacy_settings into target_uid, privacy_config
  from public.profiles 
  where username = target_username;

  -- Si no existe o tiene los activos ocultos, no devolver nada
  if target_uid is null or (privacy_config->>'show_assets')::boolean = false then
    return;
  end if;

  -- Devolver activos (sin precios de compra ni P/L sensibles si se desea privacidad extrema, 
  -- pero para mostrar gráficas necesitamos ciertos datos. Aquí devolvemos datos básicos)
  return query
  select 
    ua.asset_id,
    ua.symbol,
    ua.asset_name,
    ua.amount,
    ua.purchase_price, -- Se podría ocultar si es muy sensible, pero necesario para P/L
    (ua.amount * ua.purchase_price), -- Valor estimado (debería ser precio actual real en frontend)
    0.0 -- Placeholder para allocation
  from public.user_assets ua
  where ua.user_id = target_uid;
end;
$$;

-- 3. Habilitar función RPC para ser llamada desde la API
grant execute on function get_public_portfolio(text) to anon, authenticated, service_role;
