# Deployment & Vercel Configuration

Verified against actual [`vercel.json`](file:///c:/Users/johnd/Downloads/MainCode/vercel.json), [`backend/server.ts`](file:///c:/Users/johnd/Downloads/MainCode/backend/server.ts), [`api/server.ts`](file:///c:/Users/johnd/Downloads/MainCode/api/server.ts), and [`vite.config.ts`](file:///c:/Users/johnd/Downloads/MainCode/vite.config.ts).

---

## 1. Vercel Configuration

### `vercel.json` (Actual Content)

```json
{
  "version": 2,
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/server" },
    { "source": "/(.*)",       "destination": "/index.html" }
  ]
}
```

### Configuration Explained

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `outputDirectory` | `"dist"` | **Must be explicit**. Prevents Vercel from searching `public/` if framework preset is misconfigured. |
| Rewrite 1 | `/api/:path*` → `/api/server` | All API calls route to the serverless function at `api/server.ts` |
| Rewrite 2 | `/(.*)` → `/index.html` | SPA client-side routing fallback |

---

## 2. Serverless Backend Setup

### `api/server.ts` (Vercel Entrypoint)

```typescript
import app from '../backend/server';
export default app;
```

This file **only** re-exports the Express app. It is the Vercel serverless function that handles all `/api/*` requests.

### `backend/server.ts` (Express App)

```typescript
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', analyzeRouter);

// CRITICAL: app.listen() wrapped in VERCEL guard
if (!process.env.VERCEL) {
  app.listen(PORT, () => { ... });
}

export default app;
```

**Why the VERCEL guard matters**: Vercel's serverless runtime manages its own port binding. If `app.listen()` runs unconditionally, it creates a port collision that silently crashes the function.

---

## 3. Environment Variables

### Required on Vercel Dashboard

| Variable | Purpose |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous key |
| `VITE_GROQ_API_KEY` | Groq API key for primary AI analysis |
| `GEMINI_API_KEY` | Google Gemini API key for fallback AI |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for media & document uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

> **Note**: Vite only exposes `VITE_*` prefixed env vars to the frontend build. `GEMINI_API_KEY` is explicitly passed via `vite.config.ts` `define` block.

---

## 4. Local Development

### Vite Dev Server (`npm run dev`)

Runs **concurrently**:

1. Vite frontend on `http://localhost:3000` (default Vite port)
2. Express backend on `http://localhost:3001`

API proxying in [`vite.config.ts`](file:///c:/Users/johnd/Downloads/MainCode/vite.config.ts):

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

### HMR Control

```typescript
hmr: process.env.DISABLE_HMR !== 'true',
watch: { ignored: ['**/Templates-*/**'] }
```

- HMR can be disabled via `DISABLE_HMR=true` env var (used during AI agent editing sessions)
- Template directories matching `Templates-*` are always excluded from file watching

---

## 5. Build Pipeline

```bash
npm run build   # → vite build → outputs to dist/
```

Vercel runs this automatically. The output is:

```plaintext
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ... (static assets from public/)
```

---

## 6. Common Deployment Gotchas

### 1. The "Redeploy" Trap

**Problem**: User pushes a fix but clicks "Redeploy" in the Vercel dashboard → Vercel re-runs the **same old commit**.  
**Solution**: Push an empty commit to trigger a fresh webhook:

```bash
git commit --allow-empty -m "force vercel update" && git push
```

### 2. Missing `outputDirectory`

**Problem**: If `outputDirectory` is removed from `vercel.json`, Vercel may look for a `public/` directory instead of `dist/`.  
**Solution**: Always keep `"outputDirectory": "dist"` explicitly in `vercel.json`.

### 3. Port Collision

**Problem**: `app.listen()` runs inside Vercel serverless → silent crash.  
**Solution**: The `if (!process.env.VERCEL)` guard is already in place. Never remove it.

### 4. Git Push Protocol

- **Agent NEVER pushes autonomously**
- Agent stages and commits locally
- Agent stops and waits for user authorization code: `/push`

---

## 7. GitHub Repository

| Setting | Value |
| :--- | :--- |
| Remote origin | `https://github.com/s5condlast-cmd/Capstone-2-Official-CloudHosting.git` |
| Branching strategy | Always create feature branches. Never commit directly to `main`. |
