'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink, TrendingUp, Clock, Eye } from 'lucide-react';
import { api, Article } from '../../lib/api';
import clsx from 'clsx';

const CATEGORIES = ['Tous', 'Politique', 'Économie', 'Sécurité', 'Société', 'Sport', 'Technologie', 'Culture', 'International'];

const IMPORTANCE_COLORS: Record<string, string> = {
  haute:   'badge-red',
  moyenne: 'badge-yellow',
  faible:  'badge-green',
};

export default function NewsPage() {
  const [category, setCategory] = useState('Tous');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR(
    ['news', category, page],
    () => api.getNews({ page, limit: 20, category: category === 'Tous' ? undefined : category })
  );

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Actualités</h1>
            <p className="text-slate-400 mt-1">
              {data ? `${data.pagination.total} articles disponibles` : 'Chargement...'}
            </p>
          </div>
          <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Accueil
          </Link>
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={clsx(
                'whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all',
                category === cat
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-slate-700 rounded mb-3 w-1/3" />
                <div className="h-5 bg-slate-700 rounded mb-2" />
                <div className="h-4 bg-slate-800 rounded mb-1" />
                <div className="h-4 bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.articles.map((article: Article, i: number) => (
              <ArticleCard key={article.id} article={article} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost disabled:opacity-30"
            >
              ← Précédent
            </button>
            <span className="text-slate-400 text-sm">
              Page {page} / {data.pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="btn-ghost disabled:opacity-30"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <div
      className="card p-5 flex flex-col animate-fade-up"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="badge badge-orange">{article.category}</span>
        <span className={IMPORTANCE_COLORS[article.importance]}>
          {article.importance === 'haute' && <TrendingUp className="w-3 h-3 mr-1" />}
          {article.importance}
        </span>
      </div>

      <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2 leading-snug">
        {article.title}
      </h3>

      <p className="text-slate-400 text-sm line-clamp-3 flex-1 mb-4">
        {article.summary}
      </p>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(article.published_at || article.created_at), {
              addSuffix: true, locale: fr
            })}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {article.views}
          </span>
        </div>
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-brand-500 hover:text-brand-600 transition-colors"
        >
          {article.source_name}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {article.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-800">
          {article.hashtags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="text-xs text-slate-500">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
