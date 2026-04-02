import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useAuth } from './store';
import LoginPage from './LoginPage';
import TransferList from './TransferList';
import NewTransfer from './NewTransfer';
import TransferDetail from './TransferDetail';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import UsersPage from './admin/UsersPage';
import TransfersPage from './admin/TransfersPage';
import './App.css';
import './admin/admin.css';

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function PSPayApp() {
  const { user, isAuth, login, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuth) {
    return <LoginPage onLogin={(token, u) => { login(token, u); navigate('/avo-po/app'); }} />;
  }

  return (
    <Routes>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="transfers" element={<TransfersPage />} />
      </Route>

      <Route path="*" element={
        <div className="pspay">
          <header className="pspay-header">
            <Link to="/avo-po/app" className="pspay-header-logo">
              <div className="pspay-header-logo-icon">PS</div>
              <span className="pspay-header-logo-text">PS Pay</span>
            </Link>
            <div className="pspay-header-nav">
              <div className="pspay-header-avatar">{user ? getInitials(user.fullName) : '?'}</div>
              <Link to="/avo-po/app/admin" className="pspay-header-btn" style={{ textDecoration: 'none' }}>Admin</Link>
              <button className="pspay-header-btn" onClick={() => { logout(); navigate('/avo-po/app'); }}>Выход</button>
            </div>
          </header>
          <div className="pspay-content">
            <Routes>
              <Route index element={<TransferList />} />
              <Route path="new" element={<NewTransfer />} />
              <Route path="transfer/:id" element={<TransferDetail />} />
            </Routes>
          </div>
        </div>
      } />
    </Routes>
  );
}
