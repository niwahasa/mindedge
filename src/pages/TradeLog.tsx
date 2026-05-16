import { useState, useMemo } from 'react';
import { Plus, X, ChevronUp, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTradeStore } from '@/stores/tradeStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { formatDate } from '@/utils/helpers';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Paywall from '@/components/ui/Paywall';
import type { Trade } from '@/types';
import { usePlanLimits } from '@/hooks/usePlanLimits';

const PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'NZDUSD', 'AUDUSD', 'USDCAD'];
const SESSIONS = ['London Open', 'NY Open', 'Asian', 'London Close', 'NY Lunch', 'Pre-Market'];
const SETUPS = ['BOS + OB Retest', 'CHoCH + FVG Fill', 'Liquidity Sweep', 'SMT Divergence', 'Kill Zone Entry', 'Range EQ', 'IFVG', 'Premium/Discount Array'];
const EMOTIONS = [
  { emoji: '😌', label: 'Calm' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😎', label: 'Confident' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😐', label: 'Neutral' },
];
const MISTAKES = ['None', 'Revenge Trade', 'Early Entry', 'FOMO', 'Moved Stop Loss', 'Low RR Setup', 'Outside Plan', 'Overtrading', 'Held Too Long'];

export default function TradeLog() {
  const trades = useTradeStore((s) => s.trades);
  const filters = useTradeStore((s) => s.filters);
  const setFilters = useTradeStore((s) => s.setFilters);
  const addTrade = useTradeStore((s) => s.addTrade);
  const updateTrade = useTradeStore((s) => s.updateTrade);
  const deleteTrade = useTradeStore((s) => s.deleteTrade);
  const getFilteredTrades = useTradeStore((s) => s.getFilteredTrades);
  const recalculateStats = useAnalyticsStore((s) => s.recalculateStats);
  const { canAddTrade } = usePlanLimits();

  // Reset filters on mount so stale session filters don't hide trades
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => { setFilters({ pair: '', session: '', result: '' }); });

  const [showForm, setShowForm] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [step, setStep] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sort, setSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'tradedAt', dir: 'desc' });

  // Form state
  const [form, setForm] = useState<Partial<Trade>>({
    emotionBefore: 'Calm', pair: '', direction: 'BUY', setup: '', session: '',
    riskR: 1, rrRatio: 2, chartLink: '', notes: '', result: 'WIN',
    followedPlan: 'yes', emotionAfter: 'Calm', mistakeTag: null,
  });

  const filteredTrades = useMemo(() => {
    let data = getFilteredTrades();
    data.sort((a, b) => {
      const aVal = sort.field === 'rrRatio' ? a.rrRatio : sort.field === 'pair' ? a.pair : new Date(a.tradedAt).getTime();
      const bVal = sort.field === 'rrRatio' ? b.rrRatio : sort.field === 'pair' ? b.pair : new Date(b.tradedAt).getTime();
      return sort.dir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, filters, sort]); // ← trades & filters as deps so table updates when store changes


  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / pageSize));
  const paginatedTrades = filteredTrades.slice((page - 1) * pageSize, page * pageSize);

  const handleSubmit = async () => {
    if (!form.pair || !form.setup || !form.session) return;
    setLoading(true);
    const now = new Date().toISOString();

    try {
      await addTrade({
        ...form,
        tradedAt: form.tradedAt || now,
      } as Omit<Trade, 'id' | 'userId' | 'createdAt'>);

      // Always close and reset — addTrade uses optimistic updates so it always succeeds locally
      recalculateStats();
      setShowForm(false);
      setStep(0);
      setForm({
        emotionBefore: 'Calm', pair: '', direction: 'BUY', setup: '', session: '',
        riskR: 1, rrRatio: 2, chartLink: '', notes: '', result: 'WIN',
        followedPlan: 'yes', emotionAfter: 'Calm', mistakeTag: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const step1Valid = form.pair && form.setup && form.session && form.riskR && form.rrRatio;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display" style={{ color: 'var(--text)' }}>Trade Journal</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text2)' }}>{trades.length} trades logged</p>
        </div>
        <button
          onClick={() => { 
            if (!canAddTrade) {
              setShowPaywall(true);
              return;
            }
            setShowForm(!showForm); 
            if (!showForm) setStep(0); 
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
          style={showForm ? { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' } : { background: 'var(--accent)', color: '#080b0f' }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Log Trade'}
        </button>
      </div>

      {showPaywall && (
        <Paywall 
          isModal 
          onClose={() => setShowPaywall(false)} 
          title="Journal Limit Reached"
          description="Free users are limited to 5 trades. Upgrade to Premium to unlock unlimited logging and advanced features."
          feature="Unlimited Trade Journaling"
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.pair}
          onChange={(e) => setFilters({ pair: e.target.value })}
          className="text-[13px] px-3 py-2 rounded-lg outline-none"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="">All Pairs</option>
          {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filters.session}
          onChange={(e) => setFilters({ session: e.target.value })}
          className="text-[13px] px-3 py-2 rounded-lg outline-none"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="">All Sessions</option>
          {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex gap-1">
          {['', 'WIN', 'LOSS', 'BE'].map((r) => (
            <button
              key={r}
              onClick={() => setFilters({ result: r })}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: filters.result === r ? 'var(--surface2)' : 'transparent',
                border: `1px solid ${filters.result === r ? 'var(--accent)' : 'var(--border)'}`,
                color: filters.result === r ? 'var(--accent)' : 'var(--text2)',
              }}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
        {(filters.pair || filters.session || filters.result) && (
          <button
            onClick={() => setFilters({ pair: '', session: '', result: '' })}
            className="flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--text3)' }}
          >
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Trade Entry Form */}
      {showForm && (
        <Card accentColor="#00e5a0">
          <div className="p-6">
            {/* Step indicator */}
            <div className="flex gap-1 mb-6">
              {['BEFORE TRADE', 'AFTER TRADE', 'CONFIRM'].map((label, i) => (
                <div key={label} className="flex-1">
                  <div
                    className="h-1 rounded-full"
                    style={{
                      background: i < step ? 'var(--accent)' : i === step ? 'var(--accent2)' : 'var(--border)',
                      transition: 'background 0.2s',
                    }}
                  />
                  <span className={`font-micro mt-2 block text-center ${i === step ? 'text-[var(--text)]' : 'text-[var(--text3)]'}`}>{label}</span>
                </div>
              ))}
            </div>

            {/* Step 1 */}
            {step === 0 && (
              <div className="space-y-5 animate-card-enter">
                <div>
                  <label className="font-micro block mb-3" style={{ color: 'var(--text2)' }}>EMOTION BEFORE</label>
                  <div className="flex gap-2 flex-wrap">
                    {EMOTIONS.map((e) => (
                      <button
                        key={e.label}
                        onClick={() => setForm({ ...form, emotionBefore: e.label })}
                        className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl transition-all min-w-[64px]"
                        style={{
                          border: `1px solid ${form.emotionBefore === e.label ? 'var(--accent2)' : 'var(--border)'}`,
                          background: form.emotionBefore === e.label ? 'rgba(0, 184, 255, 0.15)' : 'var(--surface2)',
                        }}
                      >
                        <span className="text-xl">{e.emoji}</span>
                        <span className="font-micro text-[10px]">{e.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>PAIR</label>
                    <select
                      value={form.pair}
                      onChange={(e) => setForm({ ...form, pair: e.target.value })}
                      className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      <option value="">Select pair...</option>
                      {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="custom">Custom...</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>DIRECTION</label>
                    <div className="flex gap-2">
                      {(['BUY', 'SELL'] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() => setForm({ ...form, direction: dir })}
                          className="flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition-all"
                          style={{
                            border: `1px solid ${form.direction === dir ? (dir === 'BUY' ? '#00e5a0' : '#ff4a6b') : 'var(--border)'}`,
                            background: form.direction === dir ? (dir === 'BUY' ? 'rgba(0, 229, 160, 0.2)' : 'rgba(255, 74, 107, 0.2)') : 'var(--surface2)',
                            color: dir === 'BUY' ? '#00e5a0' : '#ff4a6b',
                          }}
                        >
                          {dir === 'BUY' ? '↑ BUY' : '↓ SELL'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>SETUP</label>
                    <select
                      value={form.setup}
                      onChange={(e) => setForm({ ...form, setup: e.target.value })}
                      className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      <option value="">Select setup...</option>
                      {SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>SESSION</label>
                    <select
                      value={form.session}
                      onChange={(e) => setForm({ ...form, session: e.target.value })}
                      className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      <option value="">Select session...</option>
                      {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>RISK IN R</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={form.riskR || 1}
                      onChange={(e) => setForm({ ...form, riskR: parseFloat(e.target.value) || 1 })}
                      className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                  </div>

                  <div>
                    <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>TARGET R:R</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={form.rrRatio || 2}
                      onChange={(e) => setForm({ ...form, rrRatio: parseFloat(e.target.value) || 2 })}
                      className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>CHART LINK (OPTIONAL)</label>
                    <input
                      type="text"
                      value={form.chartLink || ''}
                      onChange={(e) => setForm({ ...form, chartLink: e.target.value })}
                      placeholder="TradingView or image URL"
                      className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>NOTES</label>
                    <textarea
                      value={form.notes || ''}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Trade notes..."
                      rows={2}
                      className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none resize-none"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(1)}
                    disabled={!step1Valid}
                    className="px-6 py-2.5 rounded-lg text-[14px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--accent)', color: '#080b0f' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 1 && (
              <div className="space-y-5 animate-card-enter">
                <div>
                  <label className="font-micro block mb-3" style={{ color: 'var(--text2)' }}>RESULT</label>
                  <div className="flex gap-2">
                    {(['WIN', 'LOSS', 'BE'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setForm({ ...form, result: r })}
                        className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold transition-all"
                        style={{
                          border: `1px solid ${form.result === r ? (r === 'WIN' ? '#00e5a0' : r === 'LOSS' ? '#ff4a6b' : '#ffd166') : 'var(--border)'}`,
                          background: form.result === r
                            ? (r === 'WIN' ? 'rgba(0, 229, 160, 0.2)' : r === 'LOSS' ? 'rgba(255, 74, 107, 0.2)' : 'rgba(255, 209, 102, 0.2)')
                            : 'var(--surface2)',
                          color: r === 'WIN' ? '#00e5a0' : r === 'LOSS' ? '#ff4a6b' : '#ffd166',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-micro block mb-3" style={{ color: 'var(--text2)' }}>FOLLOWED PLAN?</label>
                  <div className="flex gap-2">
                    {(['yes', 'partial', 'no'] as const).map((fp) => (
                      <button
                        key={fp}
                        onClick={() => setForm({ ...form, followedPlan: fp })}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all capitalize"
                        style={{
                          border: `1px solid ${form.followedPlan === fp ? (fp === 'yes' ? '#00e5a0' : fp === 'partial' ? '#ffd166' : '#ff4a6b') : 'var(--border)'}`,
                          background: form.followedPlan === fp
                            ? (fp === 'yes' ? 'rgba(0, 229, 160, 0.2)' : fp === 'partial' ? 'rgba(255, 209, 102, 0.2)' : 'rgba(255, 74, 107, 0.2)')
                            : 'var(--surface2)',
                          color: fp === 'yes' ? '#00e5a0' : fp === 'partial' ? '#ffd166' : '#ff4a6b',
                        }}
                      >
                        {fp}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-micro block mb-3" style={{ color: 'var(--text2)' }}>EMOTION AFTER</label>
                  <div className="flex gap-2 flex-wrap">
                    {EMOTIONS.map((e) => (
                      <button
                        key={e.label}
                        onClick={() => setForm({ ...form, emotionAfter: e.label })}
                        className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl transition-all min-w-[64px]"
                        style={{
                          border: `1px solid ${form.emotionAfter === e.label ? 'var(--accent2)' : 'var(--border)'}`,
                          background: form.emotionAfter === e.label ? 'rgba(0, 184, 255, 0.15)' : 'var(--surface2)',
                        }}
                      >
                        <span className="text-xl">{e.emoji}</span>
                        <span className="font-micro text-[10px]">{e.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>MISTAKE TAG</label>
                  <select
                    value={form.mistakeTag || 'None'}
                    onChange={(e) => setForm({ ...form, mistakeTag: e.target.value === 'None' ? null : e.target.value })}
                    className="w-full text-[14px] px-3 py-2.5 rounded-lg outline-none"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    {MISTAKES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(0)}
                    className="px-6 py-2.5 rounded-lg text-[14px] font-medium transition-all"
                    style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-lg text-[14px] font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ background: 'var(--accent)', color: '#080b0f' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 - Confirm */}
            {step === 2 && (
              <div className="space-y-5 animate-card-enter">
                <h3 className="font-card-title" style={{ color: 'var(--text)' }}>Review Trade</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Pair', form.pair || '-'],
                    ['Direction', form.direction || '-'],
                    ['Setup', form.setup || '-'],
                    ['Session', form.session || '-'],
                    ['Risk', `${form.riskR}R`],
                    ['Target R:R', `${form.rrRatio}`],
                    ['Result', form.result || '-'],
                    ['Followed Plan', form.followedPlan || '-'],
                    ['Emotion Before', form.emotionBefore || '-'],
                    ['Emotion After', form.emotionAfter || '-'],
                    ['Mistake', form.mistakeTag || 'None'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span className="font-micro" style={{ color: 'var(--text2)' }}>{label}</span>
                      <p className="text-[14px] mt-1 font-medium" style={{ color: 'var(--text)' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-2.5 rounded-lg text-[14px] font-medium transition-all"
                    style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 rounded-lg text-[14px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                    style={{ background: 'var(--accent)', color: '#080b0f' }}
                  >
                    {loading ? 'Submitting...' : 'Submit Trade'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Trades Table */}
      <Card>
        <div className="p-6 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {[
                  { key: 'tradedAt', label: 'DATE' },
                  { key: 'pair', label: 'PAIR' },
                  { key: 'direction', label: 'DIR' },
                  { key: 'setup', label: 'SETUP' },
                  { key: 'session', label: 'SESSION' },
                  { key: 'result', label: 'RESULT' },
                  { key: 'rrRatio', label: 'RR' },
                  { key: 'emotionBefore', label: 'EMO' },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="font-micro text-left pb-3 pr-4 cursor-pointer select-none"
                    style={{ color: sort.field === col.key ? 'var(--accent)' : 'var(--text2)' }}
                    onClick={() => setSort({ field: col.key, dir: sort.field === col.key && sort.dir === 'desc' ? 'asc' : 'desc' })}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sort.field === col.key && (
                        sort.dir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                ))}
                <th className="font-micro text-left pb-3" style={{ color: 'var(--text2)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map((trade) => (
                <TableRow
                  key={trade.id}
                  trade={trade}
                  isExpanded={expandedRow === trade.id}
                  isEditing={editingRow === trade.id}
                  onToggleExpand={() => setExpandedRow(expandedRow === trade.id ? null : trade.id)}
                  onEdit={() => setEditingRow(editingRow === trade.id ? null : trade.id)}
                  onDelete={() => { deleteTrade(trade.id); recalculateStats(); }}
                  onUpdate={(data) => { updateTrade(trade.id, data); setEditingRow(null); recalculateStats(); }}
                />
              ))}
              {paginatedTrades.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    {trades.length > 0 ? (
                      // Trades exist but filters are hiding them
                      <div className="space-y-3">
                        <p className="text-[14px]" style={{ color: 'var(--text2)' }}>
                          No trades match your current filters.
                        </p>
                        <button
                          onClick={() => setFilters({ pair: '', session: '', result: '', from: '', to: '' })}
                          className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-all hover:brightness-110"
                          style={{ background: 'var(--accent)', color: '#080b0f' }}
                        >
                          Clear All Filters
                        </button>
                      </div>
                    ) : (
                      // No trades at all
                      <p className="text-[14px]" style={{ color: 'var(--text3)' }}>
                        No trades logged yet. Click <strong style={{ color: 'var(--accent)' }}>+ Log Trade</strong> to get started.
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {filteredTrades.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="font-data-sm" style={{ color: 'var(--text2)' }}>
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredTrades.length)} of {filteredTrades.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg disabled:opacity-30"
                  style={{ color: 'var(--text2)' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 rounded-lg text-[12px] font-medium transition-all"
                      style={{
                        background: page === p ? 'var(--surface2)' : 'transparent',
                        border: `1px solid ${page === p ? 'var(--accent2)' : 'transparent'}`,
                        color: page === p ? 'var(--accent2)' : 'var(--text2)',
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg disabled:opacity-30"
                  style={{ color: 'var(--text2)' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function TableRow({ trade, isExpanded, isEditing, onToggleExpand, onEdit, onDelete, onUpdate }: {
  trade: Trade; isExpanded: boolean; isEditing: boolean;
  onToggleExpand: () => void; onEdit: () => void; onDelete: () => void;
  onUpdate: (data: Partial<Trade>) => void;
}) {
  const [editForm, setEditForm] = useState<Partial<Trade>>({});
  const emotionEmoji = EMOTIONS.find(e => e.label === trade.emotionBefore)?.emoji || '😐';

  if (isEditing) {
    return (
      <tr>
        <td colSpan={9} className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={editForm.setup || trade.setup}
              onChange={(e) => setEditForm({ ...editForm, setup: e.target.value })}
              className="text-[13px] px-2 py-1.5 rounded outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={editForm.session || trade.session}
              onChange={(e) => setEditForm({ ...editForm, session: e.target.value })}
              className="text-[13px] px-2 py-1.5 rounded outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={() => onUpdate(editForm)}
              className="px-3 py-1.5 rounded text-[12px] font-semibold"
              style={{ background: 'var(--accent)', color: '#080b0f' }}
            >
              Save
            </button>
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded text-[12px]"
              style={{ color: 'var(--text2)' }}
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr
        className="group cursor-pointer transition-colors"
        style={{ borderBottom: '1px solid var(--border)' }}
        onClick={onToggleExpand}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#161d26'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <td className="py-3 pr-4 font-data-sm" style={{ color: 'var(--text2)' }}>{formatDate(trade.tradedAt)}</td>
        <td className="py-3 pr-4 font-data-sm font-semibold" style={{ color: 'var(--text)' }}>{trade.pair}</td>
        <td className="py-3 pr-4">
          <Badge variant={trade.direction === 'BUY' ? 'good' : 'danger'}>{trade.direction}</Badge>
        </td>
        <td className="py-3 pr-4 font-data-sm truncate max-w-[120px]" style={{ color: 'var(--text2)' }}>{trade.setup}</td>
        <td className="py-3 pr-4">
          <span className="font-micro px-2 py-0.5 rounded" style={{ background: 'var(--surface2)' }}>{trade.session}</span>
        </td>
        <td className="py-3 pr-4">
          <Badge variant={trade.result === 'WIN' ? 'good' : trade.result === 'LOSS' ? 'danger' : 'warning'}>{trade.result}</Badge>
        </td>
        <td className="py-3 pr-4 font-data-sm font-semibold" style={{ color: trade.result === 'WIN' ? '#00e5a0' : trade.result === 'LOSS' ? '#ff4a6b' : '#ffd166' }}>
          {trade.result === 'WIN' ? `+${trade.rrRatio}` : trade.result === 'LOSS' ? `-${trade.riskR}` : '0'}
        </td>
        <td className="py-3 pr-4 text-[16px]" title={trade.emotionBefore}>{emotionEmoji}</td>
        <td className="py-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button onClick={onEdit} className="p-1.5 rounded" style={{ color: 'var(--text2)' }}><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 rounded" style={{ color: 'var(--red)' }}><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className="p-4 animate-card-enter" style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--accent2)' }}>
            <div className="space-y-2 text-[13px]">
              {trade.notes && <p style={{ color: 'var(--text)' }}><span style={{ color: 'var(--text2)' }}>Notes:</span> {trade.notes}</p>}
              {trade.chartLink && <p><span style={{ color: 'var(--text2)' }}>Chart:</span> <a href={trade.chartLink} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent2)' }}>{trade.chartLink}</a></p>}
              {trade.mistakeTag && <p><Badge variant="warning">{trade.mistakeTag}</Badge></p>}
              <p style={{ color: 'var(--text2)' }}>Followed plan: <span style={{ color: trade.followedPlan === 'yes' ? '#00e5a0' : trade.followedPlan === 'no' ? '#ff4a6b' : '#ffd166' }}>{trade.followedPlan}</span></p>
              <p style={{ color: 'var(--text2)' }}>{trade.emotionBefore} → {trade.emotionAfter}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
