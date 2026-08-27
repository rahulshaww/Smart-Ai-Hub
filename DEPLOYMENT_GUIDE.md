# 🚀 Smart AI Hub — 100% Production Deployment Guide

This repository is deployment-ready for a controlled public launch when the environment variables and launch checks below are completed.

---

## ⚡ Quick Deploy Options

### 🌟 Option 1: Render.com (Recommended — 100% Free)

Render runs both the Node.js backend (`server.js`) and all client-side tools smoothly.

#### Step-by-Step:
1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Initial production release of Smart AI Hub"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/smart-ai-hub.git
   git push -u origin main
   ```
2. Go to **[render.com](https://render.com)** and sign in (using your GitHub account).
3. Click **"New +"** in the top-right corner and select **"Web Service"**.
4. Choose **"Build and deploy from a Git repository"** and connect your `smart-ai-hub` repository.
5. In the configuration settings, verify/enter:
   - **Name**: `smart-ai-hub` (or your preferred name)
   - **Region**: Closest to your users (e.g. *Singapore* or *Frankfurt*)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
6. **Environment Variables (Optional)**:
   - If you want live cloud AI (Gemini, Groq, Claude, or OpenAI), click **"Add Environment Variable"**:
     - Key: `GEMINI_API_KEY` | Value: `AIzaSy...` (or any supported provider from `.env.example`)
   - *Note: If no key is set, the app continues to work using its built-in offline NLP knowledge brain.*
   - Set `ALLOWED_ORIGINS` to the exact deployed HTTPS origin, for example `https://your-domain.com`.
7. Click **"Deploy Web Service"**.
8. In 2–3 minutes, your live website URL will be ready (e.g. `https://smart-ai-hub.onrender.com`).

---

### 🚄 Option 2: Railway.app (Fastest 1-Click Setup)

1. Go to **[railway.app](https://railway.app)** and log in with GitHub.
2. Click **"New Project" &rarr; "Deploy from GitHub repo"**.
3. Select your `smart-ai-hub` repository.
4. Railway automatically detects `package.json` and starts `node server.js`.
5. In **Service Settings &rarr; Networking**, click **"Generate Domain"** to get your public `.up.railway.app` URL.

---

## 🛠️ Production Architecture Highlights

- **Dynamic Port Binding**: Automatically binds to `process.env.PORT` provided by cloud hosts.
- **Reverse Proxy Support**: Configured with `app.set('trust proxy', 1)` for accurate rate limiting behind Render/Railway/Cloudflare load balancers.
- **Client-Side Processing**: Resume Builder, Photo Resizer, Image to PDF, and PDF Toolkit execute 100% in the user's browser. Zero file uploads, zero server RAM strain.
- **Offline Mode**: With no server key configured, the built-in `js/ai-brain.js` provides local responses. If a configured cloud provider fails, the app reports a clear temporary service error instead of presenting fallback content as live AI.
- **Cache-Control Headers**: Production static asset caching enabled for maximum speed and minimal bandwidth costs.
- **Security Hardened**: Blocks public access to `.env`, `package.json`, and hidden dotfiles.

---

## 🧪 Testing Locally Before Pushing
To test locally at any time:
```bash
npm install
npm start
```
Visit: `http://localhost:3000`
