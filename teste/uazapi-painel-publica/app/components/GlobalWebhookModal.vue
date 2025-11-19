<script setup lang="ts">
import type { WebhookEvent, ExcludeMessageFilter, WebhookResponse } from '../../shared/types/Webhook'

// Props
interface Props {
  serverUrl: string
  adminToken: string
}

const props = defineProps<Props>()

// Props e Emits seguindo padrão v-model
const open = defineModel<boolean>('open', { default: false })

// Store e composables
const toast = useToast()

// Estados do componente
const webhooks = ref<WebhookResponse[]>([])
const loading = ref(false)
const isSaving = ref(false)

// Formulário de webhook
const form = ref({
  url: '',
  events: ['messages'] as WebhookEvent[],
  excludeMessages: ['wasSentByApi'] as ExcludeMessageFilter[],
  addUrlEvents: false,
  addUrlTypesMessages: false,
  enabled: true
})

// Lista de eventos disponíveis
const availableEvents: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'connection', label: 'connection', description: 'Alterações no estado da conexão' },
  { value: 'messages', label: 'messages', description: 'Novas mensagens recebidas' },
  { value: 'messages_update', label: 'messages_update', description: 'Atualizações em mensagens existentes' },
  { value: 'history', label: 'history', description: 'Recebimento de histórico de mensagens' },
  { value: 'call', label: 'call', description: 'Eventos de chamadas VoIP' },
  { value: 'contacts', label: 'contacts', description: 'Atualizações na agenda de contatos' },
  { value: 'presence', label: 'presence', description: 'Alterações no status de presença' },
  { value: 'groups', label: 'groups', description: 'Modificações em grupos' },
  { value: 'labels', label: 'labels', description: 'Gerenciamento de etiquetas' },
  { value: 'chats', label: 'chats', description: 'Eventos de conversas' },
  { value: 'chat_labels', label: 'chat_labels', description: 'Alterações em etiquetas de conversas' },
  { value: 'blocks', label: 'blocks', description: 'Bloqueios/desbloqueios' },
  { value: 'leads', label: 'leads', description: 'Atualizações de leads' },
  { value: 'sender', label: 'sender', description: 'Atualizações de campanhas' }
]

// Lista de filtros de mensagens
const messageFilters: { value: ExcludeMessageFilter; label: string; description: string }[] = [
  { value: 'wasSentByApi', label: 'wasSentByApi', description: '⚠️ IMPORTANTE: Use sempre para evitar loops' },
  { value: 'wasNotSentByApi', label: 'wasNotSentByApi', description: 'Mensagens não originadas pela API' },
  { value: 'fromMeYes', label: 'fromMeYes', description: 'Mensagens enviadas pelo usuário' },
  { value: 'fromMeNo', label: 'fromMeNo', description: 'Mensagens recebidas de terceiros' },
  { value: 'isGroupYes', label: 'isGroupYes', description: 'Mensagens em grupos' },
  { value: 'isGroupNo', label: 'isGroupNo', description: 'Mensagens em conversas individuais' }
]

// Computed para verificar se há webhook (ativo ou desabilitado)
const currentWebhook = computed(() => webhooks.value[0] || null)

// Função para carregar webhooks globais
const loadGlobalWebhooks = async () => {
  if (!props.serverUrl || !props.adminToken) {
    return
  }

  loading.value = true
  
  try {
    const response = await $fetch(`${props.serverUrl}/globalwebhook`, {
      headers: {
        'admintoken': props.adminToken,
        'Accept': 'application/json'
      }
    })
    
    webhooks.value = Array.isArray(response) ? response : (response ? [response] : [])
    
    // Se há um webhook, preencher o formulário
    if (currentWebhook.value) {
      form.value = {
        url: currentWebhook.value.url,
        events: [...currentWebhook.value.events],
        excludeMessages: [...(currentWebhook.value.excludeMessages || [])],
        addUrlEvents: currentWebhook.value.addUrlEvents || false,
        addUrlTypesMessages: currentWebhook.value.addUrlTypesMessages || false,
        enabled: currentWebhook.value.enabled
      }
    }
  } catch (error: any) {
    // Se for 404, não há webhook configurado ainda (isso é normal)
    if (error.response?.status === 404) {
      webhooks.value = []
    } else {
      toast.add({
        title: 'Erro ao carregar webhook global',
        description: error.data?.message || error.message || 'Não foi possível carregar o webhook global',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
  } finally {
    loading.value = false
  }
}

// Função para salvar webhook global
const saveGlobalWebhook = async () => {
  if (!props.serverUrl || !props.adminToken) {
    toast.add({
      title: 'Erro de configuração',
      description: 'Server URL ou admin token não disponíveis',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  if (!form.value.url || form.value.events.length === 0) {
    toast.add({
      title: 'Dados obrigatórios',
      description: 'URL e pelo menos um evento são obrigatórios',
      icon: 'i-lucide-alert-circle',
      color: 'warning'
    })
    return
  }

  isSaving.value = true

  try {
    await $fetch(`${props.serverUrl}/globalwebhook`, {
      method: 'POST',
      headers: {
        'admintoken': props.adminToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        url: form.value.url,
        events: form.value.events,
        excludeMessages: form.value.excludeMessages,
        addUrlEvents: form.value.addUrlEvents,
        addUrlTypesMessages: form.value.addUrlTypesMessages,
        enabled: form.value.enabled
      }
    })

    toast.add({
      title: 'Webhook global salvo!',
      description: 'Webhook global foi configurado com sucesso',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    
    open.value = false
    await loadGlobalWebhooks()
  } catch (error: any) {
    toast.add({
      title: 'Erro ao salvar',
      description: error.data?.message || 'Não foi possível salvar o webhook global',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// Função para desabilitar/habilitar webhook global
const toggleGlobalWebhook = async () => {
  if (!currentWebhook.value || !props.serverUrl || !props.adminToken) return

  isSaving.value = true

  try {
    await $fetch(`${props.serverUrl}/globalwebhook`, {
      method: 'POST',
      headers: {
        'admintoken': props.adminToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        url: currentWebhook.value.url,
        events: currentWebhook.value.events,
        excludeMessages: currentWebhook.value.excludeMessages || [],
        addUrlEvents: currentWebhook.value.addUrlEvents || false,
        addUrlTypesMessages: currentWebhook.value.addUrlTypesMessages || false,
        enabled: !currentWebhook.value.enabled
      }
    })

    const action = currentWebhook.value.enabled ? 'desabilitado' : 'habilitado'
    toast.add({
      title: `Webhook global ${action}!`,
      description: `Webhook global foi ${action} com sucesso`,
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    
    await loadGlobalWebhooks()
  } catch (error: any) {
    toast.add({
      title: 'Erro ao atualizar',
      description: error.data?.message || 'Não foi possível atualizar o webhook global',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// Função para remover webhook global
const removeGlobalWebhook = async () => {
  if (!currentWebhook.value || !props.serverUrl || !props.adminToken) return

  isSaving.value = true

  try {
    await $fetch(`${props.serverUrl}/globalwebhook`, {
      method: 'DELETE',
      headers: {
        'admintoken': props.adminToken,
        'Accept': 'application/json'
      }
    })

    toast.add({
      title: 'Webhook global removido!',
      description: 'Webhook global foi removido com sucesso',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    
    // Limpar formulário
    form.value = {
      url: '',
      events: ['messages'],
      excludeMessages: ['wasSentByApi'],
      addUrlEvents: false,
      addUrlTypesMessages: false,
      enabled: true
    }
    
    await loadGlobalWebhooks()
  } catch (error: any) {
    toast.add({
      title: 'Erro ao remover',
      description: error.data?.message || 'Não foi possível remover o webhook global',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// Carregar webhooks quando o modal abre
watch(open, (newValue) => {
  if (newValue) {
    loadGlobalWebhooks()
  }
})

// Também executar quando o componente for montado se o modal já estiver aberto
onMounted(() => {
  if (open.value) {
    loadGlobalWebhooks()
  }
})
</script>

<template>
  <UModal 
    v-model:open="open"
    title="Webhook Global"
    description="Receba eventos de todas as instâncias deste servidor"
  >
    <template #body>

      <!-- Observação -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p class="text-sm text-blue-700 dark:text-blue-300">
            O webhook global recebe eventos de <strong>todas as instâncias</strong> deste servidor. 
            Ideal para sistemas centralizados de monitoramento.
          </p>
        </div>
      </div>



      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <UIcon name="i-lucide-loader-circle" class="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
          <p class="text-sm text-gray-500 dark:text-gray-400">Carregando webhook global...</p>
        </div>
      </div>

      <!-- Conteúdo principal -->
      <div v-else class="space-y-6">
        <!-- Status Atual -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white">
              Status do Webhook Global
            </h4>
            <UBadge
              :color="currentWebhook?.enabled ? 'success' : (currentWebhook ? 'warning' : 'neutral')"
              variant="subtle"
            >
              {{ currentWebhook?.enabled ? 'Ativo' : (currentWebhook ? 'Desabilitado' : 'Inativo') }}
            </UBadge>
          </div>

          <div v-if="currentWebhook" class="space-y-2">
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">URL:</span>
              <p class="text-sm font-mono text-gray-900 dark:text-white break-all">
                {{ currentWebhook.url }}
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">Eventos:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <UBadge
                  v-for="event in currentWebhook.events"
                  :key="event"
                  variant="subtle"
                  color="primary"
                  size="xs"
                >
                  {{ event }}
                </UBadge>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-4">
            <UIcon name="i-lucide-webhook" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Nenhum webhook global configurado
            </p>
          </div>

          <!-- Botões de ação rápida -->
          <div v-if="currentWebhook" class="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <UButton
              :color="currentWebhook.enabled ? 'warning' : 'success'"
              variant="outline"
              size="sm"
              :icon="currentWebhook.enabled ? 'i-lucide-pause' : 'i-lucide-play'"
              :loading="isSaving"
              @click="toggleGlobalWebhook"
            >
              {{ currentWebhook.enabled ? 'Desabilitar' : 'Habilitar' }}
            </UButton>
            
            <UButton
              color="error"
              variant="outline"
              size="sm"
              icon="i-lucide-trash-2"
              :loading="isSaving"
              @click="removeGlobalWebhook"
            >
              Remover
            </UButton>
          </div>
        </div>

        <!-- Formulário de Configuração -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">
            {{ currentWebhook ? 'Editar Webhook Global' : 'Configurar Webhook Global' }}
          </h4>

          <!-- URL -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL do Webhook *
            </label>
            <UInput
              v-model="form.url"
              placeholder="https://meusite.com/webhook-global"
              class="w-full"
            />
          </div>

          <!-- Eventos -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Eventos a Monitorar *
            </label>
            <div class="grid grid-cols-1 gap-2">
              <label
                v-for="event in availableEvents"
                :key="event.value"
                class="flex items-start gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <UCheckbox
                  :model-value="form.events.includes(event.value)"
                  @update:model-value="(checked) => {
                    if (checked) {
                      form.events.push(event.value)
                    } else {
                      const index = form.events.indexOf(event.value)
                      if (index > -1) form.events.splice(index, 1)
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

          <!-- Filtros de Mensagens -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excluir Mensagens
            </label>
            <div class="grid grid-cols-1 gap-2">
              <label
                v-for="filter in messageFilters"
                :key="filter.value"
                class="flex items-start gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <UCheckbox
                  :model-value="form.excludeMessages.includes(filter.value)"
                  @update:model-value="(checked) => {
                    if (checked) {
                      form.excludeMessages.push(filter.value)
                    } else {
                      const index = form.excludeMessages.indexOf(filter.value)
                      if (index > -1) form.excludeMessages.splice(index, 1)
                    }
                  }"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ filter.label }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ filter.description }}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Opções Avançadas -->
          <div class="space-y-3">
            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Opções Avançadas
            </h5>
            
            <label class="flex items-start gap-2 cursor-pointer">
              <UCheckbox v-model="form.addUrlEvents" />
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Adicionar eventos na URL
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Adiciona o tipo do evento como parâmetro na URL
                </p>
              </div>
            </label>

            <label class="flex items-start gap-2 cursor-pointer">
              <UCheckbox v-model="form.addUrlTypesMessages" />
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Adicionar tipos de mensagem na URL
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Adiciona o tipo da mensagem como parâmetro na URL
                </p>
              </div>
            </label>

            <label class="flex items-start gap-2 cursor-pointer">
              <UCheckbox v-model="form.enabled" />
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Webhook ativo
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Habilita ou desabilita o recebimento de eventos
                </p>
              </div>
            </label>
          </div>
        </div>

      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex gap-3 justify-end w-full">
        <UButton
          color="neutral"
          variant="ghost"
          @click="close"
        >
          Cancelar
        </UButton>
        
        <UButton
          color="primary"
          :loading="isSaving"
          :disabled="!form.url || form.events.length === 0"
          @click="saveGlobalWebhook"
        >
          {{ isSaving ? 'Salvando...' : 'Salvar Webhook Global' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
