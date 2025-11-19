

<script setup lang="ts">
// Configuração do toaster para posicionar os toasts no topo
const toaster = { 
  position: 'top-right' as const
}
</script>

<template>
  <UApp :toaster="toaster">
    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
