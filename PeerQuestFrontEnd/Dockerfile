# Use Node.js Alpine base
FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (will use frozen lockfile if the lockfile matches config)
RUN pnpm install --frozen-lockfile

# Copy the rest of the project
COPY . .

# Build the React app
RUN pnpm build

# Use nginx to serve the built files (for static React apps)
FROM nginx:alpine

# Copy built app from previous stage
COPY --from=0 /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
