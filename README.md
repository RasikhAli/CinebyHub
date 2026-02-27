# 🎬 CinebyHub — Automated Streaming Index

A fully automated pipeline that scrapes **37,000+ movies, TV shows, and anime** from TMDB, wraps every stream link with **Linkvertise** monetisation, and deploys a professional static web app to **GitHub Pages** — all for free.

---

## 🚀 100% Free Deployment (GitHub Actions + Pages)

This project is designed to be fully autonomous using GitHub's free infrastructure.

### 1-Click Setup Instructions
1.  **Fork this Repository** to your own GitHub account.
2.  **Configure Secrets**:
    - Go to your repo **Settings** > **Secrets and variables** > **Actions**.
    - Add the following **Repository secrets**:
        - `TMDB_API_KEY`: Your TMDB API Key (v3).
        - `TMDB_READ_TOKEN`: Your TMDB Read Access Token (v4 - Recommended).
        - `LINKVERTISE_USER_ID`: Your Linkvertise User ID (e.g., `738317`).
3.  **Enable GitHub Pages**:
    - Go to **Settings** > **Pages**.
    - Under **Build and deployment** > **Source**, select **GitHub Actions**.
4.  **Run the Pipeline**:
    - Go to the **Actions** tab.
    - Select the **Update Content and Deploy** workflow.
    - Click **Run workflow** > **Run workflow**.

**The pipeline will now run automatically every 12 hours** to fetch new content and redeploy your site.

---

## 💰 AdSense Integration

CinebyHub includes built-in placeholders to help you get approved by Google AdSense quickly.

### 1. Enable the AdSense Script
Open `index.html` and look for the AdSense placeholder in the `<head>` section. Uncomment the script and replace `ca-pub-XXXXXXXXXXXXXXXX` with your actual AdSense Publisher ID:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ID" crossorigin="anonymous"></script>
```

### 2. Legal Pages (Pre-created)
Google requires specific pages for approval. We have pre-configured:
- `about.html` (Accessible at `/about.html`)
- `privacy-policy.html` (Accessible at `/privacy-policy.html`)
- `contact.html` (Accessible at `/contact.html`)

You can modify the content of these files in the root directory to match your specific details.

---

## ⚙️ Configuration Essentials

### TMDB Credentials
- Get your free key at → [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
- Supported via environment variables: `TMDB_API_KEY` and `TMDB_READ_TOKEN`.

### Linkvertise
- Get your User ID from your Linkvertise dashboard.
- Supported via environment variable: `LINKVERTISE_USER_ID`.

---

## 🔄 How the Automation Works

The GitHub Actions workflow (`.github/workflows/update.yml`) performs the following steps every 12 hours:

1.  **🔍 Scrape**: Runs `cineby_scraper.py` to fetch the latest trending content from TMDB.
2.  **🔗 Linkvertise**: Runs `linkvertise_api_lite.py` only if new rows are detected. It uses `_checkpoints/` and `cineby_content.xlsx` to skip already processed links.
3.  **🏗️ Build**: Uses Vite to compile the static site into the `dist/` folder.
4.  **🚀 Deploy**: Pushes the `dist/` folder to GitHub Pages.
5.  **💾 Persist**: Uses GitHub Actions Cache and Git commits to ensure checkpoints and row counts are preserved for the next 12-hour cycle.

### Limitations of Static Hosting
- **Search**: Search is client-side (handled by `main.js`). With 37k+ rows, the first load fetches a ~12MB Excel file once.
- **Dynamic Content**: Updates are not real-time; they occur every 12 hours.
- **State**: Any user settings (like theme) are stored in `localStorage` in the browser.

---

## 📁 Project Structure

```
watch-hub-cineby/
├── .github/workflows/update.yml ← 12-hour GHA Scheduler
├── cineby_scraper.py            ← TMDB API scraper
├── linkvertise_api_lite.py      ← Linkvertise link generator
├── run_all.py                   ← Master orchestrator
├── vite.config.js               ← Vite config (Pages compatible)
│
├── index.html                   ← Main Web App
├── about.html                   ← Legal Page
├── privacy-policy.html          ← Legal Page
├── contact.html                 ← Legal Page
│
├── cineby_content.xlsx          ← Source Data
└── public/
    └── cineby_content.xlsx      ← Built Data (Linked)
```

---

## 🛠️ Local Development

If you want to run the project locally:

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    npm install
    ```
2.  **Environment Variables**: Create a `.env` file:
    ```env
    TMDB_API_KEY=your_key
    TMDB_READ_TOKEN=your_token
    LINKVERTISE_USER_ID=your_id
    ```
3.  **Run Pipeline**:
    ```bash
    python run_all.py --once
    ```
4.  **Start Dev Server**:
    ```bash
    npm run dev
    ```

---

## 📜 License
MIT — Created for premium entertainment indexing.
