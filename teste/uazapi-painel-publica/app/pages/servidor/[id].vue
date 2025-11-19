<script setup lang="ts">
import type { Server } from '../../../shared/types/Server'
import type { CreateInstanceRequest } from '../../../shared/types/CreateInstance'
import { useInstancesStore } from '../../stores/instances'

// Página de detalhes do servidor
const route = useRoute()
const serverId = route.params.id as string

// Buscar servidor pelo ID
const { servers } = useServers()
const server = computed(() => servers.value.find(s => s.id === serverId))

// Stores Pinia
const instancesStore = useInstancesStore()

// Toast para notificações
const toast = useToast()

// Se servidor não encontrado, redirecionar para home
watchEffect(() => {
  if (servers.value.length > 0 && !server.value) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Servidor não encontrado'
    })
  }
})

useHead({
  title: computed(() => server.value ? `${server.value.nome} - Detalhes do Servidor` : 'Carregando...')
})

// Carregar instâncias apenas uma vez quando a página for montada
onMounted(async () => {
  // Aguardar os servidores carregarem
  await nextTick()
  
  if (server.value && server.value.serverUrl && server.value.adminToken) {
    console.log('Página do servidor montada, verificando necessidade de buscar instâncias...')
    // Só buscar se realmente não há dados
    if (instancesStore.instances.length === 0) {
      console.log('Nenhuma instância no store, buscando...')
      instancesStore.fetchInstancesIfNeeded(server.value.serverUrl, server.value.adminToken)
    } else {
      console.log('Instâncias já existem no store, pulando busca')
    }
  }
})

// Estados para mostrar/esconder token e controlar cópia
const showToken = ref(false)
const copied = ref(false)

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Erro ao copiar:', err)
  }
}

const copyToken = async () => {
  if (server.value?.adminToken) {
    await copyToClipboard(server.value.adminToken)
    toast.add({
      title: 'Token copiado!',
      description: 'Admin token foi copiado para a área de transferência',
      icon: 'i-lucide-copy',
      color: 'success'
    })
  }
}

const copyServerUrl = async () => {
  if (server.value?.serverUrl) {
    await copyToClipboard(server.value.serverUrl)
    toast.add({
      title: 'URL copiada!',
      description: 'Server URL foi copiada para a área de transferência',
      icon: 'i-lucide-copy',
      color: 'success'
    })
  }
}



// Estado do modal de criar instância
const isCreateInstanceModalOpen = ref(false)

// Estado do modal de webhook global
const isGlobalWebhookModalOpen = ref(false)

// Handler para criar nova instância
const handleCreateInstance = () => {
  if (server.value?.adminToken && server.value?.serverUrl) {
    isCreateInstanceModalOpen.value = true
  } else {
    console.warn('Servidor não possui adminToken ou serverUrl configurados')
  }
}

// Handler para abrir modal de webhook global
const handleOpenGlobalWebhook = () => {
  console.log('🎭 handleOpenGlobalWebhook chamado:', {
    serverExists: !!server.value,
    serverUrl: server.value?.serverUrl,
    hasAdminToken: !!server.value?.adminToken,
    modalCurrentlyOpen: isGlobalWebhookModalOpen.value
  })
  
  if (server.value?.adminToken && server.value?.serverUrl) {
    console.log('🎭 Abrindo modal de webhook global...')
    isGlobalWebhookModalOpen.value = true
    console.log('🎭 Modal state após abertura:', isGlobalWebhookModalOpen.value)
  } else {
    console.warn('❌ Servidor não possui adminToken ou serverUrl configurados', {
      server: server.value,
      adminToken: server.value?.adminToken ? '[EXISTE]' : '[NÃO EXISTE]',
      serverUrl: server.value?.serverUrl
    })
  }
}

// Handler para refresh das instâncias (sempre busca, mesmo se já tem dados)
const handleRefreshInstances = () => {
  if (server.value && server.value.serverUrl && server.value.adminToken) {
    console.log('Refresh manual solicitado, buscando instâncias...')
    instancesStore.fetchInstances(server.value.serverUrl, server.value.adminToken)
  }
}

// Handler para submeter criação de instância
const handleCreateInstanceSubmit = async (instanceData: CreateInstanceRequest) => {
  if (!server.value?.adminToken || !server.value?.serverUrl) {
    toast.add({
      title: 'Erro de configuração',
      description: 'Servidor não possui adminToken ou serverUrl configurados',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  try {
    const result = await instancesStore.createInstance(
      server.value.serverUrl,
      server.value.adminToken,
      instanceData
    )

    if (result.success) {
      // Fechar modal
      isCreateInstanceModalOpen.value = false
      
      // Mostrar notificação de sucesso
      toast.add({
        title: 'Instância criada com sucesso!',
        description: `A instância "${instanceData.name}" foi criada no servidor ${server.value.nome}`,
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    } else {
      // Mostrar erro
      toast.add({
        title: 'Erro ao criar instância',
        description: result.error || 'Ocorreu um erro inesperado',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
  } catch (err) {
    toast.add({
      title: 'Erro inesperado',
      description: 'Ocorreu um erro ao tentar criar a instância',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}
</script>

<template>
  <NuxtLayout name="default-layout">
    <div class="container mx-auto px-4 py-8">
      <!-- Loading state -->
      <div v-if="!server" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Carregando servidor...</p>
        </div>
      </div>

      <!-- Server details -->
      <div v-else>
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ server.nome }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Detalhes e configurações do servidor
          </p>
        </div>

        <!-- Informações do servidor -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <!-- Server URL - Input readonly -->
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Server URL
            </label>
            <div class="relative w-full">
              <UInput
                :model-value="server.serverUrl"
                readonly
                class="w-full pr-12"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                <UButton
                  color="neutral"
                  variant="link"
                  size="xs"
                  :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                  :class="copied ? 'text-success' : ''"
                  class="cursor-pointer"
                  @click="copyServerUrl"
                />
              </div>
            </div>
          </div>

          <!-- Admin Token - Input style readonly -->
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Admin Token
            </label>
            <div class="relative w-full">
              <UInput
                :model-value="showToken ? server.adminToken : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'"
                readonly
                class="w-full pr-20"
                :type="showToken ? 'text' : 'password'"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                <UButton
                  color="neutral"
                  variant="link"
                  size="xs"
                  :icon="showToken ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  class="cursor-pointer"
                  @click="showToken = !showToken"
                />
                <UButton
                  color="neutral"
                  variant="link"
                  size="xs"
                  :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                  :class="copied ? 'text-success' : ''"
                  class="cursor-pointer"
                  @click="copyToken"
                />
              </div>
            </div>
          </div>
        </div>
      

        <!-- Tabela de instâncias -->
        <InstanceTable
          :instances="instancesStore.instances"
          :loading="instancesStore.loading"
          :error="instancesStore.error"
          :server-url="server?.serverUrl"
          :admin-token="server?.adminToken"
          @create-instance="handleCreateInstance"
          @refresh-instances="handleRefreshInstances"
          @open-global-webhook="handleOpenGlobalWebhook"
        />
      </div>
    </div>

    <!-- Modal para criar instância -->
    <CreateInstanceModal
      v-if="server && server.adminToken && server.serverUrl"
      v-model:open="isCreateInstanceModalOpen"
      :admin-token="server.adminToken"
      :server-url="server.serverUrl"
      @submit="handleCreateInstanceSubmit"
    />

    <!-- Modal para webhook global -->
    <GlobalWebhookModal
      v-if="server && server.adminToken && server.serverUrl"
      v-model:open="isGlobalWebhookModalOpen"
      :server-url="server.serverUrl"
      :admin-token="server.adminToken"
    />
  </NuxtLayout>
</template>
