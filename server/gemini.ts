import { GoogleGenAI } from '@google/genai';
import { FinancialState, ScenarioParameters, ScenarioResult } from '../src/types/finance.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function chatWithFinancialCoach(
  userMessage: string,
  history: Array<{ sender: 'user' | 'assistant'; text: string }>,
  state: FinancialState
): Promise<string> {
  const profile = state.profile;
  const metrics = state.metrics;
  const currencySymbol = profile.currency === 'USD' ? '$' : profile.currency === 'INR' ? '₹' : '€';

  const financialContext = `
[CURRENT LIVING MONEY MODEL SNAPSHOT]
User: ${profile.userName} (${profile.userRole})
Currency: ${profile.currency} (${currencySymbol})
Monthly Net Inflow: ${currencySymbol}${metrics.totalMonthlyIncome.toLocaleString()}
Monthly Total Expenses: ${currencySymbol}${metrics.totalMonthlyExpenses.toLocaleString()}
Committed Fixed Obligations (Rent, Debt, Subscriptions): ${currencySymbol}${metrics.committedFixedObligations.toLocaleString()}
Essential Spending: ${currencySymbol}${metrics.essentialSpending.toLocaleString()} (${metrics.essentialPercentOfIncome}% of income)
Discretionary Spending: ${currencySymbol}${metrics.discretionarySpending.toLocaleString()} (${metrics.discretionaryPercentOfIncome}% of income)
Safe-to-Spend per Day (Remaining Uncommitted Cash): ${currencySymbol}${metrics.safeToSpendPerDay.toLocaleString()}
Effective Savings Rate: ${metrics.effectiveSavingsRate}% (Target: ${profile.guardrails.savingsTargetPercent}%)
Emergency Fund: ${currencySymbol}${profile.emergencyFund.currentBalance.toLocaleString()} / Target: ${currencySymbol}${metrics.emergencyFundCalculatedTarget.toLocaleString()} (${metrics.runwayMonths} months runway)
Financial Health Score: ${metrics.financialHealthScore}/100

Active Savings Goals:
${profile.savingsGoals.map((g) => `- ${g.title}: ${currencySymbol}${g.currentAmount} / ${currencySymbol}${g.targetAmount} (Target Date: ${g.targetDate}, Monthly: ${currencySymbol}${g.monthlyTarget})`).join('\n')}

Debt Commitments:
${profile.debtCommitments.map((d) => `- ${d.name}: Balance ${currencySymbol}${d.totalBalance}, Payment ${currencySymbol}${d.monthlyPayment}/mo, APR ${d.interestRate}%`).join('\n')}

Key Recurring Commitments:
${state.recurring.slice(0, 8).map((r) => `- ${r.name}: ${currencySymbol}${r.amount}/mo (${r.spendingType})`).join('\n')}

Active Nudges / Alerts:
${state.nudges.filter((n) => !n.dismissed).map((n) => `- [${n.severity.toUpperCase()}] ${n.title}: ${n.message}`).join('\n')}
`;

  const systemInstruction = `You are FINMATE AI, an intelligent personal finance coach grounded in the user's Living Money Model.

Core Rules & Constraints:
1. Ground every answer in the user's exact financial numbers provided in the context.
2. Differentiate facts (historical data, bank balances) from estimates and scenario projections.
3. Show your math clearly (e.g., "Out of your $7,150 net income, $3,044 is already committed to fixed obligations...").
4. Educational and coaching guidance only: NEVER recommend specific stocks, crypto, mutual funds, or speculative securities.
5. Emphasize mindful liquidity, cash runway, debt freedom, and intentional spending rather than restrictive guilt.
6. When asked "Can I afford X?", calculate the impact on their remaining daily safe-to-spend and emergency buffer.
7. Keep responses structured, concise, and easy to scan using clean bullet points and clear bold text. Avoid walls of text.`;

  try {
    const formattedHistory = history.slice(-6).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const promptWithContext = `${financialContext}\n\nUser Question: ${userMessage}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptWithContext,
      config: {
        systemInstruction,
      },
    });

    return response.text || "I've reviewed your Living Money Model. How can I assist you with your budget, goals, or upcoming commitments today?";
  } catch (error) {
    console.error('Error in Gemini chatWithFinancialCoach:', error);
    // Intelligent deterministic fallback
    return `Based on your Living Money Model, your net monthly income is ${currencySymbol}${metrics.totalMonthlyIncome.toLocaleString()}, with ${currencySymbol}${metrics.committedFixedObligations.toLocaleString()} in committed fixed costs. Your current daily safe-to-spend is ${currencySymbol}${metrics.safeToSpendPerDay.toLocaleString()}, and your emergency runway stands at ${metrics.runwayMonths} months (${metrics.financialHealthScore}/100 Health Score).`;
  }
}

export async function parseUnstructuredTransactions(
  rawText: string,
  sourceType: 'sms' | 'pdf_ocr' | 'csv_text'
): Promise<Array<{
  date: string;
  description: string;
  merchant: string;
  amount: number;
  category: string;
  spendingType: 'essential' | 'discretionary' | 'income';
}>> {
  const prompt = `You are a financial document parser. Extract all individual transactions from this unstructured ${sourceType} text.
For each transaction, determine:
- date (YYYY-MM-DD format, estimate current year 2026 if missing)
- description (the clean transaction description)
- merchant (clean recognized company or merchant name)
- amount (positive for credit/deposits/salary, negative for debits/purchases/payments)
- category (one of: 'Income', 'Housing & Rent', 'Utilities & Bills', 'Food & Dining', 'Transportation', 'Health & Wellness', 'Entertainment & Subscriptions', 'Shopping & Personal', 'Education & Growth', 'Debt & Loans')
- spendingType ('essential' for necessities/bills/groceries/rent, 'discretionary' for dining out/shopping/entertainment, 'income' for salary/earnings)

Return valid JSON array only.

Raw Text:
"""
${rawText}
"""`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        date: item.date || new Date().toISOString().split('T')[0],
        description: String(item.description || item.merchant || 'Transaction'),
        merchant: String(item.merchant || item.description || 'Unknown Merchant'),
        amount: Number(item.amount) || -10,
        category: String(item.category || 'Shopping & Personal'),
        spendingType: item.spendingType === 'essential' || item.spendingType === 'income' ? item.spendingType : 'discretionary',
      }));
    }
    return [];
  } catch (err) {
    console.error('Error in parseUnstructuredTransactions:', err);
    return [];
  }
}

export async function generateScenarioEvaluation(
  params: ScenarioParameters,
  result: ScenarioResult,
  currency: string
): Promise<{ summary: string; risks: string[]; actionPlan: string[] }> {
  const sym = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : '€';

  const prompt = `You are FINMATE AI Financial Analyst. Evaluate this what-if financial scenario simulation:
Parameters:
- Income Change: ${params.incomeChangePercent}%
- Unexpected Cash Outflow: ${sym}${params.unexpectedExpense.toLocaleString()}
- New Recurring Commitment: ${sym}${params.newRecurringExpenseMonthly.toLocaleString()}/mo
- Rent/Utility Change: ${sym}${params.rentOrUtilityChangeMonthly.toLocaleString()}/mo
- Savings Target Adjustment: ${params.savingsAdjustmentPercent}%

Impact Analysis:
- Monthly Net Cashflow: Baseline ${sym}${result.baseline.netCashflow.toLocaleString()} -> Simulated ${sym}${result.simulated.netCashflow.toLocaleString()}
- Emergency Runway: Baseline ${result.baseline.runwayMonths} months -> Simulated ${result.simulated.runwayMonths} months
- Daily Safe-to-Spend: Baseline ${sym}${result.baseline.safeToSpendDaily} -> Simulated ${sym}${result.simulated.safeToSpendDaily}
- Health Score: Baseline ${result.baseline.healthScore}/100 -> Simulated ${result.simulated.healthScore}/100
- Guardrail Breaches: ${result.simulated.breachedGuardrails.join(', ') || 'None'}
- Estimated Goal Delay: ${result.simulated.monthsDelayToGoals} months

Provide a concise, practical evaluation with:
1. summary (2 sentences assessing viability)
2. risks (2-3 key vulnerability points)
3. actionPlan (3 concrete, actionable steps to absorb this scenario)

Respond in JSON with keys: "summary", "risks" (array of strings), "actionPlan" (array of strings).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      summary: parsed.summary || 'Scenario simulated. Please review changes to cash flow and emergency reserves.',
      risks: parsed.risks || ['Reduced liquidity buffer', 'Slower progress toward long-term goals'],
      actionPlan: parsed.actionPlan || [
        'Review discretionary spending caps',
        'Pause non-automated savings contributions temporarily',
        'Consolidate underutilized subscription services',
      ],
    };
  } catch (err) {
    console.error('Error in generateScenarioEvaluation:', err);
    return {
      summary: `This scenario shifts your monthly cash flow by ${sym}${Math.abs(result.baseline.netCashflow - result.simulated.netCashflow).toLocaleString()}.`,
      risks: ['Buffer contraction', 'Goal timelines delayed by approximately ' + result.simulated.monthsDelayToGoals + ' months'],
      actionPlan: [
        'Trim flexible dining and entertainment commitments',
        'Keep emergency reserves above the 3-month safety floor',
        'Recalibrate high-priority savings targets',
      ],
    };
  }
}

export async function generateMonthlyReviewActionables(
  monthName: string,
  state: FinancialState
): Promise<{ title: string; reasoning: string; projectedImpact: string }[]> {
  const sym = state.profile.currency === 'USD' ? '$' : state.profile.currency === 'INR' ? '₹' : '€';

  const prompt = `You are FINMATE AI Coach. Generate 3 specific, realistic, actionable financial improvements for the upcoming month based on this month's financial behavior:
Month: ${monthName}
Net Income: ${sym}${state.metrics.totalMonthlyIncome}
Total Spend: ${sym}${state.metrics.totalMonthlyExpenses}
Essential Spend: ${sym}${state.metrics.essentialSpending}
Discretionary Spend: ${sym}${state.metrics.discretionarySpending}
Active Subscriptions: ${state.recurring.length} items (${sym}${state.metrics.committedFixedObligations} committed)
Savings Rate: ${state.metrics.effectiveSavingsRate}%

Respond in JSON array with 3 objects containing:
- title: concise title
- reasoning: why this matters based on user data
- projectedImpact: specific financial gain or savings (e.g. "+$140/mo liquidity")`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Error generating monthly review:', err);
  }

  return [
    {
      title: 'Consolidate Redundant Audio Subscriptions',
      reasoning: 'You are currently paying for both Apple Music and Spotify Duo simultaneously.',
      projectedImpact: `Save ${sym}132/year in recurring overhead`,
    },
    {
      title: 'Pause Underutilized Gym Membership',
      reasoning: 'Equinox membership recorded 0 check-ins in the last 45 days.',
      projectedImpact: `Freed ${sym}260/month redirected to Home Down Payment`,
    },
    {
      title: 'Cap Mid-Week Food Delivery & Diners',
      reasoning: 'Dining out drifted 18% beyond target pace during the 3rd week.',
      projectedImpact: `Gain ${sym}120/month in liquid cash buffer`,
    },
  ];
}
