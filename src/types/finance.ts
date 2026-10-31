export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP';

export type SpendingType = 'essential' | 'discretionary' | 'income' | 'savings';

export type TransactionSource = 'csv' | 'pdf' | 'sms' | 'manual' | 'demo';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  merchant: string;
  amount: number; // positive = credit/income, negative = debit/expense
  category: string;
  spendingType: SpendingType;
  accountName: string;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'annual' | 'weekly' | 'biweekly';
  source: TransactionSource;
  status: 'cleared' | 'pending' | 'flagged';
  notes?: string;
  rawText?: string;
}

export interface CategorizationRule {
  id: string;
  pattern: string; // substring match or regex pattern
  matchField: 'merchant' | 'description';
  targetCategory: string;
  targetSpendingType: SpendingType;
  createdAt: string;
  timesApplied: number;
  isUserDefined: boolean;
}

export interface RecurringCommitment {
  id: string;
  name: string;
  merchant: string;
  amount: number;
  previousAmount?: number; // for price change detection
  frequency: 'monthly' | 'annual' | 'quarterly';
  category: string;
  spendingType: SpendingType;
  nextDueDate: string;
  status: 'active' | 'flagged_unused' | 'flagged_increase' | 'flagged_duplicate' | 'confirmed_active' | 'cancelled';
  unusedEvidence?: string;
  duplicateNotice?: string;
  account: string;
  lastPaymentDate: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'biweekly' | 'irregular';
  type: 'salary' | 'freelance' | 'rental' | 'investments';
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  monthlyTarget: number;
  category: string;
  isAutomated: boolean;
}

export interface DebtCommitment {
  id: string;
  name: string;
  totalBalance: number;
  interestRate: number;
  monthlyPayment: number;
  dueDate: string;
}

export interface EmergencyFundConfig {
  currentBalance: number;
  targetMonths: number;
  monthlyContribution: number;
}

export interface Guardrails {
  essentialLimitPercent: number; // e.g. 50
  discretionaryLimitPercent: number; // e.g. 30
  savingsTargetPercent: number; // e.g. 20
}

export interface CalculatedFinancialMetrics {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  essentialSpending: number;
  discretionarySpending: number;
  committedFixedObligations: number;
  netMonthlyCashFlow: number;
  safeToSpendPerDay: number;
  effectiveSavingsRate: number;
  emergencyFundCalculatedTarget: number;
  runwayMonths: number;
  financialHealthScore: number; // 0-100
  essentialPercentOfIncome: number;
  discretionaryPercentOfIncome: number;
}

export interface LivingMoneyModel {
  currency: CurrencyCode;
  userName: string;
  userRole: string;
  monthlyGrossIncome: number;
  monthlyNetIncome: number;
  incomeVariability: 'stable' | 'moderate' | 'high';
  incomeSources: IncomeSource[];
  emergencyFund: EmergencyFundConfig;
  savingsGoals: SavingsGoal[];
  debtCommitments: DebtCommitment[];
  guardrails: Guardrails;
}

export interface NudgeAlert {
  id: string;
  type: 'drift_warning' | 'subscription_hike' | 'unused_sub' | 'savings_lag' | 'cashflow_runway' | 'win_milestone';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
  impactAmount?: number;
  actionLabel?: string;
  actionType?: string;
  date: string;
  dismissed: boolean;
}

export interface FinancialState {
  profile: LivingMoneyModel;
  transactions: Transaction[];
  recurring: RecurringCommitment[];
  rules: CategorizationRule[];
  nudges: NudgeAlert[];
  metrics: CalculatedFinancialMetrics;
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionSuggestions?: string[];
  metricsSnapshot?: {
    safeToSpend: number;
    savingsRate: number;
    healthScore: number;
  };
}

export interface ScenarioParameters {
  incomeChangePercent: number; // e.g. -20 for 20% cut
  unexpectedExpense: number; // one-time cash shock
  newRecurringExpenseMonthly: number; // e.g. car loan
  rentOrUtilityChangeMonthly: number;
  savingsAdjustmentPercent: number; // change in savings target
}

export interface ScenarioResult {
  baseline: {
    monthlyIncome: number;
    monthlyExpenses: number;
    netCashflow: number;
    safeToSpendDaily: number;
    runwayMonths: number;
    healthScore: number;
  };
  simulated: {
    monthlyIncome: number;
    monthlyExpenses: number;
    netCashflow: number;
    safeToSpendDaily: number;
    runwayMonths: number;
    healthScore: number;
    breachedGuardrails: string[];
    emergencyFundRemaining: number;
    monthsDelayToGoals: number;
  };
}
