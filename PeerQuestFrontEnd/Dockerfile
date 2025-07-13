# PeerQuestFrontEnd/Dockerfile

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Enable PNPM via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only lockfile and package definition for install caching
COPY pnpm-lock.yaml package.json ./

# Install deps
RUN pnpm install

# Copy rest of the frontend files
COPY . .

# Build the production frontend
RUN pnpm build

# Expose Next.js default port
EXPOSE 3000

# Start Next.js in production
CMD ["pnpm", "start"]
