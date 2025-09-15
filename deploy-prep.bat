@echo off
setlocal enabledelayedexpansion

:: RP cars - Quick Deployment Script (Windows)
:: This script helps automate the deployment preparation process

echo.
echo 🚗 RP cars - Deployment Preparation Script (Windows)
echo ===========================================================
echo.

:: Colors for output (limited in batch)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

:: Function to check if Node.js is installed
echo %BLUE%ℹ️ Checking Node.js installation...%NC%
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
    echo %GREEN%✅ Node.js is installed: !NODE_VERSION!%NC%
) else (
    echo %RED%❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org%NC%
    pause
    exit /b 1
)

:: Check npm
echo %BLUE%ℹ️ Checking npm installation...%NC%
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%a in ('npm --version') do set NPM_VERSION=%%a
    echo %GREEN%✅ npm is installed: !NPM_VERSION!%NC%
) else (
    echo %RED%❌ npm is not installed. Please install npm%NC%
    pause
    exit /b 1
)

:: Check git
echo %BLUE%ℹ️ Checking Git installation...%NC%
git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%a in ('git --version') do set GIT_VERSION=%%a
    echo %GREEN%✅ Git is installed: !GIT_VERSION!%NC%
) else (
    echo %RED%❌ Git is not installed. Please install Git%NC%
    pause
    exit /b 1
)

echo.

:: Check if this is a git repository
if exist ".git" (
    echo %GREEN%✅ Git repository initialized%NC%
    
    :: Check for remote origin
    git remote get-url origin >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=*" %%a in ('git remote get-url origin') do set REMOTE_URL=%%a
        echo %GREEN%✅ Remote origin configured: !REMOTE_URL!%NC%
    ) else (
        echo %YELLOW%⚠️ No remote origin configured%NC%
        echo %BLUE%ℹ️ Add remote origin with: git remote add origin ^<your-repo-url^>%NC%
    )
) else (
    echo %YELLOW%⚠️ Not a git repository%NC%
    echo %BLUE%ℹ️ Initialize git with: git init%NC%
)

:: Check environment files
echo %BLUE%ℹ️ Checking environment configuration...%NC%
if exist ".env.example" (
    echo %GREEN%✅ Environment example file found%NC%
    
    if exist ".env.production" (
        echo %GREEN%✅ Production environment file exists%NC%
    ) else (
        echo %YELLOW%⚠️ Production environment file (.env.production) not found%NC%
        echo %BLUE%ℹ️ Creating .env.production from .env.example...%NC%
        copy ".env.example" ".env.production" >nul
        echo %YELLOW%⚠️ Please update .env.production with your production values%NC%
    )
) else (
    echo %YELLOW%⚠️ No .env.example file found%NC%
)

echo.

:: Install dependencies
echo %BLUE%ℹ️ Installing project dependencies...%NC%
call npm ci
if %errorlevel% equ 0 (
    echo %GREEN%✅ Dependencies installed successfully%NC%
) else (
    echo %RED%❌ Failed to install dependencies%NC%
    pause
    exit /b 1
)

echo.

:: Build project
echo %BLUE%ℹ️ Building project for production...%NC%
call npm run build
if %errorlevel% equ 0 (
    echo %GREEN%✅ Build completed successfully%NC%
) else (
    echo %RED%❌ Build failed%NC%
    pause
    exit /b 1
)

echo.

:: Create deployment checklist
echo %BLUE%ℹ️ Creating deployment checklist...%NC%

(
echo # 🚀 Deployment Checklist
echo.
echo ## Pre-Deployment ✅
echo.
echo ### Code ^& Repository
echo - [ ] All code committed and pushed to repository
echo - [ ] Remote repository configured ^(GitHub/GitLab^)
echo - [ ] Production branch created and up-to-date
echo - [ ] All tests passing
echo - [ ] Build process successful
echo.
echo ### Environment Configuration
echo - [ ] Production environment variables configured
echo - [ ] Supabase production project created
echo - [ ] Database migrations applied
echo - [ ] Payment gateway keys ^(live/production^)
echo - [ ] WhatsApp number updated
echo.
echo ### Domain ^& Hosting
echo - [ ] Domain purchased and configured
echo - [ ] Hosting platform selected ^(Vercel/Netlify/AWS^)
echo - [ ] DNS records configured
echo - [ ] SSL certificate active
echo.
echo ## Deployment Steps 🌐
echo.
echo ### Vercel Deployment
echo 1. [ ] Sign up/login to Vercel
echo 2. [ ] Import repository
echo 3. [ ] Configure build settings
echo 4. [ ] Add environment variables
echo 5. [ ] Deploy and test
echo.
echo ### Domain Configuration
echo 1. [ ] Add domain to hosting platform
echo 2. [ ] Configure DNS records
echo 3. [ ] Verify SSL certificate
echo 4. [ ] Test domain accessibility
echo.
echo ## Post-Deployment 📊
echo.
echo ### Testing
echo - [ ] All pages load correctly
echo - [ ] Car booking flow works
echo - [ ] Payment processing functional
echo - [ ] Admin dashboard accessible
echo - [ ] WhatsApp integration working
echo - [ ] Mobile responsiveness verified
echo.
echo ### Monitoring
echo - [ ] Analytics configured
echo - [ ] Error monitoring setup
echo - [ ] Uptime monitoring active
echo - [ ] Performance metrics tracked
echo.
echo ### Documentation
echo - [ ] Deployment documented
echo - [ ] Environment variables documented
echo - [ ] Backup procedures established
echo - [ ] Support contacts identified
echo.
echo ## 🎉 Go Live!
echo.
echo Once all items are checked, your RP cars platform is ready for production!
echo.
echo ---
echo.
echo **Deployment Date**: _____________
echo **Deployed By**: _____________
echo **Domain**: _____________
echo **Hosting**: _____________
) > DEPLOYMENT_CHECKLIST.md

echo %GREEN%✅ Deployment checklist created: DEPLOYMENT_CHECKLIST.md%NC%

echo.
echo %GREEN%🎉 Deployment preparation completed!%NC%
echo.
echo %BLUE%ℹ️ Next steps:%NC%
echo 1. Review and update .env.production with your production values
echo 2. Follow the deployment checklist: DEPLOYMENT_CHECKLIST.md
echo 3. Refer to the complete guide: DEPLOYMENT_GUIDE.md
echo.
echo %BLUE%ℹ️ Good luck with your deployment! 🚀%NC%
echo.

pause