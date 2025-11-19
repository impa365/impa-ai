<script setup lang="ts">
import type { Instance } from '../../../shared/types/Instance'
import { useInstancesStore } from '../../stores/instances'
import { useInstanciaAtualStore } from '../../stores/instanciaAtual'

// Pegar o ID da instância da rota
const route = useRoute()
const instanceId = route.params.id as string

// Stores Pinia
const instancesStore = useInstancesStore()
const instanciaAtualStore = useInstanciaAtualStore()

// Composables para obter servidor
const { servers } = useServers()

// Estados reativos
const loading = ref(true)
const error = ref<string | null>(null)

// Encontrar o servidor que contém esta instância
const serverInfo = computed(() => {
  // Por enquanto, usar o primeiro servidor disponível
  // Em uma implementação mais robusta, poderíamos armazenar essa informação no store da instância
  return servers.value.length > 0 ? servers.value[0] : null
})

// Controle da aba ativa
const activeTab = ref('infos')

// Lista de abas
const tabs = [
  {
    key: 'infos',
    label: 'Infos',
    icon: 'i-lucide-info'
  },
  {
    key: 'webhook',
    label: 'Webhook',
    icon: 'i-lucide-webhook'
  },
  {
    key: 'eventos',
    label: 'Eventos',
    icon: 'i-lucide-activity'
  }
]

// Composables
const toast = useToast()
const router = useRouter()

// Estados para operações
const isDisconnecting = ref(false)
const showQRModal = ref(false)

// Computed para obter a instância atual
const instance = computed(() => instanciaAtualStore.instancia)

// Função para voltar à página anterior
const goBack = () => {
  // Primeiro tenta voltar no histórico do navegador
  if (window.history.length > 1) {
    router.back()
  } else {
    // Se não há histórico, vai para a página inicial
    router.push('/')
  }
}

// Função para determinar a cor do status
function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'connected':
      return 'success'
    case 'disconnected':
      return 'error'
    case 'connecting':
      return 'warning'
    default:
      return 'neutral'
  }
}

// Função para obter o label do status
function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case 'connected':
      return 'Conectado'
    case 'disconnected':
      return 'Desconectado'
    case 'connecting':
      return 'Conectando'
    default:
      return status
  }
}

// Carregar dados da instância
const loadInstance = async () => {
  loading.value = true
  error.value = null

  try {
    // Verificar se já temos a instância no store
    if (instanciaAtualStore.hasInstancia && instanciaAtualStore.instanciaId === instanceId) {
      // Já temos a instância correta no store
      console.log('Instância carregada do store:', instanciaAtualStore.instanciaNome)
    } else {
      // Tentar buscar a instância no store de instâncias
      const instanceFromStore = instancesStore.getInstanceById(instanceId)
      
      if (instanceFromStore) {
        // Encontrou no store de instâncias, definir como atual
        instanciaAtualStore.setInstancia(instanceFromStore)
        console.log('Instância carregada do store de instâncias:', instanceFromStore.name)
      } else {
        // Se não encontrou a instância, redirecionar
        console.log('Instância não encontrada, redirecionando...')
        
        // Tentar voltar para a página anterior (provavelmente a página do servidor)
        if (window.history.length > 1) {
          router.back()
        } else {
          // Se não há histórico, vai para a página inicial
          router.push('/')
        }
        
        return
      }
    }
  } catch (err) {
    error.value = 'Erro inesperado ao carregar instância'
    console.error('Erro ao carregar instância:', err)
  } finally {
    loading.value = false
  }
}

// Função para desconectar instância
const handleDisconnect = async () => {
  if (!instance.value || !instanciaAtualStore.serverUrl) {
    toast.add({
      title: 'Erro',
      description: 'Informações do servidor não disponíveis',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  isDisconnecting.value = true

  try {
    const result = await instancesStore.disconnectInstance(
      instanciaAtualStore.serverUrl,
      instance.value.token
    )

    if (result.success) {
      toast.add({
        title: 'Instância desconectada',
        description: `A instância ${instance.value.name} foi desconectada com sucesso`,
        icon: 'i-lucide-check-circle',
        color: 'success'
      })

      // Atualizar o status da instância nos stores
      const updatedInstance = {
        ...instance.value,
        status: 'disconnected'
      }
      
      instancesStore.updateInstance(updatedInstance)
      instanciaAtualStore.setInstancia(updatedInstance)

    } else {
      toast.add({
        title: 'Erro ao desconectar',
        description: result.error || 'Ocorreu um erro ao desconectar a instância',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
  } catch (error) {
    toast.add({
      title: 'Erro inesperado',
      description: 'Ocorreu um erro inesperado ao desconectar a instância',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isDisconnecting.value = false
  }
}

// Função para conectar instância (abrir modal QR)
const handleConnect = () => {
  if (!instance.value || !instanciaAtualStore.serverUrl) {
    toast.add({
      title: 'Erro',
      description: 'Informações do servidor não disponíveis',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  showQRModal.value = true
}

// Carregar dados ao montar o componente
onMounted(() => {
  loadInstance()
})

// Meta tags da página
useHead({
  title: computed(() => instance.value ? `${instance.value.name} - Instância` : 'Carregando...'),
  meta: [
    {
      name: 'description',
      content: computed(() => instance.value ? `Gerenciar instância ${instance.value.name}` : 'Carregando instância...')
    }
  ]
})
</script>

<template>
  <NuxtLayout name="default-layout">
    <div class="container mx-auto px-4 py-8">
      <!-- Header da página -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <button 
            @click="goBack"
            class="text-primary-600 hover:text-primary-700 cursor-pointer"
          >
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ instance?.name || 'Carregando...' }}
          </h1>
        </div>
      
      <!-- Status da instância -->
      <div v-if="instance" class="flex items-center gap-3">
        <UAvatar
          :src="instance.profilePicUrl || undefined"
          :alt="instance.profileName || instance.name"
          size="sm"
          :icon="!instance.profilePicUrl ? 'i-lucide-user' : undefined"
        />
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ instance.profileName || 'Sem nome do perfil' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ instance.owner }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UBadge 
            :color="getStatusColor(instance.status)"
            variant="subtle"
            class="capitalize"
          >
            {{ getStatusLabel(instance.status) }}
          </UBadge>
          
          <!-- Botão de desconectar (só aparece se conectado) -->
          <UButton
            v-if="instance.status.toLowerCase() === 'connected'"
            color="error"
            variant="outline"
            size="xs"
            icon="i-lucide-power-off"
            :loading="isDisconnecting"
            @click="handleDisconnect"
          >
            {{ isDisconnecting ? 'Desconectando...' : 'Desconectar' }}
          </UButton>

          <!-- Botão de conectar (só aparece se desconectado) -->
          <UButton
            v-else-if="instance.status.toLowerCase() === 'disconnected'"
            color="success"
            variant="outline"
            size="xs"
            icon="i-lucide-power"
            @click="handleConnect"
          >
            Conectar
          </UButton>
        </div>
      </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <UIcon name="i-lucide-loader-circle" class="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
          <p class="text-sm text-gray-500 dark:text-gray-400">Carregando dados da instância...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex items-center justify-center py-12">
        <div class="text-center">
          <UIcon name="i-lucide-alert-circle" class="w-12 h-12 mx-auto mb-4 text-error" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Erro ao carregar instância
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ error }}
          </p>
          <UButton
            color="primary"
            icon="i-lucide-refresh-cw"
            @click="loadInstance"
          >
            Tentar Novamente
          </UButton>
        </div>
      </div>

      <!-- Content -->
      <div v-else-if="instance" class="space-y-6">
        <!-- Navegação das abas -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
              'group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm cursor-pointer transition-colors'
            ]"
          >
            <UIcon :name="tab.icon" class="w-4 h-4 mr-2" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Conteúdo das abas -->
      <div class="py-6">
        <!-- Aba Infos -->
        <InfoInstancia 
          v-if="activeTab === 'infos'" 
          :instance="instance"
          :server-url="instanciaAtualStore.serverUrl"
          :admin-token="instanciaAtualStore.adminToken"
        />

        <!-- Aba Webhook -->
        <WebhookAba 
          v-else-if="activeTab === 'webhook'" 
          :instance="instance"
          :server-url="instanciaAtualStore.serverUrl"
          :admin-token="instanciaAtualStore.adminToken"
        />

        <!-- Aba Eventos -->
        <EventosAba 
          v-else-if="activeTab === 'eventos'" 
          :instance="instance"
          :server-url="instanciaAtualStore.serverUrl"
          :admin-token="instanciaAtualStore.adminToken"
        />
      </div>
      </div>
    </div>

    <!-- Modal de QR Code para conectar -->
    <QRCodeModal
      v-if="instance && instanciaAtualStore.serverUrl && instanciaAtualStore.adminToken"
      v-model:open="showQRModal"
      :instance="instance"
      :server-url="instanciaAtualStore.serverUrl"
      :admin-token="instanciaAtualStore.adminToken"
      @connection-success="() => {
        // Atualizar status da instância quando conectar com sucesso
        if (instance) {
          const updatedInstance = { ...instance, status: 'connected' }
          instancesStore.updateInstance(updatedInstance)
          instanciaAtualStore.setInstancia(updatedInstance)
        }
      }"
    />
  </NuxtLayout>
</template>
