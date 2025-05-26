#!/bin/bash
# ReMap Host-Side Development Startup Script
# This script detects your computer's actual network IP and starts development properly

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 ReMap Development Environment (Host-Side Setup)${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to detect the host machine's network IP
detect_host_ip() {
    echo -e "${YELLOW}🔍 Detecting your computer's network IP address...${NC}" >&2
    
    # Method 1: macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        DETECTED_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | grep -v "172\." | awk '{print $2}' | head -1)
        if [[ $DETECTED_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo -e "${GREEN}✅ Detected IP (macOS): $DETECTED_IP${NC}" >&2
            echo $DETECTED_IP
            return 0
        fi
    fi
    
    # Method 2: Linux
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        DETECTED_IP=$(ip route get 8.8.8.8 2>/dev/null | awk -F"src " 'NR==1{split($2,a," ");print a[1]}')
        if [[ $DETECTED_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo -e "${GREEN}✅ Detected IP (Linux): $DETECTED_IP${NC}" >&2
            echo $DETECTED_IP
            return 0
        fi
    fi
    
    # Method 3: Try ifconfig (works on most Unix systems)
    if command -v ifconfig &> /dev/null; then
        DETECTED_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | grep -v "172\." | grep -v "169\.254\." | awk '{print $2}' | head -1)
        if [[ $DETECTED_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo -e "${GREEN}✅ Detected IP (ifconfig): $DETECTED_IP${NC}" >&2
            echo $DETECTED_IP
            return 0
        fi
    fi
    
    echo -e "${RED}❌ Could not automatically detect your network IP${NC}" >&2
    return 1
}

# Check if IP was provided as argument
if [ $# -eq 1 ]; then
    HOST_IP=$1
    echo -e "${BLUE}📍 Using provided IP address: $HOST_IP${NC}"
else
    HOST_IP=$(detect_host_ip)
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Please run: $0 192.168.1.22${NC}"
        exit 1
    fi
fi

# Validate IP format
if ! [[ $HOST_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo -e "${RED}❌ Invalid IP address format: $HOST_IP${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using IP address: $HOST_IP${NC}"

# Check if containers are running
if ! docker ps | grep -q remap-backend; then
    echo -e "${YELLOW}🔧 Docker containers not running. Please start them first:${NC}"
    echo -e "${YELLOW}   docker-compose up -d${NC}"
    exit 1
fi

echo -e "${BLUE}📱 Starting Expo development server in container...${NC}"
echo -e "${BLUE}📊 Configuration:${NC}"
echo -e "   Host IP: $HOST_IP"
echo -e "   Expo will be accessible at: exp://$HOST_IP:8081"
echo -e "   Backend accessible at: http://$HOST_IP:3000"
echo ""
echo -e "${YELLOW}📱 Scan the QR code with Expo Go app on your mobile device${NC}"
echo ""

# Execute the Expo startup inside the container with proper environment
docker exec -it remap-backend bash -c "
    cd /workspace/frontend && 
    export REACT_NATIVE_PACKAGER_HOSTNAME=$HOST_IP && 
    export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 && 
    npm start
"