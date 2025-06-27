# 🚀 GitHub & Vercel Deployment Guide

## Prerequisites
- [Git](https://git-scm.com/downloads) installed on your computer
- [GitHub account](https://github.com/signup) (free)
- [Vercel account](https://vercel.com/signup) (free)

## Option 1: Command Line (Recommended)

### Step 1: Initialize Git Repository
Open terminal/command prompt in your project folder and run:

```bash
# Initialize Git repository
git init

# Add all files to staging
git add .

# Create first commit
git commit -m "Initial commit: IPTV Playlist Manager with Vercel compatibility"
```

### Step 2: Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click the **"+"** button in top-right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `iptv-playlist-manager`
   - **Description**: `Advanced IPTV M3U playlist management tool with smart channel detection and EPG management`
   - **Visibility**: Public (recommended) or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

### Step 3: Connect and Push to GitHub
Copy the commands from your new GitHub repository page and run:

```bash
# Add GitHub repository as remote origin
git remote add origin https://github.com/YOUR_USERNAME/iptv-playlist-manager.git

# Rename main branch (if needed)
git branch -M main

# Push code to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username**

---

## Option 2: GitHub Desktop (GUI)

### Step 1: Download GitHub Desktop
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Install and sign in with your GitHub account

### Step 2: Create Repository
1. Click **"Create a New Repository on your hard drive"**
2. **Name**: `iptv-playlist-manager`
3. **Local path**: Select your project folder
4. **Description**: `Advanced IPTV M3U playlist management tool`
5. Click **"Create repository"**

### Step 3: Publish to GitHub
1. Click **"Publish repository"** in GitHub Desktop
2. Uncheck **"Keep this code private"** (unless you want it private)
3. Click **"Publish Repository"**

---

## Step 4: Deploy to Vercel

### Method A: Direct GitHub Integration (Easiest)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. **Import Git Repository** - select your `iptv-playlist-manager` repo
4. **Configure Project**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **"Deploy"**

### Method B: Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? [Select your account]
# - Link to existing project? No
# - Project name: iptv-playlist-manager
# - Directory: ./
# - Override settings? No
```

---

## 🎉 Your App is Now Live!

After deployment, Vercel will provide you with:
- **Production URL**: `https://iptv-playlist-manager-xxx.vercel.app`
- **Automatic deployments** on every push to main branch
- **Free SSL certificate**
- **Global CDN**

---

## Future Updates

### To update your deployed app:
```bash
# Make your changes to the code
git add .
git commit -m "Description of changes"
git push origin main
```

Vercel will automatically redeploy your app within minutes!

---

## Troubleshooting

### If you get authentication errors:
```bash
# Generate personal access token at github.com/settings/tokens
# Use token as password when prompted
```

### If build fails on Vercel:
1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify the build command works locally: `npm run build`

### Common Issues:
- **Node version**: Vercel uses Node 18+, same as your local setup
- **Import paths**: All imports should use relative paths (`./` or `../`)
- **Case sensitivity**: Ensure file names match imports exactly

---

## Next Steps

After deployment, you can:
- 🔗 **Share your app**: Send the Vercel URL to others
- 📊 **Monitor usage**: Check Vercel dashboard for analytics
- 🔄 **Set up custom domain**: Add your own domain in Vercel settings
- 🛠️ **Environment variables**: Add any API keys in Vercel dashboard

Your IPTV Playlist Manager is now production-ready and globally accessible! 🚀