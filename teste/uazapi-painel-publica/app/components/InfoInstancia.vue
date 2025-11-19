<script setup lang="ts">
import type { Instance } from '../../shared/types/Instance'
import { useInstancesStore } from '../stores/instances'
import { useInstanciaAtualStore } from '../stores/instanciaAtual'

// Props
interface Props {
  instance: Instance
  serverUrl?: string | null
  adminToken?: string | null
}

const props = defineProps<Props>()

// Stores
const instancesStore = useInstancesStore()
const instanciaAtualStore = useInstanciaAtualStore()

// Composables
const toast = useToast()
const router = useRouter()
const { generateConnectUrl } = useCrypto()

// Estados dos campos administrativos
const adminField01 = ref(props.instance.adminField01 || '')
const adminField02 = ref(props.instance.adminField02 || '')
const isSaving = ref(false)

// Estados para URL do cliente
const clientUrl = ref<string | null>(null)
const isGeneratingUrl = ref(false)

// Gerar URL automaticamente ao montar o componente
onMounted(async () => {
  if (props.serverUrl) {
    isGeneratingUrl.value = true
    try {
      clientUrl.value = await generateConnectUrl(props.instance.token, props.serverUrl)
    } catch (error) {
      console.error('Erro ao gerar URL do cliente:', error)
    } finally {
      isGeneratingUrl.value = false
    }
  }
})

// Também regenerar se o serverUrl ou token mudar
watch(() => [props.serverUrl, props.instance.token], async () => {
  if (props.serverUrl) {
    isGeneratingUrl.value = true
    try {
      clientUrl.value = await generateConnectUrl(props.instance.token, props.serverUrl)
    } catch (error) {
      console.error('Erro ao gerar URL do cliente:', error)
    } finally {
      isGeneratingUrl.value = false
    }
  }
})

// Estados para deletar instância
const showDeleteConfirmation = ref(false)
const isDeleting = ref(false)

// Função para formatar data
function formatDate(dateString: string | undefined) {
  if (!dateString) return null
  const date = new Date(dateString)
  return {
    date: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
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

// Função para copiar token
async function copyToken() {
  try {
    await navigator.clipboard.writeText(props.instance.token)
    toast.add({
      title: 'Token copiado!',
      description: `Token da instância ${props.instance.name} copiado para a área de transferência`,
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Erro ao copiar',
      description: 'Não foi possível copiar o token para a área de transferência',
      icon: 'i-lucide-alert-circle',
      color: 'error'  
    })
  }
}

// Função para copiar URL do cliente
async function copyClientUrl() {
  if (!clientUrl.value) return

  try {
    await navigator.clipboard.writeText(clientUrl.value)
    toast.add({
      title: 'URL copiada!',
      description: 'URL de acesso copiada para a área de transferência',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Erro ao copiar',
      description: 'Não foi possível copiar a URL para a área de transferência',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Função para salvar campos administrativos
async function saveAdminFields() {
  if (!props.serverUrl || !props.adminToken) {
    toast.add({
      title: 'Erro de configuração',
      description: 'Server URL ou Admin Token não fornecidos',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  isSaving.value = true

  try {
    const result = await instancesStore.updateAdminFields(
      props.serverUrl,
      props.adminToken,
      props.instance.id,
      adminField01.value,
      adminField02.value
    )

    if (result.success) {
      // Atualizar a instância no store principal de instâncias
      const updatedInstance = {
        ...props.instance,
        adminField01: adminField01.value,
        adminField02: adminField02.value
      }
      
      instancesStore.updateInstance(updatedInstance)
      
      // Atualizar também o store da instância atual
      instanciaAtualStore.setInstancia(updatedInstance)

      toast.add({
        title: 'Campos salvos!',
        description: 'Os campos administrativos foram atualizados com sucesso',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    } else {
      toast.add({
        title: 'Erro ao salvar',
        description: result.error || 'Ocorreu um erro ao salvar os campos',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
  } catch (error) {
    toast.add({
      title: 'Erro inesperado',
      description: 'Ocorreu um erro inesperado ao salvar os campos',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// Verificar se os campos foram alterados
const hasChanges = computed(() => {
  return adminField01.value !== (props.instance.adminField01 || '') ||
         adminField02.value !== (props.instance.adminField02 || '')
})

// Função para abrir modal de confirmação de exclusão
const handleDeleteClick = () => {
  showDeleteConfirmation.value = true
}

// Função para deletar instância
const handleDeleteInstance = async () => {
  if (!props.serverUrl || !props.adminToken) {
    toast.add({
      title: 'Erro de configuração',
      description: 'Server URL ou Admin Token não fornecidos',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  isDeleting.value = true

  try {
    const result = await instancesStore.deleteInstance(
      props.serverUrl,
      props.instance.token,
      props.instance.id
    )

    if (result.success) {
      toast.add({
        title: 'Instância deletada!',
        description: `A instância ${props.instance.name} foi deletada com sucesso`,
        icon: 'i-lucide-check-circle',
        color: 'success'
      })

      // Limpar instância atual do store
      instanciaAtualStore.clearInstancia()

      // Aguardar um pouco para o usuário ver a notificação
      setTimeout(() => {
        // Voltar para a página anterior (provavelmente a página do servidor)
        if (window.history.length > 1) {
          router.back()
        } else {
          // Se não há histórico, vai para a página inicial
          router.push('/')
        }
      }, 1500)

    } else {
      toast.add({
        title: 'Erro ao deletar',
        description: result.error || 'Ocorreu um erro ao deletar a instância',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      isDeleting.value = false
    }
  } catch (error) {
    toast.add({
      title: 'Erro inesperado',
      description: 'Ocorreu um erro inesperado ao deletar a instância',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- URL do Cliente -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          URL de Acesso do Cliente
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Envie esta URL para o cliente gerar o QR Code sem precisar de login e senha
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isGeneratingUrl" class="text-center py-8">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 mx-auto mb-3 animate-spin text-primary-500" />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Gerando URL criptografada...
        </p>
      </div>

      <!-- URL Gerada -->
      <div v-else-if="clientUrl" class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <code class="flex-1 text-xs font-mono text-gray-900 dark:text-white break-all">
            {{ clientUrl }}
          </code>
          <UButton
            color="primary"
            variant="outline"
            size="xs"
            icon="i-lucide-copy"
            @click="copyClientUrl"
          >
            Copiar
          </UButton>
        </div>

        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div class="flex-1">
              <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Acesso Seguro sem Login
              </h4>
              <p class="text-xs text-blue-700 dark:text-blue-300">
                Esta URL criptografada permite que o cliente gere o QR Code para conectar o WhatsApp <strong>sem precisar de login e senha</strong>. 
                Os dados são protegidos com AES-GCM, garantindo segurança total na transmissão.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-8">
        <UIcon name="i-lucide-alert-circle" class="w-8 h-8 mx-auto mb-3 text-gray-400" />
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Não foi possível gerar a URL de acesso
        </p>
      </div>
    </div>
    
    <!-- Informações Básicas -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Informações Básicas
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Número
          </label>
          <p class="mt-1 text-sm font-mono text-gray-900 dark:text-white">
            {{ instance.owner }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Nome da Instância
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ instance.name }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Nome do Perfil
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ instance.profileName || '-' }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Tipo de Conta
          </label>
          <div class="mt-1">
            <UBadge 
              :color="instance.isBusiness ? 'primary' : 'neutral'"
              variant="subtle"
            >
              {{ instance.isBusiness ? 'Business' : 'Personal' }}
            </UBadge>
          </div>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Plataforma
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ instance.plataform || '-' }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Status
          </label>
          <div class="mt-1">
            <UBadge 
              :color="getStatusColor(instance.status)"
              variant="subtle"
              class="capitalize"
            >
              {{ getStatusLabel(instance.status) }}
            </UBadge>
          </div>
        </div>
      </div>
    </div>

    <!-- Datas -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Histórico de Conexão
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Criada em
          </label>
          <div class="mt-1" v-if="formatDate(instance.created)">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatDate(instance.created)?.date }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(instance.created)?.time }}
            </p>
          </div>
          <p v-else class="mt-1 text-sm text-gray-500 dark:text-gray-400">-</p>
        </div>
        <div v-if="instance.lastDisconnect">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Última Desconexão
          </label>
          <div class="mt-1" v-if="formatDate(instance.lastDisconnect)">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatDate(instance.lastDisconnect)?.date }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(instance.lastDisconnect)?.time }}
            </p>
          </div>
          <p v-else class="mt-1 text-sm text-gray-500 dark:text-gray-400">-</p>
        </div>
      </div>
      
      <div v-if="instance.lastDisconnectReason" class="mt-4">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Motivo da Última Desconexão
        </label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">
          {{ instance.lastDisconnectReason }}
        </p>
      </div>
    </div>

    <!-- Campos Administrativos -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Campos Administrativos
      </h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Campo Administrativo 1
          </label>
          <UInput
            v-model="adminField01"
            placeholder="Digite o valor do campo 1..."
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Campo Administrativo 2
          </label>
          <UInput
            v-model="adminField02"
            placeholder="Digite o valor do campo 2..."
            class="w-full"
          />
        </div>
        <div class="flex justify-end">
          <UButton
            color="primary"
            icon="i-lucide-save"
            :loading="isSaving"
            :disabled="!hasChanges"
            @click="saveAdminFields"
          >
            {{ isSaving ? 'Salvando...' : 'Salvar Dados' }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Token -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Token de Acesso
      </h3>
      <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <code class="flex-1 text-xs font-mono text-gray-900 dark:text-white break-all">
          {{ instance.token }}
        </code>
        <UButton
          color="neutral"
          variant="outline"
          size="xs"
          icon="i-lucide-copy"
          @click="copyToken"
        >
          Copiar
        </UButton>
      </div>
    </div>

    <!-- Área de Perigo -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6">
      <h3 class="text-lg font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
        <UIcon name="i-lucide-alert-triangle" class="w-5 h-5" />
        Área de Perigo
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Ações irreversíveis que afetam permanentemente esta instância.
      </p>
      <UButton
        color="error"
        icon="i-lucide-trash-2"
        :loading="isDeleting"
        @click="handleDeleteClick"
      >
        {{ isDeleting ? 'Deletando...' : 'Deletar Instância' }}
      </UButton>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <ConfirmationModal
      v-model:open="showDeleteConfirmation"
      title="Deletar Instância"
      :message="`Tem certeza que deseja deletar a instância '${instance.name}'? Esta ação não pode ser desfeita.`"
      confirm-text="Deletar"
      cancel-text="Cancelar"
      confirm-color="error"
      icon="i-lucide-alert-triangle"
      @confirm="handleDeleteInstance"
    />
  </div>
</template>
