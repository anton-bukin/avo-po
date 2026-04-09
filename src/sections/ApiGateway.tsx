import Section from '../components/Section';
import InfoCard from '../components/InfoCard';

export default function ApiGateway() {
  return (
    <Section id="api-gateway" title="API-контур платформы" num="7">
      <div className="card">
        <p>
          API-контур выполняет функции маршрутизации запросов, балансировки нагрузки и интеграции
          с партнёрскими системами. Является основным механизмом взаимодействия внешних систем
          с Transaction Core платформы (<strong>reverse proxy / балансировка / маршрутизация запросов</strong> к процессингу).
        </p>
      </div>
      <InfoCard items={[
        { label: 'Технология', value: 'OpenResty (nginx + Lua)' },
      ]} />
    </Section>
  );
}
