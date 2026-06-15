/**
 * YAM Media — Client API
 * Note : token JWT en localStorage. En production renforcée, privilégier httpOnly cookies.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'yam_token';

class ApiClient {
  private token: string | null = null;

  setToken(t: string) {
    this.token = t;
    if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, t);
  }
  getToken(): string | null {
    if (this.token) return this.token;
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
  }

  private async req<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(opts.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  login(email: string, password: string) {
    return this.req<{ token: string; user: User }>('/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) });
  }
  me()       { return this.req<{ user: User }>('/api/auth/me'); }
  getNews(p?: { page?:number; limit?:number; category?:string }) {
    const qs = p ? new URLSearchParams(p as Record<string,string>).toString() : '';
    return this.req<NewsResponse>(`/api/news${qs ? `?${qs}` : ''}`);
  }
  getArticle(id: number) { return this.req<Article>(`/api/news/${id}`); }
  updateStatus(id: number, status: string) {
    return this.req(`/api/news/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }
  getPending()  { return this.req<Article[]>('/api/news/admin/pending'); }
  getStats()    { return this.req<StatsData>('/api/stats'); }
  collectAll()  { return this.req('/api/collect/all', { method: 'POST' }); }
  getSources()  { return this.req<RssSource[]>('/api/collect/sources'); }
  
  // Instagram endpoints
  getInstagramPosts()  { return this.req<InstagramPost[]>('/api/instagram/posts'); }
  publishNow(slot: number) { 
    return this.req('/api/instagram/publish-now', { 
      method: 'POST',
      body: JSON.stringify({ slot })
    }); 
  }
  getInstagramStatus() { return this.req<InstagramStatus>('/api/instagram/status'); }
}

export const api = new ApiClient();

export interface User     { id:number; email:string; name:string; role:string }
export interface Article  {
  id:number; title:string; summary:string; source_url:string; source_name:string;
  category:string; hashtags:string[]; importance:'haute'|'moyenne'|'faible';
  status:'pending'|'published'|'rejected'; views:number; published_at:string; created_at:string;
}
export interface NewsResponse { articles:Article[]; pagination:{page:number;limit:number;total:number;pages:number} }
export interface StatsData {
  totals:{total:string;published:string;pending:string;rejected:string};
  byCategory:{category:string;count:string}[];
  recentActivity:{date:string;articles:string}[];
  topViewed:{id:number;title:string;views:number;category:string}[];
}
export interface RssSource { name:string; url:string; category:string }
export interface InstagramPost {
  id: number;
  caption: string;
  article_ids: number[];
  ig_post_id: string | null;
  simulation: boolean;
  scheduled_slot: string;
  published_at: string;
}
export interface InstagramSlot {
  emoji: string;
  label: string;
  time: string;
}
export interface InstagramStatus {
  mode: 'RÉEL' | 'SIMULATION';
  accountConfigured: boolean;
  slots: InstagramSlot[];
}
