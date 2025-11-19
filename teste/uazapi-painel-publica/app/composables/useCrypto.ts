// Composable para criptografia/descriptografia de dados
// Usa AES-GCM com salt derivado de PBKDF2

export const useCrypto = () => {
  // Salt fixo para o projeto (pode ser alterado para aumentar segurança)
  const SALT = 'uazapi-painel-2025-data7apps'
  
  /**
   * Converte string para ArrayBuffer
   */
  const stringToArrayBuffer = (str: string): ArrayBuffer => {
    const encoder = new TextEncoder()
    return encoder.encode(str).buffer
  }
  
  /**
   * Converte ArrayBuffer para string
   */
  const arrayBufferToString = (buffer: ArrayBuffer): string => {
    const decoder = new TextDecoder()
    return decoder.decode(buffer)
  }
  
  /**
   * Deriva uma chave criptográfica a partir do salt
   */
  const deriveKey = async (): Promise<CryptoKey> => {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      stringToArrayBuffer(SALT),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: stringToArrayBuffer('uazapi-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }
  
  /**
   * Criptografa um texto usando AES-GCM
   */
  const encrypt = async (text: string): Promise<string> => {
    try {
      const key = await deriveKey()
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        stringToArrayBuffer(text)
      )
      
      // Combinar IV + dados criptografados
      const combined = new Uint8Array(iv.length + encryptedData.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(encryptedData), iv.length)
      
      // Converter para Base64 URL-safe
      return btoa(String.fromCharCode(...combined))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      
    } catch (error) {
      console.error('Erro ao criptografar:', error)
      throw new Error('Falha ao criptografar dados')
    }
  }
  
  /**
   * Descriptografa um texto criptografado
   */
  const decrypt = async (encryptedText: string): Promise<string> => {
    try {
      const key = await deriveKey()
      
      // Converter de Base64 URL-safe para Uint8Array
      const base64 = encryptedText
        .replace(/-/g, '+')
        .replace(/_/g, '/')
      
      // Adicionar padding se necessário
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
      
      const combined = Uint8Array.from(atob(padded), c => c.charCodeAt(0))
      
      // Separar IV e dados criptografados
      const iv = combined.slice(0, 12)
      const encryptedData = combined.slice(12)
      
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encryptedData
      )
      
      return arrayBufferToString(decryptedData)
      
    } catch (error) {
      console.error('Erro ao descriptografar:', error)
      throw new Error('Falha ao descriptografar dados')
    }
  }
  
  /**
   * Gera URL de conexão criptografada
   */
  const generateConnectUrl = async (token: string, serverUrl: string): Promise<string> => {
    const data = JSON.stringify({ token, serverUrl })
    const encrypted = await encrypt(data)
    
    // Obter a URL base do navegador
    const baseUrl = window.location.origin
    
    return `${baseUrl}/conectar/${encrypted}`
  }
  
  /**
   * Decodifica dados da URL de conexão
   */
  const decodeConnectUrl = async (encryptedData: string): Promise<{ token: string, serverUrl: string }> => {
    const decrypted = await decrypt(encryptedData)
    return JSON.parse(decrypted)
  }
  
  return {
    encrypt,
    decrypt,
    generateConnectUrl,
    decodeConnectUrl
  }
}
