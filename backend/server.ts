import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRouter from './routes/analyze';

// Load environment variables from CWD .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount the API Router
app.use('/api', analyzeRouter);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Backend Server] AI Review Assistant backend running on http://localhost:${PORT}`);
  });
}

export default app;
