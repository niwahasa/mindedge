import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import Card from './Card';

interface PaywallProps {
  title?: string;
  description?: string;
  feature?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export default function Paywall({
  title = "Premium Feature",
  description = "Upgrade to MindEdge Premium to unlock this feature and take your trading to the next level.",
  feature,
  isModal = false,
  onClose
}: PaywallProps) {
  const navigate = useNavigate();

  const content = (
    <div className="text-center p-8 space-y-6 animate-card-enter">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-accent" />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-display text-text">{title}</h2>
        {feature && (
          <p className="font-micro text-accent mt-2 tracking-widest uppercase">{feature}</p>
        )}
        <p className="text-text2 mt-4 max-w-md mx-auto">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/membership')}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-accent text-bg font-bold transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5" />
          Upgrade Now
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-lg bg-surface2 text-text2 font-medium transition-all hover:text-text"
          >
            Maybe Later
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-[12px] text-text3 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          Unlimited Trades
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          AI Trading Coach
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          Advanced Analytics
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          Custom Strategies
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative">
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-text3 hover:text-text transition-colors"
            >
              <Lock className="w-5 h-5" />
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return (
    <Card accentColor="var(--accent)" className="max-w-2xl mx-auto">
      {content}
    </Card>
  );
}
