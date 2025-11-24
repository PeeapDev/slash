# 🚀 Vercel Deployment Setup Guide

## ⚠️ CRITICAL: Add Environment Variables to Vercel

Your deployment is failing because Supabase environment variables are **missing on Vercel**.

---

## 📋 **Step-by-Step Instructions:**

### **1. Go to Vercel Dashboard**
- Open https://vercel.com/dashboard
- Find your **SLASH** project
- Click on the project

### **2. Go to Settings → Environment Variables**
- Click **"Settings"** tab
- Click **"Environment Variables"** in the sidebar

### **3. Add These Environment Variables:**

Copy these **EXACT** values from your `.env.local` file:

```bash
# REQUIRED - Add these to Vercel:

NEXT_PUBLIC_SUPABASE_URL=https://zeyxpxwxtxdyfdfjbcnk.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXhweHd4dHhkeWZkZmpiY25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTMwMjgsImV4cCI6MjA3OTQyOTAyOH0.6Sc5TLhdAPnLjeLCiFRYZXFZJcEtoqk8sVrk_C4bDfs

SUPABASE_URL=https://zeyxpxwxtxdyfdfjbcnk.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXhweHd4dHhkeWZkZmpiY25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTMwMjgsImV4cCI6MjA3OTQyOTAyOH0.6Sc5TLhdAPnLjeLCiFRYZXFZJcEtoqk8sVrk_C4bDfs

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXhweHd4dHhkeWZkZmpiY25rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg1MzAyOCwiZXhwIjoyMDc5NDI5MDI4fQ.dQfRZ6i762SQMh6NWN8bWYwo2dKIP_vaDzh2fkzpTWk

NEXT_PUBLIC_DATABASE_ENABLED=true

JWT_SECRET=your-super-secret-key-change-in-production-please

NEXTAUTH_SECRET=your-nextauth-secret-key

NEXTAUTH_URL=https://slash-taupe.vercel.app
```

---

## 🔐 **How to Add Each Variable:**

For **each** variable above:

1. Click **"Add New"** button
2. **Name:** Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. **Value:** Paste the value (e.g., `https://zeyxpxwxtxdyfdfjbcnk.supabase.co`)
4. **Environment:** Select **ALL** (Production, Preview, Development)
5. Click **"Save"**

Repeat for all 8 variables above.

---

## ✅ **After Adding Variables:**

### **Option 1: Auto-Deploy (Recommended)**
Just **push** new code and Vercel will auto-deploy with the new env vars.

### **Option 2: Manual Redeploy**
1. Go to **"Deployments"** tab
2. Find the **latest failed deployment**
3. Click **"⋯"** (three dots)
4. Click **"Redeploy"**
5. Check **"Use existing build cache"**: **OFF**
6. Click **"Redeploy"**

---

## 📝 **Verification:**

After deployment completes:

1. ✅ Build should succeed (no "supabaseUrl is required" error)
2. ✅ App should load correctly
3. ✅ Data sync should work when online

---

## 🔍 **Check Build Logs:**

To verify it worked:
1. Go to **"Deployments"** tab
2. Click on the **latest deployment**
3. Check the **build logs**
4. Look for: `✓ Compiled successfully`

---

## 🆘 **If Still Failing:**

1. **Double-check** all variable names (case-sensitive!)
2. **No spaces** before/after values
3. **All 8 variables** added
4. **Environment** set to ALL
5. Try **clearing Vercel cache**:
   - Settings → General
   - Scroll to "Build & Development Settings"
   - Click "Clear Cache"

---

## 📱 **What This Fixes:**

✅ Vercel deployment errors
✅ Offline data sync to Supabase
✅ Real-time updates
✅ Cloud backup
✅ Multi-device sync

---

## 🎯 **Summary:**

| Issue | Solution |
|-------|----------|
| Build failing with "supabaseUrl required" | Add env vars to Vercel |
| Data not syncing | Sync engine now auto-starts |
| Offline data lost | Syncs to cloud when online |

---

**Ready to deploy! 🚀**
