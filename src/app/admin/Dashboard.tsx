import { useState, useEffect } from 'react';
import { api } from '../api';

interface Stats {
  totalUsers: number;
  totalTransfers: number;
  transfersByStatus: Record<string, number>;
  totalVolume: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.adminGetStats().then(setStats).catch(() => {});
  }, []);

  if (!stats) return <div className="admin-card">Загрузка...</div>;

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.totalUsers}</div>
          <div className="admin-stat-label">Пользователей</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.totalTransfers}</div>
          <div className="admin-stat-label">Всего операций</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.totalVolume.toLocaleString('ru-RU')}</div>
          <div className="admin-stat-label">Объём (RUB, завершённые)</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.transfersByStatus['COMPLETED'] || 0}</div>
          <div className="admin-stat-label">Успешных</div>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: '1.5rem' }}>
        <h3>Операции по статусам</h3>
        <div className="admin-status-bars">
          {(['CREATED', 'PROCESSING', 'COMPLETED', 'FAILED'] as const).map(s => {
            const count = stats.transfersByStatus[s] || 0;
            const pct = stats.totalTransfers > 0 ? (count / stats.totalTransfers) * 100 : 0;
            return (
              <div key={s} className="admin-status-bar-row">
                <span className={`status-badge status-${s}`}>{s}</span>
                <div className="admin-status-bar-track">
                  <div className={`admin-status-bar-fill status-bar-${s}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="admin-status-bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
