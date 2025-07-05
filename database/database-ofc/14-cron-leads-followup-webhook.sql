-- =============================================
-- 14. SQL para Supabase Cron: Envio de Leads FollowUp Agrupados por Conexão e Bot Padrão
-- =============================================
-- Este SQL pode ser usado diretamente no Supabase Cron para enviar, diariamente, os leads agrupados por conexão e bot padrão,
-- incluindo a mensagem do dia e a URL da Evolution API ativa, para o webhook especificado.
--
-- ATENÇÃO: Substitua 'https://seu-webhook-aqui.com/endpoint' pela URL real do seu webhook!

SELECT
  net.http_post(
    url := 'https://seu-webhook-aqui.com/endpoint', -- <<<<< SUBSTITUA AQUI PELO SEU ENDPOINT REAL
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object(
      'whatsapp_connection', to_jsonb(w),
      'bot_padrao', to_jsonb(a),
      'evolution_api_url', evo.config->>'apiUrl',
      'leads', jsonb_agg(
        jsonb_build_object(
          'lead', to_jsonb(l),
          'mensagem_do_dia', to_jsonb(m)
        )
      )
    ),
    timeout_milliseconds := 5000
  )
FROM impaai.lead_folow24hs l
JOIN impaai.whatsapp_connections w ON l."whatsappConection" = w.id
LEFT JOIN impaai.ai_agents a ON a.whatsapp_connection_id = w.id AND a.is_default = true
LEFT JOIN impaai."folowUp24hs_mensagem" m
  ON m.whatsapp_conenections_id = w.id
  AND m.tentativa_dia = l.dia
LEFT JOIN impaai.integrations evo
  ON evo.type = 'evolution_api' AND evo.is_active = true
GROUP BY w.id, a.id, evo.config; 