import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove caracteres não numéricos
  const cleaned = phoneNumber.replace(/\D/g, "")

  // Verifica se é um número brasileiro (começando com 55)
  if (cleaned.startsWith("55") && cleaned.length >= 12) {
    // Formato brasileiro: +55 (XX) XXXXX-XXXX
    const country = cleaned.slice(0, 2)
    const ddd = cleaned.slice(2, 4)
    const part1 = cleaned.slice(4, 9)
    const part2 = cleaned.slice(9, 13)
    return `+${country} (${ddd}) ${part1}-${part2}`
  }

  // Para outros formatos, tenta uma formatação genérica
  if (cleaned.length > 10) {
    const country = cleaned.slice(0, 2)
    const rest = cleaned.slice(2)
    return `+${country} ${rest}`
  }

  // Se não conseguir formatar, retorna o número original
  return phoneNumber
}
