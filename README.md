# NovaCast

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-6ch1hfxj)

## Deployment 

### Local build and deploy

1. Add your production Supabase values to `.env.production`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=pk.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
2. Build locally:
   ```bash
   npm run build
   ```
3. Preview locally:
   ```bash
   npm run preview
   ```
4. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

### GitHub Actions CI deploy

This repository includes a workflow at `.github/workflows/firebase-hosting.yml`.

To use it, add these GitHub Secrets to your repository settings:

- `FIREBASE_TOKEN`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` 

When you push to `main`, GitHub Actions will:

- install dependencies
- create `.env.production` from secrets
- build the app
- deploy to Firebase Hosting
