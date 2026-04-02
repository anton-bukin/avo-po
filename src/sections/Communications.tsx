import Section from '../components/Section';
import DepsTable from '../components/DepsTable';
import { chatDeps, mqDeps, calcServiceDeps } from '../data/dependencies';

export default function Communications() {
  return (
    <Section id="communications" title="Коммуникационные сервисы" num="10">
      <div className="card">
        <p>Платформа включает сервисы коммуникации с пользователями:</p>
        <ul>
          <li>Чат поддержки</li>
          <li>Очереди сообщений</li>
          <li>Системы уведомлений</li>
        </ul>
        <p>
          Коммуникационные сервисы взаимодействуют с Transaction Core через API и брокеры сообщений.
        </p>
      </div>

      <h3 style={{ marginTop: '1rem' }}>10.1. Клиентский чат с поддержкой</h3>
      <p>
        Отдельный сервис чата, поддерживает REST/WebSocket, STOMP, JPA,
        проверку файлов/вложений и работу с СУБД.
      </p>
      <DepsTable title="Зависимости клиентского чата" data={chatDeps} />

      <h3 style={{ marginTop: '1rem' }}>10.2. Сервис очередей сообщений</h3>
      <p>Сервис управления очередями сообщений для чата с клиентами.</p>
      <DepsTable title="Зависимости сервиса очередей" data={mqDeps} />

      <h3 style={{ marginTop: '1rem' }}>10.3. Сервис расчёта параметров операций</h3>
      <p>
        Отдельный сервис расчёта параметров финансовых операций, включая расчёт курсов и комиссий,
        основанных на данных внешнего провайдера (финансового партнёра). Предоставляет API для
        клиентских приложений и других сервисов платформы. Содержит веб/API слой, security, Redis,
        мониторинг, документацию API.
      </p>
      <DepsTable title="Зависимости сервиса расчёта" data={calcServiceDeps} />
    </Section>
  );
}
