export interface OpenAIModel {
  id: string
  name: string
  context_window: number
  description: string
  type: "text" | "chat" | "image" | "audio" // Added type for better categorization
}

export const modelosOpenAI: OpenAIModel[] = [
  // GPT-4 Series
  {
    id: "gpt-4o",
    name: "GPT-4o",
    context_window: 128000,
    description:
      "Our most advanced, multimodal model that’s cheaper and faster than GPT-4 Turbo. Currently points to gpt-4o-2024-05-13.",
    type: "chat",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    context_window: 128000,
    description:
      "The latest GPT-4 model with improved instruction following, JSON mode, reproducible outputs, parallel function calling, and more. Returns a maximum of 4,096 output tokens. Currently points to gpt-4-turbo-2024-04-09.",
    type: "chat",
  },
  {
    id: "gpt-4-turbo-preview",
    name: "GPT-4 Turbo Preview",
    context_window: 128000,
    description:
      "GPT-4 Turbo preview model. Returns a maximum of 4,096 output tokens. This model is deprecated and will be removed on June 13th 2024.",
    type: "chat",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    context_window: 8192,
    description:
      "Broad general knowledge and domain expertise. Can follow complex instructions in natural language and solve difficult problems with accuracy. Currently points to gpt-4-0613.",
    type: "chat",
  },
  {
    id: "gpt-4-32k",
    name: "GPT-4 32k",
    context_window: 32768,
    description:
      "Same capabilities as the base gpt-4 mode but with 4x the context length. Currently points to gpt-4-32k-0613.",
    type: "chat",
  },

  // GPT-3.5 Series
  {
    id: "gpt-3.5-turbo-0125",
    name: "GPT-3.5 Turbo (0125)",
    context_window: 16385,
    description:
      "The latest GPT-3.5 Turbo model with higher accuracy at responding in requested formats and a fix for a bug which caused a text encoding issue for non-English language function calls. Returns a maximum of 4,096 output tokens.",
    type: "chat",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    context_window: 4096, // Can be 16385 depending on the specific version pointed to
    description:
      "Currently points to gpt-3.5-turbo-0125. The gpt-3.5-turbo-instruct model will be deprecated on July 5th 2024.",
    type: "chat",
  },
  {
    id: "gpt-3.5-turbo-16k",
    name: "GPT-3.5 Turbo 16k",
    context_window: 16385,
    description: "Currently points to gpt-3.5-turbo-0125.",
    type: "chat",
  },
  {
    id: "gpt-3.5-turbo-instruct",
    name: "GPT-3.5 Turbo Instruct",
    context_window: 4096,
    description:
      "Similar capabilities as GPT-3 era models. Compatible with legacy Completions endpoint and not Chat Completions. This model will be deprecated on July 5th 2024.",
    type: "text",
  },

  // Other Models (Embeddings, Image, Audio) - You might want to separate these or filter in the UI
  {
    id: "text-embedding-3-large",
    name: "Text Embedding 3 Large",
    context_window: 8191, // Input tokens
    description: "Most capable embedding model for both text search and code search tasks.",
    type: "text", // Technically an embedding model
  },
  {
    id: "text-embedding-3-small",
    name: "Text Embedding 3 Small",
    context_window: 8191, // Input tokens
    description: "Increased performance over 2nd generation ada embedding model.",
    type: "text", // Technically an embedding model
  },
  {
    id: "dall-e-3",
    name: "DALL·E 3",
    context_window: 0, // N/A for image models in this context
    description: "The latest and most capable image generation model from OpenAI.",
    type: "image",
  },
  {
    id: "dall-e-2",
    name: "DALL·E 2",
    context_window: 0, // N/A for image models in this context
    description: "An older, but still capable image generation model.",
    type: "image",
  },
  {
    id: "tts-1",
    name: "TTS-1",
    context_window: 4096, // Max input characters
    description: "A text-to-speech model optimized for real-time use cases.",
    type: "audio",
  },
  {
    id: "tts-1-hd",
    name: "TTS-1 HD",
    context_window: 4096, // Max input characters
    description: "A text-to-speech model optimized for quality.",
    type: "audio",
  },
]
