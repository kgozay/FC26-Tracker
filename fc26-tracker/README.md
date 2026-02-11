# FC26 Price Tracker — Netlify Deployment

A web app for tracking FC26 Ultimate Team player prices and detecting trading opportunities.
Runs entirely on Netlify (static frontend + serverless functions).

## Deploy to Netlify

### Option 1: One-Click Deploy

1. Push this folder to a GitHub/GitLab repo
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click **"Add new site" → "Import an existing project"**
4. Connect your repo
5. Netlify auto-detects `netlify.toml` — just click **Deploy**

### Option 2: Netlify CLI

```bash
npm install
npx netlify-cli deploy --prod
```

### Option 3: Drag & Drop

1. Run `npm install` locally to get dependencies
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the entire project folder

## Project Structure

```
├── public/
│   └── index.html          # Full React SPA (frontend)
├── netlify/
│   └── functions/
│       └── fetch-price.js   # Serverless FUTBIN scraper
├── netlify.toml             # Netlify config
├── package.json             # Dependencies for serverless functions
└── README.md
```

## How It Works

- **Frontend**: React SPA with Chart.js for price graphs. All player data and price history stored in your browser's localStorage.
- **Backend**: Netlify Function (`fetch-price`) scrapes FUTBIN for current prices. No database needed.
- **Auto-refresh**: Configurable interval (default 5 min) checks prices while the tab is open.

## Usage

1. Click **"+ Add Player"**
2. Enter a FUTBIN ID (from the player's URL on futbin.com)
3. Click **Lookup** to auto-fill details, or enter manually
4. Click **"Check Prices"** to fetch current prices
5. View charts and trading signals in the **Opportunities** tab

## Notes

- Price history persists in your browser (localStorage). Clearing browser data erases it.
- The auto-check only runs while the browser tab is open.
- FUTBIN's site structure may change — if scraping breaks, the serverless function may need updating.
- Be respectful of FUTBIN's servers; the default 5-minute interval is reasonable.

## Safe to Use

✅ No EA API interaction — zero ban risk  
✅ Only reads public FUTBIN data  
✅ All trades are manual decisions you make in-game
