# Stage 1: Build the Next.js application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application for production
# Ensure 'output: "standalone"' is configured in next.config.js for optimal size
RUN npm run build

# Stage 2: Create the production runtime image
FROM node:22-alpine AS runner

WORKDIR /app

# Set environment variables for Next.js production
ENV NODE_ENV=production

# Copy the standalone output from the builder stage
COPY --from=builder /app/.next ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# Expose the port Next.js will run on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "run", "start"]