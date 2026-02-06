# 🔄 Migración: Sistema de Auto-Limpieza de Alertas

## 📋 Descripción

Esta migración agrega la funcionalidad de auto-limpieza de alertas disparadas después de 24 horas. Esto mantiene la base de datos limpia y evita acumulación innecesaria de datos.

## 🎯 ¿Qué hace esta migración?

1. **Agrega la columna `triggered_at`** a la tabla `price_alerts`
2. **Crea un índice** para mejorar el rendimiento de las consultas de limpieza
3. **Crea una función SQL** opcional para limpieza automática desde el backend

## 🚀 Cómo ejecutar la migración

### Opción 1: Desde el SQL Editor de Supabase (Recomendado)

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** en el menú lateral
3. Copia y pega el contenido del archivo `add_triggered_at_column.sql`
4. Haz clic en **Run** para ejecutar la migración

### Opción 2: Usando Supabase CLI

```bash
# Si tienes Supabase CLI instalado
supabase db push
```

## ✅ Verificación

Después de ejecutar la migración, verifica que todo esté correcto:

```sql
-- Verificar que la columna existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'price_alerts'
  AND column_name = 'triggered_at';

-- Verificar que el índice fue creado
SELECT indexname
FROM pg_indexes
WHERE tablename = 'price_alerts'
  AND indexname = 'idx_price_alerts_triggered_at';

-- Verificar que la función existe
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'cleanup_old_alerts';
```

## 🔧 Configuración Opcional: Cron Job Automático

Si tienes **Supabase Pro** y quieres que la limpieza sea completamente automática desde el backend:

```sql
-- Habilitar la extensión pg_cron (solo una vez)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar la limpieza cada hora
SELECT cron.schedule(
  'cleanup-old-alerts',
  '0 * * * *', -- Cada hora en punto
  'SELECT cleanup_old_alerts();'
);
```

### Ver cron jobs activos:

```sql
SELECT * FROM cron.job;
```

### Eliminar el cron job (si es necesario):

```sql
SELECT cron.unschedule('cleanup-old-alerts');
```

## 📝 Notas Importantes

### Limpieza desde el Frontend

**No es necesario configurar el cron job** si estás en el plan gratuito de Supabase. El sistema ya tiene limpieza automática desde el frontend:

- Se ejecuta cada vez que un usuario carga la aplicación
- Busca alertas disparadas hace más de 24 horas
- Las elimina automáticamente

### Comportamiento del Sistema

1. **Cuando se dispara una alerta:**
   - `is_active` se cambia a `false`
   - `triggered_at` se establece con el timestamp actual

2. **Limpieza automática:**
   - **Frontend**: Al cargar `AlertService` (cada vez que un usuario inicia sesión)
   - **Backend** (opcional): Cada hora si configuraste el cron job

3. **Criterios de eliminación:**
   - `is_active = false` (alerta ya disparada)
   - `triggered_at IS NOT NULL` (tiene timestamp de disparo)
   - `triggered_at < NOW() - INTERVAL '24 hours'` (más de 24 horas)

## 🔄 Rollback (Deshacer la migración)

Si necesitas revertir los cambios:

```sql
-- Eliminar el cron job (si lo creaste)
SELECT cron.unschedule('cleanup-old-alerts');

-- Eliminar la función
DROP FUNCTION IF EXISTS cleanup_old_alerts();

-- Eliminar el índice
DROP INDEX IF EXISTS idx_price_alerts_triggered_at;

-- Eliminar la columna
ALTER TABLE public.price_alerts DROP COLUMN IF EXISTS triggered_at;
```

## 🎉 ¡Listo!

Una vez ejecutada la migración, el sistema de auto-limpieza estará completamente funcional. Las alertas disparadas se eliminarán automáticamente después de 24 horas, manteniendo tu base de datos limpia y optimizada.

## 📞 Soporte

Si encuentras algún problema durante la migración, verifica:

1. ✅ Que tienes permisos de administrador en Supabase
2. ✅ Que la tabla `price_alerts` existe
3. ✅ Que no hay alertas activas que puedan causar conflictos
4. ✅ Los logs de error en el SQL Editor de Supabase
