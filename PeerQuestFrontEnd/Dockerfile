# Use official Node.js image as the base
FROM node:20-alpine

# Set working directory
WORKDIR /app


# Copy package.json and package-lock.json
COPY package*.json ./

# Copy Tailwind and PostCSS config files before install (for build cache efficiency)
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies (including devDependencies for Tailwind/PostCSS)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js app (uncomment for production)
# RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the Next.js app
#CMD ["npm", "start"]
CMD ["npm", "run", "dev"]
