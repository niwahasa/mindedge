import { useMemo } from 'react';
import { Brain, Crosshair, ZapOff, TrendingUp, Target, RefreshCw, Sparkles } from 'lucide-react';
import { useTradeStore } from '@/stores/tradeStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { groupByEmotion, groupByMistake } from '@/utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const EMOTIONS = ['Calm', 'Confident', 'Frustrated', 'Anxious', 'Neutral'];
const MISTAKE_COLORS = ['#ff4a6b', '#ff6b4a', '#ffd166', '#00b8ff', '#4a5a6a'];

const IDENTITY_CARDS = [
  { name: 'The Sniper', icon: Crosshair, color: '#00e5a0', desc: 'Patient, waits for A+ setups, disciplined' },
  { name: 'The Revenge Trader', icon: ZapOff, color: '#ff4a6b', desc: 'Emotional after losses, impulsive entries' },
  { name: 'The Overthinker', icon: Brain, color: '#ffd166', desc: 'Misses entries, analysis paralysis' },
  { name: 'The FOMO Chaser', icon: TrendingUp, color: '#ff6b4a', desc: 'Late entries, chases momentum' },
  { name: 'The Disciplined Scalper', icon: Target, color: '#00b8ff', desc: 'Consistent, rule-based, high frequency' },
];

export default function Psychology() {
  const trades = useTradeStore((s) => s.trades);
  const patterns = useAnalyticsStore((s) => s.patterns);
  const generatePatterns = useAnalyticsStore((s) => s.generatePatterns);

  const emotionData = useMemo(() => {
    const groups = groupByEmotion(trades);
    return EMOTIONS.map(emotion => {
      const g = groups[emotion] || { wins: 0, total: 0 };
      const wr = g.total > 0 ? Math.round((g.wins / g.total) * 100) : 0;
      return { emotion, winRate: wr, trades: g.total };
    });
  }, [trades]);

  const mistakeData = useMemo(() => {
    const groups = groupByMistake(trades);
    return Object.entries(groups).map(([name, count]) => ({ name, count }));
  }, [trades]);

  const allPatterns = useMemo(() => [...patterns].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()), [patterns]);

  const insight = useMemo(() => {
    const best = emotionData.reduce((a, b) => a.winRate > b.winRate ? a : b, emotionData[0]);
    const worst = emotionData.reduce((a, b) => a.winRate < b.winRate && a.trades > 0 ? a : b, emotionData[0]);
    if (!best || best.winRate === 0) return 'Log more trades to see emotion-based insights.';
    return `You perform best when ${best.emotion.toLowerCase()} (${best.winRate}% WR) and worst when ${worst.emotion.toLowerCase()} (${worst.winRate}% WR).`;
  }, [emotionData]);

  // ✅ Dynamically calculate Trader Identity match scores based on real trade performance & behaviors!
  const identityScores = useMemo(() => {
    if (trades.length === 0) {
      return {
        activeIdentity: '-',
        scores: {
          'The Sniper': 0,
          'The Revenge Trader': 0,
          'The Overthinker': 0,
          'The FOMO Chaser': 0,
          'The Disciplined Scalper': 0,
        }
      };
    }

    const total = trades.length;
    
    // 1. Sniper Score: High Plan Adherence + Patience
    const followedPlanCount = trades.filter(t => t.followedPlan === 'yes').length;
    const planAdherence = (followedPlanCount / total) * 100;
    const wins = trades.filter(t => t.result === 'WIN').length;
    const winRate = (wins / total) * 100;
    const sniperScore = Math.round((planAdherence * 0.6) + (winRate * 0.4));

    // 2. Revenge Trader Score: Frequent "Revenge Trade" mistakes
    const revengeMistakes = trades.filter(t => t.mistakeTag === 'Revenge Trade').length;
    const revengeScore = Math.round(Math.min((revengeMistakes / Math.max(1, total)) * 100 * 3, 100));

    // 3. Overthinker Score: Anxious before / after
    const anxiousTrades = trades.filter(t => t.emotionBefore === 'Anxious' || t.emotionAfter === 'Anxious').length;
    const overthinkerScore = Math.round(Math.min((anxiousTrades / total) * 100 * 1.5, 100));

    // 4. FOMO Chaser Score: FOMO / Impulsive Entry mistakes
    const fomoMistakes = trades.filter(t => t.mistakeTag === 'FOMO' || t.mistakeTag === 'Impulsive Entry').length;
    const fomoScore = Math.round(Math.min((fomoMistakes / Math.max(1, total)) * 100 * 3, 100));

    // 5. Disciplined Scalper Score: Plan Adherence + High Volume (scaled by total trades)
    const volumeFactor = Math.min((total / 15) * 100, 100); // 15+ trades is active scalper range
    const scalperScore = Math.round((planAdherence * 0.5) + (volumeFactor * 0.5));

    const scores = {
      'The Sniper': sniperScore,
      'The Revenge Trader': revengeScore,
      'The Overthinker': overthinkerScore,
      'The FOMO Chaser': fomoScore,
      'The Disciplined Scalper': scalperScore,
    };

    // Determine highest scoring active identity (must be at least 15% to be prominent)
    let activeIdentity = '-';
    let maxScore = 14;
    Object.entries(scores).forEach(([name, score]) => {
      if (score > maxScore) {
        maxScore = score;
        activeIdentity = name;
      }
    });

    return { activeIdentity, scores };
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Brain className="w-7 h-7" style={{ color: 'var(--accent3)' }} />
          <h1 className="font-display" style={{ color: 'var(--text)' }}>Trading Psychology</h1>
        </div>
        <p className="text-[14px] mt-1" style={{ color: 'var(--text2)' }}>Understand your emotional patterns and behavioral edges</p>
      </div>

      {/* Emotion Performance Chart */}
      <Card accentColor="#00b8ff">
        <div className="p-6">
          <span className="font-micro" style={{ color: 'var(--text2)' }}>EMOTION vs WIN RATE</span>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData} barSize={48}>
                <XAxis dataKey="emotion" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#7a8c9e' }} axisLine={{ stroke: '#1e2730' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#4a5a6a' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#141920', border: '1px solid #252f3a', borderRadius: '8px', fontSize: '13px', fontFamily: 'Syne' }}
                  labelStyle={{ color: '#e8edf2' }}
                  formatter={(value: number, _name: string, props: any) => [`${value}% win rate (${props.payload.trades} trades)`, 'Win Rate']}
                />
                <ReferenceLine y={50} stroke="#4a5a6a" strokeDasharray="4 4" />
                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                  {emotionData.map((entry, index) => (
                    <Cell key={index} fill={entry.winRate >= 60 ? '#00e5a0' : entry.winRate >= 40 ? '#ffd166' : '#ff4a6b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[14px] mt-4" style={{ color: 'var(--text2)' }}>{insight}</p>
        </div>
      </Card>

      {/* Trader Identity */}
      <Card>
        <div className="p-6">
          <span className="font-micro" style={{ color: 'var(--text2)' }}>TRADER IDENTITY</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            {IDENTITY_CARDS.map((idCard) => {
              const Icon = idCard.icon;
              const score = identityScores.scores[idCard.name as keyof typeof identityScores.scores] || 0;
              const isActive = identityScores.activeIdentity === idCard.name && score > 0;
              return (
                <div
                  key={idCard.name}
                  className="p-5 rounded-xl text-center transition-all"
                  style={{
                    background: 'var(--surface)',
                    border: `2px solid ${isActive ? '#00e5a0' : 'var(--border)'}`,
                    boxShadow: isActive ? '0 0 20px rgba(0, 229, 160, 0.1)' : 'none',
                  }}
                >
                  {isActive && <span className="font-micro px-2 py-0.5 rounded mb-2 inline-block" style={{ background: 'rgba(0, 229, 160, 0.15)', color: '#00e5a0' }}>Current Identity</span>}
                  <Icon className="w-10 h-10 mx-auto" style={{ color: idCard.color }} />
                  <h3 className="font-card-title mt-3" style={{ color: 'var(--text)' }}>{idCard.name}</h3>
                  <p className="font-data-md mt-2" style={{ color: 'var(--accent2)' }}>{score}%</p>
                  <p className="text-[12px] mt-2 leading-relaxed" style={{ color: 'var(--text2)' }}>{idCard.desc}</p>
                  <div className="h-1 rounded-full mt-3 overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: 'var(--accent2)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Behavioral Patterns Grid */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-micro" style={{ color: 'var(--text2)' }}>BEHAVIORAL PATTERNS</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent2)' }} />
                <span className="font-micro" style={{ color: 'var(--accent2)' }}>AI</span>
              </div>
              <button
                onClick={() => generatePatterns()}
                className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text2)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; }}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Analysis
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allPatterns.map((pattern, i) => (
              <div
                key={pattern.id}
                className="p-5 rounded-xl animate-card-enter"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${pattern.patternType === 'good' ? 'rgba(0, 229, 160, 0.3)' : pattern.patternType === 'warn' ? 'rgba(255, 209, 102, 0.3)' : 'rgba(255, 74, 107, 0.3)'}`,
                  borderLeft: `4px solid ${pattern.patternType === 'good' ? '#00e5a0' : pattern.patternType === 'warn' ? '#ffd166' : '#ff4a6b'}`,
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={pattern.patternType}>{pattern.patternType.toUpperCase()}</Badge>
                  <span className="font-data-sm" style={{ color: 'var(--text2)' }}>{pattern.confidence}% confidence</span>
                </div>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text)' }}>{pattern.patternText}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-micro" style={{ color: 'var(--text3)' }}>Based on {pattern.dataPoints} trades</span>
                  <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pattern.confidence}%`, background: pattern.patternType === 'good' ? '#00e5a0' : pattern.patternType === 'warn' ? '#ffd166' : '#ff4a6b' }} />
                  </div>
                </div>
              </div>
            ))}
            {allPatterns.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl" style={{ background: 'var(--border)' }} />
                <h3 className="font-section mb-2" style={{ color: 'var(--text)' }}>No patterns detected yet</h3>
                <p className="text-[14px]" style={{ color: 'var(--text2)' }}>Log at least 10 trades to enable AI pattern analysis</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Mistake Breakdown */}
      <Card accentColor="#ff4a6b">
        <div className="p-6">
          <span className="font-micro" style={{ color: 'var(--text2)' }}>MISTAKE BREAKDOWN</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {/* Donut Chart */}
            <div className="flex flex-col items-center">
              {mistakeData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={mistakeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="count"
                        animationDuration={800}
                      >
                        {mistakeData.map((_, index) => (
                          <Cell key={index} fill={MISTAKE_COLORS[index % MISTAKE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#141920', border: '1px solid #252f3a', borderRadius: '8px', fontSize: '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <span className="font-data-lg" style={{ color: 'var(--text)' }}>{trades.filter(t => t.mistakeTag).length}</span>
                  <span className="font-micro" style={{ color: 'var(--text2)' }}>MISTAKES</span>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[220px]">
                  <span className="text-[32px] mb-2">🎉</span>
                  <p className="text-[14px] font-medium" style={{ color: '#00e5a0' }}>No mistakes logged</p>
                </div>
              )}
            </div>

            {/* Mistake List */}
            <div className="space-y-3">
              {mistakeData.map((m, i) => (
                <div key={m.name} className="animate-card-enter" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: MISTAKE_COLORS[i % MISTAKE_COLORS.length] }} />
                    <span className="flex-1 text-[14px]" style={{ color: 'var(--text)' }}>{m.name}</span>
                    <span className="font-data-sm px-2 py-0.5 rounded" style={{ background: 'var(--surface2)' }}>{m.count}</span>
                  </div>
                  <div className="h-1 rounded-full mt-2 overflow-hidden ml-5" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((m.count / Math.max(...mistakeData.map(d => d.count))) * 100, 100)}%`, background: MISTAKE_COLORS[i % MISTAKE_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
