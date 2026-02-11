const fetch = require("node-fetch");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  Referer: "https://www.futbin.com/",
};

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  const params = event.queryStringParameters || {};
  const futbinId = params.futbin_id;
  const platform = (params.platform || "ps").toLowerCase();

  if (!futbinId) {
    return {
      statusCode: 400,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing futbin_id parameter" }),
    };
  }

  try {
    // Fetch the FUTBIN player page
    const url = `https://www.futbin.com/26/player/${futbinId}`;
    const response = await fetch(url, { headers: HEADERS, timeout: 10000 });

    if (!response.ok) {
      throw new Error(`FUTBIN returned status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract player name
    const playerName =
      $(".player_name_players_498").text().trim() ||
      $("h1").first().text().trim() ||
      "Unknown";

    // Extract prices from the price boxes
    // FUTBIN uses different selectors depending on version - try multiple
    let prices = {};

    // Try the standard price containers
    const priceSelectors = [
      { platform: "ps", selectors: [".ps-price", "#ps-price", '[data-platform="ps"]'] },
      { platform: "xbox", selectors: [".xbox-price", "#xbox-price", '[data-platform="xbox"]'] },
      { platform: "pc", selectors: [".pc-price", "#pc-price", '[data-platform="pc"]'] },
    ];

    for (const p of priceSelectors) {
      for (const sel of p.selectors) {
        const el = $(sel).first();
        if (el.length) {
          const txt = el.text().trim().replace(/[,.\s]/g, "");
          const num = parseInt(txt);
          if (!isNaN(num) && num > 0) {
            prices[p.platform] = num;
            break;
          }
        }
      }
    }

    // Also try the price box spans with data attributes
    $(".price-box, .price_box, .player-price").each((_, el) => {
      const text = $(el).text().trim();
      const cleaned = text.replace(/[,.\s]/g, "");
      const num = parseInt(cleaned);
      if (!isNaN(num) && num > 0) {
        // Assign to first empty platform
        if (!prices.ps) prices.ps = num;
        else if (!prices.xbox) prices.xbox = num;
        else if (!prices.pc) prices.pc = num;
      }
    });

    // Try extracting from page data/scripts as fallback
    const scriptContent = $("script")
      .map((_, el) => $(el).html())
      .get()
      .join("\n");

    const pricePatterns = [
      /ps_price['":\s]+(\d+)/i,
      /xbox_price['":\s]+(\d+)/i,
      /pc_price['":\s]+(\d+)/i,
    ];

    const platformKeys = ["ps", "xbox", "pc"];
    pricePatterns.forEach((pattern, i) => {
      if (!prices[platformKeys[i]]) {
        const match = scriptContent.match(pattern);
        if (match) prices[platformKeys[i]] = parseInt(match[1]);
      }
    });

    // Extract rating
    const ratingText =
      $(".pcdisplay-rat").text().trim() ||
      $(".rating").first().text().trim();
    const rating = parseInt(ratingText) || null;

    // Extract position
    const position =
      $(".pcdisplay-pos").text().trim() ||
      $(".position").first().text().trim() ||
      "";

    const currentPrice = prices[platform] || prices.ps || prices.xbox || prices.pc || null;

    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({
        futbin_id: futbinId,
        name: playerName,
        rating,
        position,
        prices,
        current_price: currentPrice,
        platform,
        fetched_at: new Date().toISOString(),
        url,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to fetch price data",
        message: err.message,
        futbin_id: futbinId,
      }),
    };
  }
};
