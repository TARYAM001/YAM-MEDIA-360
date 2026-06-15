import { Router, Response } from 'express';
import { query } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/stats — statistiques générales
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const [totals] = await query<{
      total: string; published: string; pending: string; rejected: string;
    }>(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'published') AS published,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
      FROM articles
    `);

    const byCategory = await query<{ category: string; count: string }>(`
      SELECT category, COUNT(*) as count
      FROM articles WHERE status = 'published'
      GROUP BY category ORDER BY count DESC
    `);

    const recentActivity = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as articles
      FROM articles
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const topViewed = await query(`
      SELECT id, title, views, category
      FROM articles
      WHERE status = 'published'
      ORDER BY views DESC
      LIMIT 5
    `);

    res.json({
      totals,
      byCategory,
      recentActivity,
      topViewed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
