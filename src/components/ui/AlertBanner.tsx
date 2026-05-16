import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import type { AlertItem } from '@/types';

export default function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) {
      const timer = setTimeout(() => setVisible(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [hovered, alerts]);

  useEffect(() => {
    setVisible(true);
  }, [alerts]);

  if (!visible || alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mt-4">
      {alerts.map((alert, i) => (
        <div
          key={`${alert.type}-${i}`}
          className="flex items-center gap-4 px-6 py-4 rounded-xl relative"
          style={{
            background: alert.severity === 'danger' ? 'rgba(255, 74, 107, 0.1)' : 'rgba(255, 209, 102, 0.1)',
            borderLeft: `4px solid ${alert.severity === 'danger' ? '#ff4a6b' : '#ffd166'}`,
            animation: 'card-enter 0.3s ease both',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {alert.severity === 'danger' ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#ff4a6b' }} />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#ffd166' }} />
          )}
          <p className="flex-1 text-[14px]" style={{ color: 'var(--text)' }}>{alert.message}</p>
          <button
            onClick={() => setVisible(false)}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
