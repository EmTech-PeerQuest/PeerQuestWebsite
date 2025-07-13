# PeerQuestBackEnd/Dockerfile (Production & Railway compatible)
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Install system dependencies (for MySQL, Pillow, etc.)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       default-libmysqlclient-dev \
       gcc \
       libjpeg-dev \
       zlib1g-dev \
       libffi-dev \
       libssl-dev \
       netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && pip install watchdog

# Copy project files
COPY . .

# Collect static files at build time (optional, can also be done at runtime)
RUN python manage.py collectstatic --noinput || true

# Railway sets PORT env var automatically
ENV PORT=8000

# Healthcheck (optional, for Docker Compose/production)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl -f http://localhost:$PORT/health/ || exit 1

# Start using Daphne, bind to 0.0.0.0 and use $PORT
CMD ["sh", "-c", "daphne -b 0.0.0.0 -p $PORT core.asgi:application"]

