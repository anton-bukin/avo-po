import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from './api';

function maskCard(card: string | null): string {
  if (!card) return '—';
  return '**** ' + card.replace(/\s/g, '').slice(-4);
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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

  if (loading) return <div className="pspay-card"><p>Загрузка...</p></div>;
  if (!transfer) return <div className="pspay-card"><p>Перевод не найден</p></div>;

  const isCompleted = transfer.status === 'COMPLETED';
  const isFailed = transfer.status === 'FAILED';
  const isProcessing = transfer.status === 'PROCESSING';

  return (
    <div>
      <button className="back-link" onClick={() => navigate('/avo-po/app')}>
        &larr; К переводам
      </button>

      {/* Hero */}
      <div className="pspay-card">
        <div className="detail-hero">
          <div className="detail-hero-amount">
            {transfer.amountSend?.toLocaleString('ru-RU')} {transfer.currencyFrom}
          </div>
          <div className="detail-hero-arrow">&darr;</div>
          <div className="detail-hero-receive">
            {transfer.amountReceive?.toLocaleString('ru-RU')} {transfer.currencyTo}
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span className={`status-badge status-${transfer.status}`}>{transfer.status}</span>
          </div>
        </div>

        {transfer.errorMessage && <div className="error-msg">{transfer.errorMessage}</div>}

        {/* Timeline */}
        <div className="timeline">
          <div className="timeline-item timeline-item--completed">
            <div className="timeline-dot" />
            <div>
              <div className="timeline-label">Перевод создан</div>
              <div className="timeline-date">{formatDate(transfer.createdAt)}</div>
            </div>
          </div>

          <div className={`timeline-item ${transfer.confirmedAt ? 'timeline-item--completed' : 'timeline-item--pending'}`}>
            <div className="timeline-dot" />
            <div>
              <div className="timeline-label">Подтверждён</div>
              <div className="timeline-date">{formatDate(transfer.confirmedAt)}</div>
            </div>
          </div>

          <div className={`timeline-item ${isProcessing ? 'timeline-item--active' : isCompleted || isFailed ? 'timeline-item--completed' : 'timeline-item--pending'}`}>
            <div className="timeline-dot" />
            <div>
              <div className="timeline-label">Обработка партнёром</div>
            </div>
          </div>

          <div className={`timeline-item ${isCompleted ? 'timeline-item--completed' : isFailed ? 'timeline-item--failed' : 'timeline-item--pending'}`}>
            <div className="timeline-dot" />
            <div>
              <div className="timeline-label">{isFailed ? 'Ошибка' : 'Завершён'}</div>
              <div className="timeline-date">{formatDate(transfer.completedAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="pspay-card">
        <h3>Отправитель</h3>
        <div className="info-rows">
          <div className="info-row">
            <span className="info-row-label">Карта</span>
            <span className="info-row-value">{maskCard(transfer.senderCard)}</span>
          </div>
          <div className="info-row">
            <span className="info-row-label">Имя</span>
            <span className="info-row-value">{transfer.senderName || '—'}</span>
          </div>
        </div>

        <div className="parties-divider">&darr;</div>

        <h3>Получатель</h3>
        <div className="info-rows">
          <div className="info-row">
            <span className="info-row-label">Карта / счёт</span>
            <span className="info-row-value">{maskCard(transfer.receiverCard)}</span>
          </div>
          <div className="info-row">
            <span className="info-row-label">Имя</span>
            <span className="info-row-value">{transfer.receiverName || '—'}</span>
          </div>
          {transfer.receiverPhone && (
            <div className="info-row">
              <span className="info-row-label">Телефон</span>
              <span className="info-row-value">{transfer.receiverPhone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Financial details */}
      <div className="pspay-card">
        <h3>Детали перевода</h3>
        <div className="info-rows">
          {transfer.exchangeRate && (
            <div className="info-row">
              <span className="info-row-label">Курс</span>
              <span className="info-row-value">1 {transfer.currencyFrom} = {transfer.exchangeRate} {transfer.currencyTo}</span>
            </div>
          )}
          {transfer.commission && (
            <div className="info-row">
              <span className="info-row-label">Комиссия</span>
              <span className="info-row-value">{transfer.commission?.toLocaleString('ru-RU')} {transfer.currencyFrom}</span>
            </div>
          )}
          {transfer.totalDebit && (
            <div className="info-row">
              <span className="info-row-label" style={{ fontWeight: 600 }}>Итого списано</span>
              <span className="info-row-value" style={{ fontWeight: 700 }}>{transfer.totalDebit?.toLocaleString('ru-RU')} {transfer.currencyFrom}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-row-label">ID</span>
            <span className="info-row-value" style={{ fontSize: '0.72rem', color: '#a0aec0' }}>{transfer.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
