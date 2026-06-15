import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { collectAll, collectFromSource, RSS_SOURCES } from '../services/rss';

const router = Router();

// POST /api/collect/all — déclenche la collecte complète (admin)
router.post('/all', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    res.json({ message: 'Collecte lancée en arrière-plan' });
    // Lancer en arrière-plan sans bloquer la réponse
    collectAll().then(results => {
      console.log('Collecte terminée:', results);
    }).catch(err => console.error('Erreur collecte arrière-plan:', err));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du déclenchement' });
  }
});

// POST /api/collect/source — collecte depuis une source spécifique
router.post('/source', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { url, name } = req.body;

  if (!url || !name) {
    res.status(400).json({ error: 'url et name requis' });
    return;
  }

  try {
    const collected = await collectFromSource(url, name);
    res.json({ collected, message: `${collected} article(s) collecté(s)` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur collecte' });
  }
});

// GET /api/collect/sources — liste des sources disponibles
router.get('/sources', authenticate, (_req: AuthRequest, res: Response) => {
  res.json(RSS_SOURCES);
});

export default router;
