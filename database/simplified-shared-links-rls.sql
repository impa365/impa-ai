-- Correção Simplificada das Políticas RLS para Links Compartilhados
-- Execute no Supabase SQL Editor

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage their own shared links" ON impaai.shared_whatsapp_links;
DROP POLICY IF EXISTS "Public can access active links by token" ON impaai.shared_whatsapp_links;
DROP POLICY IF EXISTS "authenticated_users_full_access" ON impaai.shared_whatsapp_links;
DROP POLICY IF EXISTS "public_read_active_links" ON impaai.shared_whatsapp_links;
DROP POLICY IF EXISTS "public_update_access_logs" ON impaai.shared_whatsapp_links;

-- Política permissiva para authenticated (permite tudo para usuários autenticados)
CREATE POLICY "authenticated_full_access" 
ON impaai.shared_whatsapp_links
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para anon (apenas SELECT/UPDATE de links ativos)
CREATE POLICY "anon_access_active_links" 
ON impaai.shared_whatsapp_links
FOR SELECT 
TO anon
USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
);

-- Política para anon atualizar contadores
CREATE POLICY "anon_update_counters" 
ON impaai.shared_whatsapp_links
FOR UPDATE 
TO anon
USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
);

-- Garantir que a tabela tenha RLS habilitado
ALTER TABLE impaai.shared_whatsapp_links ENABLE ROW LEVEL SECURITY;

-- Conceder permissões necessárias
GRANT ALL ON impaai.shared_whatsapp_links TO authenticated;
GRANT SELECT, UPDATE ON impaai.shared_whatsapp_links TO anon; 