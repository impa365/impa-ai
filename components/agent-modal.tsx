"use client"

import type React from "react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Agent } from "@prisma/client"
import { Loader2 } from "lucide-react"
import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import type { WhatsappConnection } from "@/types/whatsapp"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { checkAgentLimit, checkAdminAgentLimit, type AgentLimitResponse } from "@/lib/agent-limits"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Agent name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  model: z.string(),
  temperature: z.number(),
  max_tokens: z.number(),
  whatsapp_connection_id: z.string().optional(),
  type: z.enum(["chat", "scheduled"]),
  voice_provider: z.string().optional(),
  voice_api_key: z.string().optional(),
  voice_voice_id: z.string().optional(),
  calendar_provider: z.string().optional(),
  calendar_api_key: z.string().optional(),
  calendar_calendar_id: z.string().optional(),
})

interface AgentModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  agent?: Agent
  userId?: string
  isAdmin?: boolean
  selectedUserId?: string
}

export default function AgentModal({ isOpen, setIsOpen, agent, userId, isAdmin, selectedUserId }: AgentModalProps) {
  const { toast } = useToast()
  const [isScheduled, setIsScheduled] = useState(agent?.type === "scheduled")
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(!!agent?.voice_provider)
  const [isCalendarEnabled, setIsCalendarEnabled] = useState(!!agent?.calendar_provider)
  const [whatsappConnections, setWhatsappConnections] = useState<WhatsappConnection[]>([])
  const [whatsappConnectionOpen, setWhatsappConnectionOpen] = useState(false)
  const [limitInfo, setLimitInfo] = useState<AgentLimitResponse | null>(null)
  const { user } = useUser()

  const resetForm = useCallback(() => {
    form.reset()
    setIsScheduled(false)
    setIsVoiceEnabled(false)
    setIsCalendarEnabled(false)
  }, [])

  const loadWhatsappConnections = useCallback(async () => {
    if (!userId) return
    const connections = await fetch(`/api/whatsapp/connections?userId=${userId}`).then((res) => res.json())
    setWhatsappConnections(connections)
  }, [userId])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      prompt: "",
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 200,
      whatsapp_connection_id: "",
      type: "chat",
      voice_provider: "",
      voice_api_key: "",
      voice_voice_id: "",
      calendar_provider: "",
      calendar_api_key: "",
      calendar_calendar_id: "",
    },
  })

  const onOpenChange = useCallback(
    async (open: boolean) => {
      if (open) {
        if (agent) {
          setFormData({
            name: agent.name,
            description: agent.description,
            prompt: agent.prompt,
            model: agent.model,
            temperature: agent.temperature,
            max_tokens: agent.max_tokens,
            whatsapp_connection_id: agent.whatsapp_connection_id,
            type: agent.type || "chat",
            voice_provider: agent.voice_provider || "",
            voice_api_key: agent.voice_api_key || "",
            voice_voice_id: agent.voice_voice_id || "",
            calendar_provider: agent.calendar_provider || "",
            calendar_api_key: agent.calendar_api_key || "",
            calendar_calendar_id: agent.calendar_calendar_id || "",
          })
        } else {
          resetForm()
        }

        // Verifica o limite de agentes
        if (!agent && userId) {
          const limitCheck = isAdmin
            ? await checkAdminAgentLimit(selectedUserId || userId)
            : await checkAgentLimit(userId)
          setLimitInfo(limitCheck)
        } else {
          setLimitInfo(null)
        }

        // Carrega as conexões WhatsApp
        loadWhatsappConnections()
      }
      setIsOpen(open)
    },
    [agent, userId, isAdmin, selectedUserId, loadWhatsappConnections, resetForm],
  )

  const setFormData = useCallback(
    (data: Partial<z.infer<typeof formSchema>>) => {
      form.setValue("name", data.name || "")
      form.setValue("description", data.description || "")
      form.setValue("prompt", data.prompt || "")
      form.setValue("model", data.model || "gpt-3.5-turbo")
      form.setValue("temperature", data.temperature || 0.5)
      form.setValue("max_tokens", data.max_tokens || 200)
      form.setValue("whatsapp_connection_id", data.whatsapp_connection_id || "")
      form.setValue("type", data.type || "chat")
      form.setValue("voice_provider", data.voice_provider || "")
      form.setValue("voice_api_key", data.voice_api_key || "")
      form.setValue("voice_voice_id", data.voice_voice_id || "")
      form.setValue("calendar_provider", data.calendar_provider || "")
      form.setValue("calendar_api_key", data.calendar_api_key || "")
      form.setValue("calendar_calendar_id", data.calendar_calendar_id || "")
      setIsScheduled(data.type === "scheduled")
      setIsVoiceEnabled(!!data.voice_provider)
      setIsCalendarEnabled(!!data.calendar_provider)
    },
    [form],
  )

  const utils = api.agents
  const createAgent = useMutation(utils.createAgent)
  const updateAgent = useMutation(utils.updateAgent)

  const isLoading = createAgent.isLoading || updateAgent.isLoading

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (agent) {
        await updateAgent({ ...values, _id: agent._id })
        toast({
          title: "Success!",
          description: "Agent updated successfully.",
        })
      } else {
        if (!userId) return
        await createAgent({ ...values, userId })
        toast({
          title: "Success!",
          description: "Agent created successfully.",
        })
      }
      form.reset()
      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Error!",
        description: "Failed to create agent. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{agent ? "Edit Agent" : "Create Agent"}</AlertDialogTitle>
          <AlertDialogDescription>
            {agent
              ? "Update your agent here. Click save when you're done."
              : "Create a new agent here. After creating, you can configure it."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {limitInfo && !limitInfo.canCreate && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Limite atingido</AlertTitle>
                <AlertDescription>{limitInfo.message}</AlertDescription>
              </Alert>
            )}

            {limitInfo && limitInfo.canCreate && limitInfo.message && (
              <Alert variant="warning" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>{limitInfo.message}</AlertDescription>
              </Alert>
            )}

            {limitInfo && limitInfo.canCreate && (
              <div className="mb-4 text-sm text-muted-foreground">
                Agentes: {limitInfo.currentCount} de {limitInfo.maxAllowed} utilizados
              </div>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Agent Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us a little bit about this agent" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Act as a personal assistant" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gpt-3.5-turbo">GPT 3.5 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT 4</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Slider
                        defaultValue={[field.value]}
                        max={1}
                        step={0.1}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_tokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Scheduled Agent</FormLabel>
                    <FormDescription>
                      Enable this if you want to schedule messages to be sent to your contacts.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={isScheduled}
                      onCheckedChange={(checked) => {
                        setIsScheduled(checked)
                        field.onChange(checked ? "scheduled" : "chat")
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isScheduled && (
              <>
                <Separator />
                <p className="text-sm font-medium">Whatsapp Connection</p>
                <FormItem>
                  <FormField
                    control={form.control}
                    name="whatsapp_connection_id"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <Popover open={whatsappConnectionOpen} onOpenChange={setWhatsappConnectionOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={whatsappConnectionOpen}
                                className="w-full justify-between"
                              >
                                {field.value
                                  ? whatsappConnections.find((connection) => connection.id === field.value)?.name
                                  : "Select Whatsapp Connection..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandList>
                                <CommandInput placeholder="Search Whatsapp Connection..." />
                                <CommandEmpty>No Whatsapp Connection found.</CommandEmpty>
                                <CommandGroup>
                                  {whatsappConnections.map((connection) => (
                                    <CommandItem
                                      value={connection.name}
                                      key={connection.id}
                                      onSelect={() => {
                                        form.setValue("whatsapp_connection_id", connection.id)
                                        setWhatsappConnectionOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          connection.id === field.value ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      {connection.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                              <CommandSeparator />
                              <CommandList>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      setWhatsappConnectionOpen(false)
                                      window.open("/dashboard/whatsapp", "_blank")
                                    }}
                                  >
                                    Manage Whatsapp Connections
                                  </CommandItem>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormItem>
              </>
            )}

            <Separator />

            <FormField
              control={form.control}
              name="voice_provider"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Voice Provider</FormLabel>
                    <FormDescription>Enable this if you want to use a voice provider for your agent.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={isVoiceEnabled}
                      onCheckedChange={(checked) => {
                        setIsVoiceEnabled(checked)
                        field.onChange(checked ? "ElevenLabs" : "")
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isVoiceEnabled && (
              <>
                <FormField
                  control={form.control}
                  name="voice_api_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voice API Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Voice API Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="voice_voice_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voice ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Voice ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Separator />

            <FormField
              control={form.control}
              name="calendar_provider"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Calendar Provider</FormLabel>
                    <FormDescription>
                      Enable this if you want to use a calendar provider for your agent.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={isCalendarEnabled}
                      onCheckedChange={(checked) => {
                        setIsCalendarEnabled(checked)
                        field.onChange(checked ? "GoogleCalendar" : "")
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isCalendarEnabled && (
              <>
                <FormField
                  control={form.control}
                  name="calendar_api_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calendar API Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Calendar API Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="calendar_calendar_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calendar ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Calendar ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                type="submit"
                disabled={isLoading || (!isAdmin && limitInfo && !limitInfo.canCreate)}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {agent ? "Atualizando..." : "Criando..."}
                  </>
                ) : agent ? (
                  "Atualizar Agente"
                ) : (
                  "Criar Agente"
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface FormProps {
  children: React.ReactNode
}
function FormDescription({ children }: FormProps) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

// Exportação nomeada para compatibilidade
export { AgentModal }
