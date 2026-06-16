import type { Metadata } from 'next';
import { Montserrat, Inter } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'], weight: ['300','400','600','700','900'],
  variable: '--font-display', display: 'swap',
});
const inter = Inter({
  subsets: ['latin'], weight: ['400','500','600'],
  variable: '--font-body', display: 'swap',
});

export const metadata: Metadata = {
  title: 'YAM Media — Le média intelligent au service d\'une nouvelle ère',
  description: '1er média d\'information burkinabè encadré par l\'IA. Actualités Burkina Faso en temps réel, synthétisées par Google Gemini AI.',
  keywords: ['Burkina Faso','actualités','YAM Media','Afrique','IA','information'],
  openGraph: {
    title: 'YAM Media',
    description: 'Le média intelligent au service d\'une nouvelle ère',
    locale: 'fr_BF', type: 'website',
    images: [{ url: '/yam-logo.png', width: 1080, height: 1080 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
