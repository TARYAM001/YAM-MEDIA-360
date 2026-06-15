import Link from 'next/link';
import { Rss, Zap, Globe, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const categories = ['Politique', 'Économie', 'Sécurité', 'Société', 'Sport', 'Technologie', 'Culture', 'International'];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="border-b border-slate-800 sticky top-0 z-50 bg-dark-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Rss className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gradient">
              YAM-MEDIA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {categories.slice(0, 5).map(cat => (
              <Link
                key={cat}
                href={`/news?category=${cat}`}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                {cat}
              </Link>
            ))}
          </nav>

          <Link href="/dashboard" className="btn-primary text-sm">
            Dashboard
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-500 text-sm mb-6">
            <Zap className="w-3 h-3" />
            Alimenté par Google Gemini AI
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
            L&apos;actualité du{' '}
            <span className="text-gradient">Burkina Faso</span>
            {' '}en temps réel
          </h1>

          <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Articles collectés automatiquement, résumés et analysés par l&apos;IA.
            Restez informé des événements au Burkina et en Afrique.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/actualites" className="btn-primary text-base px-6 py-3">
              <Globe className="w-4 h-4" />
              Parcourir les actualités
            </Link>
            <Link href="/dashboard" className="btn-ghost text-base px-6 py-3">
              <TrendingUp className="w-4 h-4" />
              Voir le dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Catégories ────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-8 text-center">
            Explorer par catégorie
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat}
                href={`/news?category=${cat}`}
                className="card p-6 text-center group animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="text-2xl mb-2">
                  {['🏛️','💰','🛡️','👥','⚽','💻','🎭','🌍'][i]}
                </div>
                <div className="font-medium group-hover:text-brand-500 transition-colors">{cat}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 px-4 text-center text-slate-500 text-sm">
        <p>© 2025 YAM-MEDIA · Burkina Faso · Propulsé par l'IA Gemini</p>
      </footer>
    </div>
  );
}
