import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { triggerPublishNow, triggerCollectNow } from '../services/scheduler';
import { PUBLICATION_SLOTS } from '../services/synthesis';
import { query } from '../config/database';

const router = Router();

// POST /api/instagram/publish-now?slot=0|1|2|3
// Déclenche manuellement une publication pour un créneau donné
router.post('/publish-now', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const slot = parseInt(req.query.slot as string ?? '0') as 0 | 1 | 2 | 3;

  if (![0, 1, 2, 3].includes(slot)) {
    res.status(400).json({ error: 'slot doit être 0, 1, 2 ou 3' });
    return;
  }

  res.json({ message: `Publication créneau "${PUBLICATION_SLOTS[slot].label}" lancée en arrière-plan` });
  triggerPublishNow(slot).catch(console.error);
});

// POST /api/instagram/collect-now
router.post('/collect-now', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  res.json({ message: 'Collecte manuelle lancée en arrière-plan' });
  triggerCollectNow().catch(console.error);
});

// GET /api/instagram/posts — historique des posts publiés
router.get('/posts', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const posts = await query(
      `SELECT id, caption, article_ids, ig_post_id, simulation,
              scheduled_slot, published_at
       FROM instagram_posts
       ORDER BY published_at DESC
       LIMIT 50`
    );
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/instagram/slots — info sur les créneaux
router.get('/slots', (_req, res: Response) => {
  res.json(
    PUBLICATION_SLOTS.map(s => ({
      ...s,
      localTime: `${String(s.hour).padStart(2, '0')}:00 (Burkina / UTC+0)`,
    }))
  );
});

// GET /api/instagram/status — état du mode (simulation ou réel)
router.get('/status', authenticate, (_req: AuthRequest, res: Response) => {
  res.json({
    mode:             process.env.INSTAGRAM_ACCESS_TOKEN ? 'RÉEL' : 'SIMULATION',
    accountConfigured: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    slots: PUBLICATION_SLOTS.map(s => ({
      emoji: s.emoji,
      label: s.label,
      time:  `${String(s.hour).padStart(2, '0')}:00 UTC`,
    })),
  });
});

export default router;
