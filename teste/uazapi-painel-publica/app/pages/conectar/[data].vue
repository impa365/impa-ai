<script setup lang="ts">
// Página para conectar via URL criptografada

import type { Instance } from '../../../shared/types/Instance'

const route = useRoute()
const encryptedData = route.params.data as string

// Composables
const { decodeConnectUrl } = useCrypto()
const toast = useToast()

// Estados
const loading = ref(true)
const error = ref<string | null>(null)
const decodedData = ref<{ token: string, serverUrl: string } | null>(null)
const instance = ref<Instance | null>(null)
const loadingStatus = ref(false)
const isDisconnecting = ref(false)
const showQRModal = ref(false)

// Função para decodificar os dados
const decodeData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const data = await decodeConnectUrl(encryptedData)
    decodedData.value = data
    console.log('Dados descriptografados com sucesso:', data)
    
    // Após descriptografar, verificar status da instância
    await checkInstanceStatus()
  } catch (err) {
    console.error('Erro ao descriptografar:', err)
    error.value = 'Falha ao descriptografar os dados da URL'
  } finally {
    loading.value = false
  }
}

// Função para verificar status da instância
const checkInstanceStatus = async () => {
  if (!decodedData.value) return
  
  loadingStatus.value = true
  
  try {
    const response = await $fetch<{ instance: Instance, status: any }>(`${decodedData.value.serverUrl}/instance/status`, {
      method: 'GET',
      headers: {
        'token': decodedData.value.token
      }
    })
    
    // A API retorna { instance: {...}, status: {...} }
    instance.value = response.instance
    console.log('Status da instância:', response)
  } catch (err: any) {
    console.error('Erro ao buscar status:', err)
    
    // Se der erro 404, a instância pode não existir ainda
    if (err.statusCode === 404) {
      error.value = 'Instância não encontrada'
    }
  } finally {
    loadingStatus.value = false
  }
}

// Função para desconectar instância
const handleDisconnect = async () => {
  if (!decodedData.value || !instance.value) {
    toast.add({
      title: 'Erro',
      description: 'Dados não disponíveis',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  isDisconnecting.value = true

  try {
    await $fetch(`${decodedData.value.serverUrl}/instance/disconnect`, {
      method: 'POST',
      headers: {
        'token': decodedData.value.token
      }
    })

    toast.add({
      title: 'Desconectado com sucesso',
      description: 'A instância foi desconectada',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })

    // Atualizar status
    await checkInstanceStatus()

  } catch (err: any) {
    console.error('Erro ao desconectar:', err)
    toast.add({
      title: 'Erro ao desconectar',
      description: err.data?.message || 'Ocorreu um erro ao desconectar a instância',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isDisconnecting.value = false
  }
}

// Função para abrir modal de QR Code
const handleConnect = () => {
  if (!decodedData.value) {
    toast.add({
      title: 'Erro',
      description: 'Dados não disponíveis',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  showQRModal.value = true
}

// Função chamada quando conectar com sucesso via QR Code
const handleConnectionSuccess = async () => {
  toast.add({
    title: 'Conectado com sucesso!',
    description: 'Sua instância WhatsApp foi conectada',
    icon: 'i-lucide-check-circle',
    color: 'success'
  })
  
  // Recarregar status da instância
  await checkInstanceStatus()
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

// Decodificar ao montar
onMounted(() => {
  decodeData()
})

// Meta tags
useHead({
  title: 'Conectar - UAZAPI',
  meta: [
    {
      name: 'description',
      content: 'Conectar instância via URL segura'
    }
  ]
})
</script>

<template>
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="mb-8 text-center">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Conectar Instância
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Conecte-se à sua instância através de URL segura
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <UIcon name="i-lucide-loader-circle" class="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
            <p class="text-sm text-gray-500 dark:text-gray-400">Descriptografando dados...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-alert-circle" class="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                Erro ao processar URL
              </h3>
              <p class="text-sm text-red-700 dark:text-red-300 mb-4">
                {{ error }}
              </p>
              <p class="text-xs text-red-600 dark:text-red-400">
                Verifique se a URL está correta e não foi corrompida.
              </p>
            </div>
          </div>
        </div>

        <!-- Success State -->
        <div v-else-if="decodedData" class="space-y-6">
          <!-- Loading Status -->
          <div v-if="loadingStatus" class="text-center py-8">
            <UIcon name="i-lucide-loader-circle" class="w-8 h-8 mx-auto mb-3 animate-spin text-primary-500" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Verificando status da instância...
            </p>
          </div>

          <!-- Status e Ações -->
          <div v-else-if="instance" class="space-y-6">
            <!-- Informações do Usuário (quando conectado) -->
            <div v-if="instance.status.toLowerCase() === 'connected'" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
                Informações da Conta
              </h3>
              
              <div class="flex flex-col items-center space-y-4">
                <!-- Foto de Perfil -->
                <UAvatar
                  :src="instance.profilePicUrl || undefined"
                  :alt="instance.profileName || instance.name"
                  size="xl"
                  :icon="!instance.profilePicUrl ? 'i-lucide-user' : undefined"
                />
                
                <!-- Nome do Perfil -->
                <div class="text-center">
                  <p class="text-xl font-semibold text-gray-900 dark:text-white">
                    {{ instance.profileName || instance.name }}
                  </p>
                  <p class="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                    {{ instance.owner }}
                  </p>
                </div>

                <!-- Badge de Status -->
                <UBadge 
                  :color="getStatusColor(instance.status)"
                  variant="subtle"
                  size="lg"
                  class="capitalize"
                >
                  {{ getStatusLabel(instance.status) }}
                </UBadge>

                <!-- Informações Adicionais -->
                <div class="w-full grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div class="text-center">
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Tipo de Conta
                    </p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {{ instance.isBusiness ? 'Business' : 'Personal' }}
                    </p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Plataforma
                    </p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {{ instance.plataform || '-' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Badge de Status (quando não conectado) -->
            <div v-else class="flex justify-center">
              <UBadge 
                :color="getStatusColor(instance.status)"
                variant="subtle"
                size="lg"
                class="capitalize"
              >
                {{ getStatusLabel(instance.status) }}
              </UBadge>
            </div>

            <!-- Botões de Ação -->
            <div class="text-center">
              <!-- Botão Desconectar (quando conectado) -->
              <UButton
                v-if="instance.status.toLowerCase() === 'connected'"
                color="error"
                size="xl"
                icon="i-lucide-power-off"
                :loading="isDisconnecting"
                @click="handleDisconnect"
              >
                {{ isDisconnecting ? 'Desconectando...' : 'Desconectar WhatsApp' }}
              </UButton>

              <!-- Botão Conectar (quando desconectado) -->
              <UButton
                v-else-if="instance.status.toLowerCase() === 'disconnected'"
                color="success"
                size="xl"
                icon="i-lucide-smartphone"
                @click="handleConnect"
              >
                Conectar WhatsApp
              </UButton>

              <!-- Conectando (aguardando) -->
              <div v-else-if="instance.status.toLowerCase() === 'connecting'" class="text-center">
                <UIcon name="i-lucide-loader-circle" class="w-12 h-12 mx-auto mb-3 animate-spin text-warning" />
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Aguardando conexão...
                </p>
              </div>
            </div>
          </div>

          <!-- Instância não encontrada -->
          <div v-else class="text-center py-8">
            <UIcon name="i-lucide-alert-circle" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Não foi possível verificar o status da instância
            </p>
            <UButton
              color="primary"
              icon="i-lucide-refresh-cw"
              @click="checkInstanceStatus"
            >
              Tentar Novamente
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de QR Code -->
    <QRCodeModal
      v-if="decodedData && instance"
      v-model:open="showQRModal"
      :instance="instance"
      :server-url="decodedData.serverUrl"
      :admin-token="decodedData.token"
      @connection-success="handleConnectionSuccess"
    />
</template>
