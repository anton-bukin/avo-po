import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

function formatRelativeDate(d: string): string {
  const now = new Date();
  const date = new Date(d);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffH < 24) return `${diffH} ч. назад`;
  if (diffD === 1) return 'Вчера';
  if (diffD < 7) return `${diffD} дн. назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

const STATUS_ICONS: Record<string, string> = {
  COMPLETED: '\u2713',
  PROCESSING: '\u21BB',
  CREATED: '\u2192',
  FAILED: '\u2717',
};

function SkeletonList() {
  return (
    <div className="pspay-card">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-item">
          <div className="skeleton skeleton-circle" />
          <div className="skeleton-lines" style={{ flex: 1 }}>
            <div className="skeleton skeleton-line" style={{ width: '70%' }} />
            <div className="skeleton skeleton-line" style={{ width: '40%' }} />
          </div>
          <div className="skeleton-lines" style={{ width: 80 }}>
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" style={{ width: '60%', marginLeft: 'auto' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TransferList() {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransfers().then(t => { setTransfers(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Переводы</h2>

      <div className="quick-action" onClick={() => navigate('/avo-po/app/new')}>
        <div>
          <div className="quick-action-text">Новый перевод</div>
          <div className="quick-action-sub">Отправить деньги за рубеж</div>
        </div>
        <span className="quick-action-arrow">&rarr;</span>
      </div>

      {loading ? (
        <SkeletonList />
      ) : transfers.length === 0 ? (
        <div className="pspay-card">
          <div className="empty-state">
            <div className="empty-state-icon">&uarr;&darr;</div>
            <p>У вас пока нет переводов</p>
          </div>
        </div>
      ) : (
        <div className="pspay-card" style={{ padding: '0.75rem 1.25rem' }}>
          {transfers.map(t => (
            <div key={t.id} className="transfer-item" onClick={() => navigate(`/avo-po/app/transfer/${t.id}`)}>
              <div className={`transfer-item-icon transfer-item-icon--${t.status}`}>
                {STATUS_ICONS[t.status] || '?'}
              </div>
              <div className="transfer-item-info">
                <div className="transfer-item-dir">{t.directionName || `Перевод #${t.id.slice(0, 8)}`}</div>
                <div className="transfer-item-date">{formatRelativeDate(t.createdAt)}</div>
              </div>
              <div className="transfer-item-amounts">
                <div className="transfer-item-send">
                  &minus;{t.amountSend ? t.amountSend.toLocaleString('ru-RU') : '—'} {t.currencyFrom}
                </div>
                {t.amountReceive && (
                  <div className="transfer-item-receive">
                    +{t.amountReceive.toLocaleString('ru-RU')} {t.currencyTo}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
