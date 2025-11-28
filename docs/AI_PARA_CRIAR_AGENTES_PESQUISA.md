# Pesquisa: IA para Criar Agentes de IA no Painel

**Data:** 25 de novembro de 2025  
**Status:** Pesquisa Técnica - Não Implementado  
**Objetivo:** Avaliar viabilidade de adicionar uma IA ao painel para auxiliar na criação e treinamento de agentes de IA

---

## 📋 Sumário Executivo

**Viabilidade:** ✅ **ALTAMENTE VIÁVEL**

É totalmente possível e recomendado adicionar uma IA assistente no painel para ajudar usuários a criar, configurar e treinar agentes de IA. Esta é uma prática emergente em 2025, com diversas empresas implementando "meta-agentes" (IA que cria IA).

**Principais Descobertas:**
- **Anthropic recomenda padrão "Orchestrator-Workers"** onde um LLM central coordena a criação de outros agentes
- **RAG (Retrieval-Augmented Generation)** é a técnica ideal para treinar agentes com conhecimento específico
- **Não requer fine-tuning** - pode ser implementado com API do Claude + vetorização de dados
- **Custo-efetivo** comparado com treinamento de modelos próprios

---

## 🎯 O Que Queremos Fazer

### Funcionalidade Proposta

Um assistente de IA integrado ao painel que:

1. **Cria Agentes Automaticamente**
   - Usuário descreve o agente desejado em linguagem natural
   - IA sugere configurações ideais (nome, prompt, temperatura, etc.)
   - Gera prompts otimizados automaticamente

2. **Treina com Dados Personalizados**
   - Upload de documentos, FAQs, bases de conhecimento
   - Processa e vetoriza automaticamente via RAG
   - Agente responde com base no conhecimento fornecido

3. **Otimização Contínua**
   - Analisa conversas e sugere melhorias
   - Detecta padrões de erro e propõe correções
   - Testa diferentes configurações automaticamente

---

## 🏗️ Como Funciona (Arquitetura Técnica)

### 1. Padrão Arquitetural: Orchestrator-Workers

Baseado nas melhores práticas da Anthropic (Building Effective Agents, Dez 2024):

```
┌─────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR LLM                        │
│              (Claude Sonnet 4.5 como Meta-Agente)           │
│                                                             │
│  Responsabilidades:                                         │
│  • Entender requisitos do usuário                          │
│  • Quebrar tarefa em subtarefas                            │
│  • Delegar criação de componentes                          │
│  • Sintetizar resultados                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ WORKER 1 │  │ WORKER 2 │  │ WORKER 3 │
        │  Prompt  │  │  Config  │  │   RAG    │
        │Generator │  │Optimizer │  │ Builder  │
        └──────────┘  └──────────┘  └──────────┘
              ↓             ↓             ↓
        ┌─────────────────────────────────────┐
        │      AGENTE CRIADO/TREINADO         │
        └─────────────────────────────────────┘
```

**Por que este padrão?**
- Anthropic afirma: "Ideal para tarefas complexas onde não é possível prever subtarefas necessárias"
- Flexível: subtarefas não são pré-definidas, mas determinadas dinamicamente
- Usado em produtos de código da Anthropic (SWE-bench)

### 2. RAG para Treinamento (Sem Fine-Tuning)

**O que é RAG?**
- Retrieval-Augmented Generation
- Técnica que complementa o LLM com dados externos em tempo real
- **NÃO requer retreinamento do modelo**

**Como aplicar no nosso caso:**

```typescript
// Fluxo RAG para Agentes Personalizados
1. INGESTÃO (Offline)
   ┌─────────────────────────────────────────────┐
   │ Usuário faz upload:                         │
   │ • PDFs (manuais, políticas)                 │
   │ • FAQs (perguntas frequentes)               │
   │ • Planilhas (dados de produtos)             │
   │ • URLs (documentação online)                │
   └─────────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────────┐
   │ Sistema processa:                           │
   │ • Extrai texto dos documentos               │
   │ • Divide em chunks (pedaços de 512 tokens)  │
   │ • Cria embeddings (vetores numéricos)       │
   │ • Armazena em Vector Database (Pinecone)    │
   └─────────────────────────────────────────────┘

2. RETRIEVAL (Tempo Real - cada mensagem)
   ┌─────────────────────────────────────────────┐
   │ Cliente pergunta: "Qual prazo de entrega?"  │
   └─────────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────────┐
   │ Sistema busca:                              │
   │ • Converte pergunta em embedding            │
   │ • Busca chunks similares no Pinecone        │
   │ • Retorna top 5 chunks mais relevantes      │
   └─────────────────────────────────────────────┘

3. AUGMENTATION (Prompt Engineering)
   ┌─────────────────────────────────────────────┐
   │ Prompt final para Claude:                   │
   │                                             │
   │ <context>                                   │
   │ {chunks relevantes do Pinecone}             │
   │ </context>                                  │
   │                                             │
   │ <question>                                  │
   │ Qual prazo de entrega?                      │
   │ </question>                                 │
   │                                             │
   │ Responda baseado APENAS no context.         │
   │ Se não souber, diga "não sei".              │
   └─────────────────────────────────────────────┘

4. GENERATION (Resposta do Claude)
   ┌─────────────────────────────────────────────┐
   │ "De acordo com nossa política, o prazo      │
   │ padrão de entrega é 5-7 dias úteis."        │
   │                                             │
   │ Fonte: Manual de Atendimento, pág. 12       │
   └─────────────────────────────────────────────┘
```

**Benefícios do RAG:**
- ✅ **Custo-efetivo:** não precisa treinar modelo próprio (economiza milhões)
- ✅ **Dados em tempo real:** atualiza conhecimento sem retreinamento
- ✅ **Privacidade:** dados proprietários não vão para treinamento público
- ✅ **Citação de fontes:** pode indicar de onde veio a informação
- ✅ **Controle total:** decide quais fontes usar

---

## 🛠️ Implementação Prática

### Stack Tecnológica Sugerida

```yaml
Frontend (Já temos):
  - Next.js 15.2.4
  - React com TypeScript
  - Shadcn/ui para componentes

Backend (Já temos):
  - API Routes do Next.js
  - Supabase PostgreSQL

Novos Componentes Necessários:

1. LLM Provider:
   - Anthropic Claude API (Sonnet 4.5)
   - Já temos chave API
   
2. Vector Database:
   - Pinecone (recomendado - $70/mês plano Starter)
   - Alternativas: Supabase pgvector (grátis, já temos!)
   - Weaviate (open source)
   
3. Embeddings Model:
   - Voyage AI (recomendado pela Anthropic)
   - OpenAI text-embedding-3-small (mais barato)
   - Alternativa: Cohere embed-multilingual-v3.0
   
4. Document Processing:
   - pdf-parse para PDFs
   - cheerio para HTML/URLs
   - langchain para chunking estratégico
```

### Exemplo de Código (Conceitual)

```typescript
// app/api/ai-assistant/create-agent/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { createEmbedding, searchVectorDB, storeInVectorDB } from "@/lib/rag";

export async function POST(req: Request) {
  const { userRequest, knowledgeFiles } = await req.json();
  
  // 1. ORCHESTRATOR: Claude entende o que usuário quer
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  const orchestratorPrompt = `
    Você é um assistente especializado em criar agentes de IA.
    
    REQUISITO DO USUÁRIO:
    ${userRequest}
    
    TAREFA:
    Analise o requisito e gere:
    1. Nome sugerido para o agente
    2. Prompt system otimizado
    3. Configurações ideais (temperatura, max_tokens)
    4. Ferramentas necessárias
    
    Responda em JSON estruturado.
  `;
  
  const orchestratorResponse = await anthropic.messages.create({
    model: "claude-sonnet-4.5-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: orchestratorPrompt }]
  });
  
  const agentConfig = JSON.parse(orchestratorResponse.content[0].text);
  
  // 2. RAG: Processa arquivos de conhecimento (se fornecidos)
  if (knowledgeFiles && knowledgeFiles.length > 0) {
    for (const file of knowledgeFiles) {
      // Extrai texto
      const text = await extractTextFromFile(file);
      
      // Divide em chunks
      const chunks = chunkText(text, 512);
      
      // Cria embeddings e armazena
      for (const chunk of chunks) {
        const embedding = await createEmbedding(chunk);
        await storeInVectorDB({
          agentId: agentConfig.id,
          text: chunk,
          embedding,
          metadata: { filename: file.name }
        });
      }
    }
  }
  
  // 3. WORKER: Cria agente no banco
  const agent = await supabase
    .from("ai_agents")
    .insert({
      name: agentConfig.name,
      system_prompt: agentConfig.system_prompt,
      temperature: agentConfig.temperature,
      max_tokens: agentConfig.max_tokens,
      has_rag: knowledgeFiles.length > 0,
      user_id: currentUser.id
    });
  
  return NextResponse.json({ 
    success: true, 
    agent,
    message: "Agente criado com sucesso!"
  });
}
```

```typescript
// lib/rag.ts - Sistema RAG
import { Pinecone } from "@pinecone-database/pinecone";
import Anthropic from "@anthropic-ai/sdk";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const index = pinecone.index("impa-ai-agents");

// Cria embedding de texto
export async function createEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text
    })
  });
  
  const data = await response.json();
  return data.data[0].embedding;
}

// Busca conhecimento relevante
export async function searchKnowledge(
  agentId: string, 
  query: string, 
  topK: number = 5
) {
  const queryEmbedding = await createEmbedding(query);
  
  const results = await index.namespace(agentId).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true
  });
  
  return results.matches.map(match => ({
    text: match.metadata.text,
    score: match.score,
    source: match.metadata.filename
  }));
}

// Resposta RAG-enhanced
export async function generateRAGResponse(
  agentId: string,
  userMessage: string,
  systemPrompt: string
) {
  // 1. Busca conhecimento relevante
  const relevantChunks = await searchKnowledge(agentId, userMessage);
  
  // 2. Monta contexto
  const context = relevantChunks
    .map(chunk => chunk.text)
    .join("\n\n");
  
  // 3. Prompt com contexto
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!
  });
  
  const ragPrompt = `
    ${systemPrompt}
    
    <knowledge_base>
    ${context}
    </knowledge_base>
    
    <instructions>
    Responda à pergunta do usuário usando APENAS informações da knowledge_base acima.
    Se a resposta não estiver na base de conhecimento, diga educadamente que não tem essa informação.
    Sempre cite a fonte quando possível.
    </instructions>
  `;
  
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4.5-20250514",
    max_tokens: 1024,
    system: ragPrompt,
    messages: [{ role: "user", content: userMessage }]
  });
  
  return {
    answer: response.content[0].text,
    sources: relevantChunks.map(c => c.source)
  };
}
```

---

## 💰 Estimativa de Custos

### Custos Mensais (100 agentes ativos)

```
INFRAESTRUTURA:
├─ Vector Database (Pinecone Starter)
│  └─ $70/mês (1M vetores, 100GB)
│
├─ Embeddings (OpenAI text-embedding-3-small)
│  ├─ Criação inicial: ~$5 (1M tokens one-time)
│  └─ Buscas mensais: ~$2 (100k queries)
│
├─ LLM API (Claude Sonnet 4.5)
│  ├─ Orchestrator: ~$50/mês
│  └─ Respostas RAG: ~$100/mês
│
└─ TOTAL: ~$227/mês

ALTERNATIVA ECONÔMICA (usando Supabase pgvector):
├─ Vector Database: $0 (já incluído no plano atual)
├─ Embeddings: $7/mês
├─ LLM API: $150/mês
└─ TOTAL: ~$157/mês
```

**ROI (Retorno sobre Investimento):**
- Custo: $157-227/mês
- Valor agregado: Feature premium que justifica aumento de 20-30% no plano
- Diferencial competitivo: poucos concorrentes oferecem IA para criar IA

---

## 📚 Casos de Uso Reais

### 1. Assistente de E-commerce

**Input do usuário:**
> "Preciso de um agente para minha loja de roupas que saiba sobre prazos de entrega, política de troca, e catálogo de produtos"

**Upload de arquivos:**
- `politica-de-trocas.pdf`
- `catalogo-produtos-2025.xlsx`
- `faq-entregas.docx`

**IA Orchestrator cria:**
```json
{
  "name": "Assistente Loja Fashion",
  "system_prompt": "Você é um assistente de atendimento especializado em moda feminina. Seja amigável, prestativo e sempre consulte a base de conhecimento antes de responder. Priorize informações sobre: prazos de entrega, política de trocas e devoluções, e detalhes de produtos.",
  "temperature": 0.3,
  "tools": ["consultar_estoque", "rastrear_pedido"],
  "rag_enabled": true,
  "knowledge_chunks": 247
}
```

**Resultado:**
- Agente responde perguntas sobre produtos baseado no catálogo real
- Cita política de trocas corretamente
- Atualização do catálogo? Basta re-upload do arquivo

### 2. Suporte Técnico SaaS

**Input do usuário:**
> "Agente de suporte técnico que ajuda com problemas de integração API, troubleshooting, e onboarding"

**Upload de arquivos:**
- Link para documentação: `https://docs.minhaapi.com`
- `erros-comuns-e-solucoes.md`
- `guia-integracao-rapida.pdf`

**IA cria agente técnico com:**
- Prompts otimizados para explicações técnicas claras
- Capacidade de citar docs específicas
- Sugestões de código baseadas em exemplos reais

---

## 🚀 Roadmap de Implementação

### Fase 1: MVP (2-3 semanas)
```
Sprint 1: Infraestrutura Base
├─ [ ] Setup Supabase pgvector extension
├─ [ ] Integração com OpenAI Embeddings API
├─ [ ] Criar schema de vector storage
└─ [ ] API route básica para upload de documentos

Sprint 2: Orchestrator Básico
├─ [ ] Prompt engineering para criação de agentes
├─ [ ] Interface de chat para descrever agente desejado
├─ [ ] Geração automática de system prompt
└─ [ ] Preview do agente antes de criar

Sprint 3: RAG Básico
├─ [ ] Upload de PDFs e TXT
├─ [ ] Chunking automático
├─ [ ] Vector search em tempo real
└─ [ ] Respostas baseadas em conhecimento
```

### Fase 2: Otimizações (1-2 semanas)
```
├─ [ ] Suporte para múltiplos formatos (DOCX, XLSX, URLs)
├─ [ ] Hybrid search (semântico + keyword)
├─ [ ] Reranking para melhor precisão
└─ [ ] Dashboard de métricas (chunks usados, precision)
```

### Fase 3: Features Avançadas (2-3 semanas)
```
├─ [ ] Auto-avaliação de qualidade das respostas
├─ [ ] Sugestões de melhoria baseadas em conversas
├─ [ ] A/B testing automático de prompts
├─ [ ] Fine-tuning via feedback humano (RLHF)
└─ [ ] Multi-agente (agente coordena sub-agentes)
```

---

## ⚠️ Desafios e Considerações

### Técnicos

1. **Qualidade dos Chunks**
   - Problema: Chunks mal divididos = respostas ruins
   - Solução: Usar chunking semântico (langchain RecursiveCharacterTextSplitter)

2. **Latência**
   - Problema: Vector search + LLM = 2-4 segundos
   - Solução: Cache de embeddings frequentes, streaming de respostas

3. **Hallucinations**
   - Problema: Claude pode "inventar" se contexto insuficiente
   - Solução: Instruções explícitas no prompt: "Se não souber, diga 'não sei'"

### Negócio

1. **Custo Escalável**
   - Problema: Custos crescem com número de agentes
   - Solução: Plano premium com limite de GB de conhecimento

2. **Qualidade de Dados do Usuário**
   - Problema: Upload de dados ruins = agente ruim
   - Solução: Validação de qualidade, sugestões de melhoria

---

## 🔬 Tecnologias Alternativas

### Vector Databases
| Opção | Custo | Prós | Contras |
|-------|-------|------|---------|
| **Supabase pgvector** | Grátis (já temos) | Sem custo adicional, mesmo DB | Performance inferior em escala |
| **Pinecone** | $70/mês | Melhor performance, managed | Custo adicional |
| **Weaviate** | Self-hosted grátis | Open source, flexível | Requer manutenção |
| **Qdrant** | Self-hosted grátis | Alta performance | Complexidade de setup |

### Embedding Models
| Modelo | Custo (1M tokens) | Dimensões | Qualidade |
|--------|-------------------|-----------|-----------|
| OpenAI text-embedding-3-small | $0.02 | 1536 | ⭐⭐⭐⭐ |
| OpenAI text-embedding-3-large | $0.13 | 3072 | ⭐⭐⭐⭐⭐ |
| Voyage AI voyage-2 | $0.12 | 1024 | ⭐⭐⭐⭐⭐ |
| Cohere embed-multilingual-v3 | $0.10 | 1024 | ⭐⭐⭐⭐ (melhor PT-BR) |

**Recomendação:** 
- Iniciar com Supabase pgvector + OpenAI text-embedding-3-small
- Migrar para Pinecone se performance se tornar gargalo

---

## 📖 Referências e Recursos

### Documentação Oficial
- [Anthropic: Building Effective Agents](https://www.anthropic.com/news/building-effective-agents) (Dez 2024)
- [Anthropic Cookbook - Agents Patterns](https://github.com/anthropics/anthropic-cookbook/tree/main/patterns/agents)
- [Pinecone: What is RAG?](https://www.pinecone.io/learn/retrieval-augmented-generation/)

### Tutoriais Práticos
- [Claude + Pinecone RAG Tutorial](https://docs.pinecone.io/integrations/anthropic)
- [Supabase pgvector Quickstart](https://supabase.com/docs/guides/ai/vector-columns)
- [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/)

### Exemplos de Código
- [Anthropic Cookbook - Customer Service Agent](https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/customer_service_agent.ipynb)
- [Next.js + Claude + RAG Starter](https://github.com/vercel/ai/tree/main/examples/next-anthropic)

---

## 🎯 Conclusão

### Devemos Implementar?

**SIM** ✅ 

**Justificativa:**
1. **Tecnicamente viável** com stack atual (Next.js + Supabase + Claude API)
2. **Custo-benefício positivo** (~$157/mês vs feature premium)
3. **Diferencial competitivo forte** (meta-agente é tendência 2025)
4. **Alinhado com visão do produto** (empoderar usuários não-técnicos)

### Próximos Passos Sugeridos

1. **Validação com Usuários** (1 semana)
   - Criar protótipo Figma da interface
   - Entrevistar 5-10 clientes beta
   - Validar willingness-to-pay

2. **Spike Técnico** (3 dias)
   - Testar Supabase pgvector na prática
   - Benchmarking de latência
   - Proof-of-concept com 1 agente

3. **Go/No-Go Decision** (após spike)
   - Performance aceitável? 
   - Custos dentro do esperado?
   - Usuários empolgados?

4. **Implementação Fase 1** (2-3 semanas)
   - MVP com features core
   - Beta com clientes selecionados
   - Iteração baseada em feedback

---

## 📝 Notas Técnicas Adicionais

### Schema Database Sugerido

```sql
-- Extensão de vetores (Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- Armazenamento de conhecimento vetorizado
CREATE TABLE agent_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  
  -- Conteúdo
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  
  -- Metadata
  source_file TEXT, -- nome do arquivo original
  chunk_index INTEGER, -- posição no documento original
  metadata JSONB, -- dados adicionais flexíveis
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca vetorial (HNSW é mais rápido)
CREATE INDEX ON agent_knowledge_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Índice para filtros
CREATE INDEX ON agent_knowledge_chunks(agent_id);

-- Função de busca semântica
CREATE OR REPLACE FUNCTION search_agent_knowledge(
  p_agent_id UUID,
  p_query_embedding vector(1536),
  p_top_k INTEGER DEFAULT 5
)
RETURNS TABLE (
  content TEXT,
  similarity FLOAT,
  source_file TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    akc.content,
    1 - (akc.embedding <=> p_query_embedding) AS similarity,
    akc.source_file
  FROM agent_knowledge_chunks akc
  WHERE akc.agent_id = p_agent_id
  ORDER BY akc.embedding <=> p_query_embedding
  LIMIT p_top_k;
END;
$$ LANGUAGE plpgsql;
```

### Exemplo de Prompt Orchestrator

```typescript
const ORCHESTRATOR_SYSTEM_PROMPT = `
Você é um especialista em criar agentes de IA conversacionais.

TAREFA:
Analise a descrição do usuário e gere configurações ideais para o agente.

DIRETRIZES:
1. NOME: curto, descritivo, profissional
2. SYSTEM_PROMPT: 
   - Defina persona clara
   - Especifique tom de voz
   - Liste responsabilidades
   - Inclua restrições importantes
3. TEMPERATURA:
   - 0.1-0.3: tarefas precisas (suporte técnico, dados)
   - 0.5-0.7: conversação natural (vendas, atendimento)
   - 0.8-1.0: criativo (marketing, brainstorm)
4. TOOLS: sugira ferramentas necessárias

FORMATO DE SAÍDA (JSON):
{
  "name": "string",
  "system_prompt": "string (máx 500 palavras)",
  "temperature": number,
  "max_tokens": number,
  "suggested_tools": ["tool1", "tool2"],
  "reasoning": "explicação das escolhas"
}

EXEMPLOS:
[incluir 2-3 exemplos de input/output]
`;
```

---

**Documento criado por:** GitHub Copilot (Claude Sonnet 4.5)  
**Baseado em:** Anthropic Official Docs, Pinecone RAG Guide, práticas de mercado 2025  
**Última atualização:** 25/11/2025
