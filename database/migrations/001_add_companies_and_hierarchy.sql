-- ================================================
-- MIGRAÇÃO: Sistema Hierárquico Multi-Tenant
-- Adiciona suporte para Super Admin, Empresas e Limites de Recursos
-- ================================================

-- 1. Criar tabela de empresas (companies)
CREATE TABLE IF NOT EXISTS impaai.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    
    -- Informações da empresa
    document VARCHAR(50), -- CNPJ/CPF
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Brasil',
    zip_code VARCHAR(20),
    
    -- Limites de recursos definidos pelo Super Admin
    max_users INTEGER DEFAULT 5,
    max_agents INTEGER DEFAULT 10,
    max_connections INTEGER DEFAULT 10,
    max_integrations INTEGER DEFAULT 5,
    max_monthly_messages INTEGER DEFAULT 10000,
    
    -- Recursos customizados (JSON)
    resource_limits JSONB DEFAULT '{}'::jsonb,
    
    -- Status e configurações
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, trial, inactive
    subscription_plan VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise, custom
    subscription_expires_at TIMESTAMPTZ,
    
    -- Logo e branding
    logo_url TEXT,
    primary_color VARCHAR(20) DEFAULT '#3B82F6',
    secondary_color VARCHAR(20) DEFAULT '#10B981',
    
    -- Configurações gerais
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT companies_name_check CHECK (char_length(name) >= 3)
);

-- Índices para a tabela companies
CREATE INDEX IF NOT EXISTS idx_companies_status ON impaai.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_email ON impaai.companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON impaai.companies(created_at);

-- 2. Adicionar campo company_id à tabela user_profiles
ALTER TABLE impaai.user_profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES impaai.companies(id) ON DELETE SET NULL;

-- Criar índice para company_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON impaai.user_profiles(company_id);

-- 3. Atualizar roles para incluir super_admin
-- O campo role já existe, apenas vamos garantir que aceita 'super_admin'
COMMENT ON COLUMN impaai.user_profiles.role IS 'Roles: super_admin, admin, user';

-- 4. Adicionar campos de controle de recursos aos usuários
ALTER TABLE impaai.user_profiles 
ADD COLUMN IF NOT EXISTS can_create_users BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_company BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT '{}'::jsonb;

-- 5. Adicionar company_id às tabelas principais para multi-tenancy
ALTER TABLE impaai.ai_agents 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES impaai.companies(id) ON DELETE CASCADE;

ALTER TABLE impaai.whatsapp_connections 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES impaai.companies(id) ON DELETE CASCADE;

ALTER TABLE impaai.integrations 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES impaai.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES impaai.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE impaai.llm_api_keys 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES impaai.companies(id) ON DELETE CASCADE;

-- Criar índices para as foreign keys de company_id
CREATE INDEX IF NOT EXISTS idx_ai_agents_company_id ON impaai.ai_agents(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_company_id ON impaai.whatsapp_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_integrations_company_id ON impaai.integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON impaai.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_api_keys_company_id ON impaai.llm_api_keys(company_id);

-- 6. Criar tabela de uso de recursos (para tracking)
CREATE TABLE IF NOT EXISTS impaai.company_resource_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES impaai.companies(id) ON DELETE CASCADE,
    
    -- Contadores de uso
    total_users INTEGER DEFAULT 0,
    total_agents INTEGER DEFAULT 0,
    total_connections INTEGER DEFAULT 0,
    total_integrations INTEGER DEFAULT 0,
    monthly_messages INTEGER DEFAULT 0,
    
    -- Período de referência
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Metadata adicional
    details JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_company_resource_usage_company_id ON impaai.company_resource_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_company_resource_usage_period ON impaai.company_resource_usage(period_start, period_end);

-- 7. Criar tabela de logs de atividades da empresa
CREATE TABLE IF NOT EXISTS impaai.company_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES impaai.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES impaai.user_profiles(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL, -- create_user, delete_agent, update_limits, etc.
    resource_type VARCHAR(50), -- user, agent, connection, integration
    resource_id UUID,
    
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_activity_logs_company_id ON impaai.company_activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_company_activity_logs_user_id ON impaai.company_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_company_activity_logs_created_at ON impaai.company_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_company_activity_logs_action ON impaai.company_activity_logs(action);

-- 8. Criar função para verificar limites de recursos
CREATE OR REPLACE FUNCTION impaai.check_company_resource_limit(
    p_company_id UUID,
    p_resource_type VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_count INTEGER;
    v_max_limit INTEGER;
BEGIN
    -- Buscar o limite para o tipo de recurso
    CASE p_resource_type
        WHEN 'users' THEN
            SELECT COUNT(*), c.max_users INTO v_current_count, v_max_limit
            FROM impaai.user_profiles up
            JOIN impaai.companies c ON up.company_id = c.id
            WHERE up.company_id = p_company_id AND c.id = p_company_id
            GROUP BY c.max_users;
            
        WHEN 'agents' THEN
            SELECT COUNT(*), c.max_agents INTO v_current_count, v_max_limit
            FROM impaai.ai_agents ag
            JOIN impaai.companies c ON ag.company_id = c.id
            WHERE ag.company_id = p_company_id AND c.id = p_company_id
            GROUP BY c.max_agents;
            
        WHEN 'connections' THEN
            SELECT COUNT(*), c.max_connections INTO v_current_count, v_max_limit
            FROM impaai.whatsapp_connections wc
            JOIN impaai.companies c ON wc.company_id = c.id
            WHERE wc.company_id = p_company_id AND c.id = p_company_id
            GROUP BY c.max_connections;
            
        WHEN 'integrations' THEN
            SELECT COUNT(*), c.max_integrations INTO v_current_count, v_max_limit
            FROM impaai.integrations i
            JOIN impaai.companies c ON i.company_id = c.id
            WHERE i.company_id = p_company_id AND c.id = p_company_id
            GROUP BY c.max_integrations;
            
        ELSE
            RETURN TRUE; -- Se não encontrar o tipo, permite
    END CASE;
    
    -- Se não encontrou dados, permite (primeira criação)
    IF v_current_count IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Verifica se está dentro do limite
    RETURN v_current_count < v_max_limit;
END;
$$;

-- 9. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION impaai.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON impaai.companies
    FOR EACH ROW
    EXECUTE FUNCTION impaai.update_updated_at_column();

CREATE TRIGGER update_company_resource_usage_updated_at
    BEFORE UPDATE ON impaai.company_resource_usage
    FOR EACH ROW
    EXECUTE FUNCTION impaai.update_updated_at_column();

-- 10. Criar função para atualizar contadores de uso
CREATE OR REPLACE FUNCTION impaai.update_company_resource_usage(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_period_start DATE := DATE_TRUNC('month', CURRENT_DATE);
    v_period_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
    INSERT INTO impaai.company_resource_usage (
        company_id,
        total_users,
        total_agents,
        total_connections,
        total_integrations,
        monthly_messages,
        period_start,
        period_end
    )
    SELECT 
        p_company_id,
        (SELECT COUNT(*) FROM impaai.user_profiles WHERE company_id = p_company_id),
        (SELECT COUNT(*) FROM impaai.ai_agents WHERE company_id = p_company_id),
        (SELECT COUNT(*) FROM impaai.whatsapp_connections WHERE company_id = p_company_id),
        (SELECT COUNT(*) FROM impaai.integrations WHERE company_id = p_company_id),
        0, -- monthly_messages será calculado posteriormente
        v_period_start,
        v_period_end
    ON CONFLICT (company_id, period_start) 
    DO UPDATE SET
        total_users = EXCLUDED.total_users,
        total_agents = EXCLUDED.total_agents,
        total_connections = EXCLUDED.total_connections,
        total_integrations = EXCLUDED.total_integrations,
        updated_at = NOW();
END;
$$;

-- 11. Criar view para estatísticas da empresa
CREATE OR REPLACE VIEW impaai.company_stats AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.status,
    c.subscription_plan,
    
    -- Contadores atuais
    (SELECT COUNT(*) FROM impaai.user_profiles WHERE company_id = c.id) as current_users,
    (SELECT COUNT(*) FROM impaai.ai_agents WHERE company_id = c.id) as current_agents,
    (SELECT COUNT(*) FROM impaai.whatsapp_connections WHERE company_id = c.id) as current_connections,
    (SELECT COUNT(*) FROM impaai.integrations WHERE company_id = c.id) as current_integrations,
    
    -- Limites
    c.max_users,
    c.max_agents,
    c.max_connections,
    c.max_integrations,
    c.max_monthly_messages,
    
    -- Percentuais de uso
    ROUND((SELECT COUNT(*) FROM impaai.user_profiles WHERE company_id = c.id)::NUMERIC / 
          NULLIF(c.max_users, 0) * 100, 2) as users_usage_percent,
    ROUND((SELECT COUNT(*) FROM impaai.ai_agents WHERE company_id = c.id)::NUMERIC / 
          NULLIF(c.max_agents, 0) * 100, 2) as agents_usage_percent,
    ROUND((SELECT COUNT(*) FROM impaai.whatsapp_connections WHERE company_id = c.id)::NUMERIC / 
          NULLIF(c.max_connections, 0) * 100, 2) as connections_usage_percent,
    ROUND((SELECT COUNT(*) FROM impaai.integrations WHERE company_id = c.id)::NUMERIC / 
          NULLIF(c.max_integrations, 0) * 100, 2) as integrations_usage_percent,
    
    c.created_at,
    c.updated_at
FROM impaai.companies c;

-- 12. Inserir empresa padrão e migrar dados existentes
DO $$
DECLARE
    v_default_company_id UUID;
BEGIN
    -- Criar empresa padrão para migração de dados existentes
    INSERT INTO impaai.companies (
        name,
        email,
        status,
        subscription_plan,
        max_users,
        max_agents,
        max_connections,
        max_integrations,
        max_monthly_messages
    ) VALUES (
        'IMPA AI - Empresa Padrão',
        'admin@impaai.com',
        'active',
        'enterprise',
        9999,
        9999,
        9999,
        9999,
        999999
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_default_company_id;
    
    -- Se já existia, buscar o ID
    IF v_default_company_id IS NULL THEN
        SELECT id INTO v_default_company_id 
        FROM impaai.companies 
        WHERE email = 'admin@impaai.com' 
        LIMIT 1;
    END IF;
    
    -- Atualizar usuários existentes para a empresa padrão
    UPDATE impaai.user_profiles 
    SET company_id = v_default_company_id 
    WHERE company_id IS NULL;
    
    -- Atualizar agentes existentes
    UPDATE impaai.ai_agents 
    SET company_id = v_default_company_id 
    WHERE company_id IS NULL;
    
    -- Atualizar conexões existentes
    UPDATE impaai.whatsapp_connections 
    SET company_id = v_default_company_id 
    WHERE company_id IS NULL;
    
    -- Atualizar integrações existentes (relacionar com usuário também)
    UPDATE impaai.integrations i
    SET company_id = v_default_company_id
    WHERE company_id IS NULL;
    
    -- Atualizar llm_api_keys existentes
    UPDATE impaai.llm_api_keys 
    SET company_id = v_default_company_id 
    WHERE company_id IS NULL;
    
    -- Criar primeiro super admin se não existir
    UPDATE impaai.user_profiles
    SET role = 'super_admin',
        can_create_users = true,
        can_manage_company = true
    WHERE email = 'admin@impaai.com' OR id = (
        SELECT id FROM impaai.user_profiles 
        WHERE role = 'admin' 
        ORDER BY created_at ASC 
        LIMIT 1
    );
END $$;

-- 13. Comentários para documentação
COMMENT ON TABLE impaai.companies IS 'Tabela de empresas para sistema multi-tenant';
COMMENT ON TABLE impaai.company_resource_usage IS 'Tracking de uso de recursos por empresa';
COMMENT ON TABLE impaai.company_activity_logs IS 'Logs de atividades da empresa';
COMMENT ON FUNCTION impaai.check_company_resource_limit IS 'Verifica se a empresa está dentro dos limites de recursos';
COMMENT ON FUNCTION impaai.update_company_resource_usage IS 'Atualiza contadores de uso de recursos da empresa';
COMMENT ON VIEW impaai.company_stats IS 'View com estatísticas e uso de recursos por empresa';
