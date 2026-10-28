export default async function handler(req, res) {
  const q = typeof req.query?.q === "string" ? req.query.q.trim() : "";
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (!q) {
    res.status(400).setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Enter a search query.");
  }
  if (q.length > 300) {
    res.status(400).setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Search query is too long.");
  }

  // Try DuckDuckGo first, then Yahoo if DDG blocks the server request.
  // All destinations are fixed; callers cannot supply arbitrary proxy URLs.
  const endpoints = [
    { url: "https://lite.duckduckgo.com/lite/?q=" + encodeURIComponent(q), name: "DuckDuckGo Lite" },
    { url: "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q), name: "DuckDuckGo HTML" },
    { url: "https://search.yahoo.com/search?p=" + encodeURIComponent(q), name: "Yahoo Search" }
  ];
  const failures = [];

  for (const endpoint of endpoints) {
    try {
      const upstream = await fetch(endpoint.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": endpoint.name.startsWith("DuckDuckGo") ? "https://duckduckgo.com/" : "https://search.yahoo.com/"
        },
        redirect: "follow",
        signal: AbortSignal.timeout(10000)
      });
      const html = await upstream.text();
      if (!upstream.ok) {
        failures.push(endpoint.name + " HTTP " + upstream.status);
        continue;
      }
      res.status(200);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Search-Provider", endpoint.name);
      res.setHeader("Content-Security-Policy", "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none';");
      return res.end(html);
    } catch (error) {
      failures.push(endpoint.name + " unavailable");
    }
  }

  res.status(502).setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.end("Search providers blocked CherryBlocked's server request. Tried: " + failures.join(", ") + ". This hosting environment cannot retrieve results from these providers right now.");
}
