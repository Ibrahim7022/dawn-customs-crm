# Fix: "Forbidden use of secret API key in browser" Error

## The Problem

You're getting this error because you're using the **wrong API key** in Vercel environment variables.

Supabase has **two types of keys**:
1. ✅ **anon public** key - Safe for browser (USE THIS ONE)
2. ❌ **service_role** key - Secret, never use in browser

## The Solution

### Step 1: Get the Correct Key from Supabase

1. Go to: https://app.supabase.com/project/hfmumaaqssmcsbqwymdw/settings/api
2. Scroll to **"Project API keys"** section
3. Find **"anon public"** key (NOT service_role!)
4. Copy the **anon public** key (it's a long string starting with `eyJ...`)

### Step 2: Update Vercel Environment Variables

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your project: `dawn-customs-crm` (or your project name)
3. Click on the project
4. Go to **Settings** → **Environment Variables**
5. Find `VITE_SUPABASE_ANON_KEY`
6. Click **Edit**
7. **Delete the current value** (it might be the service_role key)
8. **Paste your "anon public" key** (the one you copied from Supabase)
9. Make sure it's set for **Production**, **Preview**, and **Development**
10. Click **Save**

### Step 3: Redeploy

After updating the environment variable:

1. Go to **Deployments** tab in Vercel
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete
5. Test the connection again

## How to Verify You Have the Right Key

The **anon public** key:
- ✅ Starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ✅ Is labeled "anon public" in Supabase
- ✅ Is safe to use in browser code
- ✅ Usually around 150-200 characters long

The **service_role** key (WRONG):
- ❌ Starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (same start, but different)
- ❌ Is labeled "service_role" in Supabase
- ❌ Should NEVER be used in browser
- ❌ Usually longer than anon key

## Quick Checklist

- [ ] Opened Supabase API settings
- [ ] Copied "anon public" key (NOT service_role)
- [ ] Updated `VITE_SUPABASE_ANON_KEY` in Vercel
- [ ] Set for Production, Preview, and Development
- [ ] Redeployed the application
- [ ] Tested connection again

## Still Having Issues?

If you're still getting the error after following these steps:

1. **Double-check** you're using "anon public" key
2. **Clear browser cache** and try again
3. **Check Vercel logs** for any errors
4. **Verify** the environment variable name is exactly: `VITE_SUPABASE_ANON_KEY`

## Security Note

- ✅ The **anon public** key is safe to expose in frontend code
- ❌ The **service_role** key should NEVER be in frontend code
- ✅ Environment variables in Vercel are secure and not exposed to users
