# Backend Dockerfile for ReMap Express.js API
# This creates a consistent Ubuntu-based (bookworm) Node.js development environment for all team members

# Use Node.js 22 LTS on Ubuntu for comprehensive development tooling
FROM node:22-bookworm

# Set metadata for the image
LABEL maintainer="ReMap Development Team"
LABEL description="Express.js backend API for ReMap memory sharing application"

# Update package list and install essential development tools
# This provides a complete Ubuntu development environment
# **Team if you're reading this, you can manually add any other packages you need here, these are just the essentials**
RUN apt-get update && apt-get install -y \
    curl \
    git \
    vim \
    nano \
    htop \
    tree \
    wget \
    unzip \
    build-essential \
    python3 \
    python3-pip \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create workspace directory for complete project access
WORKDIR /workspace

# Examine and enhance the existing node user for complete development environment
# The Node.js base image already includes a 'node' user designed for running Node.js apps
# This confused me so i coped and pasted this from a forum post
RUN echo "=== Setting up comprehensive development workspace ===" && \
    mkdir -p /workspace && \
    echo "=== Examining existing users ===" && \
    cat /etc/passwd | grep node && \
    cat /etc/group | grep node && \
    echo "=== Setting up development environment for existing node user ===" && \
    mkdir -p /home/node/.vscode-server /home/node/.cursor-server /home/node/.ssh && \
    chown -R node:node /home/node && \
    chmod -R 755 /home/node && \
    chmod 700 /home/node/.ssh && \
    echo "=== Installing sudo for development convenience ===" && \
    apt-get update && apt-get install -y sudo && \
    echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers && \
    echo "=== Verifying enhanced node user configuration ===" && \
    id node && \
    ls -la /home/node

# Set up backend dependencies during container build
# We create the backend structure and install dependencies at build time
# The build context is now the project root, so we reference backend/ subdirectory
WORKDIR /workspace/backend

# Copy package.json and package-lock.json for dependency installation
# **MENTAL NOTE** package.json is the file that contains the dependencies for the backend and package-lock.json is the file that contains the exact version of the dependencies
COPY backend/package*.json ./

# Install dependencies as root user first, then set ownership
# This approach prevents permission issues during installation
RUN npm install && \
    npm cache clean --force

WORKDIR /workspace

# Copy the entire project structure for build-time setup
# At runtime, this will be overridden by volume mounting for development
COPY . .

# Create necessary directories and set comprehensive permissions for the node user
# This ensures development tools and Git operations can function properly
# Again this is part of the previous find on the forum post.
RUN mkdir -p /workspace/logs /workspace/uploads && \
    chown -R node:node /workspace && \
    echo "=== Final verification of comprehensive workspace setup ===" && \
    su - node -c "id" && \
    su - node -c "ls -la /home/node" && \
    echo "=== Verifying workspace structure ===" && \
    ls -la /workspace && \
    echo "=== Verifying backend directory structure ===" && \
    ls -la /workspace/backend

USER node

# Set environment variables for optimal development experience
ENV HOME=/home/node
ENV SHELL=/bin/bash
ENV WORKSPACE=/workspace

# Expose the port that Express.js will listen on
# This must match the PORT environment variable in docker-compose.yml
EXPOSE 3000

# Health check endpoint for container orchestration
# This allows Docker and docker-compose to verify the service is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# If everything works, we run the development server 🥲🫠🫡
CMD ["npm", "run", "dev"]