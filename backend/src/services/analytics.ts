import { query } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || '';
const SIMULATE = !IG_TOKEN || process.env.INSTAGRAM_SIMULATE === 'true';

export interface AggregatedStats {
  platform: 'instagram' | 'tiktok';
  period_days: number;
  total_posts: number;
  avg_reach: number;
  avg_engagement: number;
  best_slot: string;
  worst_slot: string;
  best_category: string;
  trend: 'improving' | 'declining' | 'stable';
  slot_breakdown:    { slot: string; avg_reach: number; avg_eng: number; post_count: number; score: number }[];
  category_breakdown:{ category: string; avg_reach: number; avg_eng: number; post_count: number }[];
  weekly_trend:      { week: string; avg_reach: number; avg_eng: number; posts: number }[];
}

// ── Collecte des métriques Instagram (réel ou simulé) ─────────
export async function fetchIgMetrics(igPostId: string): Promise<Record<string, number>> {
  if (SIMULATE) {
    const reach    = Math.floor(Math.random() * 2000) + 500;
    const likes    = Math.floor(reach * (0.03 + Math.random() * 0.08));
    const saves    = Math.floor(reach * (0.01 + Math.random() * 0.03));
    const comments = Math.floor(reach * 0.005 + Math.random() * 10);
    return {
      reach, impressions: Math.floor(reach * 1.4), likes, comments, saves,
      shares: Math.floor(likes * 0.2),
      engagement_rate: parseFloat(((likes + comments + saves) / reach).toFixed(4)),
    };
  }
  try {
    const url = `https://graph.facebook.com/v19.0/${igPostId}/insights`
              + `?metric=reach,impressions,likes_count,comments_count,saved,shares&access_token=${IG_TOKEN}`;
    const data = await fetch(url).then(r => r.json()) as {
      data?: { name: string; values: { value: number }[] }[]
    };
    const get  = (n: string) => data.data?.find(d => d.name === n)?.values?.[0]?.value ?? 0;
    const reach = get('reach'), likes = get('likes_count'),
          comments = get('comments_count'), saves = get('saved');
    return {
      reach, impressions: get('impressions'), likes, comments, saves, shares: get('shares'),
      engagement_rate: reach > 0 ? parseFloat(((likes+comments+saves)/reach).toFixed(4)) : 0,
    };
  } catch { return {}; }
}

// ── Sauvegarde des métriques en base ─────────────────────────
export async function saveIgMetrics(
  igPostId: string, metrics: Record<string, number>,
  ctx: { slot_name: string; category: string; published_at: string; caption: string; hashtags: string[] }
): Promise<void> {
  await query(
    `INSERT INTO ig_analytics
       (ig_post_id, slot_name, published_at, reach, impressions, likes, comments,
        saves, shares, engagement_rate, caption_length, hashtag_count, category, raw_metrics)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT DO NOTHING`,
    [igPostId, ctx.slot_name, ctx.published_at, metrics.reach??0, metrics.impressions??0,
     metrics.likes??0, metrics.comments??0, metrics.saves??0, metrics.shares??0,
     metrics.engagement_rate??0, ctx.caption.length, ctx.hashtags.length,
     ctx.category, JSON.stringify(metrics)]
  ).catch(() => {});
}

// ── Stats agrégées par plateforme ─────────────────────────────
export async function getAggregatedStats(
  platform: 'instagram' | 'tiktok', days = 30
): Promise<AggregatedStats> {
  const table    = platform === 'instagram' ? 'ig_analytics' : 'tt_analytics';
  const reachCol = platform === 'instagram' ? 'reach' : 'views';

  const empty: AggregatedStats = {
    platform, period_days: days, total_posts: 0, avg_reach: 0, avg_engagement: 0,
    best_slot: 'N/A', worst_slot: 'N/A', best_category: 'N/A', trend: 'stable',
    slot_breakdown: [], category_breakdown: [], weekly_trend: [],
  };

  try {
    const [totals] = await query<{ total_posts:string; avg_reach:string; avg_engagement:string }>(
      `SELECT COUNT(*) as total_posts, COALESCE(ROUND(AVG(${reachCol})),0) as avg_reach,
              COALESCE(ROUND(AVG(engagement_rate)::numeric,4),0) as avg_engagement
       FROM ${table} WHERE fetched_at > NOW() - INTERVAL '${days} days'`
    );

    const slotRows = await query<{ slot_name:string; avg_reach:string; avg_eng:string; post_count:string }>(
      `SELECT slot_name, ROUND(AVG(${reachCol})) as avg_reach,
              ROUND(AVG(engagement_rate)::numeric,4) as avg_eng, COUNT(*) as post_count
       FROM ${table} WHERE fetched_at > NOW() - INTERVAL '${days} days' AND slot_name IS NOT NULL
       GROUP BY slot_name ORDER BY AVG(engagement_rate) DESC`
    );

    const catRows = await query<{ category:string; avg_reach:string; avg_eng:string; post_count:string }>(
      `SELECT category, ROUND(AVG(${reachCol})) as avg_reach,
              ROUND(AVG(engagement_rate)::numeric,4) as avg_eng, COUNT(*) as post_count
       FROM ${table} WHERE fetched_at > NOW() - INTERVAL '${days} days' AND category IS NOT NULL
       GROUP BY category ORDER BY AVG(engagement_rate) DESC`
    );

    const weeklyRows = await query<{ week:string; avg_reach:string; avg_eng:string; posts:string }>(
      `SELECT TO_CHAR(DATE_TRUNC('week', fetched_at),'YYYY-MM-DD') as week,
              ROUND(AVG(${reachCol})) as avg_reach,
              ROUND(AVG(engagement_rate)::numeric,4) as avg_eng, COUNT(*) as posts
       FROM ${table} WHERE fetched_at > NOW() - INTERVAL '${days} days'
       GROUP BY DATE_TRUNC('week', fetched_at) ORDER BY week ASC`
    );

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (weeklyRows.length >= 2) {
      const last = parseFloat(weeklyRows[weeklyRows.length-1].avg_eng);
      const prev = parseFloat(weeklyRows[weeklyRows.length-2].avg_eng);
      if (last > prev * 1.1) trend = 'improving';
      else if (last < prev * 0.9) trend = 'declining';
    }

    const slots = slotRows.map(r => ({
      slot: r.slot_name, avg_reach: parseFloat(r.avg_reach), avg_eng: parseFloat(r.avg_eng),
      post_count: parseInt(r.post_count), score: parseFloat(r.avg_reach) * parseFloat(r.avg_eng) * 1000,
    }));

    return {
      platform, period_days: days,
      total_posts: parseInt(totals?.total_posts ?? '0'),
      avg_reach:   parseFloat(totals?.avg_reach ?? '0'),
      avg_engagement: parseFloat(totals?.avg_engagement ?? '0'),
      best_slot:   slots[0]?.slot ?? 'N/A',
      worst_slot:  slots[slots.length-1]?.slot ?? 'N/A',
      best_category: catRows[0]?.category ?? 'N/A',
      trend, slot_breakdown: slots,
      category_breakdown: catRows.map(r => ({
        category: r.category, avg_reach: parseFloat(r.avg_reach),
        avg_eng: parseFloat(r.avg_eng), post_count: parseInt(r.post_count),
      })),
      weekly_trend: weeklyRows.map(r => ({
        week: r.week, avg_reach: parseFloat(r.avg_reach),
        avg_eng: parseFloat(r.avg_eng), posts: parseInt(r.posts),
      })),
    };
  } catch { return empty; }
}

// ── Refresh périodique des analytics de tous les posts récents ─
export async function refreshAllAnalytics(): Promise<void> {
  console.log('\n📊 Refresh analytics...');
  const posts = await query<{
    ig_post_id: string; scheduled_slot: string; caption: string; published_at: string;
  }>(`SELECT ig_post_id, scheduled_slot, caption, published_at FROM instagram_posts
      WHERE ig_post_id IS NOT NULL AND published_at > NOW() - INTERVAL '7 days'
      ORDER BY published_at DESC LIMIT 20`).catch(() => []);

  for (const p of posts) {
    const m = await fetchIgMetrics(p.ig_post_id);
    await saveIgMetrics(p.ig_post_id, m, {
      slot_name: p.scheduled_slot, category: 'Synthèse',
      published_at: p.published_at, caption: p.caption,
      hashtags: (p.caption.match(/#\w+/g) ?? []),
    });
  }
  console.log(`   ✅ ${posts.length} posts rafraîchis`);
}
