import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return ""

  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "")

  // Format based on length and country code patterns
  if (cleaned.startsWith("55") && cleaned.length >= 12) {
    // Brazilian format: +55 (XX) XXXXX-XXXX
    const countryCode = cleaned.substring(0, 2)
    const areaCode = cleaned.substring(2, 4)
    const firstPart = cleaned.substring(4, 9)
    const secondPart = cleaned.substring(9)
    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`
  } else if (cleaned.length > 10) {
    // Generic international format
    const countryCode = cleaned.substring(0, 2)
    const rest = cleaned.substring(2)
    return `+${countryCode} ${rest}`
  }

  // Fallback for unknown formats
  return `+${cleaned}`
}
