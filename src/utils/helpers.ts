import type { Trade, DisciplineScore, DashboardStats, AlertItem, SessionRules } from '@/types';

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateIso(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function getGreetingTime(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

export function getTradingSession(): { name: string; color: string } {
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 8) return { name: 'ASIAN SESSION', color: '#ffd166' };
  if (hour >= 8 && hour < 16) return { name: 'LONDON SESSION', color: '#00e5a0' };
  if (hour >= 16 && hour < 21) return { name: 'NEW YORK SESSION', color: '#00b8ff' };
  return { name: 'MARKET CLOSED', color: '#4a5a6a' };
}

export function calculateStats(trades: Trade[]): DashboardStats {
  if (trades.length === 0) {
    return { winRate: 0, totalTrades: 0, avgRr: 0, totalRr: 0, mistakeCount: 0, bestSession: '-', worstSession: '-', currentStreak: 0 };
  }

  const wins = trades.filter(t => t.result === 'WIN').length;
  const winRate = Math.round((wins / trades.length) * 100);
  const avgRr = Math.round((trades.reduce((a, t) => a + t.rrRatio, 0) / trades.length) * 10) / 10;
  const totalRr = Math.round(trades.reduce((a, t) => a + (t.result === 'WIN' ? t.rrRatio : t.result === 'LOSS' ? -t.riskR : 0), 0) * 10) / 10;
  const mistakeCount = trades.filter(t => t.mistakeTag).length;

  // Session performance
  const sessionStats: Record<string, { wins: number; total: number }> = {};
  trades.forEach(t => {
    if (!sessionStats[t.session]) sessionStats[t.session] = { wins: 0, total: 0 };
    sessionStats[t.session].total++;
    if (t.result === 'WIN') sessionStats[t.session].wins++;
  });

  let bestSession = '-';
  let worstSession = '-';
  let bestRate = -1;
  let worstRate = 101;

  Object.entries(sessionStats).forEach(([session, stats]) => {
    const rate = (stats.wins / stats.total) * 100;
    if (rate > bestRate) { bestRate = rate; bestSession = session; }
    if (rate < worstRate) { worstRate = rate; worstSession = session; }
  });

  // Current streak (consecutive winning days)
  const byDate = groupByDate(trades);
  const dates = Object.keys(byDate).sort().reverse();
  let currentStreak = 0;
  for (const date of dates) {
    const dayTrades = byDate[date];
    const dayWins = dayTrades.filter(t => t.result === 'WIN').length;
    const dayLosses = dayTrades.filter(t => t.result === 'LOSS').length;
    if (dayWins > dayLosses) currentStreak++;
    else break;
  }

  return { winRate, totalTrades: trades.length, avgRr, totalRr, mistakeCount, bestSession, worstSession, currentStreak };
}

export function calculateDiscipline(trades: Trade[], streak: number): DisciplineScore {
  const weekStart = formatDateIso(getMonday(new Date()));
  const weekTrades = trades.filter(t => {
    const tDate = new Date(t.tradedAt);
    const monday = getMonday(new Date());
    return tDate >= monday;
  });

  if (weekTrades.length === 0) {
    return { id: generateId(), userId: '', score: 0, riskManagement: 0, noRevenge: 0, planAdherence: 0, journalStreakPts: 0, overtradingCtrl: 0, weekStart };
  }

  const avgRisk = weekTrades.reduce((a, t) => a + t.riskR, 0) / weekTrades.length;
  const riskScore = avgRisk <= 2 ? 25 : Math.max(0, 25 - (avgRisk - 2) * 10);

  const revengeTrades = weekTrades.filter(t => t.mistakeTag === 'Revenge Trade').length;
  const revengeScore = Math.max(0, 25 - revengeTrades * 8);

  const followedCount = weekTrades.filter(t => t.followedPlan === 'yes').length;
  const planScore = Math.round((followedCount / weekTrades.length) * 25);

  const streakScore = Math.min(15, streak * 1.5);

  const overtrades = weekTrades.filter(t => t.mistakeTag === 'Overtrading').length;
  const overtradingScore = Math.max(0, 10 - overtrades * 3);

  const total = Math.round(riskScore + revengeScore + planScore + streakScore + overtradingScore);

  return {
    id: generateId(),
    userId: '',
    score: total,
    riskManagement: Math.round(riskScore * 4),
    noRevenge: Math.round(revengeScore * 4),
    planAdherence: Math.round(planScore * 4),
    journalStreakPts: Math.round(streakScore * (100 / 15)),
    overtradingCtrl: Math.round(overtradingScore * 10),
    weekStart,
  };
}

export function checkAlerts(trades: Trade[], rules: SessionRules): AlertItem[] {
  const alerts: AlertItem[] = [];
  const recent = [...trades].sort((a, b) => new Date(b.tradedAt).getTime() - new Date(a.tradedAt).getTime()).slice(0, 5);

  // Consecutive losses
  let consecutiveLosses = 0;
  for (const t of recent) {
    if (t.result === 'LOSS') consecutiveLosses++;
    else break;
  }

  if (consecutiveLosses >= rules.pauseAfterLosses) {
    alerts.push({
      type: 'consecutive_losses',
      message: `You've lost ${consecutiveLosses} trades in a row. Your data shows revenge trades spike here.`,
      severity: 'danger',
    });
  }

  // Trades today
  const today = formatDateIso(new Date());
  const tradesToday = trades.filter(t => formatDateIso(new Date(t.tradedAt)) === today).length;
  if (tradesToday >= rules.maxTradesDay) {
    alerts.push({
      type: 'max_trades',
      message: `You've hit your daily trade limit of ${rules.maxTradesDay}. Close the charts.`,
      severity: 'warn',
    });
  }

  return alerts;
}

export function groupBySession(trades: Trade[]): Record<string, { wins: number; total: number; totalRr: number }> {
  const groups: Record<string, { wins: number; total: number; totalRr: number }> = {};
  trades.forEach(t => {
    if (!groups[t.session]) groups[t.session] = { wins: 0, total: 0, totalRr: 0 };
    groups[t.session].total++;
    if (t.result === 'WIN') groups[t.session].wins++;
    groups[t.session].totalRr += t.result === 'WIN' ? t.rrRatio : t.result === 'LOSS' ? -t.riskR : 0;
  });
  return groups;
}

export function groupByEmotion(trades: Trade[]): Record<string, { wins: number; total: number }> {
  const groups: Record<string, { wins: number; total: number }> = {};
  trades.forEach(t => {
    if (!groups[t.emotionBefore]) groups[t.emotionBefore] = { wins: 0, total: 0 };
    groups[t.emotionBefore].total++;
    if (t.result === 'WIN') groups[t.emotionBefore].wins++;
  });
  return groups;
}

export function groupBySetup(trades: Trade[]): Record<string, { wins: number; total: number; totalRr: number }> {
  const groups: Record<string, { wins: number; total: number; totalRr: number }> = {};
  trades.forEach(t => {
    if (!groups[t.setup]) groups[t.setup] = { wins: 0, total: 0, totalRr: 0 };
    groups[t.setup].total++;
    if (t.result === 'WIN') groups[t.setup].wins++;
    groups[t.setup].totalRr += t.result === 'WIN' ? t.rrRatio : t.result === 'LOSS' ? -t.riskR : 0;
  });
  return groups;
}

export function groupByDayOfWeek(trades: Trade[]): Record<string, { wins: number; total: number }> {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const groups: Record<string, { wins: number; total: number }> = {};
  days.forEach(d => groups[d] = { wins: 0, total: 0 });
  trades.forEach(t => {
    const day = new Date(t.tradedAt).getDay();
    const dayName = days[day === 0 ? 0 : day - 1];
    if (dayName) {
      groups[dayName].total++;
      if (t.result === 'WIN') groups[dayName].wins++;
    }
  });
  return groups;
}

export function groupByPair(trades: Trade[]): Record<string, { totalRr: number; count: number; wins: number }> {
  const groups: Record<string, { totalRr: number; count: number; wins: number }> = {};
  trades.forEach(t => {
    if (!groups[t.pair]) groups[t.pair] = { totalRr: 0, count: 0, wins: 0 };
    groups[t.pair].count++;
    groups[t.pair].totalRr += t.result === 'WIN' ? t.rrRatio : t.result === 'LOSS' ? -t.riskR : 0;
    if (t.result === 'WIN') groups[t.pair].wins++;
  });
  return groups;
}

export function groupByMistake(trades: Trade[]): Record<string, number> {
  const groups: Record<string, number> = {};
  trades.filter(t => t.mistakeTag).forEach(t => {
    groups[t.mistakeTag!] = (groups[t.mistakeTag!] || 0) + 1;
  });
  return groups;
}

export function groupByDate(trades: Trade[]): Record<string, Trade[]> {
  const groups: Record<string, Trade[]> = {};
  trades.forEach(t => {
    const date = formatDateIso(new Date(t.tradedAt));
    if (!groups[date]) groups[date] = [];
    groups[date].push(t);
  });
  return groups;
}

export function getHeatmapData(trades: Trade[]): { date: string; level: string; trades: number; profitable: boolean }[] {
  const byDate = groupByDate(trades);
  const result: { date: string; level: string; trades: number; profitable: boolean }[] = [];
  const today = new Date();

  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateIso(d);
    const dayTrades = byDate[dateStr] || [];
    const count = dayTrades.length;

    if (count === 0) {
      result.push({ date: dateStr, level: '', trades: 0, profitable: false });
      continue;
    }

    const netR = dayTrades.reduce((a, t) => a + (t.result === 'WIN' ? t.rrRatio : t.result === 'LOSS' ? -t.riskR : 0), 0);
    let level = 'l1';
    if (count >= 4) level = 'l4';
    else if (count === 3) level = 'l3';
    else if (count === 2) level = 'l2';

    const profitable = netR > 0;
    const isWarn = netR === 0;
    const isBad = netR < 0;

    result.push({ date: dateStr, level: isBad ? 'bad' : isWarn ? 'warn' : level, trades: count, profitable });
  }

  return result;
}

export function exportTradesToCsv(trades: Trade[]): string {
  const headers = ['Date', 'Pair', 'Direction', 'Setup', 'Session', 'Result', 'RR', 'Risk', 'Emotion Before', 'Emotion After', 'Followed Plan', 'Mistake', 'Notes', 'Chart Link'];
  const rows = trades.map(t => [
    t.tradedAt, t.pair, t.direction, t.setup, t.session, t.result, t.rrRatio, t.riskR,
    t.emotionBefore, t.emotionAfter, t.followedPlan, t.mistakeTag || '', t.notes, t.chartLink || ''
  ]);
  return [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
}

export function generateSeedTrades(userId: string): Trade[] {
  const now = new Date();
  // Seed data defined below

  const seedData: Partial<Trade>[] = [
    { pair: 'XAUUSD', direction: 'BUY', setup: 'BOS + OB Retest', session: 'London Open', result: 'WIN', rrRatio: 2.5, emotionBefore: 'Calm', emotionAfter: 'Calm', followedPlan: 'yes', mistakeTag: null },
    { pair: 'EURUSD', direction: 'SELL', setup: 'CHoCH + FVG Fill', session: 'NY Open', result: 'LOSS', rrRatio: -1, emotionBefore: 'Frustrated', emotionAfter: 'Frustrated', followedPlan: 'no', mistakeTag: 'Revenge Trade' },
    { pair: 'GBPUSD', direction: 'BUY', setup: 'Liquidity Sweep', session: 'London Open', result: 'WIN', rrRatio: 3.0, emotionBefore: 'Confident', emotionAfter: 'Confident', followedPlan: 'yes', mistakeTag: null },
    { pair: 'XAUUSD', direction: 'SELL', setup: 'Kill Zone Entry', session: 'NY Open', result: 'WIN', rrRatio: 2.0, emotionBefore: 'Calm', emotionAfter: 'Calm', followedPlan: 'yes', mistakeTag: null },
    { pair: 'USDJPY', direction: 'BUY', setup: 'Range EQ', session: 'Asian', result: 'LOSS', rrRatio: -1, emotionBefore: 'Anxious', emotionAfter: 'Anxious', followedPlan: 'partial', mistakeTag: 'Early Entry' },
    { pair: 'GBPJPY', direction: 'SELL', setup: 'BOS + OB Retest', session: 'London Open', result: 'WIN', rrRatio: 1.8, emotionBefore: 'Calm', emotionAfter: 'Calm', followedPlan: 'yes', mistakeTag: null },
    { pair: 'XAUUSD', direction: 'BUY', setup: 'IFVG', session: 'NY Open', result: 'LOSS', rrRatio: -1, emotionBefore: 'Frustrated', emotionAfter: 'Frustrated', followedPlan: 'no', mistakeTag: 'Revenge Trade' },
    { pair: 'EURUSD', direction: 'SELL', setup: 'Premium/Discount Array', session: 'London Close', result: 'WIN', rrRatio: 2.2, emotionBefore: 'Neutral', emotionAfter: 'Calm', followedPlan: 'yes', mistakeTag: null },
    { pair: 'AUDUSD', direction: 'BUY', setup: 'SMT Divergence', session: 'NY Open', result: 'BE', rrRatio: 0, emotionBefore: 'Calm', emotionAfter: 'Calm', followedPlan: 'yes', mistakeTag: null },
    { pair: 'XAUUSD', direction: 'SELL', setup: 'CHoCH + FVG Fill', session: 'London Open', result: 'WIN', rrRatio: 2.8, emotionBefore: 'Confident', emotionAfter: 'Confident', followedPlan: 'yes', mistakeTag: null },
    { pair: 'GBPUSD', direction: 'BUY', setup: 'Liquidity Sweep', session: 'NY Open', result: 'LOSS', rrRatio: -1, emotionBefore: 'Anxious', emotionAfter: 'Frustrated', followedPlan: 'no', mistakeTag: 'FOMO' },
    { pair: 'USDJPY', direction: 'SELL', setup: 'BOS + OB Retest', session: 'Asian', result: 'WIN', rrRatio: 1.5, emotionBefore: 'Calm', emotionAfter: 'Calm', followedPlan: 'yes', mistakeTag: null },
    { pair: 'EURUSD', direction: 'BUY', setup: 'Kill Zone Entry', session: 'London Open', result: 'WIN', rrRatio: 2.0, emotionBefore: 'Confident', emotionAfter: 'Confident', followedPlan: 'yes', mistakeTag: null },
    { pair: 'XAUUSD', direction: 'SELL', setup: 'Range EQ', session: 'NY Lunch', result: 'LOSS', rrRatio: -1, emotionBefore: 'Frustrated', emotionAfter: 'Frustrated', followedPlan: 'no', mistakeTag: 'Moved Stop Loss' },
    { pair: 'GBPJPY', direction: 'BUY', setup: 'IFVG', session: 'London Open', result: 'WIN', rrRatio: 3.5, emotionBefore: 'Calm', emotionAfter: 'Calm', followedPlan: 'yes', mistakeTag: null },
  ];

  return seedData.map((data, i) => {
    const daysAgo = [3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 5, 6, 6, 7][i] || 0;
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(8 + (i % 8), (i * 7) % 60);

    return {
      id: generateId(),
      userId,
      riskR: 1,
      emotionAfter: data.emotionBefore || 'Calm',
      chartLink: null,
      notes: i % 3 === 0 ? `Clean ${data.setup} setup` : '',
      createdAt: d.toISOString(),
      tradedAt: d.toISOString(),
      ...data,
    } as Trade;
  });
}
