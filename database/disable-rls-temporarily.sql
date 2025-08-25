-- DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
-- Execute no Supabase SQL Editor

-- Desabilitar RLS temporariamente
ALTER TABLE impaai.shared_whatsapp_links DISABLE ROW LEVEL SECURITY;

-- Garantir permissões totais
GRANT ALL ON impaai.shared_whatsapp_links TO authenticated;
GRANT ALL ON impaai.shared_whatsapp_links TO anon;

-- Verificar se a tabela existe e tem dados
SELECT COUNT(*) as total_rows FROM impaai.shared_whatsapp_links; 