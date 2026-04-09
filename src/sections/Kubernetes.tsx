import Section from '../components/Section';
import InfoCard from '../components/InfoCard';

export default function Kubernetes() {
  return (
    <Section id="kubernetes" title="Контейнерная инфраструктура — Kubernetes" num="8">
      <div className="card">
        <p>Часть сервисов платформы развёрнута в контейнерной инфраструктуре, обеспечивающей:</p>
        <ul>
          <li>Масштабирование сервисов</li>
          <li>Изоляцию компонентов</li>
          <li>Гибкость инфраструктурного развёртывания</li>
        </ul>
      </div>
      <InfoCard items={[
        { label: 'Тип развёртывания', value: 'Кластер на виртуальных машинах' },
      ]} />
    </Section>
  );
}
