import app from '../backend/server';

// Disable Vercel's automatic body parser so Express can parse the incoming stream reliably
export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;
