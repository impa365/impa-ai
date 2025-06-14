// lib/theme.ts

// This file will define the theme for the application.
// It will likely include color palettes, typography settings,
// spacing values, and other design-related configurations.

// Example structure (to be expanded upon):

interface Theme {
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  typography: {
    fontFamily: string
    fontSize: string
    fontWeight: string
  }
  spacing: {
    small: string
    medium: string
    large: string
  }
}

const defaultTheme: Theme = {
  colors: {
    primary: "#007bff",
    secondary: "#6c757d",
    background: "#f8f9fa",
    text: "#212529",
  },
  typography: {
    fontFamily: "sans-serif",
    fontSize: "16px",
    fontWeight: "400",
  },
  spacing: {
    small: "8px",
    medium: "16px",
    large: "24px",
  },
}

export default defaultTheme

// You can also create a function to generate themes based on user preferences:

export const createTheme = (options: { [key: string]: any }): Theme => {
  let newTheme = { ...defaultTheme }

  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      const value = options[key]

      // Example: Override primary color if provided
      if (key === "primaryColor") {
        newTheme = {
          ...newTheme,
          colors: {
            ...newTheme.colors,
            primary: value,
          },
        }
      }

      // Add more theme customization logic here based on the 'key' and 'value'
    }
  }

  return newTheme
}

// Temas predefinidos
export const themePresets: Record<string, ThemeConfig> = {
  blue: {
    systemName: "Impa AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🤖",
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
    accentColor: "#8b5cf6",
  },
  purple: {
    systemName: "Impa AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🔮",
    primaryColor: "#8b5cf6",
    secondaryColor: "#ec4899",
    accentColor: "#3b82f6",
  },
  green: {
    systemName: "Impa AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🌱",
    primaryColor: "#10b981",
    secondaryColor: "#3b82f6",
    accentColor: "#f59e0b",
  },
  orange: {
    systemName: "Impa AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🔥",
    primaryColor: "#f97316",
    secondaryColor: "#8b5cf6",
    accentColor: "#10b981",
  },
  dark: {
    systemName: "Impa AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "⚡",
    primaryColor: "#6366f1",
    secondaryColor: "#ec4899",
    accentColor: "#f97316",
    backgroundColor: "#1e293b",
    textColor: "#f8fafc",
  },
}

// Definição do tipo ThemeConfig
export interface ThemeConfig {
  systemName: string
  description?: string
  logoIcon: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  textColor?: string
  backgroundColor?: string
  fontFamily?: string
  borderRadius?: string
  customCss?: string
}
