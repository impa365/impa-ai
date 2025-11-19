<script setup lang="ts">
import type { CreateInstanceRequest, CreateInstanceModalProps } from '../../shared/types/CreateInstance'

// Props
interface Props extends CreateInstanceModalProps {}

const props = defineProps<Props>()

// Props e Emits seguindo padrão v-model
const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  submit: [data: CreateInstanceRequest]
}>()

// Estado do formulário
const form = ref<CreateInstanceRequest>({
  name: '',
  systemName: '',
  adminField01: '',
  adminField02: ''
})

// Validação
const isFormValid = computed(() => {
  return form.value.name.trim() !== ''
})

// Submeter formulário
const handleSubmit = () => {
  if (!isFormValid.value) return
  
  // Preparar dados para envio (remover campos vazios opcionais)
  const submitData: CreateInstanceRequest = {
    name: form.value.name.trim()
  }
  
  if (form.value.systemName?.trim()) {
    submitData.systemName = form.value.systemName.trim()
  }
  
  if (form.value.adminField01?.trim()) {
    submitData.adminField01 = form.value.adminField01.trim()
  }
  
  if (form.value.adminField02?.trim()) {
    submitData.adminField02 = form.value.adminField02.trim()
  }
  
  emit('submit', submitData)
  
  // Resetar form e fechar modal
  resetForm()
  open.value = false
}

// Resetar formulário
const resetForm = () => {
  form.value = {
    name: '',
    systemName: '',
    adminField01: '',
    adminField02: ''
  }
}

// Resetar form quando modal fechar
watch(open, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<template>
  <UModal 
    v-model:open="open"
    title="Criar Nova Instância"
  >
    <template #body>
      <div class="flex flex-col gap-6">
        <!-- Nome da Instância -->
        <div class="w-full">
          <label class="block text-sm font-medium mb-2">
            Nome da Instância *
          </label>
          <UInput
            v-model="form.name"
            placeholder="Ex: minha-instancia"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">
            Nome identificador único para a instância
          </p>
        </div>

        <!-- Nome do Sistema -->
        <div class="w-full">
          <label class="block text-sm font-medium mb-2">
            Nome do Sistema
          </label>
          <UInput
            v-model="form.systemName"
            placeholder="Ex: apilocal (opcional, padrão: uazapiGO)"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">
            Nome do sistema (opcional, padrão será 'uazapiGO')
          </p>
        </div>

        <!-- Campo Administrativo 1 -->
        <div class="w-full">
          <label class="block text-sm font-medium mb-2">
            Campo Administrativo 1
          </label>
          <UInput
            v-model="form.adminField01"
            placeholder="Ex: custom-metadata-1"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">
            Campo para metadados personalizados (opcional)
          </p>
        </div>

        <!-- Campo Administrativo 2 -->
        <div class="w-full">
          <label class="block text-sm font-medium mb-2">
            Campo Administrativo 2
          </label>
          <UInput
            v-model="form.adminField02"
            placeholder="Ex: custom-metadata-2"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">
            Campo para metadados personalizados (opcional)
          </p>
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
          Criar Instância
        </UButton>
      </div>
    </template>
  </UModal>
</template>
