import { useAuthStore } from '@/stores/authStore';
import { useTradeStore } from '@/stores/tradeStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { formatDateIso } from '@/utils/helpers';

export function usePlanLimits() {
  const user = useAuthStore((s) => s.user);
  const trades = useTradeStore((s) => s.trades);
  const { coachDailyCount, patterns } = useAnalyticsStore();

  const isPremium = user?.plan === 'premium';

  const canAddTrade = () => {
    if (isPremium) return true;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const tradesThisMonth = trades.filter(t => {
      const d = new Date(t.tradedAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    
    return tradesThisMonth < 5;
  };

  const canUseCoach = () => {
    if (isPremium) return true;
    return coachDailyCount < 20;
  };

  const canRefreshPatterns = () => {
    if (isPremium) return true;
    
    // For demo, we check if they've generated any today
    const today = formatDateIso(new Date());
    const generatedToday = patterns.filter(p => p.generatedAt.split('T')[0] === today).length;
    
    return generatedToday < 3;
  };

  return {
    isPremium,
    canAddTrade: canAddTrade(),
    canUseCoach: canUseCoach(),
    canRefreshPatterns: canRefreshPatterns(),
    limits: {
      maxTrades: 5,
      maxCoachMessages: 20,
      maxPatternRefreshes: 3
    }
  };
}
