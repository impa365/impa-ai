-- ============================================
-- MIGRAÇÃO: Sistema de Bots para Uazapi
-- Data: 2025-10-19
-- Descrição: Adiciona tabelas para simular EvolutionBot em APIs que não têm bot nativo (Uazapi)
-- ============================================

-- ============================================
-- 1. CRIAR TIPOS ENUM
-- ============================================

-- Tipo de gatilho do bot
CREATE TYPE impaai.tipo_gatilho_enum AS ENUM (
  'Palavra-chave',
  'Todos',
  'Avançado',
  'Nenhum'
);

-- Operadores de comparação para gatilhos
CREATE TYPE impaai.operador_gatilho_enum AS ENUM (
  'Contém',
  'Igual',
  'Começa Com',
  'Termina Com',
  'Regex'
);

-- ============================================
-- 2. CRIAR TABELA: impaai.bots
-- ============================================
CREATE TABLE impaai.bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  url_api TEXT NOT NULL,                    -- Webhook n8n - IA Direta + agentId
  apikey TEXT,                              -- Opcional: API Key de autenticação
  gatilho impaai.tipo_gatilho_enum DEFAULT 'Palavra-chave'::impaai.tipo_gatilho_enum,
  operador_gatilho impaai.operador_gatilho_enum DEFAULT 'Contém'::impaai.operador_gatilho_enum,
  value_gatilho TEXT,                       -- Valor para comparar (ex: "oi|olá|bom dia")
  debounce NUMERIC DEFAULT 5,               -- Segundos de espera antes de processar
  "splitMessage" NUMERIC DEFAULT 2,         -- Quebras de linha para dividir mensagem
  "ignoreJids" TEXT DEFAULT '@g.us,',       -- JIDs ignorados (padrão: grupos)
  webhook_id TEXT,                          -- ID do webhook na Uazapi (wh_XXX)
  user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES impaai.whatsapp_connections(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_bots_user_id ON impaai.bots(user_id);
CREATE INDEX idx_bots_connection_id ON impaai.bots(connection_id);
CREATE INDEX idx_bots_webhook_id ON impaai.bots(webhook_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_bots_updated_at 
  BEFORE UPDATE ON impaai.bots 
  FOR EACH ROW 
  EXECUTE FUNCTION impaai.update_updated_at_column();

-- ============================================
-- 3. CRIAR TABELA: impaai.bot_sessions
-- ============================================
CREATE TABLE impaai.bot_sessions (
  "sessionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "remoteJid" TEXT NOT NULL,                -- Chat/usuário (ex: 557331912851@s.whatsapp.net)
  status BOOLEAN DEFAULT true,              -- Bot ativo/inativo para este chat
  ultimo_status TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bot_id UUID NOT NULL REFERENCES impaai.bots(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES impaai.whatsapp_connections(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_bot_sessions_remoteJid ON impaai.bot_sessions("remoteJid");
CREATE INDEX idx_bot_sessions_bot_id ON impaai.bot_sessions(bot_id);
CREATE INDEX idx_bot_sessions_connection_id ON impaai.bot_sessions(connection_id);
CREATE INDEX idx_bot_sessions_status ON impaai.bot_sessions(status);

-- Trigger para atualizar ultimo_status
CREATE OR REPLACE FUNCTION update_ultimo_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultimo_status = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bot_sessions_ultimo_status 
  BEFORE UPDATE ON impaai.bot_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_ultimo_status();

-- ============================================
-- 4. ADICIONAR CAMPO bot_id NA TABELA ai_agents
-- ============================================
ALTER TABLE impaai.ai_agents
ADD COLUMN bot_id UUID REFERENCES impaai.bots(id) ON DELETE SET NULL;

-- Índice para melhor performance
CREATE INDEX idx_ai_agents_bot_id ON impaai.ai_agents(bot_id);

-- ============================================
-- 5. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================
COMMENT ON TABLE impaai.bots IS 'Tabela de bots customizados para APIs sem EvolutionBot nativo (ex: Uazapi)';
COMMENT ON COLUMN impaai.bots.url_api IS 'URL do webhook n8n - IA Direta + agentId';
COMMENT ON COLUMN impaai.bots.gatilho IS 'Tipo de gatilho: Palavra-chave, Todos, Avançado, Nenhum';
COMMENT ON COLUMN impaai.bots.operador_gatilho IS 'Operador de comparação: Contém, Igual, Começa Com, Termina Com, Regex';
COMMENT ON COLUMN impaai.bots.value_gatilho IS 'Valor para comparar (ex: "oi|olá|bom dia")';
COMMENT ON COLUMN impaai.bots.debounce IS 'Segundos de espera antes de processar a mensagem';
COMMENT ON COLUMN impaai.bots."splitMessage" IS 'Número de quebras de linha (\\n) para dividir mensagem em múltiplas';
COMMENT ON COLUMN impaai.bots."ignoreJids" IS 'Lista de JIDs ignorados separados por vírgula (padrão: @g.us,)';
COMMENT ON COLUMN impaai.bots.webhook_id IS 'ID do webhook configurado na API externa (ex: wh_XXX da Uazapi)';

COMMENT ON TABLE impaai.bot_sessions IS 'Sessões ativas de bots por chat/usuário';
COMMENT ON COLUMN impaai.bot_sessions."remoteJid" IS 'Identificador do chat no WhatsApp (ex: 5511999999999@s.whatsapp.net)';
COMMENT ON COLUMN impaai.bot_sessions.status IS 'Indica se o bot está ativo para este chat específico';

COMMENT ON COLUMN impaai.ai_agents.bot_id IS 'Referência ao bot customizado (apenas para APIs sem EvolutionBot nativo)';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================

