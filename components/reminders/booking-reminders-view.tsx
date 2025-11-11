"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertTriangle,
  Calendar,
  Clock,
  Filter,
  Mail,
  Phone,
  TrendingUp,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

type Scope = "user" | "admin"

interface BookingRemindersViewProps {
  scope?: Scope
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ACCEPTED", label: "Accepted" },
  { value: "PENDING", label: "Pending" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "DECLINED", label: "Declined" },
  { value: "ALL", label: "Todos" },
]

const PHONE_FILTER_OPTIONS: { value: "ALL" | "WITH_PHONE" | "WITHOUT_PHONE"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "WITH_PHONE", label: "Com telefone" },
  { value: "WITHOUT_PHONE", label: "Sem telefone" },
]

interface AgentSummary {
  id: string
  name: string
  owner?: string | null
  calendar_provider?: string | null
  calendar_api_version?: string | null
  calendar_api_url?: string | null
}

interface NormalizedBooking {
  id: string
  uid?: string
  title?: string
  status?: string
  start?: string | null
  end?: string | null
  attendeeName?: string | null
  attendeeEmail?: string | null
  attendeePhone?: string | null
  attendeeTimeZone?: string | null
  hostName?: string | null
  hostEmail?: string | null
  metadata?: Record<string, any> | null
  raw: any
}

interface ReminderTrigger {
  id: string
  offset_amount: number
  offset_unit: "minutes" | "hours" | "days"
  is_active: boolean
  webhook_url: string
  scope_reference?: string | null
  created_at?: string | null
  updated_at?: string | null
}

interface ReminderLogEntry {
  triggerId: string
  bookingUid: string
  scheduledFor: string | null
  executedAt: string | null
  success: boolean
  webhookStatus: number | null
  errorMessage: string | null
}

interface ReminderDetail {
  triggerId: string
  offsetAmount: number
  offsetUnit: "minutes" | "hours" | "days"
  offsetLabel: string
  scheduledAt: string
  executedAt?: string | null
  success?: boolean
  errorMessage?: string | null
  blockedReason?: "grace-period"
  triggerActivatedAt?: string | null
  graceDeadline?: string | null
}

interface ReminderSummary {
  status:
    | "no-trigger"
    | "no-phone"
    | "missing-start"
    | "overdue"
    | "upcoming"
    | "sent"
    | "failed"
    | "blocked"
    | "unknown"
  detail?: ReminderDetail | null
  totalScheduled: number
  totalSent: number
}

const OFFSET_TO_MINUTES: Record<"minutes" | "hours" | "days", number> = {
  minutes: 1,
  hours: 60,
  days: 60 * 24,
}

const TRIGGER_GRACE_PERIOD_MS =
  Math.max(0, Number(process.env.NEXT_PUBLIC_REMINDER_TRIGGER_GRACE_MINUTES ?? "5")) * 60 * 1000

function convertOffsetToMinutes(amount: number, unit: "minutes" | "hours" | "days") {
  const factor = OFFSET_TO_MINUTES[unit] ?? 1
  return Math.max(0, Math.round(amount * factor))
}

function formatOffsetLabel(amount: number, unit: "minutes" | "hours" | "days") {
  const dictionary: Record<typeof unit, { singular: string; plural: string }> = {
    minutes: { singular: "minuto", plural: "minutos" },
    hours: { singular: "hora", plural: "horas" },
    days: { singular: "dia", plural: "dias" },
  }

  const labels = dictionary[unit]
  const formatted = new Intl.NumberFormat("pt-BR").format(amount)
  return `${formatted} ${amount === 1 ? labels.singular : labels.plural}`
}

function resolveBookingUid(booking: NormalizedBooking) {
  const candidates = [
    booking.uid,
    booking.raw?.uid,
    booking.raw?.id,
    booking.raw?.bookingUid,
    booking.id,
  ]
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && `${candidate}`.trim()) {
      return String(candidate)
    }
  }
  return null
}

function normalizeBooking(raw: any): NormalizedBooking {
  const start = raw?.start ?? raw?.startTime ?? null
  const end = raw?.end ?? raw?.endTime ?? null

  const attendees: any[] = Array.isArray(raw?.attendees) ? raw.attendees : []
  const primaryAttendee = attendees[0] ?? null
  const responses = raw?.responses ?? {}

  const attendeePhone =
    responses?.attendeePhoneNumber ??
    primaryAttendee?.phoneNumber ??
    (Array.isArray(responses?.guests) && responses.guests.length > 0 ? null : null)

  const hosts: any[] = Array.isArray(raw?.hosts) ? raw.hosts : []
  const primaryHost = hosts[0] ?? raw?.user ?? null

  return {
    id: String(raw?.id ?? raw?.uid ?? crypto.randomUUID()),
    uid: raw?.uid,
    title: raw?.title ?? raw?.eventType?.name ?? "(Sem título)",
    status: raw?.status,
    start,
    end,
    attendeeName: primaryAttendee?.name ?? responses?.name ?? null,
    attendeeEmail: primaryAttendee?.email ?? responses?.email ?? null,
    attendeePhone: attendeePhone ?? null,
    attendeeTimeZone: primaryAttendee?.timeZone ?? responses?.timeZone ?? null,
    hostName: primaryHost?.name ?? null,
    hostEmail: primaryHost?.email ?? null,
    metadata: raw?.metadata ?? null,
    raw,
  }
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

function formatDateTimeWithOffset(value?: string | null, timeZone?: string | null) {
  if (!value) {
    return { formatted: "—", offsetLabel: null as string | null, timeZone: null as string | null }
  }

  try {
    const date = new Date(value)
    if (Number.isNaN(date.valueOf())) {
      return { formatted: value, offsetLabel: null, timeZone: null }
    }

    const fallbackTz = "America/Sao_Paulo"
    const zone = timeZone && timeZone.trim().length > 0 ? timeZone : fallbackTz

    const build = (targetZone: string) => {
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
  } catch (error) {
    return { formatted: value ?? "—", offsetLabel: null, timeZone: null }
  }
}

function formatDate(value?: string | null, timeZone?: string | null) {
  const result = formatDateTimeWithOffset(value, timeZone)
  return result.formatted ?? value ?? "—"
}

export function BookingRemindersView({ scope = "user" }: BookingRemindersViewProps) {
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [bookings, setBookings] = useState<NormalizedBooking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [triggers, setTriggers] = useState<ReminderTrigger[]>([])
  const [loadingTriggers, setLoadingTriggers] = useState(false)
  const [reminderLogs, setReminderLogs] = useState<Record<string, Record<string, ReminderLogEntry[]>>>({})
  const [loadingReminderLogs, setLoadingReminderLogs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("ACCEPTED")
  const [phoneFilter, setPhoneFilter] = useState<"ALL" | "WITH_PHONE" | "WITHOUT_PHONE">("ALL")
  const [searchName, setSearchName] = useState("")
  const [searchEmail, setSearchEmail] = useState("")
  const [searchPhone, setSearchPhone] = useState("")

  const resetFilters = useCallback(() => {
    setStatusFilter("ACCEPTED")
    setPhoneFilter("ALL")
    setSearchName("")
    setSearchEmail("")
    setSearchPhone("")
  }, [])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (statusFilter !== "ACCEPTED") count += 1
    if (phoneFilter !== "ALL") count += 1
    if (searchName.trim()) count += 1
    if (searchEmail.trim()) count += 1
    if (searchPhone.trim()) count += 1
    return count
  }, [statusFilter, phoneFilter, searchName, searchEmail, searchPhone])

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
          }))
        : []

      setAgents(items)
      if (items.length > 0) {
        setSelectedAgent((prev) => prev ?? items[0].id)
      }
    } catch (err: any) {
      console.error("Erro ao carregar agentes:", err)
      setError(err?.message ?? "Erro desconhecido ao carregar agentes")
    } finally {
      setLoadingAgents(false)
    }
  }, [scope])

  const fetchBookings = useCallback(
    async (agentId: string, status: string) => {
      try {
        setLoadingBookings(true)
        setError(null)

        const url = new URL(`/api/${scope}/agents/${agentId}/bookings`, window.location.origin)
        url.searchParams.set("status", status)

        const response = await fetch(url.toString(), { cache: "no-store" })
        if (!response.ok) {
          const details = await response.json().catch(() => ({}))
          throw new Error(details?.details || details?.error || `Erro ${response.status}`)
        }

        const payload = await response.json()
        const rawBookings: any[] = Array.isArray(payload?.bookings) ? payload.bookings : []
        const normalized = rawBookings.map(normalizeBooking)
        setBookings(normalized)
      } catch (err: any) {
        console.error("Erro ao carregar bookings:", err)
        setBookings([])
        setError(err?.message ?? "Erro desconhecido ao buscar agendamentos")
      } finally {
        setLoadingBookings(false)
      }
    },
    [scope],
  )

  const fetchTriggers = useCallback(
    async (agentId: string) => {
      try {
        setLoadingTriggers(true)
        const response = await fetch(`/api/${scope}/agents/${agentId}/reminder-triggers`, {
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error(`Falha ao carregar gatilhos (${response.status})`)
        }

        const payload = await response.json()
        const items: ReminderTrigger[] = Array.isArray(payload?.triggers) ? payload.triggers : []
        setTriggers(items)
      } catch (err) {
        console.error("Erro ao carregar gatilhos de lembrete:", err)
        setTriggers([])
      } finally {
        setLoadingTriggers(false)
      }
    },
    [scope],
  )

  const fetchReminderLogs = useCallback(
    async (agentId: string, bookingUids: string[]) => {
      const uniqueUids = Array.from(new Set(bookingUids.filter(Boolean)))
      if (uniqueUids.length === 0) {
        setReminderLogs({})
        return
      }

      try {
        setLoadingReminderLogs(true)
        const url = new URL(`/api/${scope}/agents/${agentId}/reminder-trigger-logs`, window.location.origin)
        url.searchParams.set("bookingUid", uniqueUids.join(","))

        const response = await fetch(url.toString(), { cache: "no-store" })
        if (!response.ok) {
          throw new Error(`Falha ao carregar logs (${response.status})`)
        }

        const payload = await response.json()
        const logs = payload?.logs && typeof payload.logs === "object" ? payload.logs : {}
        setReminderLogs(logs)
      } catch (err) {
        console.error("Erro ao carregar logs de lembrete:", err)
        setReminderLogs({})
      } finally {
        setLoadingReminderLogs(false)
      }
    },
    [scope],
  )

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  useEffect(() => {
    if (selectedAgent) {
      fetchBookings(selectedAgent, statusFilter)
    }
  }, [selectedAgent, statusFilter, fetchBookings])

  useEffect(() => {
    if (selectedAgent) {
      fetchTriggers(selectedAgent)
    } else {
      setTriggers([])
    }
  }, [selectedAgent, fetchTriggers])

  useEffect(() => {
    if (!selectedAgent) {
      setReminderLogs({})
      return
    }

    const activeTriggerIds = triggers.filter((trigger) => trigger.is_active).map((trigger) => trigger.id)
    if (activeTriggerIds.length === 0) {
      setReminderLogs({})
      return
    }

    if (!bookings.length) {
      setReminderLogs({})
      return
    }

    fetchReminderLogs(
      selectedAgent,
      bookings
        .map(resolveBookingUid)
        .filter((value): value is string => Boolean(value)),
    )
  }, [bookings, selectedAgent, triggers, fetchReminderLogs])

  const filteredBookings = useMemo(() => {
    const statusFiltered =
      statusFilter === "ALL"
        ? bookings
        : bookings.filter((booking) => (booking.status ?? "").toUpperCase() === statusFilter)

    if (phoneFilter === "WITH_PHONE") {
      return statusFiltered.filter((booking) => Boolean(booking.attendeePhone))
    }

    if (phoneFilter === "WITHOUT_PHONE") {
      return statusFiltered.filter((booking) => !booking.attendeePhone)
    }

    const textFiltered = statusFiltered.filter((booking) => {
      const name = (booking.attendeeName ?? "").toLowerCase()
      const email = (booking.attendeeEmail ?? "").toLowerCase()
      const phone = (booking.attendeePhone ?? "").toLowerCase()

      const matchesName = searchName ? name.includes(searchName.toLowerCase()) : true
      const matchesEmail = searchEmail ? email.includes(searchEmail.toLowerCase()) : true
      const matchesPhone = searchPhone ? phone.includes(searchPhone.toLowerCase()) : true

      return matchesName && matchesEmail && matchesPhone
    })

    const sorted = [...textFiltered].sort((a, b) => {
      const dateA = a.start ? new Date(a.start).getTime() : 0
      const dateB = b.start ? new Date(b.start).getTime() : 0
      return dateA - dateB
    })

    return sorted
  }, [bookings, statusFilter, phoneFilter, searchName, searchEmail, searchPhone])

  const stats = useMemo(() => {
    if (!filteredBookings.length) {
      return {
        total: 0,
        withPhone: 0,
        missingPhone: 0,
      }
    }

    const withPhone = filteredBookings.filter((booking) => Boolean(booking.attendeePhone)).length
    return {
      total: filteredBookings.length,
      withPhone,
      missingPhone: filteredBookings.length - withPhone,
    }
  }, [filteredBookings])

  const reminderSummaryByBooking = useMemo(() => {
    const now = Date.now()
    const summaries: Record<string, ReminderSummary> = {}
    const activeTriggers = triggers.filter((trigger) => trigger.is_active)

    for (const booking of bookings) {
      const bookingUid = resolveBookingUid(booking)
      if (!bookingUid) {
        continue
      }

      if (!booking.attendeePhone) {
        summaries[bookingUid] = { status: "no-phone", detail: null, totalScheduled: 0, totalSent: 0 }
        continue
      }

      if (!booking.start) {
        summaries[bookingUid] = { status: "missing-start", detail: null, totalScheduled: 0, totalSent: 0 }
        continue
      }

      if (!activeTriggers.length) {
        summaries[bookingUid] = { status: "no-trigger", detail: null, totalScheduled: 0, totalSent: 0 }
        continue
      }

      const startDate = new Date(booking.start)
      if (Number.isNaN(startDate.getTime())) {
        summaries[bookingUid] = { status: "missing-start", detail: null, totalScheduled: 0, totalSent: 0 }
        continue
      }

      const logsForBooking = reminderLogs[bookingUid] ?? {}
      let overdueDetail: ReminderDetail | null = null
      let nextDetail: ReminderDetail | null = null
      let sentDetail: ReminderDetail | null = null
      let failedDetail: ReminderDetail | null = null
      let blockedDetail: ReminderDetail | null = null
      let totalScheduled = 0
      let totalSent = 0

      for (const trigger of activeTriggers) {
        const offsetMinutes = convertOffsetToMinutes(trigger.offset_amount, trigger.offset_unit)
        const scheduledDate = new Date(startDate.getTime() - offsetMinutes * 60 * 1000)
        if (Number.isNaN(scheduledDate.getTime())) {
          continue
        }

        const detail: ReminderDetail = {
          triggerId: trigger.id,
          offsetAmount: trigger.offset_amount,
          offsetUnit: trigger.offset_unit,
          offsetLabel: formatOffsetLabel(trigger.offset_amount, trigger.offset_unit),
          scheduledAt: scheduledDate.toISOString(),
        }

        const scheduledMs = scheduledDate.getTime()
        const createdAtMs = trigger.created_at ? new Date(trigger.created_at).getTime() : Number.NaN
        const updatedAtMs = trigger.updated_at ? new Date(trigger.updated_at).getTime() : Number.NaN
        const activationTimestamp = Math.max(
          Number.isFinite(createdAtMs) ? createdAtMs : Number.NEGATIVE_INFINITY,
          Number.isFinite(updatedAtMs) ? updatedAtMs : Number.NEGATIVE_INFINITY,
        )
        const graceCutoffMs =
          Number.isFinite(activationTimestamp) && activationTimestamp !== Number.NEGATIVE_INFINITY
            ? activationTimestamp + TRIGGER_GRACE_PERIOD_MS
            : null
        const isBlockedByGrace = graceCutoffMs !== null && scheduledMs < graceCutoffMs

        totalScheduled += 1

        if (isBlockedByGrace) {
          detail.blockedReason = "grace-period"
          if (!blockedDetail || scheduledMs > new Date(blockedDetail.scheduledAt).getTime()) {
            blockedDetail = detail
          }
          continue
        }

        detail.triggerActivatedAt =
          Number.isFinite(activationTimestamp) && activationTimestamp !== Number.NEGATIVE_INFINITY
            ? new Date(activationTimestamp).toISOString()
            : null
        detail.graceDeadline = graceCutoffMs !== null ? new Date(graceCutoffMs).toISOString() : null

        const triggerLogs = Array.isArray(logsForBooking[trigger.id]) ? logsForBooking[trigger.id] : []
        const matchingLog = triggerLogs.find((log) => {
          if (!log?.scheduledFor) return false
          const diff = Math.abs(new Date(log.scheduledFor).getTime() - scheduledDate.getTime())
          return diff <= 5 * 60 * 1000
        })

        if (matchingLog) {
          const executedAt = matchingLog.executedAt ?? matchingLog.scheduledFor ?? detail.scheduledAt
          if (matchingLog.success) {
            totalSent += 1
            const candidate = { ...detail, executedAt, success: true }
            if (
              !sentDetail ||
              new Date(candidate.executedAt ?? candidate.scheduledAt).getTime() >
                new Date(sentDetail.executedAt ?? sentDetail.scheduledAt).getTime()
            ) {
              sentDetail = candidate
            }
          } else {
            const candidate = {
              ...detail,
              executedAt,
              success: false,
              errorMessage: matchingLog.errorMessage ?? null,
            }
            if (
              !failedDetail ||
              new Date(candidate.scheduledAt).getTime() > new Date(failedDetail.scheduledAt).getTime()
            ) {
              failedDetail = candidate
            }
          }
          continue
        }

        if (scheduledMs <= now) {
          if (!overdueDetail || scheduledMs > new Date(overdueDetail.scheduledAt).getTime()) {
            overdueDetail = detail
          }
        } else if (!nextDetail || scheduledMs < new Date(nextDetail.scheduledAt).getTime()) {
          nextDetail = detail
        }
      }

      if (failedDetail) {
        summaries[bookingUid] = {
          status: "failed",
          detail: failedDetail,
          totalScheduled,
          totalSent,
        }
      } else if (blockedDetail) {
        summaries[bookingUid] = {
          status: "blocked",
          detail: blockedDetail,
          totalScheduled,
          totalSent,
        }
      } else if (overdueDetail) {
        summaries[bookingUid] = {
          status: "overdue",
          detail: overdueDetail,
          totalScheduled,
          totalSent,
        }
      } else if (nextDetail) {
        summaries[bookingUid] = {
          status: "upcoming",
          detail: nextDetail,
          totalScheduled,
          totalSent,
        }
      } else if (sentDetail) {
        summaries[bookingUid] = {
          status: "sent",
          detail: sentDetail,
          totalScheduled,
          totalSent,
        }
      } else if (totalScheduled === 0) {
        summaries[bookingUid] = { status: "no-trigger", detail: null, totalScheduled, totalSent }
      } else {
        summaries[bookingUid] = { status: "unknown", detail: null, totalScheduled, totalSent }
      }
    }

    return summaries
  }, [bookings, triggers, reminderLogs])

  const renderReminderCell = (booking: NormalizedBooking) => {
    if (loadingTriggers || loadingReminderLogs) {
      return <Skeleton className="h-5 w-24" />
    }

    const bookingUid = resolveBookingUid(booking)
    if (!bookingUid) {
      return <span className="text-sm text-muted-foreground">—</span>
    }

    const summary = reminderSummaryByBooking[bookingUid]

    if (!summary) {
      return <span className="text-sm text-muted-foreground">—</span>
    }

    let badgeLabel = ""
    let badgeClass = ""
    let badgeVariant: "default" | "secondary" | "outline" | "destructive" = "secondary"
    const descriptionParts: string[] = []
    const detail = summary.detail
    const scheduledText = detail?.scheduledAt ? formatDate(detail.scheduledAt, booking.attendeeTimeZone) : null
    const executedText = detail?.executedAt ? formatDate(detail.executedAt, booking.attendeeTimeZone) : null

    if (summary.totalScheduled > 0) {
      descriptionParts.push(`${summary.totalSent}/${summary.totalScheduled} enviados`)
    }

    switch (summary.status) {
      case "no-phone":
        badgeVariant = "destructive"
        badgeLabel = "Sem telefone"
        descriptionParts.push("Contato sem número válido")
        break
      case "no-trigger":
        badgeVariant = "outline"
        badgeLabel = "Sem gatilho"
        descriptionParts.push("Nenhum lembrete configurado")
        break
      case "missing-start":
        badgeVariant = "outline"
        badgeLabel = "Sem data"
        descriptionParts.push("Booking sem horário")
        break
      case "overdue":
        badgeLabel = "Atrasado"
        badgeClass = "bg-rose-500/10 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/40"
        if (scheduledText) {
          descriptionParts.push(`Deveria ter sido enviado em ${scheduledText}`)
        }
        if (detail?.offsetLabel) {
          descriptionParts.push(detail.offsetLabel)
        }
        break
      case "blocked":
        badgeLabel = "Ignorado"
        badgeClass = "bg-amber-500/10 text-amber-600 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40"
        if (detail?.blockedReason === "grace-period") {
          descriptionParts.push("Gatilho criado após o horário previsto")
          if (detail?.triggerActivatedAt) {
            descriptionParts.push(`Atualizado em ${formatDate(detail.triggerActivatedAt, booking.attendeeTimeZone)}`)
          }
          if (detail?.graceDeadline) {
            descriptionParts.push(`Carência até ${formatDate(detail.graceDeadline, booking.attendeeTimeZone)}`)
          }
        }
        if (scheduledText) {
          descriptionParts.push(`Horário original ${scheduledText}`)
        }
        if (detail?.offsetLabel) {
          descriptionParts.push(detail.offsetLabel)
        }
        break
      case "upcoming":
        badgeLabel = "Agendado"
        badgeClass = "bg-indigo-500/10 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/40"
        if (scheduledText) {
          descriptionParts.push(`Agendado para ${scheduledText}`)
        }
        if (detail?.offsetLabel) {
          descriptionParts.push(detail.offsetLabel)
        }
        break
      case "sent":
        badgeLabel = "Enviado"
        badgeClass = "bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40"
        if (executedText) {
          descriptionParts.push(`Enviado em ${executedText}`)
        }
        if (detail?.offsetLabel) {
          descriptionParts.push(detail.offsetLabel)
        }
        break
      case "failed":
        badgeLabel = "Falha"
        badgeClass = "bg-rose-500/10 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/40"
        if (executedText) {
          descriptionParts.push(`Tentativa em ${executedText}`)
        }
        if (detail?.offsetLabel) {
          descriptionParts.push(detail.offsetLabel)
        }
        if (detail?.errorMessage) {
          descriptionParts.push("Verifique os logs")
        }
        break
      default:
        badgeVariant = "outline"
        badgeLabel = "Sem dados"
        break
    }

    return (
      <div className="flex flex-col gap-1">
        <Badge
          variant={badgeVariant}
          className={`w-fit px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}
        >
          {badgeLabel}
        </Badge>
        {descriptionParts.length > 0 && (
          <span className="text-xs text-muted-foreground">{descriptionParts.join(" • ")}</span>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
                <Calendar className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-blue-100">Central de Lembretes</p>
                <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Lembretes de Agendamentos</h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Acompanhe os bookings do Cal.com, identifique contatos válidos e prepare suas automações de lembrete.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-right text-xs uppercase tracking-wide text-blue-100">
              <div>
                <span className="block text-[11px] font-medium text-blue-100/70">Total</span>
                <span className="text-2xl font-semibold text-white">{stats.total}</span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-blue-100/70">Com telefone</span>
                <span className="text-2xl font-semibold text-emerald-200">{stats.withPhone}</span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-blue-100/70">Sem telefone</span>
                <span className="text-2xl font-semibold text-rose-200">{stats.missingPhone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs uppercase text-slate-400">Total de agendamentos</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">{stats.total}</p>
              </div>
              <div className="rounded-full bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="border-none bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs uppercase text-slate-400">Com telefone</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">{stats.withPhone}</p>
              </div>
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
                <Phone className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="border-none bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs uppercase text-slate-400">Sem telefone</p>
                <p className="mt-1 text-2xl font-semibold text-rose-600 dark:text-rose-300">{stats.missingPhone}</p>
              </div>
              <div className="rounded-full bg-rose-100 p-3 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Filter className="h-4 w-4" />
              Filtros rápidos
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={resetFilters}>
                  Limpar filtros
                </Button>
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-full border-slate-300 px-4 py-2 text-sm font-medium shadow-sm dark:border-slate-700">
                    <Filter className="h-4 w-4" />
                    Filtrar
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-1 rounded-full bg-indigo-500 px-2 text-[10px] uppercase tracking-wide text-white" variant="secondary">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full gap-0 bg-white/95 px-0 py-0 shadow-2xl backdrop-blur sm:max-w-md dark:bg-slate-900/95">
                  <div className="space-y-6 overflow-y-auto px-6 py-6">
                    <SheetHeader className="text-left">
                      <SheetTitle className="text-lg font-semibold">Filtrar agendamentos</SheetTitle>
                      <SheetDescription className="text-sm text-muted-foreground">
                        Use as opções abaixo para refinar os bookings exibidos na lista.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agente</span>
                        {loadingAgents ? (
                          <Skeleton className="h-11 w-full" />
                        ) : (
                          <Select value={selectedAgent ?? ""} onValueChange={setSelectedAgent}>
                            <SelectTrigger className="h-11 border-slate-200 text-left shadow-sm focus:ring-2 focus:ring-indigo-500 dark:border-slate-700">
                              <SelectValue placeholder="Selecione um agente" />
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

                      <Separator className="bg-slate-100 dark:bg-slate-800" />

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-11 border-slate-200 text-left shadow-sm focus:ring-2 focus:ring-indigo-500 dark:border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefone</span>
                          <Select value={phoneFilter} onValueChange={(value: "ALL" | "WITH_PHONE" | "WITHOUT_PHONE") => setPhoneFilter(value)}>
                            <SelectTrigger className="h-11 border-slate-200 text-left shadow-sm focus:ring-2 focus:ring-indigo-500 dark:border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PHONE_FILTER_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator className="bg-slate-100 dark:bg-slate-800" />

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nome do participante</span>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              value={searchName}
                              onChange={(event) => setSearchName(event.target.value)}
                              placeholder="Buscar por nome"
                              className="h-11 border-slate-200 pl-10 shadow-sm focus:ring-2 focus:ring-indigo-500 dark:border-slate-700"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail do participante</span>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              value={searchEmail}
                              onChange={(event) => setSearchEmail(event.target.value)}
                              placeholder="Buscar por e-mail"
                              className="h-11 border-slate-200 pl-10 shadow-sm focus:ring-2 focus:ring-indigo-500 dark:border-slate-700"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefone do participante</span>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              value={searchPhone}
                              onChange={(event) => setSearchPhone(event.target.value)}
                              placeholder="Buscar por telefone"
                              className="h-11 border-slate-200 pl-10 shadow-sm focus:ring-2 focus:ring-indigo-500 dark:border-slate-700"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <SheetFooter className="w-full gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <Button type="button" variant="ghost" className="text-sm" disabled={activeFiltersCount === 0} onClick={resetFilters}>
                      Limpar tudo
                    </Button>
                    <SheetClose asChild>
                      <Button type="button" className="text-sm">
                        Aplicar filtros
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Clique em <span className="font-medium text-indigo-600">Filtrar</span> para acessar as opções avançadas. Os resultados são atualizados automaticamente.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Próximos agendamentos</h2>
            </div>
            <span className="text-xs text-muted-foreground">Resultados ordenados pelos agendamentos mais próximos</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/60 text-xs uppercase text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                <TableRow>
                  <TableHead className="w-[260px]">Evento</TableHead>
                  <TableHead className="w-[160px]">Início</TableHead>
                  <TableHead className="w-[160px]">Fim</TableHead>
                  <TableHead className="w-[220px]">Participante</TableHead>
                  <TableHead className="w-[140px]">Telefone</TableHead>
                  <TableHead className="w-[200px]">Lembrete</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[220px]">Host</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBookings ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                      Nenhum agendamento encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => {
                    const startInfo = formatDateTimeWithOffset(
                      booking.start,
                      booking.attendeeTimeZone ??
                        booking.raw?.timeZone ??
                        booking.raw?.eventType?.timeZone ??
                        null,
                    )
                    const endInfo = formatDateTimeWithOffset(
                      booking.end,
                      booking.attendeeTimeZone ??
                        booking.raw?.timeZone ??
                        booking.raw?.eventType?.timeZone ??
                        null,
                    )

                    return (
                      <TableRow key={booking.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{booking.title}</span>
                          {booking.uid && (
                            <span className="text-xs font-mono text-muted-foreground">UID: {booking.uid}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-700 dark:text-slate-200">
                          {startInfo.formatted}
                          {startInfo.offsetLabel && (
                            <span className="ml-1 text-xs font-medium text-muted-foreground">({startInfo.offsetLabel})</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-700 dark:text-slate-200">
                          {endInfo.formatted}
                          {endInfo.offsetLabel && (
                            <span className="ml-1 text-xs font-medium text-muted-foreground">({endInfo.offsetLabel})</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {booking.attendeeName ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {booking.attendeeEmail ?? "—"}
                          </span>
                          {booking.attendeeTimeZone && (
                            <span className="text-xs text-muted-foreground">{booking.attendeeTimeZone}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.attendeePhone ? (
                          <Badge className="w-max gap-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-200" variant="outline">
                            <Phone className="h-3 w-3" />
                            {booking.attendeePhone}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-max gap-1 border-rose-200 text-rose-500 dark:border-rose-500/40 dark:text-rose-300">
                            <AlertTriangle className="h-3 w-3" /> Sem telefone
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{renderReminderCell(booking)}</TableCell>
                      <TableCell>
                        {booking.status ? (
                          <Badge variant="secondary" className="w-max rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                            {booking.status}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {booking.hostName ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">{booking.hostEmail ?? "—"}</span>
                        </div>
                      </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default BookingRemindersView

