-- =====================================================
-- SCRIPT PARA FILTRAR REGISTROS DELETADOS DE BOT_SESSIONS
-- Data: 2025-10-29
-- Descrição: Criar VIEW e soluções para filtrar registros deletados automaticamente
-- =====================================================

-- 1. CRIAR VIEW PARA REGISTROS ATIVOS (NÃO DELETADOS)
-- Esta view filtra automaticamente registros com deleted_at preenchido
CREATE OR REPLACE VIEW impaai.bot_sessions_active AS
SELECT 
    "sessionId",
    "remoteJid",
    status,
    ultimo_status,
    criado_em,
    bot_id,
    connection_id,
    deleted_at
FROM impaai.bot_sessions
WHERE deleted_at IS NULL;

-- 2. CONCEDER PERMISSÕES PARA A VIEW
GRANT ALL PRIVILEGES ON impaai.bot_sessions_active TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bot_sessions_active TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bot_sessions_active TO service_role;

-- 3. CRIAR VIEW PARA REGISTROS DELETADOS (APENAS PARA ADMIN)
-- Esta view mostra apenas registros deletados (para auditoria)
CREATE OR REPLACE VIEW impaai.bot_sessions_deleted AS
SELECT 
    "sessionId",
    "remoteJid",
    status,
    ultimo_status,
    criado_em,
    bot_id,
    connection_id,
    deleted_at
FROM impaai.bot_sessions
WHERE deleted_at IS NOT NULL;

-- 4. CONCEDER PERMISSÕES PARA A VIEW DE DELETADOS
GRANT ALL PRIVILEGES ON impaai.bot_sessions_deleted TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bot_sessions_deleted TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bot_sessions_deleted TO service_role;

-- 5. CRIAR FUNÇÃO PARA BUSCAR SESSÃO ATIVA POR REMOTEJID
-- Função que automaticamente filtra registros deletados
CREATE OR REPLACE FUNCTION impaai.get_active_bot_session(p_remote_jid TEXT)
RETURNS TABLE (
    "sessionId" UUID,
    "remoteJid" TEXT,
    status BOOLEAN,
    ultimo_status TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE,
    bot_id UUID,
    connection_id UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        "sessionId",
        "remoteJid",
        status,
        ultimo_status,
        criado_em,
        bot_id,
        connection_id,
        deleted_at
    FROM impaai.bot_sessions
    WHERE "remoteJid" = p_remote_jid 
    AND deleted_at IS NULL;
$$;

-- 6. CONCEDER PERMISSÕES PARA A FUNÇÃO
GRANT EXECUTE ON FUNCTION impaai.get_active_bot_session(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION impaai.get_active_bot_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION impaai.get_active_bot_session(TEXT) TO service_role;

-- 7. CRIAR ÍNDICE OTIMIZADO PARA A VIEW
-- Índice específico para consultas na view de registros ativos
CREATE INDEX IF NOT EXISTS idx_bot_sessions_active_remotejid 
ON impaai.bot_sessions ("remoteJid") 
WHERE deleted_at IS NULL;

-- 8. VERIFICAÇÃO DAS VIEWS CRIADAS
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'impaai' 
AND viewname LIKE 'bot_sessions%';

-- 9. TESTE DAS VIEWS
-- Testar view de registros ativos
SELECT 'Registros ATIVOS (não deletados):' as tipo, COUNT(*) as total
FROM impaai.bot_sessions_active
UNION ALL
SELECT 'Registros DELETADOS:' as tipo, COUNT(*) as total
FROM impaai.bot_sessions_deleted
UNION ALL
SELECT 'TOTAL na tabela original:' as tipo, COUNT(*) as total
FROM impaai.bot_sessions;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================

-- OPÇÃO 1: USAR A VIEW (RECOMENDADO)
-- No n8n, mude a tabela de "bot_sessions" para "bot_sessions_active"
-- Isso filtra automaticamente registros deletados

-- OPÇÃO 2: USAR A FUNÇÃO
-- No n8n, use a função: get_active_bot_session('557381062304@s.whatsapp.net')
-- Isso retorna apenas registros ativos para um remoteJid específico

-- OPÇÃO 3: ADICIONAR FILTRO MANUAL
-- No n8n, adicione na query:
-- WHERE deleted_at IS NULL

-- =====================================================
-- VANTAGENS DE CADA OPÇÃO:
-- =====================================================

-- VIEW (bot_sessions_active):
-- ✅ Filtro automático
-- ✅ Não precisa lembrar de adicionar WHERE
-- ✅ Performance otimizada com índices
-- ✅ Compatível com todas as operações (SELECT, INSERT, UPDATE, DELETE)

-- FUNÇÃO (get_active_bot_session):
-- ✅ Filtro automático por remoteJid
-- ✅ Performance otimizada
-- ✅ Ideal para consultas específicas
-- ❌ Apenas para SELECT (não para INSERT/UPDATE/DELETE)

-- FILTRO MANUAL (WHERE deleted_at IS NULL):
-- ✅ Controle total
-- ✅ Funciona com qualquer query
-- ❌ Precisa lembrar de adicionar em todas as consultas
-- ❌ Pode esquecer em algumas queries

-- =====================================================
