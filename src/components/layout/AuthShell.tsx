import { Search, AlertTriangle, Sparkles } from 'lucide-react';

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2" style={{ background: 'var(--bg)' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-center items-center p-12" style={{ background: 'linear-gradient(135deg, var(--bg) 0%, var(--surface) 100%)' }}>
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[28px] font-bold" style={{ fontFamily: 'Syne', color: 'var(--text)' }}>Mind</span>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <span className="text-[28px] font-bold" style={{ fontFamily: 'Syne', color: 'var(--accent)' }}>Edge</span>
          </div>
          <p className="font-section mb-10" style={{ color: 'var(--text)' }}>
            The Operating System for Disciplined Traders
          </p>

          {/* Feature Cards */}
          <div className="flex flex-col gap-5">
            <FeatureCard
              icon={<Search className="w-6 h-6" style={{ color: 'var(--accent)' }} />}
              title="Pattern Detection"
              desc="AI finds behavioral patterns you can't see yourself"
            />
            <FeatureCard
              icon={<AlertTriangle className="w-6 h-6" style={{ color: 'var(--accent)' }} />}
              title="Behavioral Alerts"
              desc="Get warned before emotional mistakes happen"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" style={{ color: 'var(--accent)' }} />}
              title="AI Coaching"
              desc="Personalized coaching based on your actual trading data"
            />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-[400px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }} className="flex items-start gap-4">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <h3 className="font-card-title" style={{ color: 'var(--text)' }}>{title}</h3>
        <p className="text-[14px] mt-1" style={{ color: 'var(--text2)' }}>{desc}</p>
      </div>
    </div>
  );
}
