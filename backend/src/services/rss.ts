import Parser from 'rss-parser';
import { query } from '../config/database';
import { processArticle } from './gemini';

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'YAMMedia-Bot/1.0' },
});

// ── 10 sources RSS — Burkina · Afrique · International ────────
export const RSS_SOURCES = [
  { name: 'Burkina24',      url: 'https://burkina24.com/feed/',                        category: 'Burkina'       },
  { name: 'LeFaso.net',     url: 'https://lefaso.net/spip.php?page=backend',           category: 'Burkina'       },
  { name: 'Faso.net',       url: 'https://www.faso.net/rss.php',                       category: 'Burkina'       },
  { name: 'Oméga Médias',   url: 'https://www.omegamedias.info/feed/',                  category: 'Burkina'       },
  { name: 'Radio Oméga FM', url: 'https://www.omegamedias.info/category/radio/feed/',  category: 'Burkina'       },
  { name: 'RFI Afrique',    url: 'https://www.rfi.fr/fr/afrique/rss',                  category: 'Afrique'       },
  { name: 'BBC Afrique',    url: 'https://feeds.bbci.co.uk/afrique/rss.xml',           category: 'Afrique'       },
  { name: 'Jeune Afrique',  url: 'https://www.jeuneafrique.com/feed/',                 category: 'Afrique'       },
  { name: 'France 24',      url: 'https://www.france24.com/fr/rss',                    category: 'International' },
  { name: 'NBC News',       url: 'https://feeds.nbcnews.com/nbcnews/public/news',      category: 'International' },
];

interface RawItem {
  title?: string; contentSnippet?: string; content?: string;
  link?: string; pubDate?: string; isoDate?: string;
}

export async function collectFromSource(sourceUrl: string, sourceName: string): Promise<number> {
  let collected = 0;
  try {
    const feed = await parser.parseURL(sourceUrl);
    for (const item of feed.items.slice(0, 10)) {
      const raw = item as RawItem;
      if (!raw.title || !raw.link) continue;

      // Sécurité : URLs https/http uniquement — rejeter javascript:, data:, etc.
      try {
        const u = new URL(raw.link);
        if (!['https:', 'http:'].includes(u.protocol)) continue;
      } catch { continue; }

      const existing = await query('SELECT id FROM articles WHERE source_url = $1', [raw.link]);
      if (existing.length > 0) continue;

      const content   = raw.contentSnippet || raw.content || raw.title;
      const processed = await processArticle(raw.title, content);

      await query(
        `INSERT INTO articles
           (title, summary, source_url, source_name, category, hashtags, importance, published_at, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')`,
        [processed.title, processed.summary, raw.link, sourceName,
         processed.category, processed.hashtags, processed.importance,
         raw.isoDate || raw.pubDate || new Date().toISOString()]
      );
      collected++;
    }
  } catch (err) { console.error(`Erreur collecte ${sourceName}:`, err); }
  return collected;
}

export async function collectAll(): Promise<{ source: string; collected: number }[]> {
  const results = [];
  for (const src of RSS_SOURCES) {
    const n = await collectFromSource(src.url, src.name);
    results.push({ source: src.name, collected: n });
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
}
