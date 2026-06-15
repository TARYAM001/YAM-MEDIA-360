# � YAM-MEDIA 360
## Plateforme d'Information Pilotée par l'IA

**YAM-MEDIA** est la première plateforme médias burkinabè entièrement intelligente, combinant collecte automatisée d'actualités, synthèse IA, publication planifiée et optimisation en temps réel via un chatbot assistant.

> 🌍 Couverture Burkina Faso · Afrique de l'Ouest · International  
> 🤖 Powered by Google Gemini 1.5 Flash  
> 📱 Multi-plateforme : Web · Instagram · TikTok

---

## 🏗️ Architecture Technique

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Frontend** | Next.js 14 + TypeScript + Tailwind | Interface web responsive |
| **Backend** | Express.js + Node.js 24 | API REST + Scheduling + IA |
| **Database** | PostgreSQL 15 | Persistance (articles, analytics, mémoire) |
| **IA/Synthèse** | Google Gemini API | Traitement NLP + génération contenu |
| **Déploiement** | Railway + Vercel | Production scalable |

### Dossiers

```
yam-media-360/
├── frontend/              # Next.js app (port 3000)
│   ├── src/app/          # Pages & layouts
│   ├── src/components/   # Composants réutilisables
│   └── src/lib/api.ts    # Client API TypeScript
├── backend/              # Express API (port 5000)
│   ├── src/routes/       # Endpoints REST
│   ├── src/services/     # Logique métier (IA, RSS, analytics)
│   ├── src/middleware/   # Auth JWT, rate-limiting
│   └── src/config/       # PostgreSQL pool
├── database/
│   └── migrations/       # Schéma initial + tables
└── DEPLOY.md            # Guide production
```

---

## ⚙️ Installation Locale

### Prérequis

- **Node.js** 18+ (testé avec 24.14.0)
- **PostgreSQL** 15+ local ou distant
- **Google Gemini API Key** (gratuit sur [aistudio.google.com](https://aistudio.google.com))
- **Git** pour le versioning

### 1️⃣ Cloner & Configuration Initiale

```bash
git clone https://github.com/ton-org/yam-media-360.git
cd yam-media-360

# Créer les fichiers .env
# Backend
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2️⃣ Backend

```bash
cd backend

# Installer dépendances
npm install

# Configurer .env
# DATABASE_URL=postgresql://user:password@localhost:5432/yam_media
# JWT_SECRET=ta_clé_secrète_forte_32_caractères
# GEMINI_API_KEY=ta_clé_google_gemini
# CORS_ORIGIN=http://localhost:3000
# NODE_ENV=development

# Lancer migrations PostgreSQL
psql $DATABASE_URL -f ../database/migrations/001_init.sql
psql $DATABASE_URL -f ../database/migrations/002_instagram.sql
psql $DATABASE_URL -f ../database/migrations/003_analytics_chatbot.sql

# Compiler TypeScript
npm run build

# Démarrer serveur (mode dev avec watch)
npm run dev

# ✅ Server démarré : http://localhost:5000
# Health check : curl http://localhost:5000/health
```

### 3️⃣ Frontend

```bash
cd frontend

# Installer dépendances
npm install

# Configurer .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Lancer dev server
npm run dev

# ✅ Frontend lancé : http://localhost:3000
```

---

## 🔑 Variables d'Environnement

### Backend (`.env`)

```env
# Service
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/yam_media

# Sécurité
JWT_SECRET=votre_secret_base64_32_caractères_minimum
CORS_ORIGIN=http://localhost:3000

# IA
GEMINI_API_KEY=AIzaSy...

# Optionnel : Instagram & TikTok (simulation par défaut)
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_ACCOUNT_ID=
INSTAGRAM_SIMULATE=true
TIKTOK_ACCESS_TOKEN=
TIKTOK_SIMULATE=true
YAM_MEDIA_DEFAULT_IMAGE_URL=
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 📚 API Endpoints

### 🔐 Authentication

```bash
# Register
POST /api/auth/register
Body: { email, password, name }

# Login
POST /api/auth/login
Body: { email, password }

# Get Profile
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### 📰 News

```bash
# List (paginated)
GET /api/news?page=1&limit=20&category=Politique

# Get Article
GET /api/news/:id

# Update Status (admin)
PATCH /api/news/:id/status
Body: { status: "published" | "rejected" }

# Admin: Pending Articles
GET /api/news/admin/pending
```

### 📊 Stats

```bash
# Dashboard Stats
GET /api/stats
```

### 🔄 Collect

```bash
# Manual collect all RSS sources
POST /api/collect/all

# Collect from one source
POST /api/collect/source
Body: { url, name }

# List RSS sources
GET /api/collect/sources
```

### 🖼️ Instagram

```bash
# Recent posts
GET /api/instagram/posts

# Publication slots info
GET /api/instagram/slots

# Current mode (RÉEL / SIMULATION)
GET /api/instagram/status

# Manual publish
POST /api/instagram/publish-now?slot=0
```

### 💬 Chatbot (YAMI)

```bash
# Send message
POST /api/chatbot/message
Body: { message, session_id? }

# Get history
GET /api/chatbot/history?session_id=&limit=50

# Get schema créatif
GET /api/chatbot/schema

# Update schema
PATCH /api/chatbot/schema
Body: { key, value, reason? }

# View analytics
GET /api/chatbot/analytics?days=30

# Trigger optimization
POST /api/chatbot/optimize
```

---

## 🎯 Fonctionnalités Principales

### ✅ Implémentées

- 📥 **Collecte RSS Automatisée** : 10 sources (Burkina24, Jeune Afrique, BBC, RFI, etc.)
- 🧠 **Synthèse IA** : Gemini crée des posts uniques à partir de plusieurs articles
- ⏰ **Scheduling Intelligent** : 4 créneaux quotidiens optimisés (07h, 12h, 18h, 21h UTC)
- 📱 **Publication Multi-Plateforme** : Instagram + TikTok simultanées
- 📊 **Analytics Temps Réel** : Reach, engagement, engagement rate par slot & catégorie
- 💾 **Mémoire Permanente** : Chatbot retient contexte entre sessions
- 🤖 **Chatbot YAMI** : Assistant IA pour analyse, optimisation, modifications schéma
- 🔐 **Auth JWT** : Sécurisation endpoints avec role-based access (admin/editor/user)
- 🔄 **Optimisation Hebdomadaire** : Cycle IA analyse performances et met à jour stratégie

### 🚧 Phases Futures

- [ ] Notifications Push natives
- [ ] API TikTok réelle (mode simulation actif)
- [ ] Dashboard IA avec recommandations temps réel
- [ ] Intégration WhatsApp Business
- [ ] Modération IA pour commentaires

---

## 🚀 Déploiement Production

Voir [DEPLOY.md](./DEPLOY.md) pour guide complet Railway + Vercel.

**Résumé rapide :**

1. **Backend** : Deploy `backend/` sur [Railway](https://railway.app)
2. **Database** : PostgreSQL managé par Railway
3. **Frontend** : Deploy `frontend/` sur [Vercel](https://vercel.com)
4. Configurer variables d'environnement
5. Exécuter migrations SQL
6. Tester endpoints

---

## 🧪 Tests Rapides

```bash
# Health check
curl http://localhost:5000/health

# Login admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yam-media.bf","password":"Admin@123"}'

# Get news
curl http://localhost:5000/api/news?limit=5

# Trigger collecte manuelle (admin)
curl -X POST http://localhost:5000/api/collect/all \
  -H "Authorization: Bearer <token>"
```

---

## 📄 Licence

MIT · YAM-MEDIA 2025

## 👥 Support

- 📧 Contactez l'équipe YAM-MEDIA pour support technique
- 🐛 Signalez les bugs via GitHub Issues
- 💡 Suggérez des améliorations en Discussions
