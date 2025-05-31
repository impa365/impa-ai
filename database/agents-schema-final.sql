-- Remover tabelas antigas se existirem para um setup limpo (cuidado em produção!)
-- DROP TABLE IF EXISTS global_agent_settings CASCADE;
-- DROP TABLE IF EXISTS user_agent_settings CASCADE;
-- DROP TABLE IF EXISTS ai_agents CASCADE;

-- Tabela para configurações globais de agentes e integrações
CREATE TABLE IF NOT EXISTS global_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações de limites e permissões de agentes por usuário
CREATE TABLE IF NOT EXISTS user_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  max_agents INTEGER DEFAULT 3,
  
  allow_transcribe_audio BOOLEAN DEFAULT true,
  allow_understand_images BOOLEAN DEFAULT true,
  allow_voice_response BOOLEAN DEFAULT true,
  allow_calendar_integration BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela principal para configurações de agentes IA
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE, -- Proprietário do agente
  organization_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL, -- Organização à qual o agente pertence (pode ser o user_id se não houver orgs separadas)
  whatsapp_connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  
  evolution_bot_id VARCHAR(255), -- ID do bot retornado pela Evolution API
  evolution_instance_name VARCHAR(255) NOT NULL, -- Nome da instância Evolution onde o bot foi criado

  name VARCHAR(255) NOT NULL,
  description TEXT, 
  prompt TEXT
