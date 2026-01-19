# Supabase Setup Guide for Dawn Customs CRM

This guide will help you set up Supabase for automatic data synchronization across all your devices.

## What is Supabase?

Supabase is an open-source Firebase alternative that provides:
- ✅ PostgreSQL database (free tier: 500MB)
- ✅ Real-time data synchronization
- ✅ Automatic API generation
- ✅ Built-in authentication
- ✅ Free tier available

## Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

## Step 2: Create a New Project

1. Click "New Project"
2. Fill in the details:
   - **Organization:** Create new or select existing
   - **Name:** `dawn-customs-crm` (or any name you prefer)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free (to start)
3. Click "Create new project"
4. Wait 2-3 minutes for project to be created

## Step 3: Get Your API Keys

1. Once project is ready, go to **Settings** → **API**
2. You'll see:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
3. **Copy both values** - you'll need them in the next step

## Step 4: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `supabase-schema.sql` from this project
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

## Step 5: Configure Environment Variables

1. In your project root, create a file named `.env` (if it doesn't exist)
2. Add these lines:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace:**
- `https://xxxxx.supabase.co` with your Project URL
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with your anon public key

3. **Important:** If you're using Git, make sure `.env` is in `.gitignore` (it should be already)

## Step 6: Test the Connection

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. Go to **Settings** → **Data Management**
4. You should see a "Supabase Sync" section
5. Click "Test Connection"
6. If successful, you'll see "Connected to Supabase successfully"

## Step 7: Initial Data Sync

1. In Settings → Data Management
2. Click "Sync to Supabase" to upload your existing local data
3. Wait for confirmation message
4. Your data is now in the cloud!

## How It Works

### Automatic Sync
- Changes are automatically synced to Supabase every 30 seconds
- Real-time updates: Changes on one device appear on others instantly
- All data is stored in PostgreSQL database

### Manual Sync
- Click "Sync to Supabase" anytime to force a sync
- Click "Load from Supabase" to download latest data

### Real-time Updates
- When you add a customer on Device A, Device B sees it immediately
- No need to refresh or manually sync
- Works across all devices simultaneously

## Troubleshooting

### "Supabase not configured" error
- Check that `.env` file exists in project root
- Verify environment variables are correct
- Restart development server after adding `.env`

### "Failed to connect" error
- Verify your Project URL is correct
- Check your anon key is correct
- Make sure database schema is set up (Step 4)

### Data not syncing
- Check browser console for errors
- Verify Supabase project is active (not paused)
- Check internet connection
- Try manual sync first

### Tables don't exist
- Run the SQL schema again (Step 4)
- Check SQL Editor for any errors
- Verify tables exist in Table Editor

## Security Notes

- The `anon` key is safe to use in frontend code
- It has limited permissions (only what we defined)
- For production, consider setting up Row Level Security (RLS)
- Never commit your `.env` file to Git

## Free Tier Limits

Supabase Free Tier includes:
- ✅ 500MB database storage
- ✅ 2GB bandwidth per month
- ✅ 50,000 monthly active users
- ✅ Real-time subscriptions
- ✅ Automatic backups

For most small businesses, this is more than enough!

## Next Steps

1. ✅ Set up Supabase (this guide)
2. ✅ Configure environment variables
3. ✅ Run database schema
4. ✅ Test connection
5. ✅ Sync your data
6. 🎉 Enjoy automatic sync across all devices!

## Support

If you encounter issues:
1. Check Supabase dashboard for errors
2. Check browser console for JavaScript errors
3. Verify all steps were completed correctly
4. Check Supabase documentation: https://supabase.com/docs

## Migration from Local Storage

Your existing local storage data will be preserved. When you sync:
- Local data is uploaded to Supabase
- Supabase becomes the source of truth
- All devices sync from Supabase
- Local storage still works as backup

You can always export your data from Settings if needed.
