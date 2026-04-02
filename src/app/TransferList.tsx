import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

export default function TransferList() {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransfers().then(t => { setTransfers(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="pspay-card"><p>Загрузка...</p></div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 0.75rem 0' }}>Мои переводы</h2>
      <button className="btn btn-primary" onClick={() => navigate('/avo-po/app/new')} style={{ width: '100%', marginBottom: '1rem' }}>
        + Новый перевод
      </button>

      {transfers.length === 0 ? (
        <div className="pspay-card">
          <div className="empty-state">
            <div className="empty-state-icon">&#128181;</div>
            <p>У вас пока нет переводов</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/avo-po/app/new')}>
              Создать перевод
            </button>
          </div>
        </div>
      ) : (
        <div className="pspay-card">
          {transfers.map(t => (
            <div key={t.id} className="transfer-list-item" onClick={() => navigate(`/avo-po/app/transfer/${t.id}`)}>
              <div className="transfer-list-left">
                <span className="transfer-list-dir">{t.directionName || `ID: ${t.directionId}`}</span>
                <span className="transfer-list-date">{formatDate(t.createdAt)}</span>
              </div>
              <div className="transfer-list-right">
                <span className="transfer-list-amount">
                  {t.amountSend ? `${t.amountSend.toLocaleString()} ${t.currencyFrom}` : '—'}
                </span>
                <span className={`status-badge status-${t.status}`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
