import Section from '../components/Section';
import DepsTable from '../components/DepsTable';
import { clientAccessDeps } from '../data/dependencies';

export default function ClientAccess() {
  return (
    <Section id="client-access" title="Система доступа клиентских интерфейсов" num="9">
      <div className="card">
        <p>
          В архитектуре <strong>decoupled transaction core</strong> клиентские интерфейсы отделены от процессингового ядра.
          Реализует веб/API-доступ, сессии в Redis, security, captcha, websocket/STOMP, валидацию и интеграции.
        </p>
        <p>Платформа поддерживает подключение различных типов клиентов:</p>
        <ul>
          <li>Веб-приложения</li>
          <li>Мобильные приложения</li>
          <li>Партнёрские приложения</li>
          <li>Интеграционные API-клиенты</li>
        </ul>
      </div>
      <DepsTable title="Зависимости системы доступа клиентских интерфейсов" data={clientAccessDeps} />
    </Section>
  );
}
