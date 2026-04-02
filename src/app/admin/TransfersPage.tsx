import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';

interface AdminTransfer {
  id: string;
  status: string;
  directionName: string;
  userEmail: string;
  userName: string;
  userId: number;
  senderCard: string;
  senderName: string;
  receiverCard: string;
  receiverName: string;
  receiverPhone: string;
  amountSend: number | null;
  amountReceive: number | null;
  currencyFrom: string;
  currencyTo: string;
  exchangeRate: number | null;
  commission: number | null;
  totalDebit: number | null;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

export default function TransfersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transfers, setTransfers] = useState<AdminTransfer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const statusFilter = searchParams.get('status') || '';
  const userIdFilter = searchParams.get('userId') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    api.adminGetTransfers({
      status: statusFilter || undefined,
      userId: userIdFilter || undefined,
      limit,
      offset: (page - 1) * limit,
    }).then(data => {
      setTransfers(data.transfers);
      setTotal(data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [statusFilter, userIdFilter, page]);

  const setFilter = (key: string, val: string) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (p > 1) params.set('page', String(p)); else params.delete('page');
    setSearchParams(params);
  };

  const handleExport = () => {
    const token = localStorage.getItem('pspay_token');
    const url = api.adminExportUrl({
      status: statusFilter || undefined,
      userId: userIdFilter || undefined,
    });
    // Fetch with auth and trigger download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `transfers_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0 }}>Операции ({total})</h1>
        <button className="btn btn-primary btn-sm" onClick={handleExport}>
          Выгрузить CSV
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0, flex: '0 0 auto' }}>
            <label style={{ marginBottom: '0.2rem' }}>Статус</label>
            <select value={statusFilter} onChange={e => setFilter('status', e.target.value)} style={{ width: 160 }}>
              <option value="">Все</option>
              <option value="CREATED">CREATED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '0 0 auto' }}>
            <label style={{ marginBottom: '0.2rem' }}>User ID</label>
            <input
              value={userIdFilter}
              onChange={e => setFilter('userId', e.target.value.replace(/\D/g, ''))}
              placeholder="Все"
              style={{ width: 100 }}
            />
          </div>
          {(statusFilter || userIdFilter) && (
            <button className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-end' }} onClick={() => setSearchParams({})}>
              Сбросить
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-card">Загрузка...</div>
      ) : transfers.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '2rem', color: '#a0aec0' }}>
          Нет операций
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Пользователь</th>
                  <th>Направление</th>
                  <th>Сумма</th>
                  <th>Получение</th>
                  <th>Комиссия</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <>
                    <tr key={t.id} onClick={() => setExpanded(expanded === t.id ? null : t.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{formatDate(t.createdAt)}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '0.82rem' }}>{t.userName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#a0aec0' }}>{t.userEmail}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{t.directionName || '—'}</td>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {t.amountSend ? `${t.amountSend.toLocaleString('ru-RU')} ${t.currencyFrom}` : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {t.amountReceive ? `${t.amountReceive.toLocaleString('ru-RU')} ${t.currencyTo}` : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {t.commission ? `${t.commission.toLocaleString('ru-RU')} ${t.currencyFrom}` : '—'}
                      </td>
                      <td><span className={`status-badge status-${t.status}`}>{t.status}</span></td>
                    </tr>
                    {expanded === t.id && (
                      <tr key={t.id + '-detail'}>
                        <td colSpan={7} style={{ background: '#f7fafc', padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                            <div><strong>ID:</strong> {t.id}</div>
                            <div><strong>Курс:</strong> {t.exchangeRate || '—'}</div>
                            <div><strong>Карта отпр.:</strong> {t.senderCard || '—'}</div>
                            <div><strong>Имя отпр.:</strong> {t.senderName || '—'}</div>
                            <div><strong>Карта получ.:</strong> {t.receiverCard || '—'}</div>
                            <div><strong>Имя получ.:</strong> {t.receiverName || '—'}</div>
                            <div><strong>Тел. получ.:</strong> {t.receiverPhone || '—'}</div>
                            <div><strong>Итого списано:</strong> {t.totalDebit ? `${t.totalDebit.toLocaleString('ru-RU')} ${t.currencyFrom}` : '—'}</div>
                            <div><strong>Подтверждён:</strong> {formatDate(t.confirmedAt)}</div>
                            <div><strong>Завершён:</strong> {formatDate(t.completedAt)}</div>
                            {t.errorMessage && (
                              <div style={{ gridColumn: '1 / -1', color: '#e53e3e' }}><strong>Ошибка:</strong> {t.errorMessage}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', marginTop: '1rem' }}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            &larr;
          </button>
          <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>{page} / {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
