import { Router, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getChatHistory, saveMessage, getMemorySummary, getCreativeSchema, updateCreativeSchema } from '../services/memory';
import { getAggregatedStats } from '../services/analytics';
import { runOptimizationCycle } from '../services/optimizer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const model  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  .getGenerativeModel({ model: 'gemini-1.5-flash' });

// ── POST /api/chatbot/message ─────────────────────────────────
router.post('/message', authenticate, async (req: AuthRequest, res: Response) => {
  const { message, session_id } = req.body as { message: string; session_id?: string };
  if (!message?.trim()) { res.status(400).json({ error: 'Message requis' }); return; }

  try {
    await saveMessage({ role: 'user', content: message, session_id });

    const [history, memorySummary, schema, igStats, ttStats, decisions] = await Promise.all([
      getChatHistory(session_id, 30),
      getMemorySummary(session_id),
      getCreativeSchema(),
      getAggregatedStats('instagram', 14),
      getAggregatedStats('tiktok', 14),
      query<{ decision_type:string; reasoning:string; applied_at:string }>(
        `SELECT decision_type, reasoning, applied_at FROM ai_decisions ORDER BY applied_at DESC LIMIT 10`
      ).catch(() => []),
    ]);

    const systemPrompt = `Tu es YAMI (YAM Media Intelligence), l'IA intégrée de YAM Media — 1er média d'information burkinabè encadré par l'IA.

${memorySummary}

=== ANALYTICS TEMPS RÉEL (14 derniers jours) ===
INSTAGRAM: ${igStats.total_posts} posts | reach moy: ${igStats.avg_reach} | engagement: ${(igStats.avg_engagement*100).toFixed(2)}% | tendance: ${igStats.trend}
Créneaux IG: ${igStats.slot_breakdown.map(s=>`${s.slot}(eng:${(s.avg_eng*100).toFixed(1)}%, reach:${s.avg_reach})`).join(' | ')}
Catégories IG: ${igStats.category_breakdown.slice(0,5).map(c=>`${c.category}(${(c.avg_eng*100).toFixed(1)}%)`).join(' | ')}
Meilleur créneau: ${igStats.best_slot} | Pire: ${igStats.worst_slot}

TIKTOK: ${ttStats.total_posts} posts | vues moy: ${ttStats.avg_reach} | engagement: ${(ttStats.avg_engagement*100).toFixed(2)}% | tendance: ${ttStats.trend}
Créneaux TT: ${ttStats.slot_breakdown.map(s=>`${s.slot}(${(s.avg_eng*100).toFixed(1)}%)`).join(' | ')}

=== SCHÉMA CRÉATIF ACTUEL ===
${JSON.stringify(schema, null, 2)}

=== HISTORIQUE DÉCISIONS ===
${decisions.map(d=>`[${d.applied_at?.slice(0,10)}] ${d.decision_type}: ${d.reasoning?.slice(0,100)}`).join('\n')}

=== TES CAPACITÉS ===
1. ANALYSER les performances et identifier ce qui fonctionne
2. MODIFIER le schéma créatif via: <action>{"action":"update_schema","key":"...","value":{...},"reason":"..."}</action>
3. LANCER une optimisation: <action>{"action":"run_optimization"}</action>
4. EXPLIQUER chaque décision avec les données qui la justifient
5. MÉMORISER le contexte entre les conversations (mémoire PostgreSQL permanente)

Réponds toujours en français. Sois précis, basé sur les données réelles, et bienveillant.`;

    const convHistory = history
      .filter(m => m.role !== 'system')
      .slice(-14)
      .map(m => ({ role: m.role as 'user' | 'model', parts: [{ text: m.content }] }));

    const chat = model.startChat({
      history: convHistory.length > 1 ? convHistory.slice(0, -1) : [],
      generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
      systemInstruction: systemPrompt,
    });

    let response = (await chat.sendMessage(message)).response.text();
    let actionTaken = false;

    const actionMatch = response.match(/<action>([\s\S]*?)<\/action>/);
    if (actionMatch) {
      try {
        const act = JSON.parse(actionMatch[1].trim()) as {
          action: string; key?: string; value?: unknown; reason?: string;
        };

        if (act.action === 'update_schema' && act.key && act.value !== undefined) {
          await updateCreativeSchema(act.key, act.value, 'yami_chatbot', act.reason);
          response = response.replace(/<action>[\s\S]*?<\/action>/, '').trim();
          response += `\n\n✅ **Schéma mis à jour** : \`${act.key}\` — ${act.reason}`;
          actionTaken = true;
        }

        if (act.action === 'run_optimization') {
          const report = await runOptimizationCycle();
          response = response.replace(/<action>[\s\S]*?<\/action>/, '').trim();
          response += `\n\n✅ **Optimisation effectuée** : ${report.auto_applied.length} changement(s) appliqué(s).\n${report.auto_applied.join('\n')}`;
          actionTaken = true;
        }
      } catch { /* action malformée — on continue sans modifier */ }
    }

    await saveMessage({
      role: 'assistant', content: response, session_id,
      context_type: actionTaken ? 'decision' : 'chat',
      metadata: { action_taken: actionTaken },
    });

    res.json({ response, action_taken: actionTaken, session_id });
  } catch (err) {
    console.error('[YAMI]', err);
    res.status(500).json({ error: 'Erreur lors de la génération de la réponse' });
  }
});

// ── GET /api/chatbot/history ──────────────────────────────────
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  const history = await getChatHistory(
    req.query.session_id as string | undefined,
    parseInt(req.query.limit as string) || 50
  );
  res.json(history);
});

// ── GET /api/chatbot/schema ───────────────────────────────────
router.get('/schema', authenticate, async (_req, res: Response) => {
  res.json(await getCreativeSchema());
});

// ── PATCH /api/chatbot/schema ─────────────────────────────────
router.patch('/schema', authenticate, async (req: AuthRequest, res: Response) => {
  const { key, value, reason } = req.body as { key: string; value: unknown; reason?: string };
  if (!key || value === undefined) { res.status(400).json({ error: 'key et value requis' }); return; }
  await updateCreativeSchema(key, value, `admin:${req.user?.email ?? 'unknown'}`, reason);
  res.json({ success: true, message: `Schéma mis à jour : ${key}` });
});

// ── GET /api/chatbot/analytics ────────────────────────────────
router.get('/analytics', authenticate, async (req: AuthRequest, res: Response) => {
  const days = Math.min(parseInt(req.query.days as string) || 30, 90);
  const [ig, tt, decisions] = await Promise.all([
    getAggregatedStats('instagram', days),
    getAggregatedStats('tiktok', days),
    query<{ decision_type:string; reasoning:string; new_value:unknown; applied_at:string }>(
      `SELECT decision_type, reasoning, new_value, applied_at FROM ai_decisions ORDER BY applied_at DESC LIMIT 20`
    ).catch(() => []),
  ]);
  res.json({ instagram: ig, tiktok: tt, decisions });
});

// ── POST /api/chatbot/optimize ────────────────────────────────
router.post('/optimize', authenticate, async (_req, res: Response) => {
  res.json({ message: 'Cycle d\'optimisation YAM Media lancé en arrière-plan' });
  runOptimizationCycle().catch(console.error);
});

export default router;
