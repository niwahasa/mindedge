import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trade, FilterState } from '@/types';
import { generateId, formatDateIso } from '@/utils/helpers';
import { useAuthStore } from './authStore';
import { supabase } from '@/lib/supabase';

interface TradeState {
  trades: Trade[];
  filters: FilterState;
  setTrades: (trades: Trade[]) => void;
  fetchTrades: () => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  addTrade: (trade: Omit<Trade, 'id' | 'userId' | 'createdAt'>) => Promise<Trade | null>;
  updateTrade: (id: string, data: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  getFilteredTrades: () => Trade[];
}

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      trades: [],
      filters: { pair: '', session: '', result: '', from: '', to: '' },

      setTrades: (trades) => set({ trades }),

      fetchTrades: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .order('traded_at', { ascending: false });

        if (error) {
          console.error('[MindEdge] fetchTrades error:', error.message);
          return;
        }

        if (data && data.length > 0) {
          set({
            trades: data.map((t) => ({
              ...t,
              userId: t.user_id,
              createdAt: t.created_at,
              tradedAt: t.traded_at,
              riskR: t.risk_amount ?? 1,
              rrRatio: t.rr_ratio ?? 2,
              emotionBefore: t.emotion_before ?? 'Calm',
              emotionAfter: t.emotion_after ?? 'Calm',
              chartLink: t.chart_link ?? null,
              mistakeTag: t.mistake_tag ?? null,
              followedPlan: t.followed_plan ?? 'yes',
              notes: t.notes ?? '',
            })) as Trade[],
          });
        }
      },

      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),

      addTrade: async (tradeData) => {
        const user = useAuthStore.getState().user;
        const userId = user?.id || '';
        const id = generateId();
        const now = new Date().toISOString();

        const trade: Trade = {
          ...tradeData,
          id,
          userId,
          createdAt: now,
        };

        // ✅ OPTIMISTIC UPDATE — show trade in dashboard immediately
        set((state) => ({ trades: [trade, ...state.trades] }));

        // 🔄 Background SQL sync
        supabase
          .from('trades')
          .insert([{
            id,
            user_id: userId,
            pair: trade.pair,
            direction: trade.direction,
            setup: trade.setup,
            session: trade.session,
            risk_amount: trade.riskR,
            rr_ratio: trade.rrRatio,
            result: trade.result,
            emotion_before: trade.emotionBefore,
            emotion_after: trade.emotionAfter,
            notes: trade.notes,
            chart_link: trade.chartLink,
            followed_plan: trade.followedPlan,
            mistake_tag: trade.mistakeTag,
            traded_at: trade.tradedAt,
            created_at: now,
          }])
          .then(({ error }) => {
            if (error) {
              console.error('[MindEdge] SQL sync failed — trade kept locally:', error.message);
            }
          });

        return trade;
      },

      updateTrade: async (id, data) => {
        // Optimistic local update
        set((state) => ({
          trades: state.trades.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));

        // Background SQL sync
        supabase
          .from('trades')
          .update({
            pair: data.pair,
            direction: data.direction,
            setup: data.setup,
            session: data.session,
            risk_amount: data.riskR,
            rr_ratio: data.rrRatio,
            result: data.result,
            emotion_before: data.emotionBefore,
            emotion_after: data.emotionAfter,
            notes: data.notes,
            chart_link: data.chartLink,
            followed_plan: data.followedPlan,
            mistake_tag: data.mistakeTag,
            traded_at: data.tradedAt,
          })
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error('[MindEdge] updateTrade SQL error:', error.message);
            }
          });
      },

      deleteTrade: async (id) => {
        // Optimistic local delete
        set((state) => ({
          trades: state.trades.filter((t) => t.id !== id),
        }));

        // Background SQL sync
        supabase
          .from('trades')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error('[MindEdge] deleteTrade SQL error:', error.message);
            }
          });
      },

      getFilteredTrades: () => {
        const { trades, filters } = get();
        return trades.filter((t) => {
          if (filters.pair && t.pair !== filters.pair) return false;
          if (filters.session && t.session !== filters.session) return false;
          if (filters.result && t.result !== filters.result) return false;
          if (filters.from && formatDateIso(new Date(t.tradedAt)) < filters.from) return false;
          if (filters.to && formatDateIso(new Date(t.tradedAt)) > filters.to) return false;
          return true;
        });
      },
    }),
    {
      name: 'mindedge_trades',
    }
  )
);
