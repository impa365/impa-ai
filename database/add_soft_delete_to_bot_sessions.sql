-- ============================================
-- SISTEMA DE 4 ESTADOS PARA BOT SESSIONS
-- ============================================
-- 
-- Estados:
-- 1. ATIVADA: status=true, deleted_at=NULL (visível, bot ativo)
-- 2. PAUSADA: status=false, deleted_at=NULL (visível, bot pausado)
-- 3. INATIVA: deleted_at=timestamp (oculta, mantida no BD, apagada após 30 dias)
-- 4. APAGADA: registro deletado fisicamente (após 30 dias de inativação)
--
-- ============================================

-- ============================================
-- 1. ADICIONAR CAMPO deleted_at
-- ============================================

ALTER TABLE impaai.bot_sessions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

COMMENT ON COLUMN impaai.bot_sessions.deleted_at IS 
'Soft delete para gerenciar estados:
- NULL = Ativa/Pausada (visível no painel)
- timestamp = Inativa (oculta do painel, mantida no BD)
Sessões com deleted_at > 30 dias serão apagadas fisicamente por job de limpeza';

-- ============================================
-- 2. CRIAR ÍNDICES E CONSTRAINTS
-- ============================================

-- Constraint único: apenas UMA sessão ativa por (remoteJid + bot_id)
DROP INDEX IF EXISTS impaai.idx_bot_sessions_unique_active;
CREATE UNIQUE INDEX idx_bot_sessions_unique_active 
ON impaai.bot_sessions("remoteJid", bot_id) 
WHERE deleted_at IS NULL;

-- Índice para performance em queries filtradas por deleted_at
DROP INDEX IF EXISTS impaai.idx_bot_sessions_not_deleted;
CREATE INDEX idx_bot_sessions_not_deleted 
ON impaai.bot_sessions(bot_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Índice para buscar sessões a serem limpas (> 30 dias)
DROP INDEX IF EXISTS impaai.idx_bot_sessions_cleanup;
CREATE INDEX idx_bot_sessions_cleanup 
ON impaai.bot_sessions(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- ============================================
-- 3. CRIAR FUNÇÃO DE LIMPEZA AUTOMÁTICA
-- ============================================

CREATE OR REPLACE FUNCTION impaai.cleanup_old_deleted_sessions()
RETURNS TABLE(deleted_count INTEGER) 
LANGUAGE plpgsql
AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  -- Apagar sessões marcadas como deletadas há mais de 30 dias
  DELETE FROM impaai.bot_sessions
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  
  -- Registrar no log
  RAISE NOTICE 'Limpeza de sessões: % registros apagados', rows_deleted;
  
  RETURN QUERY SELECT rows_deleted;
END;
$$;

COMMENT ON FUNCTION impaai.cleanup_old_deleted_sessions() IS 
'Apaga fisicamente sessões marcadas como deletadas (deleted_at) há mais de 30 dias.
Execute periodicamente via cron job ou manualmente: SELECT * FROM impaai.cleanup_old_deleted_sessions();';

-- ============================================
-- 4. TESTAR FUNÇÃO (OPCIONAL)
-- ============================================

-- Descomentar para testar:
-- SELECT * FROM impaai.cleanup_old_deleted_sessions();

-- ============================================
-- 5. EXEMPLOS DE USO
-- ============================================

-- Listar apenas sessões ativas (visíveis no painel)
-- SELECT * FROM impaai.bot_sessions WHERE deleted_at IS NULL;

-- Marcar sessão como inativa (soft delete)
-- UPDATE impaai.bot_sessions 
-- SET deleted_at = NOW(), status = false 
-- WHERE "sessionId" = 'uuid-aqui';

-- Contar sessões por estado
-- SELECT 
--   CASE 
--     WHEN deleted_at IS NOT NULL THEN 'INATIVA'
--     WHEN status = true THEN 'ATIVADA'
--     ELSE 'PAUSADA'
--   END as estado,
--   COUNT(*) as total
-- FROM impaai.bot_sessions
-- GROUP BY estado;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

