/**
 * Scheduler YAM Media (UTC = heure Burkina Faso UTC+0)
 *
 * Collecte RSS    : 06h30 · 11h30 · 17h30 · 20h30
 * Publication IG + TikTok : 07h00 · 12h00 · 18h00 · 21h00  (4× par jour)
 * Analytics refresh       : 00h30 · 06h30 · 12h30 · 18h30
 * Optimisation IA         : dimanche 06h00
 */

import { collectAll } from './rss';
import { buildSlotPost, PUBLICATION_SLOTS } from './synthesis';
import { publishToInstagram, logPost } from './instagram';
import { publishToTikTok, adaptCaptionForTikTok, logTikTokPublication } from './tiktok';
import { refreshAllAnalytics } from './analytics';

// ── Collecte RSS ──────────────────────────────────────────────
async function runCollect(label: string): Promise<void> {
  console.log(`\n🔄 [${label}] Collecte RSS — ${new Date().toISOString()}`);
  try {
    const results = await collectAll();
    const total   = results.reduce((s, r) => s + r.collected, 0);
    console.log(`✅ [${label}] ${total} nouveaux articles`);
    results.forEach(r => r.collected > 0 && console.log(`   • ${r.source}: ${r.collected}`));
  } catch (err) { console.error(`❌ Collecte ${label}:`, err); }
}

// ── Double publication Instagram + TikTok ─────────────────────
async function runPublish(slot: typeof PUBLICATION_SLOTS[number]): Promise<void> {
  console.log(`\n📸 [${slot.emoji} ${slot.label}] Publication — ${new Date().toISOString()}`);
  try {
    const synthesis = await buildSlotPost(slot);
    if (!synthesis) { console.log(`⚠️  Pas de contenu disponible pour ${slot.label}`); return; }

    // ── Instagram ──────────────────────────────────────────────
    const igResult = await publishToInstagram({ caption: synthesis.caption });
    await logPost({
      caption: synthesis.caption, articleIds: synthesis.articleIds,
      postId: igResult.postId, simulation: igResult.simulationMode ?? false,
      scheduledSlot: synthesis.slot,
    });
    const igMode = igResult.simulationMode ? '[SIM] ' : '';
    console.log(igResult.success
      ? `   ✅ Instagram ${igMode}— ID: ${igResult.postId}`
      : `   ❌ Instagram — ${igResult.error}`
    );

    // ── TikTok (simultané) ────────────────────────────────────
    try {
      const ttCaption = adaptCaptionForTikTok(synthesis.caption);
      const ttResult  = await publishToTikTok(ttCaption);
      await logTikTokPublication(slot.label, ttCaption, synthesis.articleIds, ttResult, slot.label);
      const ttMode = ttResult.simulated ? '[SIM] ' : '';
      console.log(ttResult.success
        ? `   ✅ TikTok ${ttMode}— ID: ${ttResult.publishId}`
        : `   ❌ TikTok — ${ttResult.error}`
      );
    } catch (ttErr) { console.error('   ❌ TikTok exception:', ttErr); }

  } catch (err) { console.error(`❌ Publication ${slot.label}:`, err); }
}

// ── Analytics refresh ─────────────────────────────────────────
async function runAnalytics(): Promise<void> {
  try { await refreshAllAnalytics(); } catch (err) { console.error('❌ Analytics:', err); }
}

// ── Optimisation IA hebdomadaire ──────────────────────────────
async function runOptimization(): Promise<void> {
  try {
    console.log('\n🧠 Optimisation hebdomadaire IA...');
    const { runOptimizationCycle } = await import('./optimizer');
    const report = await runOptimizationCycle();
    console.log(`   ✅ ${report.auto_applied.length} changements appliqués`);
    if (report.auto_applied.length) report.auto_applied.forEach(c => console.log(`   • ${c}`));
  } catch (err) { console.error('❌ Optimisation:', err); }
}

// ── Moteur de scheduling basé sur setInterval / 1 min ─────────
interface ScheduledTask {
  hourUTC: number; minuteUTC: number;
  dayOfWeek?: number; // 0=dimanche
  run: () => Promise<void>;
  label: string;
}

const TASKS: ScheduledTask[] = [
  // Collecte 30 min avant chaque publication
  { hourUTC:  6, minuteUTC: 30, label: 'Collecte pré-matinée', run: () => runCollect('Pré-matinée') },
  { hourUTC: 11, minuteUTC: 30, label: 'Collecte pré-midi',    run: () => runCollect('Pré-midi')    },
  { hourUTC: 17, minuteUTC: 30, label: 'Collecte pré-soirée',  run: () => runCollect('Pré-soirée')  },
  { hourUTC: 20, minuteUTC: 30, label: 'Collecte pré-nuit',    run: () => runCollect('Pré-nuit')    },
  // Publications
  { hourUTC:  7, minuteUTC: 0,  label: 'Publication Matinée',  run: () => runPublish(PUBLICATION_SLOTS[0]) },
  { hourUTC: 12, minuteUTC: 0,  label: 'Publication Midi',     run: () => runPublish(PUBLICATION_SLOTS[1]) },
  { hourUTC: 18, minuteUTC: 0,  label: 'Publication Soirée',   run: () => runPublish(PUBLICATION_SLOTS[2]) },
  { hourUTC: 21, minuteUTC: 0,  label: 'Publication Nuit',     run: () => runPublish(PUBLICATION_SLOTS[3]) },
  // Analytics toutes les 6h
  { hourUTC:  0, minuteUTC: 30, label: 'Analytics 00h30',      run: runAnalytics },
  { hourUTC:  6, minuteUTC: 45, label: 'Analytics 06h45',      run: runAnalytics },
  { hourUTC: 12, minuteUTC: 30, label: 'Analytics 12h30',      run: runAnalytics },
  { hourUTC: 18, minuteUTC: 30, label: 'Analytics 18h30',      run: runAnalytics },
  // Optimisation IA chaque dimanche à 06h00
  { hourUTC: 6, minuteUTC: 0, dayOfWeek: 0, label: 'Optimisation IA (dimanche)', run: runOptimization },
];

let schedulerRunning = false;
const executedToday  = new Set<string>();

function tick(): void {
  const now = new Date();
  const h   = now.getUTCHours();
  const m   = now.getUTCMinutes();
  const dow = now.getUTCDay();

  // Reset à minuit
  if (h === 0 && m === 0) executedToday.clear();

  for (const task of TASKS) {
    if (task.hourUTC !== h || task.minuteUTC !== m) continue;
    if (task.dayOfWeek !== undefined && task.dayOfWeek !== dow) continue;

    const key = `${now.toISOString().slice(0,10)}_${task.label}`;
    if (executedToday.has(key)) continue;
    executedToday.add(key);
    task.run().catch(err => console.error(`❌ ${task.label}:`, err));
  }
}

export function startScheduler(): void {
  if (schedulerRunning) return;
  schedulerRunning = true;

  const igMode = process.env.INSTAGRAM_ACCESS_TOKEN ? '🟢 RÉEL' : '🟡 SIMULATION';
  const ttMode = process.env.TIKTOK_ACCESS_TOKEN    ? '🟢 RÉEL' : '🟡 SIMULATION';

  console.log('\n⏰ YAM Media Scheduler démarré');
  console.log('   Collecte RSS  : 06h30 · 11h30 · 17h30 · 20h30 UTC');
  console.log(`   Instagram     : ${igMode} — 07h · 12h · 18h · 21h UTC`);
  console.log(`   TikTok        : ${ttMode} — simultané avec Instagram`);
  console.log('   Analytics     : 00h30 · 06h45 · 12h30 · 18h30 UTC');
  console.log('   Optimisation  : chaque dimanche 06h00\n');

  setInterval(tick, 60_000);
}

// Déclencheurs manuels (utilisés par la route /api/chatbot/optimize)
export async function triggerPublishNow(slotIndex: 0|1|2|3): Promise<void> {
  await runPublish(PUBLICATION_SLOTS[slotIndex]);
}
export async function triggerCollectNow(): Promise<void> {
  await runCollect('Manuel');
}
