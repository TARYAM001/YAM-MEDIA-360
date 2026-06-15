/**
 * Service Instagram Graph API
 *
 * MODE SIMULATION : fonctionne sans token réel.
 * Pour activer le vrai Instagram :
 *   1. Créer une app Meta sur developers.facebook.com
 *   2. Connecter un compte Instagram Business
 *   3. Obtenir un Page Access Token long-durée
 *   4. Renseigner INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_ACCOUNT_ID dans .env
 */

import { query } from '../config/database';

const IS_SIMULATION = !process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_API = 'https://graph.facebook.com/v19.0';

export interface InstagramPost {
  caption: string;
  imageUrl?: string;   // URL publique d'une image (optionnel en simulation)
}

export interface PostResult {
  success: boolean;
  postId?: string;
  simulationMode?: boolean;
  error?: string;
}

/**
 * Publie un post sur Instagram (ou simule la publication).
 */
export async function publishToInstagram(post: InstagramPost): Promise<PostResult> {
  if (IS_SIMULATION) {
    console.log('📸 [SIMULATION Instagram] Post qui serait publié :');
    console.log('─'.repeat(60));
    console.log(post.caption.slice(0, 200) + '...');
    console.log('─'.repeat(60));
    return { success: true, postId: `sim_${Date.now()}`, simulationMode: true };
  }

  try {
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID!;
    const token     = process.env.INSTAGRAM_ACCESS_TOKEN!;

    // Étape 1 : créer le container média
    const containerBody: Record<string, string> = {
      caption:      post.caption,
      access_token: token,
    };

    if (post.imageUrl) {
      containerBody.image_url  = post.imageUrl;
      containerBody.media_type = 'IMAGE';
    } else {
      // Post texte seul via image de marque par défaut
      containerBody.image_url  = process.env.DEFAULT_IG_IMAGE_URL || '';
      containerBody.media_type = 'IMAGE';
    }

    const containerRes = await fetch(
      `${IG_API}/${accountId}/media`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(containerBody),
      }
    );

    const container = await containerRes.json() as { id?: string; error?: { message: string } };
    if (!container.id) throw new Error(container.error?.message || 'Création container échouée');

    // Étape 2 : publier le container
    const publishRes = await fetch(
      `${IG_API}/${accountId}/media_publish`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ creation_id: container.id, access_token: token }),
      }
    );

    const published = await publishRes.json() as { id?: string; error?: { message: string } };
    if (!published.id) throw new Error(published.error?.message || 'Publication échouée');

    return { success: true, postId: published.id };
  } catch (err) {
    const message = (err as Error).message;
    console.error('❌ Erreur Instagram:', message);
    return { success: false, error: message };
  }
}

/**
 * Enregistre un post publié en base de données.
 */
export async function logPost(params: {
  caption:        string;
  articleIds:     number[];
  postId?:        string;
  simulation:     boolean;
  scheduledSlot:  string;
}): Promise<void> {
  await query(
    `INSERT INTO instagram_posts
       (caption, article_ids, ig_post_id, simulation, scheduled_slot, published_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [
      params.caption,
      params.articleIds,
      params.postId || null,
      params.simulation,
      params.scheduledSlot,
    ]
  );
}
