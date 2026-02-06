-- ============================================
-- CREAR TABLA USERS
-- ============================================
-- Esta tabla almacena información pública de los usuarios
-- que es visible para otros usuarios (nombre, avatar, etc.)

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS POLICIES)
-- ============================================

-- Política 1: Todos pueden ver todos los perfiles
-- (Necesario para mostrar nombres en comunidad, notificaciones, etc.)
CREATE POLICY "Users can view all profiles"
ON public.users
FOR SELECT
USING (true);

-- Política 2: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política 3: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- FUNCIÓN PARA AUTO-CREAR PERFIL AL REGISTRARSE
-- ============================================
-- Esta función se ejecuta automáticamente cuando un usuario
-- se registra, creando su entrada en la tabla users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER PARA AUTO-CREAR PERFIL
-- ============================================
-- Se ejecuta después de que un usuario se registra en auth.users

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCIÓN PARA AUTO-ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER PARA AUTO-ACTUALIZAR updated_at
-- ============================================

DROP TRIGGER IF EXISTS on_users_updated ON public.users;

CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- MIGRAR USUARIOS EXISTENTES (SI LOS HAY)
-- ============================================
-- Esto crea entradas en la tabla users para usuarios
-- que ya existen en auth.users pero no tienen perfil

INSERT INTO public.users (id, email, name, avatar_url)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esto para verificar que todo está correcto:

-- Ver todos los usuarios
-- SELECT * FROM public.users;

-- Ver políticas de seguridad
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Ver triggers
-- SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';
