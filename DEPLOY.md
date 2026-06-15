# 🚀 Guide Déploiement Production – YAM-MEDIA 360

**Plateforme complète backend (Railway) + frontend (Vercel) + PostgreSQL**

---

## 📋 Prérequis

1. **Comptes créés :**
   - [GitHub.com](https://github.com) – repos publics
   - [Railway.app](https://railway.app) – backend + DB
   - [Vercel.com](https://vercel.com) – frontend
   - [Google Cloud Console](https://console.cloud.google.com) – Gemini API

2. **Clés & tokens :**
   - Google Gemini API Key (gratuit 60 requests/min)
   - JWT_SECRET généré : `openssl rand -base64 32`

3. **Outils locaux (dev machine) :**
   - Git
   - Node.js 18+
   - PostgreSQL client (pour migrations)

---

## Phase 1 : Repository GitHub

### 1.1 Créer le repo public

1. Aller sur [github.com/new](https://github.com/new)
2. Nom : `yam-media-360`
3. Public · Initialize with no files

### 1.2 Pousser le code

```bash
cd yam-media-360

# Ajouter remote
git remote add origin https://github.com/YOUR_USERNAME/yam-media-360.git

# Commit initial
git add .
git commit -m "feat: YAM-MEDIA 360 – Platform complete"

# Push
git branch -M main
git push -u origin main

# ✅ Repo live : https://github.com/YOUR_USERNAME/yam-media-360
```

---

## Phase 2 : Backend sur Railway

### 2.1 Créer compte & projet Railway

1. Aller sur [railway.app](https://railway.app) → Sign up (GitHub OAuth)
2. Créer nouveau **Project**
3. Ajouter service **PostgreSQL** (créé automatiquement)

### 2.2 Connecter GitHub repo

1. **Railway Dashboard** → New → GitHub Repo
2. Sélectionner `yam-media-360` → Connect
3. Choisir branche `main`
4. **Root Directory** : `backend` (important !)
5. Deploy

Railway crée automatiquement :
- Service backend Node.js
- Variable `DATABASE_URL` pointant vers PostgreSQL

### 2.3 Configurer Variables d'Environnement

1. **Railway Dashboard** → Project → Backend Service → Variables
2. Ajouter :

```env
PORT=5000
NODE_ENV=production

# JWT (générer avec : openssl rand -base64 32)
JWT_SECRET=VOTRE_CLE_BASE64_32_CARACTERES

# Gemini API
GEMINI_API_KEY=AIzaSyXXXXXXXXXX...

# Vercel URL sera connue après déploiement frontend
# Pour l'instant, laisser localhost ou à venir
CORS_ORIGIN=http://localhost:3000

# Optionnel : Instagram/TikTok (simulation par défaut)
INSTAGRAM_SIMULATE=true
TIKTOK_SIMULATE=true
```

**Note :** `DATABASE_URL` est créé automatiquement par Railway.

### 2.4 Exécuter Migrations SQL

Depuis votre machine locale :

```bash
# Récupérer DATABASE_URL de Railway Dashboard
export DATABASE_URL="postgresql://..."

# Exécuter migrations (dans cet ordre)
psql $DATABASE_URL -f database/migrations/001_init.sql
psql $DATABASE_URL -f database/migrations/002_instagram.sql
psql $DATABASE_URL -f database/migrations/003_analytics_chatbot.sql

# Vérifier
psql $DATABASE_URL -c "SELECT count(*) FROM users;"
# Doit retourner : 1 (user admin)
```

### 2.5 Attendre le déploiement

1. Railway buildé et deploye automatiquement
2. Clic sur **Deployments** pour voir logs
3. Une fois done, obtenir URL publique : `https://yam-media-backend-XXXX.up.railway.app`

### 2.6 Tester Backend

```bash
# Health check
curl https://yam-media-backend-XXXX.up.railway.app/health

# Devrait retourner :
# {"status":"ok","app":"YAM Media API","timestamp":"2025-06-15T..."}

# Test login
curl -X POST https://yam-media-backend-XXXX.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yam-media.bf","password":"Admin@123"}'

# Devrait retourner JWT token
```

---

## Phase 3 : Frontend sur Vercel

### 3.1 Connecter GitHub à Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. **Add New Project** → Import Git Repository
4. Trouver `yam-media-360` dans la liste

### 3.2 Configurer projet Next.js

**Import Settings :**
- **Framework Preset** : Next.js (auto-détecté)
- **Root Directory** : `frontend`
- **Build Command** : `next build` (par défaut)
- **Output Directory** : `.next` (par défaut)

### 3.3 Ajouter Variables d'Environnement

1. **Project Settings** → Environment Variables
2. Ajouter :

```env
NEXT_PUBLIC_API_URL=https://yam-media-backend-XXXX.up.railway.app
```

(Remplacer `XXXX` par URL Railway réelle)

### 3.4 Deploy

Clic **Deploy** → Vercel buildé et déploie automatiquement

Obtenir URL Vercel : `https://yam-media-XXXXX.vercel.app`

---

## Phase 4 : Synchroniser URLs Backend ↔ Frontend

### 4.1 Mettre à jour CORS_ORIGIN

Maintenant que Vercel URL est connue :

1. **Railway Dashboard** → Backend → Variables
2. Modifier `CORS_ORIGIN` :

```env
CORS_ORIGIN=https://yam-media-XXXXX.vercel.app
```

3. **Redeploy** automatiquement (ou manuellement via Railway)

---

## 🧪 Tests Production

```bash
# 1. Health backend
curl https://yam-media-backend-XXXX.up.railway.app/health

# 2. Login
TOKEN=$(curl -s -X POST https://yam-media-backend-XXXX.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yam-media.bf","password":"Admin@123"}' \
  | jq -r '.token')

# 3. Récupérer news
curl -H "Authorization: Bearer $TOKEN" \
  https://yam-media-backend-XXXX.up.railway.app/api/news

# 4. Accéder frontend
# Aller sur https://yam-media-XXXXX.vercel.app
# Vérifier que la page charge et API calls fonctionnent
```

---

## 🔧 Maintenance & Troubleshooting

### Redéployer manuellement

**Backend (Railway) :**
- Push un commit sur `main`
- Railway redéploie automatiquement

**Frontend (Vercel) :**
- Push un commit sur `main`
- Vercel redéploie automatiquement

### Voir les logs

**Railway :**
- Dashboard → Deployment → View Logs

**Vercel :**
- Dashboard → Deployments → Click deployment → Logs

### Réinitialiser base de données

```bash
# ⚠️ DANGEREUX - Supprime tout
psql $DATABASE_URL -f database/migrations/001_init.sql

# Ou via Railway CLI :
railway db reset
```

### Changer variables d'env

**Railway :**
1. Dashboard → Variables
2. Éditer & Save
3. Redeploy (auto ou manual)

**Vercel :**
1. Project Settings → Environment Variables
2. Éditer
3. Redeploy (auto ou manual)

---

## 📊 Endpoints Production Finaux

| Endpoint | URL |
|----------|-----|
| **API Base** | `https://yam-media-backend-XXX.up.railway.app` |
| **Health** | `/health` |
| **Frontend** | `https://yam-media-XXX.vercel.app` |
| **Auth** | `/api/auth/login`, `/api/auth/register` |
| **News** | `/api/news` |
| **Stats** | `/api/stats` |
| **Chatbot** | `/api/chatbot/message` |
| **Instagram** | `/api/instagram/posts` |

---

## 🔒 Sécurité Production

### Checklist

- ✅ JWT_SECRET = chaîne base64 32+ caractères (généré avec `openssl`)
- ✅ CORS_ORIGIN = URL Vercel exacte (HTTPS)
- ✅ NODE_ENV = `production`
- ✅ Migrations SQL exécutées
- ✅ Admin account : email=`admin@yam-media.bf`, password=`Admin@123` (CHANGER EN PROD)
- ✅ PostgreSQL SSL enabled (Railway par défaut)

### Après déploiement

1. **Changer mot de passe admin :**

```bash
# Via base de données
psql $DATABASE_URL -c "
UPDATE users SET password_hash='\$2a\$12\$NOUVEAU_HASH_BCRYPT'
WHERE email='admin@yam-media.bf';
"
```

(Générer hash bcrypt avec `npm bcryptjs` ou outil en ligne)

2. **Tester rate-limiting :**

```bash
# 10 login attempts dans 15 min → blocked
for i in {1..12}; do
  curl -X POST https://yam-media-backend-XXX.up.railway.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.bf","password":"wrong"}'
done
```

3. **Vérifier logs pour anomalies :**
   - Railway : Deployment Logs
   - PostgreSQL : Requêtes erronées

---

## 📈 Scaling & Monitoring

### Railway Monitoring

Dashboard → Metrics
- CPU, Memory, Network
- Deploy logs

### Vercel Analytics

Project → Analytics
- Page Performance
- Web Vitals
- Deployment timeline

### Database Monitoring

Railway → PostgreSQL → Metrics
- Connections
- Storage
- Query performance

---

## 🆘 Erreurs Courants & Solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `CORS error` | Frontend URL non dans CORS_ORIGIN | Mettre à jour Railway CORS_ORIGIN |
| `401 Unauthorized` | JWT_SECRET different dev/prod | Vérifier JWT_SECRET Railway |
| `Cannot find module` | node_modules non installed | Railway auto-install, vérifier logs |
| `Database connection` | DATABASE_URL incorrect ou DB down | Vérifier Railway PostgreSQL status |
| `401 Gemini API` | GEMINI_API_KEY invalid | Renouveler clé sur console.cloud.google.com |

---

## 🎯 Prochaines Étapes

1. **Configurer domain custom :**
   - Vercel : Project Settings → Domains
   - Railway : Custom Domain (plan payant)

2. **Ajouter credentials Instagram/TikTok :**
   - Obtenir tokens depuis Meta/ByteDance
   - Ajouter variables Railway
   - Changer INSTAGRAM_SIMULATE/TIKTOK_SIMULATE = false

3. **Monitoring & alertes :**
   - Railway uptime monitoring
   - Email alerts panne

4. **Backups database :**
   - Railway : Automated backups quotidiens
   - Exporter dumps périodiquement

---

## 💬 Support & Documentation

- 📖 Voir [README.md](./README.md) pour architecture & API
- 🐛 Signaler les bugs via GitHub Issues
- 💡 Suggestions d'améliorations en Discussions

**✅ YAM-MEDIA 360 est maintenant en production !**
