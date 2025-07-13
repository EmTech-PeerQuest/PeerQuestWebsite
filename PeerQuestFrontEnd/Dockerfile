# Use official Node.js image
FROM node:18-alpine

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml ./
COPY package.json ./

# Install dependencies with pnpm
RUN pnpm install

# Copy the rest of the app
COPY . .

# Build the Next.js app
RUN pnpm build

# Expose the Next.js port
EXPOSE 3000

# Start the production server
CMD ["pnpm", "start"]
