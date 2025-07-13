# PeerQuestBackEnd/Dockerfile

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && pip install watchdog

# Copy project files
COPY . .

# Expose port for Railway (optional but safe)
EXPOSE 8000

# Start the ASGI server using Daphne
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]
