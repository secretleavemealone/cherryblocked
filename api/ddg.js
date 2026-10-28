export default async function handler(req, res) {
  const q = typeof req.query?.q === "string" ? req.query.q.trim() : "";
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (!q) { res.status(400).setHeader("Content-Type", "text/plain; charset=utf-8"); return res.end("Enter a search query."); }
  if (q.length > 300) { res.status(400).setHeader("Content-Type", "text/plain; charset=utf-8"); return res.end("Search query is too long."); }

  const endpoints = [
    { base: "https://searxng.buffon.cloud", name: "SearXNG" },
    { base: "https://search.jeremyh.xyz", name: "SearXNG backup" }
  ];
  const failures = [];
  for (const endpoint of endpoints) {
    try {
      const target = endpoint.base + "/search?q=" + encodeURIComponent(q) + "&language=en-US&safesearch=1";
      const upstream = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9"
        },
        redirect: "follow",
        signal: AbortSignal.timeout(12000)
      });
      const html = await upstream.text();
      if (!upstream.ok || !html.includes("<")) { failures.push(endpoint.name + " HTTP " + upstream.status); continue; }
      const baseTag = '<base href="' + endpoint.base + '/">';
      const page = /<head[^>]*>/i.test(html)
        ? html.replace(/<head[^>]*>/i, match => match + baseTag)
        : '<!doctype html><html><head>' + baseTag + '</head><body>' + html + '</body></html>';
      res.status(200);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Search-Provider", endpoint.name);
      res.setHeader("Content-Security-Policy", "default-src https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none';");
      return res.end(page);
    } catch (_) { failures.push(endpoint.name + " unavailable"); }
  }
  res.status(502).setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.end("Search is temporarily unavailable. Public search providers did not respond: " + failures.join(", ") + ". Please try again later.");
}