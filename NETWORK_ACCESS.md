# 🌐 Network Access Guide


cmd.exe /c "start.bat"
## How to Access the Application from Other Devices on Your Network

This guide will help you access the Fruits & Vegetables Freshness Detection application from any device on your local network (not just localhost).

---

## ✅ Configuration Status

Both the frontend and backend are now configured to accept network connections:

- **Backend**: Running on `0.0.0.0:5000` (network accessible)
- **Frontend**: Running on `0.0.0.0:5173` (network accessible)
- **API URL**: Automatically detects your network hostname

---

## 📋 Step-by-Step Instructions

### Step 1: Start the Application

**Terminal 1 - Backend:**

```bash
cd backend
python app.py
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Step 2: Find Your Computer's IP Address

#### Windows:

```bash
ipconfig
```

Look for **IPv4 Address** under your active network adapter.
Example: `192.168.1.100`

#### Mac/Linux:

```bash
ifconfig
```

or

```bash
hostname -I
```

Example output: `192.168.1.100`

### Step 3: Access from Other Devices

Once you have your IP address (e.g., `192.168.1.100`), you can access:

- **Frontend**: `http://192.168.1.100:5173`
- **Backend API**: `http://192.168.1.100:5000`

---

## 📱 Testing from Different Devices

### From Mobile Phone/Tablet:

1. Connect to the **same WiFi network** as your computer
2. Open a web browser (Chrome, Safari, etc.)
3. Navigate to `http://<your-ip>:5173`
4. Upload images and get predictions!

### From Another Computer:

1. Ensure both computers are on the **same network**
2. Open a browser
3. Navigate to `http://<your-ip>:5173`
4. The application will work exactly like on localhost

---

## 🔥 Firewall Configuration

If you cannot connect from other devices, you may need to allow the ports through your firewall:

### Windows Firewall:

**Allow ports 5000 and 5173:**

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port: `5000`
6. Allow the connection → Next
7. Apply to all profiles → Next
8. Name it "Flask Backend" → Finish
9. Repeat for port `5173` (name it "Vite Frontend")

**Or use PowerShell (Run as Administrator):**

```powershell
New-NetFirewallRule -DisplayName "Flask Backend" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "Vite Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

### Mac Firewall:

```bash
# Usually Mac firewall doesn't block outgoing connections by default
# If you have issues, go to System Preferences → Security & Privacy → Firewall Options
# Click the lock to make changes and add Python and Node to allowed apps
```

### Linux (UFW):

```bash
sudo ufw allow 5000/tcp
sudo ufw allow 5173/tcp
```

---

## 🧪 Testing the Connection

### Test Backend API:

From any device on the network:

```bash
curl http://<your-ip>:5000/health
```

Or open in browser:

```
http://<your-ip>:5000/health
```

Expected response:

```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### Test Frontend:

Open in browser:

```
http://<your-ip>:5173
```

You should see the application interface.

---

## ⚙️ Advanced Configuration

### Custom API URL (Optional)

If you need to use a specific API URL, create a `.env` file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://192.168.1.100:5000
```

Then restart the frontend:

```bash
npm run dev
```

### Custom Ports

#### Change Backend Port:

Edit `backend/app.py`:

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)  # Changed to 8080
```

#### Change Frontend Port:

Edit `frontend/vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000, // Changed to 3000
    strictPort: false,
  },
});
```

---

## 🔍 Troubleshooting

### Problem: Cannot access from other devices

**Solutions:**

1. ✅ Verify both devices are on the same network
2. ✅ Check firewall settings (see above)
3. ✅ Confirm the servers are running on `0.0.0.0`, not `127.0.0.1`
4. ✅ Try disabling firewall temporarily to test
5. ✅ Check if your router has isolation mode enabled (some public WiFi networks do)

### Problem: Backend connection error on frontend

**Solutions:**

1. ✅ Verify backend is running: `http://<your-ip>:5000/health`
2. ✅ Check browser console for CORS errors
3. ✅ Ensure Flask-CORS is installed: `pip install flask-cors`
4. ✅ Clear browser cache and reload

### Problem: Slow performance on network

**Solutions:**

1. ✅ Use 5GHz WiFi instead of 2.4GHz if available
2. ✅ Ensure strong WiFi signal
3. ✅ Close unnecessary applications on both devices
4. ✅ Consider using Ethernet connection on host computer

---

## 🎯 Use Cases

### 1. Demo/Presentation

- Run on your laptop
- Access from projector's built-in browser
- Or share with audience members on their phones

### 2. Team Collaboration

- One person runs the server
- Team members access from their devices
- Great for testing and feedback

### 3. Mobile Testing

- Develop on desktop
- Test on actual mobile devices
- No need for complex mobile dev setup

### 4. Multi-device Testing

- Test on various screen sizes simultaneously
- Android phones, iPhones, tablets, etc.

---

## 📊 Network Information Display

When you start Vite, you'll see output like:

```
  VITE v7.1.14  ready in 350 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
  ➜  press h + enter to show help
```

Use the **Network** URL to access from other devices!

---

## 🔒 Security Notes

**Important Security Considerations:**

1. **Development Only**: This setup is for development/testing only
2. **Private Networks**: Only use on trusted private networks
3. **No Authentication**: The app has no authentication by default
4. **Production**: For production deployment, use proper hosting with HTTPS
5. **Firewall**: Don't expose these ports to the internet
6. **VPN**: For remote access, use a VPN instead of port forwarding

---

## ✨ Benefits of Network Access

- 📱 **Test on real mobile devices** without deployment
- 👥 **Share with team members** instantly
- 🖥️ **Multi-device testing** simultaneously
- 🎨 **Live demos** from any device
- 🚀 **Quick feedback** without complex setup

---

## 📞 Need Help?

If you're still having issues:

1. Check that both devices show the same WiFi network name
2. Try pinging your computer from the other device
3. Temporarily disable antivirus software to test
4. Check router settings for AP Isolation or Client Isolation
5. Try a different browser
6. Restart both devices and try again

---

**Made with ❤️ for network accessibility**

_Last updated: November 4, 2025_
