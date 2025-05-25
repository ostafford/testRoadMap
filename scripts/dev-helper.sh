#!/bin/bash
# ReMap Mobile Development Script
# Handles tunnel setup and mobile device connectivity automatically
# Designed to work consistently across different team members' environments

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Print functions for consistent formatting
print_header() {
    echo -e "\n${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}📱 ReMap Mobile Development Environment${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}\n"
}

print_section() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_step() {
    echo -e "${PURPLE}→ $1${NC}"
}

# Function to check if we're in the container
check_container_environment() {
    if [ ! -f /.dockerenv ]; then
        print_error "This script should be run inside the development container"
        print_info "Run this command to enter the container:"
        echo "  docker exec -it remap-backend bash"
        exit 1
    fi
}

# Function to verify tunnel dependencies
check_tunnel_dependencies() {
    print_section "Verifying tunnel dependencies..."
    
    # Check if Expo CLI is available
    if command -v expo &> /dev/null; then
        EXPO_VERSION=$(expo --version 2>/dev/null || echo "unknown")
        print_success "Expo CLI is available (version: $EXPO_VERSION)"
    else
        print_warning "Expo CLI not found in PATH, will use npx"
    fi
    
    # Check if ngrok is available globally
    if npm list -g @expo/ngrok &> /dev/null; then
        print_success "Tunnel dependencies are pre-installed"
        return 0
    else
        print_warning "Tunnel dependencies not found globally"
        return 1
    fi
}

# Function to install tunnel dependencies if needed
setup_tunnel_dependencies() {
    print_section "Setting up tunnel dependencies..."
    
    # Try to install globally with proper permissions
    print_step "Installing @expo/ngrok globally..."
    
    # Use sudo to install globally (our container is configured for this)
    if sudo npm install -g @expo/ngrok@latest; then
        print_success "Tunnel dependencies installed successfully"
        return 0
    else
        print_warning "Global installation failed, trying local installation..."
        
        # Fall back to local installation in the frontend directory
        cd /workspace/frontend
        if npm install @expo/ngrok; then
            print_success "Tunnel dependencies installed locally"
            return 0
        else
            print_error "Failed to install tunnel dependencies"
            return 1
        fi
    fi
}

# Function to detect network configuration and choose best connection method
detect_connection_method() {
    print_section "Detecting optimal connection method..."
    
    # Check if we can determine the host IP
    HOST_IP=""
    
    # Try different methods to detect host IP
    if [ -n "$HOST_IP" ]; then
        print_info "Using configured host IP: $HOST_IP"
        echo "lan"
    elif command -v ip &> /dev/null; then
        # Linux method
        DETECTED_IP=$(ip route get 8.8.8.8 2>/dev/null | awk -F"src " 'NR==1{split($2,a," ");print a[1]}')
        if [[ $DETECTED_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            print_info "Detected host IP: $DETECTED_IP"
            export REACT_NATIVE_PACKAGER_HOSTNAME=$DETECTED_IP
            echo "lan"
        else
            print_info "Could not detect reliable local IP, using tunnel mode"
            echo "tunnel"
        fi
    else
        print_info "IP detection not available, defaulting to tunnel mode"
        echo "tunnel"
    fi
}

# Function to start Expo with the appropriate connection method
start_expo_development() {
    print_section "Starting Expo development server..."
    
    # Navigate to frontend directory
    cd /workspace/frontend || {
        print_error "Frontend directory not found at /workspace/frontend"
        exit 1
    }
    
    # Ensure frontend dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_step "Installing frontend dependencies..."
        npm install
    fi
    
    # Detect the best connection method
    CONNECTION_METHOD=$(detect_connection_method)
    
    print_info "Connection method: $CONNECTION_METHOD"
    
    # Set up environment variables for consistent behavior
    export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
    
    # Display connection information
    print_section "Mobile Device Connection Instructions"
    echo ""
    
    if [ "$CONNECTION_METHOD" = "tunnel" ]; then
        print_info "Using tunnel mode for maximum compatibility"
        echo "• This creates a secure connection through Expo's servers"
        echo "• Works with any network configuration (WiFi, VPN, corporate)"
        echo "• Slightly slower than LAN mode but much more reliable"
        echo "• Perfect for team development across different networks"
    else
        print_info "Using LAN mode for fast local development"
        echo "• Make sure your mobile device is on the same WiFi network"
        echo "• This provides the fastest connection for development"
        echo "• If connection fails, the script will suggest tunnel mode"
    fi
    
    echo ""
    print_step "Starting Expo development server..."
    echo ""
    
    # Start Expo with the chosen method
    if [ "$CONNECTION_METHOD" = "tunnel" ]; then
        # Verify tunnel dependencies before starting
        if ! check_tunnel_dependencies; then
            if ! setup_tunnel_dependencies; then
                print_error "Could not set up tunnel dependencies"
                print_info "Falling back to LAN mode..."
                npx expo start --host lan
                return
            fi
        fi
        
        print_success "Starting in tunnel mode..."
        echo "Scan the QR code with Expo Go app on your mobile device"
        npx expo start --host tunnel
    else
        print_success "Starting in LAN mode..."
        echo "Scan the QR code with Expo Go app (make sure you're on the same WiFi)"
        npx expo start --host lan
    fi
}

# Function to show troubleshooting information
show_troubleshooting() {
    print_section "Troubleshooting Guide"
    
    echo "If you cannot connect to the development server:"
    echo ""
    echo "1. Network Issues:"
    echo "   • Ensure your phone and computer are on the same WiFi network"
    echo "   • Try disconnecting and reconnecting to WiFi on both devices"
    echo "   • Some corporate/guest networks block device communication"
    echo ""
    echo "2. Alternative Connection Method:"
    echo "   • If LAN mode fails, restart with: npm run dev:tunnel"
    echo "   • Tunnel mode works through the internet and bypasses local network issues"
    echo ""
    echo "3. Expo Go App:"
    echo "   • Make sure you have the latest version of Expo Go installed"
    echo "   • Try scanning the QR code with your device's camera app first"
    echo "   • If QR scanning fails, manually type the exp:// URL into Expo Go"
    echo ""
    echo "4. Container Issues:"
    echo "   • Restart the development environment: docker-compose restart"
    echo "   • Check container logs: docker logs remap-backend"
    echo ""
    echo "5. For Team Members:"
    echo "   • This setup should work identically on any machine"
    echo "   • If problems persist, check if Docker Desktop is running"
    echo "   • Try rebuilding containers: docker-compose up --build"
}

# Function to check backend connectivity
check_backend_status() {
    print_section "Checking backend connectivity..."
    
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Backend API is responding"
        return 0
    else
        print_warning "Backend API is not responding"
        print_info "The backend might still be starting up"
        print_step "Checking backend container status..."
        
        if docker ps | grep remap-backend > /dev/null; then
            print_info "Backend container is running"
            print_info "Backend is probably still starting up - this is normal"
        else
            print_error "Backend container is not running"
            print_info "Start it with: docker-compose up -d"
        fi
        return 1
    fi
}

# Main execution function
main() {
    print_header
    
    # Verify we're in the container
    check_container_environment
    
    # Check backend status
    check_backend_status
    
    # Start Expo development server
    start_expo_development
}

# Function to handle different script modes
case "${1:-start}" in
    "start")
        main
        ;;
    "tunnel")
        print_header
        check_container_environment
        cd /workspace/frontend
        if ! check_tunnel_dependencies; then
            setup_tunnel_dependencies
        fi
        export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
        print_success "Starting in tunnel mode (forced)..."
        npx expo start --host tunnel
        ;;
    "lan")
        print_header
        check_container_environment
        cd /workspace/frontend
        export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
        print_success "Starting in LAN mode (forced)..."
        npx expo start --host lan
        ;;
    "troubleshoot")
        print_header
        show_troubleshooting
        ;;
    *)
        print_header
        echo "Usage: $0 [start|tunnel|lan|troubleshoot]"
        echo ""
        echo "Commands:"
        echo "  start        Auto-detect best connection method and start (default)"
        echo "  tunnel       Force tunnel mode (works with any network)"
        echo "  lan          Force LAN mode (faster, requires same WiFi)"
        echo "  troubleshoot Show troubleshooting information"
        echo ""
        echo "Examples:"
        echo "  $0           # Auto-detect and start"
        echo "  $0 tunnel    # Force tunnel mode for corporate networks"
        echo "  $0 lan       # Force LAN mode for fastest development"
        ;;
esac