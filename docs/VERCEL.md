# 🚀 Vercel Deployment Guide

Complete guide to deploying RepoArchitectAgent to Vercel.

---

## Overview

Vercel is the optimal platform for hosting Next.js applications with:
- ✅ Zero-configuration deployment
- ✅ Automatic scaling and edge caching
- ✅ GitHub integration with preview deployments
- ✅ Environment variable management
- ✅ SSL/TLS certificates
- ✅ Analytics and monitoring

**Expected deployment time**: 3-5 minutes after setup

---

## Prerequisites

### Required
- ✅ GitHub repository with code pushed
- ✅ Vercel account (free) - https://vercel.com/signup
- ✅ GitHub account linked to Vercel

### Environment Variables (set in Vercel)
- 📌 `GITHUB_TOKEN` - GitHub API access (required for PR creation)
- 📌 `OUMI_API_KEY` - Oumi LLM API key (optional, for AI summaries)
- 📌 `OPENAI_API_KEY` - OpenAI API key (optional, fallback)

---

## Step 1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your GitHub repositories
4. Confirm email address

---

## Step 2: Import Project from GitHub

### Option A: From Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click **"Add New..." → "Project"**
3. Click **"Import Git Repository"**
4. Search for your repository: `RepoArchitectAgent`
5. Click **"Import"**

### Option B: From GitHub

1. Go to your GitHub repository
2. Click **"Settings" → "Integrations"**
3. Find and authorize **Vercel for GitHub**
4. Select your repository
5. Vercel will auto-import and begin deployment

---

## Step 3: Configure Project Settings

After importing, you'll see the configuration screen:

### Framework
- **Framework Preset**: Next.js ✅ (auto-detected)
- **Build Command**: `npm run build` ✅ (auto-detected)
- **Output Directory**: `.next` ✅ (auto-detected)
- **Install Command**: `npm ci` ✅ (auto-detected)
- **Development Command**: `npm run dev` ✅ (auto-detected)

### Root Directory
- **Root Directory**: `web` (set this if not auto-detected)

Click **"Continue"** to proceed.

---

## Step 4: Set Environment Variables

### In Vercel Dashboard

1. Click **"Environment Variables"** tab
2. Add the following variables:

#### GitHub Token (Required for PR Creation)
```
Name: GITHUB_TOKEN
Value: ghp_xxxxxxxxxxxxxxxxxxxxx
Environments: Production, Preview, Development
```

Get GitHub token:
1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"**
3. Name: `RepoArchitectAgent`
4. Scopes: Check ✅ `repo`, `workflow`
5. Click **"Generate token"**
6. Copy and paste into Vercel

#### Oumi API Key (Optional - for AI Summaries)
```
Name: OUMI_API_KEY
Value: oumi_sk_xxxxxxxxxxxxxxxxxxxxx
Environments: Production, Preview, Development
```

Get Oumi API key:
1. Go to https://www.oumi.ai/
2. Sign up / Log in
3. Navigate to API settings
4. Create API key
5. Copy into Vercel

#### OpenAI API Key (Optional - Fallback LLM)
```
Name: OPENAI_API_KEY
Value: sk-proj-xxxxxxxxxxxxxxxxxxxxx
Environments: Production, Preview, Development
```

Get OpenAI API key:
1. Go to https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Copy into Vercel

### Click "Deploy" to Finish Setup

---

## Step 5: Verify Deployment

### Check Deployment Status

1. You'll see a **"Deployment"** section with progress
2. Wait for status to change from **"Building"** → **"Ready"**
3. Expected time: 2-3 minutes

### View Live Application

Once deployment is complete:
- **Production URL**: `https://repoarchitectagent.vercel.app` (or custom domain)
- **Preview URLs**: Created automatically for PRs

Click the URL to open your live application!

---

## Step 6: Enable GitHub Integration

### Automatic Preview Deployments

Vercel automatically creates preview deployments for PRs:

1. Go to **Project Settings → Git**
2. Ensure **"Deploy on Push to main"** is enabled ✅
3. Ensure **"Preview Deployments"** is enabled ✅

Now:
- Push to `main` → Production deployment
- Create PR → Preview deployment with unique URL

### Preview URLs in Pull Requests

Each PR will get:
- 🔗 Preview URL in GitHub comments
- 📊 Analytics and logs
- ⚡ Real-time updates

---

## Step 7: Configure Custom Domain (Optional)

### Add Custom Domain

1. Go to **Project Settings → Domains**
2. Click **"Add"**
3. Enter domain: `repoarchitectagent.com`
4. Choose verification method:
   - **CNAME** (recommended): Add DNS record
   - **Nameserver**: Change domain registrar settings

### DNS Configuration (CNAME method)

Add to your DNS provider:
```
Type: CNAME
Name: repoarchitectagent
Value: cname.vercel-dns.com
TTL: 3600
```

Propagation time: 5-48 hours

---

## Step 8: Monitor Deployments

### View Deployment Logs

1. Go to **Deployments** tab
2. Click on any deployment
3. View:
   - Build logs
   - Runtime logs
   - Error messages
   - Performance metrics

### Analytics

1. Go to **Analytics** tab
2. View:
   - Page views
   - Response times
   - Edge cache hit rates
   - Error rates

---

## Troubleshooting

### Deployment Status: Failed

**Error**: Build failed during deployment

**Solutions**:
1. Check build logs: Click deployment → View logs
2. Verify environment variables are set
3. Ensure `web/` is the root directory
4. Try manual redeploy: Settings → Deployments → Redeploy

### Error: "Can't find package.json"

**Solution**: Set **Root Directory** to `web`

1. Go to **Settings → General**
2. Set **Root Directory**: `web`
3. Redeploy

### Environment Variables Not Working

**Solution**: Ensure variables are saved and deployment restarted

1. Go to **Settings → Environment Variables**
2. Verify all variables present
3. Click **"Redeploy"** to apply changes

### Preview Deployment Not Triggering

**Solution**: Check GitHub integration

1. Go to **Settings → Git**
2. Click **"Reconnect"** if needed
3. Re-authorize GitHub
4. Try creating new PR

### 503 Service Unavailable

**Solution**: Wait for deployment to complete

1. Check status: Go to **Deployments**
2. Wait for status to change from "Building" to "Ready"
3. If stuck, click **"Redeploy"**

### CORS Errors When Calling API

**Solution**: Configure CORS headers in `vercel.json`

Already configured in [vercel.json](../vercel.json):
```json
"headers": [
  {
    "source": "/api/:path*",
    "headers": [
      { "key": "Access-Control-Allow-Origin", "value": "*" }
    ]
  }
]
```

---

## Performance Optimization

### Edge Caching

Vercel automatically caches:
- ✅ Static assets (images, CSS, JS)
- ✅ API responses (with proper headers)
- ✅ Pages (with ISR - Incremental Static Regeneration)

### Serverless Functions

API routes run as serverless functions:
- ⚡ Scale automatically
- 💰 Pay only for usage
- 🚀 Instant cold start (<100ms)

### Web Vitals

Monitor performance:
1. Go to **Analytics → Web Vitals**
2. Check:
   - **LCP** (Largest Contentful Paint) - Target: <2.5s
   - **FID** (First Input Delay) - Target: <100ms
   - **CLS** (Cumulative Layout Shift) - Target: <0.1

---

## Secrets Management

### Secure Sensitive Data

Never commit secrets to repository:
```bash
# ❌ DON'T do this
echo "GITHUB_TOKEN=ghp_xxx" >> .env.local

# ✅ DO this
# Set in Vercel dashboard: Settings → Environment Variables
```

### Rotate Tokens Regularly

1. Go to https://github.com/settings/tokens
2. Find old token
3. Click **"Regenerate"**
4. Update in Vercel
5. Redeploy

---

## Deployment Checklist

- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Root directory set to `web`
- [ ] GITHUB_TOKEN environment variable set
- [ ] OUMI_API_KEY environment variable set (optional)
- [ ] OPENAI_API_KEY environment variable set (optional)
- [ ] First deployment completed successfully
- [ ] Production URL accessible and working
- [ ] GitHub integration enabled
- [ ] Preview deployments working
- [ ] Analytics accessible

---

## Common Deployment Scenarios

### Scenario 1: Update Code and Deploy

```bash
# 1. Make changes locally
git add .
git commit -m "feat: add new feature"

# 2. Push to GitHub
git push origin main

# 3. Vercel deploys automatically
# (Check: vercel.com/dashboard → Deployments)

# 4. Live at: https://repoarchitectagent.vercel.app
```

### Scenario 2: Update Environment Variables

```bash
# 1. Go to Vercel Dashboard
# 2. Settings → Environment Variables
# 3. Update variable value
# 4. Click "Redeploy"
# 5. Wait 1-2 minutes
# 6. Test changes on live site
```

### Scenario 3: Rollback to Previous Deployment

```bash
# 1. Go to Deployments tab
# 2. Find previous stable version
# 3. Click "..." menu
# 4. Select "Promote to Production"
# 5. Confirm rollback
```

---

## GitHub Actions Workflow

The included `.github/workflows/deploy.yml` provides:

1. **On Push to Main**
   - Build Next.js app
   - Run linting
   - Deploy to Vercel (production)

2. **On Pull Request**
   - Build Next.js app
   - Deploy preview to Vercel
   - Comment preview URL in PR

3. **Build Artifacts**
   - Store `.next` build
   - 7-day retention
   - Fast redeploys

**No additional setup needed** - just push and deploy!

---

## Monitoring and Alerts

### Error Tracking

Vercel includes error tracking:
- Go to **Monitor** tab
- View errors, logs, and performance data
- Set up email alerts

### Performance Monitoring

Track application health:
1. **Web Vitals** - Core Web Vitals metrics
2. **Analytics** - Real user monitoring
3. **Logs** - Runtime and build logs
4. **Activity** - Deployment history

---

## Next Steps After Deployment

1. **Share URL** - `https://repoarchitectagent.vercel.app`
2. **Test Features** - Analyze real repositories
3. **Collect Feedback** - Use analytics to see usage
4. **Monitor Logs** - Watch for errors
5. **Update Code** - Push changes, auto-deploy
6. **Scale Up** - Upgrade plan if needed

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **GitHub Integration**: https://vercel.com/docs/git/vercel-for-github
- **Environment Variables**: https://vercel.com/docs/environment-variables
- **Troubleshooting**: https://vercel.com/support

---

## FAQ

**Q: Is Vercel free?**  
A: Yes! Hobby plan is free. Includes: 10 serverless functions, 100GB bandwidth/month, Git integration.

**Q: Can I use a custom domain?**  
A: Yes! Free tier includes 1 custom domain. Add via Settings → Domains.

**Q: How do I access environment variables in code?**  
A: In server-side code: `process.env.VARIABLE_NAME`

**Q: Do I need to set environment variables locally?**  
A: No - use `.env.local` locally, Vercel dashboard for production.

**Q: How long do deployments take?**  
A: Usually 1-2 minutes. Build logs show progress.

**Q: Can I preview before deploying?**  
A: Yes - create a PR and Vercel creates a preview deployment automatically.

---

**Ready to deploy?** Follow the 8 steps above, and your app will be live in minutes! 🚀
