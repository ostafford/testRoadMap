@echo off
REM ReMap Development Environment - Windows Version
REM This batch file provides Windows-native setup for team members

echo.
echo ===========================================
echo 🚀 ReMap Development Environment (Windows)
echo ===========================================
echo.

REM Function to detect Windows IP address
echo 🔍 Detecting your computer's network IP address...

REM Try to get IP using ipconfig
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4 Address"') do (
    set "TEMP_IP=%%i"
    setlocal enabledelayedexpansion
    set "TEMP_IP=!TEMP_IP: =!"
    echo Found potential IP: !TEMP_IP!
    
    REM Check if it's a private network IP
    echo !TEMP_IP! | findstr /r "^192\.168\." >nul
    if !errorlevel! equ 0 (
        set "HOST_IP=!TEMP_IP!"
        goto :ip_found
    )
    
    echo !TEMP_IP! | findstr /r "^10\." >nul
    if !errorlevel! equ 0 (
        set "HOST_IP=!TEMP_IP!"
        goto :ip_found
    )
    
    echo !TEMP_IP! | findstr /r "^172\." >nul
    if !errorlevel! equ 0 (
        set "HOST_IP=!TEMP_IP!"
        goto :ip_found
    )
    endlocal
)

REM If no IP found automatically, try PowerShell method
echo Trying PowerShell method...
for /f %%i in ('powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*'} | Select-Object -First 1 -ExpandProperty IPAddress"') do (
    set "HOST_IP=%%i"
    goto :ip_found
)

REM If still no IP, ask user to provide it
echo.
echo ❌ Could not automatically detect your network IP address
echo.
echo 💡 Please find your IP address manually:
echo    1. Press Win+R, type 'cmd', press Enter
echo    2. Type 'ipconfig' and press Enter
echo    3. Look for 'IPv4 Address' under your network adapter
echo    4. Use an IP like 192.168.x.x or 10.x.x.x
echo.
set /p HOST_IP="Enter your network IP address: "

:ip_found
echo ✅ Using IP address: %HOST_IP%
echo.

REM Check if Docker is running
echo 🐳 Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running
    echo 💡 Please start Docker Desktop from the Start Menu
    echo    - Look for Docker Desktop in your Start Menu
    echo    - Wait for it to finish starting up
    echo    - Then run this script again
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Check if containers exist
docker ps -q --filter "name=remap-backend" >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔨 Building and starting containers...
    docker-compose up -d --build
) else (
    echo ✅ Containers are already running
)

echo.
echo 📱 Starting Expo development server...
echo 📊 Configuration:
echo    🌐 Host IP: %HOST_IP%
echo    📱 Expo URL: exp://%HOST_IP%:8081
echo    🔗 Backend URL: http://%HOST_IP%:3000
echo    🌐 Web URL: http://localhost:8081
echo.
echo 📱 Instructions:
echo    1. Install 'Expo Go' app on your mobile device
echo    2. Scan the QR code that appears below
echo    3. Your ReMap app will load on your device
echo.
echo 🚀 Starting development server...
echo.

REM Start Expo with proper environment
docker exec -it remap-backend bash -c "cd /workspace/frontend && export REACT_NATIVE_PACKAGER_HOSTNAME=%HOST_IP% && export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 && npx expo start --host lan"

echo.
echo Development server stopped.
pause