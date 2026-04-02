import { Router, Response } from 'express';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getAllCBRRates, getRubToForeignRate } from '../cbr.js';

const router = Router();

// Admin check: user id = 1 (demo user) is admin. In prod — role-based.
function isAdmin(req: AuthRequest): boolean {
  return req.userId === 1;
}

function requireAdmin(req: AuthRequest, res: Response): boolean {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return false;
  }
  return true;
}

// GET /api/v1/admin/users
router.get('/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const { rows } = await pool.query(`
    SELECT u.id, u.email, u.full_name, u.created_at,
      (SELECT count(*) FROM transfers t WHERE t.user_id = u.id) as transfer_count,
      (SELECT coalesce(sum(t.amount_send), 0) FROM transfers t WHERE t.user_id = u.id AND t.status = 'COMPLETED') as total_sent
    FROM users u ORDER BY u.created_at DESC
  `);

  res.json(rows.map(r => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    createdAt: r.created_at,
    transferCount: parseInt(r.transfer_count),
    totalSent: parseFloat(r.total_sent),
  })));
});

// GET /api/v1/admin/transfers?status=&userId=&limit=&offset=
router.get('/transfers', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const { status, userId, limit = '100', offset = '0' } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (status) {
    conditions.push(`t.status = $${idx++}`);
    params.push(status);
  }
  if (userId) {
    conditions.push(`t.user_id = $${idx++}`);
    params.push(parseInt(userId as string));
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  // Count
  const countRes = await pool.query(`SELECT count(*) as c FROM transfers t ${where}`, params);
  const total = parseInt(countRes.rows[0].c);

  // Data
  params.push(parseInt(limit as string), parseInt(offset as string));
  const { rows } = await pool.query(`
    SELECT t.*, d.name as direction_name, u.email as user_email, u.full_name as user_name
    FROM transfers t
    LEFT JOIN directions d ON t.direction_id = d.id
    LEFT JOIN users u ON t.user_id = u.id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `, params);

  res.json({
    total,
    transfers: rows.map(r => ({
      id: r.id,
      status: r.status,
      directionName: r.direction_name,
      userEmail: r.user_email,
      userName: r.user_name,
      userId: r.user_id,
      senderCard: r.sender_card,
      senderName: r.sender_name,
      receiverCard: r.receiver_card,
      receiverName: r.receiver_name,
      receiverPhone: r.receiver_phone,
      amountSend: r.amount_send ? parseFloat(r.amount_send) : null,
      amountReceive: r.amount_receive ? parseFloat(r.amount_receive) : null,
      currencyFrom: r.currency_from,
      currencyTo: r.currency_to,
      exchangeRate: r.exchange_rate ? parseFloat(r.exchange_rate) : null,
      commission: r.commission ? parseFloat(r.commission) : null,
      totalDebit: r.total_debit ? parseFloat(r.total_debit) : null,
      createdAt: r.created_at,
      confirmedAt: r.confirmed_at,
      completedAt: r.completed_at,
      errorMessage: r.error_message,
    })),
  });
});

// GET /api/v1/admin/transfers/export — CSV
router.get('/transfers/export', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const { status, userId } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
  if (userId) { conditions.push(`t.user_id = $${idx++}`); params.push(parseInt(userId as string)); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const { rows } = await pool.query(`
    SELECT t.*, d.name as direction_name, u.email as user_email, u.full_name as user_name
    FROM transfers t
    LEFT JOIN directions d ON t.direction_id = d.id
    LEFT JOIN users u ON t.user_id = u.id
    ${where}
    ORDER BY t.created_at DESC
  `, params);

  // Build CSV
  const header = 'ID,Статус,Направление,Пользователь,Email,Карта отправителя,Имя отправителя,Карта получателя,Имя получателя,Телефон получателя,Сумма отправки,Валюта отправки,Сумма получения,Валюта получения,Курс,Комиссия,Итого списано,Создан,Подтверждён,Завершён,Ошибка';

  const csvRows = rows.map(r => {
    const fields = [
      r.id,
      r.status,
      r.direction_name || '',
      r.user_name || '',
      r.user_email || '',
      r.sender_card || '',
      r.sender_name || '',
      r.receiver_card || '',
      r.receiver_name || '',
      r.receiver_phone || '',
      r.amount_send || '',
      r.currency_from || '',
      r.amount_receive || '',
      r.currency_to || '',
      r.exchange_rate || '',
      r.commission || '',
      r.total_debit || '',
      r.created_at ? new Date(r.created_at).toISOString() : '',
      r.confirmed_at ? new Date(r.confirmed_at).toISOString() : '',
      r.completed_at ? new Date(r.completed_at).toISOString() : '',
      r.error_message || '',
    ];
    return fields.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',');
  });

  const csv = '\uFEFF' + header + '\n' + csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="transfers_${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

// GET /api/v1/admin/stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const [usersRes, transfersRes, statusRes, volumeRes] = await Promise.all([
    pool.query('SELECT count(*) as c FROM users'),
    pool.query('SELECT count(*) as c FROM transfers'),
    pool.query(`SELECT status, count(*) as c FROM transfers GROUP BY status`),
    pool.query(`SELECT coalesce(sum(amount_send), 0) as total FROM transfers WHERE status = 'COMPLETED'`),
  ]);

  const byStatus: Record<string, number> = {};
  statusRes.rows.forEach((r: any) => { byStatus[r.status] = parseInt(r.c); });

  res.json({
    totalUsers: parseInt(usersRes.rows[0].c),
    totalTransfers: parseInt(transfersRes.rows[0].c),
    transfersByStatus: byStatus,
    totalVolume: parseFloat(volumeRes.rows[0].total),
  });
});

// GET /api/v1/admin/directions — all directions with CBR rates and margins
router.get('/directions', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const { rows } = await pool.query(`
    SELECT d.*, c.name as country_to_name, c.flag as country_to_flag
    FROM directions d
    LEFT JOIN countries c ON d.country_to = c.code
    ORDER BY d.id
  `);

  const { rates: cbrRates, date: cbrDate } = await getAllCBRRates();

  const result = await Promise.all(rows.map(async (d: any) => {
    const cbrRate = cbrRates[d.currency_to];
    const margin = parseFloat(d.margin_percent) || 0;
    const effectiveRate = await getRubToForeignRate(d.currency_to, margin);

    return {
      id: d.id,
      code: d.code,
      name: d.name,
      countryFrom: d.country_from,
      countryTo: d.country_to,
      countryToName: d.country_to_name,
      countryToFlag: d.country_to_flag,
      currencyFrom: d.currency_from,
      currencyTo: d.currency_to,
      marginPercent: margin,
      commissionPercent: parseFloat(d.commission_percent) ?? 1.5,
      minCommission: parseFloat(d.min_commission) ?? 50,
      isActive: d.is_active,
      cbrRate: cbrRate ? (1 / cbrRate.value) : null,
      effectiveRate: effectiveRate,
      cbrRateName: cbrRate?.name || null,
    };
  }));

  res.json({ directions: result, cbrDate });
});

// PATCH /api/v1/admin/directions/:id — update margin or active status
router.patch('/directions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  const { id } = req.params;
  const { marginPercent, commissionPercent, minCommission, isActive } = req.body;

  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (marginPercent !== undefined) {
    const margin = parseFloat(marginPercent);
    if (isNaN(margin) || margin < -50 || margin > 50) {
      res.status(400).json({ error: 'Маржа должна быть от -50% до 50%' });
      return;
    }
    updates.push(`margin_percent = $${idx++}`);
    params.push(margin);
  }

  if (commissionPercent !== undefined) {
    const cp = parseFloat(commissionPercent);
    if (isNaN(cp) || cp < 0 || cp > 30) {
      res.status(400).json({ error: 'Комиссия должна быть от 0% до 30%' });
      return;
    }
    updates.push(`commission_percent = $${idx++}`);
    params.push(cp);
  }

  if (minCommission !== undefined) {
    const mc = parseFloat(minCommission);
    if (isNaN(mc) || mc < 0) {
      res.status(400).json({ error: 'Мин. комиссия не может быть отрицательной' });
      return;
    }
    updates.push(`min_commission = $${idx++}`);
    params.push(mc);
  }

  if (isActive !== undefined) {
    updates.push(`is_active = $${idx++}`);
    params.push(!!isActive);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'Нет данных для обновления' });
    return;
  }

  params.push(parseInt(id));
  await pool.query(`UPDATE directions SET ${updates.join(', ')} WHERE id = $${idx}`, params);

  res.json({ ok: true });
});

export default router;
