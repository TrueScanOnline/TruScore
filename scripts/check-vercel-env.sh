#!/bin/bash
# Check Vercel Environment Variables
# This script helps verify that required environment variables are set in Vercel

echo "=========================================="
echo "Vercel Environment Variables Check"
echo "=========================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo "   Install with: npm i -g vercel"
    exit 1
fi

echo "Checking Vercel environment variables..."
echo ""

# Get environment variables from Vercel
ENV_VARS=$(vercel env ls 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "⚠️  Could not fetch environment variables from Vercel"
    echo "   Make sure you're logged in: vercel login"
    echo "   And in the correct project directory"
    exit 1
fi

# Check for required variables
REQUIRED_VARS=(
    "POSTGRES_URL"
    "MONGODB_URI"
)

OPTIONAL_VARS=(
    "BLOB_READ_WRITE_TOKEN"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "OFF_USERNAME"
    "OFF_PASSWORD"
)

echo "Required Variables (at least one database must be set):"
echo "--------------------------------------------------------"

HAS_DATABASE=false

for var in "${REQUIRED_VARS[@]}"; do
    if echo "$ENV_VARS" | grep -q "$var"; then
        echo "✅ $var is set"
        if [[ "$var" == "POSTGRES_URL" ]] || [[ "$var" == "MONGODB_URI" ]]; then
            HAS_DATABASE=true
        fi
    else
        echo "❌ $var is NOT set"
    fi
done

if [ "$HAS_DATABASE" = false ]; then
    echo ""
    echo "⚠️  WARNING: No database is configured!"
    echo "   Backend will use in-memory storage (data lost on restart)"
    echo "   Set POSTGRES_URL or MONGODB_URI in Vercel dashboard"
fi

echo ""
echo "Optional Variables (recommended for production):"
echo "------------------------------------------------"

HAS_PHOTO_STORAGE=false

for var in "${OPTIONAL_VARS[@]}"; do
    if echo "$ENV_VARS" | grep -q "$var"; then
        echo "✅ $var is set"
        if [[ "$var" == "BLOB_READ_WRITE_TOKEN" ]] || [[ "$var" == "CLOUDINARY_CLOUD_NAME" ]]; then
            HAS_PHOTO_STORAGE=true
        fi
    else
        echo "⚠️  $var is NOT set (optional)"
    fi
done

if [ "$HAS_PHOTO_STORAGE" = false ]; then
    echo ""
    echo "⚠️  WARNING: Photo storage is not configured!"
    echo "   Large photos may fail to upload"
    echo "   Set BLOB_READ_WRITE_TOKEN or Cloudinary credentials"
fi

echo ""
echo "=========================================="
echo "Summary:"
echo "=========================================="

if [ "$HAS_DATABASE" = true ] && [ "$HAS_PHOTO_STORAGE" = true ]; then
    echo "✅ Backend is properly configured for production"
    exit 0
elif [ "$HAS_DATABASE" = true ]; then
    echo "⚠️  Database is configured, but photo storage is missing"
    exit 0
else
    echo "❌ Database is NOT configured - CRITICAL for production"
    exit 1
fi

