import { Router, Response } from 'express';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getRubToForeignRate, getCacheDate } from '../cbr.js';

const router = Router();

// GET /api/v1/directions
router.get('/directions', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const { rows } = await pool.query('SELECT * FROM directions WHERE is_active = true ORDER BY id');
  res.json(rows);
});

// GET /api/v1/countries
router.get('/countries', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const { rows } = await pool.query('SELECT * FROM countries ORDER BY name');
  res.json(rows);
});

// GET /api/v1/providers
router.get('/providers', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const { rows } = await pool.query('SELECT * FROM providers WHERE is_active = true ORDER BY name');
  res.json(rows);
});

// GET /api/v1/payment-methods
router.get('/payment-methods', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const { rows } = await pool.query('SELECT * FROM payment_methods WHERE is_active = true ORDER BY id');
  res.json(rows);
});

// GET /api/v1/rates — exchange rates from CBR with margins applied
router.get('/rates', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const { rows: dirs } = await pool.query('SELECT currency_to, margin_percent FROM directions WHERE is_active = true');

    const rates: Record<string, number> = {};
    for (const dir of dirs) {
      const currency = dir.currency_to;
      if (rates[currency]) continue; // already fetched
      const margin = parseFloat(dir.margin_percent) || 0;
      const rate = await getRubToForeignRate(currency, margin);
      if (rate !== null) {
        rates[currency] = rate;
      }
    }

    res.json({
      rates,
      commissionRate: 0.015,
      minCommission: 50,
      cbrDate: getCacheDate(),
    });
  } catch (err) {
    console.error('Rates error:', err);
    res.status(500).json({ error: 'Ошибка получения курсов' });
  }
});

export default router;
