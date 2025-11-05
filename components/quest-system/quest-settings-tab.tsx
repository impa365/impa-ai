"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { QuestProvider, useQuestSystem } from '@/hooks/use-quest-system'

function QuestSettingsContent() {
  const { toast } = useToast()
  const { progress, updatePreferences, refreshProgress } = useQuestSystem()
  
  const [questEnabled, setQuestEnabled] = useState(progress?.preferences?.showARIA ?? true)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Sincronizar estado do Quest com preferências
  useEffect(() => {
    if (progress?.preferences) {
      setQuestEnabled(progress.preferences.showARIA ?? true)
    }
  }, [progress])

  // Handler: Toggle Quest System
  const handleQuestToggle = async (enabled: boolean) => {
    try {
      setQuestEnabled(enabled)
      await updatePreferences({ showARIA: enabled })
      toast({
        title: enabled ? "✅ Tutorial ativado!" : "⏸️ Tutorial desativado",
        description: enabled 
          ? "O Quest System está ativo novamente."
          : "O Quest System foi ocultado. Você pode reativá-lo a qualquer momento.",
      })
    } catch (error) {
      console.error('Error toggling quest:', error)
      setQuestEnabled(!enabled) // Reverter
      toast({
        title: "❌ Erro",
        description: "Não foi possível alterar as configurações do tutorial.",
        variant: "destructive"
      })
    }
  }

  // Handler: Reset Quest Progress
  const handleResetProgress = async () => {
    setResetting(true)
    try {
      const response = await fetch('/api/quest-progress/reset', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reset')
      }

      const data = await response.json()
      
      if (data.resetted) {
        await refreshProgress()
        toast({
          title: "🔄 Progresso resetado!",
          description: "Todo o seu progresso do Quest System foi apagado. Você pode começar do zero!",
        })
      } else {
        toast({
          title: "⚠️ Nenhum progresso encontrado",
          description: "Não havia progresso para resetar.",
        })
      }

      setResetDialogOpen(false)
    } catch (error) {
      console.error('Error resetting progress:', error)
      toast({
        title: "❌ Erro ao resetar",
        description: "Não foi possível resetar o progresso. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          🎮 Academia de Exploradores IMPA
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie as configurações do sistema de tutorial gamificado
        </p>
      </div>

      <div className="space-y-6">
        {/* Status do Progresso */}
        {progress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📊</span>
                Seu Progresso Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {progress.currentLevel}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Nível</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {progress.totalXP}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">XP Total</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {progress.completedMissions?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Missões Completas</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {progress.unlockedBadges?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Badges Desbloqueados</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⚙️</span>
              Configurações do Tutorial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle Ativar/Desativar */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Sistema de Tutorial Ativo
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ative ou desative o Quest System (FAB e painel de missões)
                </p>
              </div>
              <Switch
                checked={questEnabled}
                onCheckedChange={handleQuestToggle}
                className="ml-4"
              />
            </div>

            {/* Botão de Reset */}
            <div className="p-4 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1 flex items-center gap-2">
                    <span>⚠️</span>
                    Resetar Progresso do Tutorial
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    Esta ação irá <strong>apagar TODOS os dados do Quest System</strong>: XP, níveis, missões completadas, badges desbloqueados e progresso atual. Você voltará ao estado inicial.
                  </p>
                  <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside mb-4">
                    <li>XP será zerado</li>
                    <li>Nível voltará para 1</li>
                    <li>Todas as missões serão marcadas como não completadas</li>
                    <li>Todos os badges serão removidos</li>
                    <li>Estatísticas serão zeradas</li>
                  </ul>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setResetDialogOpen(true)}
                className="w-full"
              >
                🔄 Resetar Todo o Progresso
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Reset */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <span>⚠️</span>
              Confirmar Reset do Progresso
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <div className="font-semibold">
                  Tem certeza que deseja resetar TODO o seu progresso do Quest System?
                </div>
                <div>
                  Esta ação é <strong className="text-red-600">IRREVERSÍVEL</strong> e irá apagar:
                </div>
                <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                  <li>Todos os {progress?.totalXP || 0} XP acumulados</li>
                  <li>Nível atual ({progress?.currentLevel || 1})</li>
                  <li>{progress?.completedMissions?.length || 0} missões completadas</li>
                  <li>{progress?.unlockedBadges?.length || 0} badges desbloqueados</li>
                  <li>Todas as estatísticas e conquistas</li>
                </ul>
                <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                  ⚠️ Não será possível desfazer esta ação!
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              disabled={resetting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetProgress}
              disabled={resetting}
            >
              {resetting ? "Resetando..." : "Sim, Resetar Tudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Componente principal exportado com Provider próprio
 * Isso garante que o hook useQuestSystem funcione mesmo fora do layout raiz
 */
export function QuestSettingsTab() {
  return (
    <QuestProvider>
      <QuestSettingsContent />
    </QuestProvider>
  )
}

