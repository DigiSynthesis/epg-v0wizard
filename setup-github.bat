@echo off
echo 🚀 Setting up GitHub repository for IPTV Playlist Manager...

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first: https://git-scm.com/downloads
    pause
    exit /b 1
)

REM Initialize git if not already done
if not exist .git (
    echo 📦 Initializing Git repository...
    git init
) else (
    echo ✅ Git repository already initialized
)

REM Add all files
echo 📁 Adding all files to Git...
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if errorlevel 1 (
    echo 💾 Committing changes...
    git commit -m "Initial commit: IPTV Playlist Manager with Vercel compatibility" -m "- Complete React + TypeScript application" -m "- Tailwind CSS v3 compatible styling" -m "- shadcn/ui component library" -m "- Smart M3U parsing with TV channel detection" -m "- EPG management and bulk assignment" -m "- Export functionality (download + hosted URLs)" -m "- Dark/light theme support" -m "- Vercel deployment ready"
) else (
    echo ✅ No changes to commit
)

echo.
echo 🎉 Git setup complete!
echo.
echo Next steps:
echo 1. Create a new repository on GitHub.com:
echo    - Go to https://github.com/new
echo    - Name: iptv-playlist-manager
echo    - Description: Advanced IPTV M3U playlist management tool
echo    - Keep it public for easy sharing
echo    - DON'T initialize with README (we have one)
echo.
echo 2. Copy your repository URL and run:
echo    git remote add origin https://github.com/YOUR_USERNAME/iptv-playlist-manager.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Deploy to Vercel:
echo    - Go to https://vercel.com/new
echo    - Import your GitHub repository
echo    - Click Deploy (all settings are pre-configured!)
echo.
echo Your app will be live in minutes! 🚀
echo.
pause