import { useState, useEffect } from 'react';
import './Sidebar.css';

interface NavItem {
  id: string;
  label: string;
  num: string;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Обзор платформы', num: '1' },
  { id: 'core-engine', label: 'Transaction Core Engine', num: '2' },
  { id: 'dependencies', label: 'Зависимости', num: '2.2' },
  { id: 'data-storage', label: 'Слой хранения данных', num: '3' },
  { id: 'elasticsearch', label: 'Elasticsearch', num: '4' },
  { id: 'redis', label: 'Redis', num: '5' },
  { id: 'cache-updater', label: 'Cache Updater', num: '6' },
  { id: 'api-gateway', label: 'API-контур', num: '7' },
  { id: 'kubernetes', label: 'Kubernetes', num: '8' },
  { id: 'client-access', label: 'Клиентские интерфейсы', num: '9' },
  { id: 'communications', label: 'Коммуникации', num: '10' },
  { id: 'object-storage', label: 'Объектное хранилище', num: '11' },
  { id: 'conclusion', label: 'Заключение', num: '12' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [activeId, setActiveId] = useState('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    navItems.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">PS</div>
        <div>
          <div className="sidebar-logo-name">PS Pay</div>
          <div className="sidebar-logo-sub">Platform Docs</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-link ${activeId === item.id ? 'sidebar-link--active' : ''}`}
            onClick={() => handleClick(item.id)}
          >
            <span className="sidebar-link-num">{item.num}</span>
            <span className="sidebar-link-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        Версия документа: 1.2
      </div>
    </aside>
  );
}
