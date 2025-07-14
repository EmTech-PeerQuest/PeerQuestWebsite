FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Environment
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt && pip install watchdog gunicorn uvicorn[standard]

# Copy project
COPY . .

# Expose port
EXPOSE 8000

# Run app with Gunicorn and UvicornWorker
CMD ["sh", "-c", "gunicorn core.asgi:application -k uvicorn.workers.UvicornWorker -b 0.0.0.0:${PORT:-8000}"]

