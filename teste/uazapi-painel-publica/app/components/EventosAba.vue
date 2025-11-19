<script setup lang="ts">
import type { Instance } from '../../shared/types/Instance'

// Props
interface Props {
  instance: Instance
  serverUrl?: string | null
  adminToken?: string | null
}

const props = defineProps<Props>()

// Store e composables
const toast = useToast()

// Estado do componente
const isConnected = ref(false)
const isConnecting = ref(false)
const events = ref<any[]>([])
const eventSource = ref<EventSource | null>(null)
const maxEvents = ref(100) // Limite de eventos para não sobrecarregar a UI

// Configuração
const selectedEvents = ref<string[]>(['messages'])
const autoReconnect = ref(true)
const showTimestamps = ref(true)

// Lista de eventos disponíveis (baseada na documentação)
const availableEvents = [
  { value: 'connection', label: 'connection', description: 'Alterações no estado da conexão' },
  { value: 'history', label: 'history', description: 'Recebimento de histórico de mensagens' },
  { value: 'messages', label: 'messages', description: 'Novas mensagens recebidas' },
  { value: 'messages_update', label: 'messages_update', description: 'Atualizações em mensagens existentes' },
  { value: 'call', label: 'call', description: 'Eventos de chamadas VoIP' },
  { value: 'contacts', label: 'contacts', description: 'Atualizações na agenda de contatos' },
  { value: 'presence', label: 'presence', description: 'Alterações no status de presença' },
  { value: 'groups', label: 'groups', description: 'Modificações em grupos' },
  { value: 'labels', label: 'labels', description: 'Gerenciamento de etiquetas' },
  { value: 'chats', label: 'chats', description: 'Eventos de conversas' },
  { value: 'chat_labels', label: 'chat_labels', description: 'Alterações em etiquetas de conversas' },
  { value: 'blocks', label: 'blocks', description: 'Bloqueios/desbloqueios' },
  { value: 'leads', label: 'leads', description: 'Atualizações de leads' }
]

// Função para conectar ao SSE
const connectSSE = () => {
  if (!props.serverUrl || !props.instance.token) {
    toast.add({
      title: 'Erro de configuração',
      description: 'Server URL ou token da instância não disponíveis',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  if (selectedEvents.value.length === 0) {
    toast.add({
      title: 'Selecione eventos',
      description: 'Selecione pelo menos um tipo de evento para monitorar',
      icon: 'i-lucide-alert-circle',
      color: 'warning'
    })
    return
  }

  disconnectSSE()
  isConnecting.value = true

  try {
    const eventsParam = selectedEvents.value.join(',')
    const url = `${props.serverUrl}/sse?token=${props.instance.token}&events=${eventsParam}`
    
    console.log('=== CONECTANDO SSE ===')
    console.log('URL completa:', url)
    console.log('Server URL:', props.serverUrl)
    console.log('Token:', props.instance.token)
    console.log('Eventos selecionados:', selectedEvents.value)
    console.log('Eventos param:', eventsParam)
    console.log('====================')
    
    eventSource.value = new EventSource(url)

    eventSource.value.onopen = () => {
      isConnected.value = true
      isConnecting.value = false
      toast.add({
        title: 'Conectado!',
        description: 'Conexão SSE estabelecida com sucesso',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    }

    eventSource.value.onmessage = (event) => {
      console.log('=== EVENTO SSE RECEBIDO ===')
      console.log('Raw event data:', event.data)
      console.log('Event type from SSE:', event.type)
      console.log('Event lastEventId:', event.lastEventId)
      console.log('Event origin:', event.origin)
      
      try {
        const data = JSON.parse(event.data)
        console.log('Parsed data:', data)
        console.log('Data.type field:', data.type)
        console.log('Data.EventType field:', data.EventType)
        console.log('Data keys:', Object.keys(data))
        
        const newEvent = {
          id: Date.now() + Math.random(),
          timestamp: new Date(),
          type: data.EventType || data.type || 'unknown',
          data: data
        }
        
        console.log('Created event object:', newEvent)
        console.log('========================')
        
        events.value.unshift(newEvent)
        
        // Limitar número de eventos para performance
        if (events.value.length > maxEvents.value) {
          events.value = events.value.slice(0, maxEvents.value)
        }
      } catch (error) {
        console.error('Erro ao processar evento SSE:', error)
        console.error('Raw data que causou erro:', event.data)
      }
    }

    eventSource.value.onerror = (error) => {
      console.error('Erro na conexão SSE:', error)
      isConnected.value = false
      isConnecting.value = false
      
      toast.add({
        title: 'Erro na conexão',
        description: 'Conexão SSE foi perdida',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })

      // Auto-reconexão se habilitada
      if (autoReconnect.value) {
        setTimeout(() => {
          if (!isConnected.value) {
            connectSSE()
          }
        }, 3000)
      }
    }
  } catch (error) {
    isConnecting.value = false
    toast.add({
      title: 'Erro ao conectar',
      description: 'Não foi possível estabelecer conexão SSE',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Função para desconectar do SSE
const disconnectSSE = () => {
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }
  isConnected.value = false
  isConnecting.value = false
}

// Função para limpar eventos
const clearEvents = () => {
  events.value = []
  toast.add({
    title: 'Eventos limpos',
    description: 'Lista de eventos foi limpa',
    icon: 'i-lucide-check-circle',
    color: 'success'
  })
}

// Função para formatar timestamp
const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit'
  })
}

// Função para formatar JSON
const formatJSON = (obj: any) => {
  return JSON.stringify(obj, null, 2)
}

// Computed para estatísticas dos eventos
const eventStats = computed(() => {
  const stats: Record<string, number> = {}
  events.value.forEach(event => {
    stats[event.type] = (stats[event.type] || 0) + 1
  })
  return stats
})

// Função para obter cor do evento
const getEventColor = (type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    connection: 'info',
    messages: 'success',
    messages_update: 'warning',
    history: 'secondary',
    call: 'error',
    contacts: 'info',
    presence: 'neutral',
    groups: 'primary',
    labels: 'secondary',
    chats: 'success',
    chat_labels: 'warning',
    blocks: 'error',
    leads: 'info'
  }
  return colors[type] || 'neutral'
}

// Limpar conexão ao desmontar componente
onUnmounted(() => {
  disconnectSSE()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Observação -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-zap" class="w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p class="text-sm text-amber-700 dark:text-amber-300">
          <strong>Server-Sent Events (SSE)</strong> - Receba eventos em tempo real desta instância. 
          Mantenha a aba aberta para continuar recebendo eventos.
        </p>
      </div>
    </div>

    <!-- Status Conectado (Compacto) -->
    <div v-if="isConnected" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UBadge color="success" variant="subtle">
            Conectado
          </UBadge>
          <span class="text-sm text-gray-600 dark:text-gray-300">
            Monitorando {{ selectedEvents.length }} evento{{ selectedEvents.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-settings"
            @click="disconnectSSE"
          >
            Configurar
          </UButton>
          <UButton
            color="error"
            variant="outline"
            size="sm"
            icon="i-lucide-square"
            @click="disconnectSSE"
          >
            Desconectar
          </UButton>
          <UButton
            v-if="events.length > 0"
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-trash-2"
            @click="clearEvents"
          >
            Limpar ({{ events.length }})
          </UButton>
        </div>
      </div>
    </div>

    <!-- Configuração -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Configuração de Eventos
        </h3>
        <UBadge
          :color="isConnected ? 'success' : (isConnecting ? 'warning' : 'neutral')"
          variant="subtle"
        >
          {{ isConnected ? 'Conectado' : (isConnecting ? 'Conectando...' : 'Desconectado') }}
        </UBadge>
      </div>

      <!-- Seleção de Eventos -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Eventos a Monitorar *
        </label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label
            v-for="event in availableEvents"
            :key="event.value"
            class="flex items-start gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            <UCheckbox
              :model-value="selectedEvents.includes(event.value)"
              @update:model-value="(checked) => {
                if (checked) {
                  selectedEvents.push(event.value)
                } else {
                  const index = selectedEvents.indexOf(event.value)
                  if (index > -1) selectedEvents.splice(index, 1)
                }
              }"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ event.label }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ event.description }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Opções -->
      <div class="space-y-3 mb-6">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Opções
        </h4>
        
        <label class="flex items-start gap-2 cursor-pointer">
          <UCheckbox v-model="autoReconnect" />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Reconexão automática
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Tenta reconectar automaticamente em caso de erro
            </p>
          </div>
        </label>

        <label class="flex items-start gap-2 cursor-pointer">
          <UCheckbox v-model="showTimestamps" />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Mostrar timestamps
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Exibe data e hora de cada evento
            </p>
          </div>
        </label>
      </div>

      <!-- Botões de Controle -->
      <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <UButton
          v-if="!isConnected && !isConnecting"
          color="primary"
          icon="i-lucide-play"
          @click="connectSSE"
        >
          Conectar
        </UButton>
        
        <UButton
          v-if="isConnected || isConnecting"
          color="error"
          variant="outline"
          icon="i-lucide-square"
          @click="disconnectSSE"
        >
          Desconectar
        </UButton>
        
        <UButton
          v-if="events.length > 0"
          color="neutral"
          variant="outline"
          icon="i-lucide-trash-2"
          @click="clearEvents"
        >
          Limpar ({{ events.length }})
        </UButton>
      </div>
    </div>

    <!-- Estatísticas -->
    <div v-if="events.length > 0" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
        Estatísticas
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="(count, type) in eventStats" :key="type" class="text-center">
          <UBadge
            :color="getEventColor(String(type))"
            variant="subtle"
            class="mb-1"
          >
            {{ type }}
          </UBadge>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ count }}</p>
        </div>
      </div>
    </div>

    <!-- Lista de Eventos -->
    <div v-if="events.length > 0" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Eventos Recebidos ({{ events.length }})
        </h3>
      </div>
      
      <div class="max-h-96 overflow-y-auto">
        <div
          v-for="event in events"
          :key="event.id"
          class="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <UBadge
                :color="getEventColor(event.type)"
                variant="subtle"
                size="xs"
              >
                {{ event.type }}
              </UBadge>
              <span v-if="showTimestamps" class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatTimestamp(event.timestamp) }}
              </span>
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <!-- Dados principais do evento -->
            <div v-if="event.data.data" class="mb-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div v-if="event.data.data.id">
                  <span class="font-medium text-gray-500 dark:text-gray-400">ID:</span>
                  <span class="ml-1 text-gray-700 dark:text-gray-300">{{ event.data.data.id }}</span>
                </div>
                <div v-if="event.data.data.from">
                  <span class="font-medium text-gray-500 dark:text-gray-400">De:</span>
                  <span class="ml-1 text-gray-700 dark:text-gray-300">{{ event.data.data.from }}</span>
                </div>
                <div v-if="event.data.data.to">
                  <span class="font-medium text-gray-500 dark:text-gray-400">Para:</span>
                  <span class="ml-1 text-gray-700 dark:text-gray-300">{{ event.data.data.to }}</span>
                </div>
                <div v-if="event.data.data.timestamp">
                  <span class="font-medium text-gray-500 dark:text-gray-400">Timestamp:</span>
                  <span class="ml-1 text-gray-700 dark:text-gray-300">{{ new Date(event.data.data.timestamp).toLocaleString('pt-BR') }}</span>
                </div>
              </div>
              
              <!-- Texto da mensagem (se houver) -->
              <div v-if="event.data.data.text" class="mt-2 p-2 bg-white dark:bg-gray-800 rounded border">
                <span class="font-medium text-gray-500 dark:text-gray-400 text-xs">Mensagem:</span>
                <p class="text-sm text-gray-900 dark:text-white mt-1">{{ event.data.data.text }}</p>
              </div>
            </div>

            <!-- JSON completo (colapsível) -->
            <details class="mt-2">
              <summary class="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                Ver JSON completo
              </summary>
              <pre class="text-xs text-gray-600 dark:text-gray-300 mt-2 overflow-x-auto">{{ formatJSON(event.data) }}</pre>
            </details>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado Vazio -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
      <UIcon name="i-lucide-activity" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Nenhum evento recebido
      </h4>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ isConnected ? 'Aguardando eventos...' : 'Conecte-se para começar a receber eventos em tempo real' }}
      </p>
    </div>
  </div>
</template>
