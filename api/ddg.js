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

  // DuckDuckGo's HTML endpoint can reject cloud-hosted requests. Try its
  // lightweight results endpoint as a fallback, without accepting proxy URLs.
  const endpoints = [
    "https://lite.duckduckgo.com/lite/?q=" + encodeURIComponent(q),
    "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q)
  ];
  let lastStatus = 502;

  for (const target of endpoints) {
    try {
      const upstream = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://duckduckgo.com/"
        },
        redirect: "follow",
        signal: AbortSignal.timeout(12000)
      });
      const html = await upstream.text();
      lastStatus = upstream.status;
      if (!upstream.ok) continue;

      res.status(200);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Security-Policy", "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none';");
      return res.end(html);
    } catch (_) {
      // Try the next fixed DuckDuckGo endpoint.
    }
  }

  res.status(502).setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.end("DuckDuckGo blocked CherryBlocked's server request (HTTP " + lastStatus + "). DuckDuckGo must allow the server request for this proxy to work.");
}
