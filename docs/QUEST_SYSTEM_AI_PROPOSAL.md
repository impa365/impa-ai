# 🤖 **PROPOSTA: TUTORIAL DINÂMICO COM IA**

## 📋 **SUMÁRIO**

Esta proposta detalha como transformar o atual sistema de quests estático em um **tutorial adaptativo e inteligente** usando:
- **OpenAI GPT-4** para gerar diálogos e missões dinâmicas
- **Supabase Vector (pgvector)** para armazenar embeddings e buscar contexto
- **Aprendizado contínuo** baseado no comportamento do usuário

---

## 🎯 **OBJETIVOS**

### **1. Tutorial Adaptativo**
- IA analisa o comportamento do usuário em tempo real
- Missões personalizadas baseadas no nível de experiência
- Dificuldade ajustada automaticamente

### **2. ARIA Inteligente**
- Diálogos gerados dinamicamente via GPT-4
- Respostas contextuais baseadas na situação atual
- Personalidade consistente (assistente espacial)

### **3. Aprendizado Contínuo**
- Sistema aprende com padrões de uso
- Identifica pontos de dificuldade comuns
- Melhora sugestões ao longo do tempo

---

## 🏗️ **ARQUITETURA PROPOSTA**

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│  (React/Next.js - Quest System)                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              API MIDDLEWARE                         │
│  /api/quest-ai/generate-mission                     │
│  /api/quest-ai/aria-response                        │
│  /api/quest-ai/analyze-behavior                     │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│   OpenAI     │    │    Supabase      │
│   GPT-4      │    │  + pgvector      │
│              │    │                  │
│ - Geração    │    │ - Embeddings     │
│ - Diálogos   │    │ - Busca RAG      │
│ - Análise    │    │ - Histórico      │
└──────────────┘    └──────────────────┘
```

---

## 📊 **ESTRUTURA DE DADOS**

### **1. Tabela: `quest_ai_context`**
Armazena contexto da plataforma para RAG (Retrieval Augmented Generation).

```sql
CREATE TABLE impaai.quest_ai_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL, -- 'feature', 'tutorial', 'error', 'tip'
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB, -- tags, categorias, versão
  embedding VECTOR(1536), -- OpenAI embedding (ada-002)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca vetorial
CREATE INDEX quest_ai_context_embedding_idx 
ON impaai.quest_ai_context 
USING ivfflat (embedding vector_cosine_ops);
```

**Exemplo de dados:**
```json
{
  "id": "uuid",
  "content_type": "feature",
  "title": "Criação de Agentes IA",
  "description": "Para criar um agente, acesse /dashboard/agents, clique em 'Novo Agente', preencha nome, prompt e configurações...",
  "metadata": {
    "tags": ["agent", "create", "dashboard"],
    "difficulty": "beginner",
    "page": "/dashboard/agents"
  },
  "embedding": [0.002, 0.123, -0.045, ...] // 1536 dimensões
}
```

---

### **2. Tabela: `quest_ai_user_interactions`**
Rastreia interações do usuário para aprendizado.

```sql
CREATE TABLE impaai.quest_ai_user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES impaai.users(id),
  interaction_type VARCHAR(50) NOT NULL, -- 'mission_start', 'step_complete', 'hint_used', 'aria_question', 'error_encountered'
  context JSONB NOT NULL, -- dados da interação
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_interactions_user_id ON impaai.quest_ai_user_interactions(user_id);
CREATE INDEX idx_user_interactions_type ON impaai.quest_ai_user_interactions(interaction_type);
```

---

### **3. Tabela: `quest_ai_generated_missions`**
Missões geradas pela IA.

```sql
CREATE TABLE impaai.quest_ai_generated_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES impaai.users(id),
  mission_data JSONB NOT NULL, -- estrutura Mission completa
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- missões temporárias
  status VARCHAR(20) DEFAULT 'active' -- 'active', 'completed', 'expired'
);
```

---

## 🔧 **IMPLEMENTAÇÃO**

### **FASE 1: Setup Inicial**

#### **1.1. Instalar Dependências**
```bash
npm install openai @supabase/supabase-js @langchain/openai @langchain/community
```

#### **1.2. Configurar Environment**
```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
OPENAI_CHAT_MODEL=gpt-4-turbo-preview

# Supabase (já configurado)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

#### **1.3. Habilitar pgvector no Supabase**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### **FASE 2: RAG (Retrieval Augmented Generation)**

#### **2.1. Popular Base de Conhecimento**

**Arquivo:** `scripts/populate-quest-knowledge.ts`

```typescript
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

// Dados da plataforma IMPA AI
const knowledgeBase = [
  {
    content_type: 'feature',
    title: 'Criar Agente IA',
    description: `Para criar um novo agente de IA:
    1. Acesse /dashboard/agents
    2. Clique em "Criar Novo Agente"
    3. Preencha:
       - Nome do agente
       - Prompt do sistema
       - Modelo OpenAI (GPT-3.5, GPT-4)
       - Temperatura (0-2)
    4. Configure integrações (WhatsApp, Webhook)
    5. Salve e ative`,
    metadata: { tags: ['agent', 'create'], difficulty: 'beginner', page: '/dashboard/agents' }
  },
  {
    content_type: 'feature',
    title: 'Conectar WhatsApp Evolution API',
    description: `Para conectar uma instância WhatsApp:
    1. Acesse /dashboard/whatsapp
    2. Clique em "Nova Conexão"
    3. Escolha Evolution API
    4. Preencha:
       - Nome da instância
       - URL da API
       - API Key
    5. Gere QR Code
    6. Escaneie com WhatsApp
    7. Aguarde status "CONNECTED"`,
    metadata: { tags: ['whatsapp', 'evolution', 'integration'], difficulty: 'intermediate' }
  },
  // ... mais 50-100 entradas cobrindo toda a plataforma
]

async function populateKnowledge() {
  for (const item of knowledgeBase) {
    // Gerar embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: `${item.title}\n\n${item.description}`
    })
    
    const embedding = embeddingResponse.data[0].embedding
    
    // Inserir no Supabase
    await supabase
      .from('quest_ai_context')
      .insert({
        content_type: item.content_type,
        title: item.title,
        description: item.description,
        metadata: item.metadata,
        embedding
      })
    
    console.log(`✅ Adicionado: ${item.title}`)
  }
}

populateKnowledge()
```

---

#### **2.2. Função de Busca Semântica**

**Arquivo:** `lib/quest-ai-rag.ts`

```typescript
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

/**
 * Busca contexto relevante na base de conhecimento
 */
export async function searchRelevantContext(query: string, limit: number = 5) {
  // 1. Gerar embedding da query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  })
  
  const queryEmbedding = embeddingResponse.data[0].embedding
  
  // 2. Buscar contextos similares usando cosine similarity
  const { data, error } = await supabase.rpc('match_quest_context', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7, // similaridade mínima
    match_count: limit
  })
  
  if (error) throw error
  
  return data
}

/**
 * Função SQL no Supabase para busca vetorial
 */
// CREATE OR REPLACE FUNCTION match_quest_context(
//   query_embedding vector(1536),
//   match_threshold float,
//   match_count int
// )
// RETURNS TABLE (
//   id uuid,
//   content_type varchar,
//   title varchar,
//   description text,
//   metadata jsonb,
//   similarity float
// )
// LANGUAGE plpgsql
// AS $$
// BEGIN
//   RETURN QUERY
//   SELECT
//     qac.id,
//     qac.content_type,
//     qac.title,
//     qac.description,
//     qac.metadata,
//     1 - (qac.embedding <=> query_embedding) as similarity
//   FROM impaai.quest_ai_context qac
//   WHERE 1 - (qac.embedding <=> query_embedding) > match_threshold
//   ORDER BY qac.embedding <=> query_embedding
//   LIMIT match_count;
// END;
// $$;
```

---

### **FASE 3: Geração Dinâmica de Missões**

#### **3.1. API Route: Gerar Missão Personalizada**

**Arquivo:** `app/api/quest-ai/generate-mission/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { authenticateQuestRequest } from '@/lib/quest-auth'
import { searchRelevantContext } from '@/lib/quest-ai-rag'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(request: NextRequest) {
  const auth = await authenticateQuestRequest(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  
  const { userLevel, userXP, completedMissions, userGoal } = await request.json()
  
  // 1. Buscar contexto relevante
  const context = await searchRelevantContext(
    `Tutorial missão para usuário nível ${userLevel}, objetivo: ${userGoal}`,
    10
  )
  
  // 2. Construir prompt para GPT-4
  const systemPrompt = `Você é a ARIA (Assistente Robótica de Inteligência Avançada), responsável por criar missões educativas para a plataforma IMPA AI.

CONTEXTO DA PLATAFORMA:
${context.map(c => `- ${c.title}: ${c.description}`).join('\n')}

PERFIL DO USUÁRIO:
- Nível: ${userLevel}
- XP: ${userXP}
- Missões Completas: ${completedMissions.join(', ')}
- Objetivo Atual: ${userGoal}

TAREFA:
Crie uma missão personalizada em formato JSON com:
{
  "id": "unique-id",
  "title": "Título atraente",
  "description": "Descrição envolvente",
  "category": "beginner|intermediate|advanced",
  "icon": "emoji",
  "estimatedTime": minutos,
  "difficulty": 1-5,
  "steps": [
    {
      "id": "step-id",
      "title": "Nome do passo",
      "description": "O que fazer",
      "target": { "action": "navigate|click|wait", "page": "/path" },
      "hints": ["dica 1", "dica 2"],
      "ariaDialogue": ["fala 1", "fala 2"]
    }
  ],
  "rewards": {
    "xp": número,
    "badges": ["badge-id"]
  }
}

IMPORTANTE:
- A missão deve ser desafiadora mas alcançável para o nível do usuário
- Use linguagem temática espacial/sci-fi
- Seja criativa e motivadora
- Passos devem ser claros e objetivos`

  // 3. Chamar GPT-4
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Crie uma missão focada em: ${userGoal}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8
  })
  
  const generatedMission = JSON.parse(completion.choices[0].message.content!)
  
  // 4. Salvar no banco
  await supabase
    .from('quest_ai_generated_missions')
    .insert({
      user_id: auth.userId,
      mission_data: generatedMission,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    })
  
  return NextResponse.json({ mission: generatedMission })
}
```

---

### **FASE 4: ARIA Inteligente**

#### **4.1. API Route: Resposta Contextual da ARIA**

**Arquivo:** `app/api/quest-ai/aria-response/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { authenticateQuestRequest } from '@/lib/quest-auth'
import { searchRelevantContext } from '@/lib/quest-ai-rag'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(request: NextRequest) {
  const auth = await authenticateQuestRequest(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  
  const { 
    userQuestion, 
    currentPage, 
    activeMission, 
    currentStep,
    conversationHistory 
  } = await request.json()
  
  // 1. Buscar contexto relevante
  const context = await searchRelevantContext(userQuestion, 5)
  
  // 2. Construir prompt
  const systemPrompt = `Você é a ARIA, uma assistente robótica espacial muito empolgada e prestativa!

PERSONALIDADE:
- Entusiasta sobre tecnologia e exploração
- Usa emojis espaciais (🚀, ⭐, 🛸, 💫)
- Sempre motivadora e positiva
- Explica de forma clara mas divertida

CONTEXTO ATUAL:
- Página: ${currentPage}
- Missão Ativa: ${activeMission?.title || 'Nenhuma'}
- Passo Atual: ${currentStep?.title || 'N/A'}

CONHECIMENTO DA PLATAFORMA:
${context.map(c => `${c.title}: ${c.description}`).join('\n\n')}

TAREFA:
Responda a pergunta do usuário de forma útil, contextual e motivadora.
Se o usuário estiver perdido, guie-o passo a passo.
Mantenha respostas concisas (2-3 parágrafos).`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userQuestion }
  ]
  
  // 3. Chamar GPT-4
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: messages as any,
    temperature: 0.9,
    max_tokens: 300
  })
  
  const ariaResponse = completion.choices[0].message.content
  
  // 4. Registrar interação para aprendizado
  await supabase
    .from('quest_ai_user_interactions')
    .insert({
      user_id: auth.userId,
      interaction_type: 'aria_question',
      context: {
        question: userQuestion,
        response: ariaResponse,
        page: currentPage,
        mission: activeMission?.id
      }
    })
  
  return NextResponse.json({ response: ariaResponse })
}
```

---

### **FASE 5: Análise e Aprendizado**

#### **5.1. Detectar Padrões de Dificuldade**

**Arquivo:** `app/api/quest-ai/analyze-behavior/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateQuestRequest } from '@/lib/quest-auth'

export async function POST(request: NextRequest) {
  const auth = await authenticateQuestRequest(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  
  // Buscar interações do usuário
  const { data: interactions } = await supabase
    .from('quest_ai_user_interactions')
    .select('*')
    .eq('user_id', auth.userId)
    .order('timestamp', { ascending: false })
    .limit(100)
  
  // Análise de padrões
  const analysis = {
    stuckPoints: [], // Onde o usuário fica preso
    fastCompletions: [], // O que completa rapidamente
    frequentHints: [], // Hints mais usados
    errorPatterns: [], // Erros comuns
    recommendedTopics: [] // Tópicos sugeridos para próximas missões
  }
  
  // Lógica de análise...
  // (Pode usar GPT-4 para análise mais sofisticada)
  
  return NextResponse.json({ analysis })
}
```

---

## 🚀 **VANTAGENS**

### **✅ Para o Usuário:**
- Tutorial personalizado ao seu ritmo
- ARIA responde perguntas específicas
- Missões sempre relevantes
- Feedback inteligente em tempo real

### **✅ Para o Sistema:**
- Aprende com cada usuário
- Identifica pontos de melhoria
- Reduz suporte manual
- Escala automaticamente

### **✅ Para os Desenvolvedores:**
- Menos manutenção de tutoriais estáticos
- Dados valiosos sobre UX
- Sistema se atualiza com novos features
- Fácil adicionar novo conteúdo (só atualizar embeddings)

---

## 💰 **CUSTOS ESTIMADOS**

### **OpenAI API:**
- **Embeddings (ada-002):** ~$0.0001 por 1K tokens
- **GPT-4:** ~$0.03 por 1K tokens (input) + $0.06 (output)

**Exemplo mensal (100 usuários ativos):**
- Embeddings iniciais (base de conhecimento): ~$0.50 (único)
- Buscas RAG: ~$5/mês
- Geração de missões: ~$30/mês
- Respostas ARIA: ~$20/mês

**TOTAL:** ~$55/mês para 100 usuários = **$0.55/usuário**

---

## 📅 **CRONOGRAMA**

| Fase | Atividade | Tempo | Status |
|------|-----------|-------|--------|
| 1 | Setup pgvector + OpenAI | 2 dias | 🔲 |
| 2 | Popular base de conhecimento | 3 dias | 🔲 |
| 3 | Implementar RAG | 3 dias | 🔲 |
| 4 | ARIA dinâmica | 5 dias | 🔲 |
| 5 | Geração de missões | 5 dias | 🔲 |
| 6 | Análise e aprendizado | 3 dias | 🔲 |
| 7 | Testes e ajustes | 5 dias | 🔲 |

**TOTAL:** ~26 dias (1 mês de desenvolvimento)

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Aprovar proposta** ✅
2. **Habilitar pgvector no Supabase**
3. **Configurar OpenAI API Key**
4. **Começar FASE 1: Setup**

---

## 📝 **OBSERVAÇÕES FINAIS**

### **Alternativas Consideradas:**
1. **LangChain:** Poderia usar para orquestração mais complexa
2. **Fine-tuning GPT:** Treinar modelo específico (mais caro, menos flexível)
3. **Modelos locais (Llama, Mistral):** Mais barato, mas pior qualidade

### **Recomendação:**
**Começar com GPT-4 + pgvector (RAG)** é a melhor opção:
- Qualidade superior
- Setup rápido
- Custo controlado
- Fácil iterar e melhorar

---

**Criado por:** ARIA AI System  
**Data:** 2025-10-21  
**Versão:** 1.0

