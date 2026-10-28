export default async function handler(req, res) {
  const q = typeof req.query?.q === "string" ? req.query.q.trim() : "";
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (!q) { res.status(400).setHeader("Content-Type", "text/html; charset=utf-8"); return res.end("<h1>Enter a search query.</h1>"); }
  if (q.length > 300) { res.status(400).setHeader("Content-Type", "text/html; charset=utf-8"); return res.end("<h1>Search query is too long.</h1>"); }

  const escapeHtml = value => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const stripTags = value => String(value || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  const endpoints = [
    { base: "https://searxng.buffon.cloud", name: "SearXNG" },
    { base: "https://search.jeremyh.xyz", name: "SearXNG backup" }
  ];
  const failures = [];
  for (const endpoint of endpoints) {
    try {
      const upstream = await fetch(endpoint.base + "/search?q=" + encodeURIComponent(q) + "&language=en-US&safesearch=1", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36", "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" },
        redirect: "follow", signal: AbortSignal.timeout(12000)
      });
      const html = await upstream.text();
      if (!upstream.ok) { failures.push(endpoint.name + " HTTP " + upstream.status); continue; }

      const results = [];
      const articles = html.match(/<article\b[\s\S]*?<\/article>/gi) || [];
      for (const article of articles) {
        const titleMatch = article.match(/<h[1-6][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[1-6]>/i);
        if (!titleMatch) continue;
        let href = titleMatch[1].replace(/&amp;/g, "&");
        if (href.startsWith("//")) href = "https:" + href;
        if (!/^https?:\/\//i.test(href) || href.startsWith(endpoint.base)) continue;
        const title = stripTags(titleMatch[2]);
        const snippetMatch = article.match(/class=["'][^"']*(?:content|snippet|result-content)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div|span)>/i);
        const snippet = snippetMatch ? stripTags(snippetMatch[1]) : "";
        if (title) results.push({ title, href, snippet });
        if (results.length >= 20) break;
      }

      if (!results.length) { failures.push(endpoint.name + " returned no parseable results"); continue; }
      const cards = results.map(item => '<article class="result"><a class="title" href="' + escapeHtml(item.href) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.title) + '</a><div class="url">' + escapeHtml(new URL(item.href).hostname) + '</div><p>' + escapeHtml(item.snippet) + '</p></article>').join("");
      const page = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(q) + ' - CherryBlocked Search</title><style>*{box-sizing:border-box}body{margin:0;background:#101018;color:#eee;font:16px/1.5 system-ui,Segoe UI,sans-serif}.wrap{max-width:850px;margin:0 auto;padding:28px 20px}.brand{color:#ff7b9c;font-weight:800;font-size:24px;text-decoration:none}.search{display:flex;gap:8px;margin:20px 0 24px}.search input{flex:1;min-width:0;padding:13px 15px;border:1px solid #383848;border-radius:12px;background:#1a1a27;color:#fff;font-size:16px}.search button{padding:12px 18px;border:0;border-radius:12px;background:#ff7b9c;color:#241019;font-weight:700;cursor:pointer}.result{padding:17px 0;border-bottom:1px solid #292938}.title{color:#9bbcff;font-size:19px;text-decoration:none}.title:hover{text-decoration:underline}.url{font-size:13px;color:#8ed6a5;margin-top:3px;overflow-wrap:anywhere}.result p{margin:7px 0 0;color:#c9c9d4}.muted{color:#9a9aab;font-size:13px}</style></head><body><main class="wrap"><a class="brand" href="/">CherryBlocked</a><form class="search" action="/api/ddg" method="get"><input name="q" value="' + escapeHtml(q) + '" aria-label="Search query" required><button type="submit">Search</button></form><div class="muted">Web results for <strong>' + escapeHtml(q) + '</strong> · via ' + escapeHtml(endpoint.name) + '</div>' + cards + '<p class="muted">Search results open in a new tab.</p></main></body></html>';
      res.status(200).setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none';");
      return res.end(page);
    } catch (_) { failures.push(endpoint.name + " unavailable"); }
  }
  res.status(502).setHeader("Content-Type", "text/html; charset=utf-8");
  return res.end("<!doctype html><html><meta charset=\"utf-8\"><title>Search unavailable</title><body style=\"font:16px system-ui;background:#101018;color:#eee;padding:30px\"><h1>CherryBlocked Search</h1><p>Search providers did not return usable results: " + escapeHtml(failures.join(", ")) + ".</p><a style=\"color:#9bbcff\" href=\"/\">Back to CherryBlocked</a></body></html>");
}