import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAggregatedStats } from './analytics';
import { getCreativeSchema, updateCreativeSchema, saveMessage } from './memory';
import { query } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  .getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface Suggestion {
  type: string; priority: 'haute' | 'moyenne' | 'faible';
  description: string; action: string; expected: string; data_basis: string;
}

export interface OptimizationReport {
  analysis: string;
  suggestions: Suggestion[];
  auto_applied: string[];
  next_analysis: string;
}

export async function runOptimizationCycle(): Promise<OptimizationReport> {
  console.log('\n🧠 Cycle d\'optimisation IA — YAM Media');

  const [igStats, ttStats] = await Promise.all([
    getAggregatedStats('instagram', 30),
    getAggregatedStats('tiktok', 30),
  ]);
  const schema   = await getCreativeSchema();
  const topPosts = await query<{ reach:number; engagement_rate:number; slot_name:string; category:string }>(
    `SELECT reach, engagement_rate, slot_name, category FROM ig_analytics ORDER BY engagement_rate DESC LIMIT 5`
  ).catch(() => []);
  const worstPosts = await query<{ reach:number; engagement_rate:number; slot_name:string; category:string }>(
    `SELECT reach, engagement_rate, slot_name, category FROM ig_analytics WHERE reach > 0 ORDER BY engagement_rate ASC LIMIT 5`
  ).catch(() => []);

  const prompt = `Tu es YAMI, l'IA d'optimisation de YAM Media (1er média burkinabè encadré par l'IA).

INSTAGRAM (30j): ${igStats.total_posts} posts | reach moy: ${igStats.avg_reach} | eng: ${(igStats.avg_engagement*100).toFixed(2)}% | trend: ${igStats.trend}
Par créneau: ${igStats.slot_breakdown.map(s=>`${s.slot}(${(s.avg_eng*100).toFixed(1)}%,r:${s.avg_reach})`).join(' | ')}
Par catégorie: ${igStats.category_breakdown.slice(0,4).map(c=>`${c.category}(${(c.avg_eng*100).toFixed(1)}%)`).join(' | ')}

TIKTOK (30j): ${ttStats.total_posts} posts | vues moy: ${ttStats.avg_reach} | eng: ${(ttStats.avg_engagement*100).toFixed(2)}%
Par créneau TT: ${ttStats.slot_breakdown.map(s=>`${s.slot}(${(s.avg_eng*100).toFixed(1)}%)`).join(' | ')}

SCHÉMA ACTUEL:
${JSON.stringify(schema, null, 2)}

TOP 5 posts IG (meilleur engagement):
${topPosts.map(p=>`[${p.slot_name}/${p.category}] reach:${p.reach} eng:${(p.engagement_rate*100).toFixed(1)}%`).join('\n')}

BOTTOM 5 posts IG (pire engagement):
${worstPosts.map(p=>`[${p.slot_name}/${p.category}] reach:${p.reach} eng:${(p.engagement_rate*100).toFixed(1)}%`).join('\n')}

Retourne UNIQUEMENT un JSON valide sans markdown:
{
  "analysis": "3-4 phrases synthétisant ce qui fonctionne et ce qui doit changer",
  "suggestions": [
    {"type":"slot_timing|caption_style|hashtag_strategy|category_focus|frequency",
     "priority":"haute|moyenne|faible","description":"problème identifié",
     "action":"action concrète","expected":"amélioration attendue","data_basis":"donnée précise"}
  ],
  "auto_apply": [
    {"key":"clé du schéma","value":{...nouvelle valeur...},"reason":"justification courte"}
  ],
  "summary": "1 phrase résumant les changements pour la mémoire"
}
N'applique automatiquement (auto_apply) que les changements low-risk (hashtags, ton, longueur).
Pour les changements de créneaux ou fréquence, mets-les dans suggestions uniquement.`;

  let parsed: {
    analysis: string; suggestions: Suggestion[];
    auto_apply: { key:string; value:unknown; reason:string }[];
    summary: string;
  };

  try {
    const text = (await model.generateContent(prompt)).response.text().replace(/```json|```/g,'').trim();
    parsed = JSON.parse(text);
  } catch {
    parsed = { analysis: 'Données insuffisantes pour analyse complète', suggestions: [], auto_apply: [], summary: 'En attente de données' };
  }

  const autoApplied: string[] = [];
  for (const c of (parsed.auto_apply ?? [])) {
    try {
      await updateCreativeSchema(c.key, c.value, 'ai_optimizer', c.reason);
      autoApplied.push(`✅ ${c.key}: ${c.reason}`);
      console.log(`   🔧 Auto-appliqué: ${c.key}`);
    } catch {}
  }

  await saveMessage({
    role: 'system',
    content: `[Optimisation hebdo]\n${parsed.analysis}\nChangements: ${autoApplied.join(', ') || 'aucun'}`,
    context_type: 'optimization',
    metadata: { ig_engagement: igStats.avg_engagement, tt_views: ttStats.avg_reach },
  });

  console.log(`   ✅ ${parsed.suggestions?.length ?? 0} suggestions, ${autoApplied.length} auto-appliqués`);
  return {
    analysis:      parsed.analysis,
    suggestions:   parsed.suggestions ?? [],
    auto_applied:  autoApplied,
    next_analysis: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10),
  };
}
