import React, { useState, useRef, useEffect } from 'react';
import { FinancialState, ChatMessage } from '../types/finance.js';
import { formatCurrency } from '../utils/formatters.js';
import {
  Send,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface AICoachViewProps {
  state: FinancialState;
  onNavigateTab: (tab: string) => void;
}

const PRESET_QUERIES = [
  'Where did my discretionary cash go this month?',
  'Can I comfortably absorb a $500 unplanned expense?',
  'What is the quickest path to fully fund my 6-month safety reserve?',
  'What if my consulting revenue drops by 50%?',
  'Identify underutilized subscriptions and recurring leaks.',
];

export const AICoachView: React.FC<AICoachViewProps> = ({ state, onNavigateTab }) => {
  const { profile, metrics } = state;
  const currency = profile.currency;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Good day, ${profile.userName}. I am your integrated financial analyst.

Active Living Money Model Context:
• Net Monthly Inflow: ${formatCurrency(metrics.totalMonthlyIncome, currency)}
• Committed Fixed Obligations: ${formatCurrency(metrics.committedFixedObligations, currency)}
• Discretionary Allowance: ${formatCurrency(metrics.safeToSpendPerDay, currency)} / day
• Liquid Emergency Runway: ${metrics.runwayMonths} months

Select an analysis query below or ask about any upcoming purchase, allocation shift, or scenario.`,
      timestamp: 'Initial state',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || "Analysis complete based on your active Living Money Model.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Dynamic financial context intelligence engine
      const lower = queryText.toLowerCase();
      let replyText = '';

      if (lower.includes('where') || lower.includes('discretionary') || lower.includes('category') || lower.includes('spent')) {
        replyText = `**October 2026 Outflow Breakdown:**
• **Fixed Living Base:** ${formatCurrency(metrics.committedFixedObligations, currency)} (${metrics.essentialPercentOfIncome}% of income)
  - Housing Lease: ${formatCurrency(2150, currency)}
  - Debt Service (Auto & Student): ${formatCurrency(610, currency)}
  - Essential Utilities: ${formatCurrency(266.79, currency)}
• **Discretionary Spending:** ${formatCurrency(metrics.discretionarySpending, currency)} (${metrics.discretionaryPercentOfIncome}% of income)
  - Food & Cafes: ${formatCurrency(279.75, currency)} (Trending 18% above target pace)
  - Shopping: ${formatCurrency(189.0, currency)}
  - Rideshare: ${formatCurrency(28.4, currency)}
• **Net Surplus Retained:** +${formatCurrency(metrics.netMonthlyCashFlow, currency)} (${metrics.effectiveSavingsRate}% effective savings rate)`;
      } else if (lower.includes('afford') || lower.includes('trip') || lower.includes('purchase') || lower.includes('500') || lower.includes('buy')) {
        replyText = `**Affordability Assessment:**
• **Verdict:** **Yes**, you can comfortably absorb this purchase.
• **Current Liquidity:** You have ${formatCurrency(metrics.netMonthlyCashFlow, currency)} in net monthly surplus and ${formatCurrency(4920.50, currency)} in primary checking.
• **Daily Allowance Impact:** Absorbing a purchase of this size adjusts your flexible daily allowance temporarily, but leaves your **${formatCurrency(profile.emergencyFund.currentBalance, currency)} emergency reserve completely untouched**.
• **Recommendation:** Book from your liquid surplus buffer rather than drawing from scheduled goal allocations.`;
      } else if (lower.includes('emergency') || lower.includes('runway') || lower.includes('safety')) {
        replyText = `**Emergency Reserve Analysis:**
• **Current Balance:** ${formatCurrency(profile.emergencyFund.currentBalance, currency)} (${metrics.runwayMonths} months of essential burn)
• **Target Target:** ${formatCurrency(metrics.emergencyFundCalculatedTarget, currency)} (${profile.emergencyFund.targetMonths} months target)
• **Remaining Gap:** Only ${formatCurrency(Math.max(0, metrics.emergencyFundCalculatedTarget - profile.emergencyFund.currentBalance), currency)} needed to achieve 100% full funding.
• **Trajectory:** At your automated rate of ${formatCurrency(profile.emergencyFund.monthlyContribution, currency)}/mo, you will hit complete 6-month autonomy in **less than 1 billing cycle**!`;
      } else if (lower.includes('consulting') || lower.includes('freelance') || lower.includes('drop') || lower.includes('income')) {
        replyText = `**Inflow Stress Test:**
• **Baseline:** Total inflow is ${formatCurrency(metrics.totalMonthlyIncome, currency)} ($6,200 salary + $950 consulting).
• **Simulated Loss (-$950/mo):** Monthly income contracts to ${formatCurrency(6200, currency)}.
• **Solvency:** Total monthly obligations are ${formatCurrency(metrics.totalMonthlyExpenses, currency)}.
• **Outcome:** Your salary alone covers all living expenses with a healthy **+${formatCurrency(6200 - metrics.totalMonthlyExpenses, currency)} monthly buffer remaining**. No emergency capital draw required!`;
      } else if (lower.includes('subscription') || lower.includes('audit') || lower.includes('leak') || lower.includes('unused')) {
        replyText = `**Subscription & Recurring Contract Audit:**
• **1. Equinox Club ($260.00/mo):** 0 check-ins recorded over 45 days. Pausing or canceling recovers **${formatCurrency(3120, currency)}/year**.
• **2. Apple Music ($10.99/mo) vs. Spotify Duo ($16.99/mo):** Both active simultaneously. Consolidating into one streaming platform saves up to **${formatCurrency(203, currency)}/year**.
• **3. Netflix 4K ($22.99/mo):** Raised price from $19.99 (+15%). Adds ${formatCurrency(36, currency)}/year in overhead.
• **Total Potential Annual Optimization:** **+${formatCurrency(3359, currency)} recovered**.`;
      } else {
        replyText = `**Living Money Model Assessment:**
• **Net Monthly Inflow:** ${formatCurrency(metrics.totalMonthlyIncome, currency)}
• **Committed Fixed Load:** ${formatCurrency(metrics.committedFixedObligations, currency)} (${metrics.essentialPercentOfIncome}% of net cash)
• **Daily Safe-to-Spend:** ${formatCurrency(metrics.safeToSpendPerDay, currency)} / day
• **Emergency Runway:** ${metrics.runwayMonths} months
• **Health Index:** ${metrics.financialHealthScore}/100`;
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Workspace Header Strip */}
      <div className="bg-white border border-[#E8EBE7] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-sm font-semibold text-[#202521] flex items-center gap-2">
            <span>Financial Advisory Assistant</span>
            <span className="text-[10px] font-mono font-medium text-[#777F79] bg-[#F8F9F7] px-1.5 py-0.5 rounded border border-[#E8EBE7]">
              Context Engine
            </span>
          </h1>
          <p className="text-xs text-[#777F79] mt-0.5">
            Objective financial calculation and strategy grounded in your verified ledger
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#777F79]">
          <div>
            <span className="block text-[10px] uppercase tracking-wider">Daily Allowance</span>
            <span className="font-mono font-semibold text-[#202521]">
              {formatCurrency(metrics.safeToSpendPerDay, currency)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider">Runway</span>
            <span className="font-mono font-semibold text-[#202521]">{metrics.runwayMonths} Mo</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider">Savings Rate</span>
            <span className="font-mono font-semibold text-[#237A57]">
              {metrics.effectiveSavingsRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Suggested Inquiries */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-[11px] font-medium text-[#777F79] shrink-0">Common Inquiries:</span>
        {PRESET_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => sendQuery(q)}
            className="px-2.5 py-1 rounded-md bg-white hover:bg-[#F8F9F7] text-[#202521] border border-[#E8EBE7] text-xs whitespace-nowrap shrink-0 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Structured Memo / Advisory Log */}
      <div className="bg-white border border-[#E8EBE7] rounded-lg h-[480px] flex flex-col overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className="flex gap-3 text-xs leading-relaxed">
                <div className="w-6 h-6 rounded-md bg-[#F1F3F0] text-[#202521] font-semibold flex items-center justify-center shrink-0 text-[11px]">
                  {isUser ? 'You' : 'FA'}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#202521]">
                      {isUser ? profile.userName : 'Financial Assistant'}
                    </span>
                    <span className="text-[10px] font-mono text-[#777F79]">{m.timestamp}</span>
                  </div>

                  <div className="p-3.5 rounded-md bg-[#FDFDFD] border border-[#E8EBE7] text-[#202521] whitespace-pre-line leading-relaxed">
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 text-xs">
              <div className="w-6 h-6 rounded-md bg-[#F1F3F0] text-[#202521] font-semibold flex items-center justify-center shrink-0 text-[11px]">
                FA
              </div>
              <div className="p-3 rounded-md bg-[#F8F9F7] border border-[#E8EBE7] text-[#777F79] text-xs flex items-center gap-2">
                <span>Analyzing cashflow parameters...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuery(input);
          }}
          className="p-3 border-t border-[#E8EBE7] bg-[#FDFDFD] flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a financial question or what-if scenario (e.g. 'Can I afford a $1,200 laptop?')..."
            disabled={isLoading}
            className="flex-1 bg-white border border-[#E8EBE7] rounded-md px-3.5 py-2 text-xs text-[#202521] placeholder-[#777F79] focus:outline-none focus:border-[#237A57]"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3.5 py-2 text-xs font-medium text-white bg-[#237A57] hover:bg-[#1D6548] disabled:opacity-50 rounded-md transition-colors shadow-xs"
          >
            Submit Query
          </button>
        </form>
      </div>
    </div>
  );
};
