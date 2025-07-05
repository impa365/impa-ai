-- Criar enum para tipo de mídia se não existir
DO $$ BEGIN
    CREATE TYPE tipo_midia AS ENUM ('text', 'image', 'video', 'audio', 'document');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela para configuração de follow-up por empresa/instância
CREATE TABLE IF NOT EXISTS impaai.followup_24hs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, instance_name)
);

-- Tabela para mensagens do follow-up
CREATE TABLE IF NOT EXISTS impaai.followup_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    followup_config_id UUID NOT NULL REFERENCES impaai.followup_24hs(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
    message_text TEXT,
    media_url TEXT,
    media_type tipo_midia DEFAULT 'text',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints para validar conteúdo baseado no tipo
    CONSTRAINT chk_text_message CHECK (
        (media_type = 'text' AND message_text IS NOT NULL AND media_url IS NULL) OR
        (media_type != 'text' AND media_url IS NOT NULL)
    ),
    CONSTRAINT chk_audio_message CHECK (
        (media_type = 'audio' AND message_text IS NULL) OR
        (media_type != 'audio')
    ),
    
    UNIQUE(followup_config_id, day_number)
);

-- Tabela para leads no follow-up
CREATE TABLE IF NOT EXISTS impaai.lead_follow24hs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) NOT NULL,
    remote_jid VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    current_day INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    last_message_sent_day INTEGER DEFAULT 0,
    last_message_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, instance_name, remote_jid)
);

-- Tabela para histórico de mensagens enviadas
CREATE TABLE IF NOT EXISTS impaai.followup_message_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES impaai.lead_follow24hs(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    message_text TEXT,
    media_url TEXT,
    media_type tipo_midia DEFAULT 'text',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'sent',
    
    UNIQUE(lead_id, day_number)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_follow24hs_user_instance ON impaai.lead_follow24hs(user_id, instance_name);
CREATE INDEX IF NOT EXISTS idx_lead_follow24hs_active ON impaai.lead_follow24hs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_lead_follow24hs_start_date ON impaai.lead_follow24hs(start_date);
CREATE INDEX IF NOT EXISTS idx_followup_messages_config_day ON impaai.followup_messages(followup_config_id, day_number);
CREATE INDEX IF NOT EXISTS idx_followup_message_history_lead ON impaai.followup_message_history(lead_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_followup_24hs_updated_at BEFORE UPDATE ON impaai.followup_24hs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_followup_messages_updated_at BEFORE UPDATE ON impaai.followup_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_follow24hs_updated_at BEFORE UPDATE ON impaai.lead_follow24hs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS
ALTER TABLE impaai.followup_24hs ENABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.followup_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.lead_follow24hs ENABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.followup_message_history ENABLE ROW LEVEL SECURITY;

-- Políticas para followup_24hs
CREATE POLICY "Users can manage their own followup configs" ON impaai.followup_24hs
    FOR ALL USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM impaai.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- Políticas para followup_messages
CREATE POLICY "Users can manage their own followup messages" ON impaai.followup_messages
    FOR ALL USING (EXISTS (
        SELECT 1 FROM impaai.followup_24hs 
        WHERE id = followup_config_id 
        AND (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM impaai.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    ));

-- Políticas para lead_follow24hs
CREATE POLICY "Users can manage their own leads" ON impaai.lead_follow24hs
    FOR ALL USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM impaai.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- Políticas para followup_message_history
CREATE POLICY "Users can view their own message history" ON impaai.followup_message_history
    FOR ALL USING (EXISTS (
        SELECT 1 FROM impaai.lead_follow24hs 
        WHERE id = lead_id 
        AND (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM impaai.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    ));
