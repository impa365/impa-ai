export interface OpenAIModel {
  id: string
  name: string
  context_window: number
  description: string
  type: "text" | "chat" | "image" | "audio"
}

export const modelosOpenAI: OpenAIModel[] = [
  // GPT-4 Series
  {
    id: "gpt-4o",
    name: "GPT-4o (Omni)",
    context_window: 128000,
    description: "Nosso modelo mais recente, mais inteligente e multimodal.",
    type: "chat",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    context_window: 128000,
    description: "O mais recente modelo GPT-4 Turbo com janela de contexto de 128k e conhecimento até Abr 2023.",
    type: "chat",
  },
  {
    id: "gpt-4-turbo-preview",
    name: "GPT-4 Turbo Preview",
    context_window: 128000,
    description: "Prévia do GPT-4 Turbo, otimizado para chat e tarefas de conclusão.",
    type: "chat",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    context_window: 8192,
    description: "Modelo GPT-4 padrão com janela de contexto de 8k.",
    type: "chat",
  },
  {
    id: "gpt-4-32k",
    name: "GPT-4 (32k context)",
    context_window: 32768,
    description: "Modelo GPT-4 com janela de contexto estendida de 32k.",
    type: "chat",
  },

  // GPT-3.5 Series
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    context_window: 16385, // Updated context window
    description: "Modelo GPT-3.5 Turbo otimizado para chat com janela de contexto de 16k.",
    type: "chat",
  },
  {
    id: "gpt-3.5-turbo-16k",
    name: "GPT-3.5 Turbo (16k context)",
    context_window: 16385,
    description: "Versão do GPT-3.5 Turbo com janela de contexto de 16k.",
    type: "chat",
  },
  {
    id: "gpt-3.5-turbo-instruct",
    name: "GPT-3.5 Turbo Instruct",
    context_window: 4096,
    description: "Modelo de instrução GPT-3.5 Turbo.",
    type: "text",
  },

  // Image Generation
  {
    id: "dall-e-3",
    name: "DALL·E 3",
    context_window: 0, // N/A for image models
    description: "O modelo de geração de imagem mais capaz da OpenAI.",
    type: "image",
  },
  {
    id: "dall-e-2",
    name: "DALL·E 2",
    context_window: 0, // N/A for image models
    description: "Modelo de geração de imagem anterior, ainda poderoso.",
    type: "image",
  },

  // Audio Models
  {
    id: "tts-1",
    name: "TTS-1 (Text-to-Speech)",
    context_window: 4096, // Input text limit
    description: "Modelo de Text-to-Speech otimizado para fala em tempo real.",
    type: "audio",
  },
  {
    id: "tts-1-hd",
    name: "TTS-1 HD (Text-to-Speech)",
    context_window: 4096, // Input text limit
    description: "Modelo de Text-to-Speech com foco em alta qualidade de áudio.",
    type: "audio",
  },
  {
    id: "whisper-1",
    name: "Whisper (Speech-to-Text)",
    context_window: 0, // N/A, processes audio files
    description: "Modelo de Speech-to-Text para transcrição de áudio.",
    type: "audio",
  },
]
