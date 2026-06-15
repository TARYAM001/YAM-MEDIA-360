'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink, TrendingUp, Clock, Eye, Search } from 'lucide-react';
import { api, Article } from '../../lib/api';
import clsx from 'clsx';

// ─── Constantes ────────────────────────────────────────────────
const CATS = ['Tous','Politique','Économie','Sécurité','Société','Sport','Technologie','Culture','International'];
const ICONS: Record<string,string> = {
  Politique:'🏛️', Économie:'💰', Sécurité:'🛡️', Société:'👥',
  Sport:'⚽', Technologie:'💻', Culture:'🎭', International:'🌍', Tous:'📰',
};
const BADGE: Record<string,string> = {
  Politique:'bg-blue-50 text-blue-800 border-blue-200',
  Économie:'bg-emerald-50 text-emerald-800 border-emerald-200',
  Sécurité:'bg-red-50 text-red-800 border-red-200',
  Société:'bg-violet-50 text-violet-800 border-violet-200',
  Sport:'bg-orange-50 text-orange-800 border-orange-200',
  Technologie:'bg-cyan-50 text-cyan-800 border-cyan-200',
  Culture:'bg-pink-50 text-pink-800 border-pink-200',
  International:'bg-slate-50 text-slate-700 border-slate-200',
};
const STRIPE: Record<string,string> = {
  Politique:'bg-blue-400', Économie:'bg-emerald-400', Sécurité:'bg-red-400',
  Société:'bg-violet-400', Sport:'bg-orange-400', Technologie:'bg-cyan-400',
  Culture:'bg-pink-400', International:'bg-slate-400',
};

// ─── Page principale ───────────────────────────────────────────
export default function ActualitesPage() {
  const [cat,  setCat]  = useState('Tous');
  const [q,    setQ]    = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR(
    ['act', cat, page],
    () => api.getNews({ page, limit: 20, category: cat === 'Tous' ? undefined : cat })
  );

  const items = (data?.articles ?? []).filter(a =>
    !q ||
    a.title.toLowerCase().includes(q.toLowerCase()) ||
    a.summary.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FA' }}>

      {/* Bandeau supérieur navy */}
      <div style={{ background: '#0D1B3E', padding: '7px 0' }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span style={{ color: '#7EB8F7', fontSize: 12, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>
            🇧🇫 1er média d&apos;information burkinabè encadré par l&apos;IA
          </span>
          <div className="hidden md:flex items-center gap-4"
               style={{ fontSize: 12, color: '#8A97B0', fontFamily: 'Inter,sans-serif' }}>
            <a href="https://instagram.com/yammedia" target="_blank" rel="noopener noreferrer"
               style={{ color: 'inherit', textDecoration: 'none' }}>📸 Instagram</a>
            <span>·</span>
            <a href="https://tiktok.com/@yammedia" target="_blank" rel="noopener noreferrer"
               style={{ color: 'inherit', textDecoration: 'none' }}>🎵 TikTok</a>
            <span>·</span>
            <span>Publication 4× / jour par IA</span>
          </div>
        </div>
      </div>

      {/* Navbar avec vrai logo YAM Media */}
      <header style={{ background: 'white', borderBottom: '1.5px solid #E8EDF5',
                       position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4"
             style={{ height: 68 }}>

          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12,
                                textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/yam-logo.png" alt="YAM Media" width={52} height={52}
                   style={{ borderRadius: 10, objectFit: 'contain' }} priority />
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900,
                            fontSize: 22, letterSpacing: '-0.02em', color: '#0D1B3E' }}>YAM</div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 300, fontSize: 10,
                            letterSpacing: '0.32em', color: '#4A90D9',
                            textTransform: 'uppercase', marginTop: 2 }}>MEDIA</div>
            </div>
          </a>

          {/* Barre de recherche */}
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search style={{ position: 'absolute', left: 14, top: '50%',
                             transform: 'translateY(-50%)', color: '#8A97B0', width: 16, height: 16 }} />
            <input type="text" placeholder="Rechercher une actualité..."
                   value={q} onChange={e => setQ(e.target.value)}
                   className="ym-search" style={{ paddingLeft: 42 }} />
          </div>

          <a href="/dashboard" style={{ padding: '8px 20px', borderRadius: 99, fontSize: 13,
                                        fontWeight: 600, background: '#0D1B3E', color: 'white',
                                        textDecoration: 'none', fontFamily: 'Inter,sans-serif' }}>
            Admin
          </a>
        </div>

        {/* Filtres catégories */}
        <div style={{ borderTop: '1px solid #F0F4FA', background: 'white' }}>
          <div className="max-w-7xl mx-auto px-4">
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto',
                          padding: '10px 0', scrollbarWidth: 'none' }}>
              {CATS.map(c => (
                <button key={c} onClick={() => { setCat(c); setPage(1); }}
                        className={clsx('ym-pill', cat === c && 'active')}>
                  <span>{ICONS[c]}</span><span>{c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* En-tête résultats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
                       fontSize: 18, color: '#0D1B3E' }}>
            {cat === 'Tous' ? 'Toutes les actualités' : `${ICONS[cat]} ${cat}`}
            {!isLoading && data && (
              <span style={{ fontWeight: 400, fontSize: 14, color: '#8A97B0', marginLeft: 8 }}>
                — {data.pagination.total} articles
              </span>
            )}
          </h1>
          {q && (
            <button onClick={() => setQ('')}
                    style={{ fontSize: 13, color: '#4A90D9', cursor: 'pointer',
                             border: 'none', background: 'none', fontFamily: 'Inter,sans-serif' }}>
              ✕ Effacer « {q} »
            </button>
          )}
        </div>

        {/* États */}
        {isLoading ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <EmptyState q={q} cat={cat} />
        ) : (
          <>
            {/* Article à la une */}
            {items[0] && !q && page === 1 && (
              <FeaturedArticle article={items[0]} />
            )}

            {/* Grille */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ marginTop: 20 }}>
              {(q ? items : items.slice(1)).map((a, i) => (
                <ArticleCard key={a.id} article={a} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 8, marginTop: 48 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    style={{ padding: '8px 20px', borderRadius: 99, border: '1.5px solid #0D1B3E',
                             background: 'transparent', color: '#0D1B3E', fontSize: 13, fontWeight: 600,
                             cursor: 'pointer', opacity: page === 1 ? 0.4 : 1,
                             fontFamily: 'Inter,sans-serif' }}>
              ← Précédent
            </button>
            {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                      style={{ width: 36, height: 36, borderRadius: '50%', fontSize: 13, fontWeight: 600,
                               cursor: 'pointer', border: 'none', transition: 'all .2s',
                               background: page === p ? '#0D1B3E' : '#E8EDF5',
                               color: page === p ? 'white' : '#5A6480' }}>{p}</button>
            ))}
            <button disabled={page === data.pagination.pages} onClick={() => setPage(p => p + 1)}
                    style={{ padding: '8px 20px', borderRadius: 99, border: '1.5px solid #0D1B3E',
                             background: 'transparent', color: '#0D1B3E', fontSize: 13, fontWeight: 600,
                             cursor: 'pointer', opacity: page === data.pagination.pages ? 0.4 : 1,
                             fontFamily: 'Inter,sans-serif' }}>
              Suivant →
            </button>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

// ─── Article à la une ──────────────────────────────────────────
function FeaturedArticle({ article }: { article: Article }) {
  return (
    <a href={article.source_url} target="_blank" rel="noopener noreferrer"
       className="ym-featured group block">
      {/* Bande dégradée navy → bleu → bleu clair */}
      <div style={{ height: 5, background: 'linear-gradient(90deg,#0D1B3E,#4A90D9,#7EB8F7)' }} />
      <div style={{ padding: '32px 40px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ background: '#0D1B3E', color: 'white', fontSize: 11, fontWeight: 700,
                         padding: '4px 14px', borderRadius: 99, fontFamily: 'Inter,sans-serif' }}>
            🔥 À la une
          </span>
          <span className={clsx('ym-badge border', BADGE[article.category] || 'bg-blue-50 text-blue-800 border-blue-200')}>
            {ICONS[article.category]} {article.category}
          </span>
          {article.importance === 'haute' && (
            <span className="ym-badge bg-red-50 text-red-700 border-red-200">
              <TrendingUp style={{ width: 11, height: 11 }} /> Urgent
            </span>
          )}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
                         fontSize: 12, color: '#8A97B0', fontFamily: 'Inter,sans-serif' }}>
            <Clock style={{ width: 12, height: 12 }} />
            {formatDistanceToNow(new Date(article.published_at || article.created_at),
              { addSuffix: true, locale: fr })}
          </span>
        </div>

        <h2 className="line-clamp-2 group-hover:text-[#4A90D9] transition-colors"
            style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 800,
                     fontSize: 'clamp(20px,3vw,30px)', color: '#0D1B3E',
                     lineHeight: 1.25, marginBottom: 12 }}>
          {article.title}
        </h2>

        <p className="line-clamp-3"
           style={{ color: '#5A6480', fontSize: 16, lineHeight: 1.7,
                    maxWidth: '70ch', marginBottom: 18 }}>
          {article.summary}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                      justifyContent: 'space-between', paddingTop: 14,
                      borderTop: '1px solid #E8EDF5', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14,
                        fontSize: 13, color: '#8A97B0', fontFamily: 'Inter,sans-serif' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye style={{ width: 13, height: 13 }} /> {article.views} vues
            </span>
            <span style={{ fontWeight: 600, color: '#5A6480' }}>{article.source_name}</span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6,
                         fontSize: 13, color: '#4A90D9', fontWeight: 600 }}>
            Lire l&apos;article <ExternalLink style={{ width: 13, height: 13 }} />
          </span>
        </div>
      </div>
    </a>
  );
}

// ─── Carte article ─────────────────────────────────────────────
function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <a href={article.source_url} target="_blank" rel="noopener noreferrer"
       className={clsx('ym-card flex flex-col animate-fade-up')}
       style={{ animationDelay: `${Math.min(index * 55, 440)}ms` }}>

      {/* Bande couleur catégorie */}
      <div className={clsx('flex-shrink-0', STRIPE[article.category] || 'bg-blue-400')}
           style={{ height: 6 }} />

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <span className={clsx('ym-badge border',
            BADGE[article.category] || 'bg-blue-50 text-blue-800 border-blue-200')}>
            {ICONS[article.category]} {article.category}
          </span>
          {article.importance === 'haute' && (
            <span className="ym-badge bg-red-50 text-red-700 border-red-200">
              <TrendingUp style={{ width: 10, height: 10 }} /> Urgent
            </span>
          )}
        </div>

        {/* Titre */}
        <h3 className="line-clamp-2"
            style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 15,
                     color: '#0D1B3E', lineHeight: 1.4, marginBottom: 8, flex: 1 }}>
          {article.title}
        </h3>

        {/* Résumé */}
        <p className="line-clamp-3"
           style={{ color: '#5A6480', fontSize: 13, lineHeight: 1.65, marginBottom: 12 }}>
          {article.summary}
        </p>

        {/* Footer carte */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingTop: 10, marginTop: 'auto', borderTop: '1px solid #E8EDF5',
                      fontSize: 11, color: '#8A97B0', fontFamily: 'Inter,sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock style={{ width: 11, height: 11 }} />
              {formatDistanceToNow(new Date(article.published_at || article.created_at),
                { addSuffix: true, locale: fr })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Eye style={{ width: 11, height: 11 }} /> {article.views}
            </span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3,
                         color: '#4A90D9', fontWeight: 600 }}>
            {article.source_name} <ExternalLink style={{ width: 11, height: 11 }} />
          </span>
        </div>

        {/* Hashtags */}
        {article.hashtags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10,
                        paddingTop: 10, borderTop: '1px solid #E8EDF5' }}>
            {article.hashtags.slice(0, 3).map((t: string) => (
              <span key={t} style={{ fontSize: 10, color: '#8A97B0' }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ background: 'white', borderRadius: 16,
                               border: '1px solid #E8EDF5', overflow: 'hidden' }}>
          <div className="skeleton" style={{ height: 6 }} />
          <div style={{ padding: 20 }}>
            {[35, 100, 80, 100, 65].map((w, j) => (
              <div key={j} className="skeleton"
                   style={{ height: j === 0 ? 18 : j < 3 ? 14 : 11,
                             borderRadius: j === 0 ? 99 : 4, width: `${w}%`, marginBottom: 8 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── État vide ─────────────────────────────────────────────────
function EmptyState({ q, cat }: { q: string; cat: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#E8EDF5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, margin: '0 auto 16px' }}>🔍</div>
      <h3 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
                   fontSize: 18, color: '#0D1B3E', marginBottom: 8 }}>
        Aucun article trouvé
      </h3>
      <p style={{ color: '#5A6480', fontSize: 14, fontFamily: 'Inter,sans-serif' }}>
        {q ? `Aucun résultat pour « ${q} »`
           : `Pas d'article en « ${cat} » pour l'instant`}
      </p>
    </div>
  );
}

// ─── Footer ────────────────────────────────────────────────────
function SiteFooter() {
  const sources = ['Burkina24','LeFaso.net','Oméga Médias','Radio Oméga FM',
                   'RFI Afrique','France 24','BBC Afrique','NBC News'];
  return (
    <footer style={{ background: '#0D1B3E', color: 'white', marginTop: 64 }}>
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-10" style={{ marginBottom: 40 }}>

          {/* Logo + bio */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <Image src="/yam-logo.png" alt="YAM Media" width={56} height={56}
                     style={{ borderRadius: 12, objectFit: 'contain' }} />
              <div>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: 24 }}>
                  YAM
                </div>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 300,
                              fontSize: 11, letterSpacing: '0.32em', color: '#7EB8F7' }}>
                  MEDIA
                </div>
              </div>
            </div>
            <p style={{ color: '#8A97B0', fontSize: 13, lineHeight: 1.75, fontFamily: 'Inter,sans-serif' }}>
              Le média intelligent au service d&apos;une nouvelle ère.<br />
              1er média d&apos;information burkinabè encadré par l&apos;IA.
            </p>
          </div>

          {/* Sources */}
          <div>
            <h3 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 11,
                         letterSpacing: '0.2em', color: '#7EB8F7', textTransform: 'uppercase',
                         marginBottom: 14 }}>
              Nos sources (10)
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0,
                         display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
              {sources.map(s => (
                <li key={s} style={{ display: 'flex', alignItems: 'center', gap: 8,
                                      fontSize: 12, color: '#8A97B0', fontFamily: 'Inter,sans-serif' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%',
                                  background: '#4A90D9', flexShrink: 0 }} />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Réseaux + horaires */}
          <div>
            <h3 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 11,
                         letterSpacing: '0.2em', color: '#7EB8F7', textTransform: 'uppercase',
                         marginBottom: 14 }}>
              Suivre YAM Media
            </h3>
            {[
              { href: 'https://instagram.com/yammedia', icon: '📸', label: 'Instagram · @yammedia' },
              { href: 'https://tiktok.com/@yammedia',   icon: '🎵', label: 'TikTok · @yammedia'    },
            ].map(n => (
              <a key={n.href} href={n.href} target="_blank" rel="noopener noreferrer"
                 style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
                          color: '#8A97B0', textDecoration: 'none', marginBottom: 10,
                          fontFamily: 'Inter,sans-serif' }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: '#1A2F5E',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16 }}>{n.icon}</span>
                {n.label}
              </a>
            ))}

            {/* Créneaux */}
            <div style={{ background: '#1A2F5E', borderRadius: 12, padding: '12px 16px', marginTop: 10 }}>
              <p style={{ fontSize: 11, color: '#7EB8F7', fontWeight: 700, letterSpacing: '.1em',
                          textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Inter,sans-serif' }}>
                Publications auto
              </p>
              {['🌅 07h00 · Matinée','☀️ 12h00 · Midi','🌆 18h00 · Soirée','🌙 21h00 · Nuit'].map(s => (
                <p key={s} style={{ fontSize: 12, color: '#8A97B0', fontFamily: 'Inter,sans-serif',
                                    margin: '3px 0' }}>{s}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #1A2F5E', paddingTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#4A5568', fontFamily: 'Inter,sans-serif', marginBottom: 4 }}>
            © 2025 YAM Media · Burkina Faso 🇧🇫 · Propulsé par Google Gemini AI
          </p>
          <p style={{ fontSize: 11, color: '#2D3A55', fontFamily: 'Inter,sans-serif' }}>
            Images : Google Images &amp; Pinterest · Instagram &amp; TikTok 4× / jour
          </p>
        </div>
      </div>
    </footer>
  );
}
