import { ReactNode } from 'react';

interface SectionProps {
  id: string;
  title: string;
  num?: string;
  children: ReactNode;
}

export default function Section({ id, title, num, children }: SectionProps) {
  return (
    <section id={id} style={{ marginBottom: '2.5rem', scrollMarginTop: '1.5rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        {num && (
          <span style={{
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            flexShrink: 0,
          }}>{num}</span>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}
