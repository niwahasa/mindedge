import { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, ClipboardCheck, Crown, Download, Check, ChevronDown, X, GripVertical } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { useTradeStore } from '@/stores/tradeStore';
import { exportTradesToCsv } from '@/utils/helpers';
import Card from '@/components/ui/Card';

const SESSION_OPTIONS = ['London Open', 'NY Open', 'Asian', 'London Close', 'NY Lunch', 'Pre-Market'];

export default function Settings() {
  return (
    <div className="max-w-[800px] mx-auto space-y-5">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-7 h-7" style={{ color: 'var(--text2)' }} />
        <h1 className="font-display" style={{ color: 'var(--text)' }}>Settings</h1>
      </div>

      <ProfileSection />
      <TradingRulesSection />
      <ChecklistManagerSection />
      <PlanSection />
      <DataExportSection />
    </div>
  );
}

function SectionCard({ title, icon: Icon, accentColor, children }: {
  title: string; icon: React.ElementType; accentColor: string; children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card accentColor={accentColor}>
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full p-6 pb-0"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
            <span className="font-card-title" style={{ color: 'var(--text)' }}>{title}</span>
          </div>
          <ChevronDown
            className="w-5 h-5 transition-transform duration-200"
            style={{ color: 'var(--text3)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
        <div
          className="overflow-hidden transition-all duration-250"
          style={{ maxHeight: expanded ? '2000px' : '0', opacity: expanded ? 1 : 0 }}
        >
          <div className="p-6 pt-4">{children}</div>
        </div>
      </div>
    </Card>
  );
}

function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile({ username, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Profile" icon={User} accentColor="#00b8ff">
      <div className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <button onClick={handleSave} className="px-4 py-2.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5" style={{ background: 'var(--accent)', color: '#080b0f' }}>
            {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : 'Save'}
          </button>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <button onClick={handleSave} className="px-4 py-2.5 rounded-lg text-[12px] font-semibold" style={{ background: 'var(--accent)', color: '#080b0f' }}>Save</button>
        </div>
      </div>
    </SectionCard>
  );
}

function TradingRulesSection() {
  const rules = useAnalyticsStore((s) => s.sessionRules);
  const updateRules = useAnalyticsStore((s) => s.updateRules);

  return (
    <SectionCard title="Trading Rules" icon={Shield} accentColor="#ff6b4a">
      <div className="space-y-5">
        {[
          { label: 'Max Trades Per Day', key: 'maxTradesDay', desc: 'Alert when you reach this limit', min: 1, max: 20 },
          { label: 'Max Losses Per Day', key: 'maxLossesDay', desc: 'Daily loss tolerance', min: 1, max: 10 },
          { label: 'Pause After Consecutive Losses', key: 'pauseAfterLosses', desc: 'Trigger behavioral alert after this many losses in a row', min: 1, max: 5 },
        ].map((field) => (
          <div key={field.key}>
            <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>{field.label}</label>
            <input
              type="number"
              min={field.min}
              max={field.max}
              value={(rules as any)[field.key]}
              onChange={(e) => updateRules({ [field.key]: parseInt(e.target.value) || field.min })}
              className="w-32 text-[14px] px-3 py-2.5 rounded-lg outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>{field.desc}</p>
          </div>
        ))}
        <div>
          <label className="font-micro block mb-3" style={{ color: 'var(--text2)' }}>PREFERRED TRADING SESSIONS</label>
          <div className="flex flex-wrap gap-2">
            {SESSION_OPTIONS.map((session) => (
              <button
                key={session}
                onClick={() => {
                  const current = rules.tradeSessions;
                  const updated = current.includes(session) ? current.filter(s => s !== session) : [...current, session];
                  updateRules({ tradeSessions: updated });
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all"
                style={{
                  background: rules.tradeSessions.includes(session) ? 'rgba(0, 229, 160, 0.15)' : 'var(--surface2)',
                  border: `1px solid ${rules.tradeSessions.includes(session) ? 'var(--accent)' : 'var(--border)'}`,
                  color: rules.tradeSessions.includes(session) ? 'var(--accent)' : 'var(--text)',
                }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center transition-all"
                  style={{
                    background: rules.tradeSessions.includes(session) ? 'var(--accent)' : 'transparent',
                    border: `2px solid ${rules.tradeSessions.includes(session) ? 'var(--accent)' : 'var(--border2)'}`,
                  }}
                >
                  {rules.tradeSessions.includes(session) && (
                    <Check className="w-2.5 h-2.5" style={{ color: '#080b0f' }} />
                  )}
                </div>
                {session}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function ChecklistManagerSection() {
  const items = useAnalyticsStore((s) => s.checklistItems);
  const addItem = useAnalyticsStore((s) => s.addChecklistItem);
  const removeItem = useAnalyticsStore((s) => s.removeChecklistItem);
  const [newItem, setNewItem] = useState('');

  return (
    <SectionCard title="Pre-Session Checklist" icon={ClipboardCheck} accentColor="#00e5a0">
      <div className="space-y-2">
        {items.sort((a, b) => a.position - b.position).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
            style={{ background: 'var(--surface2)' }}
          >
            <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text3)' }} />
            <span className="flex-1 text-[14px]" style={{ color: 'var(--text)' }}>{item.text}</span>
            {item.isDefault ? (
              <span className="font-micro px-1.5 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--text3)' }}>DEFAULT</span>
            ) : (
              <button onClick={() => removeItem(item.id)} className="p-1 rounded" style={{ color: 'var(--text3)' }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newItem.trim()) { addItem(newItem.trim()); setNewItem(''); } }}
            placeholder="New checklist item..."
            className="flex-1 text-[14px] px-3 py-2 rounded-lg outline-none"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <button
            onClick={() => { if (newItem.trim()) { addItem(newItem.trim()); setNewItem(''); } }}
            className="px-3 py-2 rounded-lg text-[12px] font-semibold"
            style={{ background: 'var(--accent)', color: '#080b0f' }}
          >
            Add
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function PlanSection() {
  return (
    <SectionCard title="Your Plan" icon={Crown} accentColor="#ffd166">
      <div className="flex flex-col items-center py-4">
        <div
          className="px-6 py-3 rounded-full flex items-center gap-2"
          style={{ background: 'rgba(255, 209, 102, 0.15)', border: '1px solid rgba(255, 209, 102, 0.3)' }}
        >
          <Crown className="w-5 h-5" style={{ color: '#ffd166' }} />
          <span className="font-card-title text-[16px]" style={{ color: '#ffd166' }}>PREMIUM</span>
        </div>
        <p className="text-[14px] mt-3" style={{ color: 'var(--text2)' }}>All features unlocked</p>

        <div className="w-full mt-6 space-y-3">
          {[
            'Unlimited trade logging',
            'Unlimited AI coach messages',
            'Unlimited pattern analysis',
            'Advanced analytics',
            'Data export (CSV)',
            'Priority support',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#00e5a0' }} />
              <span className="text-[14px]" style={{ color: 'var(--text)' }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function DataExportSection() {
  const trades = useTradeStore((s) => s.trades);
  const user = useAuthStore((s) => s.user);
  const [apiKey, setApiKey] = useState(localStorage.getItem('mindedge_gemini_key') || '');
  const [saved, setSaved] = useState(false);

  const handleExport = () => {
    const csv = exportTradesToCsv(trades);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindedge-trades-${user?.username || 'user'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveKey = () => {
    localStorage.setItem('mindedge_gemini_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Data Export" icon={Download} accentColor="#00e5a0">
      <div className="space-y-5">
        <p className="text-[14px]" style={{ color: 'var(--text2)' }}>
          Download all your trade data as a CSV file for external analysis.
        </p>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-3 rounded-lg text-[14px] font-semibold transition-all hover:brightness-110"
          style={{ background: 'var(--accent)', color: '#080b0f' }}
        >
          <Download className="w-4 h-4" />
          Export Trades (CSV)
        </button>

        {/* CSV Preview */}
        {trades.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[11px]" style={{ color: 'var(--text3)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left pb-2 pr-2">Date</th>
                  <th className="text-left pb-2 pr-2">Pair</th>
                  <th className="text-left pb-2 pr-2">Dir</th>
                  <th className="text-left pb-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 3).map((t) => (
                  <tr key={t.id}>
                    <td className="py-1 pr-2">{t.tradedAt.split('T')[0]}</td>
                    <td className="py-1 pr-2">{t.pair}</td>
                    <td className="py-1 pr-2">{t.direction}</td>
                    <td className="py-1">{t.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Gemini API Key */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>GEMINI API KEY</label>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
                Get a free key from{' '}
                <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent2)' }}>aistudio.google.com</a>
              </p>
            </div>
            <button
              onClick={handleSaveKey}
              className="px-4 py-2.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5"
              style={{ background: saved ? 'rgba(0, 229, 160, 0.2)' : 'var(--accent)', color: saved ? '#00e5a0' : '#080b0f' }}
            >
              {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
