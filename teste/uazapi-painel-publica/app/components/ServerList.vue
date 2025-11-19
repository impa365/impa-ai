<script setup lang="ts">
// Componente para listar servidores
import type { Server } from '../../shared/types/Server'

interface Props {
  servers: Server[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  deleteServer: [serverId: string]
  viewDetails: [server: Server]
}>()

const handleDelete = (serverId: string) => {
  emit('deleteServer', serverId)
}

const handleDetails = (server: Server) => {
  emit('viewDetails', server)
}

const handleCardClick = (server: Server) => {
  // Resetar o store de instâncias antes de navegar
  const instancesStore = useInstancesStore()
  instancesStore.clearInstances()
  
  // Navegar para a página do servidor
  navigateTo(`/servidor/${server.id}`)
}

// Estados para mostrar/esconder tokens
const visibleTokens = ref<Record<string, boolean>>({})

const toggleTokenVisibility = (serverId: string) => {
  visibleTokens.value[serverId] = !visibleTokens.value[serverId]
}
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <UCard class="p-6">
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Empty state -->
    <div 
      v-else-if="!servers.length" 
      class="text-center py-12"
    >
      <UIcon 
        name="i-heroicons-server" 
        class="w-16 h-16 text-gray-400 mx-auto mb-4" 
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Nenhum servidor encontrado
      </h3>
      <p class="text-gray-600 dark:text-gray-400">
        Adicione seu primeiro servidor para começar
      </p>
    </div>

    <!-- Servers grid -->
    <div 
      v-else 
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <UCard 
        v-for="server in servers" 
        :key="server.id" 
        class="p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
        @click="handleCardClick(server)"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold truncate">
              {{ server.nome }}
            </h3>
          </div>
        </template>
        
        <div class="space-y-3">
          <div class="space-y-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">Server URL:</span>
            </p>
            <p class="text-sm text-blue-600 dark:text-blue-400 font-mono break-all">
              {{ server.serverUrl }}
            </p>
          </div>
          
          <div class="space-y-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">Admin Token:</span>
            </p>
            <div class="flex items-start gap-2">
              <p class="text-sm text-gray-500 dark:text-gray-400 font-mono flex-1 min-w-0 break-all">
                {{ visibleTokens[server.id] ? server.adminToken : '••••••••••••••••' }}
              </p>
              <UButton
                v-if="server.adminToken"
                color="neutral"
                variant="link"
                size="xs"
                :icon="visibleTokens[server.id] ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                class="cursor-pointer flex-shrink-0"
                @click.stop="toggleTokenVisibility(server.id)"
              />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton 
              size="sm" 
              color="error" 
              variant="ghost"
              icon="i-lucide-trash-2"
              class="cursor-pointer"
              @click.stop="handleDelete(server.id)"
            >
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
