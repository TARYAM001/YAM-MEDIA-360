import { query } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

const TT_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || '';
const SIMULATE = !TT_TOKEN || process.env.TIKTOK_SIMULATE === 'true';

export interface TikTokResult {
  success: boolean; publishId?: string; simulated?: boolean; error?: string;
}

/** Adapte une légende Instagram pour TikTok : ton plus jeune + hashtags #fyp */
export function adaptCaptionForTikTok(igCaption: string): string {
  let caption = igCaption.slice(0, 2000);
  // Retirer les anciens hashtags et en ajouter des TikTok-spécifiques
  caption = caption.replace(/#\w+/g, '').trim();
  caption += '\n\n#BurkinaFaso🇧🇫 #YAMMedia #fyp #pourtoi #actualites #afrique #africa';
  return caption;
}

export async function publishToTikTok(caption: string, imageUrls?: string[]): Promise<TikTokResult> {
  if (SIMULATE) {
    const id = `TIK_SIM_${Date.now()}`;
    console.log(`[TIKTOK SIMULATION] ${id} — ${caption.slice(0, 60)}...`);
    return { success: true, publishId: id, simulated: true };
  }

  try {
    const defaultImg = process.env.YAM_MEDIA_DEFAULT_IMAGE_URL ||
      'https://via.placeholder.com/1080x1080/0D1B3E/7EB8F7?text=YAM+MEDIA';
    const photos = (imageUrls?.length ? imageUrls : [defaultImg]).slice(0, 35);

    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TT_TOKEN}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        post_info: {
          title: caption.slice(0, 150),
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false, disable_comment: false, disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_images: photos.map(url => ({ url })),
          photo_cover_index: 0,
        },
        media_type: 'PHOTO',
      }),
    });

    const data = await res.json() as {
      data?: { publish_id: string };
      error?: { code: string; message: string };
    };

    if (!data.data?.publish_id) throw new Error(data.error?.message || 'TikTok publish failed');
    return { success: true, publishId: data.data.publish_id, simulated: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[TIKTOK ERROR]', msg);
    return { success: false, error: msg };
  }
}

export async function logTikTokPublication(
  title: string, caption: string, articleIds: number[],
  result: TikTokResult, slotName: string
): Promise<void> {
  await query(
    `INSERT INTO tiktok_posts (title, caption, article_ids, tiktok_publish_id, simulated, status, slot_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [title, caption, articleIds, result.publishId || null,
     result.simulated ?? false, result.success ? 'published' : 'failed', slotName]
  ).catch(() => {}); // table créée par migration 003
}
