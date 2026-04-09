import Section from '../components/Section';
import InfoCard from '../components/InfoCard';

export default function Redis() {
  return (
    <Section id="redis" title="Кеширующий слой — Redis" num="5">
      <div className="card">
        <p>Распределённый кеш для процессинга выполняет функции:</p>
        <ul>
          <li>Хранение временных данных</li>
          <li>Ускорение повторяющихся запросов</li>
          <li>Снижение нагрузки на транзакционное хранилище</li>
        </ul>
        <p><strong>Redis Sentinel</strong> обеспечивает отказоустойчивый доступ.</p>
      </div>
      <InfoCard items={[
        { label: 'Тип развёртывания', value: 'Кластер на виртуальных машинах в облаке' },
      ]} />
    </Section>
  );
}
