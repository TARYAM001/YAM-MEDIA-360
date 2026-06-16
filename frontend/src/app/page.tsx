import Link from 'next/link';
import { Sparkles, Globe2, BarChart3 } from 'lucide-react';
import YamLogo from '../components/YamLogo';

const CATEGORIES = [
  { name: 'Politique',      icon: '🏛️' },
  { name: 'Économie',       icon: '💰' },
  { name: 'Sécurité',       icon: '🛡️' },
  { name: 'Société',        icon: '👥' },
  { name: 'Sport',          icon: '⚽' },
  { name: 'Technologie',    icon: '💻' },
  { name: 'Culture',        icon: '🎭' },
  { name: 'International',  icon: '🌍' },
];

export default function HomePage() {
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

      {/* Navbar avec le vrai logo YAM Media */}
      <header style={{ background: 'white', borderBottom: '1.5px solid #E8EDF5',
                       position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4" style={{ height: 68 }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <YamLogo size={44} />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {CATEGORIES.slice(0, 5).map(c => (
              <Link key={c.name} href={`/actualites?category=${c.name}`}
                    style={{ fontSize: 13, fontWeight: 500, color: '#5A6480', textDecoration: 'none',
                             fontFamily: 'Inter,sans-serif' }}>
                {c.name}
              </Link>
            ))}
          </nav>

          <Link href="/dashboard" style={{ padding: '8px 20px', borderRadius: 99, fontSize: 13,
                                            fontWeight: 600, background: '#0D1B3E', color: 'white',
                                            textDecoration: 'none', fontFamily: 'Inter,sans-serif' }}>
            Dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(135deg,#0D1B3E 0%,#1A2F5E 55%,#243A72 100%)',
                        padding: '96px 24px 110px' }}>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 420, height: 420,
                      borderRadius: '50%', background: 'rgba(74,144,217,0.18)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: -160, left: -100, width: 360, height: 360,
                      borderRadius: '50%', background: 'rgba(126,184,247,0.12)', filter: 'blur(70px)' }} />

        <div className="max-w-4xl mx-auto text-center" style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
                       background: 'rgba(126,184,247,0.12)', border: '1px solid rgba(126,184,247,0.3)',
                       borderRadius: 99, color: '#7EB8F7', fontSize: 13, fontWeight: 600,
                       fontFamily: 'Inter,sans-serif', marginBottom: 28 }}>
            <Sparkles style={{ width: 14, height: 14 }} /> Alimenté par Google Gemini AI
          </div>

          <h1 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, color: 'white',
                       fontSize: 'clamp(34px,6vw,58px)', lineHeight: 1.15, marginBottom: 22 }}>
            L&apos;actualité du{' '}
            <span style={{ color: '#7EB8F7' }}>Burkina Faso</span>
            {' '}en temps réel
          </h1>

          <p style={{ color: '#C8D3E8', fontSize: 17, lineHeight: 1.7, maxWidth: 620,
                     margin: '0 auto 40px', fontFamily: 'Inter,sans-serif' }}>
            Articles collectés automatiquement depuis 10 sources, résumés et analysés par l&apos;IA.
            Restez informé des événements au Burkina et en Afrique.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/actualites" className="ym-btn-primary">
              <Globe2 style={{ width: 16, height: 16 }} /> Parcourir les actualités
            </Link>
            <Link href="/dashboard"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px',
                           background: 'transparent', color: 'white', border: '1.5px solid rgba(255,255,255,0.35)',
                           borderRadius: 99, fontWeight: 600, fontSize: 14, fontFamily: 'Inter,sans-serif',
                           textDecoration: 'none' }}>
              <BarChart3 style={{ width: 16, height: 16 }} /> Voir le dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Bandeau stats, à cheval sur le hero */}
      <section className="max-w-5xl mx-auto px-4" style={{ marginTop: -48, position: 'relative', zIndex: 10 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { value: '10', label: 'Sources surveillées' },
            { value: '4×/jour', label: 'Publications automatiques' },
            { value: 'Gemini AI', label: 'Résumés générés par IA' },
          ].map(s => (
            <div key={s.label} className="ym-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 800, fontSize: 26, color: '#0D1B3E' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: '#5A6480', marginTop: 4, fontFamily: 'Inter,sans-serif' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Catégories */}
      <section className="max-w-7xl mx-auto px-4" style={{ padding: '80px 0 24px' }}>
        <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 800, fontSize: 26, color: '#0D1B3E',
                    textAlign: 'center', marginBottom: 40 }}>
          Explorer par catégorie
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((c, i) => (
            <Link key={c.name} href={`/actualites?category=${c.name}`}
                  className="ym-card animate-fade-up"
                  style={{ padding: '28px 16px', textAlign: 'center', textDecoration: 'none',
                           animationDelay: `${i * 50}ms` }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 14, color: '#0D1B3E' }}>
                {c.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

// ─── Footer (identique à celui de /actualites, pour une marque cohérente) ──
function SiteFooter() {
  const sources = ['Burkina24', 'LeFaso.net', 'Oméga Médias', 'Radio Oméga FM',
                    'RFI Afrique', 'France 24', 'BBC Afrique', 'NBC News'];
  return (
    <footer style={{ background: '#0D1B3E', color: 'white', marginTop: 64 }}>
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-10" style={{ marginBottom: 40 }}>

          <div>
            <div style={{ marginBottom: 14 }}>
              <YamLogo size={56} dark />
            </div>
            <p style={{ color: '#8A97B0', fontSize: 13, lineHeight: 1.75, fontFamily: 'Inter,sans-serif' }}>
              Le média intelligent au service d&apos;une nouvelle ère.<br />
              1er média d&apos;information burkinabè encadré par l&apos;IA.
            </p>
          </div>

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

            <div style={{ background: '#1A2F5E', borderRadius: 12, padding: '12px 16px', marginTop: 10 }}>
              <p style={{ fontSize: 11, color: '#7EB8F7', fontWeight: 700, letterSpacing: '.1em',
                          textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Inter,sans-serif' }}>
                Publications auto
              </p>
              {['🌅 07h00 · Matinée', '☀️ 12h00 · Midi', '🌆 18h00 · Soirée', '🌙 21h00 · Nuit'].map(s => (
                <p key={s} style={{ fontSize: 12, color: '#8A97B0', fontFamily: 'Inter,sans-serif',
                                    margin: '3px 0' }}>{s}</p>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1A2F5E', paddingTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#4A5568', fontFamily: 'Inter,sans-serif', marginBottom: 4 }}>
            © 2026 YAM Media · Burkina Faso 🇧🇫 · Propulsé par Google Gemini AI
          </p>
          <p style={{ fontSize: 11, color: '#2D3A55', fontFamily: 'Inter,sans-serif' }}>
            Images : Google Images &amp; Pinterest · Instagram &amp; TikTok 4× / jour
          </p>
        </div>
      </div>
    </footer>
  );
}
