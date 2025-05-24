# Backend Dockerfile for ReMap Express.js API
# This creates a consistent Node.js development environment for all team members

# Use Node.js 22 LTS Alpine for lightweight, secure, and stable foundation
FROM node:22-alpine

# Set metadata for the image
LABEL maintainer="ReMap Development Team"
LABEL description="Express.js backend API for ReMap memory sharing application"

# Install system dependencies needed for Node.js development
# curl: for health checks and debugging
# git: for version control operations within container
RUN apk add --no-cache curl git

# Create application directory with proper permissions
# Using /app as the standard container working directory
WORKDIR /app

# Create a non-root user for security best practices
# This prevents potential security issues from running as root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy package.json and package-lock.json first for better Docker layer caching
# This allows Docker to cache the npm install step if dependencies haven't changed
COPY package*.json ./

# Install dependencies with npm ci for consistent, reliable builds
# npm ci is preferred over npm install for automated environments
RUN npm install &&\
    npm cache clean --force

# Copy the rest of the application code
# This happens after dependency installation for optimal caching
COPY . .

# Change ownership of the application directory to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user for security
USER nextjs

# Expose the port that Express.js will listen on
# This must match the PORT environment variable in docker-compose.yml
EXPOSE 3000

# Health check endpoint for container orchestration
# This allows Docker and docker-compose to verify the service is healthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Default command to start the development server
# This can be overridden by docker-compose.yml command directive
CMD ["npm", "run", "dev"]
