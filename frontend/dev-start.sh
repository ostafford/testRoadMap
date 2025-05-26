#!/bin/bash
# ReMap Automatic Development Startup Script
# This script automatically detects your network IP and configures Expo properly

# Color codes for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ReMap Development Environment Setup${NC}"
echo -e "${BLUE}======================================${NC}"

# Function to detect network IP automatically
detect_network_ip() {
    echo -e "${YELLOW}🔍 Detecting network IP address...${NC}"
    
    # Try different methods to detect IP
    
    # Method 1: macOS/Linux
    if command -v ifconfig &> /dev/null; then
        DETECTED_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
        if [[ $DETECTED_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo -e "${GREEN}✅ Detected IP via ifconfig: $DETECTED_IP${NC}"
            echo $DETECTED_IP
            return 0
        fi
    fi
    
    # Method 2: Linux ip command
    if command -v ip &> /dev/null; then
        DETECTED_IP=$(ip route get 8.8.8.8 2>/dev/null | awk -F"src " 'NR==1{split($2,a," ");print a[1]}')
        if [[ $DETECTED_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo -e "${GREEN}✅ Detected IP via ip command: $DETECTED_IP${NC}"
            echo $DETECTED_IP
            return 0
        fi
    fi
    
    # Method 3: Try hostname resolution
    if command -v hostname &> /dev/null; then
        DETECTED_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
        if [[ $DETECTED_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo -e "${GREEN}✅ Detected IP via hostname: $DETECTED_IP${NC}"
            echo $DETECTED_IP
            return 0
        fi
    fi
    
    # If all methods fail
    echo -e "${RED}❌ Could not automatically detect IP address${NC}"
    echo -e "${YELLOW}Please run this script with your IP as an argument:${NC}"
    echo -e "${YELLOW}./dev-start.sh 192.168.1.22${NC}"
    return 1
}

# Check if IP was provided as argument
if [ $# -eq 1 ]; then
    NETWORK_IP=$1
    echo -e "${BLUE}📍 Using provided IP address: $NETWORK_IP${NC}"
else
    # Auto-detect IP
    NETWORK_IP=$(detect_network_ip)
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

# Validate IP format
if ! [[ $NETWORK_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo -e "${RED}❌ Invalid IP address format: $NETWORK_IP${NC}"
    exit 1
fi

echo -e "${BLUE}📱 Configuring Expo for mobile development...${NC}"

# Set environment variables for Expo
export REACT_NATIVE_PACKAGER_HOSTNAME=$NETWORK_IP
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

echo -e "${GREEN}✅ Network configuration complete${NC}"
echo -e "${BLUE}📊 Configuration:${NC}"
echo -e "   Network IP: $NETWORK_IP"
echo -e "   Expo will be accessible at: exp://$NETWORK_IP:8081"
echo -e "   Backend should be accessible at: http://$NETWORK_IP:3000"

echo -e "${BLUE}🚀 Starting Expo development server...${NC}"
echo -e "${YELLOW}📱 Scan the QR code with Expo Go app on your mobile device${NC}"
echo ""

# Start Expo with proper configuration
npm start