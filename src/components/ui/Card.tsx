export default function Card({
  children,
  accentColor,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-xl transition-all duration-200 ${className}`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: accentColor ? `3px solid ${accentColor}` : '1px solid var(--border)',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border2)';
        e.currentTarget.style.background = '#161d26';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = accentColor ? `${accentColor}40` : 'var(--border)';
        e.currentTarget.style.background = 'var(--surface)';
      }}
    >
      {children}
    </div>
  );
}
