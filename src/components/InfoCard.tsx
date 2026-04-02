import './InfoCard.css';

interface InfoCardProps {
  items: { label: string; value: string }[];
}

export default function InfoCard({ items }: InfoCardProps) {
  return (
    <div className="info-card">
      {items.map((item, i) => (
        <div className="info-card-row" key={i}>
          <span className="info-card-label">{item.label}</span>
          <span className="info-card-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
