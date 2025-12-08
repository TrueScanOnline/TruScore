#!/bin/bash
# Automated Backend Setup Script (Linux/Mac)
# This script automates as much of the backend setup as possible

echo "=========================================="
echo "TrueScan Backend Setup - Automated"
echo "=========================================="
echo ""

# Check if Vercel CLI is installed
echo "Step 1: Checking Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI"
        echo "Please install manually: npm install -g vercel"
        exit 1
    fi
fi
echo "✅ Vercel CLI is installed"
echo ""

# Check if logged in to Vercel
echo "Step 2: Checking Vercel login status..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel"
    echo "Please login: vercel login"
    echo ""
    read -p "Would you like to login now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel login
        if [ $? -ne 0 ]; then
            echo "❌ Login failed"
            exit 1
        fi
    else
        echo "Skipping login. You'll need to login before deployment."
    fi
else
    echo "✅ Logged in as: $(vercel whoami)"
fi
echo ""

# Navigate to backend directory
echo "Step 3: Preparing backend for deployment..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_PATH="$SCRIPT_DIR/../backend/vercel"

if [ ! -d "$BACKEND_PATH" ]; then
    echo "❌ Backend directory not found: $BACKEND_PATH"
    exit 1
fi

cd "$BACKEND_PATH"
echo "✅ Backend directory found"
echo ""

# Check if .env file exists
echo "Step 4: Checking environment configuration..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo "⚠️  No .env file found. Creating template..."
    cat > .env << 'EOF'
# Backend Environment Variables
# Add these to Vercel Dashboard after deployment:
# Settings → Environment Variables

# Database (Required - Choose ONE)
# POSTGRES_URL=postgres://user:password@host:port/database?sslmode=require
# OR
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/truescan

# Photo Storage (Required - Choose ONE)
# BLOB_READ_WRITE_TOKEN=vercel_blob_token_here
# OR
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret

# Open Food Facts (Optional)
# OFF_USERNAME=your_username
# OFF_PASSWORD=your_password
EOF
    echo "✅ Created .env template"
else
    echo "✅ Environment file exists"
fi
echo ""

# Deploy to Vercel
echo "Step 5: Deploying backend to Vercel..."
echo "This will deploy your backend. Press Ctrl+C to cancel."
sleep 2

DEPLOY_OUTPUT=$(vercel --prod 2>&1)
DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    # Extract deployment URL from output
    BACKEND_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE "https://[^[:space:]]+\.vercel\.app" | head -1)
    
    if [ -n "$BACKEND_URL" ]; then
        echo ""
        echo "✅ Backend deployed successfully!"
        echo "Backend URL: $BACKEND_URL"
        echo ""
        
        # Update .env file in project root
        echo "Step 6: Updating app configuration..."
        PROJECT_ROOT="$SCRIPT_DIR/.."
        APP_ENV_FILE="$PROJECT_ROOT/.env"
        
        if [ -f "$APP_ENV_FILE" ]; then
            # Check if EXPO_PUBLIC_BACKEND_URL already exists
            if grep -q "EXPO_PUBLIC_BACKEND_URL" "$APP_ENV_FILE"; then
                sed -i.bak "s|EXPO_PUBLIC_BACKEND_URL=.*|EXPO_PUBLIC_BACKEND_URL=$BACKEND_URL|" "$APP_ENV_FILE"
                echo "✅ Updated existing .env file"
            else
                echo "" >> "$APP_ENV_FILE"
                echo "# Backend Configuration" >> "$APP_ENV_FILE"
                echo "EXPO_PUBLIC_BACKEND_URL=$BACKEND_URL" >> "$APP_ENV_FILE"
                echo "✅ Added backend URL to .env file"
            fi
        else
            cat > "$APP_ENV_FILE" << EOF
# Backend Configuration
EXPO_PUBLIC_BACKEND_URL=$BACKEND_URL
EOF
            echo "✅ Created .env file with backend URL"
        fi
        
        echo ""
        echo "=========================================="
        echo "Next Steps (Manual):"
        echo "=========================================="
        echo ""
        echo "1. Go to Vercel Dashboard:"
        echo "   https://vercel.com/dashboard"
        echo ""
        echo "2. Select your project → Settings → Environment Variables"
        echo ""
        echo "3. Add Database (Required):"
        echo "   - Go to Storage → Create Database → Postgres"
        echo "   - Copy connection string"
        echo "   - Add as: POSTGRES_URL"
        echo ""
        echo "4. Add Photo Storage (Required):"
        echo "   - Go to Storage → Create Database → Blob"
        echo "   - Copy token"
        echo "   - Add as: BLOB_READ_WRITE_TOKEN"
        echo ""
        echo "5. Redeploy backend:"
        echo "   cd backend/vercel"
        echo "   vercel --prod"
        echo ""
        echo "6. Verify configuration:"
        echo "   npm run verify-backend"
        echo ""
        
    else
        echo "⚠️  Could not extract backend URL from deployment output"
        echo "Please check Vercel dashboard for your deployment URL"
    fi
else
    echo "❌ Deployment failed"
    echo "Deployment output:"
    echo "$DEPLOY_OUTPUT"
    echo ""
    echo "Please check the error above and try again."
fi

cd "$SCRIPT_DIR"
echo ""
echo "=========================================="
echo "Setup Complete (Partial)"
echo "=========================================="
echo ""
echo "✅ Backend deployment attempted"
echo "⚠️  Manual steps required:"
echo "   - Configure database in Vercel Dashboard"
echo "   - Configure photo storage in Vercel Dashboard"
echo "   - Redeploy backend after adding environment variables"
echo ""



