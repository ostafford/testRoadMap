#!/bin/bash
# ReMap Intelligent Network Configuration Script
# This script automatically detects the optimal network configuration for mobile development
# while maintaining team-friendly zero-configuration principles

# Color definitions for clear terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Print functions for educational and clear communication
print_header() {
    echo -e "\n${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}🌐 ReMap Network Configuration & Mobile Development${NC}"
    echo -e "${CYAN}   Intelligent Host IP Detection for Team Environments${NC}"
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

print_explanation() {
    echo -e "${YELLOW}💡 $1${NC}"
}

# Function to detect the host machine's actual IP address
# This is the key to solving the hostname resolution issue
detect_host_ip() {
    print_section "Detecting Host Machine Network Configuration"
    
    print_explanation "The mobile device needs to connect to your host machine's actual IP address"
    print_explanation "Docker's 'host.docker.internal' hostname only works inside containers"
    echo ""
    
    # We need to detect the IP from inside the container by examining the host gateway
    # Docker automatically configures this gateway route for container-to-host communication
    print_step "Analyzing Docker network configuration..."
    
    # Method 1: Use the default gateway IP (most reliable for Docker Desktop)
    GATEWAY_IP=$(ip route show default | awk '/default/ {print $3}' | head -1)
    
    if [[ $GATEWAY_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        print_step "Found Docker gateway IP: $GATEWAY_IP"
        
        # Test if this IP is actually reachable and serving our development server
        print_step "Testing connectivity to host machine..."
        
        if timeout 3 curl -s http://$GATEWAY_IP:3000/health > /dev/null 2>&1; then
            print_success "Successfully connected to backend API at $GATEWAY_IP:3000"
            HOST_IP=$GATEWAY_IP
        else
            print_warning "Gateway IP found but backend not accessible"
            # Fall back to alternative detection methods
            try_alternative_detection
        fi
    else
        print_warning "Could not determine gateway IP reliably"
        try_alternative_detection
    fi
    
    # Final validation of detected IP
    if [[ $HOST_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        print_success "Host IP detected: $HOST_IP"
        print_explanation "This IP address will be used for mobile device connections"
        return 0
    else
        print_error "Unable to detect a reliable host IP address"
        show_manual_configuration_help
        return 1
    fi
}

# Alternative detection methods for different Docker configurations
try_alternative_detection() {
    print_step "Trying alternative IP detection methods..."
    
    # Method 2: Check /etc/hosts for host.docker.internal mapping
    if grep -q "host.docker.internal" /etc/hosts; then
        HOSTS_IP=$(grep "host.docker.internal" /etc/hosts | awk '{print $1}' | head -1)
        print_step "Found host.docker.internal mapping: $HOSTS_IP"
        
        if timeout 3 curl -s http://$HOSTS_IP:3000/health > /dev/null 2>&1; then
            print_success "Alternative method successful"
            HOST_IP=$HOSTS_IP
            return 0
        fi
    fi
    
    # Method 3: Use common Docker Desktop default ranges
    print_step "Trying common Docker Desktop IP ranges..."
    for test_ip in "192.168.65.2" "192.168.1.1" "10.0.2.2"; do
        if timeout 2 curl -s http://$test_ip:3000/health > /dev/null 2>&1; then
            print_success "Found working IP: $test_ip"
            HOST_IP=$test_ip
            return 0
        fi
    done
    
    print_warning "Automatic detection methods exhausted"
}

# Function to show manual configuration instructions
show_manual_configuration_help() {
    print_section "Manual Network Configuration Instructions"
    
    echo ""
    print_explanation "When automatic detection fails, you can configure the IP manually"
    echo ""
    
    print_step "To find your host machine's IP address:"
    echo ""
    echo "On your HOST machine (not in Docker), run one of these commands:"
    echo ""
    echo "macOS/Linux:"
    echo "  ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print \$2}' | head -1"
    echo ""
    echo "Windows (PowerShell):"
    echo "  Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne '127.0.0.1'}"
    echo ""
    echo "Once you have your IP address, set it as an environment variable:"
    echo "  export REMAP_HOST_IP=192.168.1.xxx  # Replace with your actual IP"
    echo ""
    
    # Check if user has set manual override
    if [ -n "$REMAP_HOST_IP" ]; then
        print_success "Using manually configured IP: $REMAP_HOST_IP"
        HOST_IP=$REMAP_HOST_IP
        return 0
    fi
    
    return 1
}

# Function to configure Expo with the detected IP address
configure_expo_networking() {
    print_section "Configuring Expo Development Server"
    
    if [ -z "$HOST_IP" ]; then
        print_error "No host IP available for configuration"
        return 1
    fi
    
    print_explanation "Setting REACT_NATIVE_PACKAGER_HOSTNAME tells Expo which IP to use in QR codes"
    print_step "Configuring Expo to use IP: $HOST_IP"
    
    # Set the environment variable that Expo reads for hostname configuration
    export REACT_NATIVE_PACKAGER_HOSTNAME=$HOST_IP
    export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
    
    print_success "Expo configuration updated"
    print_info "QR codes will now show: exp://$HOST_IP:8081"
    
    return 0
}

# Function to verify the complete network configuration
verify_network_setup() {
    print_section "Verifying Complete Network Configuration"
    
    # Test backend connectivity
    print_step "Testing backend API connectivity..."
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Backend API responding on container localhost:3000"
    else
        print_warning "Backend API not responding - may still be starting"
    fi
    
    # Test host connectivity from container
    if [ -n "$HOST_IP" ]; then
        print_step "Testing host connectivity from container..."
        if timeout 3 curl -s http://$HOST_IP:3000/health > /dev/null 2>&1; then
            print_success "Successfully can reach host backend at $HOST_IP:3000"
        else
            print_warning "Cannot reach host backend - check port forwarding"
        fi
    fi
    
    # Verify port exposure
    print_step "Verifying Docker port configuration..."
    if netstat -tln | grep -q ":8081"; then
        print_success "Metro bundler port 8081 is properly exposed"
    else
        print_warning "Port 8081 may not be properly exposed"
    fi
}

# Function to provide clear mobile connection guidance
show_mobile_connection_guide() {
    print_section "Mobile Device Connection Guide"
    
    if [ -n "$HOST_IP" ]; then
        echo ""
        print_success "Your QR code will show: exp://$HOST_IP:8081"
        echo ""
        print_step "To connect your mobile device:"
        echo "  1. Ensure your phone and computer are on the same WiFi network"
        echo "  2. Open the Expo Go app on your mobile device"
        echo "  3. Tap 'Scan QR Code' in Expo Go"
        echo "  4. Scan the QR code that appears when Metro starts"
        echo ""
        
        print_explanation "Why this works: Your mobile device can directly reach $HOST_IP"
        print_explanation "This IP address exists on your local network, unlike host.docker.internal"
        echo ""
    else
        print_warning "Network configuration incomplete - manual setup may be required"
    fi
    
    print_step "Network troubleshooting tips:"
    echo "  • Both devices must be on the same WiFi network"
    echo "  • Some corporate/guest networks block device-to-device communication"
    echo "  • Try disconnecting and reconnecting WiFi on both devices"
    echo "  • Consider using a personal mobile hotspot for testing"
}

# Function to start Expo with proper network configuration
start_expo_with_network_config() {
    print_section "Starting Expo Development Server"
    
    # Ensure we're in the right directory
    cd /workspace/frontend || {
        print_error "Cannot find frontend directory"
        exit 1
    }
    
    # Fix any package compatibility issues first
    print_step "Checking package compatibility..."
    if npx expo install --fix > /dev/null 2>&1; then
        print_success "Package versions verified"
    fi
    
    # Apply network configuration
    if [ -n "$HOST_IP" ]; then
        print_step "Starting with configured IP: $HOST_IP"
        print_info "Your mobile device will connect to: exp://$HOST_IP:8081"
    else
        print_warning "Starting with default configuration"
        print_info "If connection fails, try running this script again"
    fi
    
    echo ""
    print_step "Starting Metro bundler..."
    print_explanation "Keep this terminal open - your development server will run here"
    echo ""
    
    # Start Expo with LAN mode and our configured hostname
    npx expo start --host lan
}

# Main execution function with educational flow
main() {
    print_header
    
    # Educational explanation of what we're solving
    print_explanation "The 'hostname could not be found' error occurs because mobile devices"
    print_explanation "cannot resolve Docker's internal hostnames like 'host.docker.internal'"
    print_explanation "We need to configure Expo to use your actual network IP address"
    echo ""
    
    # Step-by-step network configuration
    if detect_host_ip; then
        configure_expo_networking
        verify_network_setup
        show_mobile_connection_guide
        
        echo ""
        print_step "Press Enter when ready to start the development server..."
        read -r
        
        start_expo_with_network_config
    else
        print_error "Network configuration failed"
        print_info "Please check the manual configuration instructions above"
        exit 1
    fi
}

# Handle different script modes for team flexibility
case "${1:-start}" in
    "start")
        main
        ;;
    "detect-ip")
        print_header
        detect_host_ip
        if [ -n "$HOST_IP" ]; then
            echo ""
            print_success "Detected host IP: $HOST_IP"
            print_info "Use this IP address in your mobile development setup"
        fi
        ;;
    "help"|"troubleshoot")
        print_header
        print_section "Understanding the Network Configuration Challenge"
        echo ""
        print_explanation "Docker containers use internal hostnames that mobile devices cannot resolve"
        print_explanation "This script detects your actual network IP for mobile device connections"
        echo ""
        show_manual_configuration_help
        show_mobile_connection_guide
        ;;
    *)
        echo "Usage: $0 [start|detect-ip|help]"
        echo ""
        echo "Commands:"
        echo "  start      Configure network and start development server (default)"
        echo "  detect-ip  Only detect and display the host IP address"
        echo "  help       Show detailed networking explanation and troubleshooting"
        ;;
esac