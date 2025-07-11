# Use official Node.js image as the base
FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Copy Tailwind and PostCSS config files (before installing for build cache)
COPY tailwind.config.js ./ 
COPY postcss.config.js ./ 

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# 👇 Enable file watching via polling
ENV WATCHPACK_POLLING=true

# Start the Next.js app in dev mode
CMD ["pnpm", "dev"]
