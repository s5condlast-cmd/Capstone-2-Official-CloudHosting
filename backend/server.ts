import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRouter from './routes/analyze';
// Cloudinary router preserved in comments for future reactivation/redesign
// import cloudinaryRouter from './routes/cloudinary';
import onedriveRouter from './routes/onedrive';
import authRouter from './routes/auth';

// Load environment variables from CWD .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Restore req.url from req.originalUrl if Vercel edge rewrite modified the path
app.use((req, _res, next) => {
  if (
    req.originalUrl &&
    (req.url === '/api/server' ||
      req.url === '/api/index' ||
      req.url.startsWith('/api/server/') ||
      req.url.startsWith('/api/index/'))
  ) {
    req.url = req.originalUrl;
  }
  next();
});

// Defensive body parsing: handle string payloads from serverless environments
app.use((req, _res, next) => {
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // Keep original string if not valid JSON
    }
  }
  next();
});

// Parse JSON body only if not already pre-parsed by Vercel serverless runtime
app.use((req, res, next) => {
  if (req.body !== undefined && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, (err) => {
    // If request stream was already consumed or ended, gracefully ignore and continue
    if (err && (err.type === 'stream.not.readable' || (err.message && err.message.includes('stream')))) {
      return next();
    }
    next(err);
  });
});

// Mount API routers under both /api and root / for seamless edge routing
app.use('/api', analyzeRouter);
app.use('/api', onedriveRouter);
app.use('/api', authRouter);

app.use('/', analyzeRouter);
app.use('/', onedriveRouter);
app.use('/', authRouter);

// 404 JSON fallback for unmatched API endpoints
app.use((req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}` });
});

// Global JSON error handler (guarantees valid application/json responses in serverless)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Express Server Error]:', err);
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Backend Server] AI Review Assistant backend running on http://localhost:${PORT}`);
  });
}

export default app;

