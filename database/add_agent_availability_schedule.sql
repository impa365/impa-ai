-- =====================================================
-- MIGRATION: Adicionar sistema de horários de disponibilidade para agentes
-- Descrição: Permite configurar quando um agente pode ser acessado via API
-- Data: 2025-11-17
-- =====================================================

BEGIN;

-- ============================================
-- 1. CRIAR ENUM PARA TIPO DE DISPONIBILIDADE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_mode_enum') THEN
        CREATE TYPE impaai.availability_mode_enum AS ENUM (
            'always',          -- Ativo 24h
            'schedule',        -- Horários específicos
            'disabled'         -- Desativado
        );
    END IF;
END $$;

COMMENT ON TYPE impaai.availability_mode_enum IS 'Modo de disponibilidade do agente';

-- ============================================
-- 2. ADICIONAR CAMPOS NA TABELA ai_agents
-- ============================================
ALTER TABLE impaai.ai_agents
ADD COLUMN IF NOT EXISTS availability_mode impaai.availability_mode_enum DEFAULT 'always';

COMMENT ON COLUMN impaai.ai_agents.availability_mode IS 'Modo de disponibilidade: always (24h), schedule (horários específicos), disabled (desativado)';

-- ============================================
-- 3. CRIAR TABELA DE HORÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS impaai.agent_availability_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES impaai.ai_agents(id) ON DELETE CASCADE,
    
    -- Dia da semana (0 = Domingo, 1 = Segunda, ... 6 = Sábado)
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    
    -- Horários (formato 24h: "09:00", "18:00")
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Fuso horário (ex: "America/Sao_Paulo", "UTC")
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: horário final deve ser maior que inicial
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

ALTER TABLE impaai.agent_availability_schedules OWNER TO supabase_admin;

-- ============================================
-- 4. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE impaai.agent_availability_schedules IS 'Horários de disponibilidade dos agentes por dia da semana';
COMMENT ON COLUMN impaai.agent_availability_schedules.day_of_week IS 'Dia da semana: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado';
COMMENT ON COLUMN impaai.agent_availability_schedules.start_time IS 'Horário de início (formato 24h)';
COMMENT ON COLUMN impaai.agent_availability_schedules.end_time IS 'Horário de término (formato 24h)';
COMMENT ON COLUMN impaai.agent_availability_schedules.timezone IS 'Fuso horário (ex: America/Sao_Paulo, UTC, America/New_York)';
COMMENT ON COLUMN impaai.agent_availability_schedules.is_active IS 'Se este horário está ativo';

-- ============================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_availability_agent_id 
    ON impaai.agent_availability_schedules(agent_id);

CREATE INDEX IF NOT EXISTS idx_availability_day_active 
    ON impaai.agent_availability_schedules(day_of_week, is_active) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_availability_agent_day 
    ON impaai.agent_availability_schedules(agent_id, day_of_week, is_active);

-- ============================================
-- 6. TRIGGER PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION impaai.update_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_availability_updated_at
    BEFORE UPDATE ON impaai.agent_availability_schedules
    FOR EACH ROW
    EXECUTE FUNCTION impaai.update_availability_updated_at();

-- ============================================
-- 7. PERMISSÕES (RLS)
-- ============================================
-- Habilitar RLS
ALTER TABLE impaai.agent_availability_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver horários de seus próprios agentes
CREATE POLICY "Users can view their own agent schedules"
    ON impaai.agent_availability_schedules
    FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM impaai.ai_agents WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuários podem criar horários para seus próprios agentes
CREATE POLICY "Users can create schedules for their own agents"
    ON impaai.agent_availability_schedules
    FOR INSERT
    WITH CHECK (
        agent_id IN (
            SELECT id FROM impaai.ai_agents WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuários podem atualizar horários de seus próprios agentes
CREATE POLICY "Users can update their own agent schedules"
    ON impaai.agent_availability_schedules
    FOR UPDATE
    USING (
        agent_id IN (
            SELECT id FROM impaai.ai_agents WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuários podem deletar horários de seus próprios agentes
CREATE POLICY "Users can delete their own agent schedules"
    ON impaai.agent_availability_schedules
    FOR DELETE
    USING (
        agent_id IN (
            SELECT id FROM impaai.ai_agents WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 8. PERMISSÕES PARA ROLES
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.agent_availability_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.agent_availability_schedules TO anon;
GRANT ALL ON impaai.agent_availability_schedules TO service_role;

-- ============================================
-- 9. FUNÇÃO HELPER: VERIFICAR SE AGENTE ESTÁ DISPONÍVEL
-- ============================================
CREATE OR REPLACE FUNCTION impaai.is_agent_available(
    p_agent_id UUID,
    p_check_time TIMESTAMPTZ DEFAULT now()
)
RETURNS BOOLEAN AS $$
DECLARE
    v_availability_mode TEXT;
    v_agent_timezone TEXT;
    v_local_time TIME;
    v_day_of_week INTEGER;
    v_is_available BOOLEAN;
BEGIN
    -- Buscar modo de disponibilidade do agente
    SELECT availability_mode 
    INTO v_availability_mode
    FROM impaai.ai_agents 
    WHERE id = p_agent_id;
    
    -- Se não encontrou o agente, retorna false
    IF v_availability_mode IS NULL THEN
        RETURN false;
    END IF;
    
    -- Se está sempre disponível, retorna true
    IF v_availability_mode = 'always' THEN
        RETURN true;
    END IF;
    
    -- Se está desativado, retorna false
    IF v_availability_mode = 'disabled' THEN
        RETURN false;
    END IF;
    
    -- Se é 'schedule', verificar horários
    IF v_availability_mode = 'schedule' THEN
        -- Buscar primeiro horário ativo para pegar o timezone
        SELECT timezone INTO v_agent_timezone
        FROM impaai.agent_availability_schedules
        WHERE agent_id = p_agent_id 
        AND is_active = true
        LIMIT 1;
        
        -- Se não tem timezone, usar America/Sao_Paulo por padrão
        v_agent_timezone := COALESCE(v_agent_timezone, 'America/Sao_Paulo');
        
        -- Converter hora de verificação para o timezone do agente
        v_local_time := (p_check_time AT TIME ZONE v_agent_timezone)::TIME;
        v_day_of_week := EXTRACT(DOW FROM p_check_time AT TIME ZONE v_agent_timezone)::INTEGER;
        
        -- Verificar se existe horário ativo para este dia e hora
        SELECT EXISTS (
            SELECT 1
            FROM impaai.agent_availability_schedules
            WHERE agent_id = p_agent_id
            AND day_of_week = v_day_of_week
            AND is_active = true
            AND v_local_time >= start_time
            AND v_local_time <= end_time
        ) INTO v_is_available;
        
        RETURN v_is_available;
    END IF;
    
    -- Caso padrão
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION impaai.is_agent_available IS 'Verifica se um agente está disponível no momento especificado baseado em seus horários configurados';

-- ============================================
-- 10. LOG DE EXECUÇÃO
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de horários de disponibilidade criado com sucesso!';
    RAISE NOTICE '📋 Tabela: agent_availability_schedules';
    RAISE NOTICE '📋 Enum: availability_mode_enum (always, schedule, disabled)';
    RAISE NOTICE '🔧 Função: is_agent_available(agent_id, check_time)';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK (caso necessário):
-- 
-- DROP TABLE IF EXISTS impaai.agent_availability_schedules CASCADE;
-- ALTER TABLE impaai.ai_agents DROP COLUMN IF EXISTS availability_mode;
-- DROP TYPE IF EXISTS impaai.availability_mode_enum CASCADE;
-- DROP FUNCTION IF EXISTS impaai.is_agent_available;
-- =====================================================
