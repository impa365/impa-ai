---
description: USE ESSA TOLL SEMPRE QUE PRECISAR CONSULTAR A DOCUMENTAÇÃO DA UAZAPI PRA SABER COMO FUNCIONA A API
alwaysApply: false
---

  /webhook:
    get:
      tags:
        - Webhooks e SSE
      summary: Ver Webhook da Instância
      description: |
        Retorna a configuração atual do webhook da instância, incluindo:
        - URL configurada
        - Eventos ativos
        - Filtros aplicados
        - Configurações adicionais

        Exemplo de resposta:
        ```json
        [
          {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "enabled": true,
            "url": "https://example.com/webhook",
            "events": ["messages", "messages_update"],
            "excludeMessages": ["wasSentByApi", "isGroupNo"],
            "addUrlEvents": true,
            "addUrlTypesMessages": true
          },
          {
            "id": "987fcdeb-51k3-09j8-x543-864297539100",
            "enabled": true,
            "url": "https://outro-endpoint.com/webhook",
            "events": ["connection", "presence"],
            "excludeMessages": [],
            "addUrlEvents": false,
            "addUrlTypesMessages": false
          }
        ]
        ```

        A resposta é sempre um array, mesmo quando há apenas um webhook configurado.
      responses:
        '200':
          description: Configuração do webhook retornada com sucesso
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: ../schemas/webhook.yaml#/Webhook
              example:
                - id: 123e4567-e89b-12d3-a456-426614174000
                  enabled: true
                  url: https://example.com/webhook
                  events:
                    - messages
                    - messages_update
                  excludeMessages:
                    - wasSentByApi
                    - isGroupNo
                  addUrlEvents: true
                  addUrlTypesMessages: true
                - id: 987fcdeb-51k3-09j8-x543-864297539100
                  enabled: true
                  url: https://outro-endpoint.com/webhook
                  events:
                    - connection
                    - presence
                  excludeMessages: []
                  addUrlEvents: false
                  addUrlTypesMessages: false
        '401':
          description: Token inválido ou não fornecido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: missing token
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to process webhook data
    post:
      tags:
        - Webhooks e SSE
      summary: Configurar Webhook da Instância
      description: >
        Gerencia a configuração de webhooks para receber eventos em tempo real da instância.

        Permite gerenciar múltiplos webhooks por instância através do campo ID e action.


        ### 🚀 Modo Simples (Recomendado)


        **Uso mais fácil - sem complexidade de IDs**:

        - Não inclua `action` nem `id` no payload

        - Gerencia automaticamente um único webhook por instância

        - Cria novo ou atualiza o existente automaticamente

        - **Recomendado**: Sempre use `"excludeMessages": ["wasSentByApi"]` para evitar loops

        - **Exemplo**: `{"url": "https://meusite.com/webhook", "events": ["messages"], "excludeMessages":
        ["wasSentByApi"]}`


        ### 🧪 Sites para Testes (ordenados por qualidade)


        **Para testar webhooks durante desenvolvimento**:

        1. **https://webhook.cool/** - ⭐ Melhor opção (sem rate limit, interface limpa)

        2. **https://rbaskets.in/** - ⭐ Boa alternativa (confiável, baixo rate limit)

        3. **https://webhook.site/** - ⚠️ Evitar se possível (rate limit agressivo)


        ### ⚙️ Modo Avançado (Para múltiplos webhooks)


        **Para usuários que precisam de múltiplos webhooks por instância**:


        💡 **Dica**: Mesmo precisando de múltiplos webhooks, considere usar `addUrlEvents` no modo simples.

        Um único webhook pode receber diferentes tipos de eventos em URLs específicas 

        (ex: `/webhook/message`, `/webhook/connection`), eliminando a necessidade de múltiplos webhooks.


        1. **Criar Novo Webhook**:
           - Use `action: "add"`
           - Não inclua `id` no payload
           - O sistema gera ID automaticamente

        2. **Atualizar Webhook Existente**:
           - Use `action: "update"`
           - Inclua o `id` do webhook no payload
           - Todos os campos serão atualizados

        3. **Remover Webhook**:
           - Use `action: "delete"`
           - Inclua apenas o `id` do webhook
           - Outros campos são ignorados



        ### Eventos Disponíveis

        - `connection`: Alterações no estado da conexão

        - `history`: Recebimento de histórico de mensagens

        - `messages`: Novas mensagens recebidas

        - `messages_update`: Atualizações em mensagens existentes

        - `call`: Eventos de chamadas VoIP

        - `contacts`: Atualizações na agenda de contatos

        - `presence`: Alterações no status de presença

        - `groups`: Modificações em grupos

        - `labels`: Gerenciamento de etiquetas

        - `chats`: Eventos de conversas

        - `chat_labels`: Alterações em etiquetas de conversas

        - `blocks`: Bloqueios/desbloqueios

        - `leads`: Atualizações de leads

        - `sender`: Atualizações de campanhas, quando inicia, e quando completa


        **Remover mensagens com base nos filtros**:

        - `wasSentByApi`: Mensagens originadas pela API ⚠️ **IMPORTANTE:** Use sempre este filtro para evitar loops em
        automações

        - `wasNotSentByApi`: Mensagens não originadas pela API

        - `fromMeYes`: Mensagens enviadas pelo usuário

        - `fromMeNo`: Mensagens recebidas de terceiros

        - `isGroupYes`: Mensagens em grupos

        - `isGroupNo`: Mensagens em conversas individuais


        💡 **Prevenção de Loops**: Se você tem automações que enviam mensagens via API, sempre inclua
        `"excludeMessages": ["wasSentByApi"]` no seu webhook. Caso prefira receber esses eventos, certifique-se de que
        sua automação detecta mensagens enviadas pela própria API para não criar loops infinitos.


        **Ações Suportadas**:

        - `add`: Registrar novo webhook

        - `delete`: Remover webhook existente


        **Parâmetros de URL**:

        - `addUrlEvents` (boolean): Quando ativo, adiciona o tipo do evento como path parameter na URL.
          Exemplo: `https://api.example.com/webhook/{evento}`
        - `addUrlTypesMessages` (boolean): Quando ativo, adiciona o tipo da mensagem como path parameter na URL.
          Exemplo: `https://api.example.com/webhook/{tipo_mensagem}`

        **Combinações de Parâmetros**:

        - Ambos ativos: `https://api.example.com/webhook/{evento}/{tipo_mensagem}`
          Exemplo real: `https://api.example.com/webhook/message/conversation`
        - Apenas eventos: `https://api.example.com/webhook/message`

        - Apenas tipos: `https://api.example.com/webhook/conversation`


        **Notas Técnicas**:

        1. Os parâmetros são adicionados na ordem: evento → tipo mensagem

        2. A URL deve ser configurada para aceitar esses parâmetros dinâmicos

        3. Funciona com qualquer combinação de eventos/mensagens
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                  description: ID único do webhook (necessário para update/delete)
                  example: 123e4567-e89b-12d3-a456-426614174000
                enabled:
                  type: boolean
                  description: Habilita/desabilita o webhook
                  example: true
                url:
                  type: string
                  description: URL para receber os eventos
                  example: https://example.com/webhook
                events:
                  type: array
                  description: Lista de eventos monitorados
                  items:
                    type: string
                    enum:
                      - connection
                      - history
                      - messages
                      - messages_update
                      - call
                      - contacts
                      - presence
                      - groups
                      - labels
                      - chats
                      - chat_labels
                      - blocks
                      - leads
                excludeMessages:
                  type: array
                  description: Filtros para excluir tipos de mensagens
                  items:
                    type: string
                    enum:
                      - wasSentByApi
                      - wasNotSentByApi
                      - fromMeYes
                      - fromMeNo
                      - isGroupYes
                      - isGroupNo
                addUrlEvents:
                  type: boolean
                  description: |
                    Adiciona o tipo do evento como parâmetro na URL.
                    - `false` (padrão): URL normal
                    - `true`: Adiciona evento na URL (ex: `/webhook/message`)
                  default: false
                addUrlTypesMessages:
                  type: boolean
                  description: |
                    Adiciona o tipo da mensagem como parâmetro na URL.
                    - `false` (padrão): URL normal  
                    - `true`: Adiciona tipo da mensagem (ex: `/webhook/conversation`)
                  default: false
                action:
                  type: string
                  description: |
                    Ação a ser executada:
                    - add: criar novo webhook
                    - update: atualizar webhook existente (requer id)
                    - delete: remover webhook (requer apenas id)
                    Se não informado, opera no modo simples (único webhook)
                  enum:
                    - add
                    - update
                    - delete
              required:
                - url
            examples:
              modo_simples:
                summary: Exemplo Modo Simples (Recomendado)
                description: Configuração básica sem complexidade
                value:
                  enabled: true
                  url: https://webhook.cool/example
                  events:
                    - messages
                    - connection
                  excludeMessages:
                    - wasSentByApi
              modo_avancado_criar:
                summary: Modo Avançado - Criar Webhook
                description: Criar novo webhook com ID automático
                value:
                  action: add
                  enabled: true
                  url: https://api.exemplo.com/webhook
                  events:
                    - messages
                    - groups
                  excludeMessages:
                    - wasSentByApi
              modo_simples_com_urls:
                summary: Modo Simples com URLs Dinâmicas
                description: Alternativa ao modo avançado usando addUrlEvents
                value:
                  enabled: true
                  url: https://webhook.cool/api
                  events:
                    - messages
                    - connection
                    - groups
                  excludeMessages:
                    - wasSentByApi
                  addUrlEvents: true
      responses:
        '200':
          description: Webhook configurado ou atualizado com sucesso
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: ../schemas/webhook.yaml#/Webhook
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid action
        '401':
          description: Token inválido ou não fornecido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: missing token
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Could not save webhook
  /globalwebhook:
    get:
      tags:
        - Admininstração
      summary: Ver Webhook Global
      security:
        - admintoken: []
      description: |
        Retorna a configuração atual do webhook global, incluindo:
        - URL configurada
        - Eventos ativos
        - Filtros aplicados
        - Configurações adicionais

        Exemplo de resposta:
        ```json
        {
          "enabled": true,
          "url": "https://example.com/webhook",
          "events": ["messages", "messages_update"],
          "excludeMessages": ["wasSentByApi", "isGroupNo"],
          "addUrlEvents": true,
          "addUrlTypesMessages": true
        }
        ```
      responses:
        '200':
          description: Configuração atual do webhook global
          content:
            application/json:
              schema:
                $ref: ../schemas/webhook.yaml#/Webhook
        '401':
          description: Token de administrador não fornecido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Unauthorized
        '403':
          description: Token de administrador inválido ou servidor demo
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: This is a public demo server. This endpoint has been disabled.
        '404':
          description: Webhook global não encontrado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Global webhook not found
    post:
      tags:
        - Admininstração
      summary: Configurar Webhook Global
      security:
        - admintoken: []
      description: >
        Configura um webhook global que receberá eventos de todas as instâncias.


        ### 🚀 Configuração Simples (Recomendada)


        **Para a maioria dos casos de uso**:

        - Configure apenas URL e eventos desejados

        - Modo simples por padrão (sem complexidade)

        - **Recomendado**: Sempre use `"excludeMessages": ["wasSentByApi"]` para evitar loops

        - **Exemplo**: `{"url": "https://webhook.cool/global", "events": ["messages", "connection"], "excludeMessages":
        ["wasSentByApi"]}`


        ### 🧪 Sites para Testes (ordenados por qualidade)


        **Para testar webhooks durante desenvolvimento**:

        1. **https://webhook.cool/** - ⭐ Melhor opção (sem rate limit, interface limpa)

        2. **https://rbaskets.in/** - ⭐ Boa alternativa (confiável, baixo rate limit)

        3. **https://webhook.site/** - ⚠️ Evitar se possível (rate limit agressivo)


        ### Funcionalidades Principais:

        - Configuração de URL para recebimento de eventos

        - Seleção granular de tipos de eventos

        - Filtragem avançada de mensagens

        - Parâmetros adicionais na URL


        **Eventos Disponíveis**:

        - `connection`: Alterações no estado da conexão

        - `history`: Recebimento de histórico de mensagens

        - `messages`: Novas mensagens recebidas

        - `messages_update`: Atualizações em mensagens existentes

        - `call`: Eventos de chamadas VoIP

        - `contacts`: Atualizações na agenda de contatos

        - `presence`: Alterações no status de presença

        - `groups`: Modificações em grupos

        - `labels`: Gerenciamento de etiquetas

        - `chats`: Eventos de conversas

        - `chat_labels`: Alterações em etiquetas de conversas

        - `blocks`: Bloqueios/desbloqueios

        - `leads`: Atualizações de leads

        - `sender`: Atualizações de campanhas, quando inicia, e quando completa


        **Remover mensagens com base nos filtros**:

        - `wasSentByApi`: Mensagens originadas pela API ⚠️ **IMPORTANTE:** Use sempre este filtro para evitar loops em
        automações

        - `wasNotSentByApi`: Mensagens não originadas pela API

        - `fromMeYes`: Mensagens enviadas pelo usuário

        - `fromMeNo`: Mensagens recebidas de terceiros

        - `isGroupYes`: Mensagens em grupos

        - `isGroupNo`: Mensagens em conversas individuais


        💡 **Prevenção de Loops Globais**: O webhook global recebe eventos de TODAS as instâncias. Se você tem
        automações que enviam mensagens via API, sempre inclua `"excludeMessages": ["wasSentByApi"]`. Caso prefira
        receber esses eventos, certifique-se de que sua automação detecta mensagens enviadas pela própria API para não
        criar loops infinitos em múltiplas instâncias.


        **Parâmetros de URL**:

        - `addUrlEvents` (boolean): Quando ativo, adiciona o tipo do evento como path parameter na URL.
          Exemplo: `https://api.example.com/webhook/{evento}`
        - `addUrlTypesMessages` (boolean): Quando ativo, adiciona o tipo da mensagem como path parameter na URL.
          Exemplo: `https://api.example.com/webhook/{tipo_mensagem}`

        **Combinações de Parâmetros**:

        - Ambos ativos: `https://api.example.com/webhook/{evento}/{tipo_mensagem}`
          Exemplo real: `https://api.example.com/webhook/message/conversation`
        - Apenas eventos: `https://api.example.com/webhook/message`

        - Apenas tipos: `https://api.example.com/webhook/conversation`


        **Notas Técnicas**:

        1. Os parâmetros são adicionados na ordem: evento → tipo mensagem

        2. A URL deve ser configurada para aceitar esses parâmetros dinâmicos

        3. Funciona com qualquer combinação de eventos/mensagens
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                url:
                  type: string
                  format: uri
                  description: URL para receber os eventos
                  example: https://webhook.cool/global
                events:
                  type: array
                  description: Lista de eventos monitorados
                  items:
                    type: string
                    enum:
                      - connection
                      - history
                      - messages
                      - messages_update
                      - call
                      - contacts
                      - presence
                      - groups
                      - labels
                      - chats
                      - chat_labels
                      - blocks
                      - leads
                      - sender
                  example:
                    - messages
                    - connection
                excludeMessages:
                  type: array
                  description: Filtros para excluir tipos de mensagens
                  items:
                    type: string
                    enum:
                      - wasSentByApi
                      - wasNotSentByApi
                      - fromMeYes
                      - fromMeNo
                      - isGroupYes
                      - isGroupNo
                  example:
                    - wasSentByApi
                addUrlEvents:
                  type: boolean
                  description: |
                    Adiciona o tipo do evento como parâmetro na URL.
                    - `false` (padrão): URL normal
                    - `true`: Adiciona evento na URL (ex: `/webhook/message`)
                  default: false
                addUrlTypesMessages:
                  type: boolean
                  description: |
                    Adiciona o tipo da mensagem como parâmetro na URL.
                    - `false` (padrão): URL normal  
                    - `true`: Adiciona tipo da mensagem (ex: `/webhook/conversation`)
                  default: false
              required:
                - url
                - events
            examples:
              configuracao_simples:
                summary: Configuração Simples (Recomendada)
                description: Configuração básica sem complexidade
                value:
                  url: https://webhook.cool/global
                  events:
                    - messages
                    - connection
                  excludeMessages:
                    - wasSentByApi
              configuracao_completa:
                summary: Configuração Completa
                description: Exemplo com todos os recursos
                value:
                  url: https://webhook.cool/api
                  events:
                    - messages
                    - connection
                    - groups
                    - leads
                  excludeMessages:
                    - wasSentByApi
                    - isGroupNo
                  addUrlEvents: true
      responses:
        '200':
          description: Webhook global configurado com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/webhook.yaml#/Webhook
        '400':
          description: Payload inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid payload
        '401':
          description: Token de administrador não fornecido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Unauthorized
        '403':
          description: Token de administrador inválido ou servidor demo
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: This is a public demo server. This endpoint has been disabled.
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to save global webhook to database
  /sse:
    get:
      tags:
        - Webhooks e SSE
      summary: Server-Sent Events (SSE)
      description: |-
        Receber eventos em tempo real via Server-Sent Events (SSE)

        ### Funcionalidades Principais:
        - Configuração de URL para recebimento de eventos
        - Seleção granular de tipos de eventos
        - Filtragem avançada de mensagens
        - Parâmetros adicionais na URL
        - Gerenciamento múltiplo de webhooks

        **Eventos Disponíveis**:
        - `connection`: Alterações no estado da conexão
        - `history`: Recebimento de histórico de mensagens
        - `messages`: Novas mensagens recebidas
        - `messages_update`: Atualizações em mensagens existentes
        - `call`: Eventos de chamadas VoIP
        - `contacts`: Atualizações na agenda de contatos
        - `presence`: Alterações no status de presença
        - `groups`: Modificações em grupos
        - `labels`: Gerenciamento de etiquetas
        - `chats`: Eventos de conversas
        - `chat_labels`: Alterações em etiquetas de conversas
        - `blocks`: Bloqueios/desbloqueios
        - `leads`: Atualizações de leads


        Estabelece uma conexão persistente para receber eventos em tempo real. Este
        endpoint:

        1. Requer autenticação via token

        2. Mantém uma conexão HTTP aberta com o cliente

        3. Envia eventos conforme ocorrem no servidor

        4. Suporta diferentes tipos de eventos

        Exemplo de uso:

        ```javascript

        const eventSource = new
        EventSource('/sse?token=SEU_TOKEN&events=chats,messages');


        eventSource.onmessage = function(event) {
          const data = JSON.parse(event.data);
          console.log('Novo evento:', data);
        };


        eventSource.onerror = function(error) {
          console.error('Erro na conexão SSE:', error);
        };

        ```


        Estrutura de um evento:

        ```json

        {
          "type": "message",
          "data": {
            "id": "3EB0538DA65A59F6D8A251",
            "from": "5511999999999@s.whatsapp.net",
            "to": "5511888888888@s.whatsapp.net",
            "text": "Olá!",
            "timestamp": 1672531200000
          }
        }

        ```
      security: []
      parameters:
        - name: token
          in: query
          schema:
            type: string
          required: true
          description: Token de autenticação da instância
          example: '{{token}}'
        - name: events
          in: query
          schema:
            type: string
          required: true
          description: Tipos de eventos a serem recebidos (separados por vírgula)
          example: chats,messages
  /agent/edit:
    post:
      tags:
        - Configuração do Agente de IA
      summary: Criar/Editar Agente
      description: >
        # Documentação dos Campos de Configuração


        ## Campos Básicos


        ### Nome e Identificação


        O agente precisa ser configurado com informações básicas que determinam sua identidade e funcionamento.


        #### Nome do Agente

        **name**: Define como o agente será identificado nas conversas.


        Exemplos válidos:

        - "Assistente de Vendas"

        - "Suporte Técnico" 

        - "João"

        - "Maria"


        #### Provedor do Serviço

        **provider**: Especifica qual serviço de IA será utilizado.


        Provedores disponíveis:

        - "openai" (ChatGPT)

        - "anthropic" (Claude)

        - "gemini" (Google)

        - "deepseek" (DeepSeek)


        #### Chave de API

        **apikey**: Credencial necessária para autenticação com o provedor escolhido.

        - Deve ser obtida através do site oficial do provedor selecionado

        - Mantenha esta chave em segurança e nunca a compartilhe


        ### Configuração do Modelo


        #### Seleção do Modelo

        **model**: Especifica qual modelo de IA será utilizado. A disponibilidade depende do provedor selecionado.


        ##### OpenAI

        Documentação: https://platform.openai.com/docs/models

        - gpt-4o

        - gpt-4o-mini

        - gpt-3.5-turbo


        ##### Claude

        Documentação: https://docs.anthropic.com/en/docs/about-claude/models

        - claude-3-5-sonnet-latest

        - claude-3-5-haiku-latest

        - claude-3-opus-latest


        ##### Gemini

        Documentação: https://ai.google.dev/models/gemini

        - gemini-2.0-flash-exp

        - gemini-1.5-pro

        - gemini-1.5-flash


        ##### DeepSeek

        Documentação: https://api-docs.deepseek.com/quick_start/pricing

        - deepseek-chat

        - deepseek-reasoner

                

        ## Configurações de Comportamento



        ### Prompt Base (**basePrompt**)



        Instruções iniciais para definir o comportamento do agente
            
        Exemplo para assistente de vendas:


        "Você é um assistente especializado em vendas, focado em ajudar clientes a encontrar os produtos ideais.
        Mantenha um tom profissional e amigável."
                
        Exemplo para suporte:


        "Você é um agente de suporte técnico especializado em nossos produtos. Forneça respostas claras e objetivas para
        ajudar os clientes a resolverem seus problemas."

                

        ### Parâmetros de Geração



        - **temperature**: Controla a criatividade das respostas (0-100)
            
            - 0-30: Respostas mais conservadoras e precisas
                
            - 30-70: Equilíbrio entre criatividade e precisão
                
            - 70-100: Respostas mais criativas e variadas

                
        - **maxTokens**: Limite máximo de tokens por resposta
            
            - Recomendado: 1000-4000 para respostas detalhadas
                
            - Para respostas curtas: 500-1000
                
            - Limite máximo varia por modelo

                
        - **diversityLevel**: Controla a diversidade das respostas (0-100)
            
            - Valores mais altos geram respostas mais variadas
                
            - Recomendado: 30-70 para uso geral

                
        - **frequencyPenalty**: Penalidade para repetição de palavras (0-100)
            
            - Valores mais altos reduzem repetições
                
            - Recomendado: 20-50 para comunicação natural

                
        - **presencePenalty**: Penalidade para manter foco no tópico (0-100)
            
            - Valores mais altos incentivam mudanças de tópico
                
            - Recomendado: 10-30 para manter coerência

                

        ## Configurações de Interação



        ### Mensagens



        - **signMessages**: Se verdadeiro, adiciona a assinatura do agente nas mensagens
            
            - Útil para identificar quem está enviando a mensagem

                
        - **readMessages**: Se verdadeiro, marca as mensagens como lidas ao responder
            
            - Recomendado para simular comportamento humano

                

        ## Exemplos de Configuração



        ### Assistente de Vendas



        ``` json


        {
          "name": "Assistente de Vendas",
          "provider": "openai",
          "model": "gpt-4",
          "basePrompt": "Você é um assistente de vendas especializado...",
          "temperature": 70,
          "maxTokens": 2000,
          "diversityLevel": 50,
          "frequencyPenalty": 30,
          "presencePenalty": 20,
          "signMessages": true,
          "readMessages": true
        }

          ```

        ### Suporte Técnico



        ``` json


        {
          "name": "Suporte Técnico",
          "provider": "anthropic",
          "model": "claude-3-sonnet-20240229",
          "basePrompt": "Você é um agente de suporte técnico...",
          "temperature": 30,
          "maxTokens": 3000,
          "diversityLevel": 40,
          "frequencyPenalty": 40,
          "presencePenalty": 15,
          "signMessages": true,
          "readMessages": true
        }

          ```

        ## Dicas de Otimização



        1. **Ajuste Gradual**: Comece com valores moderados e ajuste conforme necessário
            
        2. **Teste o Base Prompt**: Verifique se as instruções estão claras e completas
            
        3. **Monitore o Desempenho**: Observe as respostas e ajuste os parâmetros para melhor adequação
            
        4. **Backup**: Mantenha um backup das configurações que funcionaram bem
            
        5. **Documentação**: Registre as alterações e seus impactos para referência futura
      requestBody:
        content:
          application/json:
            schema:
              type: object
              example:
                id: ''
                delete: false
                agent:
                  name: uazabot
                  provider: openai
                  apikey: sk-proj-HfXFgA
                  basePrompt: Seu nome é Sara e você faz parte do time de suporte ao cliente da TechShop...
                  model: gpt-4o-mini
                  maxTokens: 2000
                  temperature: 70
                  diversityLevel: 50
                  frequencyPenalty: 30
                  presencePenalty: 30
                  signMessages: true
                  readMessages: true
                  maxMessageLength: 500
                  typingDelay_seconds: 3
                  contextTimeWindow_hours: 24
                  contextMaxMessages: 50
                  contextMinMessages: 3
      responses:
        '200':
          description: Agente atualizado com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/chatbot_ai_agent.yaml#/ChatbotAIAgent
        '201':
          description: Novo agente criado com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/chatbot_ai_agent.yaml#/ChatbotAIAgent
        '400':
          description: Erro na requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Missing required fields
        '401':
          description: Não autorizado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: No session
        '404':
          description: Agente não encontrado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Agent not found
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to create agent
  /agent/list:
    get:
      tags:
        - Configuração do Agente de IA
      summary: Todos os agentes
      parameters: []
      responses:
        '200':
          description: Lista de todos os agentes de IA
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: ../schemas/chatbot_ai_agent.yaml#/ChatbotAIAgent
        '401':
          description: Sessão não encontrada
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: No session
        '500':
          description: Erro ao buscar agentes
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to fetch agents
  /sender/simple:
    post:
      tags:
        - Mensagem em massa
      summary: Criar nova campanha (Simples)
      description: Cria uma nova campanha de envio com configurações básicas
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - numbers
                - type
                - folder
                - delayMin
                - delayMax
                - scheduled_for
              properties:
                numbers:
                  type: array
                  description: Lista de números para envio
                  items:
                    type: string
                  example:
                    - 5511999999999@s.whatsapp.net
                type:
                  type: string
                  description: Tipo da mensagem
                  enum:
                    - text
                    - image
                    - video
                    - audio
                    - document
                    - contact
                    - location
                    - list
                    - button
                    - poll
                    - carousel
                delayMin:
                  type: integer
                  description: Delay mínimo entre mensagens em segundos
                  minimum: 1
                  example: 10
                delayMax:
                  type: integer
                  description: Delay máximo entre mensagens em segundos
                  minimum: 1
                  example: 30
                scheduled_for:
                  type: integer
                  description: Timestamp em milissegundos ou minutos a partir de agora para agendamento
                  example: 1706198400000
                info:
                  type: string
                  description: Informações adicionais sobre a campanha
                delay:
                  type: integer
                  description: Delay fixo entre mensagens (opcional)
                mentions:
                  type: string
                  description: Menções na mensagem em formato JSON
                text:
                  type: string
                  description: Texto da mensagem
                linkPreview:
                  type: boolean
                  description: >-
                    Habilitar preview de links em mensagens de texto. O preview será gerado automaticamente a partir da
                    URL contida no texto.
                linkPreviewTitle:
                  type: string
                  description: Título personalizado para o preview do link (opcional)
                linkPreviewDescription:
                  type: string
                  description: Descrição personalizada para o preview do link (opcional)
                linkPreviewImage:
                  type: string
                  description: URL ou dados base64 da imagem para o preview do link (opcional)
                linkPreviewLarge:
                  type: boolean
                  description: Se deve usar preview grande ou pequeno (opcional, padrão false)
                file:
                  type: string
                  description: URL da mídia ou arquivo (quando type é image, video, audio, document, etc.)
                docName:
                  type: string
                  description: Nome do arquivo (quando type é document)
                fullName:
                  type: string
                  description: Nome completo (quando type é contact)
                phoneNumber:
                  type: string
                  description: Número do telefone (quando type é contact)
                organization:
                  type: string
                  description: Organização (quando type é contact)
                email:
                  type: string
                  description: Email (quando type é contact)
                url:
                  type: string
                  description: URL (quando type é contact)
                latitude:
                  type: number
                  description: Latitude (quando type é location)
                longitude:
                  type: number
                  description: Longitude (quando type é location)
                name:
                  type: string
                  description: Nome do local (quando type é location)
                address:
                  type: string
                  description: Endereço (quando type é location)
                footerText:
                  type: string
                  description: Texto do rodapé (quando type é list, button, poll ou carousel)
                buttonText:
                  type: string
                  description: Texto do botão (quando type é list, button, poll ou carousel)
                listButton:
                  type: string
                  description: Texto do botão da lista (quando type é list)
                selectableCount:
                  type: integer
                  description: Quantidade de opções selecionáveis (quando type é poll)
                choices:
                  type: array
                  items:
                    type: string
                  description: >-
                    Lista de opções (quando type é list, button, poll ou carousel). Para carousel, use formato
                    específico com [texto], {imagem} e botões
                imageButton:
                  type: string
                  description: URL da imagem para o botão (quando type é button)
      responses:
        '200':
          description: campanha criada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  folder_id:
                    type: string
                    description: ID único da campanha criada
                  count:
                    type: integer
                    description: Quantidade de mensagens agendadas
                  status:
                    type: string
                    description: Status da operação
                    example: queued
        '400':
          description: Erro nos parâmetros da requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
        '401':
          description: Erro de autenticação
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
        '409':
          description: Conflito - campanha já existe
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
  /sender/advanced:
    post:
      tags:
        - Mensagem em massa
      summary: Criar envio em massa avançado
      description: |
        Cria um novo envio em massa com configurações avançadas, permitindo definir
        múltiplos destinatários e mensagens com delays personalizados.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                delayMin:
                  type: integer
                  description: Delay mínimo entre mensagens (segundos)
                  minimum: 0
                  example: 3
                delayMax:
                  type: integer
                  description: Delay máximo entre mensagens (segundos)
                  minimum: 0
                  example: 6
                info:
                  type: string
                  description: Descrição ou informação sobre o envio em massa
                  example: Campanha de lançamento
                scheduled_for:
                  type: integer
                  description: Timestamp em milissegundos (date unix) ou minutos a partir de agora para agendamento
                  example: 1
                messages:
                  type: array
                  description: Lista de mensagens a serem enviadas
                  items:
                    type: object
                    required:
                      - number
                      - type
                    properties:
                      number:
                        type: string
                        description: ID do chat ou número do destinatário.
                        example: '5511999999999'
                      type:
                        type: string
                        enum:
                          - text
                          - image
                          - document
                          - audio
                          - ptt
                          - myaudio
                          - sticker
                          - video
                          - contact
                          - location
                          - poll
                          - list
                          - button
                          - carousel
                        description: |
                          Tipo da mensagem:
                          - text: Mensagem de texto
                          - image: Imagem
                          - document: Documento/arquivo
                          - audio: Áudio
                          - ptt: Mensagem de voz
                          - myaudio: Áudio (opção alternativa)
                          - sticker: Figurinha
                          - video: Vídeo
                          - contact: Contato
                          - location: Localização
                          - poll: Enquete
                          - list: Lista de opções
                          - button: Botões interativos
                          - carousel: Carrossel de cartões com imagens e botões
                      text:
                        type: string
                        description: Texto da mensagem (quando type é "text") ou legenda para mídia
                      file:
                        type: string
                        description: URL da mídia (quando type é image, video, audio, document, etc)
                      docName:
                        type: string
                        description: Nome do arquivo (quando type é document)
                      linkPreview:
                        type: boolean
                        description: >-
                          Se deve gerar preview de links (quando type é text). O preview será gerado automaticamente a
                          partir da URL contida no texto.
                      linkPreviewTitle:
                        type: string
                        description: Título personalizado para o preview do link (opcional)
                      linkPreviewDescription:
                        type: string
                        description: Descrição personalizada para o preview do link (opcional)
                      linkPreviewImage:
                        type: string
                        description: URL ou dados base64 da imagem para o preview do link (opcional)
                      linkPreviewLarge:
                        type: boolean
                        description: Se deve usar preview grande ou pequeno (opcional, padrão false)
                      fullName:
                        type: string
                        description: Nome completo (quando type é contact)
                      phoneNumber:
                        type: string
                        description: Número do telefone (quando type é contact)
                      organization:
                        type: string
                        description: Organização (quando type é contact)
                      email:
                        type: string
                        description: Email (quando type é contact)
                      url:
                        type: string
                        description: URL (quando type é contact)
                      latitude:
                        type: number
                        description: Latitude (quando type é location)
                      longitude:
                        type: number
                        description: Longitude (quando type é location)
                      name:
                        type: string
                        description: Nome do local (quando type é location)
                      address:
                        type: string
                        description: Endereço (quando type é location)
                      footerText:
                        type: string
                        description: Texto do rodapé (quando type é list, button, poll ou carousel)
                      buttonText:
                        type: string
                        description: Texto do botão (quando type é list, button, poll ou carousel)
                      listButton:
                        type: string
                        description: Texto do botão da lista (quando type é list)
                      selectableCount:
                        type: integer
                        description: Quantidade de opções selecionáveis (quando type é poll)
                      choices:
                        type: array
                        items:
                          type: string
                        description: >-
                          Lista de opções (quando type é list, button, poll ou carousel). Para carousel, use formato
                          específico com [texto], {imagem} e botões
                      imageButton:
                        type: string
                        description: URL da imagem para o botão (quando type é button)
              required:
                - messages
              example:
                delayMin: 3
                delayMax: 6
                info: teste avançado
                scheduled_for: 1
                messages:
                  - number: '5511999999999'
                    type: text
                    text: First message
                  - number: '5511999999999'
                    type: button
                    text: |-
                      Promoção Especial!
                      Confira nossas ofertas incríveis
                    footerText: Válido até 31/12/2024
                    imageButton: https://exemplo.com/banner-promocao.jpg
                    choices:
                      - Ver Ofertas|https://loja.exemplo.com/ofertas
                      - Falar com Vendedor|reply:vendedor
                      - Copiar Cupom|copy:PROMO2024
                  - number: '5511999999999'
                    type: list
                    text: 'Escolha sua categoria preferida:'
                    listButton: Ver Categorias
                    choices:
                      - '[Eletrônicos]'
                      - Smartphones|eletronicos_smartphones
                      - Notebooks|eletronicos_notebooks
                      - '[Roupas]'
                      - Camisetas|roupas_camisetas
                      - Sapatos|roupas_sapatos
                  - number: '5511999999999'
                    type: document
                    file: https://example.com/doc.pdf
                    docName: Documento.pdf
                  - number: '5511999999999'
                    type: carousel
                    text: Conheça nossos produtos
                    choices:
                      - |-
                        [Smartphone XYZ
                        O mais avançado smartphone da linha]
                      - '{https://exemplo.com/produto1.jpg}'
                      - Copiar Código|copy:PROD123
                      - Ver no Site|https://exemplo.com/xyz
                      - |-
                        [Notebook ABC
                        O notebook ideal para profissionais]
                      - '{https://exemplo.com/produto2.jpg}'
                      - Copiar Código|copy:NOTE456
                      - Comprar Online|https://exemplo.com/abc
      responses:
        '200':
          description: Mensagens adicionadas à fila com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  folder_id:
                    type: string
                    description: ID da pasta/lote criado
                  count:
                    type: integer
                    description: Total de mensagens adicionadas à fila
                  status:
                    type: string
                    description: Status da operação
                    example: queued
        '400':
          description: Erro nos parâmetros da requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Descrição do erro
                    example: Formato de número inválido
        '401':
          description: Não autorizado - token inválido ou ausente
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Mensagem de erro
                    example: Token inválido ou ausente
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Detalhes do erro interno
  /sender/edit:
    post:
      tags:
        - Mensagem em massa
      summary: Controlar campanha de envio em massa
      description: |
        Permite controlar campanhas de envio de mensagens em massa através de diferentes ações:

        ## Ações Disponíveis:

        **🛑 stop** - Pausar campanha
        - Pausa uma campanha ativa ou agendada
        - Altera o status para "paused" 
        - Use quando quiser interromper temporariamente o envio
        - Mensagens já enviadas não são afetadas

        **▶️ continue** - Continuar campanha  
        - Retoma uma campanha pausada
        - Altera o status para "scheduled"
        - Use para continuar o envio após pausar uma campanha
        - Não funciona em campanhas já concluídas ("done")

        **🗑️ delete** - Deletar campanha
        - Remove completamente a campanha
        - Deleta apenas mensagens NÃO ENVIADAS (status "scheduled")
        - Mensagens já enviadas são preservadas no histórico
        - Operação é executada de forma assíncrona

        ## Status de Campanhas:
        - **scheduled**: Agendada para envio
        - **sending**: Enviando mensagens  
        - **paused**: Pausada pelo usuário
        - **done**: Concluída (não pode ser alterada)
        - **deleting**: Sendo deletada (operação em andamento)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                folder_id:
                  type: string
                  description: Identificador único da campanha de envio
                  example: folder_123
                action:
                  type: string
                  enum:
                    - stop
                    - continue
                    - delete
                  description: |
                    Ação a ser executada na campanha:
                    - **stop**: Pausa a campanha (muda para status "paused")
                    - **continue**: Retoma campanha pausada (muda para status "scheduled") 
                    - **delete**: Remove campanha e mensagens não enviadas (assíncrono)
                  example: stop
              required:
                - folder_id
                - action
      responses:
        '200':
          description: Ação realizada com sucesso
          content:
            application/json:
              schema:
                oneOf:
                  - type: object
                    title: Resposta para ação 'stop'
                    properties:
                      status:
                        type: string
                        enum:
                          - paused
                        description: Status da campanha após pausar
                        example: paused
                  - type: object
                    title: Resposta para ação 'continue'
                    properties:
                      status:
                        type: string
                        enum:
                          - scheduled
                        description: Status da campanha após retomar
                        example: scheduled
                      message:
                        type: string
                        description: Mensagem de confirmação
                        example: Folder resumed successfully
                  - type: object
                    title: Resposta para ação 'delete'
                    properties:
                      status:
                        type: string
                        enum:
                          - deleting
                        description: Status indicando que a deleção foi iniciada
                        example: deleting
                      message:
                        type: string
                        description: Mensagem informando que a deleção é assíncrona
                        example: Folder deletion has been initiated
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: folder_id is required
  /sender/cleardone:
    post:
      tags:
        - Mensagem em massa
      summary: Limpar mensagens enviadas
      description: >-
        Inicia processo de limpeza de mensagens antigas em lote que já foram enviadas com sucesso. Por padrão, remove
        mensagens mais antigas que 7 dias.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                hours:
                  type: integer
                  description: Quantidade de horas para manter mensagens. Mensagens mais antigas que esse valor serão removidas.
                  example: 168
                  default: 168
      responses:
        '200':
          description: Limpeza iniciada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    description: Status da operação
                    example: cleanup started
  /sender/clearall:
    delete:
      tags:
        - Mensagem em massa
      summary: Limpar toda fila de mensagens
      description: |
        Remove todas as mensagens da fila de envio em massa, incluindo mensagens pendentes e já enviadas.
        Esta é uma operação irreversível.
      responses:
        '200':
          description: Fila de mensagens limpa com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  info:
                    type: string
                    description: Mensagem de confirmação
                    example: Fila de mensagens limpa com sucesso
        '401':
          description: Não autorizado - token inválido ou ausente
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Mensagem de erro
                    example: Token inválido ou ausente
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Detalhes do erro interno
  /sender/listfolders:
    get:
      tags:
        - Mensagem em massa
      summary: Listar campanhas de envio
      description: Retorna todas as campanhas de mensagens em massa com possibilidade de filtro por status
      security: []
      parameters:
        - in: query
          name: status
          schema:
            type: string
            enum:
              - Active
              - Archived
          description: Filtrar campanhas por status
      responses:
        '200':
          description: Lista de campanhas retornada com sucesso
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: ../schemas/message_queue_folder.yaml#/MessageQueueFolder
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
  /sender/listmessages:
    post:
      tags:
        - Mensagem em massa
      summary: Listar mensagens de uma campanha
      description: Retorna a lista de mensagens de uma campanha específica, com opções de filtro por status e paginação
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                folder_id:
                  type: string
                  description: ID da campanha a ser consultada
                messageStatus:
                  type: string
                  enum:
                    - Scheduled
                    - Sent
                    - Failed
                  description: Status das mensagens para filtrar
                page:
                  type: integer
                  minimum: 1
                  default: 1
                  description: Número da página para paginação
                pageSize:
                  type: integer
                  minimum: 1
                  maximum: 1000
                  default: 1000
                  description: Quantidade de itens por página
              required:
                - folder_id
      responses:
        '200':
          description: Lista de mensagens retornada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  messages:
                    type: array
                    items:
                      $ref: ../schemas/message.yaml#/Message
                  pagination:
                    type: object
                    properties:
                      total:
                        type: integer
                        description: Total de mensagens encontradas
                      page:
                        type: integer
                        description: Página atual
                      pageSize:
                        type: integer
                        description: Itens por página
                      lastPage:
                        type: integer
                        description: Número da última página
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: folder_id is required
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to fetch messages
    components:
      schemas:
        MessageQueue:
          $ref: ../schemas/message.yaml#/Message
  /trigger/edit:
    post:
      tags:
        - Chatbot Trigger
      summary: Criar, atualizar ou excluir um trigger do chatbot
      description: |
        Endpoint para gerenciar triggers do chatbot. Suporta:
        - Criação de novos triggers
        - Atualização de triggers existentes
        - Exclusão de triggers por ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - trigger
              properties:
                id:
                  type: string
                  description: ID do trigger. Vazio para criação, obrigatório para atualização/exclusão
                delete:
                  type: boolean
                  description: Quando verdadeiro, exclui o trigger especificado pelo id
                  default: false
                trigger:
                  $ref: ../schemas/chatbot_trigger.yaml#/ChatbotTrigger
            examples:
              create:
                summary: Criar novo trigger
                value:
                  id: ''
                  delete: false
                  trigger:
                    active: true
                    type: agent
                    agent_id: ref2ed7ab21d4ea
                    ignoreGroups: true
                    lead_field: lead_status
                    lead_operator: equals
                    lead_value: novo
                    priority: 1
                    wordsToStart: ola|oi|iniciar
                    responseDelay_seconds: 6
              update:
                summary: Atualizar trigger existente
                value:
                  id: r7ab21d4
                  delete: false
                  trigger:
                    active: false
                    type: agent
                    agent_id: ref2ed7ab21d4ea
              delete:
                summary: Excluir trigger
                value:
                  id: r7ab21d4
                  delete: true
      responses:
        '200':
          description: Trigger atualizado com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/chatbot_trigger.yaml#/ChatbotTrigger
        '201':
          description: Trigger criado com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/chatbot_trigger.yaml#/ChatbotTrigger
        '400':
          description: Corpo da requisição inválido ou campos obrigatórios ausentes
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
        '404':
          description: Trigger não encontrado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
        '500':
          description: Erro no servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
  /trigger/list:
    get:
      tags:
        - Chatbot Trigger
      summary: Listar todos os triggers do chatbot
      description: Retorna a lista completa de triggers configurados para a instância atual
      parameters: []
      responses:
        '200':
          description: Lista de triggers retornada com sucesso
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: ../schemas/chatbot_trigger.yaml#/ChatbotTrigger
        '401':
          description: Não autorizado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: No session
        '500':
          description: Erro no servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to fetch triggers
  /knowledge/edit:
    post:
      tags:
        - Conhecimento dos Agentes
      summary: Criar/Editar Conhecimento do Agente
      description: |
        Gerencia o conhecimento base usado pelos agentes de IA para responder consultas.
        O conhecimento pode ser fornecido como texto direto ou através de arquivos PDF/CSV.

        Características principais:
        - Suporta criação, edição e exclusão de conhecimento
        - Aceita conteúdo em:
          - Texto puro
          - URLs públicas
          - Base64 encoded de arquivos
          - Upload direto de arquivos
        - Formatos suportados: PDF, CSV, TXT, HTML
        - Processa automaticamente qualquer formato de entrada
        - Vetoriza automaticamente o conteúdo para busca semântica

        Nota sobre URLs e Base64:
        - URLs devem ser públicas e acessíveis
        - Para PDFs/CSVs, especifique fileType se não for detectável da extensão
        - Base64 deve incluir o encoding completo do arquivo
        - O servidor detecta e processa automaticamente conteúdo Base64
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                  description: ID do conhecimento (vazio para criar novo)
                delete:
                  type: boolean
                  description: Define se é uma operação de exclusão
                knowledge:
                  type: object
                  properties:
                    isActive:
                      type: boolean
                      description: Status de ativação do conhecimento
                    tittle:
                      type: string
                      description: Título identificador do conhecimento
                    content:
                      type: string
                      description: Conteúdo textual, URL ou Base64
                fileType:
                  type: string
                  enum:
                    - pdf
                    - txt
                    - html
                    - csv
                  description: Tipo do arquivo quando não detectado automaticamente
              example:
                id: ''
                delete: false
                knowledge:
                  isActive: true
                  tittle: Informações sobre a uazapi
                  content: A uazapi foi originalmente desenvolvida...
      responses:
        '200':
          description: Conhecimento atualizado com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/chatbot_ai_knowledge.yaml#/ChatbotAIKnowledge
        '201':
          description: Novo conhecimento criado com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/chatbot_ai_knowledge.yaml#/ChatbotAIKnowledge
        '400':
          description: Requisição inválida
        '404':
          description: Conhecimento não encontrado
        '500':
          description: Erro interno do servidor
  /knowledge/list:
    get:
      tags:
        - Conhecimento dos Agentes
      summary: Listar Base de Conhecimento
      description: |
        Retorna todos os conhecimentos cadastrados para o agente de IA da instância.
        Estes conhecimentos são utilizados pelo chatbot para responder perguntas
        e interagir com os usuários de forma contextualizada.
      parameters: []
      responses:
        '200':
          description: Lista de conhecimentos recuperada com sucesso
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: ../schemas/chatbot_ai_knowledge.yaml#/ChatbotAIKnowledge
        '401':
          description: Token de autenticação ausente ou inválido
        '500':
          description: Erro interno do servidor ao buscar conhecimentos
  /function/edit:
    post:
      tags:
        - Funções API dos Agentes
      summary: Criar/Editar função para integração com APIs externas
      description: >
        # Configuração de Funções de API para Agentes IA


        Documentação para criar/editar funções utilizadas pelos agentes de IA para integração com APIs externas. Inclui
        validação automática e controle de ativação.


        ## 1. Estrutura Base da Função


        ### Campos Principais

        ```json

        {
          "name": "nomeDaFuncao",
          "description": "Descrição detalhada",
          "isActive": true,
          "method": "POST",
          "endpoint": "https://api.exemplo.com/recurso",
          "headers": {},
          "body": {},
          "parameters": []
        }

        ```


        ### Detalhamento dos Campos


        #### `name`

        - Identificador único e descritivo

        - Sem espaços ou caracteres especiais

        - Ex: "createProduct", "updateUserStatus"


        #### `description`

        - Propósito e funcionamento da função

        - Inclua casos de uso e resultados esperados

        - Ex: "Cria produto no catálogo com nome, preço e categoria"


        #### `isActive`

        - Controla disponibilidade da função

        - Desativa automaticamente se houver erros

        - Default: false


        #### `method`

        - GET: buscar dados

        - POST: criar recurso

        - PUT: atualizar completo

        - PATCH: atualização parcial

        - DELETE: remover recurso


        #### `endpoint`

        - URL completa da API

        - Aceita placeholders: {{variavel}}

        - Exemplos:
          ```
          https://api.exemplo.com/produtos
          https://api.exemplo.com/usuarios/{{userId}}
          https://api.exemplo.com/busca?q={{query}}&limit={{limit}}
          ```

        #### `headers`

        ```json

        {
          "Authorization": "Bearer {{apiKey}}",
          "Content-Type": "application/json",
          "Accept": "application/json"
        }

        ```


        #### `body` (POST/PUT/PATCH)

        ```json

        {
          "name": "{{productName}}",
          "price": "{{price}}",
          "metadata": {
            "tags": "{{tags}}"
          }
        }

        ```


        ## 2. Configuração de Parâmetros


        ### Estrutura do Parâmetro

        ```json

        {
          "name": "nomeParametro",
          "type": "string",
          "description": "Descrição do uso",
          "required": true,
          "enum": "valor1,valor2,valor3",
          "minimum": 0,
          "maximum": 100
        }

        ```


        ### Tipos de Parâmetros


        #### String

        ```json

        {
          "name": "status",
          "type": "string",
          "description": "Status do pedido",
          "required": true,
          "enum": "pending,processing,completed"
        }

        ```


        #### Número

        ```json

        {
          "name": "price",
          "type": "number",
          "description": "Preço em reais",
          "required": true,
          "minimum": 0.01,
          "maximum": 99999.99
        }

        ```


        #### Inteiro

        ```json

        {
          "name": "quantity",
          "type": "integer",
          "description": "Quantidade",
          "minimum": 0,
          "maximum": 1000
        }

        ```


        #### Boolean

        ```json

        {
          "name": "active",
          "type": "boolean",
          "description": "Status de ativação"
        }

        ```


        ## 3. Sistema de Validação


        ### Validações Automáticas

        1. JSON
          - Headers e body devem ser válidos
          - Erros desativam a função

        2. Placeholders ({{variavel}})
          - Case-sensitive
          - Devem ter parâmetro correspondente

        3. Parâmetros
          - Nomes únicos
          - Tipos corretos
          - Limites numéricos válidos
          - Enums sem valores vazios

        ### Erros e Avisos

        - Função desativa se houver:
          - JSON inválido
          - Parâmetros não documentados
          - Violações de tipo
        - Erros aparecem em `undocumentedParameters`


        ## 4. Exemplo Completo


        ```json

        {
          "name": "createProduct",
          "description": "Criar novo produto no catálogo",
          "isActive": true,
          "method": "POST",
          "endpoint": "https://api.store.com/v1/products",
          "headers": {
            "Authorization": "Bearer {{apiKey}}",
            "Content-Type": "application/json"
          },
          "body": {
            "name": "{{productName}}",
            "price": "{{price}}",
            "category": "{{category}}"
          },
          "parameters": [
            {
              "name": "apiKey",
              "type": "string",
              "description": "Chave de API",
              "required": true
            },
            {
              "name": "productName",
              "type": "string",
              "description": "Nome do produto",
              "required": true
            },
            {
              "name": "price",
              "type": "number",
              "description": "Preço em reais",
              "required": true,
              "minimum": 0.01
            },
            {
              "name": "category",
              "type": "string",
              "description": "Categoria do produto",
              "required": true,
              "enum": "electronics,clothing,books"
            }
          ]
        }

        ```
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - id
                - delete
                - function
              properties:
                id:
                  type: string
                  description: ID da função. Vazio para criar nova, preenchido para editar existente.
                delete:
                  type: boolean
                  description: Se true, deleta a função especificada pelo ID.
                function:
                  type: object
                  required:
                    - name
                    - description
                    - method
                    - endpoint
                  properties:
                    name:
                      type: string
                      description: Nome da função
                      example: createProduct
                    isActive:
                      type: boolean
                      description: Status de ativação da função
                      default: false
                    description:
                      type: string
                      description: Descrição detalhada da função e seu propósito
                      example: Cria um novo produto no catálogo
                    method:
                      type: string
                      description: Método HTTP da requisição
                      enum:
                        - GET
                        - POST
                        - PUT
                        - DELETE
                        - PATCH
                      example: POST
                    endpoint:
                      type: string
                      description: URL do endpoint da API
                      example: https://api.example.com/products
                    headers:
                      type: object
                      description: Cabeçalhos da requisição. Suporta placeholders no formato {{variavel}}
                      example:
                        Authorization: Bearer {{apiKey}}
                        Content-Type: application/json
                    body:
                      type: object
                      description: Corpo da requisição. Suporta placeholders no formato {{variavel}}
                      example:
                        name: '{{productName}}'
                        price: '{{price}}'
                        category: '{{category}}'
                    parameters:
                      type: array
                      description: Lista de parâmetros aceitos pela função
                      items:
                        type: object
                        required:
                          - name
                          - type
                          - description
                        properties:
                          name:
                            type: string
                            description: Nome do parâmetro
                          type:
                            type: string
                            enum:
                              - string
                              - number
                              - integer
                              - boolean
                              - array
                              - object
                            description: Tipo do parâmetro
                          description:
                            type: string
                            description: Descrição do parâmetro
                          required:
                            type: boolean
                            description: Indica se o parâmetro é obrigatório
                          enum:
                            type: string
                            description: Lista de valores permitidos para parâmetros do tipo string, separados por vírgula
                          minimum:
                            type: number
                            description: Valor mínimo para parâmetros numéricos
                          maximum:
                            type: number
                            description: Valor máximo para parâmetros numéricos
                      example:
                        - name: apiKey
                          type: string
                          description: Chave de API para autenticação
                          required: true
                        - name: price
                          type: number
                          description: Preço do produto
                          minimum: 0.01
                          maximum: 999999.99
                          required: true
      responses:
        '200':
          description: Função atualizada com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/chatbot_ai_function.yaml#/ChatbotAIFunction
        '201':
          description: Nova função criada com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/chatbot_ai_function.yaml#/ChatbotAIFunction
        '400':
          description: Erro de validação nos dados fornecidos
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
        '404':
          description: Função não encontrada
        '500':
          description: Erro interno do servidor
  /function/list:
    get:
      tags:
        - Funções API dos Agentes
      summary: Lista todas as funções de API
      description: Retorna todas as funções de API configuradas para a instância atual
      responses:
        '200':
          description: Lista de funções recuperada com sucesso
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: ../schemas/chatbot_ai_function.yaml#/ChatbotAIFunction
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
  /chat/block:
    post:
      summary: Bloqueia ou desbloqueia contato do WhatsApp
      description: |
        Bloqueia ou desbloqueia um contato do WhatsApp. Contatos bloqueados não podem enviar mensagens 
        para a instância e a instância não pode enviar mensagens para eles.
      tags:
        - Bloqueios
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do WhatsApp no formato internacional (ex. 5511999999999)
                  example: '5511999999999'
                block:
                  type: boolean
                  description: True para bloquear, False para desbloquear
                  example: true
              required:
                - number
                - block
      responses:
        '200':
          description: Operação realizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    description: Mensagem de confirmação
                    example: Blocked successfully
                  blockList:
                    type: array
                    description: Lista atualizada de contatos bloqueados
                    items:
                      type: string
                    example:
                      - 5511999999999@s.whatsapp.net
                      - 5511888888888@s.whatsapp.net
        '401':
          description: Não autorizado - token inválido
        '404':
          description: Contato não encontrado
        '500':
          description: Erro do servidor ao processar a requisição
  /chat/blocklist:
    get:
      summary: Lista contatos bloqueados
      description: |
        Retorna a lista completa de contatos que foram bloqueados pela instância.
        Esta lista é atualizada em tempo real conforme contatos são bloqueados/desbloqueados.
      tags:
        - Bloqueios
      responses:
        '200':
          description: Lista de contatos bloqueados recuperada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  blockList:
                    type: array
                    items:
                      type: string
                      description: JIDs dos contatos bloqueados no formato "número@s.whatsapp.net"
                    example:
                      - 5511999999999@s.whatsapp.net
                      - 5511888888888@s.whatsapp.net
        '401':
          description: Token inválido ou não fornecido
        '500':
          description: Erro interno do servidor ou instância não conectada
  /chat/labels:
    post:
      summary: Gerencia labels de um chat
      description: >
        Atualiza as labels associadas a um chat específico. Este endpoint oferece três modos de operação:


        1. **Definir todas as labels** (labelids): Define o conjunto completo de labels para o chat, substituindo labels
        existentes

        2. **Adicionar uma label** (add_labelid): Adiciona uma única label ao chat sem afetar as existentes

        3. **Remover uma label** (remove_labelid): Remove uma única label do chat sem afetar as outras


        **Importante**: Use apenas um dos três parâmetros por requisição. Labels inexistentes serão rejeitadas.


        As labels devem ser fornecidas no formato id ou labelid encontradas na função get labels.
      tags:
        - Etiquetas
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do chat ou grupo
                  example: '5511999999999'
                labelids:
                  type: array
                  items:
                    type: string
                  description: Lista de IDs das labels a serem aplicadas ao chat (define todas as labels)
                  example:
                    - '10'
                    - '20'
                add_labelid:
                  type: string
                  description: ID da label a ser adicionada ao chat
                  example: '10'
                remove_labelid:
                  type: string
                  description: ID da label a ser removida do chat
                  example: '20'
              required:
                - number
              oneOf:
                - required:
                    - labelids
                - required:
                    - add_labelid
                - required:
                    - remove_labelid
            examples:
              definir_todas_labels:
                summary: Definir todas as labels do chat
                description: Define o conjunto completo de labels, substituindo as existentes
                value:
                  number: '5511999999999'
                  labelids:
                    - '10'
                    - '20'
                    - '30'
              adicionar_label:
                summary: Adicionar uma label ao chat
                description: Adiciona uma única label sem afetar as existentes
                value:
                  number: '5511999999999'
                  add_labelid: '10'
              remover_label:
                summary: Remover uma label do chat
                description: Remove uma única label sem afetar as outras
                value:
                  number: '5511999999999'
                  remove_labelid: '20'
      responses:
        '200':
          description: Labels atualizadas com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    description: Mensagem de confirmação
                  editions:
                    type: array
                    items:
                      type: string
                    description: Lista de operações realizadas (apenas para operação labelids)
              examples:
                definir_todas_labels:
                  summary: Resposta para definir todas as labels
                  value:
                    response: Labels updated successfully
                    editions:
                      - Added label 10 to chat
                      - Added label 20 to chat
                      - Removed label 5 from chat
                adicionar_label:
                  summary: Resposta para adicionar uma label
                  value:
                    response: Label added to chat
                remover_label:
                  summary: Resposta para remover uma label
                  value:
                    response: Label removed from chat
        '400':
          description: Erro na requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: 'Use only one operation: labelids, add_labelid, or remove_labelid'
        '404':
          description: Chat não encontrado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Chat not found
  /chat/delete:
    post:
      summary: Deleta chat
      description: |
        Deleta um chat e/ou suas mensagens do WhatsApp e/ou banco de dados. 
        Você pode escolher deletar:
        - Apenas do WhatsApp
        - Apenas do banco de dados
        - Apenas as mensagens do banco de dados
        - Qualquer combinação das opções acima
      tags:
        - Chats
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: |
                    Número do chat no formato internacional.
                    Para grupos use o ID completo do grupo.
                  example: '5511999999999'
                deleteChatDB:
                  type: boolean
                  description: Se true, deleta o chat do banco de dados
                  default: false
                  example: true
                deleteMessagesDB:
                  type: boolean
                  description: Se true, deleta todas as mensagens do chat do banco de dados
                  default: false
                  example: true
                deleteChatWhatsApp:
                  type: boolean
                  description: Se true, deleta o chat do WhatsApp
                  default: false
                  example: true
              required:
                - number
      responses:
        '200':
          description: Operação realizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    description: Mensagem de sucesso
                    example: Chat deletion process completed
                  actions:
                    type: array
                    description: Lista de ações realizadas
                    items:
                      type: string
                    example:
                      - Chat deleted from WhatsApp
                      - Chat deleted from database
                      - 'Messages associated with chat deleted from database: 42'
                  errors:
                    type: array
                    description: Lista de erros ocorridos, se houver
                    items:
                      type: string
                    example:
                      - 'Error deleting chat from WhatsApp: connection timeout'
        '400':
          description: Erro nos parâmetros da requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Missing number in payload
        '401':
          description: Token inválido ou não fornecido
        '404':
          description: Chat não encontrado
        '500':
          description: Erro interno do servidor
  /chat/archive:
    post:
      summary: Arquivar/desarquivar chat
      description: |
        Altera o estado de arquivamento de um chat do WhatsApp.
        - Quando arquivado, o chat é movido para a seção de arquivados no WhatsApp
        - A ação é sincronizada entre todos os dispositivos conectados
        - Não afeta as mensagens ou o conteúdo do chat
      tags:
        - Chats
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - number
                - archive
              properties:
                number:
                  type: string
                  description: Número do telefone (formato E.164) ou ID do grupo
                  example: '5511999999999'
                archive:
                  type: boolean
                  description: true para arquivar, false para desarquivar
                  example: true
      responses:
        '200':
          description: Chat arquivado/desarquivado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Chat updated successfully
        '400':
          description: Dados da requisição inválidos
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid phone number format
        '401':
          description: Token de autenticação ausente ou inválido
        '500':
          description: Erro ao executar a operação
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Error archiving chat
  /chat/read:
    post:
      summary: Marcar chat como lido/não lido
      description: |
        Atualiza o status de leitura de um chat no WhatsApp.

        Quando um chat é marcado como lido:
        - O contador de mensagens não lidas é zerado
        - O indicador visual de mensagens não lidas é removido
        - O remetente recebe confirmação de leitura (se ativado)

        Quando marcado como não lido:
        - O chat aparece como pendente de leitura
        - Não afeta as confirmações de leitura já enviadas
      tags:
        - Chats
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - number
                - read
              properties:
                number:
                  type: string
                  description: |
                    Identificador do chat no formato:
                    - Para usuários: [número]@s.whatsapp.net (ex: 5511999999999@s.whatsapp.net)
                    - Para grupos: [id-grupo]@g.us (ex: 123456789-987654321@g.us)
                  example: 5511999999999@s.whatsapp.net
                read:
                  type: boolean
                  description: |
                    - true: marca o chat como lido
                    - false: marca o chat como não lido
      responses:
        '200':
          description: Status de leitura atualizado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Chat read status updated successfully
        '401':
          description: Token de autenticação ausente ou inválido
        '404':
          description: Chat não encontrado
        '500':
          description: Erro ao atualizar status de leitura
  /chat/mute:
    post:
      summary: Silenciar chat
      description: |
        Silencia notificações de um chat por um período específico. 
        As opções de silenciamento são:
        * 0 - Remove o silenciamento
        * 8 - Silencia por 8 horas
        * 168 - Silencia por 1 semana (168 horas)
        * -1 - Silencia permanentemente
      tags:
        - Chats
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - number
                - muteEndTime
              properties:
                number:
                  type: string
                  description: ID do chat no formato 123456789@s.whatsapp.net ou 123456789-123456@g.us
                  example: 5511999999999@s.whatsapp.net
                muteEndTime:
                  type: integer
                  description: |
                    Duração do silenciamento:
                    * 0 = Remove silenciamento
                    * 8 = Silencia por 8 horas
                    * 168 = Silencia por 1 semana
                    * -1 = Silencia permanentemente
                  enum:
                    - 0
                    - 8
                    - 168
                    - -1
                  example: 8
      responses:
        '200':
          description: Chat silenciado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Chat mute settings updated successfully
        '400':
          description: Duração inválida ou formato de número incorreto
        '401':
          description: Token inválido ou ausente
        '404':
          description: Chat não encontrado
  /chat/pin:
    post:
      summary: Fixar/desafixar chat
      description: |
        Fixa ou desafixa um chat no topo da lista de conversas. Chats fixados permanecem 
        no topo mesmo quando novas mensagens são recebidas em outros chats.
      tags:
        - Chats
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: |
                    Número do chat no formato internacional completo (ex: "5511999999999") 
                    ou ID do grupo (ex: "123456789-123456@g.us")
                  example: '5511999999999'
                pin:
                  type: boolean
                  description: |
                    Define se o chat deve ser fixado (true) ou desafixado (false)
                  example: true
              required:
                - number
                - pin
      responses:
        '200':
          description: Chat fixado/desafixado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    description: Mensagem de confirmação
                    example: Chat pinned
        '400':
          description: Erro na requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Descrição do erro
                    example: Could not parse phone
        '401':
          description: Não autorizado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Mensagem de erro de autenticação
                    example: Invalid token
  /chat/find:
    post:
      summary: Busca chats com filtros
      description: |
        Busca chats com diversos filtros e ordenação. Suporta filtros em todos os campos do chat, 
        paginação e ordenação customizada.

        Operadores de filtro:
        - `~` : LIKE (contém)
        - `!~` : NOT LIKE (não contém)
        - `!=` : diferente
        - `>=` : maior ou igual
        - `>` : maior que
        - `<=` : menor ou igual
        - `<` : menor que
        - Sem operador: LIKE (contém)
      tags:
        - Chats
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                operator:
                  type: string
                  enum:
                    - AND
                    - OR
                  default: AND
                  description: Operador lógico entre os filtros
                sort:
                  type: string
                  description: Campo para ordenação (+/-campo). Ex -wa_lastMsgTimestamp
                limit:
                  type: integer
                  description: Limite de resultados por página
                  default: 2000
                offset:
                  type: integer
                  description: Offset para paginação
                  default: 0
                wa_fastid:
                  type: string
                wa_chatid:
                  type: string
                wa_archived:
                  type: boolean
                wa_contactName:
                  type: string
                wa_name:
                  type: string
                name:
                  type: string
                wa_isBlocked:
                  type: boolean
                wa_isGroup:
                  type: boolean
                wa_isGroup_admin:
                  type: boolean
                wa_isGroup_announce:
                  type: boolean
                wa_isGroup_member:
                  type: boolean
                wa_isPinned:
                  type: boolean
                wa_label:
                  type: string
                lead_tags:
                  type: string
                lead_isTicketOpen:
                  type: boolean
                lead_assignedAttendant_id:
                  type: string
                lead_status:
                  type: string
              example:
                operator: AND
                sort: '-wa_lastMsgTimestamp'
                limit: 50
                offset: 0
                wa_isGroup: true
                lead_status: ~novo
                wa_label: ~importante
      responses:
        '200':
          description: Lista de chats encontrados
          content:
            application/json:
              schema:
                type: object
                properties:
                  chats:
                    type: array
                    items:
                      $ref: ../schemas/chat.yaml#/Chat
                  totalChatsStats:
                    type: object
                    description: Contadores totais de chats
                  pagination:
                    type: object
                    properties:
                      totalRecords:
                        type: integer
                      pageSize:
                        type: integer
                      currentPage:
                        type: integer
                      totalPages:
                        type: integer
  /chat/count:
    get:
      summary: Retorna contadores de chats
      description: |
        Retorna estatísticas e contadores agregados dos chats, incluindo:
        - Total de chats
        - Chats não lidos
        - Chats arquivados
        - Chats fixados
        - Chats bloqueados
        - Grupos e status de grupos
      tags:
        - Chats
      responses:
        '200':
          description: Contadores retornados com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  total_chats:
                    type: integer
                    description: Número total de chats
                  unread_chats:
                    type: integer
                    description: Número de chats com mensagens não lidas
                  archived_chats:
                    type: integer
                    description: Número de chats arquivados
                  pinned_chats:
                    type: integer
                    description: Número de chats fixados
                  blocked_chats:
                    type: integer
                    description: Número de contatos bloqueados
                  groups:
                    type: integer
                    description: Número total de grupos
                  admin_groups:
                    type: integer
                    description: Número de grupos onde é administrador
                  member_groups:
                    type: integer
                    description: Número de grupos onde é membro
                example:
                  total_chats: 150
                  unread_chats: 5
                  archived_chats: 10
                  pinned_chats: 3
                  blocked_chats: 2
                  groups: 8
                  admin_groups: 3
                  member_groups: 5
        '401':
          description: Não autorizado - token inválido
        '500':
          description: Erro interno do servidor
  /chat/editLead:
    post:
      summary: Edita informações de lead
      description: |
        Atualiza as informações de lead associadas a um chat. Permite modificar status do ticket, 
        atribuição de atendente, posição no kanban, tags e outros campos customizados.

        As alterações são refletidas imediatamente no banco de dados e disparam eventos webhook/SSE
        para manter a aplicação sincronizada.
      tags:
        - CRM
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - id
              properties:
                id:
                  type: string
                  description: |
                    Identificador do chat. Pode ser:
                    - wa_chatid (ex: "5511999999999@s.whatsapp.net")
                    - wa_fastid (ex: "5511888888888:5511999999999")
                  example: 5511999999999@s.whatsapp.net
                chatbot_disableUntil:
                  type: integer
                  format: int64
                  description: |
                    Timestamp UTC até quando o chatbot deve ficar desativado para este chat.
                    Use 0 para reativar imediatamente.
                  example: 1735686000
                lead_isTicketOpen:
                  type: boolean
                  description: |
                    Status do ticket associado ao lead.
                    - true: Ticket está aberto/em atendimento
                    - false: Ticket está fechado/resolvido
                  example: true
                lead_assignedAttendant_id:
                  type: string
                  description: |
                    ID do atendente atribuído ao lead.
                    Use string vazia ("") para remover a atribuição.
                  example: att_123456
                lead_kanbanOrder:
                  type: integer
                  format: int64
                  description: |
                    Posição do card no quadro kanban.
                    Valores maiores aparecem primeiro.
                  example: 1000
                lead_tags:
                  type: array
                  items:
                    type: string
                  description: |
                    Lista de tags associadas ao lead.
                    Tags inexistentes são criadas automaticamente.
                    Envie array vazio ([]) para remover todas as tags.
                  example:
                    - vip
                    - suporte
                    - prioridade-alta
                lead_name:
                  type: string
                  description: Nome principal do lead
                  example: João Silva
                lead_fullName:
                  type: string
                  description: Nome completo do lead
                  example: João Silva Pereira
                lead_email:
                  type: string
                  format: email
                  description: Email do lead
                  example: joao@exemplo.com
                lead_personalId:
                  type: string
                  description: |
                    Documento de identificação (CPF/CNPJ)
                    Apenas números ou formatado
                  example: 123.456.789-00
                lead_status:
                  type: string
                  description: Status do lead no funil de vendas
                  example: qualificado
                lead_notes:
                  type: string
                  description: Anotações sobre o lead
                  example: Cliente interessado em plano premium
                lead_field01:
                  type: string
                  description: Campo personalizado 1
                lead_field02:
                  type: string
                  description: Campo personalizado 2
                lead_field03:
                  type: string
                  description: Campo personalizado 3
                lead_field04:
                  type: string
                  description: Campo personalizado 4
                lead_field05:
                  type: string
                  description: Campo personalizado 5
                lead_field06:
                  type: string
                  description: Campo personalizado 6
                lead_field07:
                  type: string
                  description: Campo personalizado 7
                lead_field08:
                  type: string
                  description: Campo personalizado 8
                lead_field09:
                  type: string
                  description: Campo personalizado 9
                lead_field10:
                  type: string
                  description: Campo personalizado 10
                lead_field11:
                  type: string
                  description: Campo personalizado 11
                lead_field12:
                  type: string
                  description: Campo personalizado 12
                lead_field13:
                  type: string
                  description: Campo personalizado 13
                lead_field14:
                  type: string
                  description: Campo personalizado 14
                lead_field15:
                  type: string
                  description: Campo personalizado 15
                lead_field16:
                  type: string
                  description: Campo personalizado 16
                lead_field17:
                  type: string
                  description: Campo personalizado 17
                lead_field18:
                  type: string
                  description: Campo personalizado 18
                lead_field19:
                  type: string
                  description: Campo personalizado 19
                lead_field20:
                  type: string
                  description: Campo personalizado 20
      responses:
        '200':
          description: Lead atualizado com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/chat.yaml#/Chat
              example:
                wa_fastid: '5511888888888:5511999999999'
                wa_chatid: 5511999999999@s.whatsapp.net
                lead_name: João Silva
                lead_status: qualificado
                lead_tags:
                  - vip
                  - suporte
                lead_isTicketOpen: true
                lead_assignedAttendant_id: att_123456
        '400':
          description: Payload inválido
        '404':
          description: Chat não encontrado
        '500':
          description: Erro interno do servidor
  /contacts:
    get:
      tags:
        - Contatos
      summary: Retorna lista de contatos do WhatsApp
      description: |
        Retorna a lista de contatos salvos na agenda do celular e que estão no WhatsApp.

        O endpoint realiza:
        - Busca todos os contatos armazenados
        - Retorna dados formatados incluindo JID e informações de nome
      security:
        - token: []
      responses:
        '200':
          description: Lista de contatos retornada com sucesso
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    jid:
                      type: string
                      description: 'ID único do contato no WhatsApp (formato: número@s.whatsapp.net)'
                      example: 5511999999999@s.whatsapp.net
                    contactName:
                      type: string
                      description: Nome completo do contato
                      example: João Silva
                    contact_FirstName:
                      type: string
                      description: Primeiro nome do contato
                      example: João
        '401':
          description: Sem sessão ativa
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: No session
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Internal server error
  /contact/add:
    post:
      tags:
        - Contatos
      summary: Adiciona um contato à agenda
      description: |
        Adiciona um novo contato à agenda do celular.

        O endpoint realiza:
        - Adiciona o contato à agenda usando o WhatsApp
        - Usa o campo 'name' tanto para o nome completo quanto para o primeiro nome
        - Salva as informações do contato na agenda do WhatsApp
        - Retorna informações do contato adicionado
      security:
        - token: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - phone
                - name
              properties:
                phone:
                  type: string
                  description: |
                    Número de telefone no formato internacional com código do país obrigatório. 
                    Para Brasil, deve começar com 55. Aceita variações com/sem símbolo +, 
                    com/sem parênteses, com/sem hífen e com/sem espaços. Também aceita formato 
                    JID do WhatsApp (@s.whatsapp.net). Não aceita contatos comerciais (@lid) 
                    nem grupos (@g.us).
                  examples:
                    - +55 (21) 99999-9999
                    - +55 21 99999-9999
                    - +55 21 999999999
                    - '+5521999999999'
                    - '5521999999999'
                    - 5521999999999@s.whatsapp.net
                name:
                  type: string
                  description: Nome completo do contato (será usado como primeiro nome e nome completo)
                  example: João Silva
      responses:
        '200':
          description: Contato adicionado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: Contato adicionado com sucesso
                  contact:
                    type: object
                    properties:
                      jid:
                        type: string
                        description: 'ID único do contato no WhatsApp (formato: número@s.whatsapp.net)'
                        example: 5511999999999@s.whatsapp.net
                      name:
                        type: string
                        description: Nome completo do contato
                        example: João Silva
                      phone:
                        type: string
                        description: Número de telefone
                        example: '5511999999999'
        '400':
          description: Dados inválidos na requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Número de telefone inválido
        '401':
          description: Sem sessão ativa
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: No session
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Erro ao adicionar contato
  /contact/remove:
    post:
      tags:
        - Contatos
      summary: Remove um contato da agenda
      description: |
        Remove um contato da agenda do celular.

        O endpoint realiza:
        - Remove o contato da agenda usando o WhatsApp AppState
        - Atualiza a lista de contatos sincronizada
        - Retorna confirmação da remoção
      security:
        - token: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - phone
              properties:
                phone:
                  type: string
                  description: |
                    Número de telefone no formato internacional com código do país obrigatório. 
                    Para Brasil, deve começar com 55. Aceita variações com/sem símbolo +, 
                    com/sem parênteses, com/sem hífen e com/sem espaços. Também aceita formato 
                    JID do WhatsApp (@s.whatsapp.net). Não aceita contatos comerciais (@lid) 
                    nem grupos (@g.us).
                  examples:
                    - +55 (21) 99999-9999
                    - +55 21 99999-9999
                    - +55 21 999999999
                    - '+5521999999999'
                    - '5521999999999'
                    - 5521999999999@s.whatsapp.net
      responses:
        '200':
          description: Contato removido com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: Contato removido com sucesso
                  removed_contact:
                    type: object
                    properties:
                      jid:
                        type: string
                        description: 'ID único do contato no WhatsApp (formato: número@s.whatsapp.net)'
                        example: 5511999999999@s.whatsapp.net
                      phone:
                        type: string
                        description: Número de telefone removido
                        example: '5511999999999'
        '400':
          description: Dados inválidos na requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Número de telefone inválido
        '401':
          description: Sem sessão ativa
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: No session
        '404':
          description: Contato não encontrado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Contato não encontrado na agenda
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Erro ao remover contato
  /chat/details:
    post:
      tags:
        - Contatos
      summary: Obter Detalhes Completos
      description: >
        Retorna informações **completas** sobre um contato ou chat, incluindo **todos os campos disponíveis** do modelo
        Chat.


        ### Funcionalidades:

        - **Retorna chat completo**: Todos os campos do modelo Chat (mais de 60 campos)

        - **Busca informações para contatos individuais e grupos**

        - **URLs de imagem em dois tamanhos**: preview (menor) ou full (original)

        - **Combina informações de diferentes fontes**: WhatsApp, contatos salvos, leads

        - **Atualiza automaticamente dados desatualizados** no banco


        ### Campos Retornados:

        - **Informações básicas**: id, wa_fastid, wa_chatid, owner, name, phone

        - **Dados do WhatsApp**: wa_name, wa_contactName, wa_archived, wa_isBlocked, etc.

        - **Dados de lead/CRM**: lead_name, lead_email, lead_status, lead_field01-20, etc.

        - **Informações de grupo**: wa_isGroup, wa_isGroup_admin, wa_isGroup_announce, etc.

        - **Chatbot**: chatbot_summary, chatbot_lastTrigger_id, chatbot_disableUntil, etc.

        - **Configurações**: wa_muteEndTime, wa_isPinned, wa_unreadCount, etc.


        **Comportamento**:

        - Para contatos individuais:
          - Busca nome verificado do WhatsApp
          - Verifica nome salvo nos contatos
          - Formata número internacional
          - Calcula grupos em comum
        - Para grupos:
          - Busca nome do grupo
          - Verifica status de comunidade
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do telefone ou ID do grupo
                  example: '5511999999999'
                preview:
                  type: boolean
                  description: |
                    Controla o tamanho da imagem de perfil retornada:
                    - `true`: Retorna imagem em tamanho preview (menor, otimizada para listagens)
                    - `false` (padrão): Retorna imagem em tamanho full (resolução original, maior qualidade)
                  default: false
              required:
                - number
      responses:
        '200':
          description: Informações completas do chat retornadas com sucesso
          content:
            application/json:
              schema:
                allOf:
                  - $ref: ../schemas/chat.yaml#/Chat
                  - type: object
                    properties:
                      wa_common_groups:
                        type: string
                        description: 'Grupos em comum separados por vírgula, formato: nome_grupo(id_grupo)'
                        example: Grupo Família(120363123456789012@g.us),Trabalho(987654321098765432@g.us)
                      imagePreview:
                        type: string
                        description: URL da imagem de perfil em tamanho preview (menor) - apenas se preview=true
                      image:
                        type: string
                        description: URL da imagem de perfil em tamanho full (resolução original) - apenas se preview=false
              examples:
                contact_example:
                  summary: Contato individual
                  description: Exemplo de resposta para um contato individual
                  value:
                    id: r1a2b3c4d5e6f7
                    wa_fastid: admin:5511999999999
                    wa_chatid: 5511999999999@s.whatsapp.net
                    wa_name: João Silva
                    name: João Silva
                    phone: +55 11 99999-9999
                    owner: admin
                    wa_archived: false
                    wa_isBlocked: false
                    wa_isGroup: false
                    lead_name: João
                    lead_fullName: João Silva
                    lead_email: joao@exemplo.com
                    lead_status: ativo
                    wa_contactName: João Silva
                    wa_common_groups: Grupo Família(120363123456789012@g.us),Trabalho(987654321098765432@g.us)
                    image: https://pps.whatsapp.net/v/t61.24694-24/12345_image.jpg
                group_example:
                  summary: Grupo
                  description: Exemplo de resposta para um grupo
                  value:
                    id: r9z8y7x6w5v4u3
                    wa_fastid: admin:120363123456789012@g.us
                    wa_chatid: 120363123456789012@g.us
                    wa_name: Grupo Família
                    name: Grupo Família
                    phone: ''
                    owner: admin
                    wa_archived: false
                    wa_isBlocked: false
                    wa_isGroup: true
                    wa_isGroup_admin: true
                    wa_isGroup_announce: false
                    wa_isGroup_community: false
                    wa_isGroup_member: true
                    image: https://pps.whatsapp.net/v/t61.24694-24/67890_group.jpg
        '400':
          description: Payload inválido ou número inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid request payload
        '401':
          description: Token não fornecido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Unauthorized
        '500':
          description: Erro interno do servidor ou sessão não iniciada
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: No session
  /chat/check:
    post:
      tags:
        - Contatos
      summary: Verificar Números no WhatsApp
      description: |
        Verifica se números fornecidos estão registrados no WhatsApp e retorna informações detalhadas.

        ### Funcionalidades:
        - Verifica múltiplos números simultaneamente
        - Suporta números individuais e IDs de grupo
        - Retorna nome verificado quando disponível
        - Identifica grupos e comunidades
        - Verifica subgrupos de comunidades

        **Comportamento específico**:
        - Para números individuais:
          - Verifica registro no WhatsApp
          - Retorna nome verificado se disponível
          - Normaliza formato do número
        - Para grupos:
          - Verifica existência
          - Retorna nome do grupo
          - Retorna id do grupo de anúncios se buscado por id de comunidade
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                numbers:
                  type: array
                  items:
                    type: string
                  description: Lista de números ou IDs de grupo para verificar
                  example:
                    - '5511999999999'
                    - 123456789@g.us
      responses:
        '200':
          description: Resultado da verificação
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    query:
                      type: string
                      description: Número/ID original consultado
                    jid:
                      type: string
                      description: JID do WhatsApp
                    lid:
                      type: string
                      description: LID do WhatsApp
                    isInWhatsapp:
                      type: boolean
                      description: Indica se está no WhatsApp
                    verifiedName:
                      type: string
                      description: Nome verificado se disponível
                    groupName:
                      type: string
                      description: Nome do grupo se aplicável
                    error:
                      type: string
                      description: Mensagem de erro se houver
        '400':
          description: Payload inválido ou sem números
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Missing numbers in payload
        '401':
          description: Sem sessão ativa
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: No active session
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: WhatsApp client is not connected
  /label/edit:
    post:
      tags:
        - Etiquetas
      summary: Editar etiqueta
      description: |
        Edita uma etiqueta existente na instância.
        Permite alterar nome, cor ou deletar a etiqueta.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                labelid:
                  type: string
                  description: ID da etiqueta a ser editada
                  example: '25'
                name:
                  type: string
                  description: Novo nome da etiqueta
                  example: responder editado
                color:
                  type: integer
                  description: Código numérico da nova cor (0-19)
                  minimum: 0
                  maximum: 19
                  example: 2
                delete:
                  type: boolean
                  description: Indica se a etiqueta deve ser deletada
                  example: false
              required:
                - labelid
      responses:
        '200':
          description: Etiqueta editada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Label edited
        '400':
          description: Payload inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: invalid payload
        '500':
          description: Erro interno do servidor ou sessão inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: error editing label
  /labels:
    get:
      tags:
        - Etiquetas
      summary: Buscar todas as etiquetas
      description: |
        Retorna a lista completa de etiquetas da instância.
      responses:
        '200':
          description: Lista de etiquetas retornada com sucesso
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: ../schemas/label.yaml#/Label
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to fetch labels from database
  /quickreply/edit:
    post:
      tags:
        - Respostas Rápidas
      summary: Criar, atualizar ou excluir resposta rápida
      description: |
        Gerencia templates de respostas rápidas para agilizar o atendimento. Suporta mensagens de texto e mídia.

        - Para criar: não inclua o campo `id`
        - Para atualizar: inclua o `id` existente
        - Para excluir: defina `delete: true` e inclua o `id`

        Observação: Templates originados do WhatsApp (onWhatsApp=true) não podem ser modificados ou excluídos.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - shortCut
                - type
              properties:
                id:
                  type: string
                  description: Necessário para atualizações/exclusões, omitir para criação
                  example: rb9da9c03637452
                delete:
                  type: boolean
                  description: Definir como true para excluir o template
                  default: false
                shortCut:
                  type: string
                  description: Atalho para acesso rápido ao template
                  example: saudacao1
                type:
                  type: string
                  enum:
                    - text
                    - audio
                    - myaudio
                    - ptt
                    - document
                    - video
                    - image
                  description: Tipo da mensagem
                text:
                  type: string
                  description: Obrigatório para mensagens do tipo texto
                  example: Olá! Como posso ajudar hoje?
                file:
                  type: string
                  description: URL ou Base64 para tipos de mídia
                  example: https://exemplo.com/arquivo.pdf
                docName:
                  type: string
                  description: Nome do arquivo opcional para tipo documento
                  example: apresentacao.pdf
      responses:
        '200':
          description: Operação concluída com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Operação concluída com sucesso
                  quickReplies:
                    type: array
                    items:
                      $ref: ../schemas/quick_reply.yaml#/QuickReply
        '400':
          description: Requisição inválida (erro de validação)
        '403':
          description: Não é possível modificar template originado do WhatsApp
        '404':
          description: Template não encontrado
        '500':
          description: Erro no servidor
  /quickreply/showall:
    get:
      tags:
        - Respostas Rápidas
      summary: Listar todas as respostas rápidas
      description: Retorna todas as respostas rápidas cadastradas para a instância autenticada
      responses:
        '200':
          description: Lista de respostas rápidas
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: ../schemas/quick_reply.yaml#/QuickReply
        '500':
          description: Erro no servidor
  /call/make:
    post:
      tags:
        - Chamadas
      summary: Iniciar chamada de voz
      description: >
        Inicia uma chamada de voz para um contato específico. Este endpoint permite:

        1. Iniciar chamadas de voz para contatos

        2. Funciona apenas com números válidos do WhatsApp

        3. O contato receberá uma chamada de voz


        **Nota**: O telefone do contato tocará normalmente, mas ao contato atender, ele não ouvirá nada, e você também
        não ouvirá nada. 

        Este endpoint apenas inicia a chamada, não estabelece uma comunicação de voz real.


        Exemplo de requisição:

        ```json

        {
          "number": "5511999999999"
        }

        ```


        Exemplo de resposta:

        ```json

        {
          "response": "Call successful"
        }

        ```


        Erros comuns:

        - 401: Token inválido ou expirado

        - 400: Número inválido ou ausente

        - 500: Erro ao iniciar chamada
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: 'Número do contato no formato internacional (ex: 5511999999999)'
                  example: '5511999999999'
              required:
                - number
      responses:
        '200':
          description: Chamada iniciada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    description: Mensagem de confirmação
                    example: Call successful
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Descrição do erro
                    examples:
                      missing_number: missing number in payload
                      invalid_number: invalid number JID
        '401':
          description: Token inválido ou expirado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Descrição do erro de autenticação
                    example: client not found
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Descrição do erro interno
                    example: 'error making call: network timeout'
  /call/reject:
    post:
      tags:
        - Chamadas
      summary: Rejeitar chamada recebida
      description: |
        Rejeita uma chamada recebida do WhatsApp. Este endpoint permite:
        1. Rejeitar chamadas de voz ou vídeo recebidas
        2. Necessita do número do contato que está ligando
        3. Necessita do ID da chamada para identificação

        Exemplo de requisição:
        ```json
        {
          "number": "5511999999999",
          "id": "ABEiGmo8oqkAcAKrBYQAAAAA_1"
        }
        ```

        Exemplo de resposta:
        ```json
        {
          "response": "Call rejected"
        }
        ```

        Erros comuns:
        - 401: Token inválido ou expirado
        - 400: Número inválido ou ID da chamada ausente
        - 500: Erro ao rejeitar chamada
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: 'Número do contato no formato internacional (ex: 5511999999999)'
                  example: '5511999999999'
                id:
                  type: string
                  description: ID único da chamada a ser rejeitada
                  example: ABEiGmo8oqkAcAKrBYQAAAAA_1
              required:
                - number
                - id
      responses:
        '200':
          description: Chamada rejeitada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    description: Mensagem de confirmação
                    example: Call rejected
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Descrição do erro
                    examples:
                      missing_number: missing number in payload
                      missing_id: missing id in payload
                      invalid_number: invalid number
        '401':
          description: Token inválido ou expirado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Descrição do erro de autenticação
                    example: client not found
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Descrição do erro interno
                    example: 'error rejecting call: timeout'
  /chatwoot/config:
    get:
      tags:
        - Integração Chatwoot
      summary: Obter configuração do Chatwoot
      description: |
        Retorna a configuração atual da integração com Chatwoot para a instância.

        ### Funcionalidades:
        - Retorna todas as configurações do Chatwoot incluindo credenciais
        - Mostra status de habilitação da integração
        - Útil para verificar configurações atuais antes de fazer alterações
      responses:
        '200':
          description: Configuração obtida com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  chatwoot_enabled:
                    type: boolean
                    description: Se a integração com Chatwoot está habilitada
                    example: true
                  chatwoot_url:
                    type: string
                    description: URL base da instância Chatwoot
                    example: https://app.chatwoot.com
                  chatwoot_account_id:
                    type: integer
                    format: int64
                    description: ID da conta no Chatwoot
                    example: 1
                  chatwoot_inbox_id:
                    type: integer
                    format: int64
                    description: ID da inbox no Chatwoot
                    example: 5
                  chatwoot_access_token:
                    type: string
                    description: Token de acesso da API Chatwoot
                    example: pXXGHHHyJPYHYgWHJHYHgJjj
                  chatwoot_ignore_groups:
                    type: boolean
                    description: Se deve ignorar mensagens de grupos na sincronização
                    example: false
                  chatwoot_sign_messages:
                    type: boolean
                    description: Se deve assinar mensagens enviadas para o WhatsApp
                    example: true
                  chatwoot_create_new_conversation:
                    type: boolean
                    description: Sempre criar nova conversa ao invés de reutilizar conversas existentes
                    example: false
        '401':
          description: Token inválido/expirado
        '500':
          description: Erro interno do servidor
    put:
      tags:
        - Integração Chatwoot
      summary: Atualizar configuração do Chatwoot
      description: |
        Atualiza a configuração da integração com Chatwoot para a instância.

        ### Funcionalidades:
        - Configura todos os parâmetros da integração Chatwoot
        - Reinicializa automaticamente o cliente Chatwoot quando habilitado
        - Retorna URL do webhook para configurar no Chatwoot
        - Sincronização bidirecional de mensagens novas entre WhatsApp e Chatwoot
        - Sincronização automática de contatos (nome e telefone)
        - Atualização automática LID → PN (Local ID para Phone Number)
        - Sistema de nomes inteligentes com til (~)

        ### Configuração no Chatwoot:
        1. Após configurar via API, use a URL retornada no webhook settings da inbox no Chatwoot
        2. Configure como webhook URL na sua inbox do Chatwoot
        3. A integração ficará ativa e sincronizará mensagens e contatos automaticamente

        ### 🏷️ Sistema de Nomes Inteligentes:
        - **Nomes com til (~)**: São atualizados automaticamente quando o contato modifica seu nome no WhatsApp
        - **Nomes específicos**: Para definir um nome fixo, remova o til (~) do nome no Chatwoot
        - **Exemplo**: "~João Silva" será atualizado automaticamente, "João Silva" (sem til) permanecerá fixo
        - **Atualização LID→PN**: Contatos migram automaticamente de Local ID para Phone Number quando disponível
        - **Sem duplicação**: Durante a migração LID→PN, não haverá duplicação de conversas
        - **Respostas nativas**: Todas as respostas dos agentes aparecem nativamente no Chatwoot

        ### 🚧 AVISO IMPORTANTE - INTEGRAÇÃO BETA:
        - **Fase Beta**: Esta integração está em fase de desenvolvimento e testes
        - **Uso por conta e risco**: O usuário assume total responsabilidade pelo uso
        - **Recomendação**: Teste em ambiente não-produtivo antes de usar em produção
        - **Suporte limitado**: Funcionalidades podem mudar sem aviso prévio

        ### ⚠️ Limitações Conhecidas:
        - **Sincronização de histórico**: Não implementada - apenas mensagens novas são sincronizadas
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                enabled:
                  type: boolean
                  description: Habilitar/desabilitar integração com Chatwoot
                  example: true
                url:
                  type: string
                  description: URL base da instância Chatwoot (sem barra final)
                  example: https://app.chatwoot.com
                access_token:
                  type: string
                  description: Token de acesso da API Chatwoot (obtido em Profile Settings > Access Token)
                  example: pXXGHHHyJPYHYgWHJHYHgJjj
                account_id:
                  type: integer
                  format: int64
                  description: ID da conta no Chatwoot (visível na URL da conta)
                  example: 1
                inbox_id:
                  type: integer
                  format: int64
                  description: ID da inbox no Chatwoot (obtido nas configurações da inbox)
                  example: 5
                ignore_groups:
                  type: boolean
                  description: Ignorar mensagens de grupos do WhatsApp na sincronização
                  example: false
                sign_messages:
                  type: boolean
                  description: Assinar mensagens enviadas para WhatsApp com identificação do agente
                  example: true
                create_new_conversation:
                  type: boolean
                  description: Sempre criar nova conversa ao invés de reutilizar conversas existentes
                  example: false
              required:
                - enabled
                - url
                - access_token
                - account_id
                - inbox_id
      responses:
        '200':
          description: Configuração atualizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    description: Mensagem de confirmação
                    example: 'Chatwoot config updated successfully, put this URL in Chatwoot inbox webhook settings:'
                  chatwoot_inbox_webhook_url:
                    type: string
                    description: URL do webhook para configurar na inbox do Chatwoot
                    example: https://sua-api.com/chatwoot/webhook/inst_abc123
        '400':
          description: Dados inválidos no body da requisição
        '401':
          description: Token inválido/expirado
        '500':
          description: Erro interno ao salvar configuração
