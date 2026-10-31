import React from 'react';
import {
  FinancialState,
  Transaction,
  NudgeAlert,
} from '../types/finance.js';
import { formatCurrency, formatPercent, formatDate, getSpendingTypeBadge } from '../utils/formatters.js';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
  Target,
  Sparkles,
} from 'lucide-react';

interface OverviewViewProps {
  state: FinancialState;
  onNavigateTab: (tab: string) => void;
  onOpenCategoryModal: (tx: Transaction) => void;
  onDismissNudge: (id: string) => void;
  onNudgeAction: (nudge: NudgeAlert) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  state,
  onNavigateTab,
  onOpenCategoryModal,
  onDismissNudge,
  onNudgeAction,
}) => {
  const { profile, metrics, nudges, transactions, recurring } = state;
  const currency = profile.currency;

  const activeNudges = nudges.filter((n) => !n.dismissed);
  const recentTransactions = transactions.slice(0, 6);
  const upcomingRecurring = recurring
    .filter((r) => r.status !== 'cancelled')
    .slice(0, 4);

  // Available liquid balance (checking + emergency reserves)
  const totalAvailableBalance = 4920.50 + profile.emergencyFund.currentBalance;

  // Monthly cash flow bars
  const cashflowBars = [
    { label: 'Week 1', in: 3100, out: 2420 },
    { label: 'Week 2', in: 950, out: 580 },
    { label: 'Week 3', in: 3100, out: 640 },
    { label: 'Week 4', in: 0, out: 346 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Account Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="text-xs text-[#777F79] font-medium">Total Liquid Balance</div>
          <div className="text-2xl font-bold font-mono text-[#202521] mt-1.5 tabular-nums tracking-tight">
            {formatCurrency(totalAvailableBalance, currency)}
          </div>
          <div className="text-[11px] text-[#777F79] mt-1">
            Checking ···4921 + Savings ···8104
          </div>
        </div>

        {/* Monthly Net Inflow */}
        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="text-xs text-[#777F79] font-medium flex items-center justify-between">
            <span>Monthly Inflow</span>
            <span className="text-[11px] text-[#237A57] font-medium flex items-center">
              <ArrowDownLeft className="w-3 h-3 mr-0.5" />
              Verified
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#202521] mt-1.5 tabular-nums tracking-tight">
            {formatCurrency(metrics.totalMonthlyIncome, currency)}
          </div>
          <div className="text-[11px] text-[#777F79] mt-1">
            Salary + Consulting (100% on schedule)
          </div>
        </div>

        {/* Monthly Outflow */}
        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="text-xs text-[#777F79] font-medium flex items-center justify-between">
            <span>Monthly Expenditure</span>
            <span className="text-[11px] text-[#777F79] font-medium flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              Total
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#202521] mt-1.5 tabular-nums tracking-tight">
            {formatCurrency(metrics.totalMonthlyExpenses, currency)}
          </div>
          <div className="text-[11px] text-[#777F79] mt-1">
            {formatPercent((metrics.totalMonthlyExpenses / (metrics.totalMonthlyIncome || 1)) * 100)} of monthly inflow
          </div>
        </div>

        {/* Net Cash Flow & Savings Rate */}
        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="text-xs text-[#777F79] font-medium flex items-center justify-between">
            <span>Net Retained Cash</span>
            <span className="text-[11px] text-[#237A57] font-medium">
              {formatPercent(metrics.effectiveSavingsRate)} Rate
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#237A57] mt-1.5 tabular-nums tracking-tight">
            +{formatCurrency(metrics.netMonthlyCashFlow, currency)}
          </div>
          <div className="text-[11px] text-[#777F79] mt-1">
            {formatCurrency(metrics.safeToSpendPerDay, currency)} / day uncommitted buffer
          </div>
        </div>
      </div>

      {/* 2. Contextual Financial Insight & Nudges */}
      {activeNudges.length > 0 && (
        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="flex items-center justify-between border-b border-[#E8EBE7] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#237A57]" />
              <h2 className="text-xs font-semibold text-[#202521] uppercase tracking-wider">
                Financial Insights & Drift Monitor ({activeNudges.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('ai-coach')}
              className="text-xs font-medium text-[#237A57] hover:underline"
            >
              Consult Assistant →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeNudges.slice(0, 2).map((nudge) => (
              <div
                key={nudge.id}
                className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#202521]">{nudge.title}</span>
                    {nudge.impactAmount && (
                      <span className="text-[11px] font-mono font-medium text-[#237A57]">
                        {formatCurrency(nudge.impactAmount, currency)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#777F79] mt-1 leading-relaxed">{nudge.message}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8EBE7] text-[11px]">
                  <span className="text-[#777F79]">{formatDate(nudge.date)}</span>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => onDismissNudge(nudge.id)}
                      className="text-[#777F79] hover:text-[#202521] transition-colors"
                    >
                      Dismiss
                    </button>
                    {nudge.actionLabel && (
                      <button
                        onClick={() => onNudgeAction(nudge)}
                        className="font-medium text-[#237A57] hover:underline flex items-center gap-1"
                      >
                        {nudge.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Main Split Grid: Ledger + Chart (8 Cols) & Commitments + Goals (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cashflow Overview & Recent Transactions (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Simple, Readable Cash-Flow Chart */}
          <div className="bg-white border border-[#E8EBE7] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#202521]">Cash Flow Distribution</h3>
                <p className="text-xs text-[#777F79]">Weekly cash inflows vs expenditures across October 2026</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#237A57] rounded-xs inline-block" />
                  <span className="text-[#777F79]">Inflow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#D1D5DB] rounded-xs inline-block" />
                  <span className="text-[#777F79]">Outflow</span>
                </div>
              </div>
            </div>

            {/* Clean Bar Visualization */}
            <div className="space-y-3 pt-2">
              {cashflowBars.map((bar) => {
                const maxVal = 3500;
                const inPct = Math.min(100, (bar.in / maxVal) * 100);
                const outPct = Math.min(100, (bar.out / maxVal) * 100);

                return (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#202521] w-16">{bar.label}</span>
                      <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums">
                        <span className="text-[#237A57]">+{formatCurrency(bar.in, currency)}</span>
                        <span className="text-[#777F79]">-{formatCurrency(bar.out, currency)}</span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-[#F8F9F7] rounded-xs overflow-hidden flex gap-1">
                      <div
                        style={{ width: `${inPct}%` }}
                        className="h-full bg-[#237A57] rounded-xs"
                      />
                      <div
                        style={{ width: `${outPct}%` }}
                        className="h-full bg-[#D1D5DB] rounded-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Banking-Style Recent Transactions Table */}
          <div className="bg-white border border-[#E8EBE7] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#E8EBE7] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#202521]">Recent Transactions</h3>
                <p className="text-xs text-[#777F79]">Real-time ledger updates from synced accounts</p>
              </div>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-medium text-[#237A57] hover:underline"
              >
                View all ({transactions.length}) →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E8EBE7] bg-[#FDFDFD] text-[#777F79] font-medium">
                    <th className="py-2.5 px-4">Merchant / Description</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBE7]">
                  {recentTransactions.map((tx) => {
                    const isIncome = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-[#F8F9F7] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#202521] truncate max-w-xs">
                            {tx.merchant}
                          </div>
                          <div className="text-[11px] text-[#777F79] truncate max-w-xs">
                            {tx.description}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => onOpenCategoryModal(tx)}
                            className="text-[#202521] hover:text-[#237A57] hover:underline text-left text-[11px] font-medium"
                          >
                            {tx.category}
                          </button>
                        </td>

                        <td className="py-3 px-4 font-mono text-[#777F79] whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-medium tabular-nums whitespace-nowrap">
                          <span className={isIncome ? 'text-[#237A57] font-semibold' : 'text-[#202521]'}>
                            {isIncome ? '+' : ''}
                            {formatCurrency(tx.amount, currency)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Subscriptions & Financial Goals (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Recurring Payments */}
          <div className="bg-white border border-[#E8EBE7] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8EBE7] pb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#777F79]">
                Upcoming Recurring Bills
              </h3>
              <button
                onClick={() => onNavigateTab('subscriptions')}
                className="text-xs font-medium text-[#237A57] hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="divide-y divide-[#E8EBE7]">
              {upcomingRecurring.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-[#202521] truncate max-w-[150px]">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-[#777F79]">
                      Due {formatDate(item.nextDueDate)}
                    </div>
                  </div>
                  <div className="text-right font-mono font-medium text-[#202521] tabular-nums">
                    {formatCurrency(item.amount, currency)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E8EBE7] flex items-center justify-between text-xs text-[#777F79]">
              <span>Monthly Recurring Load</span>
              <span className="font-mono font-semibold text-[#202521]">
                {formatCurrency(metrics.committedFixedObligations, currency)}
              </span>
            </div>
          </div>

          {/* Financial Goals */}
          <div className="bg-white border border-[#E8EBE7] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8EBE7] pb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#777F79]">
                Financial Targets
              </h3>
              <button
                onClick={() => onNavigateTab('living-model')}
                className="text-xs font-medium text-[#237A57] hover:underline"
              >
                Model
              </button>
            </div>

            <div className="space-y-3">
              {profile.savingsGoals.map((goal) => {
                const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#202521]">{goal.title}</span>
                      <span className="font-mono text-xs font-semibold text-[#237A57] tabular-nums">
                        {pct}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-[#F8F9F7] rounded-full overflow-hidden border border-[#E8EBE7]">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-[#237A57] rounded-full"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#777F79] font-mono">
                      <span>{formatCurrency(goal.currentAmount, currency)}</span>
                      <span>Target: {formatCurrency(goal.targetAmount, currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Emergency Fund Status */}
          <div className="bg-white border border-[#E8EBE7] rounded-lg p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#777F79]">
              Liquidity & Runway
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-xl font-bold font-mono text-[#202521]">
                {metrics.runwayMonths}{' '}
                <span className="text-xs font-normal text-[#777F79]">months</span>
              </div>
              <span className="text-xs text-[#237A57] font-medium">
                {profile.emergencyFund.targetMonths} Mo Target
              </span>
            </div>
            <p className="text-[11px] text-[#777F79] leading-relaxed">
              {formatCurrency(profile.emergencyFund.currentBalance, currency)} held in high-yield reserves at current essential monthly burn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
