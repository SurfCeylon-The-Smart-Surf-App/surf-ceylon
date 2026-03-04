# Network Configuration Guide

## Quick Start - Update Your IP Address

**All network configuration is centralized in one file:**

📁 **`config/network.js`** - Update the `LOCAL_NETWORK_IP` constant

## How to Find Your IP Address

### Windows

```powershell
ipconfig
```

Look for "IPv4 Address" under your active network adapter (WiFi or Ethernet)

### macOS / Linux

```bash
ifconfig
# or
ip addr show
```

Look for your network interface (en0 for WiFi on Mac, wlan0 on Linux)

### From Backend Server

When you start the backend server, it displays the IP address in the terminal:

```
Server running on http://192.168.1.100:3000
```

## Configuration File Structure

```javascript
// config/network.js
const LOCAL_NETWORK_IP = "172.20.10.3"; // ← UPDATE THIS LINE
```

## What Gets Updated Automatically

When you update `LOCAL_NETWORK_IP` in `config/network.js`, the following are automatically configured:

- ✅ `API_BASE_URL` - Main API endpoint
- ✅ `BASE_URL` - Backend base URL
- ✅ `ML_SERVICE_URL` - Python ML services
- ✅ `WS_URL` - WebSocket connections
- ✅ All API endpoints (auth, spots, sessions, etc.)

## Legacy Config Files

These files now import from the centralized config (no need to edit them):

- ~~`data/config.js`~~ (imports from network.js)
- ~~`constants/config.js`~~ (imports from network.js)
- ~~`utils/constants.js`~~ (imports from network.js)

## Auto-Detection

The config automatically tries to detect your IP from Expo's debugger host, but if that fails, it uses the `LOCAL_NETWORK_IP` you configured.

## Testing Connectivity

The app logs the API configuration on startup:

```
🌐 API Configuration:
====================
Platform: android
Base URL: http://172.20.10.3:3000
API URL: http://172.20.10.3:3000/api
ML Service: http://172.20.10.3:5003
====================
```

Check the console logs to verify the correct IP is being used.

## Troubleshooting

### Still seeing old IP address?

1. Stop Metro bundler (Ctrl+C)
2. Clear cache: `npx expo start --clear`
3. Reload app (R in terminal or shake device)

### Network errors?

1. Verify backend is running: `npm run dev` in `surfapp--backend`
2. Check IP address matches in both devices on same network
3. Check firewall isn't blocking ports 3000 and 5003
4. Ensure phone/emulator and computer are on the same WiFi network

### Backend not accessible?

```bash
# Windows: Allow through firewall
# Check Windows Defender Firewall → Allow an app

# Test backend is reachable
curl http://YOUR_IP:3000/api/health
```

## For Different Environments

### Development (Same Network)

Use your local network IP (192.168.x.x or 172.x.x.x)

### Production

Set environment variable:

```bash
export API_HOST=your-production-domain.com
```

## Need Help?

1. Check the logs in the app console
2. Check the backend server console
3. Verify IP address: `ping YOUR_IP` from your device/emulator
4. Ensure both devices are on the same network
