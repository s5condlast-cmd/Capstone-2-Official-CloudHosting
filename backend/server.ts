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
app.use(express.json());

// Mount the API Routers
app.use('/api', analyzeRouter);
// app.use('/api', cloudinaryRouter); // Cloudinary file storage (preserved for future use)
app.use('/api', onedriveRouter);
app.use('/api', authRouter);

// 404 JSON fallback for unmatched API endpoints
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global JSON error handler (prevents HTML error output in serverless runtime)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Express Server Error]:', err);
  if (!res.headersSent) {
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

