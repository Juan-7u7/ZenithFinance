-- ============================================
-- TABLA: net_worth_history
-- ============================================
-- Almacena snapshots del patrimonio neto del usuario a lo largo del tiempo
-- Permite generar gráficos históricos de rendimiento

CREATE TABLE IF NOT EXISTS public.net_worth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_value DECIMAL(20, 2) NOT NULL,
  profit_loss DECIMAL(20, 2) NOT NULL,
  profit_loss_percentage DECIMAL(10, 4) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_net_worth_user_timestamp 
ON public.net_worth_history(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_net_worth_timestamp 
ON public.net_worth_history(timestamp DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propio histórico
CREATE POLICY "Users can view own net worth history"
ON public.net_worth_history
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar su propio histórico
CREATE POLICY "Users can insert own net worth history"
ON public.net_worth_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar su propio histórico
CREATE POLICY "Users can delete own net worth history"
ON public.net_worth_history
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- FUNCIÓN PARA AUTO-LIMPIEZA (OPCIONAL)
-- ============================================
-- Elimina snapshots más antiguos de 90 días automáticamente

CREATE OR REPLACE FUNCTION public.cleanup_old_net_worth_snapshots()
RETURNS void AS $$
BEGIN
  DELETE FROM public.net_worth_history
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE public.net_worth_history IS 'Histórico del patrimonio neto del usuario para gráficos de rendimiento';
COMMENT ON COLUMN public.net_worth_history.total_value IS 'Valor total del portafolio en este momento';
COMMENT ON COLUMN public.net_worth_history.profit_loss IS 'Ganancia/pérdida total en USD';
COMMENT ON COLUMN public.net_worth_history.profit_loss_percentage IS 'Ganancia/pérdida en porcentaje';
COMMENT ON COLUMN public.net_worth_history.timestamp IS 'Momento exacto del snapshot';
