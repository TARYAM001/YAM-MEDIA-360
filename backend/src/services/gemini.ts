import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface ProcessedArticle {
  title: string;
  summary: string;
  hashtags: string[];
  category: string;
  importance: 'haute' | 'moyenne' | 'faible';
}

export async function processArticle(
  rawTitle: string,
  rawContent: string
): Promise<ProcessedArticle> {
  const prompt = `
Tu es un journaliste expert en actualités africaines, spécialisé dans le Burkina Faso.
Analyse cet article et retourne UNIQUEMENT un JSON valide (sans markdown).

Titre original: ${rawTitle}
Contenu: ${rawContent.slice(0, 2000)}

Retourne exactement ce format JSON:
{
  "title": "Titre accrocheur en français (max 80 caractères)",
  "summary": "Résumé clair et informatif en 2-3 phrases",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "category": "Une seule catégorie parmi: Politique, Économie, Sécurité, Société, Sport, Technologie, International, Culture",
  "importance": "haute ou moyenne ou faible"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Nettoyer les backticks si présents
  const clean = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean) as ProcessedArticle;
  } catch {
    // Fallback si le JSON est malformé
    return {
      title: rawTitle.slice(0, 80),
      summary: rawContent.slice(0, 300),
      hashtags: ['#BurkinaFaso', '#Actualités'],
      category: 'International',
      importance: 'moyenne',
    };
  }
}

export async function generateInstagramCaption(
  title: string,
  summary: string,
  hashtags: string[]
): Promise<string> {
  const prompt = `
Crée une légende Instagram engageante pour cette actualité.
Titre: ${title}
Résumé: ${summary}
Hashtags: ${hashtags.join(' ')}

La légende doit:
- Commencer par un emoji percutant
- Être en français
- Avoir 100-150 mots
- Inclure un appel à l'action
- Terminer avec les hashtags

Retourne UNIQUEMENT le texte de la légende, sans explications.
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
