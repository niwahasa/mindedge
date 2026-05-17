export interface Trade {
  id: string;
  userId: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  setup: string;
  session: string;
  result: 'WIN' | 'LOSS' | 'BE';
  rrRatio: number;
  riskR: number;
  emotionBefore: string;
  emotionAfter: string;
  followedPlan: 'yes' | 'partial' | 'no';
  mistakeTag: string | null;
  chartLink: string | null;
  notes: string;
  tradedAt: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  plan: 'free' | 'premium';
  traderIdentity: string | null;
  journalStreak: number;
  longestStreak: number;
  lastActive: string;
  profilePic?: string | null;
  createdAt: string;
}

export interface Pattern {
  id: string;
  userId: string;
  patternText: string;
  patternType: 'good' | 'warn' | 'danger';
  confidence: number;
  dataPoints: number;
  generatedAt: string;
}

export interface DisciplineScore {
  id: string;
  userId: string;
  score: number;
  riskManagement: number;
  noRevenge: number;
  planAdherence: number;
  journalStreakPts: number;
  overtradingCtrl: number;
  weekStart: string;
}

export interface ChecklistItem {
  id: string;
  userId: string;
  text: string;
  isDefault: boolean;
  position: number;
}

export interface SessionRules {
  id: string;
  userId: string;
  maxTradesDay: number;
  maxLossesDay: number;
  pauseAfterLosses: number;
  tradeSessions: string[];
}

export interface CoachMessage {
  id: string;
  userId: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export interface DashboardStats {
  winRate: number;
  totalTrades: number;
  avgRr: number;
  totalRr: number;
  mistakeCount: number;
  bestSession: string;
  worstSession: string;
  currentStreak: number;
}

export interface TraderIdentity {
  identity: string;
  matchScore: number;
  description: string;
}

export interface FilterState {
  pair: string;
  session: string;
  result: string;
  from: string;
  to: string;
}

export interface AlertItem {
  type: string;
  message: string;
  severity: 'danger' | 'warn';
}
