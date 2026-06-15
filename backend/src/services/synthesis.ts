/**
 * Service de synthèse IA
 * Gemini regroupe les meilleurs articles d'un créneau horaire
 * en un post Instagram unique, cohérent et engageant.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface Article {
  id:         number;
  title:      string;
  summary:    string;
  category:   string;
  hashtags:   string[];
  importance: string;
  source_name:string;
}

export interface Synthesis {
  caption:    string;
  articleIds: number[];
  slot:       string;
}

/**
 * Heures de publication optimales (UTC = heure Burkina).
 * Basé sur les pics d'engagement Instagram Afrique de l'Ouest.
 *
 * 07h00 – Réveil / trajet matinal        (+38% engagement)
 * 12h00 – Pause déjeuner                 (+45% engagement)
 * 18h00 – Fin de journée / retour maison (+52% engagement)  ← pic principal
 * 21h00 – Soirée détente                 (+41% engagement)
 */
export const PUBLICATION_SLOTS = [
  { hour: 7,  label: 'Matinée',   emoji: '🌅' },
  { hour: 12, label: 'Midi',      emoji: '☀️'  },
  { hour: 18, label: 'Soirée',    emoji: '🌆' },
  { hour: 21, label: 'Nuit',      emoji: '🌙' },
];

/**
 * Récupère les meilleurs articles non encore postés pour un créneau.
 * Priorité : importance haute > moyenne, articles récents.
 */
export async function fetchArticlesForSlot(limit = 5): Promise<Article[]> {
  const rows = await query<Article>(
    `SELECT id, title, summary, category, hashtags, importance, source_name
     FROM articles
     WHERE status = 'published'
       AND id NOT IN (
         SELECT UNNEST(article_ids) FROM instagram_posts
         WHERE published_at > NOW() - INTERVAL '24 hours'
       )
     ORDER BY
       CASE importance WHEN 'haute' THEN 1 WHEN 'moyenne' THEN 2 ELSE 3 END,
       published_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

/**
 * Gemini synthétise plusieurs articles en un seul post Instagram.
 */
export async function synthesizeToInstagramPost(
  articles: Article[],
  slot: { label: string; emoji: string }
): Promise<string> {
  if (articles.length === 0) {
    return '';
  }

  const articlesList = articles
    .map((a, i) => `${i + 1}. [${a.category}] ${a.title}\n   ${a.summary}`)
    .join('\n\n');

  const allHashtags = [
    ...new Set(articles.flatMap(a => a.hashtags ?? []))
  ].slice(0, 10);

  const prompt = `
Tu es le community manager officiel de YAM-MEDIA, 1er média digital burkinabè piloté par l'IA, suivi par des milliers d'Africains.

Créneau : ${slot.emoji} ${slot.label}

Voici ${articles.length} actualités du moment :
${articlesList}

Rédige UN POST INSTAGRAM unique en français qui :
1. Commence par ${slot.emoji} + un titre accrocheur en MAJUSCULES (max 60 caractères)
2. Fait une synthèse fluide et narrative de ces actualités en 3-4 phrases (pas une liste !)
3. Ajoute une phrase d'appel à l'engagement ("Votre avis ? 👇", "Suivez l'évolution !", etc.)
4. Termine avec les hashtags sur une ligne séparée

Hashtags disponibles : ${allHashtags.join(' ')}
Ajoute aussi : #BurkinaFaso #YAMMedia #Actualités #Afrique

RÈGLES STRICTES :
- Ton professionnel mais accessible, jamais alarmiste
- Maximum 300 mots
- Pas de "*" ni de "**" ni de markdown
- Retourne UNIQUEMENT le texte du post, rien d'autre
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Pipeline complet : récupère les articles → synthétise → retourne le post prêt.
 */
export async function buildSlotPost(
  slot: typeof PUBLICATION_SLOTS[number]
): Promise<Synthesis | null> {
  const articles = await fetchArticlesForSlot(5);

  if (articles.length === 0) {
    console.log(`⚠️  Aucun article disponible pour le créneau ${slot.label}`);
    return null;
  }

  const caption = await synthesizeToInstagramPost(articles, slot);

  if (!caption) return null;

  return {
    caption,
    articleIds: articles.map(a => a.id),
    slot:       slot.label,
  };
}
