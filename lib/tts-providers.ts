export interface TTSProvider {
  id: string
  name: string
  description: string
  requires_api_key: boolean
  requires_voice_id: boolean
  voices_endpoint?: string // Optional: if provider has an API to list voices
  docs_url?: string
}

export const vozOutputProviders: TTSProvider[] = [
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "Vozes de IA realistas e versáteis.",
    requires_api_key: true,
    requires_voice_id: true,
    docs_url: "https://elevenlabs.io/docs",
  },
  {
    id: "playht",
    name: "Play.ht",
    description: "Geração de voz IA com uma ampla gama de vozes e estilos.",
    requires_api_key: true,
    requires_voice_id: true, // Play.ht also uses voice IDs
    docs_url: "https://docs.play.ht/reference/api-getting-started",
  },
  {
    id: "openai_tts",
    name: "OpenAI TTS",
    description: "Modelos de Text-to-Speech da OpenAI (tts-1, tts-1-hd).",
    requires_api_key: true, // Uses OpenAI API Key
    requires_voice_id: false, // OpenAI TTS has pre-set voices like 'alloy', 'echo', etc.
    docs_url: "https://platform.openai.com/docs/guides/text-to-speech",
  },
  {
    id: "google_tts",
    name: "Google Cloud Text-to-Speech",
    description: "Vozes naturais do Google Cloud.",
    requires_api_key: true, // Requires Google Cloud credentials
    requires_voice_id: true, // Requires specifying voice name, e.g., "en-US-Wavenet-D"
    docs_url: "https://cloud.google.com/text-to-speech/docs",
  },
  // Adicionar mais provedores conforme necessário
]
