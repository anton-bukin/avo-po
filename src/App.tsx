import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';

// Platform docs (original PDF-based)
import Sidebar from './components/Sidebar';
import Overview from './sections/Overview';
import CoreEngine from './sections/CoreEngine';
import Dependencies from './sections/Dependencies';
import DataStorage from './sections/DataStorage';
import Elasticsearch from './sections/Elasticsearch';
import Redis from './sections/Redis';
import CacheUpdater from './sections/CacheUpdater';
import ApiGateway from './sections/ApiGateway';
import Kubernetes from './sections/Kubernetes';
import ClientAccess from './sections/ClientAccess';
import ObjectStorage from './sections/ObjectStorage';
import Conclusion from './sections/Conclusion';

// User & admin guides
import {
  About, UserRegister, UserNewTransfer, UserAmount, UserDetails,
  UserConfirm, UserStatus, UserHistory, UserRepeat, UserFAQ
} from './sections/UserGuide';
import {
  AdminStart, AdminDashboard, AdminUsers, AdminTransfers,
  AdminDirections, AdminExport
} from './sections/AdminGuide';

// App
import PSPayApp from './app/PSPayApp';

/* ====== Top navigation between doc pages ====== */
function DocsNav() {
  return (
    <div className="docs-topnav">
      <NavLink to="/avo-po" end className={({ isActive }) => `docs-topnav-link ${isActive ? 'active' : ''}`}>
        Документация платформы
      </NavLink>
      <NavLink to="/avo-po/guide" className={({ isActive }) => `docs-topnav-link ${isActive ? 'active' : ''}`}>
        Инструкция пользователя
      </NavLink>
      <NavLink to="/avo-po/admin-guide" className={({ isActive }) => `docs-topnav-link ${isActive ? 'active' : ''}`}>
        Инструкция администратора
      </NavLink>
      <NavLink to="/avo-po/app" className="docs-topnav-app">
        Открыть PS Pay &rarr;
      </NavLink>
    </div>
  );
}

/* ====== Page 1: Platform Documentation (original) ====== */
function PlatformDocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <button className="burger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '\u2715' : '\u2630'}
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} mode="platform" />
      <main className="main-content">
        <DocsNav />
        <div className="header">
          <div className="header-badge">PS Pay Platform</div>
          <h1>Платформа для Сервиса переводов с платёжных карт на платёжные карты и счета</h1>
          <div className="header-subtitle">Описание функциональности, компонентов и зависимостей</div>
          <div className="header-version">Версия документа: 1.2</div>
        </div>
        <Overview />
        <CoreEngine />
        <Dependencies />
        <DataStorage />
        <Elasticsearch />
        <Redis />
        <CacheUpdater />
        <ApiGateway />
        <Kubernetes />
        <ClientAccess />
        <ObjectStorage />
        <Conclusion />
      </main>
    </div>
  );
}

/* ====== Page 2: User Guide ====== */
function UserGuidePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <button className="burger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '\u2715' : '\u2630'}
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} mode="user" />
      <main className="main-content">
        <DocsNav />
        <div className="header">
          <div className="header-badge" style={{ background: '#48bb78' }}>Инструкция</div>
          <h1>Руководство пользователя PS Pay</h1>
          <div className="header-subtitle">Как отправлять переводы через сервис PS Pay</div>
        </div>
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
      </main>
    </div>
  );
}

/* ====== Page 3: Admin Guide ====== */
function AdminGuidePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <button className="burger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '\u2715' : '\u2630'}
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} mode="admin" />
      <main className="main-content">
        <DocsNav />
        <div className="header">
          <div className="header-badge" style={{ background: '#e53e3e' }}>Администратор</div>
          <h1>Руководство администратора PS Pay</h1>
          <div className="header-subtitle">Управление платформой, пользователями, операциями и курсами</div>
        </div>
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
        <Route path="/avo-po/guide" element={<UserGuidePage />} />
        <Route path="/avo-po/admin-guide" element={<AdminGuidePage />} />
        <Route path="/avo-po" element={<PlatformDocsPage />} />
        <Route path="*" element={<PlatformDocsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
