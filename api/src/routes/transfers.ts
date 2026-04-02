import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getRubToForeignRate } from '../cbr.js';

const router = Router();

const COMMISSION_RATE = 0.015; // 1.5%
const MIN_COMMISSION = 50; // 50 RUB

function calcCommission(amount: number): number {
  return Math.max(amount * COMMISSION_RATE, MIN_COMMISSION);
}

// POST /api/v1/transfers — create transfer
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { directionId, senderCard, senderName, receiverCard, receiverName, receiverPhone, receiverAccount, amountSend } = req.body;

    if (!directionId) {
      res.status(400).json({ error: 'Направление перевода обязательно' });
      return;
    }

    const id = uuidv4();
    const { rows: dirs } = await pool.query('SELECT * FROM directions WHERE id = $1', [directionId]);
    if (dirs.length === 0) {
      res.status(400).json({ error: 'Направление не найдено' });
      return;
    }
    const dir = dirs[0];

    // Find provider for this direction
    const { rows: provs } = await pool.query('SELECT * FROM providers WHERE country = $1 LIMIT 1', [dir.country_to]);
    const providerId = provs.length > 0 ? provs[0].id : null;

    await pool.query(`
      INSERT INTO transfers (id, user_id, direction_id, provider_id, status, sender_card, sender_name, receiver_card, receiver_name, receiver_phone, receiver_account, amount_send, currency_from, currency_to)
      VALUES ($1, $2, $3, $4, 'CREATED', $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [id, req.userId, directionId, providerId, senderCard || null, senderName || null, receiverCard || null, receiverName || null, receiverPhone || null, receiverAccount || null, amountSend || null, dir.currency_from, dir.currency_to]);

    const { rows } = await pool.query('SELECT * FROM transfers WHERE id = $1', [id]);
    res.status(201).json(formatTransfer(rows[0]));
  } catch (err) {
    console.error('Create transfer error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/v1/transfers/:id/calculate
router.post('/:id/calculate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amountSend } = req.body;

    const { rows } = await pool.query('SELECT * FROM transfers WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Перевод не найден' });
      return;
    }

    const transfer = rows[0];
    const amount = parseFloat(amountSend || transfer.amount_send);
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Укажите сумму перевода' });
      return;
    }

    // Get margin from direction
    const { rows: dirRows } = await pool.query('SELECT margin_percent FROM directions WHERE id = $1', [transfer.direction_id]);
    const margin = dirRows.length > 0 ? parseFloat(dirRows[0].margin_percent) || 0 : 0;

    // Get real CBR rate with margin
    const cbrRate = await getRubToForeignRate(transfer.currency_to, margin);
    const rate = cbrRate || 1;
    const commission = calcCommission(amount);
    const totalDebit = amount + commission;
    const amountReceive = Math.round(amount * rate * 100) / 100;

    await pool.query(`
      UPDATE transfers SET amount_send = $1, amount_receive = $2, exchange_rate = $3, commission = $4, total_debit = $5
      WHERE id = $6
    `, [amount, amountReceive, rate, commission, totalDebit, id]);

    const { rows: updated } = await pool.query('SELECT * FROM transfers WHERE id = $1', [id]);
    res.json(formatTransfer(updated[0]));
  } catch (err) {
    console.error('Calculate error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/v1/transfers/:id/confirm
router.post('/:id/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query('SELECT * FROM transfers WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Перевод не найден' });
      return;
    }

    const transfer = rows[0];
    if (transfer.status !== 'CREATED') {
      res.status(400).json({ error: `Перевод в статусе ${transfer.status}, подтверждение невозможно` });
      return;
    }

    if (!transfer.amount_send || !transfer.commission) {
      res.status(400).json({ error: 'Сначала выполните расчёт параметров перевода' });
      return;
    }

    // Stub: card debit
    console.log(`[STUB] Списание ${transfer.total_debit} ${transfer.currency_from} с карты ${transfer.sender_card}`);

    // Set to PROCESSING
    await pool.query(
      `UPDATE transfers SET status = 'PROCESSING', confirmed_at = NOW() WHERE id = $1`,
      [id]
    );

    // Stub: send to partner API
    console.log(`[STUB] Отправка платёжного поручения партнёру provider_id=${transfer.provider_id}`);

    // Simulate async completion (2-5 seconds)
    const delay = 2000 + Math.random() * 3000;
    setTimeout(async () => {
      try {
        // 90% success, 10% failure
        const success = Math.random() > 0.1;
        if (success) {
          await pool.query(
            `UPDATE transfers SET status = 'COMPLETED', completed_at = NOW() WHERE id = $1`,
            [id]
          );
          console.log(`[STUB] Перевод ${id} завершён успешно`);
        } else {
          await pool.query(
            `UPDATE transfers SET status = 'FAILED', error_message = 'Ошибка на стороне партнёра' WHERE id = $1`,
            [id]
          );
          console.log(`[STUB] Перевод ${id} завершён с ошибкой`);
        }
      } catch (e) {
        console.error('Async status update error:', e);
      }
    }, delay);

    const { rows: updated } = await pool.query('SELECT * FROM transfers WHERE id = $1', [id]);
    res.json(formatTransfer(updated[0]));
  } catch (err) {
    console.error('Confirm error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/v1/transfers/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query('SELECT * FROM transfers WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (rows.length === 0) {
    res.status(404).json({ error: 'Перевод не найден' });
    return;
  }
  res.json(formatTransfer(rows[0]));
});

// GET /api/v1/transfers
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    `SELECT t.*, d.name as direction_name FROM transfers t
     LEFT JOIN directions d ON t.direction_id = d.id
     WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT 100`,
    [req.userId]
  );
  res.json(rows.map(formatTransfer));
});

function formatTransfer(row: any) {
  return {
    id: row.id,
    status: row.status,
    directionId: row.direction_id,
    directionName: row.direction_name || null,
    providerId: row.provider_id,
    senderCard: row.sender_card,
    senderName: row.sender_name,
    receiverCard: row.receiver_card,
    receiverName: row.receiver_name,
    receiverPhone: row.receiver_phone,
    receiverAccount: row.receiver_account,
    amountSend: row.amount_send ? parseFloat(row.amount_send) : null,
    amountReceive: row.amount_receive ? parseFloat(row.amount_receive) : null,
    currencyFrom: row.currency_from,
    currencyTo: row.currency_to,
    exchangeRate: row.exchange_rate ? parseFloat(row.exchange_rate) : null,
    commission: row.commission ? parseFloat(row.commission) : null,
    totalDebit: row.total_debit ? parseFloat(row.total_debit) : null,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message,
  };
}

export default router;
