-- Adicionar colunas de limites na tabela user_profiles se não existirem
DO $$ 
BEGIN
    -- Verificar e adicionar coluna agents_limit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'agents_limit'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN agents_limit INTEGER DEFAULT 2;
        COMMENT ON COLUMN public.user_profiles.agents_limit IS 'Limite de agentes IA que o usuário pode criar';
    END IF;

    -- Verificar e adicionar coluna connections_limit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'connections_limit'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN connections_limit INTEGER DEFAULT 1;
        COMMENT ON COLUMN public.user_profiles.connections_limit IS 'Limite de conexões WhatsApp que o usuário pode ter';
    END IF;

    -- Atualizar usuários existentes que não têm limites definidos
    UPDATE public.user_profiles 
    SET 
        agents_limit = COALESCE(agents_limit, 2),
        connections_limit = COALESCE(connections_limit, 1)
    WHERE agents_limit IS NULL OR connections_limit IS NULL;

    RAISE NOTICE 'Colunas de limites adicionadas/atualizadas com sucesso na tabela user_profiles';
END $$;

-- Verificar se as colunas foram criadas corretamente
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles' 
AND column_name IN ('agents_limit', 'connections_limit')
ORDER BY column_name;
