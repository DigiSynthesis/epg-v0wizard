# Supabase Setup Guide

This guide will walk you through setting up Supabase for the IPTV Playlist Manager.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `iptv-playlist-manager`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

## 2. Get Project Credentials

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Create Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New query"
3. Copy and paste the contents of `lib/database.sql`
4. Click "Run" to execute the SQL

This will create:
- `profiles` table for user data
- `epg_files` table for EPG file metadata
- Row Level Security policies
- Automatic profile creation trigger

## 5. Set Up Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click "New bucket"
3. Enter bucket details:
   - **Name**: `epg-playlists`
   - **Public bucket**: ✅ Enabled
4. Click "Create bucket"

### Configure Storage Policies

1. Click on the `epg-playlists` bucket
2. Go to **Policies** tab
3. Click "New policy" and add these policies:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'epg-playlists' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Policy 2: Allow authenticated users to update their files**
```sql
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'epg-playlists' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Policy 3: Allow public read access**
```sql
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'epg-playlists');
```

## 6. Configure Authentication

1. Go to **Authentication** > **Settings**
2. Under **Auth Providers**, ensure **Email** is enabled
3. **Optional**: Disable email confirmation for easier testing:
   - Scroll to **Email Auth**
   - Uncheck "Enable email confirmations"
4. **Optional**: Configure custom SMTP settings for production

## 7. Test the Setup

1. Start your development server: `npm run dev`
2. Try signing up with a test email
3. Check that:
   - User appears in **Authentication** > **Users**
   - Profile is created in **Database** > **profiles** table
   - You can upload EPG files and they appear in storage

## 8. Production Considerations

### Security
- Enable email confirmation in production
- Set up custom SMTP for reliable email delivery
- Review and tighten RLS policies if needed
- Enable 2FA for your Supabase account

### Performance
- Consider enabling database extensions if needed
- Monitor usage in the dashboard
- Set up database backups

### Monitoring
- Set up alerts for high usage
- Monitor error logs
- Track authentication metrics

## Troubleshooting

### Common Issues

**Environment variables not working:**
- Ensure `.env.local` is in project root
- Restart development server after adding variables
- Check variable names start with `VITE_`

**Storage upload fails:**
- Verify bucket is public
- Check storage policies are correctly set
- Ensure user is authenticated

**Database connection issues:**
- Verify project URL and anon key are correct
- Check if project is paused (free tier limitation)
- Review RLS policies

**Authentication not working:**
- Check email provider settings
- Verify redirect URLs in auth settings
- Review browser console for errors

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

Once Supabase is set up:

1. Deploy your app to Vercel
2. Add the same environment variables to Vercel
3. Test the production deployment
4. Share your app with users!

Your IPTV Playlist Manager now has full cloud capabilities! 🚀