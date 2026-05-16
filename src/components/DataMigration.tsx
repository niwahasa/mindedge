import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function DataMigration() {
  const user = useAuthStore((s) => s.user);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    const migrate = async () => {
      if (!user) return;

      // Check if migration has already happened
      const migrationFlag = localStorage.getItem(`mindedge_migrated_${user.id}`);
      if (migrationFlag) return;

      // Get local trades
      const localData = localStorage.getItem('mindedge_trades');
      if (!localData) {
        localStorage.setItem(`mindedge_migrated_${user.id}`, 'true');
        return;
      }

      try {
        const { state } = JSON.parse(localData);
        const localTrades = state?.trades || [];

        if (localTrades.length > 0) {
          setMigrating(true);
          toast.info('Syncing your local trades to the cloud...');

          // Prepare for SQL
          const tradesToUpload = localTrades.map((t: any) => ({
            id: t.id,
            user_id: user.id,
            pair: t.pair,
            direction: t.direction,
            setup: t.setup,
            session: t.session,
            risk_amount: t.riskAmount,
            rr_ratio: t.rrRatio,
            result: t.result,
            emotion_before: t.emotionBefore,
            emotion_after: t.emotionAfter,
            notes: t.notes,
            chart_link: t.chartLink,
            traded_at: t.tradedAt,
            created_at: t.createdAt
          }));

          // Upsert to SQL
          const { error } = await supabase.from('trades').upsert(tradesToUpload);

          if (error) throw error;

          toast.success('All trades synced to the cloud!');
        }

        localStorage.setItem(`mindedge_migrated_${user.id}`, 'true');
      } catch (err) {
        console.error('Migration failed:', err);
        toast.error('Failed to sync local data to the cloud.');
      } finally {
        setMigrating(false);
      }
    };

    migrate();
  }, [user]);

  if (!migrating) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <div className="bg-accent text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
        SYNCING DATA...
      </div>
    </div>
  );
}
