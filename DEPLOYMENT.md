# TARAS Student Monitoring System - Netlify Deployment Guide

This document provides step-by-step instructions for deploying the **TARAS Student Monitoring System** to **Netlify** and configuring the Supabase PostgreSQL database.

---

## 🚀 Step-by-Step Netlify Deployment

### Step 1: Push Repository to GitHub
Ensure all changes in `taras_app/` are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Initial release of TARAS Student Monitoring System"
git push origin main
```

### Step 2: Open Netlify Dashboard
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Select **GitHub** and authorize access to your repository.

### Step 3: Configure Build Settings
Set the following deployment settings:
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`

*(Note: `netlify.toml` in the repository automatically configures build settings and SPA redirect rules).*

### Step 4: Environment Variables
Add the following Environment Variables under **Site Configuration > Environment variables**:

| Key | Example Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your-supabase-anon-key-here` |
| `VITE_API_URL` | `https://your-fastapi-backend-domain.com` |

### Step 5: Deploy Site
Click **Deploy Site**. Netlify will run `npm install` and `npm run build`, publishing the single page application to a live HTTPS URL.

---

## 🗄️ Supabase Database Setup

1. Log in to [Supabase](https://supabase.com/).
2. Create a new project named `taras-student-monitor`.
3. Open the **SQL Editor** in the Supabase Dashboard.
4. Copy the entire contents of `supabase/schema.sql` from this repository and click **Run**.
5. This creates the `users`, `students`, `activities`, `participation`, and `audit_logs` tables along with Row Level Security (RLS) policies and sample seed data.

---

## 🧪 Production Build Verification Checklist

Verify the build locally prior to deployment:
```bash
cd frontend
npm install
npm run build
npm run preview
```

### Checks:
- [x] Login page renders cleanly.
- [x] Switching between President, Staff, and Student roles activates correct UI permissions.
- [x] Direct URL refreshes (e.g. `/students`, `/dashboard`, `/activities`) return HTTP 200 via `_redirects`.
- [x] Student add, edit, and deactivate modal flows complete with toast notifications.
- [x] Data export generates valid CSV files and printable PDF windows.
- [x] Mobile responsive drawer and cards function cleanly on touch screens.
