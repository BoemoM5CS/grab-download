# GRAB — Next.js + Vercel + Supabase
### Works on any phone browser. Installable as a home screen app.

---

## Why this approach?
No Android Studio, no EAS, no build errors. Deploy to Vercel in 5 minutes,
open on any phone browser, tap "Add to Home Screen" — done. Works like a real app.

---

## STEP 1 — Set up Supabase (download history)

1. Go to **https://supabase.com** → Sign up (free)
2. Click **New Project** → give it a name (e.g. "grab") → set a password → Create
3. Wait ~1 minute for it to finish
4. Go to **SQL Editor** → **New Query**
5. Open the file `supabase-setup.sql` from this project
6. Copy all the SQL → paste into the editor → click **Run**
7. Go to **Settings → API**
8. Copy your **Project URL** and **anon public key** — you'll need them in Step 3

---

## STEP 2 — Push to GitHub

1. Go to **https://github.com** → Sign in → **New repository**
2. Name it `grab-downloader` → Create (keep it private)
3. Open terminal in this project folder and run:
```
git init
git add .
git commit -m "GRAB v1"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/grab-downloader.git
git push -u origin main
```

---

## STEP 3 — Deploy to Vercel

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **Add New Project** → Import your `grab-downloader` repo
3. Before clicking Deploy, click **Environment Variables** and add:

| Name | Value |
|------|-------|
| `COBALT_INSTANCE` | `https://cobalt-api-production-8dd7.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |

4. Click **Deploy** — done in ~1 minute
5. Vercel gives you a URL like `https://grab-downloader.vercel.app`

---

## STEP 4 — Install on your phone

1. Open the Vercel URL on your phone browser
2. **Android Chrome:** tap ⋮ menu → "Add to Home screen"
3. **iPhone Safari:** tap Share → "Add to Home Screen"

GRAB appears on your home screen with the lime icon. Opens fullscreen, no browser bar — just like a real app.

---

## Local development

```bash
npm install
npm run dev
```
Open http://localhost:3000

For local dev, edit `.env.local` with your keys.

---

## Troubleshooting

**Downloads say "0MB"**
→ This is fixed — the stream proxy pipes bytes through Vercel

**History not saving**
→ Check your Supabase URL and anon key in Vercel env vars
→ Make sure you ran the SQL setup in Step 1

**Cobalt returns auth error**
→ Your Railway instance may be sleeping — open the Railway URL in browser to wake it, retry

**Vercel deployment fails**
→ Check that all 3 environment variables are set correctly
