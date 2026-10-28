export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { title = "", idea = "", genre = "", location = "Bomadi, Delta State, Nigeria" } = req.body || {};
  const clean = (v, n = 180) => typeof v === "string" ? v.trim().slice(0, n) : "";
  const songTitle = clean(title, 100), story = clean(idea, 500);
  const place = clean(location, 120) || "Bomadi, Delta State, Nigeria";
  if (!songTitle && !story) return res.status(400).json({ error: "A title or idea is required." });
  const queries = [songTitle + " meaning cultural history metaphor", place + " culture history music language", "Ijaw Niger Delta Owigiri music culture " + clean(genre, 80), story ? story.slice(0, 140) + " real world meanings history" : songTitle + " philosophy literature folklore"];
  const sources = [], snippets = [];
  const decode = (s) => String(s || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  async function duckSearch(q) {
    const response = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q), { headers: { "user-agent": "Mozilla/5.0 (compatible; WhityRayImmortalResearch/1.0)" }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error("Search HTTP " + response.status);
    const html = await response.text(), rows = [];
    const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = re.exec(html)) && rows.length < 5) {
      let href = decode(match[1]);
      try { const u = new URL(href, "https://duckduckgo.com"); href = u.searchParams.get("uddg") ? decodeURIComponent(u.searchParams.get("uddg")) : href; } catch {}
      const titleText = decode(match[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
      const snippet = decode(match[3].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
      if (titleText && /^https?:\/\//i.test(href)) rows.push({ title: titleText, url: href, snippet });
    }
    return rows;
  }
  async function wikiSearch(q) {
    const response = await fetch("https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=3&srsearch=" + encodeURIComponent(q), { headers: { "user-agent": "WhityRayImmortalResearch/1.0 (creative research)" }, signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error("Wikipedia HTTP " + response.status);
    const data = await response.json();
    return (data?.query?.search || []).map(x => ({ title: x.title, url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(x.title.replace(/ /g, "_")), snippet: decode(x.snippet.replace(/<[^>]+>/g, " ")) }));
  }
  await Promise.all(queries.map(async (q, i) => {
    try { const rows = i < 3 ? await duckSearch(q) : []; rows.forEach(x => { if (!sources.some(s => s.url === x.url)) sources.push(x); }); rows.forEach(x => snippets.push("[" + x.title + "] " + x.snippet + " (Source: " + x.url + ")")); } catch {}
    try { const rows = await wikiSearch(q); rows.forEach(x => { if (!sources.some(s => s.url === x.url)) sources.push(x); }); rows.forEach(x => snippets.push("[" + x.title + "] " + x.snippet + " (Source: " + x.url + ")")); } catch {}
  }));
  const research_notes = snippets.length
    ? "Research leads for title “" + songTitle + "” and place “" + place + "”. Search snippets are leads, not proof; verify factual claims before treating them as established. Use as inspiration, not wording to copy. Do not assign meanings to Ijaw terms unless a reliable source supports them.\n\n" + snippets.slice(0, 14).join("\n")
    : "No usable public search results returned. Do not claim research was completed. Do not invent local facts, Ijaw meanings, slang origins or citations; proceed from the user's brief and label creative interpretation.";
  return res.status(200).json({ research_notes, sources: sources.slice(0, 12), query_count: queries.length, results_count: snippets.length, mode: snippets.length ? "public-web-search" : "research-unavailable" });
}