import { randomUUID } from "crypto"
const DEFAULT_V2_HEADER_VERSION = "2024-08-13"
const TOLERANCE_MINUTES = Number(process.env.REMINDER_CRON_TOLERANCE_MINUTES ?? "5")
const REQUEST_TIMEOUT_MS = Number(process.env.REMINDER_CRON_TIMEOUT_MS ?? "10000")
const MAX_LOOKBACK_MINUTES = Number(process.env.REMINDER_CRON_MAX_LOOKBACK_MINUTES ?? "720")
const TRIGGER_GRACE_PERIOD_MS =
  Math.max(0, Number(process.env.REMINDER_TRIGGER_GRACE_MINUTES ?? "5")) * 60 * 1000

function getRandomDelayMs(minSeconds = 5, maxSeconds = 15): number {
  const min = Math.max(0, Math.floor(minSeconds))
  const max = Math.max(min, Math.floor(maxSeconds))
  const randomSeconds = Math.floor(Math.random() * (max - min + 1)) + min
  return randomSeconds * 1000
}

type OffsetUnit = "minutes" | "hours" | "days"

type ReminderTriggerActionType = "webhook" | "whatsapp_message"

interface WhatsappMessageActionConfig {
  version?: number
  channel?: "participant" | "custom"
  customNumber?: string | null
  templateId?: string | null
  templateText?: string | null
}

interface ReminderTriggerRecord {
  id: string
  agent_id: string
  offset_amount: number
  offset_unit: OffsetUnit
  webhook_url?: string | null
  scope_reference?: string | null
  action_type: ReminderTriggerActionType
  action_payload?: any
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

interface AgentRecord {
  id: string
  name: string | null
  user_id: string | null
  calendar_provider?: string | null
  calendar_api_key?: string | null
  calendar_api_url?: string | null
  calendar_api_version?: string | null
  calendar_meeting_id?: string | null
  whatsapp_connection_id?: string | null
}

interface WhatsappConnectionRecord {
  id: string
  api_type?: string | null
  instance_name?: string | null
  instance_token?: string | null
  connection_name?: string | null
}

interface ReminderPayload {
  attendeeName: string | null
  attendeePhone: string | null
  api: string | null
  instanceName: string | null
  instanceApiKey: string | null
  apiUrl: string | null
  meetingTime: string | null
  meetingTimeOffset: string | null
  videoCallUrl: string | null
  empty?: boolean
}

interface NormalizedBooking {
  id: string
  uid?: string
  title?: string | null
  status?: string | null
  startTime?: string | null
  endTime?: string | null
  attendeeName?: string | null
  attendeeEmail?: string | null
  attendeePhone?: string | null
  attendeeTimeZone?: string | null
  hostName?: string | null
  hostEmail?: string | null
  eventUrl?: string | null
  raw: any
}

interface CronSummary {
  totalTriggers: number
  processedTriggers: number
  totalAgents: number
  remindersDue: number
  sent: number
  failed: number
  skippedNoEventType: number
  skippedNoPhone: number
  skippedAlreadySent: number
  skippedTooOld: number
  skippedTooRecent: number
  dryRun: boolean
  details: Array<{
    triggerId: string
    agentId: string
    eventTypeId?: string | null
    attempts: number
    sent: number
    failed: number
    skipped: number
    message?: string
    actionType?: ReminderTriggerActionType
  }>
  runId?: string
}

const OFFSET_TO_MINUTES: Record<OffsetUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 60 * 24,
}

function getSupabaseCredentials() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variáveis de ambiente SUPABASE_URL/SUPABASE_* não configuradas para o cron de lembretes")
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Profile": "impaai",
    "Content-Profile": "impaai",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  }

  return { supabaseUrl, headers }
}

function convertOffsetToMinutes(amount: number, unit: OffsetUnit): number {
  const factor = OFFSET_TO_MINUTES[unit]
  return Math.max(0, Math.round(amount * factor))
}

function normalizeApiTypeLabel(apiType?: string | null): string | null {
  if (!apiType) return null
  const normalized = String(apiType).toLowerCase()
  if (normalized.startsWith("evolution")) {
    return "evo"
  }
  if (normalized.includes("uaz")) {
    return "uazapi"
  }
  return apiType
}

function detectBookingTimeZone(raw: any): string | null {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const priority: Array<string | undefined> = [
    raw?.eventType?.timeZone,
    raw?.eventType?.timezone,
    raw?.user?.timeZone,
    raw?.user?.timezone,
    raw?.calendar?.timeZone,
    raw?.calendar?.timezone,
    raw.timeZone,
    raw.timezone,
    raw.attendeeTimeZone,
    Array.isArray(raw?.attendees) && raw.attendees.length > 0 ? raw.attendees[0]?.timeZone : undefined,
    Array.isArray(raw?.attendees) && raw.attendees.length > 0 ? raw.attendees[0]?.timezone : undefined,
    raw?.responses?.timeZone,
    raw?.responses?.timezone,
  ]

  for (const candidate of priority) {
    if (candidate && typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return null
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

function formatMeetingDateTime(
  date: Date | null,
  timeZone?: string | null,
): { formatted: string | null; offsetLabel: string | null; timeZone: string | null } {
  if (!date || Number.isNaN(date.valueOf())) {
    return { formatted: null, offsetLabel: null, timeZone: null }
  }

  const fallbackTz = "America/Sao_Paulo"
  const tz = timeZone && timeZone.trim().length > 0 ? timeZone : fallbackTz

  const buildFormatted = (zone: string) => {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: zone,
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
    return { formatted, offsetLabel, timeZone: zone }
  }

  try {
    const formatted = buildFormatted(tz)
    if (formatted) return formatted
  } catch (error) {
    // tenta fallback
  }

  if (tz !== fallbackTz) {
    try {
      const formatted = buildFormatted(fallbackTz)
      if (formatted) return formatted
    } catch (error) {
      return { formatted: null, offsetLabel: null, timeZone: null }
    }
  }

  return { formatted: null, offsetLabel: null, timeZone: null }
}

function formatDateOnly(date: Date | null, timeZone?: string | null): string | null {
  if (!date || Number.isNaN(date.valueOf())) {
    return null
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: timeZone && timeZone.trim().length > 0 ? timeZone : "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  } catch {
    return null
  }
}

function formatTimeOnly(date: Date | null, timeZone?: string | null): string | null {
  if (!date || Number.isNaN(date.valueOf())) {
    return null
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: timeZone && timeZone.trim().length > 0 ? timeZone : "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  } catch {
    return null
  }
}

function sanitizePhoneNumber(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }
  const digits = String(value).replace(/\D+/g, "")
  return digits.length > 0 ? digits : null
}

interface WhatsappMessageActionConfigNormalized {
  channel: "participant" | "custom"
  customNumber: string | null
  templateId: string | null
  templateText: string
}

function normalizeWhatsappMessageConfig(raw: any): WhatsappMessageActionConfigNormalized {
  const channel = raw?.channel === "custom" ? "custom" : "participant"
  const templateText = typeof raw?.templateText === "string" ? raw.templateText : typeof raw?.template?.text === "string" ? raw.template.text : ""
  const templateId =
    raw?.templateId && typeof raw.templateId === "string"
      ? raw.templateId
      : raw?.template?.id && typeof raw.template.id === "string"
        ? raw.template.id
        : null

  return {
    channel,
    customNumber: channel === "custom" ? sanitizePhoneNumber(raw?.customNumber ?? raw?.number ?? null) : null,
    templateId,
    templateText,
  }
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  if (!template) {
    return ""
  }

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key] ?? ""
    return value
  })
}

function getFirstName(fullName?: string | null): string | null {
  if (!fullName || typeof fullName !== "string") {
    return null
  }
  const trimmed = fullName.trim()
  if (!trimmed) {
    return null
  }
  const [first] = trimmed.split(/\s+/)
  return first ?? trimmed
}

function extractEventLocation(booking: NormalizedBooking): string | null {
  const raw = booking.raw ?? {}
  const candidates: any[] = [
    booking.raw?.location,
    raw?.location?.name,
    raw?.location?.label,
    raw?.location?.value,
    raw?.eventType?.location,
    raw?.metadata?.location,
    raw?.metadata?.eventLocation,
    raw?.responses?.location?.optionValue,
    raw?.responses?.location?.value,
    raw?.responses?.location,
  ]

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return null
}

function buildWhatsappTemplateVariables(params: {
  booking: NormalizedBooking
  agent: AgentRecord
  meetingTimeInfo: { formatted: string | null; offsetLabel: string | null; timeZone: string | null }
  attendeeTimeZone: string | null
  startDate: Date | null
  endDate: Date | null
  videoCallUrl: string | null
}): Record<string, string> {
  const { booking, agent, meetingTimeInfo, attendeeTimeZone, startDate, endDate, videoCallUrl } = params

  const participantName = booking.attendeeName ?? ""
  const organizerName = booking.hostName ?? agent.name ?? ""

  const eventDate = formatDateOnly(startDate, attendeeTimeZone)
  const eventStartTime = formatTimeOnly(startDate, attendeeTimeZone)
  const eventEndTime = formatTimeOnly(endDate, attendeeTimeZone)
  const eventTimeZoneLabel =
    meetingTimeInfo.offsetLabel ??
    meetingTimeInfo.timeZone ??
    (attendeeTimeZone && attendeeTimeZone.trim().length > 0 ? attendeeTimeZone : "")

  return {
    participantName,
    participantFirstName: getFirstName(participantName) ?? "",
    participantEmail: booking.attendeeEmail ?? "",
    participantPhone: booking.attendeePhone ?? "",
    organizerName,
    organizerFirstName: getFirstName(organizerName) ?? "",
    organizerEmail: booking.hostEmail ?? "",
    eventName: booking.title ?? "",
    eventId: booking.uid ?? booking.id ?? "",
    eventDateTime: meetingTimeInfo.formatted ?? "",
    eventDate: eventDate ?? "",
    eventStartTime: eventStartTime ?? "",
    eventEndTime: eventEndTime ?? "",
    eventTimeZone: eventTimeZoneLabel ?? "",
    eventLocation: extractEventLocation(booking) ?? "",
    eventLink: videoCallUrl ?? "",
  }
}

function extractVideoCallUrl(booking: NormalizedBooking): string | null {
  const candidates = [
    booking.eventUrl,
    booking.raw?.videoCallUrl,
    booking.raw?.url,
    booking.raw?.metadata?.videoCallUrl,
    booking.raw?.metadata?.eventUrl,
    booking.raw?.metadata?.bookingUrl,
    booking.raw?.metadata?.videoCall?.url,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return null
}

async function getIntegrationConfig(
  type: "uazapi" | "evolution_api",
): Promise<Record<string, any> | null> {
  if (integrationConfigCache.has(type)) {
    return integrationConfigCache.get(type) ?? null
  }

  try {
    const { supabaseUrl, headers } = getSupabaseCredentials()
    const response = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=config,is_active&type=eq.${type}&is_active=eq.true&limit=1`,
      { headers, cache: "no-store" },
    )

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      console.error(`Erro ao buscar configuração da integração ${type}:`, response.status, text)
      integrationConfigCache.set(type, null)
      return null
    }

    const data = await response.json()
    const rawConfig = Array.isArray(data) && data.length > 0 ? data[0]?.config ?? null : null
    const config =
      rawConfig && typeof rawConfig === "object" && !Array.isArray(rawConfig) ? rawConfig : null

    integrationConfigCache.set(type, config)
    return config
  } catch (error) {
    console.error(`Erro inesperado ao buscar configuração da integração ${type}:`, error)
    integrationConfigCache.set(type, null)
    return null
  }
}

async function resolveApiBaseUrl(
  apiType: string | null | undefined,
): Promise<string | null> {
  if (!apiType) return null

  const normalized = String(apiType).toLowerCase()
  if (normalized.startsWith("evolution")) {
    const config = await getIntegrationConfig("evolution_api")
    return config?.apiUrl ?? null
  }
  if (normalized.includes("uaz")) {
    const config = await getIntegrationConfig("uazapi")
    return config?.serverUrl ?? null
  }
  return null
}

async function fetchWhatsappConnection(connectionId: string): Promise<WhatsappConnectionRecord | null> {
  if (connectionCache.has(connectionId)) {
    return connectionCache.get(connectionId) ?? null
  }

  try {
    const { supabaseUrl, headers } = getSupabaseCredentials()
    const response = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=id,api_type,instance_name,instance_token,connection_name&limit=1&id=eq.${connectionId}`,
      { headers, cache: "no-store" },
    )

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      console.error("Erro ao buscar conexão WhatsApp:", response.status, text)
      connectionCache.set(connectionId, null)
      return null
    }

    const data = await response.json()
    const record =
      Array.isArray(data) && data.length > 0
        ? {
            id: String(data[0]?.id),
            api_type: data[0]?.api_type ?? null,
            instance_name: data[0]?.instance_name ?? null,
            instance_token: data[0]?.instance_token ?? null,
            connection_name: data[0]?.connection_name ?? null,
          }
        : null

    connectionCache.set(connectionId, record)
    return record
  } catch (error) {
    console.error("Erro inesperado ao buscar conexão WhatsApp:", error)
    connectionCache.set(connectionId, null)
    return null
  }
}

function normalizeBooking(raw: any): NormalizedBooking {
  const attendees: any[] = Array.isArray(raw?.attendees) ? raw.attendees : []
  const primaryAttendee = attendees[0] ?? null
  const responses = raw?.responses ?? {}

  const hosts: any[] = Array.isArray(raw?.hosts) ? raw.hosts : []
  const primaryHost = hosts[0] ?? raw?.user ?? null

  const attendeePhone =
    responses?.attendeePhoneNumber ??
    primaryAttendee?.phoneNumber ??
    null

  const detectedTimeZone = detectBookingTimeZone(raw)

  const start = raw?.start ?? raw?.startTime ?? null
  const end = raw?.end ?? raw?.endTime ?? null

  const eventUrl =
    raw?.url ??
    raw?.metadata?.bookingUrl ??
    raw?.metadata?.eventUrl ??
    raw?.metadata?.videoCallUrl ??
    null

  return {
    id: String(raw?.id ?? raw?.uid ?? randomUUID()),
    uid: raw?.uid ?? null,
    title: raw?.title ?? raw?.eventType?.name ?? null,
    status: raw?.status ?? null,
    startTime: start,
    endTime: end,
    attendeeName: primaryAttendee?.name ?? responses?.name ?? null,
    attendeeEmail: primaryAttendee?.email ?? responses?.email ?? null,
    attendeePhone: attendeePhone ?? null,
    attendeeTimeZone:
      detectedTimeZone ??
      primaryAttendee?.timeZone ??
      primaryAttendee?.timezone ??
      responses?.timeZone ??
      responses?.timezone ??
      null,
    hostName: primaryHost?.name ?? null,
    hostEmail: primaryHost?.email ?? null,
    eventUrl,
    raw,
  }
}

async function fetchTriggers(): Promise<ReminderTriggerRecord[]> {
  const { supabaseUrl, headers } = getSupabaseCredentials()

  const response = await fetch(`${supabaseUrl}/rest/v1/reminder_triggers?select=*&is_active=eq.true`, { headers, cache: "no-store" })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Erro ao buscar gatilhos: ${response.status} - ${text}`)
  }

  const triggers = await response.json()
  if (!Array.isArray(triggers)) {
    return []
  }

  return triggers.map((raw: any) => {
    // ✅ SEGURANÇA: Validar que agent_id existe e é válido
    const agent_id = String(raw?.agent_id ?? "").trim()
    if (!agent_id) {
      console.warn(`[SECURITY] Gatilho ${raw?.id} sem agent_id válido, será ignorado`)
      return null
    }

    return {
      id: String(raw?.id ?? ""),
      agent_id,
      offset_amount: Number(raw?.offset_amount ?? 0),
      offset_unit: (raw?.offset_unit ?? "minutes") as OffsetUnit,
      webhook_url: raw?.webhook_url ?? null,
      scope_reference: raw?.scope_reference ?? null,
      action_type: (raw?.action_type ?? "webhook") as ReminderTriggerActionType,
      action_payload: raw?.action_payload ?? {},
      is_active: Boolean(raw?.is_active ?? true),
      created_at: raw?.created_at ?? null,
      updated_at: raw?.updated_at ?? null,
    }
  }).filter((t): t is ReminderTriggerRecord => t !== null)
}

const agentCache = new Map<string, AgentRecord | null>()
const connectionCache = new Map<string, WhatsappConnectionRecord | null>()
const integrationConfigCache = new Map<string, any>()

async function fetchAgent(agentId: string): Promise<AgentRecord | null> {
  if (agentCache.has(agentId)) {
    return agentCache.get(agentId) ?? null
  }

  // ✅ SEGURANÇA: Validar agentId antes de fazer a query
  if (!agentId || typeof agentId !== "string" || agentId.trim().length === 0) {
    console.warn(`[SECURITY] fetchAgent chamado com agentId inválido: ${agentId}`)
    return null
  }

  const { supabaseUrl, headers } = getSupabaseCredentials()
  const response = await fetch(
    `${supabaseUrl}/rest/v1/ai_agents?select=id,name,user_id,calendar_provider,calendar_api_key,calendar_api_url,calendar_api_version,calendar_meeting_id,whatsapp_connection_id&limit=1&id=eq.${agentId}`,
    { headers, cache: "no-store" },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Erro ao buscar agente ${agentId}: ${response.status} - ${text}`)
  }

  const data = await response.json()
  const rawAgent = Array.isArray(data) && data.length > 0 ? data[0] : null
  const agent: AgentRecord | null = rawAgent
    ? {
        id: String(rawAgent.id),
        name: rawAgent.name ?? null,
        user_id: rawAgent.user_id ?? null,
        calendar_provider: rawAgent.calendar_provider ?? null,
        calendar_api_key: rawAgent.calendar_api_key ?? null,
        calendar_api_url: rawAgent.calendar_api_url ?? null,
        calendar_api_version: rawAgent.calendar_api_version ?? null,
        calendar_meeting_id: rawAgent.calendar_meeting_id ?? null,
        whatsapp_connection_id: rawAgent.whatsapp_connection_id ?? null,
      }
    : null

  // ✅ SEGURANÇA: Log quando agente não é encontrado (possível tentativa de acesso indevido)
  if (!agent) {
    console.warn(`[SECURITY] Agente não encontrado: ${agentId}`)
  }

  agentCache.set(agentId, agent)
  return agent
}

async function checkReminderAlreadySent(triggerId: string, bookingUid: string): Promise<boolean> {
  const { supabaseUrl, headers } = getSupabaseCredentials()
  const encodedUid = encodeURIComponent(bookingUid)
  const response = await fetch(
    `${supabaseUrl}/rest/v1/reminder_trigger_logs?select=id&trigger_id=eq.${triggerId}&booking_uid=eq.${encodedUid}&limit=1`,
    { headers, cache: "no-store" },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Erro ao consultar logs de lembrete: ${response.status} - ${text}`)
  }

  const data = await response.json()
  return Array.isArray(data) && data.length > 0
}

async function insertReminderLog(entry: {
  triggerId: string
  bookingUid: string
  scheduledFor: string
  success: boolean
  webhookStatus: number | null
  webhookResponse: any
  errorMessage?: string | null
}) {
  const { supabaseUrl, headers } = getSupabaseCredentials()

  const payload = {
    trigger_id: entry.triggerId,
    booking_uid: entry.bookingUid,
    scheduled_for: entry.scheduledFor,
    executed_at: new Date().toISOString(),
    success: entry.success,
    webhook_status: entry.webhookStatus,
    webhook_response: entry.webhookResponse ?? null,
    error_message: entry.errorMessage ?? null,
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/reminder_trigger_logs`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error("Erro ao registrar log de lembrete:", response.status, text)
  }
}

async function fetchCalcomBookings(
  agent: AgentRecord,
  eventTypeId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<NormalizedBooking[]> {
  const baseUrl = (agent.calendar_api_url || (agent.calendar_api_version?.toLowerCase().startsWith("v2") ? "https://api.cal.com/v2" : "https://api.cal.com/v1")).replace(/\/+$/, "")
  const normalizedVersion = (agent.calendar_api_version || "v1").toLowerCase()
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  const bookings: NormalizedBooking[] = []

  if (!agent.calendar_api_key) {
    return bookings
  }

  if (normalizedVersion.startsWith("v2")) {
    headers.Authorization = `Bearer ${agent.calendar_api_key}`
    headers["cal-api-version"] = DEFAULT_V2_HEADER_VERSION

    const url = new URL(`${baseUrl}/bookings`)
    url.searchParams.set("eventTypeId", eventTypeId)
    url.searchParams.set("status", "accepted")
    url.searchParams.set("startTime>=", rangeStart.toISOString())
    url.searchParams.set("startTime<=", rangeEnd.toISOString())
    url.searchParams.set("limit", "100")

    const response = await fetch(url.toString(), { headers, cache: "no-store" })
    if (!response.ok) {
      const text = await response.text()
      console.error("Falha ao consultar Cal.com v2:", response.status, text)
      return bookings
    }

    const data = await response.json()
    const records = Array.isArray(data?.data) ? data.data : []
    for (const record of records) {
      bookings.push(normalizeBooking(record))
    }
  } else {
    const url = new URL(`${baseUrl}/bookings`)
    url.searchParams.set("apiKey", agent.calendar_api_key)
    url.searchParams.set("eventTypeId", eventTypeId)
    url.searchParams.set("status", "upcoming")
    url.searchParams.set("startTimeMin", rangeStart.toISOString())
    url.searchParams.set("startTimeMax", rangeEnd.toISOString())
    url.searchParams.set("limit", "100")

    const response = await fetch(url.toString(), { headers, cache: "no-store" })
    if (!response.ok) {
      const text = await response.text()
      console.error("Falha ao consultar Cal.com v1:", response.status, text)
      return bookings
    }

    const data = await response.json()
    const records = Array.isArray(data?.bookings) ? data.bookings : []
    for (const record of records) {
      bookings.push(normalizeBooking(record))
    }
  }

  return bookings
}

async function insertCronRun(params: { startedAt: string; dryRun: boolean }) {
  try {
    const { supabaseUrl, headers } = getSupabaseCredentials()
    const response = await fetch(`${supabaseUrl}/rest/v1/reminder_cron_runs`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        started_at: params.startedAt,
        dry_run: params.dryRun,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Falha ao registrar início do cron: ${response.status} - ${text}`)
    }

    const data = await response.json()
    const row = Array.isArray(data) ? data[0] : data
    return row?.id ? String(row.id) : null
  } catch (error) {
    console.error("Erro ao registrar início do cron:", error)
    return null
  }
}

async function updateCronRun(
  runId: string,
  params: {
    finishedAt: string
    durationMs: number
    success: boolean
    summary: CronSummary
    errorMessage?: string | null
  },
) {
  try {
    const { supabaseUrl, headers } = getSupabaseCredentials()
    const response = await fetch(`${supabaseUrl}/rest/v1/reminder_cron_runs?id=eq.${runId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        finished_at: params.finishedAt,
        duration_ms: params.durationMs,
        success: params.success,
        reminders_due: params.summary.remindersDue,
        reminders_sent: params.summary.sent,
        reminders_failed: params.summary.failed,
        triggers_processed: params.summary.processedTriggers,
        message: params.errorMessage ?? null,
        details: params.summary.details ?? null,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Falha ao atualizar log do cron: ${response.status} - ${text}`)
    }
  } catch (error) {
    console.error("Erro ao atualizar log do cron:", error)
  }
}

async function sendWebhook(url: string, payload: ReminderPayload) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const text = await response.text()
    let parsedBody: any = null
    if (text) {
      try {
        parsedBody = JSON.parse(text)
      } catch (error) {
        parsedBody = text.slice(0, 2000)
      }
    }

    return {
      success: response.ok,
      status: response.status,
      body: parsedBody,
      error: response.ok ? null : `Webhook respondeu com status ${response.status}`,
    }
  } catch (error: any) {
    return {
      success: false,
      status: null,
      body: null,
      error: error?.message ?? "Erro desconhecido ao chamar webhook",
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function sendUazapiTextMessage(options: {
  serverUrl: string | null
  instanceToken: string | null
  payload: {
    number: string
    text: string
    linkPreview?: boolean
    delay?: number
  }
}) {
  const { serverUrl, instanceToken, payload } = options

  if (!serverUrl || !instanceToken) {
    return {
      success: false,
      status: null,
      body: null,
      error: "Configuração da Uazapi ausente (serverUrl ou instanceToken)",
    }
  }

  if (!payload.number || !payload.text) {
    return {
      success: false,
      status: null,
      body: null,
      error: "Número ou mensagem vazios",
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const baseUrl = serverUrl.replace(/\/+$/, "")
    const response = await fetch(`${baseUrl}/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: instanceToken,
      },
      body: JSON.stringify({
        ...payload,
        linkPreview: payload.linkPreview ?? true,
      }),
      signal: controller.signal,
    })

    const text = await response.text()
    let parsedBody: any = null
    if (text) {
      try {
        parsedBody = JSON.parse(text)
      } catch (error) {
        parsedBody = text.slice(0, 2000)
      }
    }

    return {
      success: response.ok,
      status: response.status,
      body: parsedBody,
      error: response.ok ? null : `Uazapi respondeu com status ${response.status}`,
    }
  } catch (error: any) {
    return {
      success: false,
      status: null,
      body: null,
      error: error?.message ?? "Erro desconhecido ao enviar mensagem via Uazapi",
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function runReminderCron({ dryRun = false }: { dryRun?: boolean } = {}): Promise<CronSummary> {
  const startedAt = new Date()
  const runId = await insertCronRun({ startedAt: startedAt.toISOString(), dryRun })
  const summary: CronSummary = {
    totalTriggers: 0,
    processedTriggers: 0,
    totalAgents: 0,
    remindersDue: 0,
    sent: 0,
    failed: 0,
    skippedNoEventType: 0,
    skippedNoPhone: 0,
    skippedAlreadySent: 0,
    skippedTooOld: 0,
    skippedTooRecent: 0,
    dryRun,
    details: [],
    runId: runId ?? undefined,
  }

  agentCache.clear()
  connectionCache.clear()
  integrationConfigCache.clear()

  const now = Date.now()
  const toleranceMs = TOLERANCE_MINUTES * 60 * 1000
  const maxLookbackMs = Math.max(0, MAX_LOOKBACK_MINUTES) * 60 * 1000
  const processedAgents = new Set<string>()

  let fatalError: any = null
  let errorMessage: string | null = null

  try {
    const triggers = await fetchTriggers()
    summary.totalTriggers = triggers.length

    for (const trigger of triggers) {
      summary.processedTriggers += 1

      const actionType: ReminderTriggerActionType = trigger.action_type ?? "webhook"
      const detail: CronSummary["details"][number] = {
        triggerId: trigger.id,
        agentId: trigger.agent_id,
        eventTypeId: trigger.scope_reference ?? null,
        attempts: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        message: undefined as string | undefined,
        actionType,
      }
      const rawActionPayload =
        trigger.action_payload && typeof trigger.action_payload === "object" ? trigger.action_payload : {}
      const messageActionConfig =
        actionType === "whatsapp_message" ? normalizeWhatsappMessageConfig(rawActionPayload) : null

      const triggerCreatedAtMs = trigger.created_at ? new Date(trigger.created_at).getTime() : Number.NaN
      const triggerUpdatedAtMs = trigger.updated_at ? new Date(trigger.updated_at).getTime() : Number.NaN
      const activationTimestamp = Math.max(
        Number.isFinite(triggerCreatedAtMs) ? triggerCreatedAtMs : Number.NEGATIVE_INFINITY,
        Number.isFinite(triggerUpdatedAtMs) ? triggerUpdatedAtMs : Number.NEGATIVE_INFINITY,
      )
      const graceCutoffMs =
        Number.isFinite(activationTimestamp) && activationTimestamp !== Number.NEGATIVE_INFINITY
          ? activationTimestamp + TRIGGER_GRACE_PERIOD_MS
          : null

      try {
        const agent = await fetchAgent(trigger.agent_id)
        if (!agent) {
          detail.message = "Agente não encontrado"
          summary.details.push(detail)
          continue
        }

        processedAgents.add(agent.id)

        const connection =
          agent.whatsapp_connection_id && agent.whatsapp_connection_id.trim().length > 0
            ? await fetchWhatsappConnection(agent.whatsapp_connection_id)
            : null
        const connectionApiLabel = normalizeApiTypeLabel(connection?.api_type ?? null)
        const connectionApiUrl = await resolveApiBaseUrl(connection?.api_type ?? null)
        const instanceName = connection?.instance_name ?? connection?.connection_name ?? null
        const instanceApiKey = connection?.instance_token ?? null

        if (actionType === "whatsapp_message") {
          if (!connection) {
            detail.message = "Gatilho WhatsApp requer uma conexão WhatsApp ativa"
            summary.details.push(detail)
            continue
          }
          if (connectionApiLabel !== "uazapi") {
            detail.message = "Gatilho WhatsApp suporta apenas conexões Uazapi no momento"
            summary.details.push(detail)
            continue
          }
          if (!connectionApiUrl || !instanceApiKey) {
            detail.message = "Conexão Uazapi sem serverUrl ou token"
            summary.details.push(detail)
            continue
          }
        }

        if (!agent.calendar_api_key) {
          detail.message = "Agente sem API key do Cal.com"
          summary.details.push(detail)
          continue
        }

        const eventTypeId = (trigger.scope_reference || agent.calendar_meeting_id || "").trim()
        if (!eventTypeId) {
          summary.skippedNoEventType += 1
          detail.message = "eventTypeId ausente no gatilho ou agente"
          summary.details.push(detail)
          continue
        }
        detail.eventTypeId = eventTypeId

        // ✅ SEGURANÇA: Validação cruzada - certificar que eventTypeId pertence a este agente
        // Para evitar que um gatilho alterado maliciosamente dispare eventos de outro agente
        const scopeType = trigger.scope_reference ? "trigger" : "agent"
        if (scopeType === "trigger" && !trigger.scope_reference) {
          // Se estava usando scope_reference, precisa validar que o agente tem permissão
          console.warn(
            `[SECURITY] Gatilho ${trigger.id}: eventTypeId ${eventTypeId} vem de trigger.scope_reference, validação necessária`,
          )
        }

        const offsetMinutes = convertOffsetToMinutes(trigger.offset_amount, trigger.offset_unit)
        const offsetMs = offsetMinutes * 60 * 1000

        const rangeStart = new Date(now - toleranceMs)
        if (maxLookbackMs > 0) {
          rangeStart.setTime(rangeStart.getTime() - maxLookbackMs)
        }
        const rangeEnd = new Date(now + offsetMs + toleranceMs)

        const bookings = await fetchCalcomBookings(agent, eventTypeId, rangeStart, rangeEnd)
          .then((list) =>
            list.filter((item) => {
              const status = (item.status ?? "").toUpperCase()
              return status === "ACCEPTED" || status === "CONFIRMED" || status === "UPCOMING"
            }),
          )
        detail.message = `window ${rangeStart.toISOString()} -> ${rangeEnd.toISOString()} (bookings=${bookings.length})`

        // ✅ SEGURANÇA: Se nenhum agendamento foi encontrado com API key de um agente,
        // mas era esperado encontrar, isso PODE indicar que o agente_id foi alterado
        if (bookings.length === 0 && agent.calendar_api_key) {
          console.warn(
            `[SECURITY] Gatilho ${trigger.id}: Nenhum agendamento encontrado para agente ${agent.id} eventType ${eventTypeId}. Pode indicar alteração de agent_id.`,
          )
        }

        const sortedBookings = bookings
          .map((booking) => {
            const startIso = booking.startTime
            const startDate = startIso ? new Date(startIso) : null
            return { booking, startIso, startMs: startDate ? startDate.getTime() : Number.NaN }
          })
          .filter((entry) => Number.isFinite(entry.startMs))
          .sort((a, b) => a.startMs - b.startMs)

        for (const { booking, startIso, startMs } of sortedBookings) {
          const startIso = booking.startTime
          if (!startIso) {
            detail.skipped += 1
            continue
          }

          const startDate = new Date(startIso)
          const scheduledForMs = startMs - offsetMs
          if (scheduledForMs > now) {
            continue
          }

          if (maxLookbackMs > 0 && scheduledForMs < now - maxLookbackMs) {
            summary.skippedTooOld += 1
            detail.skipped += 1
            continue
          }

          if (graceCutoffMs !== null && scheduledForMs < graceCutoffMs) {
            const graceInfo = {
              triggerId: trigger.id,
              scheduledFor: new Date(scheduledForMs).toISOString(),
              activation: Number.isFinite(activationTimestamp) ? new Date(activationTimestamp).toISOString() : null,
              graceCutoff: new Date(graceCutoffMs).toISOString(),
            }
            console.log("[reminder-cron] ⏳ Ignorando por carência", graceInfo)
            detail.message = detail.message
              ? `${detail.message} | Ignorado por carência até ${graceInfo.graceCutoff}`
              : `Ignorado por carência até ${graceInfo.graceCutoff}`
            summary.skippedTooRecent += 1
            detail.skipped += 1
            continue
          }

          const bookingUid = String(booking.uid ?? booking.id ?? booking.raw?.uid ?? booking.raw?.id ?? "")
          if (!bookingUid) {
            detail.skipped += 1
            continue
          }

          summary.remindersDue += 1
          detail.attempts += 1

          const attendeePhoneRaw = booking.attendeePhone ?? null
          const sanitizedParticipantNumber = sanitizePhoneNumber(attendeePhoneRaw)
          const requiresParticipantPhone =
            actionType !== "whatsapp_message" || (messageActionConfig?.channel ?? "participant") === "participant"

          if (requiresParticipantPhone && !sanitizedParticipantNumber) {
            summary.skippedNoPhone += 1
            detail.skipped += 1
            continue
          }

          const alreadySent = await checkReminderAlreadySent(trigger.id, bookingUid)
          if (alreadySent) {
            summary.skippedAlreadySent += 1
            detail.skipped += 1
            continue
          }

          if (dryRun) {
            detail.sent += 1
            summary.sent += 1
            continue
          }

          const scheduledForIso = new Date(scheduledForMs).toISOString()
          const attendeeTimeZone =
            booking.attendeeTimeZone ??
            booking.raw?.timeZone ??
            booking.raw?.eventType?.timeZone ??
            null
          const meetingTimeInfo = formatMeetingDateTime(startDate, attendeeTimeZone)
          const endDate = booking.endTime ? new Date(booking.endTime) : null
          const videoCallUrl = extractVideoCallUrl(booking)

          let actionSuccess = false
          let actionStatus: number | null = null
          let actionResponse: any = null
          let actionError: string | null = null

          if (actionType === "webhook") {
            if (!trigger.webhook_url) {
              summary.failed += 1
              detail.failed += 1
              detail.message = detail.message
                ? `${detail.message} | Falha: webhook_url ausente`
                : "Falha: webhook_url ausente"

              await insertReminderLog({
                triggerId: trigger.id,
                bookingUid,
                scheduledFor: scheduledForIso,
                success: false,
                webhookStatus: null,
                webhookResponse: null,
                errorMessage: "webhook_url ausente no gatilho",
              })

              continue
            }

            const payload: ReminderPayload = {
              attendeeName: booking.attendeeName ?? null,
              attendeePhone: booking.attendeePhone ?? null,
              api: connectionApiLabel,
              instanceName,
              instanceApiKey,
              apiUrl: connectionApiUrl,
              meetingTime: meetingTimeInfo.formatted,
              meetingTimeOffset: meetingTimeInfo.offsetLabel,
              videoCallUrl,
            }

            const webhookResult = await sendWebhook(trigger.webhook_url, payload)
            actionSuccess = webhookResult.success
            actionStatus = webhookResult.status
            actionResponse = webhookResult.body
            actionError = webhookResult.error ?? null
          } else {
            const recipientNumber =
              (messageActionConfig?.channel ?? "participant") === "custom"
                ? messageActionConfig?.customNumber ?? null
                : sanitizedParticipantNumber

            if (!recipientNumber) {
              summary.failed += 1
              detail.failed += 1
              detail.message = detail.message
                ? `${detail.message} | Falha: número do destinatário ausente`
                : "Falha: número do destinatário ausente"

              await insertReminderLog({
                triggerId: trigger.id,
                bookingUid,
                scheduledFor: scheduledForIso,
                success: false,
                webhookStatus: null,
                webhookResponse: {
                  request: {
                    number: recipientNumber,
                    channel: messageActionConfig?.channel ?? "participant",
                  },
                },
                errorMessage: "Número do destinatário ausente",
              })

              continue
            }

            const templateText = (messageActionConfig?.templateText ?? "").trim()
            if (!templateText) {
              summary.failed += 1
              detail.failed += 1
              detail.message = detail.message
                ? `${detail.message} | Falha: template de mensagem vazio`
                : "Falha: template de mensagem vazio"

              await insertReminderLog({
                triggerId: trigger.id,
                bookingUid,
                scheduledFor: scheduledForIso,
                success: false,
                webhookStatus: null,
                webhookResponse: {
                  request: {
                    number: recipientNumber,
                    templateId: messageActionConfig?.templateId ?? null,
                  },
                },
                errorMessage: "Template de mensagem vazio",
              })

              continue
            }

            const templateVariables = buildWhatsappTemplateVariables({
              booking,
              agent,
              meetingTimeInfo,
              attendeeTimeZone,
              startDate,
              endDate,
              videoCallUrl,
            })
            const renderedText = renderTemplate(templateText, templateVariables).trim()

            if (!renderedText) {
              summary.failed += 1
              detail.failed += 1
              detail.message = detail.message
                ? `${detail.message} | Falha: renderização do template resultou em texto vazio`
                : "Falha: renderização do template resultou em texto vazio"

              await insertReminderLog({
                triggerId: trigger.id,
                bookingUid,
                scheduledFor: scheduledForIso,
                success: false,
                webhookStatus: null,
                webhookResponse: {
                  request: {
                    number: recipientNumber,
                    templateId: messageActionConfig?.templateId ?? null,
                    preview: templateText.slice(0, 120),
                  },
                },
                errorMessage: "Template de mensagem resultou em conteúdo vazio",
              })

              continue
            }

            const delayMs = getRandomDelayMs(5, 15)
            
            // ✅ SEGURANÇA: Log de auditoria antes de enviar mensagem
            // Documenta: agente + conexão + destinatário + agendamento
            console.log(`[reminder-cron][AUDIT] Enviando mensagem`, {
              triggerId: trigger.id,
              agentId: agent.id,
              agentName: agent.name,
              connectionId: agent.whatsapp_connection_id,
              recipientNumber: recipientNumber.slice(-4).padStart(recipientNumber.length, "*"), // Mascarar número
              bookingUid: bookingUid.slice(0, 8), // Primeiros 8 chars
              eventTypeId,
              timestamp: new Date().toISOString(),
            })

            const messageResult = await sendUazapiTextMessage({
              serverUrl: connectionApiUrl ?? null,
              instanceToken: instanceApiKey ?? null,
              payload: {
                number: recipientNumber,
                text: renderedText,
                linkPreview: true,
                delay: delayMs,
              },
            })

            actionSuccess = messageResult.success
            actionStatus = messageResult.status
            actionResponse = {
              response: messageResult.body,
              request: {
                number: recipientNumber,
                delayMs,
                templateId: messageActionConfig?.templateId ?? null,
              },
              messagePreview: renderedText.slice(0, 500),
            }
            actionError = messageResult.error ?? null

            detail.message = detail.message
              ? `${detail.message} | Mensagem WhatsApp ${actionSuccess ? "processada" : "falhou"} (${recipientNumber})`
              : `Mensagem WhatsApp ${actionSuccess ? "processada" : "falhou"} (${recipientNumber})`
          }

          await insertReminderLog({
            triggerId: trigger.id,
            bookingUid,
            scheduledFor: scheduledForIso,
            success: actionSuccess,
            webhookStatus: actionStatus,
            webhookResponse: actionResponse,
            errorMessage: actionError,
          })

          if (actionSuccess) {
            summary.sent += 1
            detail.sent += 1
          } else {
            summary.failed += 1
            detail.failed += 1
          }
        }

        /**
         * Heartbeat desativado.
         * Para reativar o envio de payload vazio, remova os comentários do bloco abaixo.
         */
        // if (!dryRun && detail.sent === 0 && detail.failed === 0) {
        //   const heartbeatPayload: ReminderPayload = {
        //     attendeeName: null,
        //     attendeePhone: null,
        //     api: connectionApiLabel,
        //     instanceName,
        //     instanceApiKey,
        //     apiUrl: connectionApiUrl,
        //     meetingTime: null,
        //     videoCallUrl: null,
        //     empty: true,
        //   }
        //
        //   const heartbeatResult = await sendWebhook(trigger.webhook_url, heartbeatPayload)
        //
        //   if (heartbeatResult.success) {
        //     detail.sent += 1
        //     summary.sent += 1
        //     detail.message = detail.message
        //       ? `${detail.message} | Heartbeat (payload vazio) enviado`
        //       : "Heartbeat (payload vazio) enviado"
        //   } else {
        //     const failureReason =
        //       heartbeatResult.error ??
        //       (heartbeatResult.status !== null ? `status ${heartbeatResult.status}` : "erro desconhecido")
        //     detail.message = detail.message
        //       ? `${detail.message} | Heartbeat (payload vazio) falhou: ${failureReason}`
        //       : `Heartbeat (payload vazio) falhou: ${failureReason}`
        //     detail.failed += 1
        //     summary.failed += 1
        //   }
        // }
      } catch (error: any) {
        console.error("Erro ao processar gatilho:", trigger.id, error)
        detail.message = error?.message ?? "Erro desconhecido"
      }

      summary.details.push(detail)
    }

    summary.totalAgents = processedAgents.size
  } catch (error: any) {
    fatalError = error
    errorMessage = error?.message ?? "Erro desconhecido"
    console.error("Erro durante execução completa do cron:", error)
  } finally {
    if (runId) {
      const finishedAt = new Date()
      const success = !fatalError && summary.failed === 0
      try {
        await updateCronRun(runId, {
          finishedAt: finishedAt.toISOString(),
          durationMs: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
          success,
          summary,
          errorMessage,
        })
      } catch (error) {
        console.error("Erro ao finalizar log do cron:", error)
      }
    }
  }

  if (fatalError) {
    throw fatalError
  }

  return summary
}

export async function requireCronSecret(request: Request) {
  const configuredSecret = process.env.REMINDER_CRON_SECRET
  if (!configuredSecret) {
    throw new Error("REMINDER_CRON_SECRET não configurado. Defina a variável de ambiente com um token seguro.")
  }

  const headerSecret = request.headers.get("x-cron-secret")
  const bearer = request.headers.get("authorization")
  const bearerToken = bearer?.startsWith("Bearer ") ? bearer.slice(7).trim() : null

  const provided = headerSecret ?? bearerToken
  if (!provided || provided !== configuredSecret) {
    throw new Error("Segredo do cron inválido ou ausente.")
  }
}

