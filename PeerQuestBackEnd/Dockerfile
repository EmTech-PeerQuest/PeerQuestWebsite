FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && pip install watchdog

# Copy project files
COPY . .

# Optional: Expose default Django port for local dev (Railway overrides with PORT anyway)
EXPOSE 8000

# Use sh -c with single quotes so $PORT is expanded at runtime
CMD sh -c 'exec daphne -b 0.0.0.0 -p ${PORT:-8000} core.asgi:application'
