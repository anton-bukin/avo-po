import { useState } from 'react';
import type { Dependency } from '../data/dependencies';
import './DepsTable.css';

interface DepsTableProps {
  title: string;
  data: Dependency[];
  defaultOpen?: boolean;
}

export default function DepsTable({ title, data, defaultOpen = false }: DepsTableProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? data.filter(d => d.license.toLowerCase().includes(filter.toLowerCase()) ||
        d.library.toLowerCase().includes(filter.toLowerCase()) ||
        d.platformUse.toLowerCase().includes(filter.toLowerCase()))
    : data;

  const permissiveCount = data.filter(d => d.license === 'Permissive').length;
  const copyleftCount = data.filter(d => d.license.includes('Copyleft')).length;
  const proprietaryCount = data.filter(d => d.license.includes('Проприетарная')).length;

  return (
    <div className="deps-block">
      <button className="deps-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span className="deps-toggle-arrow">{isOpen ? '\u25BC' : '\u25B6'}</span>
        <span className="deps-toggle-title">{title}</span>
        <span className="deps-toggle-count">{data.length} библ.</span>
        <span className="deps-badges">
          {permissiveCount > 0 && <span className="badge badge--green">{permissiveCount} Permissive</span>}
          {copyleftCount > 0 && <span className="badge badge--yellow">{copyleftCount} Copyleft</span>}
          {proprietaryCount > 0 && <span className="badge badge--red">{proprietaryCount} Proprietary</span>}
        </span>
      </button>
      {isOpen && (
        <div className="deps-content">
          <input
            className="deps-filter"
            type="text"
            placeholder="Фильтр по библиотеке, назначению или лицензии..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <div className="deps-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Библиотека</th>
                  <th>Версия</th>
                  <th>Назначение</th>
                  <th>Функциональность</th>
                  <th>Лицензия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={i}>
                    <td><code className="lib-name">{d.library}</code></td>
                    <td><span className="version-tag">{d.version}</span></td>
                    <td>{d.purpose}</td>
                    <td>{d.platformUse}</td>
                    <td><span className={`license-tag license-tag--${d.license === 'Permissive' ? 'green' : d.license.includes('Проприетарная') ? 'red' : 'yellow'}`}>{d.license}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.some(d => d.license.includes('*')) && (
            <p className="deps-note">* — выбирается с учётом пожеланий заказчика</p>
          )}
        </div>
      )}
    </div>
  );
}
