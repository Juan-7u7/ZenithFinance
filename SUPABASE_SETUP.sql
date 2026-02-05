-- TABLA 1: ACTIVOS DEL USUARIO (user_assets)
create table user_assets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  asset_id text not null,        -- ID de CoinGecko (ej. 'bitcoin')
  symbol text not null,          -- Símbolo (ej. 'btc')
  asset_name text,               -- Nombre (ej. 'Bitcoin')
  amount numeric not null,       -- Cantidad poseída
  purchase_price numeric,        -- Precio promedio de compra
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar seguridad (RLS)
alter table user_assets enable row level security;

-- Política: Los usuarios solo pueden ver y editar sus propios activos
create policy "Users can view own assets" on user_assets
  for select using (auth.uid() = user_id);

create policy "Users can insert own assets" on user_assets
  for insert with check (auth.uid() = user_id);

create policy "Users can update own assets" on user_assets
  for update using (auth.uid() = user_id);

create policy "Users can delete own assets" on user_assets
  for delete using (auth.uid() = user_id);


-- TABLA 2: HISTORIAL DE TRANSACCIONES (user_transactions)
create table user_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  asset_id text not null,
  symbol text,
  asset_name text,
  type text not null,            -- 'buy', 'sell', 'update', 'delete'
  amount numeric,
  price_per_unit numeric,
  total numeric,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar seguridad (RLS)
alter table user_transactions enable row level security;

-- Política: Los usuarios solo pueden ver sus propias transacciones
create policy "Users can view own transactions" on user_transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert own transactions" on user_transactions
  for insert with check (auth.uid() = user_id);
