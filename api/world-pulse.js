export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const groups = [
    { label: "WORLD MUSIC NEWS & RELEASE MOVES", queries: ["latest global music news artist releases this week", "international music artists new projects tour announcements latest"] },
    { label: "AFROBEATS GOING GLOBAL", queries: ["Afrobeats global music news international collaborations charts latest", "Nigerian music artists international opportunities latest"] },
    { label: "ARTIST DISCOVERY & COLLABORATION LEADS", queries: ["independent music artists open collaboration call singer producer 2026", "Afro-fusion producers artists collaboration opportunities open submissions"] },
    { label: "CREATOR & DISTRIBUTION OPPORTUNITIES", queries: ["music creator opportunities open submissions playlist pitching independent artists 2026", "music festivals artist submissions emerging artists 2026 global"] },
    { label: "GLOBAL SOUND & CULTURE SIGNALS", queries: ["global music trends sounds genres audience culture 2026", "international music culture trend dance sound discovery latest"] }
  ];
  const clean = (s, n=350) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim().slice(0,n);
  const groupsOut = await Promise.all(groups.map(async group => {
    const found = [];
    await Promise.all(group.queries.map(async q => {
      try {
        const r = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q), { headers: { "user-agent": "Mozilla/5.0 (compatible; ImmortalWorldPulse/1.0)" }, signal: AbortSignal.timeout(8500) });
        if (!r.ok) return;
        const html = await r.text();
        const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        let m;
        while ((m = re.exec(html)) && found.length < 6) {
          let url = clean(m[1], 900);
          try { const u = new URL(url, "https://duckduckgo.com"); url = u.searchParams.get("uddg") ? decodeURIComponent(u.searchParams.get("uddg")) : url; } catch {}
          const title = clean(m[2], 180), snippet = clean(m[3], 400);
          if (/^https?:\/\//i.test(url) && title && !found.some(x => x.url === url)) found.push({ title, url, snippet });
        }
      } catch {}
    }));
    return { label: group.label, summary: found.length ? "Fresh public search leads. Check the linked page for its publication date and details before making decisions." : "Search returned no usable items for this category.", items: found.slice(0,5) };
  }));
  const count = groupsOut.reduce((n,g)=>n+g.items.length,0);
  const actionIdeas = [
    "Choose one real global signal and turn it into an original 20–30 second WhityRay melodic clip; add your own point of view instead of copying the trend.",
    "Shortlist two artists or producers whose public work genuinely fits your sound; verify their official page and prepare a respectful, specific collaboration pitch before contacting them.",
    "Turn one research finding into a story-led song or post in your own Nigerian Pidgin + English voice. Track real responses and saves; do not buy or fabricate engagement."
  ];
  return res.status(200).json({
    updated_at: new Date().toISOString(),
    result_count: count,
    groups: groupsOut,
    action_ideas: actionIdeas,
    notice: "This is a point-in-time scan of public search results, not exhaustive monitoring of every platform. Search snippets may be stale or incomplete; open sources to verify dates, artist announcements and eligibility. Collaboration leads are not endorsements or confirmed invitations."
  });
}