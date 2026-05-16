import { useMemo } from 'react';
import { BarChart3, Lock } from 'lucide-react';
import { useTradeStore } from '@/stores/tradeStore';
import { groupBySetup, groupByDayOfWeek, groupBySession, groupByPair } from '@/utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const SESSION_NAMES = ['London Open', 'NY Open', 'Asian', 'London Close'];

export default function Analytics() {
  const trades = useTradeStore((s) => s.trades);

  const setupData = useMemo(() => {
    const groups = groupBySetup(trades);
    return Object.entries(groups)
      .map(([setup, stats]) => ({
        setup,
        trades: stats.total,
        winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0,
        avgRr: stats.total > 0 ? Math.round((stats.totalRr / stats.total) * 10) / 10 : 0,
        edgeScore: stats.total > 0 && (stats.wins / stats.total) >= 0.6 && (stats.totalRr / stats.total) >= 2 ? 'STRONG'
          : stats.total > 0 && ((stats.wins / stats.total) >= 0.5 || (stats.totalRr / stats.total) >= 1.5) ? 'MODERATE' : 'WEAK',
      }))
      .sort((a, b) => {
        const scoreOrder = { STRONG: 0, MODERATE: 1, WEAK: 2 };
        return scoreOrder[a.edgeScore as keyof typeof scoreOrder] - scoreOrder[b.edgeScore as keyof typeof scoreOrder];
      });
  }, [trades]);

  const dayData = useMemo(() => {
    const groups = groupByDayOfWeek(trades);
    return DAYS.map(day => {
      const g = groups[day] || { wins: 0, total: 0 };
      return { day, winRate: g.total > 0 ? Math.round((g.wins / g.total) * 100) : 0, trades: g.total };
    });
  }, [trades]);

  const sessionData = useMemo(() => {
    const groups = groupBySession(trades);
    return SESSION_NAMES.map(session => {
      const stats = groups[session] || { wins: 0, total: 0, totalRr: 0 };
      const wr = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
      return {
        session,
        winRate: wr,
        avgRr: stats.total > 0 ? Math.round((stats.totalRr / stats.total) * 10) / 10 : 0,
        totalRr: Math.round(stats.totalRr * 10) / 10,
        tradeCount: stats.total,
        isBest: wr >= 60,
        isWorst: wr < 40 && stats.total > 0,
      };
    });
  }, [trades]);

  const pairData = useMemo(() => {
    const groups = groupByPair(trades);
    return Object.entries(groups)
      .map(([pair, stats]) => ({
        pair,
        totalRr: Math.round(stats.totalRr * 10) / 10,
        tradeCount: stats.count,
        winRate: stats.count > 0 ? Math.round((stats.wins / stats.count) * 100) : 0,
      }))
      .sort((a, b) => Math.abs(b.totalRr) - Math.abs(a.totalRr));
  }, [trades]);

  const bestDay = dayData.reduce((a, b) => a.winRate > b.winRate && a.trades > 0 ? a : b, dayData[0]);
  const worstDay = dayData.reduce((a, b) => a.winRate < b.winRate && a.trades > 0 ? a : b, dayData[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-7 h-7" style={{ color: 'var(--accent2)' }} />
        <div>
          <h1 className="font-display" style={{ color: 'var(--text)' }}>Performance Analytics</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text2)' }}>Data-driven insights into your trading edge</p>
        </div>
      </div>

      {/* Setup Performance Table */}
      <Card accentColor="#00e5a0">
        <div className="p-6">
          <span className="font-micro" style={{ color: 'var(--text2)' }}>SETUP PERFORMANCE</span>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['SETUP', 'TRADES', 'WIN RATE', 'AVG RR', 'EDGE SCORE'].map(h => (
                    <th key={h} className="font-micro text-left pb-3 pr-4" style={{ color: 'var(--text2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {setupData.map((s) => (
                  <tr
                    key={s.setup}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#161d26'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="py-3 pr-4 text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{s.setup}</td>
                    <td className="py-3 pr-4 font-data-sm" style={{ color: 'var(--text2)' }}>{s.trades}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${s.winRate}%`, background: s.winRate >= 60 ? '#00e5a0' : s.winRate >= 40 ? '#ffd166' : '#ff4a6b' }} />
                        </div>
                        <span className="font-data-sm" style={{ color: s.winRate >= 60 ? '#00e5a0' : s.winRate >= 40 ? '#ffd166' : '#ff4a6b' }}>{s.winRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-data-sm" style={{ color: 'var(--accent2)' }}>{s.avgRr}</td>
                    <td className="py-3">
                      <Badge variant={s.edgeScore === 'STRONG' ? 'good' : s.edgeScore === 'MODERATE' ? 'warning' : 'danger'}>{s.edgeScore}</Badge>
                    </td>
                  </tr>
                ))}
                {setupData.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-[14px]" style={{ color: 'var(--text3)' }}>No setup data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Day of Week Chart */}
      <Card accentColor="#00b8ff">
        <div className="p-6">
          <span className="font-micro" style={{ color: 'var(--text2)' }}>DAY OF WEEK</span>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData} barSize={40}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#7a8c9e' }} axisLine={{ stroke: '#1e2730' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#4a5a6a' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#141920', border: '1px solid #252f3a', borderRadius: '8px', fontSize: '13px', fontFamily: 'Syne' }} />
                <ReferenceLine y={50} stroke="#4a5a6a" strokeDasharray="4 4" />
                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                  {dayData.map((entry, index) => (
                    <Cell key={index} fill={entry.winRate >= 60 ? '#00e5a0' : entry.winRate >= 40 ? '#ffd166' : entry.trades > 0 ? '#ff4a6b' : '#1e2730'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[14px] mt-4" style={{ color: 'var(--text2)' }}>
            Your best day is {bestDay?.day || '-'} ({bestDay?.winRate || 0}%) and your worst is {worstDay?.day || '-'} ({worstDay?.winRate || 0}%).
          </p>
        </div>
      </Card>

      {/* Session Deep Dive */}
      <Card>
        <div className="p-6">
          <span className="font-micro" style={{ color: 'var(--text2)' }}>SESSION DEEP DIVE</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {sessionData.map((s) => (
              <Card
                key={s.session}
                accentColor={s.isBest ? '#00e5a0' : s.isWorst ? '#ff4a6b' : undefined}
                style={{ border: `1px solid ${s.isBest ? '#00e5a040' : s.isWorst ? '#ff4a6b40' : 'var(--border)'}` }}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-card-title" style={{ color: 'var(--text)' }}>{s.session}</h3>
                    {s.isBest && <Badge variant="good">BEST</Badge>}
                    {s.isWorst && <Badge variant="danger">WORST</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-micro" style={{ color: 'var(--text2)' }}>WIN RATE</span>
                      <p className="font-data-md mt-1" style={{ color: s.winRate >= 50 ? '#00e5a0' : '#ff4a6b' }}>{s.winRate}%</p>
                    </div>
                    <div>
                      <span className="font-micro" style={{ color: 'var(--text2)' }}>AVG R:R</span>
                      <p className="font-data-md mt-1" style={{ color: 'var(--accent2)' }}>{s.avgRr}</p>
                    </div>
                    <div>
                      <span className="font-micro" style={{ color: 'var(--text2)' }}>TOTAL P&L</span>
                      <p className="font-data-md mt-1" style={{ color: s.totalRr >= 0 ? '#00e5a0' : '#ff4a6b' }}>{s.totalRr >= 0 ? '+' : ''}{s.totalRr}R</p>
                    </div>
                    <div>
                      <span className="font-micro" style={{ color: 'var(--text2)' }}>TRADES</span>
                      <p className="font-data-md mt-1" style={{ color: 'var(--text)' }}>{s.tradeCount}</p>
                    </div>
                  </div>
                  <div className="h-1 rounded-full mt-4 overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${s.winRate}%`, background: s.winRate >= 50 ? '#00e5a0' : '#ff4a6b' }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {/* Pair Performance */}
      <Card accentColor="#00e5a0">
        <div className="p-6">
          <span className="font-micro" style={{ color: 'var(--text2)' }}>PAIR PERFORMANCE</span>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pairData} layout="vertical" barSize={28}>
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#4a5a6a' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="pair" type="category" tick={{ fontSize: 12, fontFamily: 'JetBrains Mono', fill: '#7a8c9e' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ background: '#141920', border: '1px solid #252f3a', borderRadius: '8px', fontSize: '13px', fontFamily: 'Syne' }} />
                <Bar dataKey="totalRr" radius={[0, 4, 4, 0]}>
                  {pairData.map((entry, index) => (
                    <Cell key={index} fill={entry.totalRr >= 0 ? '#00e5a0' : '#ff4a6b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Time of Day Heatmap Placeholder */}
      <Card accentColor="#4a5a6a">
        <div className="p-6">
          <span className="font-micro" style={{ color: 'var(--text3)' }}>TIME OF DAY</span>
          {trades.length < 50 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-sm" style={{ background: 'var(--border)', opacity: 0.3 + (i % 3) * 0.1, animation: `pulse-dot ${2 + (i % 3)}s ease-in-out infinite`, animationDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-8 h-8" style={{ color: 'var(--text3)' }} />
                </div>
              </div>
              <h3 className="font-section" style={{ color: 'var(--text3)' }}>Unlock at 50+ trades</h3>
              <p className="text-[14px] mt-2" style={{ color: 'var(--text3)' }}>Log more trades to see your performance by hour and day of week</p>
              <div className="mt-4 w-48">
                <div className="h-1 rounded-full" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min((trades.length / 50) * 100, 100)}%`, background: 'var(--accent2)' }} />
                </div>
                <span className="font-data-sm mt-1 block text-center" style={{ color: 'var(--text3)' }}>{trades.length}/50 trades</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center py-8 text-[14px]" style={{ color: 'var(--text2)' }}>Time of day heatmap coming soon with more data...</div>
          )}
        </div>
      </Card>
    </div>
  );
}
