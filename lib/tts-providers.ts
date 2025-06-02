export interface TTSProvider {
  id: string
  name: string
  description: string
  requiresApiKey?: boolean
  requiresVoiceId?: boolean
  // Add any other relevant properties for TTS providers
}

export const vozOutputProviders: TTSProvider[] = [
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "Serviço de TTS de alta qualidade com clonagem de voz e diversas opções de vozes.",
    requiresApiKey: true,
    requiresVoiceId: true,
  },
  {
    id: "openai_tts",
    name: "OpenAI TTS",
    description: "Serviço de TTS da OpenAI, integrado com seus modelos de linguagem.",
    requiresApiKey: true,
    requiresVoiceId: true, // OpenAI TTS also uses voice IDs like 'alloy', 'echo', etc.
  },
  {
    id: "google_tts",
    name: "Google Cloud Text-to-Speech",
    description: "Serviço de TTS do Google Cloud com uma vasta gama de vozes e idiomas.",
    requiresApiKey: true,
    requiresVoiceId: true,
  },
  {
    id: "aws_polly",
    name: "Amazon Polly",
    description: "Serviço de TTS da Amazon Web Services, conhecido por suas vozes naturais.",
    requiresApiKey: true,
    requiresVoiceId: true,
  },
  // Add other providers as needed
]
