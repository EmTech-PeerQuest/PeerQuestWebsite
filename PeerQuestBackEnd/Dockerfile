# Use a lightweight Python base image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Install system dependencies required for building mysqlclient and cryptography
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    pkg-config \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install watchdog

# Copy the entire backend code
COPY . .

# Expose the port used by Daphne
EXPOSE 8000

# Start the Daphne ASGI server
CMD ["python", "-m", "daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]

