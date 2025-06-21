---
description:
globs:
alwaysApply: false
---
# Componentes e Interface

## Sistema de Design
O projeto usa **shadcn/ui** como base para componentes, com customizações específicas.

## Componentes Base (shadcn/ui)
Localizados em [components/ui/](mdc:components/ui/):
- `Button`, `Card`, `Dialog`, `Input`, `Table` etc.
- Baseados em Radix UI primitives
- Estilizados com Tailwind CSS
- Tipagem TypeScript completa

## Componentes Customizados
Localizados em [components/](mdc:components/):

### Modais
- [agent-modal.tsx](mdc:components/agent-modal.tsx): Modal de criação/edição de agentes
- [whatsapp-qr-modal.tsx](mdc:components/whatsapp-qr-modal.tsx): Modal com QR Code WhatsApp
- [user-modal.tsx](mdc:components/user-modal.tsx): Modal de usuário

### Formulários
- [login-form.tsx](mdc:components/login-form.tsx): Formulário de login
- [register-form.tsx](mdc:components/register-form.tsx): Formulário de registro
- Validação com React Hook Form + Zod

### Tabelas
- [data-table.tsx](mdc:components/data-table.tsx): Tabela reutilizável com TanStack Table
- Ordenação, filtragem e paginação
- Componentes de coluna personalizáveis

### Dashboard
- [dashboard-stats.tsx](mdc:components/dashboard-stats.tsx): Cartões de estatísticas
- [agent-stats.tsx](mdc:components/agent-stats.tsx): Estatísticas de agentes
- Gráficos com Recharts

## Padrões de Componentes

### Estrutura Básica
```typescript
interface ComponentProps {
  // Props tipadas
}

export function Component({ prop }: ComponentProps) {
  // Lógica do componente
  return <div>JSX</div>
}
```

### Hooks Customizados
- [hooks/use-modal.ts](mdc:hooks/use-modal.ts): Gerenciamento de modais
- [hooks/use-toast.ts](mdc:hooks/use-toast.ts): Notificações toast
- [hooks/use-mobile.tsx](mdc:hooks/use-mobile.tsx): Detecção mobile

## Temas e Estilização
- [components/theme-provider.tsx](mdc:components/theme-provider.tsx): Provider de temas
- Suporte a modo claro/escuro
- CSS variables para cores
- Tailwind classes para responsividade

## Layouts
- [app/layout.tsx](mdc:app/layout.tsx): Layout raiz
- [app/admin/layout.tsx](mdc:app/admin/layout.tsx): Layout admin
- [app/dashboard/layout.tsx](mdc:app/dashboard/layout.tsx): Layout dashboard

## Padrões de Loading
- Skeleton components para estados de carregamento
- Loading spinners personalizados
- Suspense boundaries para lazy loading
