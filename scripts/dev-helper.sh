#!/bin/bash
# ReMap Development Environment Scripts
# These scripts provide convenient commands for managing both backend and frontend development
# within the containerized environment

# Colors for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[ReMap Dev]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[ReMap Dev]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ReMap Dev]${NC} $1"
}

print_error() {
    echo -e "${RED}[ReMap Dev]${NC} $1"
}

# Function to check if we're inside the container
check_container_environment() {
    if [ ! -f /.dockerenv ]; then
        print_error "This script should be run inside the development container"
        print_status "Please run: docker exec -it remap-backend /bin/bash"
        exit 1
    fi
}

# Function to start Expo development server
start_expo() {
    print_status "Starting Expo development server..."
    
    # Navigate to frontend directory
    cd /workspace/frontend || {
        print_error "Frontend directory not found"
        exit 1
    }
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "Frontend dependencies not found. Installing..."
        npm install
    fi
    
    # Start Expo CLI with LAN mode for mobile device connectivity
    print_success "Starting Expo CLI in LAN mode for mobile device access"
    print_status "Your development server will be accessible on your local network"
    print_status "Scan the QR code with Expo Go app on your mobile device"
    
    # Start Expo development server using lan mode
    npx expo start --host lan
}

# Function to run frontend health checks
check_frontend_health() {
    print_status "Checking frontend development environment..."
    
    cd /workspace/frontend || {
        print_error "Frontend directory not found"
        exit 1
    }
    
    # Check Node.js version
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
    
    # Check if Expo CLI is available
    if command -v expo &> /dev/null; then
        EXPO_VERSION=$(npx expo --version)
        print_status "Expo CLI version: $EXPO_VERSION"
    else
        print_warning "Expo CLI not found globally, will use npx"
    fi
    
    # Check if dependencies are installed
    if [ -d "node_modules" ]; then
        print_success "Frontend dependencies are installed"
    else
        print_warning "Frontend dependencies not found - run 'npm install' in /workspace/frontend"
    fi
    
    # Check network configuration
    print_status "Network configuration:"
    echo "  EXPO_DEVTOOLS_LISTEN_ADDRESS: ${EXPO_DEVTOOLS_LISTEN_ADDRESS:-not set}"
    echo "  REACT_NATIVE_PACKAGER_HOSTNAME: ${REACT_NATIVE_PACKAGER_HOSTNAME:-not set}"
}

# Function to display backend status
check_backend_status() {
    print_status "Checking backend service status..."
    
    # Check if backend is running
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Backend API is running and responding"
        curl -s http://localhost:3000/health | jq '.status, .message' 2>/dev/null || echo "Backend health check successful"
    else
        print_warning "Backend API is not responding on port 3000"
        print_status "Check if the backend service started correctly in the container logs"
    fi
}

# Function to show development environment status
show_dev_status() {
    print_status "ReMap Development Environment Status"
    echo "====================================="
    
    # Check container environment
    check_container_environment
    
    # Show current directory and workspace
    print_status "Current workspace: $(pwd)"
    print_status "Available directories:"
    ls -la /workspace/ | grep "^d" | awk '{print "  " $9}'
    
    echo ""
    check_backend_status
    echo ""
    check_frontend_health
    
    echo ""
    print_status "Available commands:"
    echo "  start-expo     - Start Expo development server for React Native"
    echo "  check-health   - Run comprehensive health checks"
    echo "  dev-status     - Show this status information"
}

# Function to run comprehensive health checks
run_health_checks() {
    print_status "Running comprehensive development environment health checks..."
    
    # Backend health check
    print_status "Testing backend connectivity..."
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "✓ Backend API accessible"
    else
        print_error "✗ Backend API not accessible"
    fi
    
    # Database connectivity through backend
    print_status "Testing database connectivity..."
    if curl -s http://localhost:3000/api/memories > /dev/null; then
        print_success "✓ Database integration working"
    else
        print_error "✗ Database integration failed"
    fi
    
    # Frontend environment
    print_status "Testing frontend environment..."
    cd /workspace/frontend
    if [ -d "node_modules" ] && [ -f "package.json" ]; then
        print_success "✓ Frontend dependencies available"
    else
        print_error "✗ Frontend dependencies missing"
    fi
    
    # Network configuration
    print_status "Testing network configuration..."
    if [ "$EXPO_DEVTOOLS_LISTEN_ADDRESS" = "0.0.0.0" ]; then
        print_success "✓ Expo network configuration correct"
    else
        print_warning "⚠ Expo network configuration may need adjustment"
    fi
    
    print_success "Health check completed"
}

# Main command dispatcher
case "$1" in
    "start-expo")
        check_container_environment
        start_expo
        ;;
    "check-health")
        check_container_environment
        run_health_checks
        ;;
    "dev-status")
        show_dev_status
        ;;
    *)
        print_status "ReMap Development Environment Helper"
        echo "Usage: $0 {start-expo|check-health|dev-status}"
        echo ""
        echo "Commands:"
        echo "  start-expo     Start Expo development server for React Native development"
        echo "  check-health   Run comprehensive health checks for development environment"
        echo "  dev-status     Show current development environment status"
        echo ""
        echo "Example:"
        echo "  $0 start-expo    # Start React Native development server"
        echo "  $0 check-health  # Verify all systems are working correctly"
        ;;
esac