-- Agregar columna triggered_at a la tabla price_alerts
-- Esta columna registra cuándo se disparó una alerta para poder eliminarla después de 24 horas

ALTER TABLE public.price_alerts 
ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMPTZ;

-- Crear índice para mejorar el rendimiento de las consultas de limpieza
CREATE INDEX IF NOT EXISTS idx_price_alerts_triggered_at 
ON public.price_alerts(triggered_at) 
WHERE triggered_at IS NOT NULL;

-- OPCIONAL: Función automática de limpieza (se ejecuta periódicamente)
-- Esta función elimina alertas disparadas hace más de 24 horas

CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.price_alerts
  WHERE is_active = false 
    AND triggered_at IS NOT NULL 
    AND triggered_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- OPCIONAL: Crear un cron job para ejecutar la limpieza automáticamente cada hora
-- Nota: Requiere la extensión pg_cron (disponible en Supabase Pro)
-- Si no tienes pg_cron, la limpieza se hará desde el frontend al cargar la app

-- SELECT cron.schedule(
--   'cleanup-old-alerts',
--   '0 * * * *', -- Cada hora
--   'SELECT cleanup_old_alerts();'
-- );
