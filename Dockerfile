# Usar uma imagem Node para compilar o frontend
FROM node:20-slim AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Usar uma imagem Python oficial leve
FROM python:3.11-slim

# Definir variáveis de ambiente para evitar arquivos .pyc e buffer de saída
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependências do sistema (Ghostscript)
RUN apt-get update && apt-get install -y \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o código da aplicação
COPY app/ app/
COPY core/ core/

# Copiar o build do React para app/static/
COPY --from=frontend-builder /frontend/dist/ app/static/

# Expor a porta que o Cloud Run espera
EXPOSE 8080

# Comando para rodar a aplicação
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
