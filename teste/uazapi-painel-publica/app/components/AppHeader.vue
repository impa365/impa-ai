<script setup lang="ts">
// Componente Header da aplicação

// Define os eventos que o componente pode emitir
defineEmits<{
  'open-about': []
}>()
</script>

<template>
  <UHeader class="border-b border-gray-200 dark:border-gray-800">
    <template #left>
      <div class="flex items-center space-x-6">
        <NuxtLink 
          to="/" 
          class="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
        >
          <UIcon name="i-heroicons-home" class="w-6 h-6" />
          <span class="font-bold text-lg">UAZAPI</span>
        </NuxtLink>
        
        <!-- Navegação no desktop -->
        <nav class="hidden md:flex items-center space-x-6">
          <a 
            href="https://docs.uazapi.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center space-x-1"
          >
            <span>Documentação</span>
            <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
          </a>
          
          <button 
            @click="$emit('open-about')"
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center space-x-1"
          >
            <span>Sobre</span>
            <UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
          </button>
        </nav>
      </div>
    </template>

    <template #right>
      <div class="flex items-center space-x-2">
        <!-- Botão de modo escuro -->
        <UColorModeButton />
        
        <!-- Menu mobile -->
        <UButton
          class="md:hidden"
          variant="ghost"
          color="neutral"
          icon="i-heroicons-bars-3"
          aria-label="Menu"
        />
      </div>
    </template>
  </UHeader>
</template>
