'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api, Article, StatsData } from '../../lib/api';
import {
  BarChart2, RefreshCw, CheckCircle, XCircle,
  Clock, Eye, Zap, TrendingUp, AlertCircle,
  Instagram, Play, Sunrise, Sun, Sunset, Moon
} from 'lucide-react';
import clsx from 'clsx';

const SLOTS = [
  { label: 'Matinée', emoji: '🌅', icon: Sunrise, hour: '07:00', index: 0 },
  { label: 'Midi',    emoji: '☀️',  icon: Sun,     hour: '12:00', index: 1 },
  { label: 'Soirée',  emoji: '🌆', icon: Sunset,  hour: '18:00', index: 2 },
  { label: 'Nuit',    emoji: '🌙', icon: Moon,    hour: '21:00', index: 3 },
];

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [loginForm, setLoginForm]     = useState({ email: '', password: '' });
  const [loginError, setLoginError]   = useState('');
  const [collecting, setCollecting]   = useState(false);
  const [publishing, setPublishing]   = useState<number | null>(null);
  const [activeTab, setActiveTab]     = useState<'stats' | 'pending' | 'instagram'>('stats');

  useEffect(() => {
    if (api.getToken()) setIsLoggedIn(true);
  }, []);

  const { data: stats } = useSWR<StatsData>(
    isLoggedIn ? 'stats' : null,
    () => api.getStats()
  );

  const { data: pending, mutate: mutatePending } = useSWR<Article[]>(
    isLoggedIn ? 'pending' : null,
    () => api.getPending()
  );

  const { data: igPosts, mutate: mutateIg } = useSWR(
    isLoggedIn ? 'ig-posts' : null,
    () => api.getInstagramPosts()
  );

  const { data: igStatus } = useSWR(
    isLoggedIn ? 'ig-status' : null,
    () => api.getInstagramStatus()
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    try {
      const { token } = await api.login(loginForm.email, loginForm.password);
      api.setToken(token);
      setIsLoggedIn(true);
    } catch (err) {
      setLoginError((err as Error).message);
    }
  }

  async function handleCollect() {
    setCollecting(true);
    try {
      await api.collectAll();
      setTimeout(() => { mutatePending(); setCollecting(false); }, 3000);
    } catch { setCollecting(false); }
  }

  async function handleStatus(id: number, status: string) {
    await api.updateStatus(id, status);
    mutatePending();
  }

  async function handlePublishNow(slotIndex: number) {
    setPublishing(slotIndex);
    try {
      await api.publishNow(slotIndex);
      setTimeout(() => { mutateIg(); setPublishing(null); }, 4000);
    } catch { setPublishing(null); }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-500 mx-auto mb-4 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold">YAM-MEDIA Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Connexion administrateur</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input type="email" value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5
                           text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                placeholder="admin@yam-media.bf" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Mot de passe</label>
              <input type="password" value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5
                           text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                placeholder="••••••••" required />
            </div>
            {loginError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{loginError}
              </div>
            )}
            <button type="submit" className="btn-primary w-full justify-center py-3">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-xl">
            <span className="text-gradient">Faso</span>News Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleCollect} disabled={collecting}
            className={clsx('btn-primary text-sm', collecting && 'opacity-75')}>
            <RefreshCw className={clsx('w-4 h-4', collecting && 'animate-spin')} />
            {collecting ? 'Collecte...' : 'Collecter'}
          </button>
          <button onClick={() => { api.clearToken(); setIsLoggedIn(false); }}
            className="btn-ghost text-sm">Déconnexion</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total',      value: stats.totals.total,     icon: BarChart2,   color: 'text-slate-400'  },
              { label: 'Publiés',    value: stats.totals.published,  icon: CheckCircle, color: 'text-emerald-400'},
              { label: 'En attente', value: stats.totals.pending,    icon: Clock,       color: 'text-yellow-400' },
              { label: 'Rejetés',    value: stats.totals.rejected,   icon: XCircle,     color: 'text-red-400'    },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={clsx('w-4 h-4', color)} />
                  <span className="text-slate-400 text-sm">{label}</span>
                </div>
                <div className="text-3xl font-bold font-display">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-4 border-b border-slate-800 mb-6 overflow-x-auto">
          {([
            ['stats',     'Statistiques',                          TrendingUp ],
            ['pending',   `En attente (${pending?.length ?? 0})`, Clock      ],
            ['instagram', 'Instagram',                             Instagram  ],
          ] as const).map(([tab, label, Icon]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-slate-400 hover:text-white'
              )}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ── Onglet Stats ─────────────────────────────────── */}
        {activeTab === 'stats' && stats && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-500" />Articles par catégorie
              </h3>
              <div className="space-y-3">
                {stats.byCategory.map(({ category, count }) => {
                  const max = Math.max(...stats.byCategory.map(c => parseInt(c.count)));
                  const pct = (parseInt(count) / max) * 100;
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{category}</span>
                        <span className="text-slate-400">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-500" />Articles les plus vus
              </h3>
              <div className="space-y-3">
                {stats.topViewed.map((article, i) => (
                  <div key={article.id} className="flex items-start gap-3">
                    <span className="text-2xl font-display font-bold text-slate-700 w-8 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{article.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-orange text-xs">{article.category}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Eye className="w-3 h-3" />{article.views}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Onglet Pending ───────────────────────────────── */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            {pending?.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun article en attente</p>
              </div>
            )}
            {pending?.map(article => (
              <div key={article.id} className="card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-orange">{article.category}</span>
                    <span className="text-xs text-slate-500">{article.source_name}</span>
                  </div>
                  <h4 className="font-medium mb-1 line-clamp-1">{article.title}</h4>
                  <p className="text-slate-400 text-sm line-clamp-2">{article.summary}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleStatus(article.id, 'published')}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors" title="Publier">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleStatus(article.id, 'rejected')}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" title="Rejeter">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Onglet Instagram ─────────────────────────────── */}
        {activeTab === 'instagram' && (
          <div className="space-y-6">
            {/* Statut du mode */}
            {igStatus && (
              <div className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
                igStatus.mode === 'RÉEL'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              )}>
                <Instagram className="w-4 h-4 flex-shrink-0" />
                <span>
                  Mode <strong>{igStatus.mode}</strong>
                  {igStatus.mode === 'SIMULATION' && ' — configure INSTAGRAM_ACCESS_TOKEN pour publier réellement'}
                </span>
              </div>
            )}

            {/* Créneaux de publication */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" />
                Créneaux automatiques (UTC = heure Burkina)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SLOTS.map(slot => (
                  <div key={slot.index} className="card p-4 text-center">
                    <div className="text-3xl mb-1">{slot.emoji}</div>
                    <div className="font-medium text-sm mb-0.5">{slot.label}</div>
                    <div className="text-slate-400 text-xs mb-3">{slot.hour}</div>
                    <button
                      onClick={() => handlePublishNow(slot.index)}
                      disabled={publishing === slot.index}
                      className={clsx(
                        'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        publishing === slot.index
                          ? 'bg-slate-700 text-slate-400'
                          : 'bg-brand-500/20 hover:bg-brand-500/30 text-brand-500'
                      )}>
                      <Play className={clsx('w-3 h-3', publishing === slot.index && 'animate-pulse')} />
                      {publishing === slot.index ? 'En cours...' : 'Publier maintenant'}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-3">
                📅 Publication automatique chaque jour aux heures ci-dessus. Collecte RSS lancée 30 min avant.
              </p>
            </div>

            {/* Historique des posts */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Instagram className="w-4 h-4 text-brand-500" />
                Historique des publications
              </h3>
              {!igPosts || igPosts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 card">
                  <Instagram className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun post publié pour l'instant</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {igPosts.map((post: {
                    id: number; caption: string; scheduled_slot: string;
                    simulation: boolean; ig_post_id: string; published_at: string;
                  }) => (
                    <div key={post.id} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-orange">{post.scheduled_slot}</span>
                          {post.simulation
                            ? <span className="badge badge-yellow">Simulation</span>
                            : <span className="badge badge-green">Publié</span>}
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(post.published_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-3 whitespace-pre-line">
                        {post.caption}
                      </p>
                      {post.ig_post_id && !post.simulation && (
                        <p className="text-xs text-slate-500 mt-2">ID: {post.ig_post_id}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
