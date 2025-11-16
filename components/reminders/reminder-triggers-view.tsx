"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Filter, Pencil, Trash2, Zap } from "lucide-react"

type Scope = "user" | "admin"

interface ReminderTriggersViewProps {
  scope?: Scope
}

interface AgentSummary {
  id: string
  name: string
  owner?: string | null
  calendar_provider?: string | null
  calendar_api_version?: string | null
  calendar_api_url?: string | null
  calendar_meeting_id?: string | null
  timeZone?: string | null
}

type ReminderActionType = "webhook" | "whatsapp_message"
type MessageChannel = "participant" | "custom"

interface WhatsappMessageActionPayload {
  version?: number
  channel?: MessageChannel
  customNumber?: string | null
  templateId?: string | null
  templateText?: string | null
}

type TimezoneInfo = {
  formatted: string | null
  offsetLabel: string | null
  timeZone: string | null
}
function normalizeOffsetLabel(rawLabel: string | null | undefined): string | null {
  if (!rawLabel) return null
  const trimmed = rawLabel.trim()
  if (!trimmed) return null

  if (/^UTC/i.test(trimmed)) {
    const normalized = trimmed.toUpperCase().replace(/\s+/g, "")
    const match = normalized.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/)
    if (match) {
      const [, sign, hours, minutes] = match
      return `UTC${sign}${hours.padStart(2, "0")}:${(minutes ?? "00").padStart(2, "0")}`
    }
    return normalized
  }

  const match = trimmed.match(/GMT([+-]?)(\d{1,2})(?::(\d{2}))?/)
  if (match) {
    const sign = match[1] && match[1] !== "" ? match[1] : "+"
    const hours = match[2]?.padStart(2, "0") ?? "00"
    const minutes = match[3]?.padStart(2, "0") ?? "00"
    if (sign === "+" || sign === "-") {
      return `UTC${sign}${hours}:${minutes}`
    }
    return `UTC+${hours}:${minutes}`
  }

  if (/^GMT$/i.test(trimmed)) {
    return "UTC+00:00"
  }

  return trimmed
}

function formatDateTimeWithOffset(value: string, timeZone?: string | null) {
  const fallbackTz = "America/Sao_Paulo"
  const zone = timeZone && timeZone.trim().length > 0 ? timeZone : fallbackTz
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return { formatted: value, offsetLabel: null as string | null, timeZone: zone }
  }

  const build = (targetZone: string) => {
    try {
      const formatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: targetZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "shortOffset",
      })
      const parts = formatter.formatToParts(date)
      const map = parts.reduce<Record<string, string>>((acc, part) => {
        if (part.type !== "literal") {
          acc[part.type] = part.value
        }
        return acc
      }, {})
      if (!map.day || !map.month || !map.year || !map.hour || !map.minute) {
        return null
      }
      const formatted = `${map.day}/${map.month}/${map.year} ${map.hour}:${map.minute}`
      const offsetRaw = parts.find((part) => part.type === "timeZoneName")?.value ?? null
      const offsetLabel = normalizeOffsetLabel(offsetRaw)
      return { formatted, offsetLabel, timeZone: targetZone }
    } catch (error) {
      return null
    }
  }

  const primary = build(zone)
  if (primary) {
    return primary
  }

  if (zone !== fallbackTz) {
    const fallback = build(fallbackTz)
    if (fallback) {
      return fallback
    }
  }

  return { formatted: value, offsetLabel: null, timeZone: zone }
}

function extractBookingTimeZone(raw: any): string | null {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const priorityLists: Array<string | undefined> = [
    raw?.eventType?.timeZone,
    raw?.eventType?.timezone,
    raw?.user?.timeZone,
    raw?.user?.timezone,
    raw?.calendar?.timeZone,
    raw?.calendar?.timezone,
    raw.timeZone,
    raw.timezone,
    raw.attendeeTimeZone,
    raw?.attendees?.[0]?.timeZone,
    raw?.attendees?.[0]?.timezone,
    raw?.responses?.timeZone,
    raw?.responses?.timezone,
  ]

  for (const candidate of priorityLists) {
    if (candidate && typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return null
}

const MESSAGE_VARIABLES: Array<{ key: string; label: string }> = [
  { key: "participantName", label: "Nome do participante" },
  { key: "organizerName", label: "Nome do organizador" },
  { key: "participantFirstName", label: "Primeiro nome do participante" },
  { key: "organizerFirstName", label: "Primeiro nome do organizador" },
  { key: "eventName", label: "Nome do evento" },
  { key: "eventDateTime", label: "Data do evento completo" },
  { key: "eventDate", label: "Data do evento" },
  { key: "eventStartTime", label: "Hora de início do evento" },
  { key: "eventEndTime", label: "Hora de fim do evento" },
  { key: "eventTimeZone", label: "Fuso horário do evento" },
  { key: "eventLocation", label: "Local do evento" },
  { key: "eventLink", label: "Link do evento" },
  { key: "organizerEmail", label: "Email organizador" },
  { key: "participantEmail", label: "Email participante" },
  { key: "participantPhone", label: "Telefone participante" },
  { key: "eventId", label: "ID do evento" },
]

type WhatsappTemplateDefinition = {
  id: string
  label: string
  description: string
  content: string
}

const WHATSAPP_MESSAGE_TEMPLATES: WhatsappTemplateDefinition[] = [
  {
    id: "reminder-basic",
    label: "Lembrete padrão",
    description: "Mensagem amigável com data, horário e link do evento (se disponível).",
    content:
      "Olá {{participantFirstName}}, aqui é {{organizerName}}.\n" +
      "Lembrando que o evento {{eventName}} acontece em {{eventDateTime}} ({{eventTimeZone}}).\n" +
      "Local: {{eventLocation}}\n" +
      "Link: {{eventLink}}\n" +
      "Qualquer dúvida estou à disposição!",
  },
  {
    id: "reminder-short",
    label: "Resumo curto",
    description: "Mensagem objetiva apenas com data, horário e link.",
    content:
      "Oi {{participantFirstName}}, seu encontro {{eventName}} começa em breve: {{eventDateTime}} ({{eventTimeZone}}).\n" +
      "Link: {{eventLink}}\n" +
      "Até lá!",
  },
]

const DEFAULT_WHATSAPP_TEMPLATE_ID = "reminder-basic"
const DEFAULT_WHATSAPP_TEMPLATE_CONTENT =
  WHATSAPP_MESSAGE_TEMPLATES.find((template) => template.id === DEFAULT_WHATSAPP_TEMPLATE_ID)?.content ?? ""

const findWhatsappTemplateById = (id: string | null | undefined) =>
  WHATSAPP_MESSAGE_TEMPLATES.find((template) => template.id === id) ?? null

const detectTemplateIdByContent = (content: string) => {
  const trimmed = content.trim()
  const match = WHATSAPP_MESSAGE_TEMPLATES.find(
    (template) => template.content.trim() === trimmed,
  )
  return match ? match.id : "custom"
}

const sanitizePhoneNumber = (value: string) => value.replace(/\D+/g, "")

interface TriggerFormState {
  timingType: string
  offsetAmount: number
  offsetUnit: "minutes" | "hours" | "days"
  scopeReference: string
  actionType: ReminderActionType
  webhookUrl: string
  isActive: boolean
  messageChannel: MessageChannel
  messageCustomNumber: string
  messageTemplateId: string
  messageTemplateText: string
}

const createInitialFormState = (overrides: Partial<TriggerFormState> = {}): TriggerFormState => ({
  timingType: "before_event_start",
  offsetAmount: 24,
  offsetUnit: "hours",
  scopeReference: "",
  actionType: "webhook",
  webhookUrl: "",
  isActive: true,
  messageChannel: "participant",
  messageCustomNumber: "",
  messageTemplateId: DEFAULT_WHATSAPP_TEMPLATE_ID,
  messageTemplateText: DEFAULT_WHATSAPP_TEMPLATE_CONTENT,
  ...overrides,
})

interface ReminderTrigger {
  id: string
  agent_id: string
  timing_type: string
  offset_amount: number
  offset_unit: "minutes" | "hours" | "days"
  scope_type: "agent" | "calendar" | "event_type"
  scope_reference?: string | null
  action_type: ReminderActionType
  webhook_url: string | null
  action_payload?: WhatsappMessageActionPayload | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const OFFSET_UNIT_LABEL: Record<"minutes" | "hours" | "days", string> = {
  minutes: "minutos",
  hours: "horas",
  days: "dias",
}

export function ReminderTriggersView({ scope = "user" }: ReminderTriggersViewProps) {
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [loadingAgents, setLoadingAgents] = useState(false)

  const [triggers, setTriggers] = useState<ReminderTrigger[]>([])
  const [loadingTriggers, setLoadingTriggers] = useState(false)
  const [triggerError, setTriggerError] = useState<string | null>(null)

  const [isTriggerDialogOpen, setIsTriggerDialogOpen] = useState(false)
  const [savingTrigger, setSavingTrigger] = useState(false)
  const [editingTrigger, setEditingTrigger] = useState<ReminderTrigger | null>(null)
  const [formData, setFormData] = useState<TriggerFormState>(() => createInitialFormState())
  const messageTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const handleInsertVariable = useCallback((variableKey: string) => {
    const placeholder = `{{${variableKey}}}`
    const textarea = messageTextareaRef.current

    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        messageTemplateId: "custom",
        messageTemplateText: `${prev.messageTemplateText}${placeholder}`,
      }))
      return
    }

    const { selectionStart, selectionEnd } = textarea

    setFormData((prev) => {
      const current = prev.messageTemplateText ?? ""
      const nextText =
        current.slice(0, selectionStart) + placeholder + current.slice(selectionEnd ?? selectionStart)

      requestAnimationFrame(() => {
        const target = messageTextareaRef.current
        if (!target) {
          return
        }
        const cursor = selectionStart + placeholder.length
        target.focus()
        target.setSelectionRange(cursor, cursor)
      })

      return {
        ...prev,
        messageTemplateId: "custom",
        messageTemplateText: nextText,
      }
    })
  }, [])
  const [deletingTriggerId, setDeletingTriggerId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [triggerPendingDelete, setTriggerPendingDelete] = useState<ReminderTrigger | null>(null)
  const [eventTypeTimeZones, setEventTypeTimeZones] = useState<Record<string, TimezoneInfo>>({})

  const storageKey = useMemo(() => `reminderTriggers:selectedAgent:${scope}`, [scope])

  const fetchAgents = useCallback(async () => {
    try {
      setLoadingAgents(true)
      const endpoint = scope === "admin" ? "/api/admin/agents" : "/api/user/agents"
      const response = await fetch(endpoint, { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Falha ao carregar agentes (${response.status})`)
      }

      const payload = await response.json()
      const items: AgentSummary[] = Array.isArray(payload?.agents)
        ? payload.agents.map((agent: any) => ({
            id: String(agent.id),
            name: agent.name ?? "Agente sem nome",
            owner:
              scope === "admin"
                ? agent?.user_profiles?.full_name ?? agent?.user_profiles?.email ?? null
                : null,
            calendar_provider: agent.calendar_provider,
            calendar_api_version: agent.calendar_api_version,
            calendar_api_url: agent.calendar_api_url,
            calendar_meeting_id: agent.calendar_meeting_id,
            timeZone:
              agent?.working_hours?.timezone ??
              agent?.calendar_time_zone ??
              agent?.calendar_timezone ??
              agent?.timezone ??
              null,
          }))
        : []

      setAgents(items)
      let nextSelected: string | null = null
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(storageKey)
        if (stored && items.some((agent) => agent.id === stored)) {
          nextSelected = stored
        }
      }
      if (!nextSelected && items.length > 0) {
        nextSelected = items[0].id
      }
      setSelectedAgent(nextSelected)
      if (typeof window !== "undefined") {
        if (nextSelected) {
          window.localStorage.setItem(storageKey, nextSelected)
        } else {
          window.localStorage.removeItem(storageKey)
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar agentes:", error)
      setTriggerError(error?.message ?? "Erro desconhecido ao carregar agentes")
    } finally {
      setLoadingAgents(false)
    }
  }, [scope, storageKey])
  const handleSelectAgent = useCallback(
    (value: string) => {
      setSelectedAgent(value)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, value)
      }
    },
    [storageKey],
  )

  const fetchTriggers = useCallback(
    async (agentId: string) => {
      try {
        setLoadingTriggers(true)
        setTriggerError(null)

        const response = await fetch(`/api/${scope}/agents/${agentId}/reminder-triggers`, {
          cache: "no-store",
        })

        if (!response.ok) {
          const details = await response.json().catch(() => ({}))
          throw new Error(details?.details || details?.error || `Erro ${response.status}`)
        }

        const payload = await response.json()
        const items: ReminderTrigger[] = Array.isArray(payload?.triggers) ? payload.triggers : []
        setTriggers(items)
      } catch (err: any) {
        console.error("Erro ao carregar gatilhos:", err)
        setTriggerError(err?.message ?? "Erro desconhecido ao carregar gatilhos")
        setTriggers([])
      } finally {
        setLoadingTriggers(false)
      }
    },
    [scope],
  )

  const handleOpenCreateDialog = useCallback(() => {
    if (!selectedAgent) {
      setTriggerError("Selecione um agente para criar gatilhos")
      return
    }

    const agent = agents.find((item) => item.id === selectedAgent)

    setTriggerError(null)
    setEditingTrigger(null)
    setFormData(
      createInitialFormState({
        scopeReference: agent?.calendar_meeting_id ?? "",
      }),
    )
    setIsTriggerDialogOpen(true)
  }, [agents, selectedAgent])

  const handleSubmitTrigger = useCallback(async () => {
    if (!selectedAgent) {
      setTriggerError("Selecione um agente para salvar gatilhos")
      return
    }

    try {
      setSavingTrigger(true)
      setTriggerError(null)

      const offsetAmountNumber = Number(formData.offsetAmount)
      if (!Number.isFinite(offsetAmountNumber) || offsetAmountNumber < 0) {
        setTriggerError("Informe um offset válido")
        return
      }

      const normalizedScopeReference = formData.scopeReference?.trim() || null
      if (!normalizedScopeReference) {
        setTriggerError("O agente selecionado não possui um eventTypeId configurado")
        return
      }

      const basePayload: any = {
        timingType: formData.timingType,
        offsetAmount: offsetAmountNumber,
        offsetUnit: formData.offsetUnit,
        scopeReference: normalizedScopeReference,
        isActive: formData.isActive,
        actionType: formData.actionType,
      }

      if (formData.actionType === "webhook") {
        const url = formData.webhookUrl.trim()
        if (!url) {
          setTriggerError("Informe a URL do webhook")
          return
        }

        basePayload.webhookUrl = url
      } else {
        const templateTextTrimmed = formData.messageTemplateText.trim()
        if (!templateTextTrimmed) {
          setTriggerError("Informe o conteúdo da mensagem que será enviada no WhatsApp")
          return
        }

        const normalizedCustomNumber =
          formData.messageChannel === "custom"
            ? sanitizePhoneNumber(formData.messageCustomNumber)
            : null

        if (formData.messageChannel === "custom" && !normalizedCustomNumber) {
          setTriggerError(
            "Informe o número no formato internacional sem o símbolo + (ex: 5511999999999)",
          )
          return
        }

        basePayload.webhookUrl = null
        basePayload.messageConfig = {
          channel: formData.messageChannel,
          customNumber: formData.messageChannel === "custom" ? normalizedCustomNumber : null,
          templateId: formData.messageTemplateId,
          templateText: formData.messageTemplateText,
        }
      }

      const isEditing = Boolean(editingTrigger)
      const endpointBase = `/api/${scope}/agents/${selectedAgent}/reminder-triggers`
      const response = await fetch(
        isEditing ? `${endpointBase}/${editingTrigger?.id}` : endpointBase,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload),
        },
      )

      if (!response.ok) {
        const details = await response.json().catch(() => ({}))
        throw new Error(details?.details || details?.error || `Erro ${response.status}`)
      }

      await response.json()
      await fetchTriggers(selectedAgent)

      const agent = agents.find((item) => item.id === selectedAgent)

      setIsTriggerDialogOpen(false)
      setEditingTrigger(null)
      setFormData(
        createInitialFormState({
          scopeReference: agent?.calendar_meeting_id ?? "",
        }),
      )
    } catch (err: any) {
      console.error("Erro ao salvar gatilho:", err)
      setTriggerError(err?.message ?? "Erro desconhecido ao salvar gatilho")
    } finally {
      setSavingTrigger(false)
    }
  }, [selectedAgent, scope, formData, editingTrigger, fetchTriggers, agents])

  const handleEditTrigger = useCallback((trigger: ReminderTrigger) => {
    setTriggerError(null)
    setEditingTrigger(trigger)
    const actionPayload = trigger.action_payload ?? {}
    const rawTemplateText =
      typeof actionPayload.templateText === "string" ? actionPayload.templateText : ""
    const templateMatchedById = findWhatsappTemplateById(actionPayload.templateId ?? null)
    const templateIdByContent = rawTemplateText.trim().length
      ? detectTemplateIdByContent(rawTemplateText)
      : DEFAULT_WHATSAPP_TEMPLATE_ID
    const templateMatchedByContent =
      templateIdByContent !== "custom" ? findWhatsappTemplateById(templateIdByContent) : null
    const effectiveTemplate = templateMatchedById ?? templateMatchedByContent
    const messageTemplateText =
      rawTemplateText.trim().length > 0
        ? rawTemplateText
        : effectiveTemplate?.content ?? DEFAULT_WHATSAPP_TEMPLATE_CONTENT
    const resolvedTemplateId =
      templateMatchedById && actionPayload.templateId
        ? actionPayload.templateId
        : templateIdByContent

    setFormData(
      createInitialFormState({
        timingType: trigger.timing_type,
        offsetAmount: trigger.offset_amount,
        offsetUnit: trigger.offset_unit,
        scopeReference: trigger.scope_reference ?? "",
        actionType: trigger.action_type,
        webhookUrl: trigger.webhook_url ?? "",
        isActive: trigger.is_active,
        messageChannel: actionPayload.channel === "custom" ? "custom" : "participant",
        messageCustomNumber: actionPayload.customNumber ?? "",
        messageTemplateId: resolvedTemplateId,
        messageTemplateText,
      }),
    )
    setIsTriggerDialogOpen(true)
  }, [])

  const handleRequestDeleteTrigger = useCallback((trigger: ReminderTrigger) => {
    setTriggerError(null)
    setTriggerPendingDelete(trigger)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDeleteTrigger = useCallback(async () => {
    if (!selectedAgent || !triggerPendingDelete) {
      setTriggerError("Selecione um agente válido para remover gatilhos")
      setDeleteDialogOpen(false)
      setTriggerPendingDelete(null)
      return
    }

    try {
      setDeletingTriggerId(triggerPendingDelete.id)
      setTriggerError(null)

      const response = await fetch(
        `/api/${scope}/agents/${selectedAgent}/reminder-triggers/${triggerPendingDelete.id}`,
        { method: "DELETE" },
      )

      if (!response.ok) {
        const details = await response.json().catch(() => ({}))
        throw new Error(details?.details || details?.error || `Erro ${response.status}`)
      }

      await fetchTriggers(selectedAgent)
      setDeleteDialogOpen(false)
      setTriggerPendingDelete(null)
    } catch (err: any) {
      console.error("Erro ao remover gatilho:", err)
      setTriggerError(err?.message ?? "Erro desconhecido ao remover gatilho")
    } finally {
      setDeletingTriggerId(null)
    }
  }, [fetchTriggers, scope, selectedAgent, triggerPendingDelete])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  useEffect(() => {
    if (!selectedAgent) {
      return
    }

    const agent = agents.find((item) => item.id === selectedAgent)

    if (!editingTrigger) {
      setFormData((prev) => ({
        ...prev,
        scopeReference: agent?.calendar_meeting_id ?? "",
      }))
    }

    fetchTriggers(selectedAgent)
  }, [selectedAgent, agents, fetchTriggers, editingTrigger])

  const primaryAgent = useMemo(() => {
    return agents.find((agent) => agent.id === selectedAgent) || null
  }, [agents, selectedAgent])

  const defaultTimeZoneInfo: TimezoneInfo = useMemo(() => {
    if (!primaryAgent) {
      return { formatted: null, offsetLabel: null, timeZone: null }
    }
    return formatDateTimeWithOffset(new Date().toISOString(), primaryAgent.timeZone ?? null)
  }, [primaryAgent?.timeZone])

  const defaultEventTypeId =
    (primaryAgent?.calendar_meeting_id && primaryAgent.calendar_meeting_id.trim()) || null

  const agentTimeZoneInfo: TimezoneInfo =
    (defaultEventTypeId && eventTypeTimeZones[defaultEventTypeId]) || defaultTimeZoneInfo

  useEffect(() => {
    if (!selectedAgent) return
    const agent = agents.find((item) => item.id === selectedAgent) || null
    if (!agent) return

    const eventTypeIds = new Set<string>()
    if (agent.calendar_meeting_id && String(agent.calendar_meeting_id).trim()) {
      eventTypeIds.add(String(agent.calendar_meeting_id).trim())
    }
    triggers.forEach((trigger) => {
      if (trigger.scope_reference && String(trigger.scope_reference).trim()) {
        eventTypeIds.add(String(trigger.scope_reference).trim())
      }
    })

    const idsToFetch = Array.from(eventTypeIds).filter(
      (eventTypeId) => !eventTypeTimeZones[eventTypeId],
    )
    if (idsToFetch.length === 0) {
      return
    }

    const nowIso = new Date().toISOString()
    const fallbackInfo = formatDateTimeWithOffset(nowIso, agent.timeZone ?? null)
    let cancelled = false

    const resolveTimeZoneForEventType = async (eventTypeId: string): Promise<TimezoneInfo> => {
      if (typeof window === "undefined") {
        return fallbackInfo
      }

      try {
        const origin = window.location.origin
        const url = new URL(
          `/api/${scope}/agents/${selectedAgent}/event-types/${encodeURIComponent(eventTypeId)}`,
          origin,
        )

        const response = await fetch(url.toString(), { cache: "no-store" })
        if (response.ok) {
          const payload = await response.json().catch(() => null)
          const payloadTimeZone: string | null =
            payload?.timeZone ??
            payload?.eventTimeZone ??
            payload?.scheduleTimeZone ??
            payload?.ownerTimeZone ??
            null

          if (payloadTimeZone && typeof payloadTimeZone === "string" && payloadTimeZone.trim()) {
            return formatDateTimeWithOffset(nowIso, payloadTimeZone)
          }
        }
      } catch (error) {
        console.warn(
          "Não foi possível detectar o fuso horário do eventType",
          eventTypeId,
          error,
        )
      }

      return fallbackInfo
    }

    ;(async () => {
      const updates: Record<string, TimezoneInfo> = {}
      for (const eventTypeId of idsToFetch) {
        const info = await resolveTimeZoneForEventType(eventTypeId)
        if (cancelled) {
          return
        }
        updates[eventTypeId] = info
      }

      if (!cancelled && Object.keys(updates).length > 0) {
        setEventTypeTimeZones((prev) => ({ ...prev, ...updates }))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [selectedAgent, agents, triggers, scope, eventTypeTimeZones])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
                <Zap className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-blue-100">Automação de Lembretes</p>
                <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Gatilhos de Lembretes</h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Defina quando os lembretes serão disparados e para onde enviaremos os dados de cada agendamento.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-right text-xs font-medium tracking-wide text-blue-100">
              <span className="block text-[11px] uppercase text-blue-100/70">Agente selecionado</span>
              <span className="text-base font-semibold text-white">
                {primaryAgent ? primaryAgent.name : "Nenhum"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Filter className="h-4 w-4" />
              Selecionar agente
            </div>
            <div className="min-w-[220px]">
              {loadingAgents ? (
                <Skeleton className="h-11 w-full" />
              ) : (
                <Select value={selectedAgent ?? ""} onValueChange={handleSelectAgent}>
                  <SelectTrigger className="h-11 border-slate-200 text-left shadow-sm focus:ring-2 focus:ring-indigo-500 dark:border-slate-700">
                    <SelectValue placeholder="Escolha um agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{agent.name}</span>
                          {scope === "admin" && agent.owner && (
                            <span className="text-xs text-muted-foreground">{agent.owner}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </Card>

        {triggerError && !loadingTriggers && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{triggerError}</AlertDescription>
          </Alert>
        )}

        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Gatilhos configurados</h2>
              <p className="text-xs text-muted-foreground">
                Visualize e gerencie os horários em que os lembretes serão disparados.
              </p>
            </div>

            <Dialog
              open={isTriggerDialogOpen}
              onOpenChange={(open) => {
                setIsTriggerDialogOpen(open)
                if (!open) {
                  setEditingTrigger(null)
                  setTriggerError(null)
                }
              }}
            >
              <Button
                size="sm"
                className="gap-2"
                onClick={handleOpenCreateDialog}
                disabled={!selectedAgent || savingTrigger}
              >
                <Zap className="h-4 w-4" /> Novo gatilho
              </Button>
              <DialogContent className="sm:max-w-3xl lg:max-w-6xl xl:max-w-7xl overflow-hidden rounded-3xl border-none bg-transparent p-0 shadow-2xl">
                <div className="flex h-full flex-col bg-background">
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600" />
                    <DialogHeader className="relative z-10 flex flex-col gap-2 px-6 py-6 text-white">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <DialogTitle className="text-2xl font-semibold leading-tight">
                            {editingTrigger ? "Editar gatilho de lembrete" : "Criar gatilho de lembrete"}
                          </DialogTitle>
                          <DialogDescription className="text-sm text-indigo-100">
                            Configure a melhor experiência para o participante: timing, canal e conteúdo.
                          </DialogDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-full border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                        >
                          {formData.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {primaryAgent && (
                        <p className="text-xs text-indigo-100/80">
                          Agente: <span className="font-medium text-white">{primaryAgent.name}</span> • Fuso base:{" "}
                          {agentTimeZoneInfo.offsetLabel ?? defaultTimeZoneInfo.offsetLabel ?? "UTC-03:00"} (
                          {agentTimeZoneInfo.timeZone ??
                            primaryAgent.timeZone ??
                            defaultTimeZoneInfo.timeZone ??
                            "America/Sao_Paulo"}
                          )
                        </p>
                      )}
                    </DialogHeader>
                  </div>

                  <ScrollArea className="max-h-[72vh]">
                    <div className="space-y-6 px-6 py-6 lg:space-y-8">
                      {primaryAgent && !primaryAgent.calendar_meeting_id && (
                        <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Defina o eventTypeId</AlertTitle>
                          <AlertDescription>
                            Este agente ainda não possui um <code>eventTypeId</code> configurado (campo “ID da
                            Reunião/Calendário”). Configure-o para que os gatilhos filtrem os agendamentos corretamente.
                          </AlertDescription>
                        </Alert>
                      )}

                      <section className="rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              Configurações do gatilho
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Determine quando o lembrete será disparado e qual evento é monitorado.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                            <span className="text-muted-foreground">Inativo</span>
                            <Switch
                              checked={formData.isActive}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, isActive: checked }))
                              }
                            />
                            <span className="text-muted-foreground">Ativo</span>
                          </div>
                        </header>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="trigger-offset-amount">Quanto tempo antes?</Label>
                            <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
                              <Input
                                id="trigger-offset-amount"
                                type="number"
                                min={0}
                                value={formData.offsetAmount}
                                onChange={(event) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    offsetAmount: Number(event.target.value ?? 0),
                                  }))
                                }
                                className="h-11"
                              />
                              <Select
                                value={formData.offsetUnit}
                                onValueChange={(value: "minutes" | "hours" | "days") =>
                                  setFormData((prev) => ({ ...prev, offsetUnit: value }))
                                }
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="minutes">Minutos</SelectItem>
                                  <SelectItem value="hours">Horas</SelectItem>
                                  <SelectItem value="days">Dias</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="scope-reference">ID do tipo de evento (eventTypeId)</Label>
                            <Input
                              id="scope-reference"
                              placeholder="ID configurado no agente"
                              value={formData.scopeReference}
                              onChange={(event) =>
                                setFormData((prev) => ({ ...prev, scopeReference: event.target.value }))
                              }
                              disabled={!primaryAgent?.calendar_meeting_id}
                            />
                            <p className="text-xs text-muted-foreground">
                              Usamos o valor do agente por padrão. Ajuste quando precisar monitorar outro evento.
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-5 rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                        <header className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              Entrega da mensagem
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Escolha o canal e personalize o conteúdo enviado ao participante.
                            </p>
                          </div>
                        </header>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Tipo de ação</Label>
                            <Select
                              value={formData.actionType}
                              onValueChange={(value: ReminderActionType) =>
                                setFormData((prev) => ({ ...prev, actionType: value }))
                              }
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="webhook">Webhook (HTTP POST)</SelectItem>
                                <SelectItem value="whatsapp_message">Mensagem WhatsApp</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {formData.actionType === "webhook" ? (
                            <div className="space-y-2">
                              <Label htmlFor="webhook-url">URL do webhook</Label>
                              <Input
                                id="webhook-url"
                                placeholder="https://seusistema.com/webhooks/calcom"
                                value={formData.webhookUrl}
                                onChange={(event) =>
                                  setFormData((prev) => ({ ...prev, webhookUrl: event.target.value }))
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Enviaremos um POST com os dados do agendamento para a URL especificada.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Destinatário</Label>
                                  <Select
                                    value={formData.messageChannel}
                                    onValueChange={(value: MessageChannel) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        messageChannel: value,
                                        messageCustomNumber:
                                          value === "custom" ? prev.messageCustomNumber : "",
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="participant">Participante (attendeePhone)</SelectItem>
                                      <SelectItem value="custom">Outro número</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {formData.messageChannel === "custom" && (
                                    <div className="space-y-1">
                                      <Input
                                        placeholder="Ex: 5511999999999"
                                        value={formData.messageCustomNumber}
                                        onChange={(event) => {
                                          const digits = event.target.value.replace(/\D+/g, "")
                                          setFormData((prev) => ({
                                            ...prev,
                                            messageCustomNumber: digits,
                                          }))
                                        }}
                                      />
                                      <p className="text-xs text-muted-foreground">
                                        Utilize o formato internacional sem o símbolo “+”.
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label>Modelo de mensagem</Label>
                                  <Select
                                    value={formData.messageTemplateId}
                                    onValueChange={(value) => {
                                      if (value === "custom") {
                                        setFormData((prev) => ({
                                          ...prev,
                                          messageTemplateId: "custom",
                                        }))
                                        return
                                      }

                                      const template = findWhatsappTemplateById(value)
                                      if (!template) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          messageTemplateId: value,
                                        }))
                                        return
                                      }

                                      setFormData((prev) => ({
                                        ...prev,
                                        messageTemplateId: template.id,
                                        messageTemplateText: template.content,
                                      }))
                                      requestAnimationFrame(() => {
                                        messageTextareaRef.current?.focus()
                                      })
                                    }}
                                  >
                                    <SelectTrigger className="h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {WHATSAPP_MESSAGE_TEMPLATES.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                          <div className="flex flex-col">
                                            <span className="font-medium">{template.label}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {template.description}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="custom">Personalizado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <Label htmlFor="whatsapp-template-text" className="block">
                                    Mensagem
                                  </Label>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs">
                                        Adicionar variável
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="max-h-72 w-64 overflow-auto rounded-xl border border-slate-200/80 bg-background shadow-lg dark:border-slate-700/60"
                                    >
                                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                                        Inserir variável dinâmica
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {MESSAGE_VARIABLES.map((variable) => (
                                        <DropdownMenuItem
                                          key={variable.key}
                                          className="text-xs"
                                          onSelect={(event) => {
                                            event.preventDefault()
                                            handleInsertVariable(variable.key)
                                          }}
                                        >
                                          <div className="flex flex-col">
                                            <span className="font-medium text-slate-800 dark:text-slate-100">
                                              {variable.label}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground font-mono">
                                              {`{{${variable.key}}}`}
                                            </span>
                                          </div>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <Textarea
                                  id="whatsapp-template-text"
                                  ref={messageTextareaRef}
                                  rows={8}
                                  value={formData.messageTemplateText}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    setFormData((prev) => ({
                                      ...prev,
                                      messageTemplateText: value,
                                      messageTemplateId: detectTemplateIdByContent(value),
                                    }))
                                  }}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Use variáveis dinâmicas para personalizar a mensagem final do participante.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      <section className="rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                        <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Resumo do disparo
                        </h4>
                        <dl className="grid gap-4 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-100/80 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
                            <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                              Janela do lembrete
                            </dt>
                            <dd className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {formData.offsetAmount} {OFFSET_UNIT_LABEL[formData.offsetUnit]} antes do início
                            </dd>
                          </div>
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-100/80 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
                            <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                              Ação selecionada
                            </dt>
                            <dd className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {formData.actionType === "webhook"
                                ? "Webhook (HTTP POST)"
                                : "Mensagem WhatsApp"}
                            </dd>
                          </div>
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-100/80 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
                            <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                              Destino / URL
                            </dt>
                            <dd className="mt-2 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {formData.actionType === "webhook"
                                ? formData.webhookUrl || "Não definido"
                                : formData.messageChannel === "custom"
                                  ? `Outro número (${formData.messageCustomNumber || "—"})`
                                  : "Participante (attendeePhone)"}
                            </dd>
                          </div>
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-100/80 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
                            <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                              Template / Prévia
                            </dt>
                            <dd className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {formData.actionType === "webhook"
                                ? "Payload JSON padrão"
                                : formData.messageTemplateId === "custom"
                                  ? "Personalizado"
                                  : findWhatsappTemplateById(formData.messageTemplateId)?.label ??
                                    "Personalizado"}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      {triggerError && (
                        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
                          {triggerError}
                        </p>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-muted px-6 py-4">
                    <p className="text-xs text-muted-foreground">
                      As alterações entram em vigor imediatamente após salvar.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsTriggerDialogOpen(false)
                          setEditingTrigger(null)
                        }}
                        disabled={savingTrigger}
                      >
                        Cancelar
                      </Button>
                      <Button type="button" onClick={handleSubmitTrigger} disabled={savingTrigger}>
                        {savingTrigger
                          ? "Salvando..."
                          : editingTrigger
                            ? "Salvar alterações"
                            : "Criar gatilho"}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                setDeleteDialogOpen(open)
                if (!open) {
                  setTriggerPendingDelete(null)
                }
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover gatilho</AlertDialogTitle>
                  <AlertDialogDescription>
                    {triggerPendingDelete
                      ? `Removeremos o gatilho que envia lembretes ${triggerPendingDelete.offset_amount} ${OFFSET_UNIT_LABEL[triggerPendingDelete.offset_unit]} antes do evento para o tipo ${triggerPendingDelete.scope_reference ?? "(sem ID)"}.`
                      : "Tem certeza que deseja remover este gatilho de lembrete?"}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingTriggerId !== null}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmDeleteTrigger}
                    disabled={
                      deletingTriggerId !== null &&
                      triggerPendingDelete !== null &&
                      deletingTriggerId === triggerPendingDelete.id
                    }
                  >
                    {deletingTriggerId !== null &&
                    triggerPendingDelete &&
                    deletingTriggerId === triggerPendingDelete.id
                      ? "Removendo..."
                      : "Sim, remover"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Separator className="bg-slate-100 dark:bg-slate-800" />

          {!selectedAgent ? (
            <div className="px-6 py-6 text-sm text-muted-foreground">
              Selecione um agente para visualizar os gatilhos configurados.
            </div>
          ) : loadingTriggers ? (
            <div className="space-y-3 px-6 py-6">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : triggers.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              Nenhum gatilho configurado para este agente. Clique em <span className="font-medium">Novo gatilho</span> para criar o primeiro.
            </div>
          ) : (
            <div className="space-y-3 px-6 py-6">
              {triggers.map((trigger) => {
                const triggerEventTypeId =
                  (trigger.scope_reference && String(trigger.scope_reference).trim()) ||
                  defaultEventTypeId ||
                  ""
                const triggerTimeZoneInfo =
                  (triggerEventTypeId && eventTypeTimeZones[triggerEventTypeId]) || agentTimeZoneInfo
                const actionPayload = trigger.action_payload ?? {}
                const isWebhook = trigger.action_type === "webhook"
                const detectedTemplateId =
                  typeof actionPayload.templateText === "string" && actionPayload.templateText.trim().length > 0
                    ? detectTemplateIdByContent(actionPayload.templateText)
                    : actionPayload.templateId ?? DEFAULT_WHATSAPP_TEMPLATE_ID
                const templateDefinition =
                  actionPayload.templateId && findWhatsappTemplateById(actionPayload.templateId)
                    ? findWhatsappTemplateById(actionPayload.templateId)
                    : detectedTemplateId !== "custom"
                      ? findWhatsappTemplateById(detectedTemplateId)
                      : null
                const templateLabel = templateDefinition?.label ?? "Personalizado"
                const messagePreviewRaw =
                  typeof actionPayload.templateText === "string" && actionPayload.templateText.trim().length > 0
                    ? actionPayload.templateText.trim()
                    : templateDefinition?.content ?? ""
                const messagePreview =
                  !isWebhook && messagePreviewRaw ? `${messagePreviewRaw.slice(0, 140)}${messagePreviewRaw.length > 140 ? "..." : ""}` : ""
                const destinationLabel =
                  actionPayload.channel === "custom"
                    ? `Outro número (${actionPayload.customNumber ?? "não informado"})`
                    : "Participante (attendeePhone)"

                return (
                  <div
                    key={trigger.id}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 shadow-sm transition hover:border-indigo-200 dark:border-slate-700 dark:hover:border-indigo-500/40"
                  >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {trigger.timing_type === "before_event_start" ? "Antes do início do evento" : trigger.timing_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {trigger.offset_amount} {OFFSET_UNIT_LABEL[trigger.offset_unit]} antes do evento {" "}
                      {trigger.scope_type === "agent"
                        ? "(todos os bookings do agente)"
                        : trigger.scope_type === "calendar"
                          ? `para o calendário ${trigger.scope_reference ?? "(sem ID)"}`
                          : `para o tipo de evento ${trigger.scope_reference ?? "(sem ID)"}`}
                    </span>
                    {(triggerTimeZoneInfo.offsetLabel || defaultTimeZoneInfo.offsetLabel) && (
                      <span className="text-xs text-muted-foreground">
                        Fuso horário base:{" "}
                        {triggerTimeZoneInfo.offsetLabel ?? defaultTimeZoneInfo.offsetLabel}
                        {triggerTimeZoneInfo.timeZone || primaryAgent?.timeZone
                          ? ` (${triggerTimeZoneInfo.timeZone ?? primaryAgent?.timeZone})`
                          : ""}
                      </span>
                    )}
                    {isWebhook ? (
                      <span className="text-xs text-muted-foreground">
                        Webhook:{" "}
                        <span className="break-all font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {trigger.webhook_url ?? "—"}
                        </span>
                      </span>
                    ) : (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>Destino: {destinationLabel}</div>
                        <div>Modelo: {templateLabel}</div>
                        {messagePreview && (
                          <div className="italic text-slate-500 dark:text-slate-400">
                            “{messagePreview}”
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <Badge
                      variant="outline"
                      className={`w-max rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        trigger.is_active
                          ? "border-emerald-300 text-emerald-600 dark:border-emerald-400/60 dark:text-emerald-200"
                          : "border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {trigger.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 px-3"
                        onClick={() => handleEditTrigger(trigger)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 gap-1.5 px-3"
                        onClick={() => handleRequestDeleteTrigger(trigger)}
                        disabled={deletingTriggerId === trigger.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingTriggerId === trigger.id ? "Removendo..." : "Excluir"}
                      </Button>
                    </div>
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Ação: {isWebhook ? "Webhook" : "Mensagem WhatsApp"}
                    </span>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ReminderTriggersView

