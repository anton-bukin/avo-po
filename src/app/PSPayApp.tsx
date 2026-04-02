import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useAuth } from './store';
import LoginPage from './LoginPage';
import TransferList from './TransferList';
import NewTransfer from './NewTransfer';
import TransferDetail from './TransferDetail';
import './App.css';

export default function PSPayApp() {
  const { user, isAuth, login, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuth) {
    return <LoginPage onLogin={(token, u) => { login(token, u); navigate('/avo-po/app'); }} />;
  }

  return (
    <div className="pspay">
      <header className="pspay-header">
        <Link to="/avo-po/app" className="pspay-header-logo">
          <div className="pspay-header-logo-icon">PS</div>
          <span className="pspay-header-logo-text">PS Pay</span>
        </Link>
        <div className="pspay-header-nav">
          <span className="pspay-header-user">{user?.fullName}</span>
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
  );
}
