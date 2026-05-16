import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RotateCcw, TrendingUp, Clock, Activity } from 'lucide-react';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { useTradeStore } from '@/stores/tradeStore';
import { calculateStats } from '@/utils/helpers';
import { useAuthStore } from '@/stores/authStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import Paywall from '@/components/ui/Paywall';

const SUGGESTED_PROMPTS = [
  { text: 'Why do I keep revenge trading?', icon: RotateCcw },
  { text: 'What\'s my strongest setup?', icon: TrendingUp },
  { text: 'When should I stop trading for the day?', icon: Clock },
  { text: 'Analyze my last losing streak', icon: Activity },
];

export default function AICoach() {
  const messages = useAnalyticsStore((s) => s.coachMessages);
  const sendMessage = useAnalyticsStore((s) => s.sendCoachMessage);
  const dailyCount = useAnalyticsStore((s) => s.coachDailyCount);
  const trades = useTradeStore((s) => s.trades);
  const patterns = useAnalyticsStore((s) => s.patterns);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stats = calculateStats(trades);
  const { isPremium, canUseCoach } = usePlanLimits();

  if (!isPremium) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Paywall 
          title="Unlock AI Trading Coach"
          description="Get personalized psychological insights, strategy reviews, and performance optimization tips from our advanced AI."
          feature="AI Coaching & Behavioral Analysis"
        />
      </div>
    );
  }

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setInput('');
    setIsTyping(true);
    await sendMessage(text);
    setIsTyping(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="h-[calc(100vh-128px)] flex flex-col lg:flex-row gap-4 -mx-6 lg:-mx-8 -my-6 lg:-my-8 px-6 lg:px-8 py-6 lg:py-8">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--bg)' }}>
        {/* Chat Header */}
        <div className="flex items-center justify-between h-14 px-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--accent2)' }} />
            <span className="font-section text-[18px]" style={{ color: 'var(--text)' }}>AI Coach</span>
          </div>
          <div className="flex items-center gap-3">
            {isTyping && <span className="text-[12px] animate-pulse" style={{ color: 'var(--text2)' }}>Analyzing your data...</span>}
            <span className="font-data-sm" style={{ color: 'var(--text2)' }}>{dailyCount}/20 today</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full">
              <h3 className="font-section text-[18px] mb-4" style={{ color: 'var(--text2)' }}>What would you like to explore?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map((prompt, i) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={prompt.text}
                      onClick={() => handleSend(prompt.text)}
                      className="p-4 rounded-xl text-left transition-all animate-card-enter"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        animationDelay: `${i * 60}ms`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.background = '#161d26'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
                    >
                      <Icon className="w-5 h-5 mb-2" style={{ color: 'var(--accent2)' }} />
                      <p className="text-[13px]" style={{ color: 'var(--text)' }}>{prompt.text}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: 'rgba(0, 184, 255, 0.15)', border: '1px solid rgba(0, 184, 255, 0.3)' }}
                >
                  <Sparkles className="w-[18px] h-[18px]" style={{ color: 'var(--accent2)' }} />
                </div>
              )}
              <div
                className="max-w-[70%] px-5 py-4 rounded-xl"
                style={{
                  background: msg.role === 'ai' ? 'var(--surface)' : 'rgba(0, 229, 160, 0.1)',
                  border: `1px solid ${msg.role === 'ai' ? 'var(--border)' : 'rgba(0, 229, 160, 0.3)'}`,
                  borderTopLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
                }}
              >
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{msg.content}</p>
                <span className="font-micro mt-2 block" style={{ color: 'var(--text3)' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0, 184, 255, 0.15)', border: '1px solid rgba(0, 184, 255, 0.3)' }}
              >
                <Sparkles className="w-[18px] h-[18px]" style={{ color: 'var(--accent2)' }} />
              </div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce-dot"
                    style={{ background: 'var(--text2)', animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 h-[72px] px-4 lg:px-6 flex items-center gap-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
            }}
            placeholder="Ask your AI coach anything..."
            className="flex-1 text-[14px] px-4 py-3 rounded-xl outline-none transition-all"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 184, 255, 0.15)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 hover:brightness-110"
            style={{ background: input.trim() ? 'var(--accent2)' : 'var(--text3)' }}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Context Panel */}
      <div className="hidden lg:block w-[280px] flex-shrink-0 p-5 overflow-y-auto" style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>
        <span className="font-micro" style={{ color: 'var(--text2)' }}>AI CONTEXT</span>
        <p className="text-[12px] mt-1 mb-5" style={{ color: 'var(--text3)' }}>What the coach knows about you</p>

        <div className="space-y-3">
          {[
            ['Win Rate', `${stats.winRate}%`],
            ['Total Trades', `${stats.totalTrades}`],
            ['Avg RR', `${stats.avgRr}`],
            ['Current Streak', `${stats.currentStreak} days`],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="font-micro" style={{ color: 'var(--text2)' }}>{label}</span>
              <p className="font-data-sm mt-0.5" style={{ color: 'var(--text)' }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <span className="font-micro" style={{ color: 'var(--text2)' }}>DETECTED PATTERNS</span>
          <div className="mt-3 space-y-2">
            {patterns.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-start gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: p.patternType === 'good' ? '#00e5a0' : p.patternType === 'warn' ? '#ffd166' : '#ff4a6b' }}
                />
                <span className="text-[12px] leading-relaxed line-clamp-2" style={{ color: 'var(--text2)' }}>{p.patternText}</span>
              </div>
            ))}
            {patterns.length === 0 && <span className="text-[12px]" style={{ color: 'var(--text3)' }}>No patterns yet</span>}
          </div>
        </div>

        <div className="mt-6">
          <span className="font-micro" style={{ color: 'var(--text2)' }}>RECENT TRADES</span>
          <div className="mt-3 space-y-1.5">
            {trades.slice(0, 5).map((t) => (
              <div key={t.id} className="font-data-sm text-[11px]">
                <span style={{ color: 'var(--text2)' }}>{t.pair} {t.direction} </span>
                <span style={{ color: t.result === 'WIN' ? '#00e5a0' : t.result === 'LOSS' ? '#ff4a6b' : '#ffd166' }}>{t.result}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="font-micro mt-6" style={{ color: 'var(--text3)' }}>Last updated: just now</p>
      </div>
    </div>
  );
}
