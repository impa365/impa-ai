import { NextRequest } from "next/server"
import { middleware } from "../middleware"
import { getCurrentServerUser } from "../lib/auth-server"

// Mock da função de autenticação
jest.mock("../lib/auth-server", () => ({
  getCurrentServerUser: jest.fn(),
}))

const mockGetCurrentServerUser = getCurrentServerUser as jest.MockedFunction<typeof getCurrentServerUser>

// Helper para criar mock de NextRequest
function createMockRequest(url: string, method: string = "GET"): NextRequest {
  return new NextRequest(url, { method })
}

// Mock de usuários para testes
const mockUser = {
  id: "user-123",
  email: "user@example.com",
  full_name: "Test User",
  role: "user" as const,
  status: "active" as const,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockAdmin = {
  ...mockUser,
  id: "admin-123",
  email: "admin@example.com",
  full_name: "Test Admin",
  role: "admin" as const,
}

describe("Middleware de Autenticação", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mockar console.log para evitar spam nos testes
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("Rotas Públicas", () => {
    it("deve permitir acesso à página inicial", async () => {
      const request = createMockRequest("http://localhost:3000/")
      const response = await middleware(request)
      
      expect(response.status).not.toBe(401)
      expect(response.status).not.toBe(403)
    })

    it("deve permitir acesso às rotas de auth", async () => {
      const routes = [
        "http://localhost:3000/api/auth/login",
        "http://localhost:3000/api/auth/register",
        "http://localhost:3000/api/auth/logout",
      ]

      for (const url of routes) {
        const request = createMockRequest(url)
        const response = await middleware(request)
        
        expect(response.status).not.toBe(401)
        expect(response.status).not.toBe(403)
      }
    })

    it("deve permitir acesso à configuração pública", async () => {
      const request = createMockRequest("http://localhost:3000/api/config")
      const response = await middleware(request)
      
      expect(response.status).not.toBe(401)
      expect(response.status).not.toBe(403)
    })

    it("deve permitir acesso ao webhook", async () => {
      const request = createMockRequest("http://localhost:3000/api/agents/webhook")
      const response = await middleware(request)
      
      expect(response.status).not.toBe(401)
      expect(response.status).not.toBe(403)
    })
  })

  describe("Rotas Protegidas - APIs", () => {
    it("deve bloquear acesso a /api/user sem autenticação", async () => {
      mockGetCurrentServerUser.mockResolvedValue(null)
      
      const request = createMockRequest("http://localhost:3000/api/user/agents")
      const response = await middleware(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain("não autenticado")
    })

    it("deve permitir acesso a /api/user com usuário autenticado", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockUser)
      
      const request = createMockRequest("http://localhost:3000/api/user/agents")
      const response = await middleware(request)
      
      expect(response.status).not.toBe(401)
      expect(response.status).not.toBe(403)
    })

    it("deve bloquear acesso a /api/admin para usuário comum", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockUser)
      
      const request = createMockRequest("http://localhost:3000/api/admin/users")
      const response = await middleware(request)
      
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain("administradores")
    })

    it("deve permitir acesso a /api/admin para administrador", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockAdmin)
      
      const request = createMockRequest("http://localhost:3000/api/admin/users")
      const response = await middleware(request)
      
      expect(response.status).not.toBe(401)
      expect(response.status).not.toBe(403)
    })

    it("deve bloquear acesso a /api/dashboard sem autenticação", async () => {
      mockGetCurrentServerUser.mockResolvedValue(null)
      
      const request = createMockRequest("http://localhost:3000/api/dashboard/stats")
      const response = await middleware(request)
      
      expect(response.status).toBe(401)
    })

    it("deve permitir acesso a /api/whatsapp com usuário autenticado", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockUser)
      
      const request = createMockRequest("http://localhost:3000/api/whatsapp/status/test")
      const response = await middleware(request)
      
      expect(response.status).not.toBe(401)
      expect(response.status).not.toBe(403)
    })
  })

  describe("Rotas Protegidas - Páginas", () => {
    it("deve redirecionar /dashboard para login se não autenticado", async () => {
      mockGetCurrentServerUser.mockResolvedValue(null)
      
      const request = createMockRequest("http://localhost:3000/dashboard")
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect
      const location = response.headers.get("location")
      expect(location).toContain("/?redirect=%2Fdashboard")
    })

    it("deve permitir acesso a /dashboard para usuário autenticado", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockUser)
      
      const request = createMockRequest("http://localhost:3000/dashboard")
      const response = await middleware(request)
      
      expect(response.status).not.toBe(307)
      expect(response.status).not.toBe(401)
    })

    it("deve redirecionar /admin para /dashboard se usuário comum", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockUser)
      
      const request = createMockRequest("http://localhost:3000/admin")
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect
      const location = response.headers.get("location")
      expect(location).toContain("/dashboard")
    })

    it("deve permitir acesso a /admin para administrador", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockAdmin)
      
      const request = createMockRequest("http://localhost:3000/admin")
      const response = await middleware(request)
      
      expect(response.status).not.toBe(307)
      expect(response.status).not.toBe(401)
    })

    it("deve redirecionar admin de /dashboard para /admin", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockAdmin)
      
      const request = createMockRequest("http://localhost:3000/dashboard")
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect
      const location = response.headers.get("location")
      expect(location).toContain("/admin")
    })

    it("deve redirecionar admin de /dashboard/agents para /admin/agents", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockAdmin)
      
      const request = createMockRequest("http://localhost:3000/dashboard/agents")
      const response = await middleware(request)
      
      expect(response.status).toBe(307) // Redirect
      const location = response.headers.get("location")
      expect(location).toContain("/admin/agents")
    })
  })

  describe("Cenários de Erro", () => {
    it("deve lidar com erro na verificação de usuário", async () => {
      mockGetCurrentServerUser.mockRejectedValue(new Error("Database error"))
      
      const request = createMockRequest("http://localhost:3000/api/user/agents")
      
      // Deve funcionar sem quebrar, mas negar acesso
      await expect(middleware(request)).resolves.toBeDefined()
    })

    it("deve validar múltiplas rotas em sequência", async () => {
      // Simular vários requests sequenciais
      const routes = [
        { url: "http://localhost:3000/api/user/agents", shouldAuth: true },
        { url: "http://localhost:3000/api/config", shouldAuth: false },
        { url: "http://localhost:3000/api/admin/users", shouldAuth: true },
        { url: "http://localhost:3000/dashboard", shouldAuth: true },
      ]

      for (const route of routes) {
        mockGetCurrentServerUser.mockResolvedValue(route.shouldAuth ? mockUser : null)
        
        const request = createMockRequest(route.url)
        const response = await middleware(request)
        
        if (route.shouldAuth && route.url.includes("/admin")) {
          // Usuário comum tentando acessar admin deve ser bloqueado
          if (!route.url.includes("/api")) {
            expect(response.status).toBe(307) // Redirect para dashboard
          } else {
            expect(response.status).toBe(403) // Forbidden para API
          }
        } else if (route.shouldAuth) {
          expect(response.status).not.toBe(401)
        }
      }
    })
  })

  describe("Casos Edge", () => {
    it("deve lidar com rotas com parâmetros dinâmicos", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockUser)
      
      const routes = [
        "http://localhost:3000/api/user/agents/123",
        "http://localhost:3000/api/whatsapp/status/instance-name",
        "http://localhost:3000/dashboard/agents/456",
      ]

      for (const url of routes) {
        const request = createMockRequest(url)
        const response = await middleware(request)
        
        expect(response.status).not.toBe(401)
      }
    })

    it("deve lidar com query parameters", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockUser)
      
      const request = createMockRequest("http://localhost:3000/api/user/agents?page=1&limit=10")
      const response = await middleware(request)
      
      expect(response.status).not.toBe(401)
    })

    it("deve lidar com diferentes métodos HTTP", async () => {
      mockGetCurrentServerUser.mockResolvedValue(mockUser)
      
      const methods = ["GET", "POST", "PUT", "DELETE"]
      
      for (const method of methods) {
        const request = createMockRequest("http://localhost:3000/api/user/agents", method)
        const response = await middleware(request)
        
        expect(response.status).not.toBe(401)
      }
    })
  })
})
