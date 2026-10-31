import React, { useState, useEffect } from 'react';
import { FinancialState } from '../types/finance.js';
import { formatCurrency, formatPercent } from '../utils/formatters.js';
import {
  FileText,
  Printer,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface MonthlyReviewViewProps {
  state: FinancialState;
}

export const MonthlyReviewView: React.FC<MonthlyReviewViewProps> = ({ state }) => {
  const { profile, metrics, recurring, transactions } = state;
  const currency = profile.currency;

  const [monthName, setMonthName] = useState('October 2026');
  const [actionables, setActionables] = useState<
    Array<{ title: string; reasoning: string; projectedImpact: string }>
  >([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    async function loadMonthlyAi() {
      setIsLoadingAi(true);
      try {
        const res = await fetch('/api/ai/monthly-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monthName }),
        });
        const data = await res.json();
        if (data.actionables && data.actionables.length > 0) {
          setActionables(data.actionables);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingAi(false);
      }
    }
    loadMonthlyAi();
  }, [monthName]);

  const catMap: Record<string, number> = {};
  transactions
    .filter((tx) => tx.amount < 0 && tx.date.startsWith('2026-10'))
    .forEach((tx) => {
      catMap[tx.category] = (catMap[tx.category] || 0) + Math.abs(tx.amount);
    });

  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#202521]">Monthly Financial Statement</h1>
          <p className="text-xs text-[#777F79]">
            Comprehensive executive reconciliation of monthly cash inflows, expenditure, and savings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={monthName}
            onChange={(e) => setMonthName(e.target.value)}
            className="bg-white border border-[#E8EBE7] rounded-md px-3 py-1.5 text-xs text-[#202521] focus:outline-none focus:border-[#237A57]"
          >
            <option value="October 2026">October 2026 (Active)</option>
            <option value="September 2026">September 2026</option>
            <option value="August 2026">August 2026</option>
          </select>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202521] bg-white hover:bg-[#F8F9F7] border border-[#E8EBE7] rounded-md transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#777F79]" />
            Print Statement
          </button>
        </div>
      </div>

      {/* Main Statement Canvas */}
      <div className="bg-white border border-[#E8EBE7] rounded-lg p-6 space-y-6">
        {/* Memo Header */}
        <div className="border-b border-[#E8EBE7] pb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#777F79]">
              Reconciliation Statement
            </div>
            <h2 className="text-xl font-bold text-[#202521] mt-0.5 tracking-tight">
              {profile.userName} · {monthName}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#777F79] block">Health Score</span>
            <span className="text-xl font-bold font-mono text-[#237A57]">
              {metrics.financialHealthScore}/100
            </span>
          </div>
        </div>

        {/* 4 Strip Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md">
            <span className="text-xs text-[#777F79] font-medium">Net Take-Home Inflow</span>
            <div className="text-base font-bold font-mono text-[#202521] mt-1 tabular-nums">
              {formatCurrency(metrics.totalMonthlyIncome, currency)}
            </div>
          </div>

          <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md">
            <span className="text-xs text-[#777F79] font-medium">Total Expenditure</span>
            <div className="text-base font-bold font-mono text-[#202521] mt-1 tabular-nums">
              {formatCurrency(metrics.totalMonthlyExpenses, currency)}
            </div>
          </div>

          <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md">
            <span className="text-xs text-[#777F79] font-medium">Net Retained Cash</span>
            <div className="text-base font-bold font-mono text-[#237A57] mt-1 tabular-nums">
              +{formatCurrency(metrics.netMonthlyCashFlow, currency)}
            </div>
          </div>

          <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md">
            <span className="text-xs text-[#777F79] font-medium">Effective Savings Rate</span>
            <div className="text-base font-bold font-mono text-[#237A57] mt-1 tabular-nums">
              {formatPercent(metrics.effectiveSavingsRate)}
            </div>
          </div>
        </div>

        {/* Category Breakdown & Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#777F79]">
              Expenditure by Category
            </h3>
            <div className="space-y-2">
              {sortedCats.map(([cat, amt]) => {
                const pct = Math.round((amt / (metrics.totalMonthlyExpenses || 1)) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#202521]">{cat}</span>
                      <span className="font-mono text-[#202521]">
                        {formatCurrency(amt, currency)}{' '}
                        <span className="text-[#777F79] text-[11px]">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#F8F9F7] rounded-full overflow-hidden border border-[#E8EBE7]">
                      <div style={{ width: `${pct}%` }} className="h-full bg-[#237A57] rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#777F79]">
              Safety Reserves & Goal Allocation
            </h3>
            <div className="p-4 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#202521]">Emergency Reserves</span>
                <span className="font-mono font-semibold text-[#202521]">
                  {metrics.runwayMonths} of {profile.emergencyFund.targetMonths} Months
                </span>
              </div>
              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-[#E8EBE7]">
                <div
                  style={{
                    width: `${Math.min(100, (metrics.runwayMonths / profile.emergencyFund.targetMonths) * 100)}%`,
                  }}
                  className="h-full bg-[#237A57] rounded-full"
                />
              </div>

              <div className="pt-2 border-t border-[#E8EBE7] space-y-1.5">
                <span className="font-medium text-[#777F79] block">Tracked Goals:</span>
                {profile.savingsGoals.map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-[#202521]">{g.title}</span>
                    <span className="font-mono text-[#237A57]">
                      {formatCurrency(g.currentAmount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Strategic Improvements */}
        <div className="pt-4 border-t border-[#E8EBE7] space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#777F79]">
            Strategic Recommendations for November 2026
          </h3>

          {isLoadingAi ? (
            <div className="p-4 text-center text-xs text-[#777F79]">
              Generating reconciliation directives...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {actionables.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#202521] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-white border border-[#E8EBE7] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{item.title}</span>
                    </div>
                    <p className="text-xs text-[#777F79] leading-relaxed pt-0.5">{item.reasoning}</p>
                  </div>
                  <div className="text-[11px] font-mono text-[#237A57] font-medium pt-2 border-t border-[#E8EBE7]">
                    {item.projectedImpact}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
