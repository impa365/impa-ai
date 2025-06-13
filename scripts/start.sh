#!/bin/bash

echo "🚀 Iniciando validação do ambiente..."

# Verificar variáveis de ambiente obrigatórias
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ "$NEXT_PUBLIC_SUPABASE_URL" = "https://placeholder.supabase.co" ]; then
    echo "❌ ERRO: NEXT_PUBLIC_SUPABASE_URL não está configurada ou está usando placeholder"
    echo "Valor atual: $NEXT_PUBLIC_SUPABASE_URL"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" = "placeholder-anon-key" ]; then
    echo "❌ ERRO: NEXT_PUBLIC_SUPABASE_ANON_KEY não está configurada ou está usando placeholder"
    exit 1
fi

echo "✅ Variáveis de ambiente validadas"
echo "📍 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Testar conexão com Supabase usando curl
echo "🔍 Testando conexão com Supabase..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Accept-Profile: impaai" \
    -H "Content-Profile: impaai" \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/")

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 404 ]; then
    echo "✅ Conexão com Supabase estabelecida (HTTP $HTTP_STATUS)"
else
    echo "❌ ERRO: Falha na conexão com Supabase (HTTP $HTTP_STATUS)"
    exit 1
fi

echo "🎉 Validação concluída com sucesso!"
echo "🚀 Iniciando aplicação Next.js..."

# Iniciar a aplicação
exec node server.js
