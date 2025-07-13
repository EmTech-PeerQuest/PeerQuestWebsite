# PeerQuestBackEnd/Dockerfile
FROM python:3.11

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && pip install watchdog

# Copy all project files
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Start using Daphne
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]
