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
  commissionPercent: number;
  minCommission: number;
  isActive: boolean;
  cbrRate: number | null;
  effectiveRate: number | null;
}

interface EditState {
  margin: string;
  commission: string;
  minComm: string;
}

export default function DirectionsPage() {
  const [directions, setDirections] = useState<AdminDirection[]>([]);
  const [cbrDate, setCbrDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, EditState>>({});

  const load = () => {
    api.adminGetDirections().then((data: any) => {
      setDirections(data.directions);
      setCbrDate(data.cbrDate);
      const e: Record<number, EditState> = {};
      data.directions.forEach((d: AdminDirection) => {
        e[d.id] = { margin: String(d.marginPercent), commission: String(d.commissionPercent), minComm: String(d.minCommission) };
      });
      setEdits(e);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateEdit = (id: number, field: keyof EditState, value: string) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const isDirty = (dir: AdminDirection) => {
    const e = edits[dir.id];
    if (!e) return false;
    return parseFloat(e.margin) !== dir.marginPercent
      || parseFloat(e.commission) !== dir.commissionPercent
      || parseFloat(e.minComm) !== dir.minCommission;
  };

  const handleSave = async (dir: AdminDirection) => {
    const e = edits[dir.id];
    if (!e) return;
    setSaving(dir.id);
    try {
      await api.adminUpdateDirection(dir.id, {
        marginPercent: parseFloat(e.margin),
        commissionPercent: parseFloat(e.commission),
        minCommission: parseFloat(e.minComm),
      });
      load();
    } catch {} finally { setSaving(null); }
  };

  const handleToggle = async (dir: AdminDirection) => {
    setSaving(dir.id);
    try {
      await api.adminUpdateDirection(dir.id, { isActive: !dir.isActive });
      load();
    } catch {} finally { setSaving(null); }
  };

  if (loading) return <div className="admin-card">Загрузка курсов ЦБ...</div>;

  const inputStyle = {
    width: 65, padding: '0.3rem 0.4rem', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: '0.8rem', fontFamily: 'inherit', textAlign: 'right' as const,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0 }}>Направления переводов</h1>
        <span style={{ fontSize: '0.78rem', color: '#718096' }}>Курсы ЦБ РФ от {cbrDate}</span>
      </div>

      <div className="admin-card" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#4a5568', background: '#f7fafc' }}>
        <strong>Маржа</strong> уменьшает курс для клиента (доход сервиса на курсе).
        <strong> Комиссия</strong> — процент от суммы перевода, взимается сверх суммы.
        Для каждой страны можно установить свою комиссию и минимальную сумму комиссии.
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Направление</th>
                <th>Курс ЦБ</th>
                <th>Маржа %</th>
                <th>Курс клиента</th>
                <th>Комиссия %</th>
                <th>Мин. комиссия</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {directions.map(dir => {
                const e = edits[dir.id];
                const dirty = isDirty(dir);
                return (
                  <tr key={dir.id} style={{ opacity: dir.isActive ? 1 : 0.5 }}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {dir.countryToFlag} {dir.countryToName || dir.countryTo}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#a0aec0' }}>
                        {dir.currencyFrom} &rarr; {dir.currencyTo}
                      </div>
                    </td>
                    <td>
                      {dir.cbrRate !== null ? (
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{dir.cbrRate.toFixed(4)}</span>
                      ) : <span style={{ color: '#e53e3e', fontSize: '0.75rem' }}>Нет</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                        <input type="number" step="0.1" min="-50" max="50" value={e?.margin || '0'}
                          onChange={ev => updateEdit(dir.id, 'margin', ev.target.value)} style={inputStyle} />
                        <span style={{ fontSize: '0.75rem', color: '#718096' }}>%</span>
                      </div>
                    </td>
                    <td>
                      {dir.effectiveRate !== null ? (
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, color: '#2b6cb0' }}>
                          {dir.effectiveRate.toFixed(4)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                        <input type="number" step="0.1" min="0" max="30" value={e?.commission || '1.5'}
                          onChange={ev => updateEdit(dir.id, 'commission', ev.target.value)} style={inputStyle} />
                        <span style={{ fontSize: '0.75rem', color: '#718096' }}>%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                        <input type="number" step="10" min="0" value={e?.minComm || '50'}
                          onChange={ev => updateEdit(dir.id, 'minComm', ev.target.value)} style={{ ...inputStyle, width: 70 }} />
                        <span style={{ fontSize: '0.75rem', color: '#718096' }}>RUB</span>
                      </div>
                    </td>
                    <td>
                      <button onClick={() => handleToggle(dir)} disabled={saving === dir.id}
                        style={{
                          background: dir.isActive ? '#c6f6d5' : '#fed7d7',
                          color: dir.isActive ? '#276749' : '#9b2c2c',
                          border: 'none', borderRadius: 20, padding: '0.25rem 0.6rem',
                          fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                        }}
                      >{dir.isActive ? 'Вкл' : 'Выкл'}</button>
                    </td>
                    <td>
                      {dirty && (
                        <button className="btn btn-primary btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', width: 'auto' }}
                          onClick={() => handleSave(dir)} disabled={saving === dir.id}
                        >{saving === dir.id ? '...' : 'Сохранить'}</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
