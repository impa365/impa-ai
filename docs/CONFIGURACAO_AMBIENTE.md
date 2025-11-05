# ⚙️ Configuração de Variáveis de Ambiente

## 📋 Variáveis Obrigatórias

Para que o sistema de **API Keys LLM** funcione corretamente, você DEVE configurar as seguintes variáveis de ambiente:

### 🗄️ Supabase

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Onde encontrar:**
1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings → API**
3. Copie os valores:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **ATENÇÃO:** A chave `SUPABASE_SERVICE_ROLE_KEY` é secreta e deve ser mantida em segurança!

### 🔐 JWT Secret

```env
JWT_SECRET=seu-segredo-super-secreto-e-aleatorio-aqui
```

**Como gerar:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📝 Passo a Passo

### 1. Criar arquivo `.env.local`

```bash
# Na raiz do projeto
cp .env.example .env.local
```

### 2. Preencher variáveis obrigatórias

Edite o arquivo `.env.local` e preencha:

```env
SUPABASE_URL=https://xyzabcdef123456789.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2RlZjEyMzQ1Njc4OSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg0MzQyMDAwLCJleHAiOjE5OTk5MTgwMDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2RlZjEyMzQ1Njc4OSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2ODQzNDIwMDAsImV4cCI6MTk5OTkxODAwMH0.yyyyyyyyyyyyyyyyyyyyyyyyyyyyy
JWT_SECRET=aGVsbG93b3JsZGhlbGxvd29ybGRoZWxsb3dvcmxk
```

### 3. Reiniciar o servidor

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

## 🔍 Verificar Configuração

### Teste rápido via console:

```javascript
console.log({
  SUPABASE_URL: process.env.SUPABASE_URL ? '✓ Configurado' : '✗ FALTANDO',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✓ Configurado' : '✗ FALTANDO',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Configurado' : '✗ FALTANDO',
  JWT_SECRET: process.env.JWT_SECRET ? '✓ Configurado' : '✗ FALTANDO',
})
```

## ❌ Erros Comuns

### Erro: "Variáveis de ambiente do Supabase não configuradas"

**Causa:** Arquivo `.env.local` não existe ou não tem as variáveis corretas

**Solução:**
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Confirme que as variáveis estão preenchidas (não vazias)
3. Reinicie o servidor de desenvolvimento

### Erro: "Could not find the 'llm_api_key' column"

**Causa:** Migration não foi executada no banco de dados

**Solução:**
```bash
# Execute a migration
psql $DATABASE_URL -f database/create_llm_api_keys_table.sql

# Force o reload do schema cache no Supabase
# Via SQL Editor no Supabase Dashboard:
NOTIFY pgrst, 'reload schema';
```

## 🌍 Ambiente de Produção

Para deploy em produção (Vercel, Railway, etc.):

1. **Acesse as configurações do projeto**
2. **Adicione as variáveis de ambiente:**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`

3. **Redeploy a aplicação**

### Exemplo Vercel:
```bash
# Via CLI
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
```

## 📚 Mais Informações

- [Documentação Supabase](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase PostgREST](https://postgrest.org/en/stable/)

## 🆘 Suporte

Se continuar com problemas:
1. Verifique os logs do console (`npm run dev`)
2. Confirme que todas as variáveis estão preenchidas corretamente
3. Tente criar um novo projeto Supabase do zero
4. Consulte a documentação oficial

---

**Última atualização:** 2025-11-04

