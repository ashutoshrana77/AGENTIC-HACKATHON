import React, { useState, useMemo } from 'react';
import { FinancialState, ScenarioParameters, ScenarioResult } from '../types/finance.js';
import { formatCurrency, formatPercent } from '../utils/formatters.js';
import {
  SlidersHorizontal,
  RotateCcw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ScenarioSimulatorViewProps {
  state: FinancialState;
}

export const ScenarioSimulatorView: React.FC<ScenarioSimulatorViewProps> = ({ state }) => {
  const { profile, metrics } = state;
  const currency = profile.currency;

  const [incomeChangePercent, setIncomeChangePercent] = useState<number>(0);
  const [unexpectedExpense, setUnexpectedExpense] = useState<number>(0);
  const [newRecurringMonthly, setNewRecurringMonthly] = useState<number>(0);
  const [rentUtilityChangeMonthly, setRentUtilityChangeMonthly] = useState<number>(0);
  const [savingsAdjustmentPercent, setSavingsAdjustmentPercent] = useState<number>(0);

  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    risks: string[];
    actionPlan: string[];
  } | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Deterministic simulation calculation
  const simulation = useMemo((): ScenarioResult => {
    const baseIncome = metrics.totalMonthlyIncome;
    const simIncome = Math.max(0, baseIncome * (1 + incomeChangePercent / 100));

    const simCommitted =
      metrics.committedFixedObligations + newRecurringMonthly + rentUtilityChangeMonthly;

    const baseEssential = metrics.essentialSpending + rentUtilityChangeMonthly;
    const simExpenses = metrics.totalMonthlyExpenses + newRecurringMonthly + rentUtilityChangeMonthly;
    const simCashflow = simIncome - simExpenses;

    const simEmergencyBalance = Math.max(0, profile.emergencyFund.currentBalance - unexpectedExpense);
    const simEssentialBaseline = Math.max(baseEssential, simCommitted * 0.9);
    const simRunway =
      simEssentialBaseline > 0
        ? Math.round((simEmergencyBalance / simEssentialBaseline) * 10) / 10
        : 0;

    const simRemainingDaily = Math.max(0, Math.round((simCashflow / 30) * 10) / 10);

    const monthlyGoalCommitment = profile.savingsGoals.reduce((s, g) => s + g.monthlyTarget, 0);
    const cashflowDelta = metrics.netMonthlyCashFlow - simCashflow;
    let monthsDelay = 0;
    if (cashflowDelta > 0 && monthlyGoalCommitment > 0) {
      monthsDelay = Math.min(24, Math.round((cashflowDelta / monthlyGoalCommitment) * 3));
    }
    if (unexpectedExpense > 0 && monthlyGoalCommitment > 0) {
      monthsDelay += Math.round(unexpectedExpense / monthlyGoalCommitment);
    }

    const breaches: string[] = [];
    const simEssentialPct = simIncome > 0 ? (simCommitted / simIncome) * 100 : 100;
    if (simEssentialPct > profile.guardrails.essentialLimitPercent) {
      breaches.push(`Essential obligations exceed ${profile.guardrails.essentialLimitPercent}% cap (${Math.round(simEssentialPct)}%)`);
    }
    if (simRunway < 3) {
      breaches.push(`Emergency runway dropped below 3-month safety floor (${simRunway} months)`);
    }
    if (simCashflow < 0) {
      breaches.push(`Monthly deficit: -${formatCurrency(Math.abs(simCashflow), currency)}/mo`);
    }

    const healthDrop = (breaches.length * 15) + (cashflowDelta > 1000 ? 12 : 5);
    const simHealthScore = Math.max(15, Math.min(100, metrics.financialHealthScore - healthDrop));

    return {
      baseline: {
        monthlyIncome: metrics.totalMonthlyIncome,
        monthlyExpenses: metrics.totalMonthlyExpenses,
        netCashflow: metrics.netMonthlyCashFlow,
        safeToSpendDaily: metrics.safeToSpendPerDay,
        runwayMonths: metrics.runwayMonths,
        healthScore: metrics.financialHealthScore,
      },
      simulated: {
        monthlyIncome: Math.round(simIncome),
        monthlyExpenses: Math.round(simExpenses),
        netCashflow: Math.round(simCashflow),
        safeToSpendDaily: simRemainingDaily,
        runwayMonths: simRunway,
        healthScore: simHealthScore,
        breachedGuardrails: breaches,
        emergencyFundRemaining: simEmergencyBalance,
        monthsDelayToGoals: monthsDelay,
      },
    };
  }, [
    metrics,
    profile,
    incomeChangePercent,
    unexpectedExpense,
    newRecurringMonthly,
    rentUtilityChangeMonthly,
    savingsAdjustmentPercent,
    currency,
  ]);

  const applyPreset = (preset: 'layoff' | 'emergency' | 'car' | 'raise') => {
    setAiAnalysis(null);
    if (preset === 'layoff') {
      setIncomeChangePercent(-35);
      setUnexpectedExpense(0);
      setNewRecurringMonthly(0);
      setRentUtilityChangeMonthly(0);
    } else if (preset === 'emergency') {
      setIncomeChangePercent(0);
      setUnexpectedExpense(3500);
      setNewRecurringMonthly(0);
      setRentUtilityChangeMonthly(0);
    } else if (preset === 'car') {
      setIncomeChangePercent(0);
      setUnexpectedExpense(1200);
      setNewRecurringMonthly(380);
      setRentUtilityChangeMonthly(0);
    } else if (preset === 'raise') {
      setIncomeChangePercent(15);
      setUnexpectedExpense(0);
      setNewRecurringMonthly(0);
      setRentUtilityChangeMonthly(0);
    }
  };

  const resetAll = () => {
    setIncomeChangePercent(0);
    setUnexpectedExpense(0);
    setNewRecurringMonthly(0);
    setRentUtilityChangeMonthly(0);
    setAiAnalysis(null);
  };

  const handleRequestAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      const res = await fetch('/api/ai/scenario-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params: {
            incomeChangePercent,
            unexpectedExpense,
            newRecurringExpenseMonthly: newRecurringMonthly,
            rentOrUtilityChangeMonthly: rentUtilityChangeMonthly,
            savingsAdjustmentPercent,
          },
          baseline: simulation.baseline,
          simulated: simulation.simulated,
          currency,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const isChanged =
    incomeChangePercent !== 0 ||
    unexpectedExpense !== 0 ||
    newRecurringMonthly !== 0 ||
    rentUtilityChangeMonthly !== 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#202521]">Financial Scenario Simulator</h1>
          <p className="text-xs text-[#777F79]">
            Stress-test liquidity, runway, and cashflow outcomes under unexpected life circumstances
          </p>
        </div>

        {isChanged && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202521] bg-white hover:bg-[#F8F9F7] border border-[#E8EBE7] rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#777F79]" />
            Reset Parameters
          </button>
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#777F79] mr-1">Commercial Presets:</span>
        <button
          onClick={() => applyPreset('layoff')}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-[#F8F9F7] border border-[#E8EBE7] text-[#202521] transition-colors"
        >
          Job Transition (-35% Inflow)
        </button>
        <button
          onClick={() => applyPreset('emergency')}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-[#F8F9F7] border border-[#E8EBE7] text-[#202521] transition-colors"
        >
          Medical Outflow ($3,500)
        </button>
        <button
          onClick={() => applyPreset('car')}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-[#F8F9F7] border border-[#E8EBE7] text-[#202521] transition-colors"
        >
          New Auto Lease ($380/mo)
        </button>
        <button
          onClick={() => applyPreset('raise')}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-[#F8F9F7] border border-[#E8EBE7] text-[#202521] transition-colors"
        >
          Career Raise (+15% Inflow)
        </button>
      </div>

      {/* Grid: Simulator Variables (5 Cols) vs Impact Matrix (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-white border border-[#E8EBE7] rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#202521] border-b border-[#E8EBE7] pb-3">
            Scenario Parameters
          </h2>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#202521] font-medium">Income Inflow Shift</span>
              <span className="font-mono text-[#202521] font-semibold">
                {incomeChangePercent > 0 ? `+${incomeChangePercent}` : incomeChangePercent}%
              </span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              step={5}
              value={incomeChangePercent}
              onChange={(e) => setIncomeChangePercent(Number(e.target.value))}
              className="w-full accent-[#237A57]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#202521] font-medium">Unplanned One-Time Outflow</span>
              <span className="font-mono text-rose-700 font-semibold">
                {formatCurrency(unexpectedExpense, currency)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10000}
              step={500}
              value={unexpectedExpense}
              onChange={(e) => setUnexpectedExpense(Number(e.target.value))}
              className="w-full accent-rose-600"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#202521] font-medium">New Recurring Monthly Commitment</span>
              <span className="font-mono text-[#202521] font-semibold">
                +{formatCurrency(newRecurringMonthly, currency)}/mo
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1500}
              step={50}
              value={newRecurringMonthly}
              onChange={(e) => setNewRecurringMonthly(Number(e.target.value))}
              className="w-full accent-[#237A57]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#202521] font-medium">Rent / Utility Inflation</span>
              <span className="font-mono text-[#202521] font-semibold">
                +{formatCurrency(rentUtilityChangeMonthly, currency)}/mo
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={600}
              step={25}
              value={rentUtilityChangeMonthly}
              onChange={(e) => setRentUtilityChangeMonthly(Number(e.target.value))}
              className="w-full accent-[#237A57]"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleRequestAnalysis}
              disabled={isLoadingAnalysis}
              className="w-full py-2 px-3 bg-[#237A57] hover:bg-[#1D6548] text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
            >
              {isLoadingAnalysis ? 'Synthesizing...' : 'Generate Scenario Memo'}
            </button>
          </div>
        </div>

        {/* Matrix Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#E8EBE7] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EBE7] pb-3">
              <h2 className="text-sm font-semibold text-[#202521]">Deterministic Variance Matrix</h2>
              <span className="text-xs text-[#777F79]">Baseline vs. Simulated</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md">
                <span className="text-[10px] text-[#777F79] font-medium uppercase tracking-wider block">
                  Net Flow
                </span>
                <div className="text-xs text-[#777F79] line-through font-mono mt-1">
                  {formatCurrency(simulation.baseline.netCashflow, currency)}
                </div>
                <div
                  className={`text-sm font-bold font-mono mt-0.5 ${
                    simulation.simulated.netCashflow < 0 ? 'text-rose-700' : 'text-[#237A57]'
                  }`}
                >
                  {formatCurrency(simulation.simulated.netCashflow, currency)}
                </div>
              </div>

              <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md">
                <span className="text-[10px] text-[#777F79] font-medium uppercase tracking-wider block">
                  Runway
                </span>
                <div className="text-xs text-[#777F79] line-through font-mono mt-1">
                  {simulation.baseline.runwayMonths} mo
                </div>
                <div
                  className={`text-sm font-bold font-mono mt-0.5 ${
                    simulation.simulated.runwayMonths < 3 ? 'text-rose-700' : 'text-[#202521]'
                  }`}
                >
                  {simulation.simulated.runwayMonths} mo
                </div>
              </div>

              <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md">
                <span className="text-[10px] text-[#777F79] font-medium uppercase tracking-wider block">
                  Daily Safe
                </span>
                <div className="text-xs text-[#777F79] line-through font-mono mt-1">
                  {formatCurrency(simulation.baseline.safeToSpendDaily, currency)}
                </div>
                <div className="text-sm font-bold font-mono text-[#202521] mt-0.5">
                  {formatCurrency(simulation.simulated.safeToSpendDaily, currency)}
                </div>
              </div>

              <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md">
                <span className="text-[10px] text-[#777F79] font-medium uppercase tracking-wider block">
                  Health Index
                </span>
                <div className="text-xs text-[#777F79] line-through font-mono mt-1">
                  {simulation.baseline.healthScore}/100
                </div>
                <div className="text-sm font-bold font-mono text-[#202521] mt-0.5">
                  {simulation.simulated.healthScore}/100
                </div>
              </div>
            </div>

            {simulation.simulated.breachedGuardrails.length > 0 && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 space-y-1 text-xs">
                <div className="font-semibold text-rose-800">Guardrail Breaches Detected</div>
                {simulation.simulated.breachedGuardrails.map((b, i) => (
                  <p key={i} className="text-[11px] text-rose-700 pl-2">
                    • {b}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* AI Scenario Memo */}
          {aiAnalysis && (
            <div className="bg-white border border-[#E8EBE7] rounded-lg p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#202521]">
                Scenario Strategic Evaluation
              </h3>
              <p className="text-xs text-[#202521] leading-relaxed">{aiAnalysis.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md text-xs space-y-1">
                  <span className="font-semibold text-[#202521]">Vulnerabilities:</span>
                  {aiAnalysis.risks.map((r, i) => (
                    <div key={i} className="text-[#777F79] text-[11px]">
                      • {r}
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md text-xs space-y-1">
                  <span className="font-semibold text-[#202521]">Mitigation Steps:</span>
                  {aiAnalysis.actionPlan.map((a, i) => (
                    <div key={i} className="text-[#777F79] text-[11px]">
                      • {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
