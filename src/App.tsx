import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
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
import Communications from './sections/Communications';
import ObjectStorage from './sections/ObjectStorage';
import Conclusion from './sections/Conclusion';
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
          <div className="header-badge">PS Pay Platform</div>
          <h1>Платформа для Сервиса переводов с платёжных карт на платёжные карты и счета</h1>
          <div className="header-subtitle">Описание функциональности, компонентов и зависимостей</div>
          <div className="header-version">Версия документа: 1.2</div>
          <Link to="/avo-po/app" style={{ display: 'inline-block', marginTop: '0.75rem', background: '#4f6ef7', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            Открыть приложение PS Pay &rarr;
          </Link>
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
        <Communications />
        <ObjectStorage />
        <Conclusion />
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
