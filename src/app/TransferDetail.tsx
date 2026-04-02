import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from './api';

export default function TransferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getTransfer(id).then(t => { setTransfer(t); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!transfer || transfer.status !== 'PROCESSING') return;
    const interval = setInterval(async () => {
      try {
        const updated = await api.getTransfer(transfer.id);
        setTransfer(updated);
        if (updated.status !== 'PROCESSING') clearInterval(interval);
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [transfer?.status]);

  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('ru-RU');
  };

  if (loading) return <div className="pspay-card"><p>Загрузка...</p></div>;
  if (!transfer) return <div className="pspay-card"><p>Перевод не найден</p></div>;

  return (
    <div>
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/avo-po/app')} style={{ marginBottom: '1rem' }}>
        &larr; К списку
      </button>

      <div className="pspay-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Детали перевода</h2>
          <span className={`status-badge status-${transfer.status}`}>{transfer.status}</span>
        </div>

        {transfer.errorMessage && <div className="error-msg">{transfer.errorMessage}</div>}

        <div className="calc-result">
          <div className="calc-row">
            <span className="calc-row-label">Сумма отправки</span>
            <span className="calc-row-value">{transfer.amountSend?.toLocaleString()} {transfer.currencyFrom}</span>
          </div>
          {transfer.exchangeRate && (
            <div className="calc-row">
              <span className="calc-row-label">Курс</span>
              <span className="calc-row-value">1 {transfer.currencyFrom} = {transfer.exchangeRate} {transfer.currencyTo}</span>
            </div>
          )}
          {transfer.amountReceive && (
            <div className="calc-row">
              <span className="calc-row-label">Сумма получения</span>
              <span className="calc-row-value">{transfer.amountReceive?.toLocaleString()} {transfer.currencyTo}</span>
            </div>
          )}
          {transfer.commission && (
            <div className="calc-row">
              <span className="calc-row-label">Комиссия</span>
              <span className="calc-row-value">{transfer.commission?.toLocaleString()} {transfer.currencyFrom}</span>
            </div>
          )}
          {transfer.totalDebit && (
            <div className="calc-row calc-row-total">
              <span className="calc-row-label">Итого списано</span>
              <span className="calc-row-value">{transfer.totalDebit?.toLocaleString()} {transfer.currencyFrom}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pspay-card">
        <h3>Отправитель</h3>
        <div className="calc-result">
          <div className="calc-row">
            <span className="calc-row-label">Имя</span>
            <span className="calc-row-value">{transfer.senderName || '—'}</span>
          </div>
          <div className="calc-row">
            <span className="calc-row-label">Карта</span>
            <span className="calc-row-value">{transfer.senderCard || '—'}</span>
          </div>
        </div>
      </div>

      <div className="pspay-card">
        <h3>Получатель</h3>
        <div className="calc-result">
          <div className="calc-row">
            <span className="calc-row-label">Имя</span>
            <span className="calc-row-value">{transfer.receiverName || '—'}</span>
          </div>
          <div className="calc-row">
            <span className="calc-row-label">Карта / Счёт</span>
            <span className="calc-row-value">{transfer.receiverCard || transfer.receiverAccount || '—'}</span>
          </div>
          {transfer.receiverPhone && (
            <div className="calc-row">
              <span className="calc-row-label">Телефон</span>
              <span className="calc-row-value">{transfer.receiverPhone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pspay-card">
        <h3>Хронология</h3>
        <div className="calc-result">
          <div className="calc-row">
            <span className="calc-row-label">Создан</span>
            <span className="calc-row-value">{formatDate(transfer.createdAt)}</span>
          </div>
          <div className="calc-row">
            <span className="calc-row-label">Подтверждён</span>
            <span className="calc-row-value">{formatDate(transfer.confirmedAt)}</span>
          </div>
          <div className="calc-row">
            <span className="calc-row-label">Завершён</span>
            <span className="calc-row-value">{formatDate(transfer.completedAt)}</span>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.5rem' }}>ID: {transfer.id}</p>
      </div>
    </div>
  );
}
