# Streamlined ReMap Development Environment
# Focuses on reliability and team consistency using modern Node.js practices

FROM node:22-bookworm

LABEL maintainer="ReMap Development Team"
LABEL description="ReMap development environment optimized for team collaboration"

# Install essential system tools for development
RUN apt-get update && apt-get install -y \
    curl \
    git \
    vim \
    nano \
    build-essential \
    postgresql-client \
    sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure the node user for development (this user already exists in the base image)
RUN echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Set up the workspace structure
WORKDIR /workspace

# Install backend dependencies first
COPY backend/package*.json ./backend/
RUN cd backend && npm install && npm cache clean --force

# Install frontend dependencies and ensure tunnel support is available
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install && npm cache clean --force

# Pre-install tunnel dependencies locally to avoid runtime installation issues
# This is the key insight: instead of global installation, we use local dependencies
RUN cd frontend && npm install @expo/ngrok@latest

# Copy the complete project
COPY . .

# Set proper ownership for the node user
RUN chown -R node:node /workspace

# Switch to the node user for security
USER node

# Set environment variables for development
ENV HOME=/home/node
ENV WORKSPACE=/workspace
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Expose development ports
EXPOSE 3000 8081 19000 19001 19002

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the backend server by default
CMD ["sh", "-c", "cd /workspace/backend && npm run dev"]