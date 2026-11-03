# 🚀 RailMarga Production Deployment Guide

RailMarga is architected as a decoupled system:
1. **Frontend**: Static Progressive Web App (Expo / React Native Web) deployed to **Vercel**.
2. **Backend**: Express TypeScript API + Grounded Gemini Assistant deployed to **Render** (or **Railway**).

---

## 🛠️ Part 1: Deploy Backend to Render (Free Tier)

Render automatically detects the [`render.yaml`](./render.yaml) blueprint in this repository.

### Option A: Using Render Blueprints (Recommended)
1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Select the repository: `Anvation-2026/RailMarga`.
4. Render will read `render.yaml` and configure the `railmarga-backend` service:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
5. In the Environment Variables section, add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key from Google AI Studio)*
6. Click **Apply**.
7. Once deployed, copy your backend URL:
   `https://railmarga-backend.onrender.com`

### Option B: Manual Web Service on Render
1. Click **New +** → **Web Service**.
2. Connect `Anvation-2026/RailMarga`.
3. Set the following parameters:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Add Environment Variable:
   - `GEMINI_API_KEY`: `your_key_here`
5. Click **Create Web Service**.

---

## 🌐 Part 2: Deploy Frontend to Vercel

Vercel will build and serve the optimized static web bundle with instant global CDN caching.

1. Go to [vercel.com](https://vercel.com/) and click **Add New...** → **Project**.
2. Import the repository: `Anvation-2026/RailMarga`.
3. Configure Project Settings:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` *(or leave default root)*
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `mobile/dist`
4. In **Environment Variables**, add:
   - `EXPO_PUBLIC_API_URL`: `https://railmarga-backend.onrender.com` *(Replace with your actual Render URL from Part 1)*
5. Click **Deploy**.
6. Vercel will bundle the app and provide a live URL like `https://railmarga.vercel.app`.

---

## 🚂 Alternate: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app/) and click **New Project** → **Deploy from GitHub repo**.
2. Select `Anvation-2026/RailMarga`.
3. In **Settings**:
   - **Root Directory**: `/server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. In **Variables**:
   - `PORT`: `3000`
   - `GEMINI_API_KEY`: `your_key_here`
5. Generate a Public Domain under **Networking** (e.g., `https://railmarga-production.up.railway.app`).
6. Point `EXPO_PUBLIC_API_URL` on Vercel to this Railway domain.

---

## 🔍 Verification & Health Checks

1. Test Backend Health:
   ```bash
   curl https://your-backend-url.onrender.com/health
   # Response: {"status":"ok","service":"RailMarga API"}
   ```

2. Open Frontend:
   - Open your Vercel URL in any desktop or mobile browser.
   - The app will automatically connect to your Render backend, enabling real-time multi-floor pathfinding and the conversational Gemini Assistant!
