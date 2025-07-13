# Use official Node.js image as the base
FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV FORCE_COLOR=1

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy Tailwind and PostCSS config files before install (for build cache efficiency)
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000
ENV WATCHPACK_POLLING=true
# Start the Next.js app
#CMD ["npm", "start"]
CMD ["npm", "start"]
