import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header-left">
          <NavLink to="/avo-po/app/admin" className="admin-header-logo" end>
            <div className="admin-header-logo-icon">PS</div>
            <span>Admin Panel</span>
          </NavLink>
          <nav className="admin-nav">
            <NavLink to="/avo-po/app/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
            <NavLink to="/avo-po/app/admin/users" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              Пользователи
            </NavLink>
            <NavLink to="/avo-po/app/admin/transfers" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              Операции
            </NavLink>
          </nav>
        </div>
        <div className="admin-header-right">
          <span className="admin-header-user">{user?.email}</span>
          <button className="admin-header-btn" onClick={() => navigate('/avo-po/app')}>Приложение</button>
          <button className="admin-header-btn" onClick={() => { logout(); navigate('/avo-po/app'); }}>Выход</button>
        </div>
      </header>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
