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
COPY . .

# Expor a porta que o Cloud Run espera (padrão 8080, mas vamos configurar uvicorn para ouvir em 0.0.0.0)
EXPOSE 8080

# Comando para rodar a aplicação
# Nota: Cloud Run define a variável PORT, mas aqui forçamos 8080 ou usamos a variável se disponível
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
