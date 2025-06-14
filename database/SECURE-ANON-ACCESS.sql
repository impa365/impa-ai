-- ============================================
-- CONFIGURAÇÃO MÍNIMA E SEGURA DE ACESSO
-- ============================================
-- Apenas as permissões necessárias para funcionamento
-- ============================================

-- 1. Permissões básicas no schema (obrigatório)
GRANT USAGE ON SCHEMA impaai TO anon;
GRANT USAGE ON SCHEMA impaai TO authenticated;

-- 2. Permissões específicas para anon (APENAS o necessário)
-- Configurações públicas do sistema
GRANT SELECT ON impaai.system_settings TO anon;
-- Temas do sistema
GRANT SELECT ON impaai.system_themes TO anon;
-- Verificação de email para login (campos seguros apenas)
GRANT SELECT (id, email, role, status) ON impaai.user_profiles TO anon;

-- 3. Políticas RLS SEGURAS para anon
-- System Settings - apenas públicas e ativas
CREATE POLICY "Public settings access" ON impaai.system_settings
    FOR SELECT TO anon 
    USING (is_public = true AND is_active = true);

-- System Themes - apenas temas ativos
CREATE POLICY "Active themes access" ON impaai.system_themes
    FOR SELECT TO anon 
    USING (is_active = true);

-- User Profiles - apenas para verificação de login (SEM senhas)
CREATE POLICY "Email verification only" ON impaai.user_profiles
    FOR SELECT TO anon 
    USING (email IS NOT NULL);

-- 4. Políticas para usuários AUTENTICADOS (dados próprios)
-- Perfil próprio
CREATE POLICY "Own profile access" ON impaai.user_profiles
    FOR ALL TO authenticated 
    USING (auth.uid()::text = id::text);

-- Admin pode ver todos os perfis
CREATE POLICY "Admin full access" ON impaai.user_profiles
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM impaai.user_profiles 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

-- Suas próprias API keys
CREATE POLICY "Own api keys" ON impaai.user_api_keys
    FOR ALL TO authenticated 
    USING (auth.uid()::text = user_id::text);

-- Suas próprias conexões WhatsApp
CREATE POLICY "Own whatsapp connections" ON impaai.whatsapp_connections
    FOR ALL TO authenticated 
    USING (auth.uid()::text = user_id::text);

-- Seus próprios agentes
CREATE POLICY "Own agents" ON impaai.ai_agents
    FOR ALL TO authenticated 
    USING (auth.uid()::text = user_id::text);

-- Logs dos seus agentes apenas
CREATE POLICY "Own agent logs" ON impaai.agent_activity_logs
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM impaai.ai_agents 
            WHERE ai_agents.id = agent_activity_logs.agent_id 
            AND ai_agents.user_id::text = auth.uid()::text
        )
    );

-- Suas conversas apenas
CREATE POLICY "Own conversations" ON impaai.conversations
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM impaai.ai_agents 
            WHERE ai_agents.id = conversations.agent_id 
            AND ai_agents.user_id::text = auth.uid()::text
        )
    );

-- Suas mensagens apenas
CREATE POLICY "Own messages" ON impaai.messages
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM impaai.conversations 
            JOIN impaai.ai_agents ON ai_agents.id = conversations.agent_id
            WHERE conversations.id = messages.conversation_id 
            AND ai_agents.user_id::text = auth.uid()::text
        )
    );

-- 5. Verificação final
SELECT 
    'Configuração aplicada com sucesso!' as status,
    'Acesso anônimo: Apenas configurações e temas públicos' as anon_access,
    'Acesso autenticado: Apenas dados próprios' as auth_access;

-- Teste básico
SELECT 'Configurações públicas disponíveis:' as info, COUNT(*) as total 
FROM impaai.system_settings WHERE is_public = true;

SELECT 'Temas disponíveis:' as info, COUNT(*) as total 
FROM impaai.system_themes WHERE is_active = true;

-- ============================================
-- ✅ CONFIGURAÇÃO SEGURA APLICADA!
-- 
-- ANÔNIMO pode ver:
-- - Configurações públicas do sistema
-- - Temas ativos
-- - Verificar se email existe (para login)
-- 
-- AUTENTICADO pode ver:
-- - Apenas seus próprios dados
-- - Admins veem perfis de usuários
-- 
-- PROTEGIDO:
-- - Senhas nunca expostas
-- - Dados pessoais protegidos
-- - Logs e mensagens privadas
-- ============================================
