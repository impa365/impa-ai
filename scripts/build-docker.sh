#!/bin/bash

# Script para build da imagem Docker

echo "🚀 Iniciando build da imagem IMPA AI..."

# Build da imagem
docker build -t impa-ai:latest .

echo "✅ Build concluído!"

# Opcional: fazer push para registry
# docker tag impa-ai:latest seu-registry/impa-ai:latest
# docker push seu-registry/impa-ai:latest

echo "📦 Imagem pronta para deploy!"
