-- ================================================
-- Script 15: Configuração completa de provedores LLM e modelos padrão
-- Descrição: Configura provedores disponíveis e modelos padrão por provedor
-- ================================================

-- Verificar e configurar sistema LLM
DO $$
BEGIN
    -- Verificar se já existe a configuração de provedores LLM
    IF NOT EXISTS (
        SELECT 1 FROM impaai.system_settings 
        WHERE setting_key = 'available_llm_providers'
    ) THEN
        -- Inserir configuração de provedores LLM disponíveis
        INSERT INTO impaai.system_settings (
            setting_key,
            setting_value,
            category,
            description,
            is_public
        ) VALUES (
            'available_llm_providers',
            '["openai", "anthropic", "google", "ollama", "groq"]',
            'agents',
            'Provedores de LLM disponíveis para criação de agentes',
            FALSE
        );
        
        RAISE NOTICE 'Configuração de provedores LLM adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Configuração de provedores LLM já existe';
    END IF;
END
$$;

-- Atualizar o modelo padrão com JSON dos provedores
UPDATE impaai.system_settings 
SET setting_value = '{"groq": "llama3-8b-8192", "google": "gemini-1.6-flash", "ollama": "llama3.2:3b", "openai": "gpt-4o-mini", "anthropic": "claude-3-haiku-20240307"}'
WHERE setting_key = 'default_model';

-- Se não existir, criar
INSERT INTO impaai.system_settings (
    setting_key,
    setting_value,
    category,
    description,
    is_public
) 
SELECT 
    'default_model',
    '{"groq": "llama3-8b-8192", "google": "gemini-1.6-flash", "ollama": "llama3.2:3b", "openai": "gpt-4o-mini", "anthropic": "claude-3-haiku-20240307"}',
    'agents',
    'Modelo padrão por provedor',
    FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM impaai.system_settings WHERE setting_key = 'default_model'
);

-- Verificar resultado final
SELECT 
    setting_key,
    setting_value,
    category,
    description
FROM impaai.system_settings 
WHERE setting_key IN ('available_llm_providers', 'default_model')
ORDER BY setting_key; 