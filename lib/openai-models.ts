export interface OpenAIModel {
  id: string
  name: string
  context_window: number
  description: string
  type: "text" | "chat" | "image" | "audio" // Added type for more context if needed
}

export const modelosOpenAI: OpenAIModel[] = [
  // GPT-4 Series
  {
    id: "gpt-4o",
    name: "GPT-4o",
    context_window: 128000,
    description: "Nosso modelo mais avançado, multimodal e otimizado para inteligência.",
    type: "chat",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    context_window: 128000,
    description:
      "O mais recente modelo GPT-4 Turbo com janela de contexto de 128k e conhecimento até Abr 2023. Suporta JSON mode.",
    type: "chat",
  },
  {
    id: "gpt-4-turbo-preview",
    name: "GPT-4 Turbo (Preview)",
    context_window: 128000,
    description:
      "Pré-visualização do GPT-4 Turbo, knowledge até Dez 2023. Pode ser substituído por uma versão estável.",
    type: "chat",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    context_window: 8192,
    description: "Modelo GPT-4 base com janela de contexto de 8k. Substituído por gpt-4-turbo.",
    type: "chat",
  },
  {
    id: "gpt-4-32k",
    name: "GPT-4 (32k Context)",
    context_window: 32768,
    description: "Modelo GPT-4 com janela de contexto de 32k. Substituído por gpt-4-turbo.",
    type: "chat",
  },

  // GPT-3.5 Series
  {
    id: "gpt-3.5-turbo-0125",
    name: "GPT-3.5 Turbo (0125)",
    context_window: 16385,
    description: "O mais recente modelo GPT-3.5 Turbo. Suporta JSON mode.",
    type: "chat",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    context_window: 4096, // Can be 16k with gpt-3.5-turbo-1106 or 0125
    description: "Modelo GPT-3.5 Turbo otimizado para chat, mas também bom para tarefas tradicionais de completude.",
    type: "chat",
  },
  {
    id: "gpt-3.5-turbo-16k",
    name: "GPT-3.5 Turbo (16k Context)",
    context_window: 16385,
    description: "Versão do GPT-3.5 Turbo com janela de contexto de 16k.",
    type: "chat",
  },

  // Older models (might be deprecated or less recommended)
  {
    id: "text-davinci-003",
    name: "Davinci (GPT-3)",
    context_window: 4096,
    description:
      "Modelo legado, pode realizar qualquer tarefa de linguagem com melhor qualidade, maior saída e melhor instrução.",
    type: "text",
  },
  {
    id: "text-curie-001",
    name: "Curie (GPT-3)",
    context_window: 2048,
    description: "Modelo legado, muito capaz, mais rápido e de menor custo que Davinci.",
    type: "text",
  },
  {
    id: "text-babbage-001",
    name: "Babbage (GPT-3)",
    context_window: 2048,
    description: "Modelo legado, capaz de tarefas diretas, muito rápido e de baixo custo.",
    type: "text",
  },
  {
    id: "text-ada-001",
    name: "Ada (GPT-3)",
    context_window: 2048,
    description: "Modelo legado, capaz de tarefas muito simples, geralmente o mais rápido e de menor custo.",
    type: "text",
  },
]
