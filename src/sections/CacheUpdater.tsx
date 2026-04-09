import Section from '../components/Section';
import InfoCard from '../components/InfoCard';
import DepsTable from '../components/DepsTable';
import { cacheUpdaterDeps } from '../data/dependencies';

export default function CacheUpdater() {
  return (
    <Section id="cache-updater" title="Сервис синхронизации данных — cache-updater" num="6">
      <div className="card">
        <p>
          Сервис синхронизации данных между транзакционным хранилищем и кеширующим слоем
          для пакетной/транзакционной репликации справочников и кешей:
        </p>
        <ul>
          <li>Репликация справочников</li>
          <li>Обновление кешей</li>
          <li>Синхронизация операционных данных</li>
        </ul>
      </div>
      <InfoCard items={[
        { label: 'Тип развёртывания', value: 'Docker (docker-compose) на VM в облаке' },
      ]} />
      <DepsTable title="Зависимости cache-updater" data={cacheUpdaterDeps} />
    </Section>
  );
}
