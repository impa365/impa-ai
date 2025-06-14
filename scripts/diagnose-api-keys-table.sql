-- Diagnóstico completo da tabela user_api_keys
DO $$
BEGIN
    RAISE NOTICE '=== DIAGNÓSTICO DA TABELA USER_API_KEYS ===';
    
    -- Verificar se a tabela existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_api_keys') THEN
        RAISE NOTICE '✅ Tabela user_api_keys existe';
        
        -- Mostrar estrutura da tabela
        RAISE NOTICE '📋 Estrutura da tabela:';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: % (nullable: %, default: %)', 
                rec.column_name, rec.data_type, rec.is_nullable, COALESCE(rec.column_default, 'none');
        END LOOP;
        
        -- Verificar índices
        RAISE NOTICE '🔍 Índices da tabela:';
        FOR rec IN 
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'user_api_keys'
        LOOP
            RAISE NOTICE '  - %: %', rec.indexname, rec.indexdef;
        END LOOP;
        
        -- Contar registros
        EXECUTE 'SELECT COUNT(*) FROM user_api_keys' INTO rec;
        RAISE NOTICE '📊 Total de registros: %', rec;
        
        -- Verificar permissões RLS
        IF EXISTS (
            SELECT 1 FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE c.relname = 'user_api_keys' AND c.relrowsecurity = true
        ) THEN
            RAISE NOTICE '🔒 RLS está habilitado na tabela';
            
            -- Mostrar políticas RLS
            FOR rec IN 
                SELECT policyname, cmd, qual, with_check
                FROM pg_policies 
                WHERE tablename = 'user_api_keys'
            LOOP
                RAISE NOTICE '  - Política: % (comando: %)', rec.policyname, rec.cmd;
            END LOOP;
        ELSE
            RAISE NOTICE '🔓 RLS não está habilitado na tabela';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Tabela user_api_keys NÃO existe';
        
        -- Sugerir criação
        RAISE NOTICE '💡 Execute o script de criação da tabela primeiro';
    END IF;
    
    RAISE NOTICE '=== FIM DO DIAGNÓSTICO ===';
END $$;

-- Verificar se há problemas com as variáveis de ambiente
SELECT 
    'Environment Check' as info,
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version;
