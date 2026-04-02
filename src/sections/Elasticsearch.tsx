import Section from '../components/Section';
import InfoCard from '../components/InfoCard';

export default function Elasticsearch() {
  return (
    <Section id="elasticsearch" title="Индексный слой данных — Elasticsearch" num="4">
      <div className="card">
        <p>
          Для ускоренного доступа к операционным данным используется отдельный индексный слой
          быстрого доступа к горячим данным и поисковым сценариям:
        </p>
        <ul>
          <li>Быстрый поиск транзакций</li>
          <li>Аналитические запросы</li>
          <li>Обработка больших объёмов операционных данных</li>
        </ul>
      </div>
      <InfoCard items={[
        { label: 'Тип развёртывания', value: 'Кластер на виртуальных машинах в облаке' },
        { label: 'ОС', value: 'Ubuntu 22.04' },
        { label: 'Версия Elasticsearch', value: '7.17.28' },
      ]} />
    </Section>
  );
}
