-- ============================================
-- MIGRAÇÃO: Adicionar campo padrao à tabela bots
-- Data: 2025-10-20
-- Descrição: Adiciona o campo padrao (boolean) para identificar o bot padrão da conexão
-- ============================================

-- Adicionar coluna padrao à tabela bots
ALTER TABLE impaai.bots
ADD COLUMN padrao BOOLEAN NOT NULL DEFAULT false;

-- Criar índice para melhor performance em consultas por bot padrão
CREATE INDEX idx_bots_padrao ON impaai.bots(padrao) WHERE padrao = true;

-- Adicionar comentário para documentação
COMMENT ON COLUMN impaai.bots.padrao IS 'Indica se este bot é o bot padrão/principal da conexão. Usado no n8n para determinar qual bot processar quando não há palavra-chave correspondente.';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================

