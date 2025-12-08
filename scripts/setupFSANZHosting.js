/**
 * FSANZ Database Hosting Setup Script
 * 
 * Provides instructions and templates for hosting FSANZ databases on various CDN providers
 * 
 * Usage:
 *   node scripts/setupFSANZHosting.js --provider vercel
 *   node scripts/setupFSANZHosting.js --provider aws
 *   node scripts/setupFSANZHosting.js --provider github
 */

const fs = require('fs');
const path = require('path');

const HOSTING_PROVIDERS = {
  vercel: {
    name: 'Vercel',
    free: true,
    instructions: `
## Hosting FSANZ Databases on Vercel (FREE)

### Step 1: Prepare Files
1. Ensure JSON files are in the \`data/\` directory:
   - data/fsanz-au.json
   - data/fsanz-nz.json

### Step 2: Create Vercel Configuration
Create \`vercel.json\` in project root:

\`\`\`json
{
  "version": 2,
  "public": true,
  "rewrites": [
    {
      "source": "/api/fsanz/:country.json",
      "destination": "/data/fsanz-:country.json"
    }
  ],
  "headers": [
    {
      "source": "/api/fsanz/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
\`\`\`

### Step 3: Deploy
\`\`\`bash
npm install -g vercel
vercel --prod
\`\`\`

### Step 4: Update Environment Variables
After deployment, update \`.env\`:
\`\`\`
EXPO_PUBLIC_FSANZ_AU_URL=https://your-project.vercel.app/api/fsanz/au.json
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-project.vercel.app/api/fsanz/nz.json
\`\`\`
    `,
  },
  aws: {
    name: 'AWS S3 + CloudFront',
    free: false,
    instructions: `
## Hosting FSANZ Databases on AWS S3 + CloudFront

### Step 1: Create S3 Bucket
\`\`\`bash
aws s3 mb s3://truescan-fsanz-databases --region us-east-1
\`\`\`

### Step 2: Upload Files
\`\`\`bash
aws s3 cp data/fsanz-au.json s3://truescan-fsanz-databases/fsanz-au.json --content-type "application/json"
aws s3 cp data/fsanz-nz.json s3://truescan-fsanz-databases/fsanz-nz.json --content-type "application/json"
\`\`\`

### Step 3: Make Public
\`\`\`bash
aws s3api put-object-acl --bucket truescan-fsanz-databases --key fsanz-au.json --acl public-read
aws s3api put-object-acl --bucket truescan-fsanz-databases --key fsanz-nz.json --acl public-read
\`\`\`

### Step 4: Set Up CloudFront (Optional but Recommended)
Create CloudFront distribution pointing to S3 bucket for better performance.

### Step 5: Update Environment Variables
\`\`\`
EXPO_PUBLIC_FSANZ_AU_URL=https://your-distribution.cloudfront.net/fsanz-au.json
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-distribution.cloudfront.net/fsanz-nz.json
\`\`\`
    `,
  },
  github: {
    name: 'GitHub Releases',
    free: true,
    instructions: `
## Hosting FSANZ Databases on GitHub Releases (FREE)

### Step 1: Create Release
1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag: v1.0.0
4. Title: FSANZ Databases

### Step 2: Upload Files
1. Drag and drop JSON files:
   - fsanz-au.json
   - fsanz-nz.json
2. Publish release

### Step 3: Get URLs
GitHub provides direct download URLs:
- https://github.com/your-username/your-repo/releases/download/v1.0.0/fsanz-au.json
- https://github.com/your-username/your-repo/releases/download/v1.0.0/fsanz-nz.json

### Step 4: Update Environment Variables
\`\`\`
EXPO_PUBLIC_FSANZ_AU_URL=https://github.com/your-username/your-repo/releases/download/v1.0.0/fsanz-au.json
EXPO_PUBLIC_FSANZ_NZ_URL=https://github.com/your-username/your-repo/releases/download/v1.0.0/fsanz-nz.json
\`\`\`

**Note:** GitHub has a 100MB file size limit per file. If files are larger, use raw.githubusercontent.com:
\`\`\`
EXPO_PUBLIC_FSANZ_AU_URL=https://raw.githubusercontent.com/your-username/your-repo/main/data/fsanz-au.json
EXPO_PUBLIC_FSANZ_NZ_URL=https://raw.githubusercontent.com/your-username/your-repo/main/data/fsanz-nz.json
\`\`\`
    `,
  },
};

function main() {
  const args = process.argv.slice(2);
  let provider = null;
  let list = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--provider' && args[i + 1]) {
      provider = args[i + 1].toLowerCase();
      i++;
    } else if (args[i] === '--list') {
      list = true;
    }
  }
  
  if (list) {
    console.log('\nAvailable Hosting Providers:\n');
    Object.keys(HOSTING_PROVIDERS).forEach((key) => {
      const p = HOSTING_PROVIDERS[key];
      console.log(`  ${key.padEnd(10)} - ${p.name} ${p.free ? '(FREE)' : '(Paid)'}`);
    });
    console.log('');
    return;
  }
  
  if (!provider || !HOSTING_PROVIDERS[provider]) {
    console.error('Usage: node scripts/setupFSANZHosting.js --provider <provider>');
    console.error('       node scripts/setupFSANZHosting.js --list');
    console.error('');
    console.error('Available providers:');
    Object.keys(HOSTING_PROVIDERS).forEach((key) => {
      console.error(`  - ${key}`);
    });
    process.exit(1);
  }
  
  const providerInfo = HOSTING_PROVIDERS[provider];
  console.log(providerInfo.instructions);
  
  // Create example .env entries
  console.log('\n' + '='.repeat(70));
  console.log('Example .env Configuration:');
  console.log('='.repeat(70));
  console.log(`
# FSANZ Database URLs (configure after hosting files)
EXPO_PUBLIC_FSANZ_AU_URL=https://your-cdn.com/fsanz-au.json
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-cdn.com/fsanz-nz.json
  `.trim());
  console.log('');
}

main();










