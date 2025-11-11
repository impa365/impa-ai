"use client"

import { useEffect, useState } from "react"

import { AlertCircle, CalendarClock, Clock4, Loader2, RefreshCcw, Timer } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface CronRun {
  id: string
  startedAt: string | null
  finishedAt: string | null
  durationMs: number | null
  success: boolean | null
  dryRun: boolean
  remindersDue: number
  remindersSent: number
  remindersFailed: number
  triggersProcessed: number
  message: string | null
}

interface CronStatusResponse {
  success: boolean
  schedule: string
  timezone: string
  dryRun: boolean
  serverTime: string
  lastRuns: CronRun[]
  nextRuns: string[]
  // 🆕 NOVO: Status do worker
  workerStatus?: {
    isRunning: boolean
    lastRunTime: string | null
    message: string
  }
}

const formatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
})

function formatDate(value: string | null, timezone?: string) {
  if (!value) return "—"
  try {
    const date = new Date(value)
    if (Number.isNaN(date.valueOf())) return value
    return formatter.format(date)
  } catch (error) {
    return value
  }
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null || Number.isNaN(durationMs)) return "—"
  if (durationMs < 1000) return `${durationMs} ms`
  const seconds = Math.round(durationMs / 100) / 10
  if (seconds < 60) return `${seconds.toFixed(1)} s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes} min ${remainingSeconds.toString().padStart(2, "0")} s`
}

export function CronMonitor() {
  const [data, setData] = useState<CronStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/admin/reminders/cron", { cache: "no-store" })
      if (!response.ok) {
        const details = await response.json().catch(() => ({}))
        throw new Error(details?.details ?? `Erro ${response.status}`)
      }
      const payload = (await response.json()) as CronStatusResponse
      setData(payload)
    } catch (err: any) {
      console.error("Erro ao carregar status do cron:", err)
      setError(err?.message ?? "Erro ao carregar status do cron")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const nextRuns = data?.nextRuns ?? []
  const lastRuns = data?.lastRuns ?? []

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Monitor do cron de lembretes</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Visualize o histórico recente do worker e os próximos horários programados. Use esta tela para validar se o cron
                está rodando como esperado.
              </p>
            </div>
          </div>
          <Button onClick={loadData} size="sm" disabled={loading} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {data && (
          <div className="flex flex-wrap gap-4">
            <Card className="flex flex-1 min-w-[220px] flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs uppercase text-slate-400">Agendamento</div>
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <Clock4 className="h-5 w-5 text-indigo-500" />
                {data.schedule}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Timezone: {data.timezone}</div>
            </Card>

            <Card className="flex flex-1 min-w-[220px] flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs uppercase text-slate-400">Modo</div>
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <Timer className="h-5 w-5 text-emerald-500" />
                {data.dryRun ? "Dry run" : "Executando"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Horário atual do servidor: {formatDate(data.serverTime)}</div>
            </Card>
          </div>
        )}
      </div>

      {error && (
        <Card className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertCircle className="h-5 w-5" />
          <div className="text-sm">{error}</div>
        </Card>
      )}

      {data?.workerStatus && !data.workerStatus.isRunning && (
        <Card className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-500/50 dark:bg-red-500/20 dark:text-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <div className="font-semibold">⚠️ Cron Worker Não Está Rodando!</div>
            <div className="mt-1 text-sm">
              {data.workerStatus.message}
              <br />
              <span className="mt-2 inline-block">
                💡 <strong>Solução:</strong> Verifique se o Docker está executando o worker. Execute:
                <br />
                <code className="mt-1 block bg-red-900/20 p-2 font-mono text-xs">
                  docker service logs impa-ai | grep "reminder-cron"
                </code>
              </span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Próximas execuções</h2>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
          </div>
          <div className="space-y-3">
            {nextRuns.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Não foi possível calcular os próximos horários.</p>
            ) : (
              nextRuns.map((run, index) => (
                <div key={`${run}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-800/50">
                  {formatDate(run)}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Últimas execuções</h2>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
          </div>
          <div className="space-y-3">
            {lastRuns.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma execução registrada até o momento.</p>
            ) : (
              lastRuns.map((run) => {
                let statusLabel = "Em execução"
                let badgeClass = "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-200"
                if (run.success === true) {
                  statusLabel = "Sucesso"
                  badgeClass = "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200"
                } else if (run.success === false) {
                  statusLabel = "Falha"
                  badgeClass = "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200"
                }

                return (
                  <div key={run.id} className="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{formatDate(run.startedAt)}</div>
                      <Badge className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}>
                        {statusLabel}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="font-medium text-slate-600 dark:text-slate-300">Duração:</span> {formatDuration(run.durationMs)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-600 dark:text-slate-300">Gatilhos:</span> {run.triggersProcessed}
                      </div>
                      <div>
                        <span className="font-medium text-slate-600 dark:text-slate-300">Agendados:</span> {run.remindersDue}
                      </div>
                      <div>
                        <span className="font-medium text-slate-600 dark:text-slate-300">Enviados:</span> {run.remindersSent}
                      </div>
                      <div>
                        <span className="font-medium text-slate-600 dark:text-slate-300">Falhas:</span> {run.remindersFailed}
                      </div>
                      <div>
                        <span className="font-medium text-slate-600 dark:text-slate-300">Dry run:</span> {run.dryRun ? "Sim" : "Não"}
                      </div>
                    </div>
                    {run.message && (
                      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                        {run.message}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default CronMonitor

