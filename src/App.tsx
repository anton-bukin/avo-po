import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import {
  About, UserRegister, UserNewTransfer, UserAmount, UserDetails,
  UserConfirm, UserStatus, UserHistory, UserRepeat, UserFAQ
} from './sections/UserGuide';
import {
  AdminStart, AdminDashboard, AdminUsers, AdminTransfers,
  AdminDirections, AdminExport
} from './sections/AdminGuide';
import PSPayApp from './app/PSPayApp';

function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <button className="burger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '\u2715' : '\u2630'}
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <div className="header">
          <div className="header-badge">PS Pay</div>
          <h1>Руководство пользователя и администратора</h1>
          <div className="header-subtitle">Инструкции по работе с сервисом переводов PS Pay</div>
          <Link to="/avo-po/app" style={{ display: 'inline-block', marginTop: '0.75rem', background: '#4f6ef7', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            Открыть приложение PS Pay &rarr;
          </Link>
        </div>

        {/* User Guide */}
        <About />
        <UserRegister />
        <UserNewTransfer />
        <UserAmount />
        <UserDetails />
        <UserConfirm />
        <UserStatus />
        <UserHistory />
        <UserRepeat />
        <UserFAQ />

        {/* Admin Guide */}
        <AdminStart />
        <AdminDashboard />
        <AdminUsers />
        <AdminTransfers />
        <AdminDirections />
        <AdminExport />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/avo-po/app/*" element={<PSPayApp />} />
        <Route path="/avo-po/*" element={<DocsPage />} />
        <Route path="*" element={<DocsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
