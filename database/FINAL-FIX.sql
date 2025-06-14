-- ===================================
-- CONFIGURAÇÃO FINAL COMPLETA
-- ===================================

-- 1. PERMISSÕES PARA ANON
GRANT USAGE ON SCHEMA impaai TO anon;
GRANT SELECT ON impaai.system_settings TO anon;
GRANT SELECT ON impaai.system_themes TO anon;

-- 2. POLÍTICAS RLS SEGURAS
CREATE POLICY "Allow anon read public settings" ON impaai.system_settings FOR SELECT TO anon USING (is_public = true);
CREATE POLICY "Allow anon read active themes" ON impaai.system_themes FOR SELECT TO anon USING (is_active = true);

-- 3. VERIFICAR SE COLUNAS ESTÃO CORRETAS
SELECT 'Estrutura system_settings:' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'impaai' AND table_name = 'system_settings'
ORDER BY ordinal_position;

-- 4. VERIFICAR DADOS
SELECT 'Configurações disponíveis:' as info, key, value, is_public, is_active
FROM impaai.system_settings 
WHERE is_public = true AND is_active = true;

-- 5. VERIFICAR TEMAS
SELECT 'Temas disponíveis:' as info, name, display_name, is_active
FROM impaai.system_themes 
WHERE is_active = true;

-- 6. TESTE FINAL
SELECT '✅ CONFIGURAÇÃO COMPLETA!' as status;
