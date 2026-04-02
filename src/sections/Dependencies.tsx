import Section from '../components/Section';
import DepsTable from '../components/DepsTable';
import { coreDeps, cpoolDeps, utilsDeps } from '../data/dependencies';

export default function Dependencies() {
  return (
    <Section id="dependencies" title="Зависимости приложений" num="2.2">
      <p>Анализ зависимостей основных компонентов платформы.</p>

      <DepsTable
        title="Приложение процессинга"
        data={coreDeps}
      />
      <DepsTable
        title="Библиотека cpool (инфраструктурный модуль)"
        data={cpoolDeps}
      />
      <DepsTable
        title="Библиотека utils (интеграционный слой)"
        data={utilsDeps}
      />

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Библиотека cpool</h3>
        <p>
          Инфраструктурный модуль доступа к системам хранения данных, JPA/Servlet/Jakarta-совместимость,
          логирование и тестовая инфраструктура.
        </p>
        <ul>
          <li>Управление пулом соединений</li>
          <li>Взаимодействие с реляционными СУБД</li>
          <li>Поддержка ORM-механизмов</li>
          <li>Интеграция с enterprise API Java-экосистемы</li>
          <li>Логирование операций доступа к данным</li>
        </ul>
      </div>

      <div className="card" style={{ marginTop: '0.75rem' }}>
        <h3>Библиотека utils</h3>
        <p>
          Инфраструктурный интеграционный слой платформы.
        </p>
        <ul>
          <li>Интеграционные механизмы (HTTP-клиенты, SOAP-интеграции, SSH/SFTP обмен файлами, SMPP интеграции SMS)</li>
          <li>Обработка данных (работа с XML, Excel и офисными форматами, обработка файлов)</li>
          <li>Криптография (криптографические операции, работа с сертификатами, электронные подписи)</li>
          <li>Очереди сообщений (STOMP-протокол, интеграция с брокерами сообщений)</li>
        </ul>
      </div>
    </Section>
  );
}
