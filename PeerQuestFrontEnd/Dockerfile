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

# Copy all project files
COPY . .

# Build with env vars passed by Railway
RUN pnpm build

# ---- Production Stage ----
FROM node:20-alpine AS runner

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy only the built output and dependencies
COPY --from=builder /app ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "start"]
