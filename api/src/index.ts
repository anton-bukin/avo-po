import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import authRouter from './routes/auth.js';
import referencesRouter from './routes/references.js';
import transfersRouter from './routes/transfers.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3100');

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/transfers', transfersRouter);
app.use('/api/v1', referencesRouter);
app.use('/api/v1/admin', adminRouter);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ps-pay-api', version: '1.0.0' });
});

async function start() {
  try {
    await initDB();
    console.log('Database initialized');
    app.listen(PORT, () => {
      console.log(`PS Pay API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
