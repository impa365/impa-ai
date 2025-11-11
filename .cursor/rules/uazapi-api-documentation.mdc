---
description: USE ESSA TOLL SEMPRE QUE PRECISAR CONSULTAR A DOCUMENTAÇÃO DA UAZAPI PRA SABER COMO FUNCIONA A API
alwaysApply: false
---
openapi: 3.1.0
info:
  title: uazapiGO -  WhatsApp API (v2.0)
  version: 1.0.0
  description: >
    API para gerenciamento de instâncias do WhatsApp e comunicações.


    ## ⚠️ Recomendação Importante: WhatsApp Business

    **É ALTAMENTE RECOMENDADO usar contas do WhatsApp Business** em vez do WhatsApp normal para integração, o WhatsApp
    normal pode apresentar inconsistências, desconexões, limitações e instabilidades durante o uso com a nossa API.


    ## Autenticação

    - Endpoints regulares requerem um header 'token' com o token da instância

    - Endpoints administrativos requerem um header 'admintoken'


    ## Estados da Instância

    As instâncias podem estar nos seguintes estados:

    - `disconnected`: Desconectado do WhatsApp

    - `connecting`: Em processo de conexão

    - `connected`: Conectado e autenticado com sucesso


    ## Limites de Uso

    - O servidor possui um limite máximo de instâncias conectadas

    - Quando o limite é atingido, novas tentativas receberão erro 429

    - Servidores gratuitos/demo podem ter restrições adicionais de tempo de vida
servers:
  - url: https://{subdomain}.uazapi.com
    variables:
      subdomain:
        default: free
        description: Subdomínio da sua empresa
components:
  securitySchemes:
    token:
      name: token
      type: apiKey
      in: header
    admintoken:
      name: admintoken
      type: apiKey
      in: header
      description: Token de administrador para endpoints administrativos
  schemas:
    Instance:
      type: object
      description: Representa uma instância do WhatsApp
      properties:
        id:
          type: string
          format: uuid
          description: ID único gerado automaticamente
        token:
          type: string
          description: Token de autenticação da instância
        status:
          type: string
          description: Status atual da conexão
        paircode:
          type: string
          description: Código de pareamento
        qrcode:
          type: string
          description: QR Code em base64 para autenticação
        name:
          type: string
          description: Nome da instância
        profileName:
          type: string
          description: Nome do perfil WhatsApp
        profilePicUrl:
          type: string
          format: uri
          description: URL da foto do perfil
        isBusiness:
          type: boolean
          description: Indica se é uma conta business
        plataform:
          type: string
          description: Plataforma de origem (iOS/Android/Web)
        systemName:
          type: string
          description: Nome do sistema operacional
        owner:
          type: string
          description: Proprietário da instância
        lastDisconnect:
          type: string
          format: date-time
          description: Data/hora da última desconexão
        lastDisconnectReason:
          type: string
          description: Motivo da última desconexão
        adminField01:
          type: string
          description: Campo administrativo 01
        adminField02:
          type: string
          description: Campo administrativo 02
        openai_apikey:
          type: string
          description: Chave da API OpenAI
        chatbot_enabled:
          type: boolean
          description: Habilitar chatbot automático
        chatbot_ignoreGroups:
          type: boolean
          description: Ignorar mensagens de grupos
        chatbot_stopConversation:
          type: string
          description: Palavra-chave para parar conversa
        chatbot_stopMinutes:
          type: integer
          description: Por quanto tempo ficará pausado o chatbot ao usar stop conversation
        chatbot_stopWhenYouSendMsg:
          type: integer
          description: Por quanto tempo ficará pausada a conversa quando você enviar mensagem manualmente
        created:
          type: string
          format: date-time
          description: Data de criação da instância
        updated:
          type: string
          format: date-time
          description: Data da última atualização
        msg_delay_min:
          type: integer
          format: int64
          minimum: 1
          description: Delay mínimo em segundos entre mensagens diretas
          default: 2
        msg_delay_max:
          type: integer
          format: int64
          minimum: 1
          description: Delay máximo em segundos entre mensagens diretas (deve ser maior que delayMin)
          default: 4
      example:
        id: i91011ijkl
        token: abc123xyz
        status: connected
        paircode: 1234-5678
        qrcode: data:image/png;base64,iVBORw0KGg...
        name: Instância Principal
        profileName: Loja ABC
        profilePicUrl: https://example.com/profile.jpg
        isBusiness: true
        plataform: Android
        systemName: uazapi
        owner: user@example.com
        lastDisconnect: '2025-01-24T14:00:00Z'
        lastDisconnectReason: Network error
        adminField01: custom_data
        openai_apikey: sk-...xyz
        chatbot_enabled: true
        chatbot_ignoreGroups: true
        chatbot_stopConversation: parar
        chatbot_stopMinutes: 60
        created: '2025-01-24T14:00:00Z'
        updated: '2025-01-24T14:30:00Z'
        delayMin: 2
        delayMax: 4
    Webhook:
      type: object
      description: Configuração completa de webhook com filtros e opções avançadas
      properties:
        id:
          type: string
          format: uuid
          description: ID único gerado automaticamente
        instance_id:
          type: string
          description: ID da instância associada
        enabled:
          type: boolean
          description: Webhook ativo/inativo
          default: false
        url:
          type: string
          format: uri
          description: URL de destino dos eventos
        events:
          type: array
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
          description: Tipos de eventos monitorados
        AddUrlTypesMessages:
          type: boolean
          description: Incluir na URLs o tipo de mensagem
          default: false
        addUrlEvents:
          type: boolean
          description: Incluir na URL o nome do evento
          default: false
        excludeMessages:
          type: array
          items:
            type: string
            enum:
              - wasSentByApi
              - wasNotSentByApi
              - fromMeYes
              - fromMeNo
              - isGroupYes
              - IsGroupNo
          description: Filtros para excluir tipos de mensagens
        created:
          type: string
          format: date-time
          description: Data de criação (automática)
          readOnly: true
        updated:
          type: string
          format: date-time
          description: Data da última atualização (automática)
          readOnly: true
      required:
        - url
        - events
      example:
        id: wh_9a8b7c6d5e
        instance_id: inst_12345
        enabled: true
        url: https://webhook.cool/example
        events:
          - messages
          - connection
        AddUrlTypesMessages: false
        addUrlEvents: false
        excludeMessages: []
        created: '2025-01-24T16:20:00Z'
        updated: '2025-01-24T16:25:00Z'
    Chat:
      type: object
      description: Representa uma conversa/chamado no sistema
      properties:
        id:
          type: string
          description: ID único da conversa (r + 7 bytes aleatórios em hex)
        wa_fastid:
          type: string
          description: Identificador rápido do WhatsApp
        wa_chatid:
          type: string
          description: ID completo do chat no WhatsApp
        wa_archived:
          type: boolean
          description: Indica se o chat está arquivado
          default: false
        wa_contactName:
          type: string
          description: Nome do contato no WhatsApp
          default: ''
        wa_name:
          type: string
          description: Nome do WhatsApp
          default: ''
        name:
          type: string
          description: Nome exibido do chat
          default: ''
        image:
          type: string
          description: URL da imagem do chat
          default: ''
        imagePreview:
          type: string
          description: URL da miniatura da imagem
          default: ''
        wa_ephemeralExpiration:
          type: integer
          format: int64
          description: Tempo de expiração de mensagens efêmeras
          default: 0
        wa_isBlocked:
          type: boolean
          description: Indica se o contato está bloqueado
          default: false
        wa_isGroup:
          type: boolean
          description: Indica se é um grupo
          default: false
        wa_isGroup_admin:
          type: boolean
          description: Indica se o usuário é admin do grupo
          default: false
        wa_isGroup_announce:
          type: boolean
          description: Indica se é um grupo somente anúncios
          default: false
        wa_isGroup_community:
          type: boolean
          description: Indica se é uma comunidade
          default: false
        wa_isGroup_member:
          type: boolean
          description: Indica se é membro do grupo
          default: false
        wa_isPinned:
          type: boolean
          description: Indica se o chat está fixado
          default: false
        wa_label:
          type: string
          description: Labels do chat em JSON
          default: '[]'
        wa_lastMessageTextVote:
          type: string
          description: Texto/voto da última mensagem
          default: ''
        wa_lastMessageType:
          type: string
          description: Tipo da última mensagem
          default: ''
        wa_lastMsgTimestamp:
          type: integer
          format: int64
          description: Timestamp da última mensagem
          default: 0
        wa_lastMessageSender:
          type: string
          description: Remetente da última mensagem
          default: ''
        wa_muteEndTime:
          type: integer
          format: int64
          description: Timestamp do fim do silenciamento
          default: 0
        owner:
          type: string
          description: Dono da instância
          default: ''
        wa_unreadCount:
          type: integer
          format: int64
          description: Contador de mensagens não lidas
          default: 0
        phone:
          type: string
          description: Número de telefone
          default: ''
        wa_common_groups:
          type: string
          description: 'Grupos em comum separados por vírgula, formato: (nome_grupo)id_grupo'
          default: ''
          example: Grupo Família(120363123456789012@g.us),Trabalho(987654321098765432@g.us)
        lead_name:
          type: string
          description: Nome do lead
          default: ''
        lead_fullName:
          type: string
          description: Nome completo do lead
          default: ''
        lead_email:
          type: string
          description: Email do lead
          default: ''
        lead_personalid:
          type: string
          description: Documento de identificação
          default: ''
        lead_status:
          type: string
          description: Status do lead
          default: ''
        lead_tags:
          type: string
          description: Tags do lead em JSON
        lead_notes:
          type: string
          description: Anotações sobre o lead
          default: ''
        lead_isTicketOpen:
          type: boolean
          description: Indica se tem ticket aberto
          default: false
        lead_assignedAttendant_id:
          type: string
          description: ID do atendente responsável
          default: ''
        lead_kanbanOrder:
          type: integer
          format: int64
          description: Ordem no kanban
          default: 0
        lead_field01:
          type: string
          default: ''
        lead_field02:
          type: string
          default: ''
        lead_field03:
          type: string
          default: ''
        lead_field04:
          type: string
          default: ''
        lead_field05:
          type: string
          default: ''
        lead_field06:
          type: string
          default: ''
        lead_field07:
          type: string
          default: ''
        lead_field08:
          type: string
          default: ''
        lead_field09:
          type: string
          default: ''
        lead_field10:
          type: string
          default: ''
        lead_field11:
          type: string
          default: ''
        lead_field12:
          type: string
          default: ''
        lead_field13:
          type: string
          default: ''
        lead_field14:
          type: string
          default: ''
        lead_field15:
          type: string
          default: ''
        lead_field16:
          type: string
          default: ''
        lead_field17:
          type: string
          default: ''
        lead_field18:
          type: string
          default: ''
        lead_field19:
          type: string
          default: ''
        lead_field20:
          type: string
          default: ''
        chatbot_agentResetMemoryAt:
          type: integer
          format: int64
          description: Timestamp do último reset de memória
          default: 0
        chatbot_lastTrigger_id:
          type: string
          description: ID do último gatilho executado
          default: ''
        chatbot_lastTriggerAt:
          type: integer
          format: int64
          description: Timestamp do último gatilho
          default: 0
        chatbot_disableUntil:
          type: integer
          format: int64
          description: Timestamp até quando chatbot está desativado
          default: 0
        created:
          type: string
          description: Data de criação
          default: strftime('%Y-%m-%d %H:%M:%f', 'now')
        updated:
          type: string
          description: Data da última atualização
          default: strftime('%Y-%m-%d %H:%M:%f', 'now')
    Message:
      type: object
      description: Representa uma mensagem trocada no sistema
      properties:
        id:
          type: string
          format: uuid
          description: ID único interno da mensagem (formato r + 7 caracteres hex aleatórios)
        messageid:
          type: string
          description: ID original da mensagem no provedor
        chatid:
          type: string
          description: ID da conversa relacionada
        fromMe:
          type: boolean
          description: Indica se a mensagem foi enviada pelo usuário
          default: false
        isGroup:
          type: boolean
          description: Indica se é uma mensagem de grupo
          default: false
        messageType:
          type: string
          enum:
            - text
            - image
            - video
            - document
            - audio
            - location
            - button
            - list
            - reaction
          description: Tipo de conteúdo da mensagem
        messageTimestamp:
          type: integer
          description: Timestamp original da mensagem em milissegundos
          default: 0
        edited:
          type: string
          description: Histórico de edições da mensagem
          default: ''
        quoted:
          type: string
          description: ID da mensagem citada/respondida
          default: ''
        reaction:
          type: string
          description: ID da mensagem reagida
          default: ''
        sender:
          type: string
          description: ID do remetente da mensagem
          default: ''
        senderName:
          type: string
          description: Nome exibido do remetente
          default: ''
        source:
          type: string
          enum:
            - ios
            - web
            - android
          description: Plataforma de origem da mensagem
          default: ''
        status:
          type: string
          enum:
            - pending
            - sent
            - delivered
            - read
            - failed
            - deleted
          description: Status do ciclo de vida da mensagem
          default: ''
        text:
          type: string
          description: Texto original da mensagem
          default: ''
        vote:
          type: string
          description: Dados de votação de enquete e listas
          default: ''
        buttonOrListid:
          type: string
          description: ID do botão ou item de lista selecionado
          default: ''
        convertOptions:
          type: string
          description: Conversão de opções de da mensagem, lista, enquete e botões
          default: ''
        fileURL:
          type: string
          format: uri
          description: URL para download de arquivos de mídia
          default: ''
        content:
          type: string
          description: Conteúdo completo da mensagem em formato JSON
        owner:
          type: string
          description: Dono da mensagem
          default: ''
        track_source:
          type: string
          description: Origem do rastreamento da mensagem
          default: ''
        track_id:
          type: string
          description: ID para rastreamento da mensagem (aceita valores duplicados)
          default: ''
        created:
          type: string
          format: date-time
          description: Data de criação no sistema (formato SQLite YYYY-MM-DD HH:MM:SS.FFF)
          default: (strftime('%Y-%m-%d %H:%M:%f', 'now'))
        updated:
          type: string
          format: date-time
          description: Data da última atualização (formato SQLite YYYY-MM-DD HH:MM:SS.FFF)
          default: (strftime('%Y-%m-%d %H:%M:%f', 'now'))
        ai_metadata:
          type: object
          description: Metadados do processamento por IA
          properties:
            agent_id:
              type: string
              description: ID do agente de IA responsável
            request:
              type: object
              description: Dados da requisição à API de IA
              properties:
                messages:
                  type: array
                  description: Histórico de mensagens enviadas para a API
                tools:
                  type: array
                  description: Ferramentas disponíveis para o agente
                options:
                  type: object
                  description: Opções de configuração da API
                  properties:
                    model:
                      type: string
                    temperature:
                      type: number
                    maxTokens:
                      type: integer
                    topP:
                      type: number
                    frequencyPenalty:
                      type: number
                    presencePenalty:
                      type: number
            response:
              type: object
              description: Resposta da API de IA
              properties:
                choices:
                  type: array
                  description: Resultados retornados pela API
                toolResults:
                  type: array
                  description: Resultados da execução de ferramentas
                error:
                  type: string
                  description: Mensagem de erro, se houver
    Label:
      type: object
      description: Representa uma etiqueta/categoria no sistema
      properties:
        id:
          type: string
          format: uuid
          description: ID único da etiqueta
        name:
          type: string
          description: Nome da etiqueta
        color:
          type: integer
          description: Índice numérico da cor (0-19)
          minimum: 0
          maximum: 19
          example: 2
        colorHex:
          type: string
          description: Cor hexadecimal correspondente ao índice
          enum:
            - '#ff9484'
            - '#64c4ff'
            - '#fed428'
            - '#dfaef0'
            - '#9ab6c1'
            - '#56ccb4'
            - '#fe9dfe'
            - '#d3a91f'
            - '#6f7bcf'
            - '#d8e651'
            - '#01d0e2'
            - '#ffc5c7'
            - '#92ceac'
            - '#f64847'
            - '#00a1f2'
            - '#83e421'
            - '#ffae04'
            - '#b4ebff'
            - '#9ba6ff'
            - '#9568cf'
          example: '#fed428'
        createdAt:
          type: string
          format: date-time
          description: Data de criação
      example:
        id: l121314mnop
        name: Cliente VIP
        color: 2
        colorHex: '#fed428'
        createdAt: '2025-01-24T14:35:00.000Z'
    Attendant:
      type: object
      description: Modelo de atendente do sistema
      properties:
        id:
          type: string
          format: uuid
          description: ID único gerado automaticamente
        name:
          type: string
          description: Nome do atendente
          default: ''
        phone:
          type: string
          description: Número de telefone
          default: ''
        email:
          type: string
          format: email
          description: Endereço de e-mail
          default: ''
        department:
          type: string
          description: Departamento de atuação
          default: ''
        customField01:
          type: string
          description: Campo personalizável 01
          default: ''
        customField02:
          type: string
          description: Campo personalizável 02
          default: ''
        owner:
          type: string
          description: Responsável pelo cadastro
          default: ''
        created:
          type: string
          format: date-time
          description: Data de criação automática
        updated:
          type: string
          format: date-time
          description: Data de atualização automática
      example:
        id: r1234abcd
        name: João da Silva
        phone: '+5511999999999'
        email: joao@empresa.com
        department: Suporte Técnico
        customField01: 'Turno: Manhã'
        customField02: 'Nível: 2'
        owner: admin
        created: '2025-01-24T13:52:19.000Z'
        updated: '2025-01-24T13:52:19.000Z'
    ChatbotTrigger:
      type: object
      required:
        - type
        - agent_id
      properties:
        id:
          type: string
          description: |
            Identificador único do trigger. Se definido, você irá editar ou deletar o trigger.
            Se vazio, um novo trigger será criado.
        active:
          type: boolean
          default: true
          description: |
            Define se o trigger está ativo e disponível para uso.
            Triggers inativos não serão executados pelo sistema.
        type:
          type: string
          enum:
            - agent
            - quickreply
          default: agent
          description: |
            Tipo do trigger:
            * agent - aciona um agente de IA
            * quickreply - aciona respostas rápidas predefinidas
        agent_id:
          type: string
          description: ID do agente de IA. Obrigatório quando type='agent'
        quickReply_id:
          type: string
          description: ID da resposta rápida. Obrigatório quando type='quickreply'
        ignoreGroups:
          type: boolean
          default: true
          description: Define se o trigger deve ignorar mensagens de grupos
        lead_field:
          type: string
          enum:
            - lead_name
            - lead_fullName
            - lead_email
            - lead_personalid
            - lead_status
            - lead_tags
            - lead_notes
            - lead_isTicketOpen
            - lead_field01
            - lead_field02
            - lead_field03
            - lead_field04
            - lead_field05
            - lead_field06
            - lead_field07
            - lead_field08
            - lead_field09
            - lead_field10
            - lead_field11
            - lead_field12
            - lead_field13
            - lead_field14
            - lead_field15
            - lead_field16
            - lead_field17
            - lead_field18
            - lead_field19
            - lead_field20
          description: Campo do lead usado para condição do trigger
        lead_operator:
          type: string
          enum:
            - equals
            - not_equals
            - contains
            - not_contains
            - greater
            - less
            - empty
            - not_empty
          description: |
            Operador de comparação para condição do lead:
            * equals - igual a
            * not_equals - diferente de
            * contains - contém
            * not_contains - não contém
            * greater - maior que
            * less - menor que
            * empty - vazio
            * not_empty - não vazio
        lead_value:
          type: string
          description: Valor para comparação com o campo do lead. Usado em conjunto com lead_field e lead_operator
        priority:
          type: integer
          format: int64
          default: 1
          description: |
            Prioridade do trigger. Quando existem múltiplos triggers que poderiam ser acionados,
            APENAS o trigger com maior prioridade será executado.
            Se houver múltiplos triggers com a mesma prioridade mais alta, um será escolhido aleatoriamente.
        wordsToStart:
          type: string
          description: |
            Palavras-chave ou frases que ativam o trigger.
            Múltiplas entradas separadas por pipe (|).
            Exemplo: olá|bom dia|qual seu nome
        responseDelay_seconds:
          type: integer
          format: int64
          default: 10
          description: Tempo de espera em segundos antes de executar o trigger
        owner:
          type: string
          description: Identificador do proprietário do trigger
        created:
          type: string
          format: date-time
          description: Data e hora de criação
        updated:
          type: string
          format: date-time
          description: Data e hora da última atualização
    ChatbotAIAgent:
      type: object
      description: Configuração de um agente de IA para atendimento de conversas
      properties:
        id:
          type: string
          format: uuid
          description: ID único gerado pelo sistema
        name:
          type: string
          description: Nome de exibição do agente
        provider:
          type: string
          enum:
            - openai
            - anthropic
            - gemini
            - custom
          description: Provedor do serviço de IA
        model:
          type: string
          description: Nome do modelo LLM a ser utilizado
        apikey:
          type: string
          description: Chave de API para autenticação no provedor
          x-sensitive: true
        basePrompt:
          type: string
          description: Prompt base para orientar o comportamento do agente
        maxTokens:
          type: integer
          description: Número máximo de tokens por resposta
        temperature:
          type: integer
          minimum: 0
          maximum: 100
          description: Controle de criatividade (0-100)
        diversityLevel:
          type: integer
          minimum: 0
          maximum: 100
          description: Nível de diversificação das respostas
        frequencyPenalty:
          type: integer
          minimum: 0
          maximum: 100
          description: Penalidade para repetição de frases
        presencePenalty:
          type: integer
          minimum: 0
          maximum: 100
          description: Penalidade para manter foco no tópico
        signMessages:
          type: boolean
          description: Adiciona identificação do agente nas mensagens
        readMessages:
          type: boolean
          description: Marca mensagens como lidas automaticamente
        maxMessageLength:
          type: integer
          description: Tamanho máximo permitido para mensagens (caracteres)
        typingDelay_seconds:
          type: integer
          description: Atraso simulado de digitação em segundos
        contextTimeWindow_hours:
          type: integer
          description: Janela temporal para contexto da conversa
        contextMaxMessages:
          type: integer
          description: Número máximo de mensagens no contexto
        contextMinMessages:
          type: integer
          description: Número mínimo de mensagens para iniciar contexto
        owner:
          type: string
          description: Responsável/Proprietário do agente
        created:
          type: string
          format: date-time
          description: Data de criação do registro
        updated:
          type: string
          format: date-time
          description: Data da última atualização
      required:
        - name
        - provider
        - model
        - apikey
    ChatbotAIFunction:
      type: object
      properties:
        id:
          type: string
          description: ID único da função gerado automaticamente
        name:
          type: string
          description: Nome da função
        description:
          type: string
          description: Descrição da função
        active:
          type: boolean
          default: false
          description: Indica se a função está ativa
        method:
          type: string
          description: Método HTTP da requisição
        endpoint:
          type: string
          description: Endpoint da API
        headers:
          type: string
          nullable: true
          description: Cabeçalhos da requisição
        body:
          type: string
          nullable: true
          description: Corpo da requisição
        parameters:
          type: string
          nullable: true
          default: '[]'
          description: Parâmetros da função
        undocumentedParameters:
          type: string
          description: Parâmetros não documentados
        header_error:
          type: boolean
          default: false
          description: Indica erro de formatação nos cabeçalhos
        body_error:
          type: boolean
          default: false
          description: Indica erro de formatação no corpo
        owner:
          type: string
          description: Proprietário da função
        created:
          type: string
          format: date-time
          default: strftime('%Y-%m-%d %H:%M:%fZ')
          description: Data de criação
        updated:
          type: string
          format: date-time
          default: strftime('%Y-%m-%d %H:%M:%fZ')
          description: Data de atualização
      required:
        - name
        - description
        - method
        - endpoint
    ChatbotAIKnowledge:
      type: object
      properties:
        id:
          type: string
          description: ID único gerado automaticamente
          example: r1a2b3c4
        active:
          type: boolean
          default: false
          description: Indica se o conhecimento está ativo
        tittle:
          type: string
          default: ''
          description: Título do conhecimento
        content:
          type: string
          default: ''
          description: Conteúdo textual do conhecimento
        vectorStatus:
          type: string
          default: ''
          description: Status da vetorização no sistema
        isVectorized:
          type: boolean
          default: false
          description: Indica se o conteúdo foi vetorizado
        lastVectorizedAt:
          type: integer
          format: int64
          default: 0
          description: Timestamp da última vetorização
        owner:
          type: string
          default: ''
          description: Proprietário do conhecimento
        priority:
          type: integer
          format: int64
          default: 0
          description: Prioridade de uso do conhecimento
        created:
          type: string
          format: date-time
          description: Data de criação
        updated:
          type: string
          format: date-time
          description: Data de atualização
      required:
        - id
        - active
        - tittle
        - content
    MessageQueueFolder:
      type: object
      description: Pasta para organização de campanhas de mensagens em massa
      properties:
        id:
          type: string
          description: Identificador único
        info:
          type: string
          description: Informações adicionais sobre a pasta
        status:
          type: string
          description: Status atual da pasta
          example: ativo
        scheduled_for:
          type: integer
          format: int64
          description: Timestamp Unix para execução agendada
        delayMax:
          type: integer
          format: int64
          description: Atraso máximo entre mensagens em milissegundos
        delayMin:
          type: integer
          format: int64
          description: Atraso mínimo entre mensagens em milissegundos
        log_delivered:
          type: integer
          format: int64
          description: Contagem de mensagens entregues
        log_failed:
          type: integer
          format: int64
          description: Contagem de mensagens com falha
        log_played:
          type: integer
          format: int64
          description: Contagem de mensagens reproduzidas (para áudio/vídeo)
        log_read:
          type: integer
          format: int64
          description: Contagem de mensagens lidas
        log_sucess:
          type: integer
          format: int64
          description: Contagem de mensagens enviadas com sucesso
        log_total:
          type: integer
          format: int64
          description: Contagem total de mensagens
        owner:
          type: string
          description: Identificador do proprietário da instância
        created:
          type: string
          format: date-time
          description: Data e hora de criação
        updated:
          type: string
          format: date-time
          description: Data e hora da última atualização
    QuickReply:
      type: object
      properties:
        id:
          type: string
          format: uuid
          description: ID único da resposta rápida
        shortcut:
          type: string
          description: Atalho para acionar a resposta
        content:
          type: string
          description: Conteúdo da mensagem pré-definida
        category:
          type: string
          description: Categoria para organização
        createdAt:
          type: string
          format: date-time
          description: Data de criação
        updatedAt:
          type: string
          format: date-time
          description: Data da última atualização
      required:
        - shortcut
        - content
    Group:
      type: object
      description: Representa um grupo/conversa coletiva
      properties:
        JID:
          type: string
          format: jid
          description: Identificador único do grupo
          example: jid8@g.us
        OwnerJID:
          type: string
          format: jid
          description: JID do proprietário do grupo
          example: 1232@s.whatsapp.net
        Name:
          type: string
          description: Nome do grupo
          example: Grupo de Suporte
        NameSetAt:
          type: string
          format: date-time
          description: Data da última alteração do nome
        NameSetBy:
          type: string
          format: jid
          description: JID do usuário que definiu o nome
        Topic:
          type: string
          description: Descrição do grupo
        IsLocked:
          type: boolean
          description: |
            Indica se apenas administradores podem editar informações do grupo
            - true = apenas admins podem editar
            - false = todos podem editar
          example: true
        IsAnnounce:
          type: boolean
          description: Indica se apenas administradores podem enviar mensagens
        AnnounceVersionID:
          type: string
          description: Versão da configuração de anúncios
        IsEphemeral:
          type: boolean
          description: Indica se as mensagens são temporárias
        DisappearingTimer:
          type: integer
          description: Tempo em segundos para desaparecimento de mensagens
          minimum: 0
        IsIncognito:
          type: boolean
          description: Indica se o grupo é incognito
        IsParent:
          type: boolean
          description: Indica se é um grupo pai (comunidade)
        IsJoinApprovalRequired:
          type: boolean
          description: Indica se requer aprovação para novos membros
        LinkedParentJID:
          type: string
          format: jid
          description: JID da comunidade vinculada
        IsDefaultSubGroup:
          type: boolean
          description: Indica se é um subgrupo padrão da comunidade
        GroupCreated:
          type: string
          format: date-time
          description: Data de criação do grupo
        ParticipantVersionID:
          type: string
          description: Versão da lista de participantes
        Participants:
          type: array
          items:
            $ref: '#/GroupParticipant'
          description: Lista de participantes do grupo
        MemberAddMode:
          type: string
          enum:
            - admin_add
            - all_member_add
          description: Modo de adição de novos membros
        OwnerCanSendMessage:
          type: boolean
          description: Verifica se é possível você enviar mensagens
        OwnerIsAdmin:
          type: boolean
          description: Verifica se você adminstrador do grupo
        DefaultSubGroupId:
          type: string
          description: Se o grupo atual for uma comunidade, nesse campo mostrará o ID do subgrupo de avisos
        invite_link:
          type: string
          description: Link de convite para entrar no grupo
        request_participants:
          type: string
          description: Lista de solicitações de entrada, separados por vírgula
    GroupParticipant:
      type: object
      description: Participante de um grupo
      properties:
        JID:
          type: string
          format: jid
          description: Identificador do participante
        LID:
          type: string
          format: jid
          description: Identificador local do participante
        IsAdmin:
          type: boolean
          description: Indica se é administrador
        IsSuperAdmin:
          type: boolean
          description: Indica se é super administrador
        DisplayName:
          type: string
          description: Nome exibido no grupo (para usuários anônimos)
        Error:
          type: integer
          description: Código de erro ao adicionar participante
          minimum: 0
        AddRequest:
          type: object
          description: Informações da solicitação de entrada
          properties:
            Code:
              type: string
              description: Código da solicitação
            Expiration:
              type: string
              format: date-time
              description: Data de expiração da solicitação
    WebhookEvent:
      type: object
      required:
        - event
        - instance
        - data
      properties:
        event:
          type: string
          enum:
            - message
            - status
            - presence
            - group
            - connection
          description: Tipo do evento recebido
        instance:
          type: string
          description: ID da instância que gerou o evento
        data:
          oneOf:
            - $ref: '#/components/schemas/MessageEventData'
            - $ref: '#/components/schemas/StatusEventData'
            - $ref: '#/components/schemas/PresenceEventData'
            - $ref: '#/components/schemas/GroupEventData'
            - $ref: '#/components/schemas/ConnectionEventData'
security:
  - token: []
x-tagGroups:
  - name: ChatBot
    description: >
      **Sistema avançado de chatbots com inteligência artificial**


      Esta categoria contém recursos sofisticados para criar chatbots inteligentes e automatizar conversas usando IA.
      Ideal para empresas que precisam de atendimento automatizado avançado e respostas contextuais.


      ### Recursos de IA incluídos:

      - 🤖 **IA Conversacional**: Integração com múltiplos provedores (OpenAI, Anthropic, Google, DeepSeek)

      - 🧠 **Base de Conhecimento**: Sistema de embeddings com Qdrant para respostas contextuais

      - ⚙️ **Funções Personalizadas**: Integração com APIs externas e lógica de negócio complexa

      - 🎯 **Triggers Inteligentes**: Ativação automática baseada em contexto e palavras-chave

      - 📋 **Configurações Avançadas**: Personalização completa do comportamento do bot


      ### Casos de uso:

      - Atendimento automatizado 24/7

      - Qualificação automática de leads

      - Suporte técnico com base de conhecimento

      - Agendamento de reuniões e consultas

      - FAQ dinâmico e contextual


      **Ideal para**: Empresas médias/grandes, desenvolvedores, agências, sistemas de atendimento complexos


      **Requer**: Conhecimento técnico para configuração adequada e chaves de API dos provedores de IA
    tags:
      - Chatbot Configurações
      - Chatbot Trigger
      - Configuração do Agente de IA
      - Conhecimento dos Agentes
      - Funções API dos Agentes
tags:
  - name: Admininstração
    description: |
      Endpoints para **administração geral** do sistema.
      Requerem um `admintoken` para autenticação.
  - name: Instancia
    description: |
      Operações relacionadas ao ciclo de vida de uma instância, como conectar,
      desconectar e verificar o status.
  - name: Perfil
    description: |
      Operações relacionadas ao perfil da instância do WhatsApp, como alterar
      nome e imagem de perfil.
  - name: Chamadas
    description: |
      Operações relacionadas a chamadas peloWhatsApp.
      Permite realizar e rejeitar chamadas programaticamente.
  - name: Webhooks e SSE
  - name: Enviar Mensagem
    description: >
      Endpoints para envio de mensagens do WhatsApp com diferentes tipos de conteúdo.


      ## Campos Opcionais Comuns


      Todos os endpoints de envio de mensagem suportam os seguintes campos opcionais:


      - **`delay`** *(integer)*: Atraso em milissegundos antes do envio
        - Durante o atraso aparecerá "Digitando..." ou "Gravando áudio..." dependendo do tipo
        - Exemplo: `5000` (5 segundos)

      - **`readchat`** *(boolean)*: Marcar chat como lido após envio
        - Remove o contador de mensagens não lidas do chat
        - Exemplo: `true`

      - **`readmessages`** *(boolean)*: Marcar últimas mensagens recebidas como lidas
        - Marca as últimas 10 mensagens **recebidas** (não enviadas por você) como lidas
        - Útil para confirmar leitura de mensagens pendentes antes de responder
        - Diferente do `readchat` que apenas remove contador de não lidas
        - Exemplo: `true`

      - **`replyid`** *(string)*: ID da mensagem para responder
        - Cria uma resposta vinculada à mensagem original
        - Suporte varia por tipo de mensagem
        - Exemplo: `"3A12345678901234567890123456789012"`

      - **`mentions`** *(string)*: Números para mencionar (apenas para envio em grupos)
        - Números específicos: `"5511999999999,5511888888888"`
        - Mencionar todos: `"all"`

      - **`forward`** *(boolean)*: Marca a mensagem como encaminhada no WhatsApp
        - Adiciona o indicador "Encaminhada" na mensagem
        - Exemplo: `true`

      - **`track_source`** *(string)*: Origem do rastreamento da mensagem
        - Identifica o sistema ou fonte que está enviando a mensagem
        - Útil para integrações (ex: "chatwoot", "crm", "chatbot")
        - Exemplo: `"chatwoot"`

      - **`track_id`** *(string)*: ID para rastreamento da mensagem
        - Identificador livre para acompanhar a mensagem em sistemas externos
        - Permite correlacionar mensagens entre diferentes plataformas
        - **Nota**: O sistema aceita valores duplicados - não há validação de unicidade
        - Use o mesmo ID em várias mensagens se fizer sentido para sua integração
        - Exemplo: `"msg_123456789"`

      ### Envio para Grupos

      - **`number`** *(string)*: Para enviar mensagem para grupo, use o ID do grupo que termina com `@g.us`
        - Exemplo: `"120363012345678901@g.us"`
        - **Como obter o ID do grupo:**
          - Use o `chatid` do webhook recebido quando alguém envia mensagem no grupo
          - Use o endpoint `GET /group/list` para listar todos os grupos e seus IDs

      ## Placeholders Disponíveis


      Todos os endpoints de envio de mensagem suportam placeholders dinâmicos para personalização automática:


      ### Campos de Nome

      - **`{{name}}`**: Nome consolidado do chat, usando a primeira opção disponível:
        1. Nome do lead (`lead_name`)
        2. Nome completo do lead (`lead_fullName`)
        3. Nome do contato no WhatsApp (`wa_contactName`)
        4. Nome do perfil do WhatsApp (`wa_name`)

      - **`{{first_name}}`**: Primeira palavra válida do nome consolidado (mínimo 2 caracteres)


      ### Campos do WhatsApp

      - **`{{wa_name}}`**: Nome do perfil do WhatsApp

      - **`{{wa_contactName}}`**: Nome do contato como salvo no WhatsApp


      ### Campos do Lead

      - **`{{lead_name}}`**: Nome do lead

      - **`{{lead_fullName}}`**: Nome completo do lead

      - **`{{lead_personalid}}`**: ID pessoal (CPF, CNPJ, etc)

      - **`{{lead_email}}`**: Email do lead

      - **`{{lead_status}}`**: Status atual do lead

      - **`{{lead_notes}}`**: Anotações do lead

      - **`{{lead_assignedAttendant_id}}`**: ID do atendente designado


      ### Campos Personalizados

      Campos adicionados via custom fields são acessíveis usando `{{lead_field01}}` à `{{lead_field20}}` ou usar
      `{{nomedocampo}}` definido em `/instance/updateFieldsMap`.


      ### Exemplo de Uso

      ```

      Olá {{name}}! Vi que você trabalha na {{company}}.

      Seu email {{lead_email}} está correto?

      ```


      **💡 Dica**: Use `/chat/find` para buscar dados do chat e ver os campos disponíveis antes de enviar mensagens com
      placeholders.
  - name: Ações na mensagem e Buscar
  - name: Chats
  - name: Contatos
  - name: Bloqueios
  - name: Etiquetas
  - name: Grupos e Comunidades
  - name: Respostas Rápidas
    description: |
      Gerenciamento de respostas rápidas para agilizar o atendimento.

      **⚠️ Importante**: Este recurso tem serventia apenas se você utilizar um sistema frontend/interface
      personalizada para registrar e utilizar as respostas. A API apenas armazena as respostas, 
      mas não as aplica automaticamente.

      ### Como funciona:
      - **Criar**: Cadastre respostas pré-definidas com títulos e conteúdo
      - **Listar**: Recupere todas as respostas cadastradas para exibir na sua interface
      - **Usar**: Seu sistema frontend pode usar essas respostas para agilizar digitação

      ### Casos de uso:
      - Interfaces web personalizadas de atendimento
      - Apps mobile com sugestões de resposta
      - Sistemas CRM com templates de mensagem
      - Ferramentas de produtividade para atendentes

      **Não é um chatbot**: Para respostas automáticas, use os recursos de Chatbot.
  - name: CRM
    description: |
      Sistema completo de gestão de relacionamento com clientes integrado à API.

      **💾 Armazenamento interno**: Todos os dados dos leads ficam salvos diretamente na API,
      eliminando a necessidade de bancos de dados externos. Sua aplicação pode focar apenas
      na interface e lógica de negócio.

      ### Recursos disponíveis:
      - **📋 20+ campos personalizáveis**: Nome, telefone, email, empresa, observações, etc.
      - **🏷️ Sistema de etiquetas**: Organize e categorize seus contatos
      - **🔍 Busca avançada**: Filtre por qualquer campo ou etiqueta
      - **📊 Histórico completo**: Todas as interações ficam registradas automaticamente

      ### 🎯 Placeholders em mensagens:
      Use variáveis dinâmicas nas mensagens para personalização automática:

      ```
      Olá {{nome}}! Vi que você trabalha na {{empresa}}.
      Seu email {{email}} está correto?
      Observações: {{observacoes}}
      ```

      ### Fluxo típico:
      1. **Captura**: Leads chegam via WhatsApp ou formulários
      2. **Enriquecimento**: Adicione dados usando `/chat/editLead`
      3. **Segmentação**: Organize com etiquetas
      4. **Comunicação**: Envie mensagens personalizadas com placeholders
      5. **Acompanhamento**: Histórico fica salvo automaticamente

      **Ideal para**: Vendas, marketing, atendimento, qualificação de leads
  - name: Mensagem em massa
  - name: Chatbot Configurações
  - name: Chatbot Trigger
  - name: Configuração do Agente de IA
  - name: Conhecimento dos Agentes
  - name: Funções API dos Agentes
  - name: Integração Chatwoot
    description: >
      **🚧 INTEGRAÇÃO BETA - Sistema de integração com Chatwoot para atendimento unificado**


      **⚠️ AVISO**: Esta integração está em fase BETA. Use por sua conta e risco. Recomendamos testes em ambiente
      não-produtivo antes do uso em produção.


      Esta categoria contém recursos para configurar e gerenciar a integração com o Chatwoot, uma plataforma de
      atendimento ao cliente open-source. A integração permite centralizar conversas do WhatsApp no Chatwoot.


      ### Recursos disponíveis:

      - 🔧 **Configuração Completa**: Configure URL, tokens e credenciais do Chatwoot

      - 📬 **Sincronização Bidirecional**: Mensagens novas entre WhatsApp e Chatwoot são sincronizadas automaticamente

      - 📱 **Gerenciamento de Contatos**: Sincronização automática de nomes e telefones

      - 🔄 **Atualização LID→PN**: Migração automática de Local ID para Phone Number

      - 🏷️ **Nomes Inteligentes**: Sistema de nomes com til (~) para atualização automática

      - 🚫 **Separação de Grupos**: Opção para ignorar grupos na sincronização

      - 👤 **Assinatura de Mensagens**: Identificação do agente nas mensagens enviadas

      - 🔗 **Webhook Automático**: URL gerada automaticamente para configurar no Chatwoot


      ### 🏷️ Sistema de Nomes Inteligentes:

      - **Nomes com til (~)**: Atualizados automaticamente quando contato modifica nome no WhatsApp

      - **Nomes específicos**: Para nome fixo, remover til (~) do nome no Chatwoot

      - **Exemplo**: "~João Silva" = automático, "João Silva" = fixo

      - **Migração LID→PN**: Sem duplicação de conversas durante a transição

      - **Respostas nativas**: Aparecem diretamente no Chatwoot sem marcações externas


      ### ⚠️ Limitações conhecidas:

      - **Sincronização de histórico**: Não implementada - apenas mensagens novas são sincronizadas


      ### Casos de uso:

      - Atendimento centralizado no Chatwoot

      - Equipes de suporte com múltiplos agentes

      - Integração com CRM via Chatwoot

      - Centralização de canais de comunicação

      - Gestão automática de contatos e nomes


      **Ideal para**: Empresas com equipes de atendimento, call centers, suporte técnico (em ambiente de testes)


      **Requer**: Instância do Chatwoot configurada, tokens de API e ambiente de testes


      **🚧 Lembre-se**: Integração em BETA - funcionalidades podem mudar sem aviso prévio
paths:
  /instance/init:
    post:
      tags:
        - Admininstração
      summary: Criar Instancia
      security:
        - admintoken: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  description: Nome da instância
                  example: minha-instancia
                systemName:
                  type: string
                  description: Nome do sistema (opcional, padrão 'uazapiGO' se não informado)
                  example: apilocal
                adminField01:
                  type: string
                  description: Campo administrativo 1 para metadados personalizados (opcional)
                  example: custom-metadata-1
                adminField02:
                  type: string
                  description: Campo administrativo 2 para metadados personalizados (opcional)
                  example: custom-metadata-2
              required:
                - name
      description: >
        Cria uma nova instância do WhatsApp. Para criar uma instância você precisa:


        1. Ter um admintoken válido

        2. Enviar pelo menos o nome da instância

        3. A instância será criada desconectada

        4. Será gerado um token único para autenticação


        Após criar a instância, guarde o token retornado pois ele será necessário

        para todas as outras operações.


        Estados possíveis da instância:


        - `disconnected`: Desconectado do WhatsApp

        - `connecting`: Em processo de conexão

        - `connected`: Conectado e autenticado


        Campos administrativos (adminField01/adminField02) são opcionais e podem ser usados para armazenar metadados
        personalizados. 

        OS valores desses campos são vísiveis para o dono da instancia via token, porém apenas o administrador da api
        (via admin token) pode editá-los.
      responses:
        '200':
          description: Sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Instance created successfully
                  instance:
                    $ref: ../schemas/instance.yaml#/Instance
                  connected:
                    type: boolean
                    example: false
                  loggedIn:
                    type: boolean
                    example: false
                  name:
                    type: string
                    example: minha-instancia
                  token:
                    type: string
                    example: 123e4567-e89b-12d3-a456-426614174000
                  info:
                    type: string
                    example: This instance will be automatically disconnected and deleted after 1 hour.
        '401':
          description: Token inválido/expirado
        '404':
          description: Instância não encontrada
        '500':
          description: Erro interno
  /instance/all:
    get:
      tags:
        - Admininstração
      summary: Listar todas as instâncias
      security:
        - admintoken: []
      description: |
        Retorna uma lista completa de todas as instâncias do sistema, incluindo:
        - ID e nome de cada instância
        - Status atual (disconnected, connecting, connected)
        - Data de criação
        - Última desconexão e motivo
        - Informações de perfil (se conectado)

        Requer permissões de administrador.
      responses:
        '200':
          description: Lista de instâncias retornada com sucesso
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: ../schemas/instance.yaml#/Instance
              example:
                - id: r183e2ef9597845
                  name: instancia-1
                  token: abc123xyz
                  status: connected
                  profileName: Meu WhatsApp
                  profilePicUrl: https://example.com/profile.jpg
                  isBusiness: true
                  plataform: Android
                  systemName: uazapi
                  owner: user@example.com
                  created: '2024-01-01T12:00:00.000Z'
                  updated: '2024-01-01T12:30:00.000Z'
                - id: r283e2ef9597846
                  name: instancia-2
                  token: def456xyz
                  status: disconnected
                  lastDisconnect: '2024-01-02T12:00:00.000Z'
                  lastDisconnectReason: manual disconnect
                  created: '2024-01-02T12:00:00.000Z'
                  updated: '2024-01-02T12:30:00.000Z'
        '401':
          description: Token inválido ou expirado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Unauthorized
        '403':
          description: Token de administrador inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid AdminToken Header
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
  /instance/connect:
    post:
      tags:
        - Instancia
      summary: Conectar instância ao WhatsApp
      description: |
        Inicia o processo de conexão de uma instância ao WhatsApp. Este endpoint:
        1. Requer o token de autenticação da instância
        2. Recebe o número de telefone associado à conta WhatsApp
        3. Gera um QR code caso não passe o campo `phone`
        4. Ou Gera código de pareamento se passar o o campo `phone`
        5. Atualiza o status da instância para "connecting"

        O processo de conexão permanece pendente até que:
        - O QR code seja escaneado no WhatsApp do celular, ou
        - O código de pareamento seja usado no WhatsApp
        - Timeout de 2 minutos para QRCode seja atingido ou 5 minutos para o código de pareamento

        Use o endpoint /instance/status para monitorar o progresso da conexão.

        Estados possíveis da instância:
        - `disconnected`: Desconectado do WhatsApp
        - `connecting`: Em processo de conexão
        - `connected`: Conectado e autenticado

        Exemplo de requisição:
        ```json
        {
          "phone": "5511999999999"
        }
        ```
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                phone:
                  type: string
                  description: 'Número de telefone no formato internacional (ex: 5511999999999)'
                  example: '5511999999999'
                  pattern: ^\d{10,15}$
              required:
                - phone
      responses:
        '200':
          description: Sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  connected:
                    type: boolean
                    description: Estado atual da conexão
                    example: false
                  loggedIn:
                    type: boolean
                    description: Estado do login
                    example: false
                  jid:
                    type: object
                    description: ID do WhatsApp (quando logado)
                    nullable: true
                    example: null
                  instance:
                    $ref: ../schemas/instance.yaml#/Instance
                    description: Detalhes completos da instância
        '401':
          description: Token inválido/expirado
        '404':
          description: Instância não encontrada
        '429':
          description: Limite de conexões simultâneas atingido
        '500':
          description: Erro interno
  /instance/disconnect:
    post:
      tags:
        - Instancia
      summary: Desconectar instância
      description: |
        Desconecta a instância do WhatsApp, encerrando a sessão atual.
        Esta operação:

        - Encerra a conexão ativa

        - Requer novo QR code para reconectar


        Diferenças entre desconectar e hibernar:

        - Desconectar: Encerra completamente a sessão, exigindo novo login

        - Hibernar: Mantém a sessão ativa, apenas pausa a conexão


        Use este endpoint para:

        1. Encerrar completamente uma sessão

        2. Forçar uma nova autenticação

        3. Limpar credenciais de uma instância

        4. Reiniciar o processo de conexão


        Estados possíveis após desconectar:

        - `disconnected`: Desconectado do WhatsApp

        - `connecting`: Em processo de reconexão (após usar /instance/connect)
    responses:
      '200':
        description: Sucesso
        content:
          application/json:
            schema:
              type: object
              properties:
                instance:
                  $ref: ../schemas/instance.yaml#/Instance
                response:
                  type: string
                  example: Disconnected
                info:
                  type: string
                  example: >-
                    The device has been successfully disconnected from WhatsApp. A new QR code will be required for the
                    next connection.
      '401':
        description: Token inválido/expirado
      '404':
        description: Instância não encontrada
      '500':
        description: Erro interno
  /instance/status:
    get:
      tags:
        - Instancia
      summary: Verificar status da instância
      description: |
        Retorna o status atual de uma instância, incluindo:
        - Estado da conexão (disconnected, connecting, connected)
        - QR code atualizado (se em processo de conexão)
        - Código de pareamento (se disponível)
        - Informações da última desconexão
        - Detalhes completos da instância

        Este endpoint é particularmente útil para:
        1. Monitorar o progresso da conexão
        2. Obter QR codes atualizados durante o processo de conexão
        3. Verificar o estado atual da instância
        4. Identificar problemas de conexão

        Estados possíveis:
        - `disconnected`: Desconectado do WhatsApp
        - `connecting`: Em processo de conexão (aguardando QR code ou código de pareamento)
        - `connected`: Conectado e autenticado com sucesso
      responses:
        '200':
          description: Sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  instance:
                    $ref: ../schemas/instance.yaml#/Instance
                  status:
                    type: object
                    properties:
                      connected:
                        type: boolean
                        description: Indica se está conectado ao WhatsApp
                      loggedIn:
                        type: boolean
                        description: Indica se está autenticado no WhatsApp
                      jid:
                        type: object
                        description: ID do WhatsApp quando conectado
                        nullable: true
              example:
                instance:
                  id: r183e2ef9597845
                  name: minha-instancia
                  status: connected
                  profileName: Meu WhatsApp
                  currentTime: '2024-01-25T12:00:00.000Z'
                status:
                  connected: true
                  loggedIn: true
                  jid:
                    user: '5511999999999'
                    agent: 0
                    device: 0
                    server: s.whatsapp.net
        '401':
          description: Token inválido/expirado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: instance info not found
        '404':
          description: Instância não encontrada
        '500':
          description: Erro interno
  /instance/updatechatbotsettings:
    post:
      tags:
        - Chatbot Configurações
      summary: Chatbot Configurações
      description: >
        Explicação dos campos:



        - `openai_apikey`: Chave da API OpenAI (começa com "sk-")  


        - `chatbot_enabled`: Habilita/desabilita o chatbot  


        - `chatbot_ignoreGroups`: Define se o chatbot deve ignorar mensagens de grupos  


        - `chatbot_stopConversation`: Palavra-chave que os usuários podem usar para parar o chatbot  


        - `chatbot_stopMinutes`: Por quantos minutos o chatbot deve ficar desativado após receber o comando de parada  


        - `chatbot_stopWhenYouSendMsg`: Por quantos minutos o chatbot deve ficar desativado após você enviar uma
        mensagem fora da API, 0 desliga.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              example:
                openai_apikey: sk-1234567890abcdefghijklmnopqrstuvwxyz
                chatbot_enabled: true
                chatbot_ignoreGroups: true
                chatbot_stopConversation: stop
                chatbot_stopMinutes: 30
                chatbot_stopWhenYouSendMsg: 5
      responses:
        '200':
          description: Sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/instance.yaml#/Instance
        '401':
          description: Token inválido/expirado
        '404':
          description: Instância não encontrada
        '500':
          description: Erro interno
  /instance/updateFieldsMap:
    post:
      tags:
        - CRM
      summary: Atualizar campos personalizados de leads
      description: |
        Atualiza os campos personalizados (custom fields) de uma instância. 
        Permite configurar até 20 campos personalizados para armazenamento de 
        informações adicionais sobre leads.

        Cada campo pode armazenar até 255 caracteres e aceita qualquer tipo de dado.

        Campos disponíveis:
        - lead_field01 a lead_field20

        Exemplo de uso:
        1. Armazenar informações adicionais sobre leads
        2. Criar campos personalizados para integração com outros sistemas
        3. Armazenar tags ou categorias personalizadas
        4. Manter histórico de interações com o lead

        Exemplo de requisição:
        ```json
        {
          "lead_field01": "nome",
          "lead_field02": "email",
          "lead_field03": "telefone",
          "lead_field04": "cidade",
          "lead_field05": "estado",
          "lead_field06": "idade",
          "lead_field07": "interesses",
          "lead_field08": "origem",
          "lead_field09": "status",
          "lead_field10": "valor",
          "lead_field11": "observacoes",
          "lead_field12": "ultima_interacao",
          "lead_field13": "proximo_contato",
          "lead_field14": "vendedor",
          "lead_field15": "produto_interesse",
          "lead_field16": "fonte_captacao",
          "lead_field17": "score",
          "lead_field18": "tags",
          "lead_field19": "historico",
          "lead_field20": "custom"
        }
        ```

        Exemplo de resposta:
        ```json
        {
          "success": true,
          "message": "Custom fields updated successfully",
          "instance": {
            "id": "r183e2ef9597845",
            "name": "minha-instancia",
            "fieldsMap": {
              "lead_field01": "nome",
              "lead_field02": "email",
              "lead_field03": "telefone",
              "lead_field04": "cidade",
              "lead_field05": "estado",
              "lead_field06": "idade",
              "lead_field07": "interesses",
              "lead_field08": "origem",
              "lead_field09": "status",
              "lead_field10": "valor",
              "lead_field11": "observacoes",
              "lead_field12": "ultima_interacao",
              "lead_field13": "proximo_contato",
              "lead_field14": "vendedor",
              "lead_field15": "produto_interesse",
              "lead_field16": "fonte_captacao",
              "lead_field17": "score",
              "lead_field18": "tags",
              "lead_field19": "historico",
              "lead_field20": "custom"
            }
          }
        }
        ```

        Erros comuns:
        - 400: Campos inválidos ou payload mal formatado
        - 401: Token inválido ou expirado
        - 404: Instância não encontrada
        - 500: Erro ao atualizar campos no banco de dados

        Restrições:
        - Cada campo pode ter no máximo 255 caracteres
        - Campos vazios serão mantidos com seus valores atuais
        - Apenas os campos enviados serão atualizados
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                lead_field01:
                  type: string
                  description: Campo personalizado 01
                  maxLength: 255
                lead_field02:
                  type: string
                  description: Campo personalizado 02
                  maxLength: 255
                lead_field03:
                  type: string
                  description: Campo personalizado 03
                  maxLength: 255
                lead_field04:
                  type: string
                  description: Campo personalizado 04
                  maxLength: 255
                lead_field05:
                  type: string
                  description: Campo personalizado 05
                  maxLength: 255
                lead_field06:
                  type: string
                  description: Campo personalizado 06
                  maxLength: 255
                lead_field07:
                  type: string
                  description: Campo personalizado 07
                  maxLength: 255
                lead_field08:
                  type: string
                  description: Campo personalizado 08
                  maxLength: 255
                lead_field09:
                  type: string
                  description: Campo personalizado 09
                  maxLength: 255
                lead_field10:
                  type: string
                  description: Campo personalizado 10
                  maxLength: 255
                lead_field11:
                  type: string
                  description: Campo personalizado 11
                  maxLength: 255
                lead_field12:
                  type: string
                  description: Campo personalizado 12
                  maxLength: 255
                lead_field13:
                  type: string
                  description: Campo personalizado 13
                  maxLength: 255
                lead_field14:
                  type: string
                  description: Campo personalizado 14
                  maxLength: 255
                lead_field15:
                  type: string
                  description: Campo personalizado 15
                  maxLength: 255
                lead_field16:
                  type: string
                  description: Campo personalizado 16
                  maxLength: 255
                lead_field17:
                  type: string
                  description: Campo personalizado 17
                  maxLength: 255
                lead_field18:
                  type: string
                  description: Campo personalizado 18
                  maxLength: 255
                lead_field19:
                  type: string
                  description: Campo personalizado 19
                  maxLength: 255
                lead_field20:
                  type: string
                  description: Campo personalizado 20
                  maxLength: 255
      responses:
        '200':
          description: Sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/instance.yaml#/Instance
        '401':
          description: Token inválido/expirado
        '404':
          description: Instância não encontrada
        '500':
          description: Erro interno
  /instance/updateInstanceName:
    post:
      tags:
        - Instancia
      summary: Atualizar nome da instância
      description: "Atualiza o nome de uma instância WhatsApp existente.\nO nome não precisa ser único.\t\n"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  description: Novo nome para a instância
                  example: Minha Nova Instância 2024!@#
              required:
                - name
      responses:
        '200':
          description: Sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/instance.yaml#/Instance
        '401':
          description: Token inválido/expirado
        '404':
          description: Instância não encontrada
        '500':
          description: Erro interno
  /instance/updateAdminFields:
    post:
      tags:
        - Admininstração
      summary: Atualizar campos administrativos
      security:
        - admintoken: []
      description: >
        Atualiza os campos administrativos (adminField01/adminField02) de uma instância.


        Campos administrativos são opcionais e podem ser usados para armazenar metadados personalizados. 

        Estes campos são persistidos no banco de dados e podem ser utilizados para integrações com outros sistemas ou
        para armazenamento de informações internas.

        OS valores desses campos são vísiveis para o dono da instancia via token, porém apenas o administrador da api
        (via admin token) pode editá-los.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                  description: ID da instância
                  example: inst_123456
                adminField01:
                  type: string
                  description: Campo administrativo 1
                  example: clientId_456
                adminField02:
                  type: string
                  description: Campo administrativo 2
                  example: integration_xyz
              required:
                - id
      responses:
        '200':
          description: Campos atualizados com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/instance.yaml#/Instance
        '401':
          description: Token de administrador inválido
        '404':
          description: Instância não encontrada
        '500':
          description: Erro interno
  /profile/name:
    post:
      tags:
        - Perfil
      summary: Altera o nome do perfil do WhatsApp
      description: |
        Altera o nome de exibição do perfil da instância do WhatsApp.

        O endpoint realiza:
        - Atualiza o nome do perfil usando o WhatsApp AppState
        - Sincroniza a mudança com o servidor do WhatsApp
        - Retorna confirmação da alteração

        **Importante**: 
        - A instância deve estar conectada ao WhatsApp
        - O nome será visível para todos os contatos
        - Pode haver um limite de alterações por período (conforme WhatsApp)
      security:
        - token: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  type: string
                  description: Novo nome do perfil do WhatsApp
                  example: Minha Empresa - Atendimento
                  maxLength: 25
      responses:
        '200':
          description: Nome do perfil alterado com sucesso
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
                    example: Nome do perfil alterado com sucesso
                  profile:
                    type: object
                    properties:
                      name:
                        type: string
                        description: Novo nome do perfil
                        example: Minha Empresa - Atendimento
                      updated_at:
                        type: integer
                        description: Timestamp da alteração (Unix timestamp)
                        example: 1704067200
        '400':
          description: Dados inválidos na requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Nome muito longo ou inválido
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
        '403':
          description: Ação não permitida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Limite de alterações excedido ou conta com restrições
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Erro ao alterar nome do perfil
  /profile/image:
    post:
      tags:
        - Perfil
      summary: Altera a imagem do perfil do WhatsApp
      description: |
        Altera a imagem de perfil da instância do WhatsApp.

        O endpoint realiza:
        - Atualiza a imagem do perfil usando 
        - Processa a imagem (URL, base64 ou comando de remoção)
        - Sincroniza a mudança com o servidor do WhatsApp
        - Retorna confirmação da alteração

        **Importante**: 
        - A instância deve estar conectada ao WhatsApp
        - A imagem será visível para todos os contatos
        - A imagem deve estar em formato JPEG e tamanho 640x640 pixels
      security:
        - token: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - image
              properties:
                image:
                  type: string
                  description: |
                    Imagem do perfil. Pode ser:
                    - URL da imagem (http/https)
                    - String base64 da imagem
                    - "remove" ou "delete" para remover a imagem atual
                  example: https://picsum.photos/640/640.jpg
                  oneOf:
                    - description: URL da imagem
                      example: https://picsum.photos/640/640.jpg
                    - description: Imagem em base64
                      example: >-
                        data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=
                    - description: Comando para remover imagem
                      example: remove
      responses:
        '200':
          description: Imagem do perfil alterada com sucesso
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
                    example: Imagem do perfil alterada com sucesso
                  profile:
                    type: object
                    properties:
                      image_updated:
                        type: boolean
                        description: Indica se a imagem foi atualizada
                        example: true
                      image_removed:
                        type: boolean
                        description: Indica se a imagem foi removida
                        example: false
                      updated_at:
                        type: integer
                        description: Timestamp da alteração (Unix timestamp)
                        example: 1704067200
        '400':
          description: Dados inválidos na requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Formato de imagem inválido ou URL inacessível
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
        '403':
          description: Ação não permitida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Limite de alterações excedido ou conta com restrições
        '413':
          description: Imagem muito grande
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Imagem muito grande, tamanho máximo permitido excedido
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Erro ao alterar imagem do perfil
  /instance:
    delete:
      tags:
        - Instancia
      summary: Deletar instância
      description: |
        Remove a instância do sistema.
      security:
        - token: []
      responses:
        '200':
          description: Instância deletada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Instance Deleted
                  info:
                    type: string
                    example: O dispositivo foi desconectado com sucesso e a instância foi removida do banco de dados.
        '401':
          description: Falha na autenticação
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Não autorizado - Token inválido ou ausente
        '404':
          description: Instância não encontrada
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Instância não encontrada
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Falha ao deletar instância
  /instance/privacy:
    get:
      tags:
        - Instancia
      summary: Buscar configurações de privacidade
      description: >
        Busca as configurações de privacidade atuais da instância do WhatsApp.


        **Importante - Diferença entre Status e Broadcast:**


        - **Status**: Refere-se ao recado personalizado que aparece embaixo do nome do usuário (ex: "Disponível",
        "Ocupado", texto personalizado)

        - **Broadcast**: Refere-se ao envio de "stories/reels" (fotos/vídeos temporários)


        **Limitação**: As configurações de privacidade do broadcast (stories/reels) não estão disponíveis para alteração
        via API.


        Retorna todas as configurações de privacidade como quem pode:

        - Adicionar aos grupos

        - Ver visto por último

        - Ver status (recado embaixo do nome)

        - Ver foto de perfil

        - Receber confirmação de leitura

        - Ver status online

        - Fazer chamadas
      operationId: getPrivacySettings
      responses:
        '200':
          description: Configurações de privacidade obtidas com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  groupadd:
                    type: string
                    enum:
                      - all
                      - contacts
                      - contact_blacklist
                      - none
                    description: Quem pode adicionar aos grupos. Valores - all, contacts, contact_blacklist, none
                    example: contacts
                  last:
                    type: string
                    enum:
                      - all
                      - contacts
                      - contact_blacklist
                      - none
                    description: Quem pode ver visto por último. Valores - all, contacts, contact_blacklist, none
                    example: contacts
                  status:
                    type: string
                    enum:
                      - all
                      - contacts
                      - contact_blacklist
                      - none
                    description: Quem pode ver status (recado embaixo do nome). Valores - all, contacts, contact_blacklist, none
                    example: contacts
                  profile:
                    type: string
                    enum:
                      - all
                      - contacts
                      - contact_blacklist
                      - none
                    description: Quem pode ver foto de perfil. Valores - all, contacts, contact_blacklist, none
                    example: contacts
                  readreceipts:
                    type: string
                    enum:
                      - all
                      - none
                    description: Confirmação de leitura. Valores - all, none
                    example: all
                  online:
                    type: string
                    enum:
                      - all
                      - match_last_seen
                    description: Quem pode ver status online. Valores - all, match_last_seen
                    example: all
                  calladd:
                    type: string
                    enum:
                      - all
                      - known
                    description: Quem pode fazer chamadas. Valores - all, known
                    example: all
              examples:
                success:
                  summary: Configurações de privacidade obtidas
                  value:
                    groupadd: contacts
                    last: contacts
                    status: contacts
                    profile: contacts
                    readreceipts: all
                    online: all
                    calladd: all
        '401':
          description: Token de autenticação inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
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
                    example: No session
    post:
      tags:
        - Instancia
      summary: Alterar configurações de privacidade
      description: >
        Altera uma ou múltiplas configurações de privacidade da instância do WhatsApp de forma otimizada.


        **Importante - Diferença entre Status e Broadcast:**


        - **Status**: Refere-se ao recado personalizado que aparece embaixo do nome do usuário (ex: "Disponível",
        "Ocupado", texto personalizado)

        - **Broadcast**: Refere-se ao envio de "stories/reels" (fotos/vídeos temporários)


        **Limitação**: As configurações de privacidade do broadcast (stories/reels) não estão disponíveis para alteração
        via API.


        **Características:**

        - ✅ **Eficiência**: Altera apenas configurações que realmente mudaram

        - ✅ **Flexibilidade**: Pode alterar uma ou múltiplas configurações na mesma requisição

        - ✅ **Feedback completo**: Retorna todas as configurações atualizadas


        **Formato de entrada:**

        ```json

        {
          "groupadd": "contacts",
          "last": "none",
          "status": "contacts"
        }

        ```


        **Tipos de privacidade disponíveis:**

        - `groupadd`: Quem pode adicionar aos grupos

        - `last`: Quem pode ver visto por último

        - `status`: Quem pode ver status (recado embaixo do nome)

        - `profile`: Quem pode ver foto de perfil

        - `readreceipts`: Confirmação de leitura

        - `online`: Quem pode ver status online

        - `calladd`: Quem pode fazer chamadas


        **Valores possíveis:**

        - `all`: Todos

        - `contacts`: Apenas contatos

        - `contact_blacklist`: Contatos exceto bloqueados

        - `none`: Ninguém

        - `match_last_seen`: Corresponder ao visto por último (apenas para online)

        - `known`: Números conhecidos (apenas para calladd)
      operationId: setPrivacySetting
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                groupadd:
                  type: string
                  enum:
                    - all
                    - contacts
                    - contact_blacklist
                    - none
                  description: Quem pode adicionar aos grupos. Valores - all, contacts, contact_blacklist, none
                last:
                  type: string
                  enum:
                    - all
                    - contacts
                    - contact_blacklist
                    - none
                  description: Quem pode ver visto por último. Valores - all, contacts, contact_blacklist, none
                status:
                  type: string
                  enum:
                    - all
                    - contacts
                    - contact_blacklist
                    - none
                  description: Quem pode ver status (recado embaixo do nome). Valores - all, contacts, contact_blacklist, none
                profile:
                  type: string
                  enum:
                    - all
                    - contacts
                    - contact_blacklist
                    - none
                  description: Quem pode ver foto de perfil. Valores - all, contacts, contact_blacklist, none
                readreceipts:
                  type: string
                  enum:
                    - all
                    - none
                  description: Confirmação de leitura. Valores - all, none
                online:
                  type: string
                  enum:
                    - all
                    - match_last_seen
                  description: Quem pode ver status online. Valores - all, match_last_seen
                calladd:
                  type: string
                  enum:
                    - all
                    - known
                  description: Quem pode fazer chamadas. Valores - all, known
              minProperties: 1
              additionalProperties: false
            examples:
              single_setting:
                summary: Alterar uma configuração
                value:
                  groupadd: contacts
              multiple_settings:
                summary: Alterar múltiplas configurações
                value:
                  groupadd: contacts
                  last: none
                  status: contacts
                  profile: contacts
              privacy_strict:
                summary: Configuração mais restritiva
                value:
                  groupadd: none
                  last: none
                  status: contacts
                  profile: contacts
                  readreceipts: none
      responses:
        '200':
          description: Configuração de privacidade alterada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  groupadd:
                    type: string
                    enum:
                      - all
                      - contacts
                      - contact_blacklist
                      - none
                    description: Quem pode adicionar aos grupos. Valores - all, contacts, contact_blacklist, none
                  last:
                    type: string
                    enum:
                      - all
                      - contacts
                      - contact_blacklist
                      - none
                    description: Quem pode ver visto por último. Valores - all, contacts, contact_blacklist, none
                  status:
                    type: string
                    enum:
                      - all
                      - contacts
                      - contact_blacklist
                      - none
                    description: Quem pode ver status (recado embaixo do nome). Valores - all, contacts, contact_blacklist, none
                  profile:
                    type: string
                    enum:
                      - all
                      - contacts
                      - contact_blacklist
                      - none
                    description: Quem pode ver foto de perfil. Valores - all, contacts, contact_blacklist, none
                  readreceipts:
                    type: string
                    enum:
                      - all
                      - none
                    description: Confirmação de leitura. Valores - all, none
                  online:
                    type: string
                    enum:
                      - all
                      - match_last_seen
                    description: Quem pode ver status online. Valores - all, match_last_seen
                  calladd:
                    type: string
                    enum:
                      - all
                      - known
                    description: Quem pode fazer chamadas. Valores - all, known
              examples:
                success:
                  summary: Configurações atualizadas após alteração
                  value:
                    groupadd: contacts
                    last: contacts
                    status: contacts
                    profile: contacts
                    readreceipts: all
                    online: all
                    calladd: all
        '400':
          description: Dados de entrada inválidos
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
              examples:
                no_valid_settings:
                  summary: Nenhuma configuração válida encontrada
                  value:
                    error: 'No valid privacy settings found. Use format: {"groupadd": "contacts", "last": "none"}'
                invalid_value_type:
                  summary: Valor deve ser string
                  value:
                    error: Value for groupadd must be a non-empty string
                invalid_privacy_type:
                  summary: Tipo de privacidade inválido
                  value:
                    error: >-
                      invalid privacy type: invalidtype. Valid types: groupadd, last, status, profile, readreceipts,
                      online, calladd
                invalid_privacy_value:
                  summary: Valor de privacidade inválido
                  value:
                    error: >-
                      invalid privacy value: invalidvalue. Valid values: all, contacts, contact_blacklist, none,
                      match_last_seen, known
        '401':
          description: Token de autenticação inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
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
              examples:
                no_session:
                  summary: Sem sessão ativa
                  value:
                    error: No session
                whatsapp_error:
                  summary: Erro do WhatsApp
                  value:
                    error: 'Failed to set privacy setting: context deadline exceeded'
  /instance/presence:
    post:
      tags:
        - Instancia
      summary: Atualizar status de presença da instância
      description: >
        Atualiza o status de presença global da instância do WhatsApp. Este endpoint permite:

        1. Definir se a instância está disponível (Aparece "online") ou indisponível

        2. Controlar o status de presença para todos os contatos

        3. Salvar o estado atual da presença na instância


        Tipos de presença suportados:

        - available: Marca a instância como disponível/online

        - unavailable: Marca a instância como indisponível/offline


        **Atenção**:

        - O status de presença pode ser temporariamente alterado para "available" (online) em algumas situações internas
        da API, e com isso o visto por último também pode ser atualizado.

        - Caso isso for um problema, considere alterar suas configurações de privacidade no WhatsApp para não mostrar o
        visto por último e/ou quem pode ver seu status "online".


        **⚠️ Importante - Limitação do Presence "unavailable"**:

        - **Quando a API é o único dispositivo ativo**: Confirmações de entrega/leitura (ticks cinzas/azuis) não são
        enviadas nem recebidas

        - **Impacto**: Eventos `message_update` com status de entrega podem não ser recebidos

        - **Solução**: Se precisar das confirmações, mantenha WhatsApp Web ou aplicativo móvel ativo ou use presence
        "available" 


        Exemplo de requisição:

        ```json

        {
          "presence": "available"
        }

        ```


        Exemplo de resposta:

        ```json

        {
          "response": "Presence updated successfully"
        }

        ```


        Erros comuns:

        - 401: Token inválido ou expirado

        - 400: Valor de presença inválido

        - 500: Erro ao atualizar presença
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                presence:
                  type: string
                  description: Status de presença da instância
                  enum:
                    - available
                    - unavailable
                  example: available
              required:
                - presence
      responses:
        '200':
          description: Presença atualizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    description: Mensagem de confirmação
                    example: Presence updated successfully
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
                      invalid_payload: Invalid payload
                      invalid_presence: Invalid presence value, use available or unavailable
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
                    example: No session
  /send/text:
    post:
      tags:
        - Enviar Mensagem
      summary: Enviar mensagem de texto
      description: >
        Envia uma mensagem de texto para um contato ou grupo.


        ## Recursos Específicos


        - **Preview de links** com suporte a personalização automática ou customizada

        - **Formatação básica** do texto

        - **Substituição automática de placeholders** dinâmicos


        ## Campos Comuns


        Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:

        `delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders
        e envio para grupos.


        ## Preview de Links


        ### Preview Automático

        ```json

        {
          "number": "5511999999999",
          "text": "Confira: https://exemplo.com",
          "linkPreview": true
        }

        ```


        ### Preview Personalizado

        ```json

        {
          "number": "5511999999999",
          "text": "Confira nosso site! https://exemplo.com",
          "linkPreview": true,
          "linkPreviewTitle": "Título Personalizado",
          "linkPreviewDescription": "Uma descrição personalizada do link",
          "linkPreviewImage": "https://exemplo.com/imagem.jpg",
          "linkPreviewLarge": true
        }

        ```
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do destinatário (formato internacional)
                  example: '5511999999999'
                text:
                  type: string
                  description: Texto da mensagem (aceita placeholders)
                  example: Olá {{name}}! Como posso ajudar?
                linkPreview:
                  type: boolean
                  description: >
                    Ativa/desativa preview de links. Se true, procura automaticamente um link no texto para gerar
                    preview.


                    Comportamento:

                    - Se apenas linkPreview=true: gera preview automático do primeiro link encontrado no texto

                    - Se fornecidos campos personalizados (title, description, image): usa os valores fornecidos

                    - Se campos personalizados parciais: combina com dados automáticos do link como fallback
                  example: true
                linkPreviewTitle:
                  type: string
                  description: Define um título personalizado para o preview do link
                  example: Título Personalizado
                linkPreviewDescription:
                  type: string
                  description: Define uma descrição personalizada para o preview do link
                  example: Descrição personalizada do link
                linkPreviewImage:
                  type: string
                  description: URL ou Base64 da imagem para usar no preview do link
                  example: https://exemplo.com/imagem.jpg
                linkPreviewLarge:
                  type: boolean
                  description: Se true, gera um preview grande com upload da imagem. Se false, gera um preview pequeno sem upload
                  example: true
                replyid:
                  type: string
                  description: ID da mensagem para responder
                  example: 3EB0538DA65A59F6D8A251
                mentions:
                  type: string
                  description: Números para mencionar (separados por vírgula)
                  example: 5511999999999,5511888888888
                readchat:
                  type: boolean
                  description: Marca conversa como lida após envio
                  example: true
                readmessages:
                  type: boolean
                  description: Marca últimas mensagens recebidas como lidas
                  example: true
                delay:
                  type: integer
                  description: Atraso em milissegundos antes do envio, durante o atraso apacerá 'Digitando...'
                  example: 1000
                forward:
                  type: boolean
                  description: Marca a mensagem como encaminhada no WhatsApp
                  example: true
                track_source:
                  type: string
                  description: Origem do rastreamento da mensagem
                  example: chatwoot
                track_id:
                  type: string
                  description: ID para rastreamento da mensagem (aceita valores duplicados)
                  example: msg_123456789
              required:
                - number
                - text
            examples:
              basic:
                summary: Mensagem básica
                description: Exemplo mais simples possível
                value:
                  number: '5511999999999'
                  text: Olá! Como posso ajudar?
              withLinkPreview:
                summary: Com preview automático
                description: Preview automático de link no texto
                value:
                  number: '5511999999999'
                  text: 'Confira: https://exemplo.com'
                  linkPreview: true
              customLinkPreview:
                summary: Preview personalizado
                description: Preview com título, descrição e imagem customizados
                value:
                  number: '5511999999999'
                  text: Confira nosso site! https://exemplo.com
                  linkPreview: true
                  linkPreviewTitle: Título Personalizado
                  linkPreviewDescription: Uma descrição personalizada do link
                  linkPreviewImage: https://exemplo.com/imagem.jpg
                  linkPreviewLarge: true
              withPlaceholders:
                summary: Com placeholders
                description: Texto com variáveis dinâmicas
                value:
                  number: '5511999999999'
                  text: Olá {{name}}! Sua empresa {{company}} está cadastrada.
      responses:
        '200':
          description: Mensagem enviada com sucesso
          content:
            application/json:
              schema:
                allOf:
                  - $ref: ../schemas/message.yaml#/Message
                  - type: object
                    properties:
                      response:
                        type: object
                        properties:
                          status:
                            type: string
                            example: success
                          message:
                            type: string
                            example: Message sent successfully
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Missing number or text
        '401':
          description: Não autorizado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid token
        '429':
          description: Limite de requisições excedido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Rate limit exceeded
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to send message
  /send/media:
    post:
      tags:
        - Enviar Mensagem
      summary: Enviar mídia (imagem, vídeo, áudio ou documento)
      description: >
        Envia diferentes tipos de mídia para um contato ou grupo. Suporta URLs ou arquivos base64.


        ## Tipos de Mídia Suportados

        - **`image`**: Imagens (JPG preferencialmente)

        - **`video`**: Vídeos (apenas MP4)

        - **`document`**: Documentos (PDF, DOCX, XLSX, etc)

        - **`audio`**: Áudio comum (MP3 ou OGG)

        - **`myaudio`**: Mensagem de voz (alternativa ao PTT)

        - **`ptt`**: Mensagem de voz (Push-to-Talk)

        - **`sticker`**: Figurinha/Sticker


        ## Recursos Específicos

        - **Upload por URL ou base64**

        - **Caption/legenda** opcional com suporte a placeholders

        - **Nome personalizado** para documentos (`docName`)

        - **Geração automática de thumbnails**

        - **Compressão otimizada** conforme o tipo


        ## Campos Comuns


        Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:

        `delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders
        e envio para grupos.


        ## Exemplos Básicos


        ### Imagem Simples

        ```json

        {
          "number": "5511999999999",
          "type": "image",
          "file": "https://exemplo.com/foto.jpg"
        }

        ```


        ### Documento com Nome

        ```json

        {
          "number": "5511999999999",
          "type": "document",
          "file": "https://exemplo.com/contrato.pdf",
          "docName": "Contrato.pdf",
          "text": "Segue o documento solicitado"
        }

        ```
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do destinatário (formato internacional)
                  example: '5511999999999'
                type:
                  type: string
                  description: Tipo de mídia (image, video, document, audio, myaudio, ptt, sticker)
                  enum:
                    - image
                    - video
                    - document
                    - audio
                    - myaudio
                    - ptt
                    - sticker
                  example: image
                file:
                  type: string
                  description: URL ou base64 do arquivo
                  example: https://exemplo.com/imagem.jpg
                text:
                  type: string
                  description: Texto descritivo (caption) - aceita placeholders
                  example: Veja esta foto!
                docName:
                  type: string
                  description: Nome do arquivo (apenas para documents)
                  example: relatorio.pdf
                replyid:
                  type: string
                  description: ID da mensagem para responder
                  example: 3EB0538DA65A59F6D8A251
                mentions:
                  type: string
                  description: Números para mencionar (separados por vírgula)
                  example: 5511999999999,5511888888888
                readchat:
                  type: boolean
                  description: Marca conversa como lida após envio
                  example: true
                readmessages:
                  type: boolean
                  description: Marca últimas mensagens recebidas como lidas
                  example: true
                delay:
                  type: integer
                  description: >-
                    Atraso em milissegundos antes do envio, durante o atraso apacerá 'Digitando...' ou 'Gravando
                    áudio...'
                  example: 1000
                forward:
                  type: boolean
                  description: Marca a mensagem como encaminhada no WhatsApp
                  example: true
                track_source:
                  type: string
                  description: Origem do rastreamento da mensagem
                  example: chatwoot
                track_id:
                  type: string
                  description: ID para rastreamento da mensagem (aceita valores duplicados)
                  example: msg_123456789
              required:
                - number
                - type
                - file
            examples:
              image:
                summary: Imagem
                description: Envio de imagem simples
                value:
                  number: '5511999999999'
                  type: image
                  file: https://exemplo.com/foto.jpg
              imageWithCaption:
                summary: Imagem com legenda
                description: Imagem com texto descritivo
                value:
                  number: '5511999999999'
                  type: image
                  file: https://exemplo.com/foto.jpg
                  text: Veja esta foto!
              document:
                summary: Documento
                description: Documento PDF com nome personalizado
                value:
                  number: '5511999999999'
                  type: document
                  file: https://exemplo.com/contrato.pdf
                  docName: Contrato.pdf
                  text: Segue o documento solicitado
              audio:
                summary: Mensagem de voz
                description: Arquivo de áudio como mensagem de voz
                value:
                  number: '5511999999999'
                  type: ptt
                  file: https://exemplo.com/audio.ogg
              video:
                summary: Vídeo
                description: Arquivo de vídeo com legenda
                value:
                  number: '5511999999999'
                  type: video
                  file: https://exemplo.com/video.mp4
                  text: Confira este vídeo!
              sticker:
                summary: Figurinha
                description: Envio de figurinha/sticker
                value:
                  number: '5511999999999'
                  type: sticker
                  file: https://exemplo.com/sticker.webp
      responses:
        '200':
          description: Mídia enviada com sucesso
          content:
            application/json:
              schema:
                allOf:
                  - $ref: ../schemas/message.yaml#/Message
                  - type: object
                    properties:
                      response:
                        type: object
                        properties:
                          status:
                            type: string
                            example: success
                          message:
                            type: string
                            example: Media sent successfully
                          fileUrl:
                            type: string
                            example: https://mmg.whatsapp.net/...
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid media type or file format
        '401':
          description: Não autorizado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid token
        '413':
          description: Arquivo muito grande
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: File size exceeds limit
        '415':
          description: Formato de mídia não suportado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Unsupported media format
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to upload media
  /send/contact:
    post:
      tags:
        - Enviar Mensagem
      summary: Enviar cartão de contato (vCard)
      description: >
        Envia um cartão de contato (vCard) para um contato ou grupo.


        ## Recursos Específicos


        - **vCard completo** com nome, telefones, organização, email e URL

        - **Múltiplos números de telefone** (separados por vírgula)

        - **Cartão clicável** no WhatsApp para salvar na agenda

        - **Informações profissionais** (organização/empresa)


        ## Campos Comuns


        Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:

        `delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders
        e envio para grupos.


        ## Exemplo Básico

        ```json

        {
          "number": "5511999999999",
          "fullName": "João Silva",
          "phoneNumber": "5511999999999,5511888888888",
          "organization": "Empresa XYZ",
          "email": "joao.silva@empresa.com",
          "url": "https://empresa.com/joao"
        }

        ```
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do destinatário (formato internacional)
                  example: '5511999999999'
                fullName:
                  type: string
                  description: Nome completo do contato
                  example: João Silva
                phoneNumber:
                  type: string
                  description: Números de telefone (separados por vírgula)
                  example: 5511999999999,5511888888888
                organization:
                  type: string
                  description: Nome da organização/empresa
                  example: Empresa XYZ
                email:
                  type: string
                  description: Endereço de email
                  example: joao@empresa.com
                url:
                  type: string
                  description: URL pessoal ou da empresa
                  example: https://empresa.com/joao
                replyid:
                  type: string
                  description: ID da mensagem para responder
                  example: 3EB0538DA65A59F6D8A251
                mentions:
                  type: string
                  description: Números para mencionar (separados por vírgula)
                  example: 5511999999999,5511888888888
                readchat:
                  type: boolean
                  description: Marca conversa como lida após envio
                  example: true
                readmessages:
                  type: boolean
                  description: Marca últimas mensagens recebidas como lidas
                  example: true
                delay:
                  type: integer
                  description: Atraso em milissegundos antes do envio, durante o atraso apacerá 'Digitando...'
                  example: 1000
                forward:
                  type: boolean
                  description: Marca a mensagem como encaminhada no WhatsApp
                  example: true
                track_source:
                  type: string
                  description: Origem do rastreamento da mensagem
                  example: chatwoot
                track_id:
                  type: string
                  description: ID para rastreamento da mensagem (aceita valores duplicados)
                  example: msg_123456789
              required:
                - number
                - fullName
                - phoneNumber
      responses:
        '200':
          description: Cartão de contato enviado com sucesso
          content:
            application/json:
              schema:
                allOf:
                  - $ref: ../schemas/message.yaml#/Message
                  - type: object
                    properties:
                      response:
                        type: object
                        properties:
                          status:
                            type: string
                            example: success
                          message:
                            type: string
                            example: Contact card sent successfully
        '400':
          description: Requisição inválida
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
                    example: Invalid token
        '429':
          description: Limite de requisições excedido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Rate limit exceeded
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to send contact card
  /send/location:
    post:
      tags:
        - Enviar Mensagem
      summary: Enviar localização geográfica
      description: >
        Envia uma localização geográfica para um contato ou grupo.


        ## Recursos Específicos


        - **Coordenadas precisas** (latitude e longitude obrigatórias)

        - **Nome do local** para identificação

        - **Mapa interativo** no WhatsApp para navegação

        - **Pin personalizado** com nome do local


        ## Campos Comuns


        Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:

        `delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders
        e envio para grupos.


        ## Exemplo Básico

        ```json

        {
          "number": "5511999999999",
          "name": "Maracanã",
          "address": "Av. Pres. Castelo Branco, Portão 3 - Maracanã, Rio de Janeiro - RJ, 20271-130",
          "latitude": -22.912982815767986,
          "longitude": -43.23028153499254
        }

        ```
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do destinatário (formato internacional)
                  example: '5511999999999'
                name:
                  type: string
                  description: Nome do local
                  example: MASP
                address:
                  type: string
                  description: Endereço completo do local
                  example: Av. Paulista, 1578 - Bela Vista
                latitude:
                  type: number
                  description: Latitude (-90 a 90)
                  example: -23.5616
                longitude:
                  type: number
                  description: Longitude (-180 a 180)
                  example: -46.6562
                replyid:
                  type: string
                  description: ID da mensagem para responder
                  example: 3EB0538DA65A59F6D8A251
                mentions:
                  type: string
                  description: Números para mencionar (separados por vírgula)
                  example: 5511999999999,5511888888888
                readchat:
                  type: boolean
                  description: Marca conversa como lida após envio
                  example: true
                readmessages:
                  type: boolean
                  description: Marca últimas mensagens recebidas como lidas
                  example: true
                delay:
                  type: integer
                  description: Atraso em milissegundos antes do envio, durante o atraso apacerá 'Digitando...'
                  example: 1000
                forward:
                  type: boolean
                  description: Marca a mensagem como encaminhada no WhatsApp
                  example: true
                track_source:
                  type: string
                  description: Origem do rastreamento da mensagem
                  example: chatwoot
                track_id:
                  type: string
                  description: ID para rastreamento da mensagem (aceita valores duplicados)
                  example: msg_123456789
              required:
                - number
                - latitude
                - longitude
      responses:
        '200':
          description: Localização enviada com sucesso
          content:
            application/json:
              schema:
                allOf:
                  - $ref: ../schemas/message.yaml#/Message
                  - type: object
                    properties:
                      response:
                        type: object
                        properties:
                          status:
                            type: string
                            example: success
                          message:
                            type: string
                            example: Location sent successfully
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid coordinates or missing number
        '401':
          description: Não autorizado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid token
        '429':
          description: Limite de requisições excedido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Rate limit exceeded
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to send location
  /message/presence:
    post:
      tags:
        - Enviar Mensagem
      summary: Enviar atualização de presença
      description: |
        Envia uma atualização de presença para um contato ou grupo de forma **assíncrona**.

        ## 🔄 Comportamento Assíncrono:
        - **Execução independente**: A presença é gerenciada em background, não bloqueia o retorno da API
        - **Limite máximo**: 5 minutos de duração (300 segundos)
        - **Tick de atualização**: Reenvia a presença a cada 10 segundos
        - **Cancelamento automático**: Presença é cancelada automaticamente ao enviar uma mensagem para o mesmo chat

        ## 📱 Tipos de presença suportados:
        - **composing**: Indica que você está digitando uma mensagem
        - **recording**: Indica que você está gravando um áudio
        - **paused**: Remove/cancela a indicação de presença atual

        ## ⏱️ Controle de duração:
        - **Sem delay**: Usa limite padrão de 5 minutos
        - **Com delay**: Usa o valor especificado (máximo 5 minutos)
        - **Cancelamento**: Envio de mensagem cancela presença automaticamente

        ## 📋 Exemplos de uso:

        ### Digitar por 30 segundos:
        ```json
        {
          "number": "5511999999999",
          "presence": "composing",
          "delay": 30000
        }
        ```

        ### Gravar áudio por 1 minuto:
        ```json
        {
          "number": "5511999999999",
          "presence": "recording",
          "delay": 60000
        }
        ```

        ### Cancelar presença atual:
        ```json
        {
          "number": "5511999999999",
          "presence": "paused"
        }
        ```

        ### Usar limite máximo (5 minutos):
        ```json
        {
          "number": "5511999999999",
          "presence": "composing"
        }
        ```
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: 'Número do destinatário no formato internacional (ex: 5511999999999)'
                  example: '5511999999999'
                presence:
                  type: string
                  description: Tipo de presença a ser enviada
                  enum:
                    - composing
                    - recording
                    - paused
                  example: composing
                delay:
                  type: integer
                  description: |
                    Duração em milissegundos que a presença ficará ativa (máximo 5 minutos = 300000ms).
                    Se não informado ou valor maior que 5 minutos, usa o limite padrão de 5 minutos.
                    A presença é reenviada a cada 10 segundos durante este período.
                  maximum: 300000
                  example: 30000
              required:
                - number
                - presence
      responses:
        '200':
          description: Presença atualizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    description: Mensagem de confirmação
                    example: Chat presence sent successfully
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
                    example: Número inválido ou tipo de presença inválido
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
                    example: Token inválido ou expirado
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
                    example: Erro ao enviar presença
  /send/status:
    post:
      tags:
        - Enviar Mensagem
      summary: Enviar Stories (Status)
      description: >
        Envia um story (status) com suporte para texto, imagem, vídeo e áudio.


        **Suporte a campos de rastreamento**: Este endpoint também suporta `track_source` e `track_id` documentados na
        tag **"Enviar Mensagem"**.


        ## Tipos de Status

        - text: Texto com estilo e cor de fundo

        - image: Imagens com legenda opcional

        - video: Vídeos com thumbnail e legenda

        - audio: Áudio normal ou mensagem de voz (PTT)


        ## Cores de Fundo

        - 1-3: Tons de amarelo

        - 4-6: Tons de verde

        - 7-9: Tons de azul

        - 10-12: Tons de lilás

        - 13: Magenta

        - 14-15: Tons de rosa

        - 16: Marrom claro

        - 17-19: Tons de cinza (19 é o padrão)


        ## Fontes (para texto)

        - 0: Padrão 

        - 1-8: Estilos alternativos


        ## Limites

        - Texto: Máximo 656 caracteres

        - Imagem: JPG, PNG, GIF

        - Vídeo: MP4, MOV

        - Áudio: MP3, OGG, WAV (convertido para OGG/OPUS)


        ## Exemplo

        ```json

        {
          "type": "text",
          "text": "Novidades chegando!",
          "background_color": 7,
          "font": 1
        }

        ```
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                type:
                  type: string
                  enum:
                    - text
                    - image
                    - video
                    - audio
                    - myaudio
                    - ptt
                  description: Tipo do status
                  example: text
                text:
                  type: string
                  description: Texto principal ou legenda
                  example: Novidades chegando!
                background_color:
                  type: integer
                  minimum: 1
                  maximum: 19
                  description: Código da cor de fundo
                  example: 7
                font:
                  type: integer
                  minimum: 0
                  maximum: 8
                  description: Estilo da fonte (apenas para type=text)
                  example: 1
                file:
                  type: string
                  description: URL ou Base64 do arquivo de mídia
                  example: https://example.com/video.mp4
                thumbnail:
                  type: string
                  description: URL ou Base64 da miniatura (opcional para vídeos)
                  example: https://example.com/thumb.jpg
                mimetype:
                  type: string
                  description: MIME type do arquivo (opcional)
                  example: video/mp4
                track_source:
                  type: string
                  description: Origem do rastreamento da mensagem
                  example: chatwoot
                track_id:
                  type: string
                  description: ID para rastreamento da mensagem (aceita valores duplicados)
                  example: msg_123456789
              required:
                - type
      responses:
        '200':
          description: Status enviado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  Id:
                    type: string
                    example: ABCD1234
                  content:
                    type: object
                    description: Conteúdo processado da mensagem
                  messageTimestamp:
                    type: integer
                    example: 1672531200000
                  status:
                    type: string
                    example: Pending
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Text too long
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
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to upload media
  /send/menu:
    post:
      tags:
        - Enviar Mensagem
      summary: Enviar menu interativo (botões, carrosel, lista ou enquete)
      description: >
        Este endpoint oferece uma interface unificada para envio de quatro tipos principais de mensagens interativas:

        - Botões: Para ações rápidas e diretas

        - Carrosel de Botões: Para uma lista horizontal de botões com imagens

        - Listas: Para menus organizados em seções

        - Enquetes: Para coleta de opiniões e votações


        **Suporte a campos de rastreamento**: Este endpoint também suporta `track_source` e `track_id` documentados na
        tag **"Enviar Mensagem"**.


        ## Estrutura Base do Payload


        Todas as requisições seguem esta estrutura base:


        ```json

        {
          "number": "5511999999999",
          "type": "button|list|poll|carousel",
          "text": "Texto principal da mensagem",
          "choices": ["opções baseadas no tipo escolhido"],
          "footerText": "Texto do rodapé (opcional para botões e listas)",
          "listButton": "Texto do botão (para listas)",
          "selectableCount": "Número de opções selecionáveis (apenas para enquetes)"
        }

        ```


        ## Tipos de Mensagens Interativas


        ### 1. Botões (type: "button")


        Cria botões interativos com diferentes funcionalidades de ação.


        #### Campos Específicos

        - `footerText`: Texto opcional exibido abaixo da mensagem principal

        - `choices`: Array de opções que serão convertidas em botões


        #### Formatos de Botões

        Cada botão pode ser configurado usando `|` (pipe) ou `\n` (quebra de linha) como separadores:


        - **Botão de Resposta**: 
          - `"texto|id"` ou 
          - `"texto\nid"` ou 
          - `"texto"` (ID será igual ao texto)

        - **Botão de Cópia**: 
          - `"texto|copy:código"` ou 
          - `"texto\ncopy:código"`

        - **Botão de Chamada**: 
          - `"texto|call:+5511999999999"` ou 
          - `"texto\ncall:+5511999999999"`

        - **Botão de URL**: 
          - `"texto|https://exemplo.com"` ou 
          - `"texto|url:https://exemplo.com"`

        #### Botões com Imagem

        Para adicionar uma imagem aos botões, use o campo `imageButton` no payload:


        #### Exemplo com Imagem

        ```json

        {
          "number": "5511999999999",
          "type": "button",
          "text": "Escolha um produto:",
          "imageButton": "https://exemplo.com/produto1.jpg",
          "choices": [
            "Produto A|prod_a",
            "Mais Info|https://exemplo.com/produto-a",
            "Produto B|prod_b",
            "Ligar|call:+5511999999999"
          ],
          "footerText": "Produtos em destaque"
        }

        ```


        > **Suporte**: O campo `imageButton` aceita URLs ou imagens em base64.


        #### Exemplo Completo

        ```json

        {
          "number": "5511999999999",
          "type": "button",
          "text": "Como podemos ajudar?",
          "choices": [
            "Suporte Técnico|suporte",
            "Fazer Pedido|pedido",
            "Nosso Site|https://exemplo.com",
            "Falar Conosco|call:+5511999999999"
          ],
          "footerText": "Escolha uma das opções abaixo"
        }

        ```


        #### Limitações e Compatibilidade

        > **Importante**: Ao combinar botões de resposta com outros tipos (call, url, copy) na mesma mensagem, será
        exibido o aviso: "Não é possível exibir esta mensagem no WhatsApp Web. Abra o WhatsApp no seu celular para
        visualizá-la."


        ### 2. Listas (type: "list")


        Cria menus organizados em seções com itens selecionáveis.


        #### Campos Específicos

        - `listButton`: Texto do botão que abre a lista

        - `footerText`: Texto opcional do rodapé

        - `choices`: Array com seções e itens da lista


        #### Formato das Choices

        - `"[Título da Seção]"`: Inicia uma nova seção

        - `"texto|id|descrição"`: Item da lista com:
          - texto: Label do item
          - id: Identificador único, opcional
          - descrição: Texto descritivo adicional e opcional

        #### Exemplo Completo

        ```json

        {
          "number": "5511999999999",
          "type": "list",
          "text": "Catálogo de Produtos",
          "choices": [
            "[Eletrônicos]",
            "Smartphones|phones|Últimos lançamentos",
            "Notebooks|notes|Modelos 2024",
            "[Acessórios]",
            "Fones|fones|Bluetooth e com fio",
            "Capas|cases|Proteção para seu device"
          ],
          "listButton": "Ver Catálogo",
          "footerText": "Preços sujeitos a alteração"
        }

        ```


        ### 3. Enquetes (type: "poll")


        Cria enquetes interativas para votação.


        #### Campos Específicos

        - `selectableCount`: Número de opções que podem ser selecionadas (padrão: 1)

        - `choices`: Array simples com as opções de voto


        #### Exemplo Completo

        ```json

        {
          "number": "5511999999999",
          "type": "poll",
          "text": "Qual horário prefere para atendimento?",
          "choices": [
            "Manhã (8h-12h)",
            "Tarde (13h-17h)",
            "Noite (18h-22h)"
          ],
          "selectableCount": 1
        }

        ```


        ### 4. Carousel (type: "carousel")


        Cria um carrossel de cartões com imagens e botões interativos.


        #### Campos Específicos

        - `choices`: Array com elementos do carrossel na seguinte ordem:
          - `[Texto do cartão]`: Texto do cartão entre colchetes
          - `{URL ou base64 da imagem}`: Imagem entre chaves
          - Botões do cartão (um por linha):
            - `"texto|copy:código"` para botão de copiar
            - `"texto|https://url"` para botão de link
            - `"texto|call:+número"` para botão de ligação

        #### Exemplo Completo

        ```json

        {
          "number": "5511999999999",
          "type": "carousel",
          "text": "Conheça nossos produtos",
          "choices": [
            "[Smartphone XYZ\nO mais avançado smartphone da linha]",
            "{https://exemplo.com/produto1.jpg}",
            "Copiar Código|copy:PROD123",
            "Ver no Site|https://exemplo.com/xyz",
            "Fale Conosco|call:+5511999999999",
            "[Notebook ABC\nO notebook ideal para profissionais]",
            "{https://exemplo.com/produto2.jpg}",
            "Copiar Código|copy:NOTE456",
            "Comprar Online|https://exemplo.com/abc",
            "Suporte|call:+5511988888888"
          ]
        }

        ```


        > **Nota**: Criamos outro endpoint para carrossel: `/send/carousel`, funciona da mesma forma, mas com outro
        formato de payload. Veja o que é mais fácil para você.


        ## Termos de uso


        Os recursos de botões interativos e listas podem ser descontinuados a qualquer momento sem aviso prévio. Não nos
        responsabilizamos por quaisquer alterações ou indisponibilidade destes recursos.


        ### Alternativas e Compatibilidade


        Considerando a natureza dinâmica destes recursos, nosso endpoint foi projetado para facilitar a migração entre
        diferentes tipos de mensagens (botões, listas e enquetes). 


        Recomendamos criar seus fluxos de forma flexível, preparados para alternar entre os diferentes tipos.


        Em caso de descontinuidade de algum recurso, você poderá facilmente migrar para outro tipo de mensagem apenas
        alterando o campo "type" no payload, mantendo a mesma estrutura de choices.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do destinatário (formato internacional)
                  example: '5511999999999'
                type:
                  type: string
                  description: Tipo do menu (button, list, poll, carousel)
                  enum:
                    - button
                    - list
                    - poll
                    - carousel
                  example: list
                text:
                  type: string
                  description: Texto principal (aceita placeholders)
                  example: 'Escolha uma opção:'
                footerText:
                  type: string
                  description: Texto do rodapé (opcional)
                  example: Menu de serviços
                listButton:
                  type: string
                  description: Texto do botão principal
                  example: Ver opções
                selectableCount:
                  type: integer
                  description: Número máximo de opções selecionáveis (para enquetes)
                  example: 1
                choices:
                  type: array
                  description: Lista de opções. Use [Título] para seções em listas
                  items:
                    type: string
                  example:
                    - '[Eletrônicos]'
                    - Smartphones|phones|Últimos lançamentos
                    - Notebooks|notes|Modelos 2024
                    - '[Acessórios]'
                    - Fones|fones|Bluetooth e com fio
                    - Capas|cases|Proteção para seu device
                imageButton:
                  type: string
                  description: 'URL da imagem para botões (recomendado para type: button)'
                  example: https://exemplo.com/imagem-botao.jpg
                replyid:
                  type: string
                  description: ID da mensagem para responder
                  example: 3EB0538DA65A59F6D8A251
                mentions:
                  type: string
                  description: Números para mencionar (separados por vírgula)
                  example: 5511999999999,5511888888888
                readchat:
                  type: boolean
                  description: Marca conversa como lida após envio
                  example: true
                readmessages:
                  type: boolean
                  description: Marca últimas mensagens recebidas como lidas
                  example: true
                delay:
                  type: integer
                  description: Atraso em milissegundos antes do envio, durante o atraso apacerá 'Digitando...'
                  example: 1000
                track_source:
                  type: string
                  description: Origem do rastreamento da mensagem
                  example: chatwoot
                track_id:
                  type: string
                  description: ID para rastreamento da mensagem (aceita valores duplicados)
                  example: msg_123456789
              required:
                - number
                - type
                - text
                - choices
      responses:
        '200':
          description: Menu enviado com sucesso
          content:
            application/json:
              schema:
                allOf:
                  - $ref: ../schemas/message.yaml#/Message
                  - type: object
                    properties:
                      response:
                        type: object
                        properties:
                          status:
                            type: string
                            example: success
                          message:
                            type: string
                            example: Menu sent successfully
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Missing required fields or invalid menu type
        '401':
          description: Não autorizado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid token
        '429':
          description: Limite de requisições excedido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Rate limit exceeded
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to send menu
  /send/carousel:
    post:
      tags:
        - Enviar Mensagem
      summary: Enviar carrossel de mídia com botões
      description: >
        Este endpoint permite enviar um carrossel com imagens e botões interativos.

        Funciona de maneira igual ao endpoint `/send/menu` com type: carousel, porém usando outro formato de payload.


        ## Campos Comuns


        Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:

        `delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders
        e envio para grupos.


        ## Estrutura do Payload


        ```json

        {
          "number": "5511999999999",
          "text": "Texto principal",
          "carousel": [
            {
              "text": "Texto do cartão",
              "image": "URL da imagem",
              "buttons": [
                {
                  "id": "resposta1",
                  "text": "Texto do botão",
                  "type": "REPLY"
                }
              ]
            }
          ],
          "delay": 1000,
          "readchat": true
        }

        ```


        ## Tipos de Botões


        - `REPLY`: Botão de resposta rápida
          - Quando clicado, envia o valor do id como resposta ao chat
          - O id será o texto enviado como resposta

        - `URL`: Botão com link
          - Quando clicado, abre a URL especificada
          - O id deve conter a URL completa (ex: https://exemplo.com)

        - `COPY`: Botão para copiar texto
          - Quando clicado, copia o texto para a área de transferência
          - O id será o texto que será copiado

        - `CALL`: Botão para realizar chamada
          - Quando clicado, inicia uma chamada telefônica
          - O id deve conter o número de telefone

        ## Exemplo de Botões

        ```json

        {
          "buttons": [
            {
              "id": "Sim, quero comprar!",
              "text": "Confirmar Compra",
              "type": "REPLY"
            },
            {
              "id": "https://exemplo.com/produto",
              "text": "Ver Produto",
              "type": "URL"
            },
            {
              "id": "CUPOM20",
              "text": "Copiar Cupom",
              "type": "COPY"
            },
            {
              "id": "5511999999999",
              "text": "Falar com Vendedor",
              "type": "CALL"
            }
          ]
        }

        ```


        ## Exemplo Completo de Carrossel

        ```json

        {
          "number": "5511999999999",
          "text": "Nossos Produtos em Destaque",
          "carousel": [
            {
              "text": "Smartphone XYZ\nO mais avançado smartphone da linha",
              "image": "https://exemplo.com/produto1.jpg",
              "buttons": [
                {
                  "id": "SIM_COMPRAR_XYZ",
                  "text": "Comprar Agora",
                  "type": "REPLY"
                },
                {
                  "id": "https://exemplo.com/xyz",
                  "text": "Ver Detalhes",
                  "type": "URL"
                }
              ]
            },
            {
              "text": "Cupom de Desconto\nGanhe 20% OFF em qualquer produto",
              "image": "https://exemplo.com/cupom.jpg",
              "buttons": [
                {
                  "id": "DESCONTO20",
                  "text": "Copiar Cupom",
                  "type": "COPY"
                },
                {
                  "id": "5511999999999",
                  "text": "Falar com Vendedor",
                  "type": "CALL"
                }
              ]
            }
          ],
          "delay": 0,
          "readchat": true
        }

        ```
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do destinatário (formato internacional)
                  example: '5511999999999'
                text:
                  type: string
                  description: Texto principal da mensagem
                  example: Nossos Produtos em Destaque
                carousel:
                  type: array
                  description: Array de cartões do carrossel
                  items:
                    type: object
                    properties:
                      text:
                        type: string
                        description: Texto do cartão
                        example: |-
                          Smartphone XYZ
                          O mais avançado smartphone da linha
                      image:
                        type: string
                        description: URL da imagem (opcional)
                        example: https://exemplo.com/produto1.jpg
                      buttons:
                        type: array
                        description: Array de botões do cartão
                        items:
                          type: object
                          properties:
                            id:
                              type: string
                              description: ID do botão
                              example: buy_xyz
                            text:
                              type: string
                              description: Texto exibido no botão
                              example: Comprar Agora
                            type:
                              type: string
                              description: |
                                Tipo do botão:
                                * REPLY - O id será enviado como resposta ao chat
                                * URL - O id deve ser a URL completa que será aberta
                                * COPY - O id será o texto copiado para área de transferência
                                * CALL - O id deve ser o número de telefone para a chamada
                              enum:
                                - REPLY
                                - URL
                                - CALL
                                - COPY
                              example: REPLY
                    required:
                      - text
                      - buttons
                track_source:
                  type: string
                  description: Origem do rastreamento da mensagem
                  example: chatwoot
                track_id:
                  type: string
                  description: ID para rastreamento da mensagem (aceita valores duplicados)
                  example: msg_123456789
              required:
                - number
                - text
                - carousel
      responses:
        '200':
          description: Carrossel enviado com sucesso
          content:
            application/json:
              schema:
                allOf:
                  - $ref: ../schemas/message.yaml#/Message
                  - type: object
                    properties:
                      response:
                        type: object
                        properties:
                          status:
                            type: string
                            example: success
                          message:
                            type: string
                            example: Carousel sent successfully
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Missing required fields or invalid card format
        '401':
          description: Não autorizado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid token
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to send carousel
  /send/location-button:
    post:
      tags:
        - Enviar Mensagem
      summary: Solicitar localização do usuário
      description: >
        Este endpoint envia uma mensagem com um botão que solicita a localização do usuário.

        Quando o usuário clica no botão, o WhatsApp abre a interface para compartilhar a localização atual.


        ## Campos Comuns


        Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:

        `delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders
        e envio para grupos.


        ## Estrutura do Payload


        ```json

        {
          "number": "5511999999999",
          "text": "Por favor, compartilhe sua localização",
          "delay": 0,
          "readchat": true
        }

        ```


        ## Exemplo de Uso


        ```json

        {
          "number": "5511999999999",
          "text": "Para continuar o atendimento, clique no botão abaixo e compartilhe sua localização"
        }

        ```


        > **Nota**: O botão de localização é adicionado automaticamente à mensagem
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do destinatário (formato internacional)
                  example: '5511999999999'
                text:
                  type: string
                  description: Texto da mensagem que será exibida
                  example: Por favor, compartilhe sua localização
                delay:
                  type: integer
                  description: Atraso em milissegundos antes do envio
                  example: 0
                readchat:
                  type: boolean
                  description: Se deve marcar a conversa como lida após envio
                  example: true
                track_source:
                  type: string
                  description: Origem do rastreamento da mensagem
                  example: chatwoot
                track_id:
                  type: string
                  description: ID para rastreamento da mensagem (aceita valores duplicados)
                  example: msg_123456789
              required:
                - number
                - text
      responses:
        '200':
          description: Localização enviada com sucesso
          content:
            application/json:
              schema:
                allOf:
                  - $ref: ../schemas/message.yaml#/Message
                  - type: object
                    properties:
                      response:
                        type: object
                        properties:
                          status:
                            type: string
                            example: success
                          message:
                            type: string
                            example: Location sent successfully
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Missing required fields or invalid coordinates
        '401':
          description: Não autorizado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid token
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to send location
  /message/download:
    post:
      tags:
        - Ações na mensagem e Buscar
      summary: Baixar arquivo de uma mensagem
      description: >
        Baixa o arquivo associado a uma mensagem de mídia (imagem, vídeo, áudio, documento ou sticker).


        ## Parâmetros


        - **id** (string, obrigatório): ID da mensagem

        - **return_base64** (boolean, default: false): Retorna arquivo em base64

        - **generate_mp3** (boolean, default: true): Para áudios, define formato de retorno
          - `true`: Retorna MP3
          - `false`: Retorna OGG
        - **return_link** (boolean, default: true): Retorna URL pública do arquivo

        - **transcribe** (boolean, default: false): Transcreve áudios para texto

        - **openai_apikey** (string, opcional): Chave OpenAI para transcrição
          - Se não informada, usa a chave salva na instância
          - Se informada, atualiza e salva na instância para próximas chamadas
        - **download_quoted** (boolean, default: false): Baixa mídia da mensagem citada
          - Útil para baixar conteúdo original de status do WhatsApp
          - Quando uma mensagem é resposta a um status, permite baixar a mídia do status original
          - **Contextualização**: Ao baixar a mídia citada, você identifica o contexto da conversa
            - Exemplo: Se alguém responde a uma promoção, baixando a mídia você saberá que a pergunta é sobre aquela promoção específica

        ## Exemplos


        ### Baixar áudio como MP3:

        ```json

        {
          "id": "7EB0F01D7244B421048F0706368376E0",
          "generate_mp3": true
        }

        ```


        ### Transcrever áudio:

        ```json

        {
          "id": "7EB0F01D7244B421048F0706368376E0",
          "transcribe": true
        }

        ```


        ### Apenas base64 (sem salvar):

        ```json

        {
          "id": "7EB0F01D7244B421048F0706368376E0",
          "return_base64": true,
          "return_link": false
        }

        ```


        ### Baixar mídia de status (mensagem citada):

        ```json

        {
          "id": "7EB0F01D7244B421048F0706368376E0",
          "download_quoted": true
        }

        ```

        *Útil quando o cliente responde a uma promoção/status - você baixa a mídia original para entender sobre qual
        produto/oferta ele está perguntando.*


        ## Resposta


        ```json

        {
          "fileURL": "https://api.exemplo.com/files/arquivo.mp3",
          "mimetype": "audio/mpeg",
          "base64Data": "UklGRkj...",
          "transcription": "Texto transcrito"
        }

        ```


        **Nota**: 

        - Por padrão, se não definido o contrário:
          1. áudios são retornados como MP3. 
          2. E todos os pedidos de download são retornados com URL pública.
        - Transcrição requer chave OpenAI válida. A chave pode ser configurada uma vez na instância e será reutilizada
        automaticamente.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                  description: ID da mensagem contendo o arquivo
                  example: 7EB0F01D7244B421048F0706368376E0
                return_base64:
                  type: boolean
                  description: Se verdadeiro, retorna o conteúdo em base64
                  default: false
                generate_mp3:
                  type: boolean
                  description: Para áudios, define formato de retorno (true=MP3, false=OGG)
                  default: true
                return_link:
                  type: boolean
                  description: Salva e retorna URL pública do arquivo
                  default: true
                transcribe:
                  type: boolean
                  description: Se verdadeiro, transcreve áudios para texto
                  default: false
                openai_apikey:
                  type: string
                  description: Chave da API OpenAI para transcrição (opcional)
                  example: sk-...
                download_quoted:
                  type: boolean
                  description: Se verdadeiro, baixa mídia da mensagem citada ao invés da mensagem principal
                  default: false
              required:
                - id
      responses:
        '200':
          description: Successful file download
          content:
            application/json:
              schema:
                type: object
                properties:
                  fileURL:
                    type: string
                    description: URL pública para acessar o arquivo (se return_link=true)
                    example: https://api.exemplo.com/files/arquivo.mp3
                  mimetype:
                    type: string
                    description: Tipo MIME do arquivo
                    example: audio/mpeg
                  base64Data:
                    type: string
                    description: Conteúdo do arquivo em base64 (se return_base64=true)
                    example: UklGRkj...
                  transcription:
                    type: string
                    description: Texto transcrito do áudio (se transcribe=true)
                    example: Texto transcrito
                required:
                  - mimetype
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Unsupported media type or no media found in message
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid token
        '404':
          description: Not Found
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Message not found
                examples:
                  message_not_found:
                    summary: Mensagem não encontrada
                    value:
                      error: Message not found
                  no_quoted_message:
                    summary: Mensagem citada não encontrada (quando download_quoted=true)
                    value:
                      error: No quoted message found in this message
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to download media
  /message/find:
    post:
      tags:
        - Ações na mensagem e Buscar
      summary: Buscar mensagens em um chat
      description: |
        Busca mensagens com múltiplos filtros disponíveis. Este endpoint permite:

        1. **Busca por ID específico**: Use `id` para encontrar uma mensagem exata
        2. **Filtrar por chat**: Use `chatid` para mensagens de uma conversa específica
        3. **Filtrar por rastreamento**: Use `track_source` e `track_id` para mensagens com dados de tracking
        4. **Limitar resultados**: Use `limit` para controlar quantas mensagens retornar
        5. **Ordenação**: Resultados ordenados por data (mais recentes primeiro)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                  description: ID específico da mensagem para busca exata
                  example: user123:r3EB0538
                chatid:
                  type: string
                  description: ID do chat no formato internacional
                  example: 5511999999999@s.whatsapp.net
                track_source:
                  type: string
                  description: Origem do rastreamento para filtrar mensagens
                  example: chatwoot
                track_id:
                  type: string
                  description: ID de rastreamento para filtrar mensagens
                  example: msg_123456789
                limit:
                  type: integer
                  description: Número máximo de mensagens a retornar
                  minimum: 1
                  default: 100
                  example: 10
            examples:
              chatSearch:
                summary: Buscar por chat específico
                description: Busca mensagens de uma conversa específica
                value:
                  chatid: 5511999999999@s.whatsapp.net
                  limit: 10
              idSearch:
                summary: Buscar por ID específico
                description: Busca uma mensagem específica pelo seu ID
                value:
                  id: user123:r3EB0538
              trackingSearch:
                summary: Buscar por rastreamento
                description: Busca mensagens usando dados de tracking
                value:
                  track_source: chatwoot
                  track_id: conv_123456
                  limit: 50
      responses:
        '200':
          description: Lista de mensagens encontradas
          content:
            application/json:
              schema:
                type: object
                properties:
                  messages:
                    type: array
                    items:
                      $ref: ../schemas/message.yaml#/Message
        '400':
          description: Parâmetros inválidos
        '401':
          description: Token inválido ou expirado
        '404':
          description: Chat não encontrado
        '500':
          description: Erro interno do servidor
  /message/markread:
    post:
      tags:
        - Ações na mensagem e Buscar
      summary: Marcar mensagens como lidas
      description: |
        Marca uma ou mais mensagens como lidas. Este endpoint permite:
        1. Marcar múltiplas mensagens como lidas de uma vez
        2. Atualizar o status de leitura no WhatsApp
        3. Sincronizar o status de leitura entre dispositivos

        Exemplo de requisição básica:
        ```json
        {
          "id": [
            "62AD1AD844E518180227BF68DA7ED710",
            "ECB9DE48EB41F77BFA8491BFA8D6EF9B"  
          ]
        }
        ```

        Exemplo de resposta:
        ```json
        {
          "success": true,
          "message": "Messages marked as read",
          "markedMessages": [
            {
              "id": "62AD1AD844E518180227BF68DA7ED710",
              "timestamp": 1672531200000
            },
            {
              "id": "ECB9DE48EB41F77BFA8491BFA8D6EF9B",
              "timestamp": 1672531300000
            }
          ]
        }
        ```

        Parâmetros disponíveis:
        - id: Lista de IDs das mensagens a serem marcadas como lidas

        Erros comuns:
        - 401: Token inválido ou expirado
        - 400: Lista de IDs vazia ou inválida
        - 404: Uma ou mais mensagens não encontradas
        - 500: Erro ao marcar mensagens como lidas
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: array
                  description: Lista de IDs das mensagens a serem marcadas como lidas
                  items:
                    type: string
                  example:
                    - 62AD1AD844E518180227BF68DA7ED710
                    - ECB9DE48EB41F77BFA8491BFA8D6EF9B
              required:
                - id
      responses:
        '200':
          description: Messages successfully marked as read
          content:
            application/json:
              schema:
                type: object
                properties:
                  results:
                    type: array
                    items:
                      type: object
                      properties:
                        message_id:
                          type: string
                          description: ID of the message that was processed
                        status:
                          type: string
                          enum:
                            - success
                            - error
                          description: Status of the mark as read operation
                        error:
                          type: string
                          description: Error message if status is error
                    example:
                      - message_id: 62AD1AD844E518180227BF68DA7ED710
                        status: success
                      - message_id: ECB9DE48EB41F77BFA8491BFA8D6EF9B
                        status: error
                        error: Message not found
        '400':
          description: Invalid request payload or missing required fields
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Missing Id in Payload
        '401':
          description: Unauthorized - invalid or missing token
        '500':
          description: Server error while processing the request
  /message/react:
    post:
      tags:
        - Ações na mensagem e Buscar
      summary: Enviar reação a uma mensagem
      description: |
        Envia uma reação (emoji) a uma mensagem específica. Este endpoint permite:

        1. Adicionar ou remover reações em mensagens

        2. Usar qualquer emoji Unicode válido

        3. Reagir a mensagens em chats individuais ou grupos

        4. Remover reações existentes

        5. Verificar o status da reação enviada


        Tipos de reações suportados:

        - Qualquer emoji Unicode válido (👍, ❤️, 😂, etc)

        - String vazia para remover reação


        Exemplo de requisição básica:

        ```json

        {
          "number": "5511999999999@s.whatsapp.net",
          "text": "👍",
          "id": "3EB0538DA65A59F6D8A251"
        }

        ```


        Exemplo de requisição para remover reação:

        ```json

        {
          "number": "5511999999999@s.whatsapp.net",
          "text": "",
          "id": "3EB0538DA65A59F6D8A251"
        }

        ```


        Exemplo de resposta:

        ```json

        {
          "success": true,
          "message": "Reaction sent",
          "reaction": {
            "id": "3EB0538DA65A59F6D8A251",
            "emoji": "👍",
            "timestamp": 1672531200000,
            "status": "sent"
          }
        }

        ```


        Exemplo de resposta ao remover reação:

        ```json

        {
          "success": true,
          "message": "Reaction removed",
          "reaction": {
            "id": "3EB0538DA65A59F6D8A251",
            "emoji": null,
            "timestamp": 1672531200000,
            "status": "removed"
          }
        }

        ```


        Parâmetros disponíveis:

        - number: Número do chat no formato internacional (ex:
        5511999999999@s.whatsapp.net)

        - text: Emoji Unicode da reação (ou string vazia para remover reação)

        - id: ID da mensagem que receberá a reação


        Erros comuns:

        - 401: Token inválido ou expirado

        - 400: Número inválido ou emoji não suportado

        - 404: Mensagem não encontrada

        - 500: Erro ao enviar reação


        Limitações:

        - Só é possível reagir a mensagens enviadas por outros usuários

        - Não é possível reagir a mensagens antigas (mais de 7 dias)

        - O mesmo usuário só pode ter uma reação ativa por mensagem
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                number:
                  type: string
                  description: Número do chat no formato internacional
                  example: 5511999999999@s.whatsapp.net
                text:
                  type: string
                  description: Emoji Unicode da reação (ou string vazia para remover reação)
                  example: 👍
                id:
                  type: string
                  description: ID da mensagem que receberá a reação
                  example: 3EB0538DA65A59F6D8A251
              required:
                - number
                - text
                - id
      responses:
        '200':
          description: Reação enviada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                    description: ID único da mensagem de reação
                    example: owner:generated_message_id
                  messageid:
                    type: string
                    description: ID gerado para a mensagem de reação
                    example: generated_message_id
                  content:
                    type: object
                    description: Detalhes da reação
                  messageTimestamp:
                    type: number
                    description: Timestamp da mensagem em milissegundos
                    example: 1672531200000
                  messageType:
                    type: string
                    description: Tipo da mensagem
                    example: reaction
                  status:
                    type: string
                    description: Status atual da mensagem
                    example: Pending
                  owner:
                    type: string
                    description: Proprietário da instância
                    example: instance_owner
        '400':
          description: Erro nos dados da requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Missing Id in Payload
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
          description: Mensagem não encontrada
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Message not found
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Error sending message
  /message/delete:
    post:
      tags:
        - Ações na mensagem e Buscar
      summary: Apagar Mensagem Para Todos
      description: |
        Apaga uma mensagem para todos os participantes da conversa.

        ### Funcionalidades:
        - Apaga mensagens em conversas individuais ou grupos
        - Funciona com mensagens enviadas pelo usuário ou recebidas
        - Atualiza o status no banco de dados
        - Envia webhook de atualização

        **Notas Técnicas**:
        1. O ID da mensagem pode ser fornecido em dois formatos:
           - ID completo (contém ":"): usado diretamente
           - ID curto: concatenado com o owner para busca
        2. Gera evento webhook do tipo "messages_update"
        3. Atualiza o status da mensagem para "Deleted"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                  description: ID da mensagem a ser apagada
              required:
                - id
      responses:
        '200':
          description: Mensagem apagada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  timestamp:
                    type: string
                    format: date-time
                  id:
                    type: string
        '400':
          description: Payload inválido ou ID de chat/sender inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: invalid payload
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
        '404':
          description: Mensagem não encontrada
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: message not found
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
  /message/edit:
    post:
      tags:
        - Ações na mensagem e Buscar
      summary: Edita uma mensagem enviada
      description: |
        Edita o conteúdo de uma mensagem já enviada usando a funcionalidade nativa do WhatsApp.

        O endpoint realiza:
        - Busca a mensagem original no banco de dados usando o ID fornecido
        - Edita o conteúdo da mensagem para o novo texto no WhatsApp
        - Gera um novo ID para a mensagem editada
        - Retorna objeto de mensagem completo seguindo o padrão da API
        - Dispara eventos SSE/Webhook automaticamente

        **Importante**: 
        - Só é possível editar mensagens enviadas pela própria instância
        - A mensagem deve existir no banco de dados
        - O ID pode ser fornecido no formato completo (owner:messageid) ou apenas messageid
        - A mensagem deve estar dentro do prazo permitido pelo WhatsApp para edição
      security:
        - token: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - id
                - text
              properties:
                id:
                  type: string
                  description: ID único da mensagem que será editada (formato owner:messageid ou apenas messageid)
                  example: 3A12345678901234567890123456789012
                text:
                  type: string
                  description: Novo conteúdo de texto da mensagem
                  example: Texto editado da mensagem
      responses:
        '200':
          description: Mensagem editada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                    description: ID único da mensagem no formato owner:messageid
                    example: 5511999999999:3A12345678901234567890123456789012
                  messageid:
                    type: string
                    description: ID da mensagem no WhatsApp
                    example: 3A12345678901234567890123456789012
                  content:
                    type: string
                    description: Conteúdo da mensagem editada
                    example: Texto editado da mensagem
                  messageTimestamp:
                    type: integer
                    description: Timestamp da mensagem (Unix timestamp em milissegundos)
                    example: 1704067200000
                  messageType:
                    type: string
                    description: Tipo da mensagem
                    example: text
                  status:
                    type: string
                    description: Status da mensagem
                    example: Pending
                  owner:
                    type: string
                    description: Proprietário da instância
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
                    example: Invalid payload
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
          description: Mensagem não encontrada
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Message not found
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Error fetching message from database
  /group/create:
    post:
      tags:
        - Grupos e Comunidades
      summary: Criar um novo grupo
      description: |
        Cria um novo grupo no WhatsApp com participantes iniciais.

        ### Detalhes
        - Requer autenticação via token da instância
        - Os números devem ser fornecidos sem formatação (apenas dígitos)

        ### Limitações
        - Mínimo de 1 participante além do criador
          
        ### Comportamento
        - Retorna informações detalhadas do grupo criado
        - Inclui lista de participantes adicionados com sucesso/falha
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  description: Nome do grupo
                  minLength: 1
                  maxLength: 100
                  example: uazapiGO grupo
                participants:
                  type: array
                  description: Lista de números de telefone dos participantes iniciais
                  items:
                    type: string
                    description: Número de telefone sem formatação
                  minItems: 1
                  maxItems: 50
                  example:
                    - '5521987905995'
                    - '5511912345678'
              required:
                - name
                - participants
            examples:
              default:
                value:
                  name: Meu Novo Grupo
                  participants:
                    - '5521987905995'
              multiple_participants:
                value:
                  name: Equipe de Projeto
                  participants:
                    - '5521987905995'
                    - '5511912345678'
                    - '5519987654321'
      responses:
        '200':
          description: Grupo criado com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/group.yaml#/Group
        '400':
          description: Erro de payload inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Could not parse phone
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to create group
      security:
        - token: []
  /group/info:
    post:
      tags:
        - Grupos e Comunidades
      summary: Obter informações detalhadas de um grupo
      description: |
        Recupera informações completas de um grupo do WhatsApp, incluindo:
        - Detalhes do grupo
        - Participantes
        - Configurações
        - Link de convite (opcional)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                groupjid:
                  type: string
                  description: Identificador único do grupo (JID)
                  example: 120363153742561022@g.us
                getInviteLink:
                  type: boolean
                  description: Recuperar link de convite do grupo
                  default: false
                  example: true
                getRequestsParticipants:
                  type: boolean
                  description: Recuperar lista de solicitações pendentes de participação
                  default: false
                  example: false
                force:
                  type: boolean
                  description: Forçar atualização, ignorando cache
                  default: false
                  example: false
              required:
                - groupjid
      responses:
        '200':
          description: Informações do grupo obtidas com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/group.yaml#/Group
              example:
                JID: 120363153742561022@g.us
                Name: uazapiGO Community
                Participants:
                  - JID: 5521987654321@s.whatsapp.net
                    IsAdmin: true
                IsLocked: false
                IsAnnounce: false
        '400':
          description: Código de convite inválido ou mal formatado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid invite code
        '404':
          description: Grupo não encontrado ou link de convite expirado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Group invite link is invalid or has expired
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to retrieve group information
  /group/inviteInfo:
    post:
      tags:
        - Grupos e Comunidades
      summary: Obter informações de um grupo pelo código de convite
      description: |
        Retorna informações detalhadas de um grupo usando um código de convite ou URL completo do WhatsApp.

        Esta rota permite:
        - Recuperar informações básicas sobre um grupo antes de entrar
        - Validar um link de convite
        - Obter detalhes como nome do grupo, número de participantes e restrições de entrada
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                inviteCode:
                  type: string
                  description: |
                    Código de convite ou URL completo do grupo.
                    Pode ser um código curto ou a URL completa do WhatsApp.
                  examples:
                    - IYnl5Zg9bUcJD32rJrDzO7
                    - https://chat.whatsapp.com/IYnl5Zg9bUcJD32rJrDzO7
              required:
                - inviteCode
      responses:
        '200':
          description: Informações do grupo obtidas com sucesso
          content:
            application/json:
              schema:
                $ref: ../schemas/group.yaml#/Group
              example:
                JID: 120363153742561022@g.us
                Name: uazapiGO Community
                Participants:
                  - JID: 5521987654321@s.whatsapp.net
                    IsAdmin: true
                IsLocked: false
                IsAnnounce: false
        '400':
          description: Código de convite inválido ou mal formatado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid invite code
        '404':
          description: Grupo não encontrado ou link de convite expirado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Group invite link is invalid or has expired
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to retrieve group information
  /group/invitelink/:groupJID:
    get:
      tags:
        - Grupos e Comunidades
      summary: Gerar link de convite para um grupo
      description: |
        Retorna o link de convite para o grupo especificado. 
        Esta operação requer que o usuário seja um administrador do grupo.
      parameters:
        - name: groupJID
          in: path
          required: true
          schema:
            type: string
            description: JID (ID do grupo) no formato WhatsApp
            example: 120363153742561022@g.us
      responses:
        '200':
          description: Link de convite gerado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  inviteLink:
                    type: string
                    description: Link de convite completo para o grupo
                    example: https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv
        '400':
          description: Erro ao processar a solicitação
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Descrição do erro
        '403':
          description: Usuário não tem permissão para gerar link
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Mensagem indicando falta de permissão
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
  /group/join:
    post:
      tags:
        - Grupos e Comunidades
      summary: Entrar em um grupo usando código de convite
      description: |
        Permite entrar em um grupo do WhatsApp usando um código de convite ou URL completo. 

        Características:
        - Suporta código de convite ou URL completo
        - Valida o código antes de tentar entrar no grupo
        - Retorna informações básicas do grupo após entrada bem-sucedida
        - Trata possíveis erros como convite inválido ou expirado
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - inviteCode
              properties:
                inviteCode:
                  type: string
                  description: |
                    Código de convite ou URL completo do grupo. 
                    Formatos aceitos:
                    - Código completo: "IYnl5Zg9bUcJD32rJrDzO7"
                    - URL completa: "https://chat.whatsapp.com/IYnl5Zg9bUcJD32rJrDzO7"
                  example: https://chat.whatsapp.com/IYnl5Zg9bUcJD32rJrDzO7
                  minLength: 10
                  maxLength: 50
      responses:
        '200':
          description: Entrada no grupo realizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Group join successful
                  group:
                    $ref: ../schemas/group.yaml#/Group
        '400':
          description: Código de convite inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid invite code
        '403':
          description: Usuário já está no grupo ou não tem permissão para entrar
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Unable to join group
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Error processing group invite
  /group/leave:
    post:
      tags:
        - Grupos e Comunidades
      summary: Sair de um grupo
      description: |
        Remove o usuário atual de um grupo específico do WhatsApp.

        Requisitos:
        - O usuário deve estar conectado a uma instância válida
        - O usuário deve ser um membro do grupo

        Comportamentos:
        - Se o usuário for o último administrador, o grupo será dissolvido
        - Se o usuário for um membro comum, será removido do grupo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                groupjid:
                  type: string
                  description: |
                    Identificador único do grupo (JID)
                    - Formato: número@g.us
                    - Exemplo válido: 120363324255083289@g.us
                  example: 120363324255083289@g.us
                  pattern: ^\d+@g\.us$
              required:
                - groupjid
      responses:
        '200':
          description: Saída do grupo realizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Group leave successful
        '400':
          description: Erro de payload inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: invalid payload
        '500':
          description: Erro interno do servidor ou falha na conexão
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: error leaving group
  /group/list:
    get:
      tags:
        - Grupos e Comunidades
      summary: Listar todos os grupos
      description: |
        Retorna uma lista com todos os grupos disponíveis para a instância atual do WhatsApp.

        Recursos adicionais:
        - Suporta atualização forçada do cache de grupos
        - Recupera informações detalhadas de grupos conectados
      parameters:
        - name: force
          in: query
          schema:
            type: boolean
            default: false
          description: |
            Se definido como `true`, força a atualização do cache de grupos.
            Útil para garantir que as informações mais recentes sejam recuperadas.

            Comportamentos:
            - `false` (padrão): Usa informações em cache
            - `true`: Busca dados atualizados diretamente do WhatsApp
        - name: noparticipants
          in: query
          schema:
            type: boolean
            default: false
          description: |
            Se definido como `true`, retorna a lista de grupos sem incluir os participantes.
            Útil para otimizar a resposta quando não há necessidade dos dados dos participantes.

            Comportamentos:
            - `false` (padrão): Retorna grupos com lista completa de participantes
            - `true`: Retorna grupos sem incluir os participantes
      responses:
        '200':
          description: Lista de grupos recuperada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  groups:
                    type: array
                    items:
                      $ref: ../schemas/group.yaml#/Group
                    description: Lista detalhada de grupos
        '500':
          description: Erro interno do servidor ao recuperar grupos
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Mensagem detalhando o erro encontrado
  /group/resetInviteCode:
    post:
      tags:
        - Grupos e Comunidades
      summary: Resetar código de convite do grupo
      description: |
        Gera um novo código de convite para o grupo, invalidando o código de convite anterior. 
        Somente administradores do grupo podem realizar esta ação.

        Principais características:
        - Invalida o link de convite antigo
        - Cria um novo link único
        - Retorna as informações atualizadas do grupo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                groupjid:
                  type: string
                  description: Identificador único do grupo (JID)
                  example: 120363308883996631@g.us
              required:
                - groupjid
      responses:
        '200':
          description: Código de convite resetado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  InviteLink:
                    type: string
                    description: Novo link de convite gerado
                    example: https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv
                  group:
                    $ref: ../schemas/group.yaml#/Group
        '400':
          description: Erro de validação
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Could not parse Group JID
        '403':
          description: Usuário sem permissão
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: User is not an admin of this group
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to reset group invite link
  /group/updateAnnounce:
    post:
      tags:
        - Grupos e Comunidades
      summary: Configurar permissões de envio de mensagens no grupo
      description: |
        Define as permissões de envio de mensagens no grupo, permitindo restringir o envio apenas para administradores.

        Quando ativado (announce=true):
        - Apenas administradores podem enviar mensagens
        - Outros participantes podem apenas ler
        - Útil para anúncios importantes ou controle de spam

        Quando desativado (announce=false):
        - Todos os participantes podem enviar mensagens
        - Configuração padrão para grupos normais

        Requer que o usuário seja administrador do grupo para fazer alterações.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                groupjid:
                  type: string
                  description: Identificador único do grupo no formato xxxx@g.us
                  example: 120363339858396166@g.us
                announce:
                  type: boolean
                  description: Controla quem pode enviar mensagens no grupo
                  example: true
              required:
                - groupjid
                - announce
      responses:
        '200':
          description: Configuração atualizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Group announce enabled successfully
                  group:
                    $ref: ../schemas/group.yaml#/Group
        '401':
          description: Token de autenticação ausente ou inválido
        '403':
          description: Usuário não é administrador do grupo
        '404':
          description: Grupo não encontrado
        '500':
          description: Erro interno do servidor ou falha na API do WhatsApp
  /group/updateDescription:
    post:
      tags:
        - Grupos e Comunidades
      summary: Atualizar descrição do grupo
      description: |
        Altera a descrição (tópico) do grupo WhatsApp especificado.
        Requer que o usuário seja administrador do grupo.
        A descrição aparece na tela de informações do grupo e pode ser visualizada por todos os participantes.
      operationId: updateGroupDescription
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - groupjid
                - description
              properties:
                groupjid:
                  type: string
                  description: JID (ID) do grupo no formato xxxxx@g.us
                  example: 120363339858396166@g.us
                  pattern: ^[0-9]+@g\.us$
                description:
                  type: string
                  description: Nova descrição/tópico do grupo
                  example: Grupo oficial de suporte
                  maxLength: 512
      responses:
        '200':
          description: Descrição atualizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Group description updated successfully
                  group:
                    $ref: ../schemas/group.yaml#/Group
        '401':
          description: Token inválido ou ausente
        '403':
          description: Usuário não é administrador do grupo
        '404':
          description: Grupo não encontrado
        '413':
          description: Descrição excede o limite máximo permitido
  /group/updateImage:
    post:
      tags:
        - Grupos e Comunidades
      summary: Atualizar imagem do grupo
      description: |
        Altera a imagem do grupo especificado. A imagem pode ser enviada como URL ou como string base64.

        Requisitos da imagem:
        - Formato: JPEG
        - Resolução máxima: 640x640 pixels
        - Imagens maiores ou diferente de JPEG não são aceitas pelo WhatsApp

        Para remover a imagem atual, envie "remove" ou "delete" no campo image.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                groupjid:
                  type: string
                  description: JID do grupo
                  example: 120363308883996631@g.us
                image:
                  type: string
                  description: |
                    URL da imagem, string base64 ou "remove"/"delete" para remover.
                    A imagem deve estar em formato JPEG e ter resolução máxima de 640x640.
                  examples:
                    url:
                      value: https://example.com/image.jpg
                      summary: URL da imagem
                    base64:
                      value: data:image/jpeg;base64,/9j/4AAQSkZJRg...
                      summary: Imagem em base64
                    remove:
                      value: remove
                      summary: Remover imagem atual
              required:
                - groupjid
                - image
      parameters: []
      responses:
        '200':
          description: Imagem atualizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Group image updated successfully
                  group:
                    $ref: ../schemas/group.yaml#/Group
        '400':
          description: Erro nos parâmetros da requisição
        '401':
          description: Token inválido ou expirado
        '403':
          description: Usuário não é administrador do grupo
        '413':
          description: Imagem muito grande
        '415':
          description: Formato de imagem inválido
  /group/updateLocked:
    post:
      tags:
        - Grupos e Comunidades
      summary: Configurar permissão de edição do grupo
      description: |
        Define se apenas administradores podem editar as informações do grupo. 
        Quando bloqueado (locked=true), apenas administradores podem alterar nome, descrição, 
        imagem e outras configurações do grupo. Quando desbloqueado (locked=false), 
        qualquer participante pode editar as informações.

        Importante:
        - Requer que o usuário seja administrador do grupo
        - Afeta edições de nome, descrição, imagem e outras informações do grupo
        - Não controla permissões de adição de membros
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                groupjid:
                  type: string
                  description: Identificador único do grupo (JID)
                  example: 120363308883996631@g.us
                locked:
                  type: boolean
                  description: |
                    Define permissões de edição:
                    - true = apenas admins podem editar infos do grupo
                    - false = qualquer participante pode editar infos do grupo
                  example: true
              required:
                - groupjid
                - locked
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
                    example: Group lock status changed successfully
                  group:
                    $ref: ../schemas/group.yaml#/Group
        '403':
          description: Usuário não é administrador do grupo
        '404':
          description: Grupo não encontrado
  /group/updateName:
    post:
      tags:
        - Grupos e Comunidades
      summary: Atualizar nome do grupo
      description: |
        Altera o nome de um grupo do WhatsApp. Apenas administradores do grupo podem realizar esta operação.
        O nome do grupo deve seguir as diretrizes do WhatsApp e ter entre 1 e 25 caracteres.
      security:
        - token: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - groupjid
                - name
              properties:
                groupjid:
                  type: string
                  description: Identificador único do grupo no formato JID
                  example: 120363339858396166@g.us
                name:
                  type: string
                  description: Novo nome para o grupo
                  example: Grupo de Suporte
                  minLength: 1
                  maxLength: 25
      responses:
        '200':
          description: Nome do grupo atualizado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    example: Group name updated successfully
                  group:
                    $ref: ../schemas/group.yaml#/Group
        '400':
          description: Erro de validação na requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid payload
        '401':
          description: Token de autenticação ausente ou inválido
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Unauthorized
        '403':
          description: Usuário não é administrador do grupo
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: User is not an admin of this group
        '404':
          description: Grupo não encontrado
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Group not found
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Failed to update group name
  /group/updateParticipants:
    post:
      tags:
        - Grupos e Comunidades
      summary: Gerenciar participantes do grupo
      description: |
        Gerencia participantes do grupo através de diferentes ações:
        - Adicionar ou remover participantes
        - Promover ou rebaixar administradores
        - Aprovar ou rejeitar solicitações pendentes

        Requer que o usuário seja administrador do grupo para executar as ações.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                groupjid:
                  type: string
                  description: JID (identificador) do grupo
                  example: 120363308883996631@g.us
                action:
                  type: string
                  description: |
                    Ação a ser executada:
                    - add: Adicionar participantes ao grupo
                    - remove: Remover participantes do grupo
                    - promote: Promover participantes a administradores
                    - demote: Remover privilégios de administrador
                    - approve: Aprovar solicitações pendentes de entrada
                    - reject: Rejeitar solicitações pendentes de entrada
                  enum:
                    - add
                    - remove
                    - promote
                    - demote
                    - approve
                    - reject
                  example: promote
                participants:
                  type: array
                  items:
                    type: string
                  description: |
                    Lista de números de telefone ou JIDs dos participantes.
                    Para números de telefone, use formato internacional sem '+' ou espaços.
                  example:
                    - '5521987654321'
                    - '5511999887766'
              required:
                - groupjid
                - action
                - participants
      responses:
        '200':
          description: Sucesso na operação
          content:
            application/json:
              schema:
                type: object
                properties:
                  groupUpdated:
                    type: array
                    items:
                      type: object
                      properties:
                        JID:
                          type: string
                          description: JID do participante
                        Error:
                          type: integer
                          description: Código de erro (0 para sucesso)
                    description: Status da operação para cada participante
                  group:
                    $ref: ../schemas/group.yaml#/Group
                    description: Informações atualizadas do grupo
        '400':
          description: Erro nos parâmetros da requisição
        '403':
          description: Usuário não é administrador do grupo
        '500':
          description: Erro interno do servidor
  /community/create:
    post:
      tags:
        - Grupos e Comunidades
      summary: Criar uma comunidade
      description: >
        Cria uma nova comunidade no WhatsApp. Uma comunidade é uma estrutura que permite agrupar múltiplos grupos
        relacionados sob uma única administração. 


        A comunidade criada inicialmente terá apenas o grupo principal (announcements), e grupos adicionais podem ser
        vinculados posteriormente usando o endpoint `/community/updategroups`.


        **Observações importantes:**

        - O número que cria a comunidade torna-se automaticamente o administrador

        - A comunidade terá um grupo principal de anúncios criado automaticamente
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  description: Nome da comunidade
                  example: Comunidade do Bairro
              required:
                - name
      responses:
        '200':
          description: Comunidade criada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  group:
                    $ref: ../schemas/group.yaml#/Group
                  failed:
                    type: array
                    description: Lista de JIDs que falharam ao serem adicionados
                    items:
                      type: string
                      format: jid
        '400':
          description: Erro na requisição
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: invalid payload
        '401':
          description: Token inválido ou não fornecido
        '403':
          description: Sem permissão para criar comunidades
        '429':
          description: Limite de criação de comunidades atingido
        '500':
          description: Erro interno do servidor
  /community/editgroups:
    post:
      tags:
        - Grupos e Comunidades
      summary: Gerenciar grupos em uma comunidade
      description: >
        Adiciona ou remove grupos de uma comunidade do WhatsApp. Apenas administradores da comunidade podem executar
        estas operações.


        ## Funcionalidades

        - Adicionar múltiplos grupos simultaneamente a uma comunidade

        - Remover grupos de uma comunidade existente

        - Suporta operações em lote


        ## Limitações

        - Os grupos devem existir previamente

        - A comunidade deve existir e o usuário deve ser administrador

        - Grupos já vinculados não podem ser adicionados novamente

        - Grupos não vinculados não podem ser removidos


        ## Ações Disponíveis

        - `add`: Adiciona os grupos especificados à comunidade

        - `remove`: Remove os grupos especificados da comunidade
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - community
                - action
                - groupjids
              properties:
                community:
                  type: string
                  description: JID (identificador único) da comunidade
                  example: 120363153742561022@g.us
                action:
                  type: string
                  enum:
                    - add
                    - remove
                  description: |
                    Tipo de operação a ser realizada:
                    * add - Adiciona grupos à comunidade
                    * remove - Remove grupos da comunidade
                groupjids:
                  type: array
                  items:
                    type: string
                    pattern: ^[0-9]+@g.us$
                  minItems: 1
                  description: Lista de JIDs dos grupos para adicionar ou remover
                  example:
                    - 120363324255083289@g.us
                    - 120363308883996631@g.us
      responses:
        '200':
          description: Operação realizada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: community updated
                  success:
                    type: array
                    items:
                      type: string
                    description: Lista de JIDs dos grupos processados com sucesso
                  failed:
                    type: array
                    items:
                      type: string
                    description: Lista de JIDs dos grupos que falharam no processamento
        '400':
          description: Requisição inválida
        '401':
          description: Não autorizado
        '403':
          description: Usuário não é administrador da comunidade
