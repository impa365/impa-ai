<script setup lang="ts">
// Modal genérico de confirmação
interface Props {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'primary' | 'error' | 'warning' | 'success' | 'neutral'
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirmar ação',
  message: 'Tem certeza que deseja continuar?',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  confirmColor: 'primary'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const handleConfirm = () => {
  emit('confirm')
  isOpen.value = false
}

const handleCancel = () => {
  emit('cancel')
  isOpen.value = false
}
</script>

<template>
  <UModal 
    v-model:open="isOpen"
    :title="title"
  >
    <template #body>
      <div class="py-4">
        <div class="flex items-start gap-4" v-if="icon">
          <UIcon :name="icon" class="w-6 h-6 mt-0.5 flex-shrink-0" :class="{
            'text-error': confirmColor === 'error',
            'text-warning': confirmColor === 'warning', 
            'text-success': confirmColor === 'success',
            'text-primary': confirmColor === 'primary'
          }" />
          <p class="text-gray-700 dark:text-gray-300">
            {{ message }}
          </p>
        </div>
        <p v-else class="text-gray-700 dark:text-gray-300">
          {{ message }}
        </p>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex gap-3 justify-end w-full">
        <UButton
          color="neutral"
          variant="ghost"
          @click="handleCancel"
        >
          {{ cancelText }}
        </UButton>
        <UButton
          :color="confirmColor"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
