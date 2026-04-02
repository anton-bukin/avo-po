import { Router, Response } from 'express';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

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

// GET /api/v1/rates — exchange rates and commission info for client calculator
router.get('/rates', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const rates: Record<string, number> = {
    UZS: 140.5,
    TJS: 0.122,
    KGS: 0.97,
    KZT: 5.28,
    AZN: 0.0196,
    GEL: 0.031,
    TRY: 0.394,
    CNY: 0.0835,
    AMD: 4.45,
  };
  res.json({ rates, commissionRate: 0.015, minCommission: 50 });
});

export default router;
