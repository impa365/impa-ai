import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return ""

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "")

  // If it's a Brazilian number (starts with 55)
  if (cleaned.startsWith("55") && cleaned.length >= 12) {
    const countryCode = cleaned.slice(0, 2)
    const areaCode = cleaned.slice(2, 4)
    const firstPart = cleaned.slice(4, 9)
    const secondPart = cleaned.slice(9)

    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`
  }

  // If it's a number with country code
  if (cleaned.length >= 10) {
    // Try to format as international number
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      // US/Canada number
      const areaCode = cleaned.slice(1, 4)
      const firstPart = cleaned.slice(4, 7)
      const secondPart = cleaned.slice(7)
      return `+1 (${areaCode}) ${firstPart}-${secondPart}`
    }

    // Generic international format
    const countryCode = cleaned.slice(0, -10)
    const remaining = cleaned.slice(-10)
    const areaCode = remaining.slice(0, 2)
    const firstPart = remaining.slice(2, 7)
    const secondPart = remaining.slice(7)

    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`
  }

  // If it's a local number (10 digits)
  if (cleaned.length === 10) {
    const areaCode = cleaned.slice(0, 2)
    const firstPart = cleaned.slice(2, 7)
    const secondPart = cleaned.slice(7)

    return `(${areaCode}) ${firstPart}-${secondPart}`
  }

  // Return original if can't format
  return phoneNumber
}
