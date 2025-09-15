#!/bin/bash

# RP cars - Quick Deployment Script
# This script helps automate the deployment preparation process

set -e

echo "🚗 RP cars - Deployment Preparation Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
        
        # Check if version is >= 18
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -ge 18 ]; then
            print_status "Node.js version is compatible (>=18)"
        else
            print_warning "Node.js version should be 18 or higher. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
}

# Check if git is installed
check_git() {
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_status "Git is installed: $GIT_VERSION"
    else
        print_error "Git is not installed. Please install Git"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing project dependencies..."
    npm ci
    print_status "Dependencies installed successfully"
}

# Build project
build_project() {
    print_info "Building project for production..."
    npm run build
    print_status "Build completed successfully"
}

# Run tests
run_tests() {
    print_info "Running tests..."
    npm run test -- --run
    print_status "All tests passed"
}

# Check environment variables
check_environment() {
    print_info "Checking environment configuration..."
    
    if [ -f ".env.example" ]; then
        print_status "Environment example file found"
        
        if [ -f ".env.production" ]; then
            print_status "Production environment file exists"
        else
            print_warning "Production environment file (.env.production) not found"
            print_info "Creating .env.production from .env.example..."
            cp .env.example .env.production
            print_warning "Please update .env.production with your production values"
        fi
    else
        print_warning "No .env.example file found"
    fi
}

# Git repository check
check_git_repo() {
    if [ -d ".git" ]; then
        print_status "Git repository initialized"
        
        # Check if remote origin exists
        if git remote get-url origin &> /dev/null; then
            REMOTE_URL=$(git remote get-url origin)
            print_status "Remote origin configured: $REMOTE_URL"
        else
            print_warning "No remote origin configured"
            print_info "Add remote origin with: git remote add origin <your-repo-url>"
        fi
        
        # Check for uncommitted changes
        if git diff-index --quiet HEAD --; then
            print_status "No uncommitted changes"
        else
            print_warning "You have uncommitted changes"
            print_info "Commit your changes before deployment"
        fi
    else
        print_warning "Not a git repository"
        print_info "Initialize git with: git init"
    fi
}

# Create deployment checklist
create_checklist() {
    print_info "Creating deployment checklist..."
    
    cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# 🚀 Deployment Checklist

## Pre-Deployment ✅

### Code & Repository
- [ ] All code committed and pushed to repository
- [ ] Remote repository configured (GitHub/GitLab)
- [ ] Production branch created and up-to-date
- [ ] All tests passing
- [ ] Build process successful

### Environment Configuration
- [ ] Production environment variables configured
- [ ] Supabase production project created
- [ ] Database migrations applied
- [ ] Payment gateway keys (live/production)
- [ ] WhatsApp number updated

### Domain & Hosting
- [ ] Domain purchased and configured
- [ ] Hosting platform selected (Vercel/Netlify/AWS)
- [ ] DNS records configured
- [ ] SSL certificate active

## Deployment Steps 🌐

### Vercel Deployment
1. [ ] Sign up/login to Vercel
2. [ ] Import repository
3. [ ] Configure build settings
4. [ ] Add environment variables
5. [ ] Deploy and test

### Domain Configuration
1. [ ] Add domain to hosting platform
2. [ ] Configure DNS records
3. [ ] Verify SSL certificate
4. [ ] Test domain accessibility

## Post-Deployment 📊

### Testing
- [ ] All pages load correctly
- [ ] Car booking flow works
- [ ] Payment processing functional
- [ ] Admin dashboard accessible
- [ ] WhatsApp integration working
- [ ] Mobile responsiveness verified

### Monitoring
- [ ] Analytics configured
- [ ] Error monitoring setup
- [ ] Uptime monitoring active
- [ ] Performance metrics tracked

### Documentation
- [ ] Deployment documented
- [ ] Environment variables documented
- [ ] Backup procedures established
- [ ] Support contacts identified

## 🎉 Go Live!

Once all items are checked, your RP cars platform is ready for production!

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Domain**: _____________
**Hosting**: _____________
EOF

    print_status "Deployment checklist created: DEPLOYMENT_CHECKLIST.md"
}

# Main execution
main() {
    echo
    print_info "Starting deployment preparation..."
    echo
    
    # System checks
    check_node
    check_npm
    check_git
    echo
    
    # Project checks
    check_git_repo
    check_environment
    echo
    
    # Build and test
    install_dependencies
    echo
    
    build_project
    echo
    
    print_info "Running tests (optional - press Ctrl+C to skip)..."
    sleep 3
    run_tests || print_warning "Tests skipped or failed - please review before deployment"
    echo
    
    # Create deployment artifacts
    create_checklist
    echo
    
    print_status "🎉 Deployment preparation completed!"
    echo
    print_info "Next steps:"
    echo "1. Review and update .env.production with your production values"
    echo "2. Follow the deployment checklist: DEPLOYMENT_CHECKLIST.md"
    echo "3. Refer to the complete guide: DEPLOYMENT_GUIDE.md"
    echo
    print_info "Good luck with your deployment! 🚀"
}

# Run main function
main