# Deploy Workaround - Bypass Root Directory Issue

Since Vercel root directory keeps causing issues, here's a workaround:

## Solution: Deploy from Project Root

Instead of deploying from `backend/vercel`, we'll deploy from project root with proper configuration.

### Step 1: Create vercel.json in Project Root

Create a `vercel.json` file in the project root (`C:\TrueScan-FoodScanner\vercel.json`) that points to the backend:

```json
{
  "version": 2,
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": ".",
  "functions": {
    "backend/vercel/api/**/*.ts": {
      "runtime": "@vercel/node"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/vercel/api/$1"
    }
  ]
}
```

### Step 2: Deploy from Project Root

```powershell
cd C:\TrueScan-FoodScanner
vercel --prod
```

When asked "In which directory is your code located?" → Answer: `./` (current directory)

## Alternative: Use Vercel API Directly

If the above doesn't work, we can update the project settings via API.

