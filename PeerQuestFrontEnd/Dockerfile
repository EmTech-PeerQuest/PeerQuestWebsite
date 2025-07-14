
# ---- Build Stage ----
FROM node:20-alpine AS builder

# Railway cache refresher
ARG CACHEBUST=1
ENV CACHEBUST=${CACHEBUST}

# Accept build-time environment variables from Railway
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_MEDIA_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_WS_BASE_URL

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_WS_BASE_URL=$NEXT_PUBLIC_WS_BASE_URL

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy project files
COPY . .

# Build with env vars available
RUN echo "Building with NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL" \
  && pnpm build

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

# Print environment variables and start
CMD ["sh", "-c", "echo '--- ENV VARS ---' && env | grep NEXT_PUBLIC_ && echo '----------------' && pnpm start"]
