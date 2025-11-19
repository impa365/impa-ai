<script setup lang="ts">
import type { CreateServerRequest } from '../../shared/types/Server'

// Props e Emits seguindo padrão v-model
const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  submit: [data: CreateServerRequest]
}>()

// Estado do formulário
const form = ref<CreateServerRequest>({
  nome: '',
  serverUrl: '',
  adminToken: ''
})

// Estado para mostrar/esconder senha
const showPassword = ref(false)

// Validação
const isFormValid = computed(() => {
  return form.value.nome.trim() !== '' && 
         form.value.serverUrl.trim() !== '' && 
         (form.value.adminToken?.trim() || '') !== ''
})

// Submeter formulário
const handleSubmit = () => {
  if (!isFormValid.value) return
  
  emit('submit', { ...form.value })
  
  // Resetar form e fechar modal
  form.value = {
    nome: '',
    serverUrl: '',
    adminToken: ''
  }
  open.value = false
}

// Resetar form quando modal fechar
watch(open, (newValue) => {
  if (!newValue) {
    form.value = {
      nome: '',
      serverUrl: '',
      adminToken: ''
    }
  }
})
</script>

<template>
  <UModal 
    v-model:open="open"
    title="Adicionar Servidor"
  >
    <template #body>
      <div class="flex flex-col gap-6">
        <!-- Nome do Servidor -->
        <div class="w-full">
          <label class="block text-sm font-medium mb-2">Nome do Servidor *</label>
          <UInput
            v-model="form.nome"
            placeholder="Ex: Servidor Web"
            class="w-full"
          />
        </div>

        <!-- Server URL -->
        <div class="w-full">
          <label class="block text-sm font-medium mb-2">Server URL *</label>
          <UInput
            v-model="form.serverUrl"
            placeholder="https://exemplo.com:8080"
            class="w-full"
          />
        </div>

        <!-- Admin Token -->
        <div class="w-full">
          <label class="block text-sm font-medium mb-2">Admin Token *</label>
          <UInput
            v-model="form.adminToken"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Token de administração"
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
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
          @click="handleSubmit"
          :disabled="!isFormValid"
        >
          Adicionar
        </UButton>
      </div>
    </template>
  </UModal>
</template>
