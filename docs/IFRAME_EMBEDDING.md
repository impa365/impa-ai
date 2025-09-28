# 🖼️ Incorporação em iFrame - Guia Completo

Este guia mostra como incorporar o painel IMPA AI em outros sistemas via iframe.

## 🎯 Rotas Disponíveis para Embed

### 1. **Rota Embed Universal** (Recomendada)
```html
<!-- Para incorporar qualquer página via embed -->
<iframe src="https://seudominio.com/embed/admin" width="100%" height="800px"></iframe>
<iframe src="https://seudominio.com/embed/admin/agents" width="100%" height="800px"></iframe>
<iframe src="https://seudominio.com/embed/dashboard" width="100%" height="800px"></iframe>
```

### 2. **Rotas Diretas** (Mesmo domínio)
```html
<!-- Apenas se o iframe estiver no mesmo domínio -->
<iframe src="https://seudominio.com/admin" width="100%" height="800px"></iframe>
```

## 🔧 Como Funciona

### **Sistema de Redirecionamento**
1. **URL de Embed**: `/embed/admin` → Redireciona para `/admin`
2. **Headers Especiais**: Rotas `/embed/*` têm headers que permitem iframe
3. **Sem Bloqueios**: Remove restrições de `X-Frame-Options`

### **Configurações Implementadas**

**✅ Headers de Segurança Ajustados:**
- `/embed/*` → `X-Frame-Options: ALLOWALL` (qualquer domínio)
- `/admin/*` → `X-Frame-Options: SAMEORIGIN` (mesmo domínio)
- `/dashboard/*` → `X-Frame-Options: SAMEORIGIN` (mesmo domínio)

## 📋 Exemplos Práticos

### **1. Incorporar Painel Admin Completo**
```html
<iframe 
  src="https://aiteste.impa365.com/embed/admin"
  width="100%" 
  height="800px"
  frameborder="0"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
</iframe>
```

### **2. Incorporar Seção de Agentes**
```html
<iframe 
  src="https://aiteste.impa365.com/embed/admin/agents"
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

### **3. Incorporar Dashboard do Usuário**
```html
<iframe 
  src="https://aiteste.impa365.com/embed/dashboard"
  width="100%" 
  height="700px"
  frameborder="0">
</iframe>
```

### **4. Com Parâmetros de Query**
```html
<iframe 
  src="https://aiteste.impa365.com/embed/admin/agents?filter=active"
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

## 🎨 Estilização Responsiva

### **CSS para iFrame Responsivo**
```css
.iframe-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* Aspect ratio 16:9 */
  overflow: hidden;
}

.iframe-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}
```

### **HTML Responsivo**
```html
<div class="iframe-container">
  <iframe src="https://aiteste.impa365.com/embed/admin"></iframe>
</div>
```

## 🔒 Segurança

### **Níveis de Permissão**

1. **🌐 Embed Universal** (`/embed/*`)
   - Permite incorporação de qualquer domínio
   - Ideal para sistemas externos
   - Headers: `frame-ancestors *`

2. **🏠 Mesmo Domínio** (`/admin/*`, `/dashboard/*`)
   - Permite apenas do mesmo domínio
   - Maior segurança
   - Headers: `frame-ancestors 'self' *.impa365.com`

### **Recomendações de Segurança**

✅ **Use HTTPS** sempre
✅ **Valide domínios** em produção
✅ **Configure CSP** adequadamente
✅ **Monitore acesso** via logs

## 🧪 Testando

### **1. Teste Local**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Teste iFrame</title>
</head>
<body>
    <h1>Teste de Incorporação</h1>
    <iframe 
      src="http://localhost:3000/embed/admin"
      width="100%" 
      height="800px"
      frameborder="0">
    </iframe>
</body>
</html>
```

### **2. Verificar Headers**
```bash
# Verificar se headers estão corretos
curl -I https://aiteste.impa365.com/embed/admin
```

## ⚡ Dicas de Performance

### **Otimizações Recomendadas**
```html
<iframe 
  src="https://aiteste.impa365.com/embed/admin"
  width="100%" 
  height="800px"
  frameborder="0"
  loading="lazy"
  title="Painel IMPA AI">
</iframe>
```

### **Pré-carregamento**
```html
<!-- Pré-carregar domínio -->
<link rel="dns-prefetch" href="//aiteste.impa365.com">
```

## 🎯 URLs Suportadas

| Página | URL Embed | Descrição |
|--------|-----------|-----------|
| Admin Home | `/embed/admin` | Painel administrativo completo |
| Usuários | `/embed/admin/users` | Gerenciamento de usuários |
| Agentes | `/embed/admin/agents` | Gerenciamento de agentes |
| WhatsApp | `/embed/admin/whatsapp` | Conexões WhatsApp |
| Dashboard | `/embed/dashboard` | Dashboard do usuário |
| Estatísticas | `/embed/dashboard/stats` | Estatísticas e métricas |

## ❗ Troubleshooting

### **Problema: "Redirecionando..." infinito**
**Causa**: Headers de segurança bloqueando iframe
**Solução**: Use rotas `/embed/*` em vez de rotas diretas

### **Problema: Autenticação não funciona**
**Causa**: Cookies não compartilhados entre domínios
**Solução**: Implemente autenticação via query params ou postMessage

### **Problema: Estilo quebrado**
**Causa**: CSP bloqueando recursos externos
**Solução**: Configure CSP adequadamente no servidor

## 🚀 Implantação

### **1. Verificar Configuração**
```bash
# Reiniciar aplicação após mudanças
docker restart impa-ai
```

### **2. Atualizar Next.js**
```bash
# Rebuild da aplicação
npm run build
```

### **3. Validar Headers**
```bash
# Verificar headers em produção
curl -I https://seudominio.com/embed/admin
```

---

## 🎉 Exemplo Funcionando

Agora você pode usar:

```html
<iframe 
  src="https://aiteste.impa365.com/embed/admin"
  width="100%" 
  height="800px"
  frameborder="0"
  style="border-radius: 8px;">
</iframe>
```

**✅ Sem mais "Redirecionando..." - Funcionando perfeitamente!** 