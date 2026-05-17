import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pattern, DisciplineScore, ChecklistItem, SessionRules, CoachMessage, TraderIdentity, AlertItem } from '@/types';
import { generateId, calculateStats, calculateDiscipline, checkAlerts, formatDateIso } from '@/utils/helpers';
import { useTradeStore } from './tradeStore';
import { useAuthStore } from './authStore';

interface AnalyticsState {
  patterns: Pattern[];
  disciplineScores: DisciplineScore[];
  checklistItems: ChecklistItem[];
  checklistCompletions: Record<string, string[]>; // date -> completed item ids
  sessionRules: SessionRules;
  coachMessages: CoachMessage[];
  coachDailyCount: number;
  coachDailyDate: string;
  identity: TraderIdentity | null;
  patternLastGenerated: string;
  recalculateStats: () => void;
  generatePatterns: () => Promise<{ success: boolean; error?: string }>;
  calculateDisciplineScore: () => void;
  updateRules: (rules: Partial<SessionRules>) => void;
  addChecklistItem: (text: string) => void;
  removeChecklistItem: (id: string) => void;
  toggleChecklistItem: (itemId: string, date: string) => void;
  sendCoachMessage: (content: string) => Promise<void>;
  getAlerts: () => AlertItem[];
}

const defaultRules: SessionRules = {
  id: generateId(),
  userId: '',
  maxTradesDay: 3,
  maxLossesDay: 2,
  pauseAfterLosses: 2,
  tradeSessions: ['London Open', 'NY Open'],
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function getGeminiKey(): string | null {
  const authUser = useAuthStore.getState().user;
  if (authUser?.geminiApiKey) {
    return authUser.geminiApiKey;
  }
  if (authUser?.id) {
    const userKey = localStorage.getItem(`mindedge_gemini_key_${authUser.id}`);
    if (userKey) return userKey;
  }
  return localStorage.getItem('mindedge_gemini_key');
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      patterns: [],
      disciplineScores: [],
      checklistItems: [],
      checklistCompletions: {},
      sessionRules: defaultRules,
      coachMessages: [],
      coachDailyCount: 0,
      coachDailyDate: formatDateIso(new Date()),
      identity: null,
      patternLastGenerated: '',

      recalculateStats: () => {
        get().calculateDisciplineScore();
      },

      generatePatterns: async () => {
        const key = getGeminiKey();
        if (!key) return { success: false, error: 'GEMINI_KEY_MISSING' };

        const trades = useTradeStore.getState().trades;
        if (trades.length < 5) return { success: false, error: 'NEED_MORE_TRADES' };

        const lastGen = get().patternLastGenerated;
        const now = Date.now();
        if (lastGen && now - new Date(lastGen).getTime() < 60000) { // 1 min rate limit for better UX
          return { success: false, error: 'RATE_LIMITED' };
        }

        const recentTrades = trades.slice(0, 50).map(t => ({
          pair: t.pair, direction: t.direction, setup: t.setup, session: t.session,
          result: t.result, rr: t.rrRatio, emotion_before: t.emotionBefore,
          emotion_after: t.emotionAfter, followed_plan: t.followedPlan, mistake: t.mistakeTag,
        }));

        const prompt = `You are a trading psychology analyst. Analyze this trader's data and find real behavioral patterns.

TRADE DATA (${recentTrades.length} trades):
${JSON.stringify(recentTrades, null, 2)}

Find 3-5 specific, data-driven patterns. Focus on:
- Emotional state vs win rate correlations
- Session-based performance differences
- Consecutive loss behavior
- Setup performance gaps

Return ONLY a JSON array, no markdown, no explanation:
[
  { "pattern_text": "specific insight referencing actual numbers", "pattern_type": "good|warn|danger", "confidence": 85, "data_points": 12 }
]
Rules:
- Only report patterns supported by at least 3 data points
- Use specific percentages and numbers
- Be direct and actionable`;

        try {
          const res = await fetch(`${GEMINI_API_URL}?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
            }),
          });
          if (!res.ok) {
            return { success: false, error: `API_ERROR: ${res.statusText}` };
          }
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
          const clean = text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(clean);

          if (Array.isArray(parsed) && parsed.length > 0) {
            const user = useAuthStore.getState().user;
            const userId = user?.id || '';
            const newPatterns: Pattern[] = parsed.map((p: any) => ({
              id: generateId(),
              userId,
              patternText: p.pattern_text,
              patternType: p.pattern_type,
              confidence: p.confidence,
              dataPoints: p.data_points || recentTrades.length,
              generatedAt: new Date().toISOString(),
            }));
            set({ patterns: [...newPatterns, ...get().patterns].slice(0, 20), patternLastGenerated: new Date().toISOString() });
            return { success: true };
          } else {
            return { success: false, error: 'INVALID_API_RESPONSE' };
          }
        } catch (err: any) {
          return { success: false, error: err.message || 'UNEXPECTED_ERROR' };
        }
      },

      calculateDisciplineScore: () => {
        const user = useAuthStore.getState().user;
        const trades = useTradeStore.getState().trades;
        if (!user) return;

        const score = calculateDiscipline(trades, user.journalStreak);
        score.userId = user.id;

        set((state) => {
          const filtered = state.disciplineScores.filter(s => s.weekStart !== score.weekStart);
          return { disciplineScores: [...filtered, score] };
        });
      },

      updateRules: (rules) => {
        set((state) => ({
          sessionRules: { ...state.sessionRules, ...rules },
        }));
      },

      addChecklistItem: (text) => {
        const user = useAuthStore.getState().user;
        const userId = user?.id || '';
        const item: ChecklistItem = {
          id: generateId(),
          userId,
          text,
          isDefault: false,
          position: get().checklistItems.length,
        };
        set((state) => ({ checklistItems: [...state.checklistItems, item] }));
      },

      removeChecklistItem: (id) => {
        set((state) => ({ checklistItems: state.checklistItems.filter(i => i.id !== id) }));
      },

      toggleChecklistItem: (itemId, date) => {
        set((state) => {
          const completions = { ...state.checklistCompletions };
          if (!completions[date]) completions[date] = [];
          if (completions[date].includes(itemId)) {
            completions[date] = completions[date].filter(id => id !== itemId);
          } else {
            completions[date] = [...completions[date], itemId];
          }
          return { checklistCompletions: completions };
        });
      },

      sendCoachMessage: async (content) => {
        const state = get();
        const today = formatDateIso(new Date());

        // Reset daily count if new day
        let dailyCount = state.coachDailyCount;
        if (state.coachDailyDate !== today) {
          dailyCount = 0;
          set({ coachDailyDate: today, coachDailyCount: 0 });
        }

        // Save user message
        const user = useAuthStore.getState().user;
        const userId = user?.id || '';
        const userMsg: CoachMessage = {
          id: generateId(), userId, role: 'user', content, createdAt: new Date().toISOString(),
        };
        set((s) => ({ coachMessages: [...s.coachMessages, userMsg], coachDailyCount: dailyCount + 1 }));

        const key = getGeminiKey();
        if (!key) {
          const errMsg: CoachMessage = {
            id: generateId(), userId, role: 'ai',
            content: 'Please add your Gemini API key in Settings to use the AI Coach. Get a free key at aistudio.google.com',
            createdAt: new Date().toISOString(),
          };
          set((s) => ({ coachMessages: [...s.coachMessages, errMsg] }));
          return;
        }

        const trades = useTradeStore.getState().trades;
        const stats = calculateStats(trades);
        const recent = trades.slice(0, 10).map(t =>
          `${t.pair} ${t.direction} ${t.session} → ${t.result} (${t.emotionBefore})`
        ).join('\n');
        const patterns = get().patterns.slice(0, 5).map(p => `- ${p.patternText}`).join('\n');

        const systemPrompt = `You are an elite trading psychology coach inside MindEdge. You specialize in Smart Money Concepts (SMC) trading psychology.

TRADER DATA:
- Win rate: ${stats.winRate}%
- Total trades: ${stats.totalTrades}
- Average RR: ${stats.avgRr}
- Current streak: ${stats.currentStreak} days

DETECTED PATTERNS:
${patterns || 'No patterns detected yet.'}

RECENT TRADES:
${recent || 'No recent trades.'}

COACHING RULES:
- Be direct, specific, reference their actual data
- Speak SMC language naturally (OB, FVG, BOS, CHoCH, liquidity, kill zones)
- Keep responses to 2-4 sentences max
- You are a mentor not a therapist
- Never give specific trade signals or financial advice
- Push back when the trader is making excuses
- Celebrate genuine improvement`;

        try {
          console.log('Sending message to Gemini (Flash Lite)...');
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: `${systemPrompt}\n\nTRADER MESSAGE: ${content}` }]
                }
              ],
              generationConfig: { 
                temperature: 0.7, 
                maxOutputTokens: 500 
              },
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            console.error('Gemini API error:', errorData);
            throw new Error(errorData.error?.message || 'API request failed');
          }

          const data = await res.json();
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!responseText) {
            throw new Error('Empty response from AI');
          }

          const aiMsg: CoachMessage = {
            id: generateId(), 
            userId, 
            role: 'ai', 
            content: responseText,
            createdAt: new Date().toISOString(),
          };
          set((s) => ({ coachMessages: [...s.coachMessages, aiMsg] }));
        } catch (error: any) {
          console.error('Coach Error:', error);
          const errMsg: CoachMessage = {
            id: generateId(), 
            userId, 
            role: 'ai',
            content: `I apologize, I'm having trouble processing that right now. (Error: ${error.message || 'Unknown error'})`,
            createdAt: new Date().toISOString(),
          };
          set((s) => ({ coachMessages: [...s.coachMessages, errMsg] }));
        }
      },

      getAlerts: () => {
        const trades = useTradeStore.getState().trades;
        const rules = get().sessionRules;
        return checkAlerts(trades, rules);
      },
    }),
    {
      name: 'mindedge_analytics',
    }
  )
);
