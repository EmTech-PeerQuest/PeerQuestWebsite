# ---- Build Stage ----
FROM node:20-alpine AS builder

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

# Build the Next.js app (Railway injects runtime env vars during build)
RUN pnpm build

# ---- Production Stage ----
FROM node:20-alpine AS runner

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app ./

ENV NODE_ENV=production

# Expose the correct port
EXPOSE 3000

# Print environment variables for debugging
CMD ["sh", "-c", "echo '--- ENV VARS ---' && env | grep NEXT_PUBLIC_ && echo '----------------' && pnpm start"]
