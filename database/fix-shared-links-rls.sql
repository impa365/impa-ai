-- Correção das Políticas RLS para Links Compartilhados
-- Execute no Supabase SQL Editor

-- Remover políticas existentes se houver conflitos
DROP POLICY IF EXISTS "Users can manage their own shared links" ON impaai.shared_whatsapp_links;
DROP POLICY IF EXISTS "Public can access active links by token" ON impaai.shared_whatsapp_links;

-- Política para usuários autenticados - permitir todas as operações para seus próprios links
CREATE POLICY "authenticated_users_full_access" 
ON impaai.shared_whatsapp_links
FOR ALL 
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Política para acesso público - apenas SELECT com token ativo
CREATE POLICY "public_read_active_links" 
ON impaai.shared_whatsapp_links
FOR SELECT 
TO anon, authenticated
USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
);

-- Política especial para permitir UPDATE de contadores (sem autenticação para logging)
CREATE POLICY "public_update_access_logs" 
ON impaai.shared_whatsapp_links
FOR UPDATE 
TO anon, authenticated
USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
)
WITH CHECK (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
);

-- Garantir que a tabela tenha RLS habilitado
ALTER TABLE impaai.shared_whatsapp_links ENABLE ROW LEVEL SECURITY;

-- Conceder permissões necessárias
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.shared_whatsapp_links TO authenticated;
GRANT SELECT, UPDATE ON impaai.shared_whatsapp_links TO anon; 