# Railway-compatible Dockerfile for Next.js (pnpm)
FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV FORCE_COLOR=1

# Copy package.json and lockfile
COPY package*.json ./

# Copy Tailwind and PostCSS config files before install (for build cache efficiency)
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN pnpm build

# Expose the port the app runs on
EXPOSE 3000

# Railway sets PORT automatically; Next.js uses 3000 by default
ENV PORT=3000

# Start the Next.js app in production mode
CMD ["pnpm", "start"]
