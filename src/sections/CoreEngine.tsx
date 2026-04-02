import Section from '../components/Section';

export default function CoreEngine() {
  return (
    <Section id="core-engine" title="Transaction Core Engine" num="2">
      <div className="card">
        <p>
          Основное серверное ядро платформы реализует <strong>Transaction Core Engine</strong> — центральный
          компонент платформы, обеспечивающий независимость бизнес-логики транзакций от пользовательских
          интерфейсов и внешних сервисов.
        </p>
      </div>

      <h3 style={{ marginTop: '1rem' }}>Функции ядра</h3>
      <ul>
        <li>Обработка API-запросов</li>
        <li>Управление жизненным циклом транзакций (списание — конверсия — зачисление)</li>
        <li>Валидация финансовых реквизитов</li>
        <li>Криптографическая обработка данных</li>
        <li>Интеграции с внешними финансовыми системами</li>
        <li>Управление кешами и индексными данными</li>
        <li>Формирование документов</li>
        <li>Отправка коммуникаций пользователям</li>
      </ul>

      <h3 style={{ marginTop: '1rem' }}>Среда выполнения</h3>
      <p>
        Процессинговое ядро реализовано как <strong>Java-приложение</strong>, развёртываемое в серверной среде Linux.
        Приложения собираются с использованием <strong>Maven</strong> и выполняются в стандартной JVM-среде.
      </p>
      <ul>
        <li>Переносимость между инфраструктурами</li>
        <li>Независимость от конкретных облачных провайдеров</li>
        <li>Совместимость с различными системами развёртывания</li>
      </ul>

      <h3 style={{ marginTop: '1rem' }}>Компоненты</h3>
      <div className="components-grid">
        <div className="component-card">
          <div className="component-card-title">API и форматы данных</div>
          <div className="component-card-desc">JSON сериализация, обработка форматов данных, REST/SOAP интеграции</div>
        </div>
        <div className="component-card">
          <div className="component-card-title">Криптография и безопасность</div>
          <div className="component-card-desc">Токены аутентификации, криптографические операции, электронные подписи</div>
        </div>
        <div className="component-card">
          <div className="component-card-title">Валидация данных</div>
          <div className="component-card-desc">Проверка пользовательского ввода, проверка финансовых реквизитов</div>
        </div>
        <div className="component-card">
          <div className="component-card-title">Интеграционные библиотеки</div>
          <div className="component-card-desc">HTTP-клиенты, SOAP-интеграции, OAuth-авторизация</div>
        </div>
        <div className="component-card">
          <div className="component-card-title">Коммуникации</div>
          <div className="component-card-desc">Email-уведомления, SMS-уведомления, push-уведомления</div>
        </div>
        <div className="component-card">
          <div className="component-card-title">Инфраструктура</div>
          <div className="component-card-desc">Кеширование, логирование, обработка изображений, генерация документов</div>
        </div>
      </div>
    </Section>
  );
}
