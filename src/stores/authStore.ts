import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { generateId } from '@/utils/helpers';
import { useTradeStore } from './tradeStore';
import { useAnalyticsStore } from './analyticsStore';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  initializeAuth: () => void;
  register: (email: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateIdentity: (identity: string) => Promise<void>;
  updateStreak: () => Promise<void>;
}

const defaultChecklist = [
  { id: generateId(), text: 'Reviewed daily bias and higher timeframe', isDefault: true, position: 0 },
  { id: generateId(), text: 'Marked key levels (OB, FVG, Liquidity)', isDefault: true, position: 1 },
  { id: generateId(), text: 'Set max trades for today', isDefault: true, position: 2 },
  { id: generateId(), text: 'Confirmed session killzone timing', isDefault: true, position: 3 },
  { id: generateId(), text: 'Accepted I may not trade today', isDefault: true, position: 4 },
];

const defaultRules = {
  id: generateId(),
  maxTradesDay: 3,
  maxLossesDay: 2,
  pauseAfterLosses: 2,
  tradeSessions: ['London Open', 'NY Open'],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          // Query SQL registry for credentials
          const { data: registry } = await supabase
            .from('users_registry')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

          if (registry) {
            const { data: sqlUser } = await supabase
              .from('users')
              .select('*')
              .eq('email', email)
              .single();

            if (sqlUser) {
              // Map SQL columns → User type (SQL has 'streak', type has 'journalStreak')
              const now = new Date().toISOString();
              const user: User = {
                id: sqlUser.id,
                email: sqlUser.email,
                username: sqlUser.username,
                plan: (sqlUser.plan as 'free' | 'premium') || 'free',
                traderIdentity: null,
                journalStreak: sqlUser.streak ?? 1,
                longestStreak: sqlUser.streak ?? 1,
                lastActive: now,
                createdAt: sqlUser.created_at || now,
              };
              set({ user, isAuthenticated: true });
              return true;
            }
          }

          // Fallback: check localStorage for pre-migration users
          const localRegistry = JSON.parse(localStorage.getItem('mindedge_users_registry') || '[]');
          const found = localRegistry.find((u: any) => u.email === email && u.password === password);
          if (found) {
            set({ user: found.user, isAuthenticated: true });
            return true;
          }
        } catch (err) {
          console.error('[MindEdge] Login error:', err);
        }

        return false;
      },

      loginWithGoogle: async () => {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
            },
          });
          if (error) {
            console.error('[MindEdge] Google Login Error:', error.message);
          }
        } catch (err) {
          console.error('[MindEdge] Google Login Exception:', err);
        }
      },

      initializeAuth: () => {
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const { user: supaUser } = session;
            
            // Check if user exists in our SQL DB
            let { data: sqlUser } = await supabase
              .from('users')
              .select('*')
              .eq('email', supaUser.email)
              .single();

            const now = new Date().toISOString();

            if (!sqlUser) {
              // Create user in SQL if they don't exist
              const newUser = {
                id: supaUser.id,
                email: supaUser.email,
                username: supaUser.user_metadata?.full_name || supaUser.email?.split('@')[0] || 'Trader',
                plan: 'free',
                streak: 1,
                created_at: now
              };
              
              await supabase.from('users').insert([newUser]);
              sqlUser = newUser;

              const checklistItems = defaultChecklist.map(item => ({ ...item, userId: supaUser.id }));
              const rules = { ...defaultRules, userId: supaUser.id, id: generateId() };
              
              useTradeStore.getState().setTrades([]);
              useAnalyticsStore.setState({ 
                checklistItems, 
                sessionRules: rules,
                patterns: [],
                disciplineScores: [],
                coachMessages: [],
                checklistCompletions: {}
              });
            }

            const user: User = {
              id: sqlUser.id,
              email: sqlUser.email,
              username: sqlUser.username,
              plan: (sqlUser.plan as 'free' | 'premium') || 'free',
              traderIdentity: null,
              journalStreak: sqlUser.streak ?? 1,
              longestStreak: sqlUser.streak ?? 1,
              lastActive: now,
              createdAt: sqlUser.created_at || now,
            };

            set({ user, isAuthenticated: true });
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthenticated: false });
          }
        });
      },

      register: async (email, username, password) => {
        const id = generateId();
        const now = new Date().toISOString();
        const user: User = {
          id,
          email,
          username,
          plan: 'free',
          traderIdentity: null,
          journalStreak: 1,
          longestStreak: 1,
          lastActive: now,
          createdAt: now,
        };

        // 1. Sync to SQL
        const { error: userError } = await supabase.from('users').insert([{
          id,
          email,
          username,
          plan: 'free',
          streak: 1,
          created_at: now
        }]);

        if (userError) {
          console.error('SQL Registration Error:', userError);
          return false;
        }

        // Also store in a registry for simple password login (demo style)
        await supabase.from('users_registry').insert([{ email, password, user_id: id }]);

        const checklistItems = defaultChecklist.map(item => ({ ...item, userId: id }));
        const rules = { ...defaultRules, userId: id, id: generateId() };

        // Initialize other stores
        useTradeStore.getState().setTrades([]);
        useAnalyticsStore.setState({ 
          checklistItems, 
          sessionRules: rules,
          patterns: [],
          disciplineScores: [],
          coachMessages: [],
          checklistCompletions: {}
        });

        set({ user, isAuthenticated: true });
        return true;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        useTradeStore.setState({ trades: [] });
        useAnalyticsStore.setState({ 
          patterns: [], 
          disciplineScores: [], 
          coachMessages: [], 
          checklistCompletions: {} 
        });
      },

      updateProfile: async (data) => {
        const { user } = get();
        if (!user) return;
        const updated = { ...user, ...data };
        set({ user: updated });

        // Sync to SQL
        await supabase.from('users').update({
          username: updated.username,
          plan: updated.plan,
          streak: updated.journalStreak
        }).eq('id', user.id);
      },

      updateIdentity: async (identity) => {
        const { user } = get();
        if (!user) return;
        const updated = { ...user, traderIdentity: identity };
        set({ user: updated });
        
        // Sync to SQL
        await supabase.from('users').update({
          username: updated.username // Update whatever identity field you map to
        }).eq('id', user.id);
      },

      updateStreak: async () => {
        const { user } = get();
        if (!user) return;
        const today = new Date().toISOString().split('T')[0];
        const lastActive = user.lastActive.split('T')[0];
        if (lastActive === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = user.journalStreak;
        let newLongest = user.longestStreak;

        if (lastActive === yesterdayStr) {
          newStreak = user.journalStreak + 1;
          newLongest = Math.max(newLongest, newStreak);
        } else {
          newStreak = 1;
        }

        const updatedUser = {
          ...user,
          journalStreak: newStreak,
          longestStreak: newLongest,
          lastActive: new Date().toISOString(),
        };

        set({ user: updatedUser });

        // Sync to SQL
        await supabase.from('users').update({
          streak: newStreak
        }).eq('id', user.id);
      },
    }),
    {
      name: 'mindedge_auth',
    }
  )
);
