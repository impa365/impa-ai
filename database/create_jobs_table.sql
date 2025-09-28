-- =====================================================
-- SCRIPT PARA CRIAR TABELA DE JOBS ASSÍNCRONOS
-- Data: 28/09/2025
-- Descrição: Tabela para gerenciar jobs de processamento em background
-- =====================================================

-- Criar tabela de jobs
CREATE TABLE IF NOT EXISTS impaai.background_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'mass_session_update', 'mass_session_delete', etc
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    user_id UUID REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES impaai.ai_agents(id) ON DELETE CASCADE,
    
    -- Dados do job
    job_data JSONB NOT NULL, -- Parâmetros específicos do job
    
    -- Resultados e progresso
    progress INTEGER DEFAULT 0, -- Porcentagem de progresso (0-100)
    total_items INTEGER DEFAULT 0, -- Total de itens a processar
    processed_items INTEGER DEFAULT 0, -- Itens já processados
    successful_items INTEGER DEFAULT 0, -- Itens processados com sucesso
    failed_items INTEGER DEFAULT 0, -- Itens que falharam
    
    -- Resultados detalhados
    results JSONB DEFAULT '{}', -- Resultados detalhados
    error_message TEXT, -- Mensagem de erro se falhou
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_background_jobs_user_id ON impaai.background_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_background_jobs_agent_id ON impaai.background_jobs(agent_id);
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON impaai.background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_type ON impaai.background_jobs(type);
CREATE INDEX IF NOT EXISTS idx_background_jobs_created_at ON impaai.background_jobs(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION impaai.update_background_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_background_jobs_updated_at ON impaai.background_jobs;
CREATE TRIGGER update_background_jobs_updated_at
    BEFORE UPDATE ON impaai.background_jobs
    FOR EACH ROW
    EXECUTE FUNCTION impaai.update_background_jobs_updated_at();

-- Comentários
COMMENT ON TABLE impaai.background_jobs IS 'Tabela para gerenciar jobs de processamento assíncrono em background';
COMMENT ON COLUMN impaai.background_jobs.type IS 'Tipo do job: mass_session_update, mass_session_delete, etc';
COMMENT ON COLUMN impaai.background_jobs.status IS 'Status do job: pending, running, completed, failed, cancelled';
COMMENT ON COLUMN impaai.background_jobs.job_data IS 'Dados específicos do job (sessionIds, status, etc)';
COMMENT ON COLUMN impaai.background_jobs.results IS 'Resultados detalhados do processamento';
COMMENT ON COLUMN impaai.background_jobs.progress IS 'Progresso em porcentagem (0-100)'; 