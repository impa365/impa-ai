<script setup lang="ts">
import type { Instance } from '../../shared/types/Instance'
import { useInstancesStore } from '../stores/instances'

// Tipo para a resposta de status
interface StatusResponse {
  instance?: {
    status: string
    qrcode?: string
  }
}

interface Props {
  instance: Instance | null
  serverUrl: string
  adminToken: string
}

const props = defineProps<Props>()

// Props e Emits seguindo padrão v-model
const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  'connection-success': []
}>()

// Estados do componente
const qrCode = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const timeLeft = ref(20)
const timerInterval = ref<NodeJS.Timeout | null>(null)
const statusCheckInterval = ref<NodeJS.Timeout | null>(null)

// Composables
const instancesStore = useInstancesStore()
const toast = useToast()

// Função para iniciar o timer
const startTimer = () => {
  // Limpar timer anterior se existir
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  timeLeft.value = 20
  timerInterval.value = setInterval(() => {
    timeLeft.value--
    
    if (timeLeft.value <= 0) {
      // Timer acabou - remover QR code e parar timer
      clearInterval(timerInterval.value as NodeJS.Timeout)
      timerInterval.value = null
      qrCode.value = null
      toast.add({
        title: 'QR Code expirado',
        description: 'Gere um novo QR code para continuar',
        icon: 'i-lucide-clock',
        color: 'warning'
      })
    }
  }, 1000)
}

// Função para parar o timer
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

// Função para verificar status da conexão
const checkConnectionStatus = async () => {
  if (!props.instance) return

  try {
    const response = await $fetch<StatusResponse>(`${props.serverUrl}/instance/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'token': props.instance.token
      }
    })

    if (response.instance && response.instance.status === 'connected') {
      // Instância conectou!
      stopStatusCheck()
      stopTimer()
      
      toast.add({
        title: 'Conectado com sucesso!',
        description: `A instância "${props.instance.name}" foi conectada`,
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
      
      // Emitir evento de sucesso
      emit('connection-success')
      
      // Fechar modal
      open.value = false
    }
  } catch (err) {
    // Falha silenciosa - continua verificando
    console.debug('Falha ao verificar status (normal durante conexão):', err)
  }
}

// Função para iniciar verificação de status
const startStatusCheck = () => {
  // Verificar a cada 2 segundos se conectou
  statusCheckInterval.value = setInterval(checkConnectionStatus, 2000)
}

// Função para parar verificação de status
const stopStatusCheck = () => {
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value)
    statusCheckInterval.value = null
  }
}

// Função para gerar QR code
const handleGenerateQR = async () => {
  if (!props.instance) return
  
  // Parar timer anterior
  stopTimer()
  
  loading.value = true
  error.value = null
  qrCode.value = null

  try {
    const result = await instancesStore.generateQRCode(props.serverUrl, props.instance.token)
    
    if (result.success && result.qrcode) {
      qrCode.value = result.qrcode
      // Iniciar timer de 20 segundos
      startTimer()
      // Iniciar verificação de status
      startStatusCheck()
    } else {
      error.value = result.error || 'Erro ao gerar QR code'
      toast.add({
        title: 'Erro ao gerar QR code',
        description: result.error || 'Não foi possível gerar o QR code',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
  } catch (err) {
    error.value = 'Erro inesperado ao gerar QR code'
    toast.add({
      title: 'Erro inesperado',
      description: 'Ocorreu um erro ao tentar gerar o QR code',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Resetar estados quando modal abrir/fechar
watch(open, (newValue) => {
  if (newValue) {
    qrCode.value = null
    error.value = null
    loading.value = false
    // Gerar QR code automaticamente quando modal abrir
    nextTick(() => {
      handleGenerateQR()
    })
  } else {
    // Parar timer e verificação de status quando modal fechar
    stopTimer()
    stopStatusCheck()
  }
})

// Limpar timers quando componente for desmontado
onUnmounted(() => {
  stopTimer()
  stopStatusCheck()
})

// Função para tentar novamente
const handleRetry = () => {
  handleGenerateQR()
}
</script>

<template>
  <UModal 
    v-model:open="open"
    :title="`Conectar ${instance?.name || 'Instância'}`"
  >
    <template #body>
      <div class="flex flex-col items-center space-y-6 py-6">
        <!-- Loading State -->
        <div v-if="loading" class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Gerando QR Code...
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Aguarde enquanto preparamos o código de conexão
          </p>
        </div>

        <!-- Error State -->
        <div v-else-if="error && !qrCode" class="text-center">
          <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-error mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Erro ao gerar QR Code
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ error }}
          </p>
          <UButton
            color="primary"
            icon="i-lucide-refresh-cw"
            @click="handleRetry"
          >
            Tentar Novamente
          </UButton>
        </div>

        <!-- Success State - QR Code -->
        <div v-else-if="qrCode" class="text-center w-full max-w-sm">
          <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
            <img 
              :src="qrCode" 
              alt="QR Code para conectar WhatsApp"
              class="w-full h-auto max-w-64 mx-auto"
            />
          </div>
          
          <!-- Timer -->
          <div class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UIcon name="i-lucide-clock" class="w-4 h-4" />
            <span>Expira em {{ timeLeft }}s</span>
          </div>
        </div>

        <!-- Estado quando QR code expirou -->
        <div v-else-if="!loading && !error && !qrCode" class="text-center">
          <UIcon name="i-lucide-clock-x" class="w-12 h-12 text-warning mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            QR Code Expirado
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Gere um novo QR code para conectar
          </p>
          <UButton
            color="primary"
            icon="i-lucide-qr-code"
            @click="handleRetry"
          >
            Gerar Novo QR Code
          </UButton>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-center w-full">
        <UButton
          color="neutral"
          variant="outline"
          @click="open = false"
        >
          Fechar
        </UButton>
      </div>
    </template>
  </UModal>
</template>
