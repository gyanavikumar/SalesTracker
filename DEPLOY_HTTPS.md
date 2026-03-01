# Free HTTPS Deploy (GitHub Pages)

This project is already configured for auto deploy using GitHub Actions.

## 1) Create a GitHub repo and push code
Run these commands inside this project folder:

```bash
git init
git add .
git commit -m "Initial sales tracker app"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If this folder is already a git repo, skip `git init` and only add remote + push.

## 2) Enable GitHub Pages
On GitHub:
1. Open your repo
2. Go to `Settings` -> `Pages`
3. Under `Build and deployment`, set `Source` to `GitHub Actions`

## 3) Wait for deploy
1. Open `Actions` tab
2. Wait for workflow `Deploy static app to GitHub Pages` to complete
3. Your app URL will be:
   `https://<your-username>.github.io/<your-repo>/`

## 4) Install on phone
- Android Chrome: Menu -> `Install app` or `Add to Home screen`
- iPhone Safari: Share -> `Add to Home Screen`

## Notes
- This URL is HTTPS and stable, so install behavior works better than local IP links.
- Your data is still local to each phone/browser (stored in localStorage).
