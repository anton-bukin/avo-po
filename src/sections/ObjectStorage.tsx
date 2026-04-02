import Section from '../components/Section';

export default function ObjectStorage() {
  return (
    <Section id="object-storage" title="Объектное хранилище" num="11">
      <div className="card">
        <p>
          Для хранения документов и файлов используется <strong>S3-совместимое объектное хранилище</strong>.
        </p>
        <p>
          Архитектура допускает использование различных облачных или локальных реализаций
          объектных хранилищ (например, YandexCloud).
        </p>
      </div>
    </Section>
  );
}
