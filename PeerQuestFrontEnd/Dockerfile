# ---- Dev Stage ----
FROM node:20-alpine AS dev

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy project files
COPY . .

# Expose the correct port
EXPOSE 3000

# Start the Next.js app in dev mode
CMD ["pnpm", "dev"]
