# 🚀 Quick Start: Deploy Backend to Render.com

This guide will walk you through deploying your Mine Safety Companion backend to the cloud in ~30 minutes.

## Prerequisites
- GitHub account
- Your backend code pushed to GitHub
- MongoDB Atlas account (we'll create this)

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)

### 1.1 Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google or email
3. Choose the **FREE** tier

### 1.2 Create Cluster
1. Click **"Build a Database"**
2. Choose **M0 FREE** tier
3. Select a cloud provider (AWS recommended)
4. Choose a region close to you (e.g., Mumbai for India)
5. Name your cluster (e.g., `mine-safety-cluster`)
6. Click **"Create"**

### 1.3 Create Database User
1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `minesafety-admin` (or your choice)
5. **IMPORTANT:** Click "Autogenerate Secure Password" and **SAVE IT**
6. Set privileges to **"Read and write to any database"**
7. Click **"Add User"**

### 1.4 Whitelist IP Addresses
1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds 0.0.0.0/0)
4. Click **"Confirm"**

### 1.5 Get Connection String
1. Click **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://minesafety-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **IMPORTANT:** Replace `<password>` with your actual password
6. Add database name: `mongodb+srv://...mongodb.net/mine-safety-app?retryWrites...`

**Save this connection string - you'll need it later!**

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git (if not already done)
```bash
cd /Users/mdriyaz/Desktop/Riyaz/project/MinerSafety\ main/backend
git init
git add .
git commit -m "Initial backend commit"
```

### 2.2 Create GitHub Repository
1. Go to https://github.com/new
2. Name: `mine-safety-backend`
3. Keep it **Private** (recommended)
4. Don't initialize with README
5. Click **"Create repository"**

### 2.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/mine-safety-backend.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Render.com

### 3.1 Create Render Account
1. Go to https://render.com/
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended)

### 3.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"**
3. Find and select `mine-safety-backend`
4. Click **"Connect"**

### 3.3 Configure Service
Fill in these settings:

**Basic Settings:**
- **Name:** `mine-safety-backend` (or your choice)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** Leave blank
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- Choose **"Free"** tier

### 3.4 Set Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these one by one:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1.5 |
| `JWT_SECRET` | Generate a random string (see below) |
| `JWT_REFRESH_SECRET` | Generate another random string |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `CLIENT_URL` | `*` (or your frontend URL) |

**To generate secure secrets:**
```bash
# Run this twice to get two different secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.5 Deploy!
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. You'll see logs in real-time

### 3.6 Get Your Backend URL
Once deployed, your URL will be:
```
https://mine-safety-backend.onrender.com
```
(or similar - check the top of your Render dashboard)

---

## Step 4: Update Mobile App

### 4.1 Create Mobile .env File
Create `/Users/mdriyaz/Desktop/Riyaz/project/MinerSafety main/mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=https://mine-safety-backend.onrender.com
```

### 4.2 Update api.js
The mobile app should automatically use the environment variable, but verify:

```javascript
// mobile/src/services/api.js
const getBaseUrl = () => {
  if (ENV_BASE_URL) {
    return ENV_BASE_URL.replace(/\/$/, '');
  }
  
  // Fallback to cloud URL
  return 'https://mine-safety-backend.onrender.com';
};
```

### 4.3 Restart Expo
```bash
# Stop current Expo (Ctrl+C)
# Then restart
npx expo start --clear
```

---

## Step 5: Test Your Deployment

### 5.1 Test Health Endpoint
Open in browser:
```
https://mine-safety-backend.onrender.com/
```
Should see: "Mine Safety Companion API is running"

### 5.2 Test from Mobile App
1. Open your mobile app
2. Try to login/register
3. Check the logs - should see successful API requests
4. Test features: incidents, hazards, SOS, etc.

---

## Troubleshooting

### Problem: "Application failed to respond"
**Solution:** Check Render logs for errors. Common issues:
- MongoDB connection string incorrect
- Missing environment variables
- Port configuration wrong

### Problem: "Cannot connect to database"
**Solution:**
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string has correct password
- Ensure database name is included in connection string

### Problem: "Mobile app can't connect"
**Solution:**
- Verify mobile `.env` file has correct URL
- Restart Expo with `--clear` flag
- Check CORS settings in backend

### Problem: "Service sleeps after 15 minutes"
**Solution:** This is normal for free tier. Options:
- Upgrade to paid tier ($7/month for always-on)
- Accept 30-second cold start on first request
- Use a service like UptimeRobot to ping every 14 minutes

---

## Next Steps

✅ **Your backend is now live!**

**Recommended:**
1. Set up monitoring: https://render.com/docs/monitoring
2. Configure custom domain (optional)
3. Set up automated backups in MongoDB Atlas
4. Add error tracking (Sentry, LogRocket, etc.)
5. Monitor usage and upgrade if needed

---

## Cost Summary

**Current Setup (Free):**
- Render.com: $0/month (with sleep after 15 min)
- MongoDB Atlas: $0/month (512MB storage)

**Recommended Production:**
- Render.com: $7/month (always-on)
- MongoDB Atlas: $0-9/month (depending on usage)

---

## Support

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Issues?** Check Render logs and MongoDB Atlas metrics

---

**🎉 Congratulations! Your backend is now accessible from anywhere in the world!**
