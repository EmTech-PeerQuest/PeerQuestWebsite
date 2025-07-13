# ---- Build Stage ----
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the project
COPY . .

# Build the Next.js app
RUN pnpm build

# ---- Production Stage ----
FROM node:20-alpine AS runner

# Install pnpm globally in the production image
RUN npm install -g pnpm

WORKDIR /app

# Copy only the built output and necessary files from the builder
COPY --from=builder /app ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "start"]
