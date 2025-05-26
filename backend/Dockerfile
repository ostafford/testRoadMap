# ReMap Development Environment - Complete Setup
# Ensures all dependencies are available for team members

FROM node:22-bookworm

LABEL maintainer="ReMap Development Team"
LABEL description="Complete ReMap development environment with all dependencies"

# Install essential system tools
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

# Configure the node user for development
RUN echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Install global tools that the development environment needs
RUN npm install -g @expo/cli@latest

# Set up the workspace structure
WORKDIR /workspace

# Copy package.json files first for better Docker caching
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies
RUN cd backend && npm install && npm cache clean --force
RUN cd frontend && npm install && npm cache clean --force

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

# Expose all development ports
EXPOSE 3000 8081 19000 19001 19002

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
    CMD curl -f http://localhost:3000/health || exit 1

# Default command starts the backend
CMD ["sh", "-c", "cd /workspace/backend && npm run dev"]