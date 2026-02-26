# 🎬 CinebyHub — Automated Streaming Index

A fully automated pipeline that scrapes **37,000+ movies, TV shows, and anime** from TMDB, wraps every stream link with **Linkvertise** monetisation, and serves them through a beautiful dark-mode web app — all with a single command.

---

## ✨ What It Does

```
Every 12 hours (automatically):
  1. 🔍  TMDB Scraper       → Fetches new movies, TV, anime from TMDB API
  2. 🔗  Linkvertise Gen    → Wraps only NEW stream URLs (skips existing ones)
  3. 🌐  Vite Web App       → Stays running 24/7 in the background
```

> **Smart detection:** The Linkvertise step only runs when the scraper finds new content rows. If nothing changed, the scheduler sleeps and waits for the next cycle — saving time and API calls.

---

## 📁 Project Structure

```
watch-hub-cineby/
├── run_all.py                 ← Master runner / 12-hour scheduler
├── cineby_scraper.py          ← TMDB API scraper (movies, TV, anime, channels)
├── linkvertise_api_lite.py    ← Linkvertise link generator (incremental)
│
├── cineby_content.xlsx        ← Local source data (from scraper)
├── public/
│   ├── cineby_content.xlsx    ← Output data (with Linkvertise links)
│   └── _checkpoints/
│       ├── row_counts.json    ← Row-count snapshot (change detection)
│       └── *.csv              ← Per-sheet Linkvertise progress checkpoints
│
├── index.html                 ← Web app entry point
├── main.js                    ← Web app logic (search, filter, modal)
├── style.css                  ← Dark-mode premium UI styles
├── package.json               ← Vite + dependencies
└── src/                       ← Additional JS modules
```

---

## ⚙️ Setup

### 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.10+ | Scraper + link generator |
| Node.js | 18+ | Vite web server |
| TMDB API Key | — | Content scraping |

### 2. Install Python dependencies

```bash
pip install requests pandas openpyxl tqdm linkvertise
```

### 3. Install Node dependencies

```bash
cd watch-hub-cineby
npm install
```

### 4. Configure your TMDB API key

Open `cineby_scraper.py` and set your key at the top:

```python
API_KEY = "your_tmdb_read_access_token_here"
```

> Get a free key at → [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)

### 5. Configure your Linkvertise User ID

Open `linkvertise_api_lite.py`:

```python
USER_ID = "738317"   # ← Replace with your Linkvertise user ID
```

---

## 🚀 Running the Pipeline

### Full auto-mode (recommended)

```bash
python run_all.py
```

Starts the web app, runs the scraper, generates Linkvertise links for new content, then loops every **12 hours** automatically.

### Common flags

```bash
# Run once and exit (no loop)
python run_all.py --once

# Change check interval (e.g. every 6 hours)
python run_all.py --interval 6

# Skip scraping this cycle, just run LV + web
python run_all.py --no-scrape

# Just launch the web server (no scraping/LV)
python run_all.py --web-only

# Force Linkvertise to run even if no new rows
python run_all.py --force-lv

# Don't auto-open browser tab
python run_all.py --no-browser
```

### Running individual scripts

```bash
# Only scrape TMDB data
python cineby_scraper.py

# Only generate Linkvertise links
python linkvertise_api_lite.py

# Only start the web app
npm run dev
```

---

## 🔄 How the Smart Scheduler Works

```
┌─────────────────────────────────────┐
│  Startup                            │
│  → Launch web server (background)   │
│  → Run first pipeline cycle         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Every 12 hours:                    │
│  1. Run TMDB scraper                │
│  2. Count rows in Excel             │
│  3. Compare to saved row counts     │
│     ┌─ NEW ROWS? ──────────────┐    │
│     │  YES → Run Linkvertise   │    │
│     │  NO  → Skip (save time) │    │
│     └──────────────────────────┘    │
│  4. Save updated row counts         │
│  5. Sleep until next cycle          │
└─────────────────────────────────────┘
```

Row counts are saved to `public/_checkpoints/row_counts.json`. Linkvertise progress per-sheet is checkpointed to `public/_checkpoints/*.csv` — so if the process is interrupted mid-way, it **resumes exactly where it left off**.

---

## 🌐 Web App Features

- 🔍 **Live search** across 37,000+ titles
- 🎭 **Genre filtering** with multi-select
- 🌗 **Dark / Light mode** toggle
- 📋 **Content tabs** — Movies, TV Shows, Anime Series, Anime Movies, Channels
- 🖼️ **Poster thumbnails** with fallback
- 🎬 **Detail modal** with full metadata, ratings, and stream links
- 📱 **Fully responsive** — mobile, tablet, desktop

---

## 🚢 Free Deployment Options

### Option A — **Railway** ⭐ (Best overall)
> Runs Python + Node together, persistent filesystem, always-on

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

- ✅ Free tier: 500 hours/month
- ✅ Persistent disk (keeps your Excel files between restarts)
- ✅ Runs Python scheduler + Node web server together
- ✅ Auto-restarts on crash
- 🌐 [railway.app](https://railway.app)

**Procfile** to create in project root:
```
web: python run_all.py --no-browser & npm run preview -- --host 0.0.0.0 --port $PORT
```

---

### Option B — **Render** ⭐ (Great free tier)
> Good for web services, 750 free hours/month

1. Push your project to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Set build command: `npm install && pip install -r requirements.txt`
4. Set start command: `python run_all.py --no-browser`

- ✅ Free 750 hours/month
- ✅ GitHub auto-deploy on push
- ⚠️ Disk is ephemeral (files reset on restart) → use Render Disk add-on ($1/mo) for persistence
- 🌐 [render.com](https://render.com)

---

### Option C — **Fly.io** (Most powerful free tier)
> 3 shared VMs free, persistent volumes, Docker-based

```bash
# Install flyctl
# https://fly.io/docs/getting-started/installing-flyctl/

fly auth login
fly launch
fly volumes create cineby_data --size 1   # persistent disk
fly deploy
```

- ✅ 3 free VMs (256MB RAM each)
- ✅ Persistent volumes for Excel data
- ✅ Runs 24/7 without sleeping
- 🌐 [fly.io](https://fly.io)

---

### Option D — **GitHub Actions** (Scheduling-only, free)
> Use GitHub's free CI runners for the scrape + LV step; serve the static site via GitHub Pages

```yaml
# .github/workflows/update.yml
on:
  schedule:
    - cron: '0 */12 * * *'   # every 12 hours
  workflow_dispatch:           # manual trigger
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install requests pandas openpyxl tqdm linkvertise
      - run: python cineby_scraper.py
      - run: python linkvertise_api_lite.py
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- ✅ 100% free
- ✅ Auto-runs every 12 hours via cron
- ✅ Serves built static site on GitHub Pages
- ⚠️ No persistent state between runs (use `actions/cache` for checkpoints)
- 🌐 [pages.github.com](https://pages.github.com)

---

### 🏆 Recommendation

| Need | Use |
|------|-----|
| Just deploy the web app (static) | **GitHub Pages** (free, zero maintenance) |
| Full pipeline (scrape + LV + web) always running | **Railway** or **Fly.io** |
| Auto-update every 12h, hosted static site | **GitHub Actions + GitHub Pages** |
| Quick demo deploy | **Render** |

---

## 📋 Requirements File

Create `requirements.txt` for cloud deployments:

```
requests>=2.31.0
pandas>=2.0.0
openpyxl>=3.1.2
tqdm>=4.65.0
linkvertise>=1.0.0
```

---

## 📝 Notes

- **TMDB rate limits**: The scraper uses a 3-retry exponential backoff strategy and respects TMDB's rate limits automatically.
- **Linkvertise checkpoints**: Progress is saved every 500 rows to a CSV. If the process dies, it picks up exactly where it left off.
- **Excel size**: With ~37,000 rows and rich formatting, the output Excel is ~12–15 MB. The formatted write only happens **once per sheet**, not on every checkpoint save.
- **First run**: On first run all 37,000+ rows need Linkvertise links generated. Subsequent runs only process new additions.

---

## 📜 License

MIT — do whatever you want with it.
