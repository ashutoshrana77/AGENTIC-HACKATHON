import React, { useState } from 'react';
import {
  LivingMoneyModel,
  CalculatedFinancialMetrics,
  CurrencyCode,
  SavingsGoal,
  DebtCommitment,
  IncomeSource,
} from '../types/finance.js';
import { formatCurrency, formatPercent } from '../utils/formatters.js';
import {
  Sliders,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Shield,
  Target,
} from 'lucide-react';

interface LivingMoneyModelViewProps {
  profile: LivingMoneyModel;
  metrics: CalculatedFinancialMetrics;
  onUpdateProfile: (updated: Partial<LivingMoneyModel>) => Promise<void>;
}

export const LivingMoneyModelView: React.FC<LivingMoneyModelViewProps> = ({
  profile,
  metrics,
  onUpdateProfile,
}) => {
  const currency = profile.currency;
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [netIncome, setNetIncome] = useState(profile.monthlyNetIncome);
  const [grossIncome, setGrossIncome] = useState(profile.monthlyGrossIncome);
  const [variability, setVariability] = useState(profile.incomeVariability);
  const [targetMonths, setTargetMonths] = useState(profile.emergencyFund.targetMonths);
  const [emergencyBalance, setEmergencyBalance] = useState(profile.emergencyFund.currentBalance);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(profile.incomeSources);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(profile.savingsGoals);
  const [debtCommitments, setDebtCommitments] = useState<DebtCommitment[]>(profile.debtCommitments);
  const [guardrails, setGuardrails] = useState(profile.guardrails);

  const handleSaveAll = async () => {
    setIsSaving(true);
    await onUpdateProfile({
      monthlyNetIncome: Number(netIncome),
      monthlyGrossIncome: Number(grossIncome),
      incomeVariability: variability,
      emergencyFund: {
        ...profile.emergencyFund,
        currentBalance: Number(emergencyBalance),
        targetMonths: Number(targetMonths),
      },
      incomeSources,
      savingsGoals,
      debtCommitments,
      guardrails,
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const addIncomeSource = () => {
    setIncomeSources([
      ...incomeSources,
      {
        id: `inc-${Date.now()}`,
        name: 'Additional Inflow',
        amount: 500,
        frequency: 'monthly',
        type: 'freelance',
      },
    ]);
  };

  const addGoal = () => {
    setSavingsGoals([
      ...savingsGoals,
      {
        id: `goal-${Date.now()}`,
        title: 'New Financial Priority',
        targetAmount: 5000,
        currentAmount: 1000,
        targetDate: '2027-12-31',
        priority: 'medium',
        monthlyTarget: 250,
        category: 'Growth',
        isAutomated: false,
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#202521]">Living Money Model Architecture</h1>
          <p className="text-xs text-[#777F79]">
            The foundational parameters governing your cashflow, allocations, and emergency runway
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-[#237A57] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Parameters Saved
            </span>
          )}
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#237A57] hover:bg-[#1D6548] disabled:opacity-50 rounded-md transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Recalculating...' : 'Save & Recalculate'}
          </button>
        </div>
      </div>

      {/* Model High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="text-xs text-[#777F79] font-medium">Committed Monthly Living Base</div>
          <div className="text-xl font-bold font-mono text-[#202521] mt-1 tabular-nums">
            {formatCurrency(metrics.committedFixedObligations, currency)}
          </div>
          <div className="text-[11px] text-[#777F79] mt-1">
            {formatPercent(metrics.essentialPercentOfIncome)} of monthly net income pre-committed
          </div>
        </div>

        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="text-xs text-[#777F79] font-medium">Discretionary Cash Buffer</div>
          <div className="text-xl font-bold font-mono text-[#237A57] mt-1 tabular-nums">
            {formatCurrency(metrics.totalMonthlyIncome - metrics.committedFixedObligations, currency)}
          </div>
          <div className="text-[11px] text-[#777F79] mt-1">
            Free cashflow after all fixed living obligations are accounted for
          </div>
        </div>

        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="text-xs text-[#777F79] font-medium">Emergency Reserve Runway</div>
          <div className="text-xl font-bold font-mono text-[#202521] mt-1 tabular-nums">
            {metrics.runwayMonths} Months
          </div>
          <div className="text-[11px] text-[#777F79] mt-1">
            At essential monthly burn of {formatCurrency(metrics.essentialSpending, currency)}
          </div>
        </div>
      </div>

      {/* Section 1: Inflow Profile */}
      <div className="bg-white border border-[#E8EBE7] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8EBE7] pb-3">
          <h2 className="text-sm font-semibold text-[#202521]">Inflow Architecture</h2>
          <button
            onClick={addIncomeSource}
            className="text-xs font-medium text-[#237A57] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stream
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] text-[#777F79] font-medium">Monthly Net Take-Home</label>
            <input
              type="number"
              value={netIncome}
              onChange={(e) => setNetIncome(Number(e.target.value))}
              className="w-full bg-[#F8F9F7] border border-[#E8EBE7] rounded-md px-3 py-1.5 text-xs font-mono text-[#202521] focus:outline-none focus:border-[#237A57]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[#777F79] font-medium">Monthly Gross Inflow</label>
            <input
              type="number"
              value={grossIncome}
              onChange={(e) => setGrossIncome(Number(e.target.value))}
              className="w-full bg-[#F8F9F7] border border-[#E8EBE7] rounded-md px-3 py-1.5 text-xs font-mono text-[#202521] focus:outline-none focus:border-[#237A57]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[#777F79] font-medium">Income Predictability</label>
            <select
              value={variability}
              onChange={(e) => setVariability(e.target.value as any)}
              className="w-full bg-[#F8F9F7] border border-[#E8EBE7] rounded-md px-3 py-1.5 text-xs text-[#202521] focus:outline-none focus:border-[#237A57]"
            >
              <option value="stable">Stable (Predictable Salary)</option>
              <option value="moderate">Moderate (Base + Variable)</option>
              <option value="high">Variable (Contract / Freelance)</option>
            </select>
          </div>
        </div>

        {/* Inflow Streams */}
        <div className="space-y-2 pt-2">
          {incomeSources.map((src, i) => (
            <div
              key={src.id}
              className="flex items-center justify-between gap-3 p-2.5 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md text-xs"
            >
              <input
                type="text"
                value={src.name}
                onChange={(e) => {
                  const updated = [...incomeSources];
                  updated[i].name = e.target.value;
                  setIncomeSources(updated);
                }}
                className="bg-transparent font-medium text-[#202521] focus:outline-none flex-1"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={src.amount}
                  onChange={(e) => {
                    const updated = [...incomeSources];
                    updated[i].amount = Number(e.target.value);
                    setIncomeSources(updated);
                  }}
                  className="w-24 bg-white border border-[#E8EBE7] rounded px-2 py-1 text-xs font-mono font-medium text-[#202521] text-right"
                />
                <button
                  onClick={() => setIncomeSources(incomeSources.filter((s) => s.id !== src.id))}
                  className="p-1 text-[#777F79] hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Emergency Reserve Configuration */}
      <div className="bg-white border border-[#E8EBE7] rounded-lg p-5 space-y-4">
        <div className="border-b border-[#E8EBE7] pb-3">
          <h2 className="text-sm font-semibold text-[#202521]">Emergency Runway Reserves</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] text-[#777F79] font-medium">Current Emergency Fund Balance</label>
            <input
              type="number"
              value={emergencyBalance}
              onChange={(e) => setEmergencyBalance(Number(e.target.value))}
              className="w-full bg-[#F8F9F7] border border-[#E8EBE7] rounded-md px-3 py-1.5 text-xs font-mono text-[#202521] focus:outline-none focus:border-[#237A57]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[#777F79] font-medium">Target Months of Essential Burn</label>
            <select
              value={targetMonths}
              onChange={(e) => setTargetMonths(Number(e.target.value))}
              className="w-full bg-[#F8F9F7] border border-[#E8EBE7] rounded-md px-3 py-1.5 text-xs text-[#202521] focus:outline-none focus:border-[#237A57]"
            >
              <option value={3}>3 Months (Aggressive / Secure)</option>
              <option value={6}>6 Months (Standard Commercial Recommendation)</option>
              <option value={9}>9 Months (Conservative)</option>
              <option value={12}>12 Months (Maximum Autonomy)</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[#777F79]">
            <span>Fund Completion Trajectory</span>
            <span className="font-mono text-[#202521]">
              {Math.min(100, Math.round((emergencyBalance / (metrics.emergencyFundCalculatedTarget || 1)) * 100))}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-[#E8EBE7]">
            <div
              style={{
                width: `${Math.min(100, (emergencyBalance / (metrics.emergencyFundCalculatedTarget || 1)) * 100)}%`,
              }}
              className="h-full bg-[#237A57] rounded-full"
            />
          </div>
          <div className="text-[11px] text-[#777F79] font-mono">
            Target capital needed: {formatCurrency(metrics.emergencyFundCalculatedTarget, currency)}
          </div>
        </div>
      </div>

      {/* Section 3: Savings Goals */}
      <div className="bg-white border border-[#E8EBE7] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8EBE7] pb-3">
          <h2 className="text-sm font-semibold text-[#202521]">Target Financial Priorities</h2>
          <button
            onClick={addGoal}
            className="text-xs font-medium text-[#237A57] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Goal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {savingsGoals.map((g, i) => (
            <div
              key={g.id}
              className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <input
                  type="text"
                  value={g.title}
                  onChange={(e) => {
                    const updated = [...savingsGoals];
                    updated[i].title = e.target.value;
                    setSavingsGoals(updated);
                  }}
                  className="font-medium text-[#202521] bg-transparent focus:outline-none flex-1 truncate"
                />
                <button
                  onClick={() => setSavingsGoals(savingsGoals.filter((item) => item.id !== g.id))}
                  className="text-[#777F79] hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="font-mono text-[#237A57] font-semibold text-xs">
                {formatCurrency(g.currentAmount, currency)}{' '}
                <span className="text-[#777F79] font-normal text-[11px]">
                  / {formatCurrency(g.targetAmount, currency)}
                </span>
              </div>

              <div className="text-[11px] text-[#777F79] flex items-center justify-between pt-1 border-t border-[#E8EBE7]">
                <span>Target: {g.targetDate}</span>
                <span className="font-mono">{formatCurrency(g.monthlyTarget, currency)}/mo</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
