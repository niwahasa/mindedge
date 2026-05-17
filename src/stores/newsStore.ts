import { create } from 'zustand';
import type { EconomicEvent } from '@/types';

interface NewsState {
  events: EconomicEvent[];
  isLoading: boolean;
  error: string | null;
  fetchCalendar: (force?: boolean) => Promise<void>;
  lastFetched: string | null;
}

const FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(FEED_URL)}`;

export const useNewsStore = create<NewsState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchCalendar: async (force = false) => {
    const { lastFetched, isLoading } = get();
    
    // Avoid double fetching or duplicate requests unless forced or outdated
    const now = new Date();
    if (isLoading) return;
    if (!force && lastFetched) {
      const lastTime = new Date(lastFetched);
      const diffMs = now.getTime() - lastTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 4) { // Only fetch every 4 hours max to avoid rate limits
        return;
      }
    }

    set({ isLoading: true, error: null });

    try {
      // Try direct fetch first
      const response = await fetch(FEED_URL);
      if (!response.ok) {
        throw new Error('Direct fetch failed');
      }
      const data = await response.json();
      set({ events: data, lastFetched: new Date().toISOString(), isLoading: false });
    } catch (directErr) {
      console.log('[MindEdge News] Direct fetch failed or CORS blocked. Trying proxy...', directErr);
      try {
        // Fallback to stable CORS proxy
        const response = await fetch(PROXY_URL);
        if (!response.ok) {
          throw new Error('Proxy fetch failed');
        }
        const data = await response.json();
        set({ events: data, lastFetched: new Date().toISOString(), isLoading: false });
      } catch (proxyErr) {
        console.error('[MindEdge News] Failed to load economic calendar:', proxyErr);
        set({ 
          error: 'Failed to retrieve live economic news calendar.', 
          isLoading: false 
        });
      }
    }
  }
}));
