import { useState, useEffect } from 'react';
import { api } from '../api';

interface AdminDirection {
  id: number;
  code: string;
  name: string;
  countryTo: string;
  countryToName: string;
  countryToFlag: string;
  currencyFrom: string;
  currencyTo: string;
  marginPercent: number;
  isActive: boolean;
  cbrRate: number | null;
  effectiveRate: number | null;
  cbrRateName: string | null;
}

export default function DirectionsPage() {
  const [directions, setDirections] = useState<AdminDirection[]>([]);
  const [cbrDate, setCbrDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [editMargin, setEditMargin] = useState<Record<number, string>>({});

  const load = () => {
    api.adminGetDirections().then((data: any) => {
      setDirections(data.directions);
      setCbrDate(data.cbrDate);
      const margins: Record<number, string> = {};
      data.directions.forEach((d: AdminDirection) => { margins[d.id] = String(d.marginPercent); });
      setEditMargin(margins);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (dir: AdminDirection) => {
    setSaving(dir.id);
    try {
      await api.adminUpdateDirection(dir.id, { isActive: !dir.isActive });
      load();
    } catch {} finally { setSaving(null); }
  };

  const handleMarginSave = async (dir: AdminDirection) => {
    const margin = parseFloat(editMargin[dir.id]);
    if (isNaN(margin)) return;
    setSaving(dir.id);
    try {
      await api.adminUpdateDirection(dir.id, { marginPercent: margin });
      load();
    } catch {} finally { setSaving(null); }
  };

  if (loading) return <div className="admin-card">Загрузка курсов ЦБ...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0 }}>Направления переводов</h1>
        <span style={{ fontSize: '0.78rem', color: '#718096' }}>
          Курсы ЦБ РФ от {cbrDate}
        </span>
      </div>

      <div className="admin-card" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#4a5568', background: '#f7fafc' }}>
        <strong>Как работает маржа:</strong> Маржа уменьшает количество валюты, которое получит клиент.
        Например, при марже 2% курс ЦБ 1 RUB = 140 UZS станет 1 RUB = 137.2 UZS.
        Отрицательная маржа увеличит курс (бонус клиенту).
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Направление</th>
                <th>Валюта</th>
                <th>Курс ЦБ (1 RUB)</th>
                <th>Маржа %</th>
                <th>Курс клиента</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {directions.map(dir => (
                <tr key={dir.id} style={{ opacity: dir.isActive ? 1 : 0.5 }}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {dir.countryToFlag} {dir.countryToName || dir.countryTo}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#a0aec0' }}>{dir.code}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{dir.currencyFrom} &rarr; {dir.currencyTo}</td>
                  <td>
                    {dir.cbrRate !== null ? (
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {dir.cbrRate.toFixed(6)}
                      </span>
                    ) : (
                      <span style={{ color: '#e53e3e', fontSize: '0.78rem' }}>Нет данных</span>
                    )}
                  </td>
                  <td style={{ minWidth: 130 }}>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        step="0.1"
                        min="-50"
                        max="50"
                        value={editMargin[dir.id] || '0'}
                        onChange={e => setEditMargin({ ...editMargin, [dir.id]: e.target.value })}
                        style={{
                          width: 70, padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0',
                          borderRadius: 6, fontSize: '0.82rem', fontFamily: 'inherit', textAlign: 'right'
                        }}
                      />
                      <span style={{ fontSize: '0.78rem', color: '#718096' }}>%</span>
                      {parseFloat(editMargin[dir.id]) !== dir.marginPercent && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', width: 'auto' }}
                          onClick={() => handleMarginSave(dir)}
                          disabled={saving === dir.id}
                        >
                          {saving === dir.id ? '...' : 'OK'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    {dir.effectiveRate !== null ? (
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, color: '#2b6cb0' }}>
                        {dir.effectiveRate.toFixed(6)}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggle(dir)}
                      disabled={saving === dir.id}
                      style={{
                        background: dir.isActive ? '#c6f6d5' : '#fed7d7',
                        color: dir.isActive ? '#276749' : '#9b2c2c',
                        border: 'none', borderRadius: 20, padding: '0.25rem 0.65rem',
                        fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {dir.isActive ? 'Активно' : 'Выключено'}
                    </button>
                  </td>
                  <td>
                    {dir.marginPercent > 0 && dir.cbrRate && (
                      <span style={{ fontSize: '0.7rem', color: '#718096' }}>
                        +{(dir.marginPercent * dir.cbrRate / 100).toFixed(4)} RUB
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
