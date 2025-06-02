export interface TTSProvider {
  id: string
  name: string
  description: string
  requires_api_key: boolean
  requires_voice_id?: boolean
  supported_emotions?: string[]
  docs_url?: string
}

export const vozOutputProviders: TTSProvider[] = [
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "Vozes de IA realistas e versáteis.",
    requires_api_key: true,
    requires_voice_id: true,
    supported_emotions: ["neutral", "happy", "sad", "angry", "surprised"],
    docs_url: "https://elevenlabs.io/docs",
  },
  {
    id: "openai_tts",
    name: "OpenAI TTS",
    description: "Modelos de Text-to-Speech da OpenAI.",
    requires_api_key: true,
    requires_voice_id: false, // OpenAI TTS uses predefined voices like 'alloy', 'echo', etc.
    docs_url: "https://platform.openai.com/docs/guides/text-to-speech",
  },
  {
    id: "google_tts",
    name: "Google Cloud Text-to-Speech",
    description: "Vozes neurais de alta qualidade do Google Cloud.",
    requires_api_key: true,
    requires_voice_id: true, // Typically requires specifying a voice name
    docs_url: "https://cloud.google.com/text-to-speech/docs",
  },
  {
    id: "aws_polly",
    name: "Amazon Polly",
    description: "Serviço de Text-to-Speech da Amazon Web Services.",
    requires_api_key: true, // Via AWS SDK credentials
    requires_voice_id: true, // Requires specifying a voice ID
    docs_url: "https://aws.amazon.com/polly/features/",
  },
  // Add other providers as needed
]
