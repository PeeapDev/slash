# Vercel Environment Variables Setup

## 🚀 Quick Setup Guide

When deploying to Vercel, you need to add these environment variables to your project settings.

### 📍 Where to Add:
1. Go to: https://vercel.com/your-username/slash
2. Click **Settings** → **Environment Variables**
3. Add each variable below

---

## 🔐 Required Environment Variables

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://zeyxpxwxtxdyfdfjbcnk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXhweHd4dHhkeWZkZmpiY25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTMwMjgsImV4cCI6MjA3OTQyOTAyOH0.6Sc5TLhdAPnLjeLCiFRYZXFZJcEtoqk8sVrk_C4bDfs

SUPABASE_URL=https://zeyxpxwxtxdyfdfjbcnk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXhweHd4dHhkeWZkZmpiY25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTMwMjgsImV4cCI6MjA3OTQyOTAyOH0.6Sc5TLhdAPnLjeLCiFRYZXFZJcEtoqk8sVrk_C4bDfs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXhweHd4dHhkeWZkZmpiY25rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg1MzAyOCwiZXhwIjoyMDc5NDI5MDI4fQ.dQfRZ6i762SQMh6NWN8bWYwo2dKIP_vaDzh2fkzpTWk
```

### Application Settings
```bash
NEXT_PUBLIC_DATABASE_ENABLED=true
NODE_ENV=production
```

### Authentication (Optional - for future use)
```bash
JWT_SECRET=your-super-secret-key-change-in-production-please
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://slash-taupe.vercel.app
```

---

## ⚙️ How to Add in Vercel Dashboard

### Method 1: One by One
1. Click **Add New** in Environment Variables section
2. Name: `NEXT_PUBLIC_SUPABASE_URL`
3. Value: `https://zeyxpxwxtxdyfdfjbcnk.supabase.co`
4. Environments: Check **Production**, **Preview**, **Development**
5. Click **Save**
6. Repeat for each variable

### Method 2: Bulk Import
1. Click **Add New** → Choose **Bulk Import**
2. Paste all variables at once:
```
NEXT_PUBLIC_SUPABASE_URL=https://zeyxpxwxtxdyfdfjbcnk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXhweHd4dHhkeWZkZmpiY25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTMwMjgsImV4cCI6MjA3OTQyOTAyOH0.6Sc5TLhdAPnLjeLCiFRYZXFZJcEtoqk8sVrk_C4bDfs
SUPABASE_URL=https://zeyxpxwxtxdyfdfjbcnk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXhweHd4dHhkeWZkZmpiY25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTMwMjgsImV4cCI6MjA3OTQyOTAyOH0.6Sc5TLhdAPnLjeLCiFRYZXFZJcEtoqk8sVrk_C4bDfs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXhweHd4dHhkeWZkZmpiY25rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg1MzAyOCwiZXhwIjoyMDc5NDI5MDI4fQ.dQfRZ6i762SQMh6NWN8bWYwo2dKIP_vaDzh2fkzpTWk
NEXT_PUBLIC_DATABASE_ENABLED=true
```
3. Click **Import**

---

## 🔄 After Adding Variables

1. **Redeploy**: Vercel will automatically redeploy
2. **Wait**: 1-2 minutes for deployment
3. **Test**: Visit https://slash-taupe.vercel.app/
4. **Verify**: Check browser console for Supabase connection

---

## ✅ Verification Steps

### Check if Supabase is Connected:
1. Open browser console (F12)
2. Look for Supabase client initialization
3. Should see no "supabaseUrl is required" errors

### Test PWA Install:
1. Visit on phone: https://slash-taupe.vercel.app/
2. Wait 2-3 seconds
3. Install popup should appear
4. Click "Install Now"
5. Follow platform-specific instructions

---

## 🚨 Troubleshooting

### "supabaseUrl is required" Error
- ✅ Ensure `NEXT_PUBLIC_SUPABASE_URL` is set
- ✅ Check variable name has `NEXT_PUBLIC_` prefix
- ✅ Redeploy after adding variables

### Install Popup Not Showing
- ✅ Clear browser cache
- ✅ Check if app is already installed
- ✅ Try in incognito mode
- ✅ Test on mobile device

### Environment Variables Not Working
- ✅ Must have `NEXT_PUBLIC_` prefix for client-side
- ✅ Redeploy is required after changes
- ✅ Check Environment tab shows all variables

---

## 📱 Current Status

- **Deployment URL**: https://slash-taupe.vercel.app/
- **Supabase Project**: zeyxpxwxtxdyfdfjbcnk
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (ready to enable)
- **Offline**: IndexedDB-first
- **Online**: Supabase sync (ready to implement)

---

## 🎯 Next Steps

1. ✅ Add environment variables to Vercel
2. ✅ Verify deployment succeeds
3. ✅ Test PWA install on phone
4. ⏳ Setup Supabase database schema
5. ⏳ Enable authentication
6. ⏳ Build sync engine
7. ⏳ Deploy edge functions

---

**Last Updated**: November 23, 2025  
**Status**: Environment variables configured ✅
