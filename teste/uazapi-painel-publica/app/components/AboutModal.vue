<script setup lang="ts">
// Modal Sobre o sistema

// Props e Emits seguindo padrão v-model
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <UModal 
    v-model:open="open"
    title="Sobre o Sistema"
    description="Informações sobre o painel UAZAPI"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Descrição principal -->
        <div class="space-y-4">
          <p class="text-gray-700 dark:text-gray-300">
            Este painel foi desenvolvido pela <strong>Data7 Apps</strong>, sob autoria de <strong>Israel Henrique</strong>.
          </p>
          
          <p class="text-gray-700 dark:text-gray-300">
            Ele foi criado para gerenciar instâncias do UAZAPI de forma simples, leve e segura.
          </p>
          
          <p class="text-gray-700 dark:text-gray-300">
            O sistema funciona <strong>100% no lado do cliente</strong>, ou seja, nenhum dado é armazenado em servidores externos.
            Ao cadastrar seus servidores, as informações são salvas localmente nos cookies do navegador, garantindo total privacidade e acesso exclusivo a você.
          </p>
          
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-yellow-500 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>⚠️ Atenção:</strong> Se os cookies do navegador forem apagados, os dados cadastrados serão perdidos e será necessário inseri-los novamente.
              </p>
            </div>
          </div>
        </div>

        <!-- Código fonte aberto -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Código-Fonte Aberto
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            O código-fonte deste painel é livre e aberto, podendo ser utilizado, estudado e modificado por qualquer pessoa.
          </p>
          <a 
            href="https://github.com/IsraelHenriquee/uazapi-painel"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors mb-4"
          >
            <UIcon name="i-lucide-github" class="w-4 h-4" />
            <span class="font-medium">🔗 github.com/IsraelHenriquee/uazapi-painel</span>
            <UIcon name="i-lucide-external-link" class="w-3 h-3" />
          </a>
        </div>

        <!-- Criado com IA -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Criado com Inteligência Artificial 🤖
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            Este painel foi criado 100% com o auxílio de Inteligência Artificial, explorando o poder das novas ferramentas de desenvolvimento assistido por IA.
          </p>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            Se você quiser aprender mais sobre como criar sistemas e automações inteligentes como este, acesse o canal oficial no YouTube:
          </p>
          <a 
            href="https://www.youtube.com/@data7apps"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            <UIcon name="i-lucide-youtube" class="w-4 h-4" />
            <span class="font-medium">🎥 youtube.com/@data7apps</span>
            <UIcon name="i-lucide-external-link" class="w-3 h-3" />
          </a>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex gap-3 justify-end w-full">
        <UButton
          color="primary"
          @click="close"
        >
          Fechar
        </UButton>
      </div>
    </template>
  </UModal>
</template>
