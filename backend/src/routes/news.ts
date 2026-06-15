import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/news — liste paginée des articles publiés
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as string;
  const offset = (page - 1) * limit;

  try {
    let whereClause = "WHERE status = 'published'";
    let params: unknown[] = [];
    let limitPlaceholder = '$1';
    let offsetPlaceholder = '$2';

    if (category) {
      whereClause += ` AND category = $1`;
      params = [category, limit, offset];
      limitPlaceholder = '$2';
      offsetPlaceholder = '$3';
    } else {
      params = [limit, offset];
    }

    const articles = await query(
      `SELECT id, title, summary, category, hashtags, importance,
              source_name, published_at, created_at
       FROM articles
       ${whereClause}
       ORDER BY published_at DESC
       LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
      params
    );

    const [{ count }] = await query<{ count: string }>(
      `SELECT COUNT(*) FROM articles ${whereClause}`,
      category ? [category] : []
    );

    res.json({
      articles,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(parseInt(count) / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/news/admin/pending — articles en attente (admin)
router.get('/admin/pending', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const articles = await query(
      `SELECT * FROM articles WHERE status = 'pending' ORDER BY created_at DESC`
    );
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/news/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [article] = await query(
      `SELECT * FROM articles WHERE id = $1 AND status = 'published'`,
      [req.params.id]
    );

    if (!article) {
      res.status(404).json({ error: 'Article non trouvé' });
      return;
    }

    // Incrémenter les vues
    await query('UPDATE articles SET views = views + 1 WHERE id = $1', [req.params.id]);

    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/news/:id/status — admin seulement
router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'published', 'rejected'];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Statut invalide' });
    return;
  }

  try {
    const [article] = await query(
      `UPDATE articles SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, title, status`,
      [status, req.params.id]
    );

    if (!article) {
      res.status(404).json({ error: 'Article non trouvé' });
      return;
    }

    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
