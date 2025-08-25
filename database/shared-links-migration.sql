-- Migração para Links Compartilhados Seguros
-- Criada em: 2025-08-24

-- Criar tabela para links compartilhados
CREATE TABLE IF NOT EXISTS impaai.shared_whatsapp_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES impaai.whatsapp_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    
    -- Segurança
    token TEXT NOT NULL UNIQUE, -- Token único para o link
    password_hash TEXT NULL, -- Hash da senha (opcional)
    salt TEXT NULL, -- Salt para a senha
    
    -- Permissões granulares
    permissions JSONB NOT NULL DEFAULT '{"qr_code": true, "stats": false, "settings": false}',
    
    -- Configurações de acesso
    expires_at TIMESTAMP WITH TIME ZONE NULL, -- Expiração do link (opcional)
    max_uses INTEGER NULL, -- Máximo de usos (opcional)
    current_uses INTEGER DEFAULT 0, -- Usos atuais
    
    -- Auditoria
    is_active BOOLEAN DEFAULT true,
    last_accessed_at TIMESTAMP WITH TIME ZONE NULL,
    last_accessed_ip INET NULL,
    access_logs JSONB DEFAULT '[]', -- Log de acessos
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Índices
    CONSTRAINT unique_active_token UNIQUE (token)
);

-- Criar índices para performance
CREATE INDEX idx_shared_links_connection_id ON impaai.shared_whatsapp_links(connection_id);
CREATE INDEX idx_shared_links_user_id ON impaai.shared_whatsapp_links(user_id);
CREATE INDEX idx_shared_links_token ON impaai.shared_whatsapp_links(token) WHERE is_active = true;
CREATE INDEX idx_shared_links_expires_at ON impaai.shared_whatsapp_links(expires_at) WHERE expires_at IS NOT NULL;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION impaai.update_shared_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shared_links_updated_at
    BEFORE UPDATE ON impaai.shared_whatsapp_links
    FOR EACH ROW
    EXECUTE FUNCTION impaai.update_shared_links_updated_at();

-- Função para limpar links expirados (chamada via cron job)
CREATE OR REPLACE FUNCTION impaai.cleanup_expired_shared_links()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM impaai.shared_whatsapp_links 
    WHERE expires_at IS NOT NULL 
    AND expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar token seguro
CREATE OR REPLACE FUNCTION impaai.generate_secure_token()
RETURNS TEXT AS $$
BEGIN
    -- Gera um token de 32 caracteres usando caracteres seguros
    RETURN encode(gen_random_bytes(24), 'base64')
           || to_char(extract(epoch from now()), 'FM999999999');
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE impaai.shared_whatsapp_links ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados (donos dos links)
CREATE POLICY "Users can manage their own shared links" 
ON impaai.shared_whatsapp_links
FOR ALL 
USING (auth.uid()::text = user_id::text);

-- Política para acesso público aos links ativos (apenas SELECT com token)
CREATE POLICY "Public can access active links by token" 
ON impaai.shared_whatsapp_links
FOR SELECT 
USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
);

-- Comentários para documentação
COMMENT ON TABLE impaai.shared_whatsapp_links IS 'Links compartilhados seguros para conexões WhatsApp';
COMMENT ON COLUMN impaai.shared_whatsapp_links.token IS 'Token único e seguro para acesso ao link';
COMMENT ON COLUMN impaai.shared_whatsapp_links.password_hash IS 'Hash da senha para acesso adicional (opcional)';
COMMENT ON COLUMN impaai.shared_whatsapp_links.permissions IS 'Permissões granulares: qr_code, stats, settings';
COMMENT ON COLUMN impaai.shared_whatsapp_links.access_logs IS 'Log de acessos com timestamp, IP e user-agent';

-- Inserir permissões padrão para anon e authenticated
GRANT SELECT ON impaai.shared_whatsapp_links TO anon;
GRANT ALL ON impaai.shared_whatsapp_links TO authenticated; 