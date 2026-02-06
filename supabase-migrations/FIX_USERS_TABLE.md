# 🔧 Fix: "Could not find table 'public.users'"

## ❌ Problema

Al intentar cambiar el nombre de usuario aparece el error:

```
Could not find the table 'public.users' in the schema cache
```

## ✅ Solución

La tabla `users` no existe en Supabase. Necesitas crearla ejecutando la migración.

## 🚀 Pasos para Resolver

### 1. Abre Supabase Dashboard

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto **ZenithFinance**
3. En el menú lateral, haz clic en **SQL Editor**

### 2. Ejecuta la Migración

1. Haz clic en **+ New Query**
2. Copia **TODO** el contenido del archivo `create_users_table.sql`
3. Pégalo en el editor SQL
4. Haz clic en **Run** (o presiona Ctrl + Enter)

### 3. Verifica que Funcionó

Ejecuta esta consulta para verificar:

```sql
SELECT * FROM public.users;
```

Deberías ver una tabla vacía o con tus usuarios existentes migrados automáticamente.

## 📋 ¿Qué hace esta migración?

### Crea la tabla `users`

```sql
- id (UUID) - Referencia a auth.users
- email (TEXT)
- name (TEXT) - Nombre del usuario
- avatar_url (TEXT) - URL del avatar
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Configura seguridad (RLS)

- ✅ Todos pueden **ver** todos los perfiles
- ✅ Solo puedes **editar** tu propio perfil
- ✅ Solo puedes **crear** tu propio perfil

### Agrega automatización

- 🤖 **Auto-crea** perfil cuando un usuario se registra
- 🤖 **Auto-actualiza** `updated_at` cuando cambias datos
- 🤖 **Migra** usuarios existentes automáticamente

## 🎯 Después de Ejecutar

1. **Recarga la aplicación** (F5)
2. **Intenta cambiar tu nombre** nuevamente
3. **Debería funcionar** sin errores
4. **Otros usuarios** verán tu nuevo nombre

## 🐛 Si Aún No Funciona

### Verifica las políticas RLS:

```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

Deberías ver 3 políticas:

- `Users can view all profiles`
- `Users can update own profile`
- `Users can insert own profile`

### Verifica los triggers:

```sql
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.users'::regclass;
```

Deberías ver:

- `on_auth_user_created`
- `on_users_updated`

### Verifica que tu usuario existe:

```sql
SELECT id, email, name FROM public.users WHERE id = auth.uid();
```

Si no aparece nada, ejecuta manualmente:

```sql
INSERT INTO public.users (id, email, name)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'Tu Nombre Aquí'
);
```

## 📝 Notas Importantes

- ⚠️ Esta migración es **segura** - no borra datos existentes
- ✅ Usa `ON CONFLICT DO NOTHING` para evitar duplicados
- ✅ Los usuarios existentes se migran automáticamente
- ✅ Los nuevos usuarios se crean automáticamente al registrarse

## 🎉 ¡Listo!

Una vez ejecutada la migración, el cambio de nombre funcionará correctamente y será visible para todos los usuarios.
