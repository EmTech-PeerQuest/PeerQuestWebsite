# ---- Base Stage ----
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy all project files
COPY . .

# Expose development port
EXPOSE 3000

# Start in development mode
CMD ["pnpm", "dev"]

