import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  createdAt: string;
  transferCount: number;
  totalSent: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.adminGetUsers().then(u => { setUsers(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="admin-card">Загрузка...</div>;

  return (
    <div>
      <h1 className="admin-page-title">Пользователи ({users.length})</h1>
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Дата регистрации</th>
                <th>Переводов</th>
                <th>Объём (RUB)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td><strong>{u.fullName}</strong></td>
                  <td>{u.email}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{u.transferCount}</td>
                  <td>{u.totalSent.toLocaleString('ru-RU')}</td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/avo-po/app/admin/transfers?userId=${u.id}`)}
                    >
                      Операции
                    </button>
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
