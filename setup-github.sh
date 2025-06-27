#!/bin/bash

# IPTV Playlist Manager - GitHub Setup Script
# Run this script in your project directory

echo "🚀 Setting up GitHub repository for IPTV Playlist Manager..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first: https://git-scm.com/downloads"
    exit 1
fi

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo "📁 Adding all files to Git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Initial commit: IPTV Playlist Manager with Vercel compatibility

- Complete React + TypeScript application
- Tailwind CSS v3 compatible styling
- shadcn/ui component library
- Smart M3U parsing with TV channel detection
- EPG management and bulk assignment
- Export functionality (download + hosted URLs)
- Dark/light theme support
- Vercel deployment ready"
fi

echo "
🎉 Git setup complete!

Next steps:
1. Create a new repository on GitHub.com:
   - Go to https://github.com/new
   - Name: iptv-playlist-manager
   - Description: Advanced IPTV M3U playlist management tool
   - Keep it public for easy sharing
   - DON'T initialize with README (we have one)

2. Copy your repository URL and run:
   git remote add origin https://github.com/YOUR_USERNAME/iptv-playlist-manager.git
   git branch -M main
   git push -u origin main

3. Deploy to Vercel:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Click Deploy (all settings are pre-configured!)

Your app will be live in minutes! 🚀
"