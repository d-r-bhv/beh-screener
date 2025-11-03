# Behaviorally Screener Builder — GitHub Pages

Follow these **one-time** steps:

1) **Edit `vite.config.ts`** and set `base` to your repo name (case-sensitive):
```ts
// Change REPO_NAME to your repository name (e.g., behaviorally-screener)
base: "/REPO_NAME/",
```

2) Commit and push all files to your default branch (usually `main`).

3) In GitHub → **Settings → Pages**:
   - **Build and deployment → Source** = **GitHub Actions**

4) Push again (or wait). The included workflow `.github/workflows/deploy.yml` will build and deploy.
   Your site will be at:
```
https://YOUR-USERNAME.github.io/REPO_NAME/
```

## Local development (optional)
You can run locally if you want:
```bash
npm ci
npm run dev
```