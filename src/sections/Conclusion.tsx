import Section from '../components/Section';

export default function Conclusion() {
  return (
    <Section id="conclusion" title="Заключение" num="12">
      <div className="card">
        <p>
          Платформа представляет собой <strong>Core Transaction Processing Platform</strong>,
          построенную по принципу <strong>decoupled transaction core</strong>.
        </p>
      </div>

      <h3 style={{ marginTop: '1rem' }}>Ключевые характеристики архитектуры</h3>
      <div className="conclusion-features">
        <div className="conclusion-feature">
          <div className="conclusion-feature-icon">&#128268;</div>
          <div className="conclusion-feature-text">Независимость транзакционного ядра от клиентских интерфейсов</div>
        </div>
        <div className="conclusion-feature">
          <div className="conclusion-feature-icon">&#128279;</div>
          <div className="conclusion-feature-text">API-ориентированная модель интеграций</div>
        </div>
        <div className="conclusion-feature">
          <div className="conclusion-feature-icon">&#128230;</div>
          <div className="conclusion-feature-text">Модульная сервисная архитектура</div>
        </div>
        <div className="conclusion-feature">
          <div className="conclusion-feature-icon">&#128451;</div>
          <div className="conclusion-feature-text">Многоуровневая система хранения данных</div>
        </div>
        <div className="conclusion-feature">
          <div className="conclusion-feature-icon">&#128241;</div>
          <div className="conclusion-feature-text">Поддержка различных каналов доступа</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <p>
          Такая архитектура позволяет использовать платформу как универсальный процессинговый слой
          для финансовых транзакций в различных финтех-сервисах.
        </p>
      </div>
    </Section>
  );
}
