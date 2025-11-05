# 📂 Submenu de Configurações - Documentação

## ✨ Funcionalidade Implementada

Sistema de **submenu expansível/dropdown** no sidebar para a opção "Configurações".

## 🎯 Comportamento

### Interação por Hover (Passar o mouse)
```
Menu Lateral:
├── Dashboard
├── Agentes IA
├── Conexões WhatsApp
├── Follow Diário
└── ⚙️ Configurações  ← Passar o mouse aqui
    └── 🔑 API Keys LLM  ← Submenu aparece!
```

### Interação por Click (Rota ativa)
```
Se a rota atual for /admin/settings ou /admin/settings/apikeysllm:
└── ⚙️ Configurações (ativo)
    └── 🔑 API Keys LLM (visível automaticamente)
```

## 📋 Especificações Técnicas

### Admin (`/admin`)
- **Item Principal:** Configurações → `/admin/settings`
- **Submenu:** API Keys LLM → `/admin/settings/apikeysllm`

### User (`/dashboard`)
- **Item Principal:** Configurações → `/dashboard/settings`
- **Submenu:** API Keys LLM → `/dashboard/settings/apikeysllm`

## 🎨 Design

### Estados Visuais

**1. Menu Retraído (Padrão)**
```
⚙️ Configurações →
```

**2. Menu Expandido (Hover ou Ativo)**
```
⚙️ Configurações ↓
  └─ 🔑 API Keys LLM
```

### Estilização
- **Indentação:** Submenu com margem esquerda e borda à esquerda
- **Ícone de seta:** `ChevronRight` que rotaciona 90° quando expandido
- **Transição suave:** Animação ao expandir/retrair
- **Highlight:** Submenu em azul quando ativo

## 💻 Código Implementado

### Estados
```typescript
const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
```

### Estrutura do Menu
```typescript
{
  href: "/admin/settings",
  icon: Settings,
  label: "Configurações",
  submenu: [
    { href: "/admin/settings/apikeysllm", icon: Sparkles, label: "API Keys LLM" }
  ]
}
```

### Lógica de Hover
```typescript
onMouseEnter={() => item.submenu && setExpandedMenu(item.href)}
onMouseLeave={() => item.submenu && setExpandedMenu(null)}
```

### Condição de Visibilidade
```typescript
{item.submenu && (expandedMenu === item.href || pathname.startsWith(item.href)) && (
  // Renderizar submenu
)}
```

## 🔄 Fluxo de Navegação

```
Usuário → Passa mouse em "Configurações"
         ↓
    Submenu aparece
         ↓
    Clica em "API Keys LLM"
         ↓
    Navega para /admin/settings/apikeysllm
         ↓
    Submenu permanece visível (rota ativa)
```

## ✅ Vantagens

1. **UX Intuitiva:** Submenu aparece ao hover
2. **Contexto Visual:** Seta rotacionada indica expansão
3. **Persistência:** Submenu fica visível quando rota está ativa
4. **Escalável:** Fácil adicionar mais subitens no futuro
5. **Responsivo:** Funciona em diferentes tamanhos de tela

## 📱 Como Adicionar Novos Subitens

```typescript
{
  href: "/admin/settings",
  icon: Settings,
  label: "Configurações",
  submenu: [
    { href: "/admin/settings/apikeysllm", icon: Sparkles, label: "API Keys LLM" },
    { href: "/admin/settings/outro", icon: OutroIcon, label: "Outro Item" },  // ← Adicione aqui
  ]
}
```

## 🎯 Resultado Final

### Admin Sidebar
```
┌─────────────────────────────┐
│ 🏠 Dashboard                │
│ 👥 Gerenciar Usuários       │
│ 🤖 Agentes IA              │
│ 💬 Conexões WhatsApp        │
│ 📅 Follow Diário           │
│ 🔑 API Keys Sistema        │
│ ⚙️  Configurações ↓         │
│   └─ ✨ API Keys LLM       │ ← Submenu
└─────────────────────────────┘
```

### User Sidebar
```
┌─────────────────────────────┐
│ 🏠 Dashboard                │
│ 🤖 Agentes IA              │
│ 📱 WhatsApp                │
│ ⚙️  Configurações ↓         │
│   └─ ✨ API Keys LLM       │ ← Submenu
└─────────────────────────────┘
```

## 🐛 Solução de Problemas

### Submenu não aparece ao hover
- Verifique se `item.submenu` está definido
- Confirme que `setExpandedMenu` está sendo chamado

### Submenu não persiste quando rota ativa
- Verifique condição: `pathname.startsWith(item.href)`
- Confirme que `usePathname()` está importado

### Seta não rotaciona
- Verifique classe CSS: `rotate-90`
- Confirme transição: `transition-transform`

---

**Implementado em:** 2025-11-04  
**Arquivos modificados:**
- `app/admin/layout.tsx`
- `app/dashboard/layout.tsx`

