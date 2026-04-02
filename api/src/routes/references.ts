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

export default router;
