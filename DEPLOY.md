# How to Share Your CRM Project

## Option 1: Quick Temporary Sharing (ngrok) - 5 minutes

This creates a temporary link that works as long as your local server is running.

1. **Install ngrok:**
   ```bash
   # On Linux/Mac
   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok
   
   # Or download from: https://ngrok.com/download
   ```

2. **Sign up for free ngrok account** (get auth token): https://dashboard.ngrok.com/get-started/setup

3. **Start your dev server:**
   ```bash
   npm run dev
   ```

4. **In another terminal, run:**
   ```bash
   ngrok http 5173
   ```

5. **Copy the HTTPS URL** (looks like `https://abc123.ngrok.io`) and share it!

⚠️ **Note:** Link only works while your computer and dev server are running.

---

## Option 2: Permanent Deployment (Vercel) - 10 minutes

This creates a permanent link that works 24/7.

### Method A: Using Vercel Website (Easiest)

1. **Create account:** Go to https://vercel.com and sign up (free with GitHub/Google)

2. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   - Follow the prompts (press Enter for defaults)
   - When asked "Set up and deploy?", choose **Y**
   - When asked "Which scope?", choose your account
   - When asked "Link to existing project?", choose **N**
   - When asked "Project name?", press Enter (uses folder name)
   - When asked "Directory?", press Enter (uses current directory)
   - When asked "Override settings?", choose **N**

4. **After deployment**, you'll get a URL like: `https://your-project.vercel.app`

5. **Share the URL!** 🎉

### Method B: Using GitHub + Vercel (Best for updates)

1. **Create GitHub repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Vite/React
   - Click "Deploy"

3. **Automatic updates:** Every time you push to GitHub, Vercel auto-deploys!

---

## Option 3: Netlify (Alternative)

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Follow prompts** to create account and get your link!

---

## Quick Commands Reference

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Start dev server
npm run dev
```

---

## Which Should I Choose?

- **Need to share RIGHT NOW?** → Use ngrok (Option 1)
- **Want permanent link?** → Use Vercel (Option 2)
- **Want automatic updates?** → Use Vercel + GitHub (Method B)
