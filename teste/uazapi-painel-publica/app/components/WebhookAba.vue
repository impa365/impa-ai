<script setup lang="ts">
import type { Instance } from '../../shared/types/Instance'
import type { WebhookEvent, ExcludeMessageFilter, WebhookResponse } from '../../shared/types/Webhook'
import { useInstancesStore } from '../stores/instances'

// Props
interface Props {
  instance: Instance
  serverUrl?: string | null
  adminToken?: string | null
}

const props = defineProps<Props>()

// Store e composables
const instancesStore = useInstancesStore()
const toast = useToast()

// Estados do componente
const webhooks = ref<WebhookResponse[]>([])
const loading = ref(false)
const isSaving = ref(false)
const showForm = ref(false)

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

// Função para carregar webhooks
const loadWebhooks = async () => {
  if (!props.serverUrl || !props.instance.token) {
    console.warn('Server URL ou token da instância não disponíveis')
    return
  }

  loading.value = true
  
  try {
    const result = await instancesStore.getWebhooks(props.serverUrl, props.instance.token)
    
    if (result.success) {
      webhooks.value = result.data || []
      
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
    } else {
      toast.add({
        title: 'Erro ao carregar webhooks',
        description: result.error || 'Não foi possível carregar os webhooks',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
  } catch (error) {
    console.error('Erro ao carregar webhooks:', error)
  } finally {
    loading.value = false
  }
}

// Função para salvar webhook
const saveWebhook = async () => {
  if (!props.serverUrl || !props.instance.token) {
    toast.add({
      title: 'Erro de configuração',
      description: 'Server URL ou token da instância não disponíveis',
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
    // Se há um webhook existente, deletar primeiro apenas se não estiver editando
    if (currentWebhook.value) {
      await instancesStore.deleteWebhook(
        props.serverUrl,
        props.instance.token,
        currentWebhook.value.id
      )
    }

    // Criar novo webhook
    const result = await instancesStore.createWebhook(
      props.serverUrl,
      props.instance.token,
      {
        url: form.value.url,
        events: form.value.events,
        excludeMessages: form.value.excludeMessages,
        addUrlEvents: form.value.addUrlEvents,
        addUrlTypesMessages: form.value.addUrlTypesMessages,
        enabled: form.value.enabled
      }
    )

    if (result.success) {
      toast.add({
        title: 'Webhook salvo!',
        description: 'Webhook foi configurado com sucesso',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
      
      showForm.value = false
      await loadWebhooks()
    } else {
      toast.add({
        title: 'Erro ao salvar',
        description: result.error || 'Não foi possível salvar o webhook',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
  } catch (error) {
    toast.add({
      title: 'Erro inesperado',
      description: 'Ocorreu um erro inesperado ao salvar o webhook',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// Função para desabilitar/habilitar webhook
const toggleWebhook = async () => {
  if (!currentWebhook.value || !props.serverUrl || !props.instance.token) return

  isSaving.value = true

  try {
    // Criar um webhook atualizado com status invertido
    const result = await instancesStore.createWebhook(
      props.serverUrl,
      props.instance.token,
      {
        url: currentWebhook.value.url,
        events: currentWebhook.value.events,
        excludeMessages: currentWebhook.value.excludeMessages || [],
        addUrlEvents: currentWebhook.value.addUrlEvents || false,
        addUrlTypesMessages: currentWebhook.value.addUrlTypesMessages || false,
        enabled: !currentWebhook.value.enabled
      }
    )

    if (result.success) {
      const action = currentWebhook.value.enabled ? 'desabilitado' : 'habilitado'
      toast.add({
        title: `Webhook ${action}!`,
        description: `Webhook foi ${action} com sucesso`,
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
      
      await loadWebhooks()
    } else {
      toast.add({
        title: 'Erro ao atualizar',
        description: result.error || 'Não foi possível atualizar o webhook',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
  } catch (error) {
    toast.add({
      title: 'Erro inesperado',
      description: 'Ocorreu um erro inesperado ao atualizar o webhook',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// Função para remover webhook
const removeWebhook = async () => {
  if (!currentWebhook.value || !props.serverUrl || !props.instance.token) return

  isSaving.value = true

  try {
    const result = await instancesStore.deleteWebhook(
      props.serverUrl,
      props.instance.token,
      currentWebhook.value.id
    )

    if (result.success) {
      toast.add({
        title: 'Webhook removido!',
        description: 'Webhook foi removido com sucesso',
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
      
      await loadWebhooks()
    } else {
      toast.add({
        title: 'Erro ao remover',
        description: result.error || 'Não foi possível remover o webhook',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
  } catch (error) {
    toast.add({
      title: 'Erro inesperado',
      description: 'Ocorreu um erro inesperado ao remover o webhook',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// Função para alternar formulário
const toggleForm = () => {
  showForm.value = !showForm.value
  
  if (showForm.value && currentWebhook.value) {
    // Preencher formulário com dados existentes
    form.value = {
      url: currentWebhook.value.url,
      events: [...currentWebhook.value.events],
      excludeMessages: [...(currentWebhook.value.excludeMessages || [])],
      addUrlEvents: currentWebhook.value.addUrlEvents || false,
      addUrlTypesMessages: currentWebhook.value.addUrlTypesMessages || false,
      enabled: currentWebhook.value.enabled
    }
  }
}

// Carregar webhooks ao montar o componente
onMounted(() => {
  loadWebhooks()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Observação -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p class="text-sm text-blue-700 dark:text-blue-300">
          Para configurar múltiplos webhooks consulte a documentação da <strong>UAZAPI</strong>
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
        <p class="text-sm text-gray-500 dark:text-gray-400">Carregando webhooks...</p>
      </div>
    </div>

    <!-- Webhook Status -->
    <div v-else-if="!showForm" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Status do Webhook
        </h3>
        <UBadge
          :color="currentWebhook?.enabled ? 'success' : (currentWebhook ? 'warning' : 'neutral')"
          variant="subtle"
        >
          {{ currentWebhook?.enabled ? 'Ativo' : (currentWebhook ? 'Desabilitado' : 'Inativo') }}
        </UBadge>
      </div>

      <div v-if="currentWebhook" class="space-y-4">
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            URL
          </label>
          <p class="mt-2 text-sm font-mono text-gray-900 dark:text-white break-all">
            {{ currentWebhook.url }}
          </p>
        </div>
        
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Eventos Monitorados
          </label>
          <div class="mt-3 flex flex-wrap gap-2">
            <UBadge
              v-for="event in currentWebhook.events"
              :key="event"
              variant="subtle"
              color="primary"
              size="xs"
            >
              {{ availableEvents.find(e => e.value === event)?.label || event }}
            </UBadge>
          </div>
        </div>

        <div v-if="currentWebhook.excludeMessages && currentWebhook.excludeMessages.length > 0">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Mensagens Excluídas
          </label>
<div class="mt-4 pb-3 flex flex-wrap gap-2">
            <UBadge
              v-for="filter in currentWebhook.excludeMessages"
              :key="filter"
              variant="subtle"
              color="warning"
              size="xs"
            >
              {{ messageFilters.find(f => f.value === filter)?.label || filter }}
            </UBadge>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-6">
        <UIcon name="i-lucide-webhook" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum webhook configurado
        </h4>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Configure um webhook para receber eventos em tempo real desta instância
        </p>
      </div>

      <!-- Botões de ação -->
      <div class="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <UButton
          v-if="!showForm"
          color="primary"
          icon="i-lucide-plus"
          @click="toggleForm"
        >
          {{ currentWebhook ? 'Editar Webhook' : 'Configurar Webhook' }}
        </UButton>
        
        <UButton
          v-if="currentWebhook && !showForm"
          :color="currentWebhook.enabled ? 'warning' : 'success'"
          variant="outline"
          :icon="currentWebhook.enabled ? 'i-lucide-pause' : 'i-lucide-play'"
          :loading="isSaving"
          @click="toggleWebhook"
        >
          {{ currentWebhook.enabled ? 'Desabilitar' : 'Habilitar' }}
        </UButton>
        
        <UButton
          v-if="currentWebhook && !showForm"
          color="error"
          variant="outline"
          icon="i-lucide-trash-2"
          :loading="isSaving"
          @click="removeWebhook"
        >
          Remover
        </UButton>
      </div>
    </div>

    <!-- Formulário de Webhook -->
    <div v-if="showForm" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {{ currentWebhook ? 'Editar Webhook' : 'Configurar Webhook' }}
      </h3>

      <div class="space-y-4">
        <!-- URL -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL do Webhook *
          </label>
          <UInput
            v-model="form.url"
            placeholder="https://meusite.com/webhook"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">
            💡 Para testes, use: webhook.cool, rbaskets.in
          </p>
        </div>

        <!-- Eventos -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Eventos a Monitorar *
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
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
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Opções Avançadas
          </h4>
          
          <label class="flex items-start gap-2 cursor-pointer">
            <UCheckbox v-model="form.addUrlEvents" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Adicionar eventos na URL
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Adiciona o tipo do evento como parâmetro na URL (ex: /webhook/message)
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
                Adiciona o tipo da mensagem como parâmetro na URL (ex: /webhook/conversation)
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

        <!-- Botões -->
        <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <UButton
            color="primary"
            icon="i-lucide-save"
            :loading="isSaving"
            @click="saveWebhook"
          >
            {{ isSaving ? 'Salvando...' : 'Salvar Webhook' }}
          </UButton>
          
          <UButton
            color="neutral"
            variant="outline"
            @click="showForm = false"
          >
            Cancelar
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
