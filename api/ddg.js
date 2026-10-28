export default async function handler(req, res) {
  const rawQuery = typeof req.query?.q === "string" ? req.query.q.trim() : "";
  if (!rawQuery) {
    res.status(400).setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Missing search query.");
  }
  if (rawQuery.length > 300) {
    res.status(400).setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Search query is too long.");
  }

  try {
    const target = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(rawQuery);
    const upstream = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml"
      },
      signal: AbortSignal.timeout(10000)
    });

    const html = await upstream.text();
    if (!upstream.ok) {
      res.status(upstream.status).setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end("DuckDuckGo returned HTTP " + upstream.status + ".");
    }

    // Serve DuckDuckGo's actual HTML response from this site's origin.
    // Keep this endpoint fixed to DuckDuckGo; never accept arbitrary proxy URLs.
    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none';");
    return res.end(html);
  } catch (error) {
    res.status(502).setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Could not reach DuckDuckGo from CherryBlocked. " + (error?.name === "TimeoutError" ? "The request timed out." : "Please try again later."));
  }
}
