# 🤖 Impa AI - Plataforma de Construção de Agentes

[![Comunidade IMPA](https://img.shields.io/badge/Comunidade-IMPA-blue?style=for-the-badge)](https://projetoimpa.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/projetoimpa-gmailcoms-projects/v0-luna-ai-assist-website)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/xfI1jFObADi)

## 📋 Sobre o Projeto

O **Impa AI** é uma plataforma desenvolvida pela [Comunidade IMPA](https://projetoimpa.com), a maior comunidade de Marketing Digital e IA do Brasil. Esta ferramenta permite a criação e gerenciamento de agentes de inteligência artificial para automação de atendimento via WhatsApp, integrando recursos avançados de IA com uma interface amigável e intuitiva.

## 🚀 Funcionalidades

- **🤖 Criação de Agentes IA**: Crie assistentes virtuais personalizados com diferentes personalidades e objetivos
- **📱 Integração com WhatsApp**: Conecte seus agentes diretamente ao WhatsApp via Evolution API
- **🧠 Vector Stores**: Integração com ChatNode.ai e Orimon.ai para bases de conhecimento personalizadas
- **🔊 Recursos de Voz**: Transcrição de áudio e respostas por voz
- **📊 Dashboard Completo**: Estatísticas de uso e desempenho dos seus agentes
- **👥 Gerenciamento de Usuários**: Sistema multi-usuário com diferentes níveis de acesso
- **📅 Integração com Calendário**: Agendamento automático de compromissos
- **🖼️ Análise de Imagens**: Capacidade de entender e responder sobre imagens enviadas
- **🔑 API para Desenvolvedores**: Integre seus sistemas com a plataforma

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Next.js API Routes
- **Banco de Dados**: PostgreSQL, Supabase
- **IA**: OpenAI GPT-4, Whisper, TTS
- **Integrações**: Evolution API (WhatsApp), ChatNode.ai, Orimon.ai
- **Infraestrutura**: Docker, Nginx, Portainer
- **Autenticação**: NextAuth.js, Supabase Auth
- **Deployment**: Vercel, Docker

## ⚙️ Pré-requisitos

- Node.js 18+
- Docker e Docker Compose (para instalação via container)
- Conta no Supabase (banco de dados)
- Evolution API configurada (para conexão com WhatsApp)
- Chaves de API da OpenAI (para funcionalidades de IA)

## 📦 Instalação

### Via Docker (Recomendado)

\`\`\`bash
# Clone o repositório
git clone https://github.com/seu-usuario/impa-ai.git
cd impa-ai

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Inicie com Docker Compose
docker-compose up -d
\`\`\`

### Via Portainer

Consulte o arquivo [DOCKER_INSTALLATION.md](./DOCKER_INSTALLATION.md) para instruções detalhadas de instalação via Portainer.

## 🔧 Configuração

1. Configure sua conta Supabase e execute os scripts SQL fornecidos
2. Configure a Evolution API para integração com WhatsApp
3. Obtenha as chaves de API necessárias (OpenAI, ChatNode, Orimon)
4. Configure as variáveis de ambiente conforme documentação

## 👨‍💻 Como Usar

1. Acesse o painel administrativo
2. Crie uma conexão com o WhatsApp
3. Configure seu primeiro agente de IA
4. Personalize o comportamento, conhecimento e integrações
5. Ative o agente e comece a usar!

## 🤝 Contribuição

Contribuições são bem-vindas! Este projeto é desenvolvido pela Comunidade IMPA. Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte e dúvidas, entre em contato com a Comunidade IMPA:

- Site: [projetoimpa.com](https://projetoimpa.com)
- Email: contato@projetoimpa.com

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

Desenvolvido com 💙 pela [Comunidade IMPA](https://projetoimpa.com) - A maior comunidade de Marketing Digital e IA do Brasil!
