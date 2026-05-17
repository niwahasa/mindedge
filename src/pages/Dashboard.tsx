import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Sparkles, RefreshCw, Plus, X, Camera } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTradeStore } from '@/stores/tradeStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { calculateStats, groupBySession, getHeatmapData } from '@/utils/helpers';
import { useCountUp } from '@/hooks';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ScoreRing from '@/components/ui/ScoreRing';
import AlertBanner from '@/components/ui/AlertBanner';
import { toast } from 'sonner';
import type { Trade } from '@/types';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const trades = useTradeStore((s) => s.trades);
  const disciplineScores = useAnalyticsStore((s) => s.disciplineScores);
  const patterns = useAnalyticsStore((s) => s.patterns);
  const checklistItems = useAnalyticsStore((s) => s.checklistItems);
  const checklistCompletions = useAnalyticsStore((s) => s.checklistCompletions);
  const toggleChecklistItem = useAnalyticsStore((s) => s.toggleChecklistItem);
  const addChecklistItem = useAnalyticsStore((s) => s.addChecklistItem);
  const generatePatterns = useAnalyticsStore((s) => s.generatePatterns);
  const getAlerts = useAnalyticsStore((s) => s.getAlerts);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await updateProfile({ profilePic: base64 });
        toast.success('Successfully uploaded profile picture!');
      } catch (err) {
        toast.error('Failed to upload profile picture.');
      }
    };
    reader.readAsDataURL(file);
  };

  const stats = useMemo(() => calculateStats(trades), [trades]);
  const discipline = useMemo(() => {
    const weekStart = new Date().toISOString().split('T')[0];
    return disciplineScores.find(s => s.weekStart <= weekStart) || {
      score: 0, riskManagement: 0, noRevenge: 0, planAdherence: 0, journalStreakPts: 0, overtradingCtrl: 0
    };
  }, [disciplineScores]);
  const alerts = useMemo(() => getAlerts(), [trades]);
  const sessionStats = useMemo(() => groupBySession(trades), [trades]);
  const heatmapData = useMemo(() => getHeatmapData(trades), [trades]);
  const today = new Date().toISOString().split('T')[0];
  const todayCompletions = checklistCompletions[today] || [];
  const recentTrades = [...trades].sort((a, b) => new Date(b.tradedAt).getTime() - new Date(a.tradedAt).getTime()).slice(0, 5);
  const topPatterns = [...patterns].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()).slice(0, 3);

  return (
    <div className="space-y-6">
      <AlertBanner alerts={alerts} />

      {/* Welcome & Profile Upload Banner */}
      <Card accentColor="var(--accent2)">
        <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full sm:w-auto">
            {/* Profile Photo Upload Widget */}
            <div className="relative group flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent transition-transform duration-300 group-hover:scale-105" style={{ background: 'var(--surface2)' }}>
                {user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-[22px] font-bold"
                    style={{ background: 'rgba(0, 184, 255, 0.15)', color: 'var(--accent2)' }}
                  >
                    {user?.username?.slice(0, 2).toUpperCase() || 'ME'}
                  </div>
                )}
              </div>
              {/* Upload Overlay */}
              <label className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-4 h-4 text-white mb-0.5" />
                <span className="text-[9px] text-white font-semibold uppercase tracking-wider">Change</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h2 className="text-xl font-display text-text">Welcome back, {user?.username}!</h2>
              <p className="text-[14px]" style={{ color: 'var(--text2)' }}>
                Keep your focus sharp. You are currently on a{' '}
                <span className="text-accent font-semibold">{user?.journalStreak || 1} day streak</span> 🔥
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="font-micro" style={{ color: 'var(--text3)' }}>ACCOUNT LEVEL</span>
            <Badge variant={user?.plan === 'premium' ? 'good' : 'neutral'}>
              {user?.plan?.toUpperCase() || 'FREE'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="WIN RATE" value={stats.winRate} suffix="%" color="#00e5a0" trend={+5} />
        <StatCard label="AVG R:R" value={stats.avgRr} color="#00b8ff" trend={+0.3} />
        <StatCard label="DISCIPLINE" value={discipline.score} color="#ffd166" trend={-2} />
        <StatCard label="MISTAKES THIS WEEK" value={stats.mistakeCount} color="#ff4a6b" trend={null} subtext={stats.mistakeCount > 0 ? `Most common: Revenge Trade` : undefined} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-5">
          {/* Discipline Score Card */}
          <Card accentColor="#ffd166">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex flex-col items-center gap-4">
                  <ScoreRing value={discipline.score} />
                  {user?.traderIdentity ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ background: 'rgba(0, 184, 255, 0.15)', border: '1px solid rgba(0, 184, 255, 0.3)' }}>
                      <Sparkles className="w-4 h-4" style={{ color: 'var(--accent2)' }} />
                      <span className="font-card-title text-[14px]" style={{ color: 'var(--accent2)' }}>{user.traderIdentity}</span>
                    </div>
                  ) : (
                    <span className="text-[13px]" style={{ color: 'var(--text3)' }}>Analyzing...</span>
                  )}
                </div>
                <div className="flex-1 w-full space-y-4">
                  {[
                    { label: 'RISK MGMT', value: discipline.riskManagement, max: 100, color: '#00e5a0' },
                    { label: 'NO REVENGE', value: discipline.noRevenge, max: 100, color: '#00e5a0' },
                    { label: 'PLAN ADHERENCE', value: discipline.planAdherence, max: 100, color: '#00b8ff' },
                    { label: 'STREAK', value: discipline.journalStreakPts, max: 100, color: '#ffd166' },
                    { label: 'NO OVERTRADE', value: discipline.overtradingCtrl, max: 100, color: '#ff6b4a' },
                  ].map((bar, i) => (
                    <div key={bar.label} className="animate-card-enter" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="flex justify-between mb-1">
                        <span className="font-micro" style={{ color: 'var(--text2)' }}>{bar.label}</span>
                        <span className="font-data-sm" style={{ color: bar.color }}>{bar.value}/{bar.max}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((bar.value / bar.max) * 100, 100)}%`,
                            background: bar.color,
                            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                            transitionDelay: `${i * 100}ms`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Trades Table */}
          <Card accentColor="#00b8ff">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-micro" style={{ color: 'var(--text2)' }}>RECENT TRADES</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['PAIR', 'DIR', 'SETUP', 'SESSION', 'P&L'].map((h) => (
                        <th key={h} className="font-micro text-left pb-3 pr-4" style={{ color: 'var(--text2)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((trade, i) => (
                      <RecentTradeRow key={trade.id} trade={trade} index={i} />
                    ))}
                    {recentTrades.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[14px]" style={{ color: 'var(--text3)' }}>
                          No trades logged yet. Click "Log Trade" to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5">
          {/* Checklist Card */}
          <Card accentColor="#00e5a0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-micro" style={{ color: 'var(--text2)' }}>PRE-SESSION CHECKLIST</span>
                <span className="font-data-sm" style={{ color: 'var(--text2)' }}>{todayCompletions.length}/{checklistItems.length}</span>
              </div>
              <div className="h-0.5 rounded-full mb-4" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${checklistItems.length ? (todayCompletions.length / checklistItems.length) * 100 : 0}%`,
                    background: 'var(--accent)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div className="space-y-1">
                {checklistItems.sort((a, b) => a.position - b.position).map((item) => {
                  const completed = todayCompletions.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id, today)}
                      className="flex items-center gap-3 w-full py-2.5 px-1 text-left group transition-colors rounded-lg"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: completed ? 'var(--accent)' : 'transparent',
                          border: `2px solid ${completed ? 'var(--accent)' : 'var(--border2)'}`,
                        }}
                      >
                        {completed && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#080b0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-[14px] transition-all"
                        style={{
                          color: completed ? 'var(--text3)' : 'var(--text)',
                          textDecoration: completed ? 'line-through' : 'none',
                        }}
                      >
                        {item.text}
                      </span>
                    </button>
                  );
                })}
              </div>
              <ChecklistAddForm onAdd={(text) => addChecklistItem(text)} />
            </div>
          </Card>

          {/* Patterns Card */}
          <Card accentColor="#ff6b4a">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-micro" style={{ color: 'var(--text2)' }}>YOUR PATTERNS</span>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent2)' }} />
                  <span className="font-micro" style={{ color: 'var(--accent2)' }}>AI</span>
                </div>
              </div>
              <div className="space-y-3">
                {topPatterns.map((pattern, i) => (
                  <div
                    key={pattern.id}
                    className="p-4 rounded-lg animate-card-enter"
                    style={{
                      background: 'var(--surface2)',
                      border: `1px solid ${pattern.patternType === 'good' ? 'rgba(0, 229, 160, 0.3)' : pattern.patternType === 'warn' ? 'rgba(255, 209, 102, 0.3)' : 'rgba(255, 74, 107, 0.3)'}`,
                      borderLeft: `3px solid ${pattern.patternType === 'good' ? '#00e5a0' : pattern.patternType === 'warn' ? '#ffd166' : '#ff4a6b'}`,
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={pattern.patternType}>{pattern.patternType.toUpperCase()}</Badge>
                      <span className="font-data-sm" style={{ color: 'var(--text2)' }}>{pattern.confidence}% confidence</span>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text)' }}>{pattern.patternText}</p>
                    <div className="h-1 rounded-full mt-3 overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pattern.confidence}%`,
                          background: pattern.patternType === 'good' ? '#00e5a0' : pattern.patternType === 'warn' ? '#ffd166' : '#ff4a6b',
                          transition: 'width 0.5s ease',
                          transitionDelay: `${i * 60 + 200}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {topPatterns.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-[14px] mb-2" style={{ color: 'var(--text3)' }}>No patterns detected yet</p>
                    <p className="text-[12px]" style={{ color: 'var(--text3)' }}>Log at least 5 trades to enable analysis</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="font-micro" style={{ color: 'var(--text3)' }}>
                  {patterns.length > 0 ? `Last analyzed: recently` : 'Not analyzed yet'}
                </span>
                <button
                  onClick={() => generatePatterns()}
                  className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text2)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>
            </div>
          </Card>

          {/* Session Performance */}
          <Card accentColor="#00b8ff">
            <div className="p-6">
              <span className="font-micro" style={{ color: 'var(--text2)' }}>SESSION PERFORMANCE</span>
              <div className="mt-4 space-y-3">
                {Object.entries(sessionStats).sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total)).map(([session, stats]) => {
                  const wr = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
                  const isBest = wr >= 60;
                  const isWorst = wr < 40 && stats.total > 0;
                  return (
                    <div key={session} className="flex items-center gap-3">
                      <span className="font-data-sm w-[100px] flex-shrink-0 truncate" style={{ color: isBest ? '#00e5a0' : isWorst ? '#ff4a6b' : 'var(--text2)' }}>{session}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${wr}%`,
                            background: isBest ? '#00e5a0' : isWorst ? '#ff4a6b' : 'linear-gradient(90deg, var(--accent2), var(--accent))',
                            minWidth: stats.total > 0 ? '4px' : '0',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                      <span className="font-data-sm w-[50px] text-right" style={{ color: 'var(--text)' }}>{wr}%</span>
                      <span className="font-micro w-[30px] text-right" style={{ color: 'var(--text3)' }}>({stats.total})</span>
                    </div>
                  );
                })}
                {Object.keys(sessionStats).length === 0 && (
                  <p className="text-[13px] py-4 text-center" style={{ color: 'var(--text3)' }}>No session data yet</p>
                )}
              </div>
            </div>
          </Card>

          {/* Consistency Heatmap */}
          <Card accentColor="#00e5a0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-micro" style={{ color: 'var(--text2)' }}>CONSISTENCY</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'Less', color: 'var(--bg)' },
                    { label: '', color: 'rgba(0, 229, 160, 0.2)' },
                    { label: '', color: 'rgba(0, 229, 160, 0.4)' },
                    { label: '', color: 'rgba(0, 229, 160, 0.6)' },
                    { label: 'More', color: 'rgba(0, 229, 160, 0.9)' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1">
                      {item.label && <span className="font-micro mr-1" style={{ color: 'var(--text3)' }}>{item.label}</span>}
                      <div className="w-3.5 h-3.5 rounded-sm" style={{ background: item.color }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-12 gap-[3px]">
                {heatmapData.map((cell, i) => (
                  <div
                    key={i}
                    className="w-3.5 h-3.5 rounded-sm relative group"
                    style={{
                      background: cell.level === '' ? 'var(--bg)' :
                        cell.level === 'l1' ? 'rgba(0, 229, 160, 0.2)' :
                        cell.level === 'l2' ? 'rgba(0, 229, 160, 0.4)' :
                        cell.level === 'l3' ? 'rgba(0, 229, 160, 0.6)' :
                        cell.level === 'l4' ? 'rgba(0, 229, 160, 0.9)' :
                        cell.level === 'bad' ? '#ff4a6b' :
                        cell.level === 'warn' ? '#ffd166' : 'var(--bg)',
                      transition: 'opacity 0.15s',
                      animation: `card-enter 0.15s ease both`,
                      animationDelay: `${Math.floor(i / 12) * 12 + (i % 12)} * 5ms`,
                    }}
                    title={`${cell.date}: ${cell.trades} trades`}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix = '', color, trend, subtext }: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  trend: number | null;
  subtext?: string;
}) {
  const animatedValue = useCountUp(value, 600);

  return (
    <Card accentColor={color}>
      <div className="p-6">
        <span className="font-micro" style={{ color: 'var(--text2)' }}>{label}</span>
        <div className="font-data-lg mt-2" style={{ color }}>
          {animatedValue}{suffix}
        </div>
        {trend !== null && (
          <div className="flex items-center gap-1 mt-2">
            {trend > 0 ? (
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#00e5a0' }} />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" style={{ color: '#ff4a6b' }} />
            )}
            <span className="font-data-sm" style={{ color: trend > 0 ? '#00e5a0' : '#ff4a6b' }}>
              {trend > 0 ? '+' : ''}{trend}{suffix === '%' ? '%' : ''} vs last week
            </span>
          </div>
        )}
        {subtext && (
          <p className="font-data-sm mt-2" style={{ color: 'var(--text2)' }}>{subtext}</p>
        )}
      </div>
    </Card>
  );
}

function RecentTradeRow({ trade, index }: { trade: Trade; index: number }) {
  const pl = trade.result === 'WIN' ? `+${trade.rrRatio}R` : trade.result === 'LOSS' ? `-${trade.riskR}R` : '0R';
  return (
    <tr
      className="group transition-colors"
      style={{
        borderBottom: '1px solid var(--border)',
        animation: 'card-enter 0.3s ease both',
        animationDelay: `${index * 40}ms`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#161d26'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          {trade.mistakeTag && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ff6b4a' }} title={trade.mistakeTag} />}
          <span className="font-data-sm font-semibold" style={{ color: 'var(--text)' }}>{trade.pair}</span>
        </div>
      </td>
      <td className="py-3 pr-4">
        <span className={`font-micro flex items-center gap-1 ${trade.direction === 'BUY' ? 'text-[#00e5a0]' : 'text-[#ff4a6b]'}`}>
          {trade.direction === 'BUY' ? '↑' : '↓'} {trade.direction}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className="font-data-sm truncate max-w-[100px] block" style={{ color: 'var(--text2)' }}>{trade.setup}</span>
      </td>
      <td className="py-3 pr-4">
        <span className="font-micro px-2 py-0.5 rounded" style={{ background: 'var(--surface2)' }}>{trade.session}</span>
      </td>
      <td className="py-3">
        <span className="font-data-sm font-semibold" style={{ color: trade.result === 'WIN' ? '#00e5a0' : trade.result === 'LOSS' ? '#ff4a6b' : '#ffd166' }}>
          {pl}
        </span>
      </td>
    </tr>
  );
}

function ChecklistAddForm({ onAdd }: { onAdd: (text: string) => void }) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
    setShow(false);
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 mt-3 text-[14px] transition-colors"
        style={{ color: 'var(--accent)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#33eab3'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
      >
        <Plus className="w-4 h-4" />
        Add custom item
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="New checklist item..."
        className="flex-1 text-[14px] px-3 py-2 rounded-lg outline-none"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        autoFocus
      />
      <button
        onClick={handleAdd}
        className="px-3 py-2 rounded-lg text-[12px] font-semibold"
        style={{ background: 'var(--accent)', color: '#080b0f' }}
      >
        Add
      </button>
      <button
        onClick={() => { setShow(false); setText(''); }}
        className="p-2 rounded-lg"
        style={{ color: 'var(--text3)' }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
