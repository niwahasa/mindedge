const variantStyles: Record<string, { bg: string; color: string; border: string }> = {
  win: { bg: 'rgba(0, 229, 160, 0.15)', color: '#00e5a0', border: 'rgba(0, 229, 160, 0.3)' },
  loss: { bg: 'rgba(255, 74, 107, 0.15)', color: '#ff4a6b', border: 'rgba(255, 74, 107, 0.3)' },
  be: { bg: 'rgba(255, 209, 102, 0.15)', color: '#ffd166', border: 'rgba(255, 209, 102, 0.3)' },
  warning: { bg: 'rgba(255, 107, 74, 0.15)', color: '#ff6b4a', border: 'rgba(255, 107, 74, 0.3)' },
  info: { bg: 'rgba(0, 184, 255, 0.15)', color: '#00b8ff', border: 'rgba(0, 184, 255, 0.3)' },
  good: { bg: 'rgba(0, 229, 160, 0.15)', color: '#00e5a0', border: 'rgba(0, 229, 160, 0.3)' },
  danger: { bg: 'rgba(255, 74, 107, 0.15)', color: '#ff4a6b', border: 'rgba(255, 74, 107, 0.3)' },
};

export default function Badge({ children, variant = 'info', className = '' }: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  const styles = variantStyles[variant] || variantStyles.info;
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-md font-micro ${className}`}
      style={{ background: styles.bg, color: styles.color, border: `1px solid ${styles.border}` }}
    >
      {children}
    </span>
  );
}
