# PeerQuestBackEnd/Dockerfile (Railway compatible)
FROM python:3.11

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && pip install watchdog

# Copy all project files
COPY . .

# Collect static files at build time (optional, can also be done at runtime)
RUN python manage.py collectstatic --noinput || true

# Railway sets PORT env var automatically
ENV PORT=8000

# Start using Daphne, bind to 0.0.0.0 and use $PORT
CMD ["sh", "-c", "daphne -b 0.0.0.0 -p $PORT core.asgi:application"]

