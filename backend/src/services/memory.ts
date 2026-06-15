import { query } from '../config/database';

export interface ChatMessage {
  id?: number;
  session_id?: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context_type?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

// ── Schéma créatif ────────────────────────────────────────────
export async function getCreativeSchema(): Promise<Record<string, unknown>> {
  const rows = await query<{ key: string; value: unknown }>(
    `SELECT key, value FROM creative_schema ORDER BY key`
  ).catch(() => []);
  const schema: Record<string, unknown> = {};
  for (const row of rows) schema[row.key] = row.value;
  return schema;
}

export async function updateCreativeSchema(
  key: string, value: unknown, updatedBy: string, reason?: string
): Promise<void> {
  const [prev] = await query<{ value: unknown }>(
    `SELECT value FROM creative_schema WHERE key = $1`, [key]
  ).catch(() => []);

  await query(
    `INSERT INTO creative_schema (key, value, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $3, NOW())
     ON CONFLICT (key) DO UPDATE SET value=$2::jsonb, updated_by=$3, updated_at=NOW()`,
    [key, JSON.stringify(value), updatedBy]
  );

  await query(
    `INSERT INTO ai_decisions (decision_type, previous_value, new_value, reasoning, applied_by)
     VALUES ($1,$2::jsonb,$3::jsonb,$4,$5)`,
    [`schema_update_${key}`, JSON.stringify(prev?.value ?? null),
     JSON.stringify(value), reason ?? 'Modification chatbot', updatedBy]
  ).catch(() => {});
}

// ── Mémoire permanente ────────────────────────────────────────
export async function getChatHistory(sessionId?: string, limit = 50): Promise<ChatMessage[]> {
  return query<ChatMessage>(
    `SELECT id, session_id, role, content, context_type, metadata, created_at
     FROM chatbot_memory
     WHERE ($1::text IS NULL OR session_id = $1)
     ORDER BY created_at ASC LIMIT $2`,
    [sessionId ?? null, limit]
  ).catch(() => []);
}

export async function saveMessage(msg: ChatMessage): Promise<void> {
  await query(
    `INSERT INTO chatbot_memory (session_id, role, content, context_type, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [msg.session_id ?? null, msg.role, msg.content,
     msg.context_type ?? 'chat', JSON.stringify(msg.metadata ?? {})]
  ).catch(() => {});
}

// ── Résumé mémoire pour le contexte IA ───────────────────────
export async function getMemorySummary(sessionId?: string): Promise<string> {
  const [history, decisions, schema] = await Promise.all([
    getChatHistory(sessionId, 20),
    query<{ decision_type: string; reasoning: string; applied_at: string }>(
      `SELECT decision_type, reasoning, applied_at FROM ai_decisions ORDER BY applied_at DESC LIMIT 5`
    ).catch(() => []),
    getCreativeSchema(),
  ]);

  const slots = (schema.publish_slots as { active:boolean; emoji:string; label:string; cron:string }[] ?? [])
    .filter(s => s.active).map(s => `${s.emoji}${s.label}(${s.cron})`).join(', ');

  const style = schema.caption_style as { tone?: string } | undefined;

  let summary = `=== MÉMOIRE YAMI ===\nCréneaux actifs: ${slots}\nTon: ${style?.tone ?? 'N/A'}\n`;

  if (decisions.length) {
    summary += `\nDernières décisions:\n`;
    decisions.forEach(d =>
      summary += `- [${d.applied_at?.slice(0,10)}] ${d.decision_type}: ${d.reasoning?.slice(0,80)}\n`
    );
  }

  const recent = history.filter(m => m.role === 'user').slice(-3);
  if (recent.length)
    summary += `\nDernières questions utilisateur: ${recent.map(m => m.content.slice(0,60)).join(' | ')}\n`;

  return summary;
}
