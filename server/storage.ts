import fs from 'fs';
import path from 'path';
import {
  FinancialState,
  Transaction,
  CategorizationRule,
  RecurringCommitment,
  LivingMoneyModel,
  NudgeAlert,
  CalculatedFinancialMetrics,
} from '../src/types/finance.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'finmate_data.json');

const INITIAL_PROFILE: LivingMoneyModel = {
  currency: 'USD',
  userName: 'Alex Morgan',
  userRole: 'Senior UX Designer',
  monthlyGrossIncome: 8750,
  monthlyNetIncome: 7150,
  incomeVariability: 'stable',
  incomeSources: [
    {
      id: 'inc-1',
      name: 'Primary Tech Salary',
      amount: 6200,
      frequency: 'monthly',
      type: 'salary',
    },
    {
      id: 'inc-2',
      name: 'Design Advisory & Consulting',
      amount: 950,
      frequency: 'monthly',
      type: 'freelance',
    },
  ],
  emergencyFund: {
    currentBalance: 18500,
    targetMonths: 6,
    monthlyContribution: 500,
  },
  savingsGoals: [
    {
      id: 'goal-1',
      title: 'Full Emergency Runway (6 Mo)',
      targetAmount: 22500,
      currentAmount: 18500,
      targetDate: '2027-04-30',
      priority: 'high',
      monthlyTarget: 500,
      category: 'Safety',
      isAutomated: true,
    },
    {
      id: 'goal-2',
      title: 'First Home Down Payment',
      targetAmount: 60000,
      currentAmount: 24500,
      targetDate: '2028-12-31',
      priority: 'high',
      monthlyTarget: 850,
      category: 'Real Estate',
      isAutomated: true,
    },
    {
      id: 'goal-3',
      title: 'Japan Autumn Exploration',
      targetAmount: 4800,
      currentAmount: 2600,
      targetDate: '2027-10-15',
      priority: 'medium',
      monthlyTarget: 220,
      category: 'Travel',
      isAutomated: false,
    },
  ],
  debtCommitments: [
    {
      id: 'debt-1',
      name: 'Undergrad Student Loan Refinance',
      totalBalance: 13400,
      interestRate: 4.2,
      monthlyPayment: 320,
      dueDate: '15th',
    },
    {
      id: 'debt-2',
      name: 'Honda Civic Auto Loan',
      totalBalance: 8600,
      interestRate: 3.8,
      monthlyPayment: 290,
      dueDate: '22nd',
    },
  ],
  guardrails: {
    essentialLimitPercent: 50,
    discretionaryLimitPercent: 30,
    savingsTargetPercent: 20,
  },
};

const INITIAL_RULES: CategorizationRule[] = [
  {
    id: 'rule-1',
    pattern: 'Whole Foods',
    matchField: 'merchant',
    targetCategory: 'Food & Dining',
    targetSpendingType: 'essential',
    createdAt: '2026-09-01T10:00:00Z',
    timesApplied: 14,
    isUserDefined: false,
  },
  {
    id: 'rule-2',
    pattern: 'Sweetgreen',
    matchField: 'merchant',
    targetCategory: 'Food & Dining',
    targetSpendingType: 'discretionary',
    createdAt: '2026-09-05T12:00:00Z',
    timesApplied: 8,
    isUserDefined: true,
  },
  {
    id: 'rule-3',
    pattern: 'Lease Rent',
    matchField: 'description',
    targetCategory: 'Housing & Rent',
    targetSpendingType: 'essential',
    createdAt: '2026-08-01T09:00:00Z',
    timesApplied: 3,
    isUserDefined: false,
  },
  {
    id: 'rule-4',
    pattern: 'Uber',
    matchField: 'merchant',
    targetCategory: 'Transportation',
    targetSpendingType: 'discretionary',
    createdAt: '2026-09-12T14:00:00Z',
    timesApplied: 9,
    isUserDefined: true,
  },
  {
    id: 'rule-5',
    pattern: 'Subway Pass',
    matchField: 'description',
    targetCategory: 'Transportation',
    targetSpendingType: 'essential',
    createdAt: '2026-08-15T08:00:00Z',
    timesApplied: 3,
    isUserDefined: false,
  },
  {
    id: 'rule-6',
    pattern: 'Coursera',
    matchField: 'merchant',
    targetCategory: 'Education & Growth',
    targetSpendingType: 'essential',
    createdAt: '2026-09-18T18:00:00Z',
    timesApplied: 2,
    isUserDefined: true,
  },
];

const INITIAL_RECURRING: RecurringCommitment[] = [
  {
    id: 'rec-1',
    name: 'Apartment Residential Lease',
    merchant: 'Avalon Bay Communities',
    amount: 2150,
    frequency: 'monthly',
    category: 'Housing & Rent',
    spendingType: 'essential',
    nextDueDate: '2026-11-01',
    lastPaymentDate: '2026-10-01',
    status: 'active',
    account: 'Primary Checking ···4921',
  },
  {
    id: 'rec-2',
    name: 'Netflix Premium 4K',
    merchant: 'Netflix Inc',
    amount: 22.99,
    previousAmount: 19.99,
    frequency: 'monthly',
    category: 'Entertainment & Subscriptions',
    spendingType: 'discretionary',
    nextDueDate: '2026-11-08',
    lastPaymentDate: '2026-10-08',
    status: 'flagged_increase',
    account: 'Preferred Sapphire ···3320',
  },
  {
    id: 'rec-3',
    name: 'Equinox Tier X Membership',
    merchant: 'Equinox Fitness',
    amount: 260.0,
    frequency: 'monthly',
    category: 'Health & Wellness',
    spendingType: 'discretionary',
    nextDueDate: '2026-11-12',
    lastPaymentDate: '2026-10-12',
    status: 'flagged_unused',
    unusedEvidence: 'Zero facility badge entries detected in the last 45 days. Potential $3,120/year optimization.',
    account: 'Primary Checking ···4921',
  },
  {
    id: 'rec-4',
    name: 'Spotify Premium Duo',
    merchant: 'Spotify USA',
    amount: 16.99,
    frequency: 'monthly',
    category: 'Entertainment & Subscriptions',
    spendingType: 'discretionary',
    nextDueDate: '2026-11-18',
    lastPaymentDate: '2026-10-18',
    status: 'flagged_duplicate',
    duplicateNotice: 'Redundant with active Apple Music subscription ($10.99/mo).',
    account: 'Preferred Sapphire ···3320',
  },
  {
    id: 'rec-5',
    name: 'Apple Music Individual',
    merchant: 'Apple Services',
    amount: 10.99,
    frequency: 'monthly',
    category: 'Entertainment & Subscriptions',
    spendingType: 'discretionary',
    nextDueDate: '2026-11-20',
    lastPaymentDate: '2026-10-20',
    status: 'flagged_duplicate',
    duplicateNotice: 'Redundant with active Spotify Premium subscription ($16.99/mo).',
    account: 'Preferred Sapphire ···3320',
  },
  {
    id: 'rec-6',
    name: 'AWS Cloud Hosting & Backup',
    merchant: 'Amazon Web Services',
    amount: 44.5,
    frequency: 'monthly',
    category: 'Utilities & Bills',
    spendingType: 'essential',
    nextDueDate: '2026-11-03',
    lastPaymentDate: '2026-10-03',
    status: 'active',
    account: 'Preferred Sapphire ···3320',
  },
  {
    id: 'rec-7',
    name: 'ChatGPT Plus Intelligence',
    merchant: 'OpenAI',
    amount: 20.0,
    frequency: 'monthly',
    category: 'Education & Growth',
    spendingType: 'essential',
    nextDueDate: '2026-11-14',
    lastPaymentDate: '2026-10-14',
    status: 'active',
    account: 'Preferred Sapphire ···3320',
  },
  {
    id: 'rec-8',
    name: 'ConEdison Electric & Gas',
    merchant: 'ConEdison Utilities',
    amount: 142.3,
    frequency: 'monthly',
    category: 'Utilities & Bills',
    spendingType: 'essential',
    nextDueDate: '2026-11-25',
    lastPaymentDate: '2026-10-25',
    status: 'active',
    account: 'Primary Checking ···4921',
  },
  {
    id: 'rec-9',
    name: 'Verizon Fios Fiber 1Gbps',
    merchant: 'Verizon Home',
    amount: 79.99,
    frequency: 'monthly',
    category: 'Utilities & Bills',
    spendingType: 'essential',
    nextDueDate: '2026-11-28',
    lastPaymentDate: '2026-10-28',
    status: 'active',
    account: 'Primary Checking ···4921',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-01',
    date: '2026-10-31',
    description: 'Whole Foods Market Union Sq',
    merchant: 'Whole Foods',
    amount: -128.45,
    category: 'Food & Dining',
    spendingType: 'essential',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: false,
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-02',
    date: '2026-10-30',
    description: 'Bi-Weekly Tech Corp Direct Deposit',
    merchant: 'TechCorp Global Payroll',
    amount: 3100.0,
    category: 'Income',
    spendingType: 'income',
    accountName: 'Primary Checking ···4921',
    isRecurring: true,
    recurringFrequency: 'biweekly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-03',
    date: '2026-10-29',
    description: 'Sweetgreen Greenwich Village',
    merchant: 'Sweetgreen',
    amount: -19.85,
    category: 'Food & Dining',
    spendingType: 'discretionary',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: false,
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-04',
    date: '2026-10-28',
    description: 'ConEdison Direct Debit Utility',
    merchant: 'ConEdison Utilities',
    amount: -142.3,
    category: 'Utilities & Bills',
    spendingType: 'essential',
    accountName: 'Primary Checking ···4921',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-05',
    date: '2026-10-27',
    description: 'Uber *Ride Midtown to Flatiron',
    merchant: 'Uber',
    amount: -28.4,
    category: 'Transportation',
    spendingType: 'discretionary',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: false,
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-06',
    date: '2026-10-25',
    description: 'Equinox Club Dues Oct26',
    merchant: 'Equinox Fitness',
    amount: -260.0,
    category: 'Health & Wellness',
    spendingType: 'discretionary',
    accountName: 'Primary Checking ···4921',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-07',
    date: '2026-10-24',
    description: 'Trader Joe’s Market Grocery',
    merchant: 'Trader Joe’s',
    amount: -86.2,
    category: 'Food & Dining',
    spendingType: 'essential',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: false,
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-08',
    date: '2026-10-22',
    description: 'Honda Financial Services Auto Loan',
    merchant: 'Honda Auto Loan',
    amount: -290.0,
    category: 'Debt & Loans',
    spendingType: 'essential',
    accountName: 'Primary Checking ···4921',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-09',
    date: '2026-10-20',
    description: 'Apple Services - Apple Music',
    merchant: 'Apple Services',
    amount: -10.99,
    category: 'Entertainment & Subscriptions',
    spendingType: 'discretionary',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-10',
    date: '2026-10-18',
    description: 'Spotify USA Monthly Duo',
    merchant: 'Spotify USA',
    amount: -16.99,
    category: 'Entertainment & Subscriptions',
    spendingType: 'discretionary',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-11',
    date: '2026-10-16',
    description: 'Blue Bottle Coffee Roasters',
    merchant: 'Blue Bottle Coffee',
    amount: -6.75,
    category: 'Food & Dining',
    spendingType: 'discretionary',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: false,
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-12',
    date: '2026-10-15',
    description: 'SoFi Refinance Student Loan Pmt',
    merchant: 'SoFi Student Loan',
    amount: -320.0,
    category: 'Debt & Loans',
    spendingType: 'essential',
    accountName: 'Primary Checking ···4921',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-13',
    date: '2026-10-15',
    description: 'Bi-Weekly Tech Corp Direct Deposit',
    merchant: 'TechCorp Global Payroll',
    amount: 3100.0,
    category: 'Income',
    spendingType: 'income',
    accountName: 'Primary Checking ···4921',
    isRecurring: true,
    recurringFrequency: 'biweekly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-14',
    date: '2026-10-14',
    description: 'OpenAI ChatGPT Plus Subscription',
    merchant: 'OpenAI',
    amount: -20.0,
    category: 'Education & Growth',
    spendingType: 'essential',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-15',
    date: '2026-10-12',
    description: 'Patagonia Outdoor Apparel Coat',
    merchant: 'Patagonia',
    amount: -189.0,
    category: 'Shopping & Personal',
    spendingType: 'discretionary',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: false,
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-16',
    date: '2026-10-10',
    description: 'Consulting Advisory Wire Client Acct',
    merchant: 'Apex Studios Advisory',
    amount: 950.0,
    category: 'Income',
    spendingType: 'income',
    accountName: 'Primary Checking ···4921',
    isRecurring: false,
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-17',
    date: '2026-10-08',
    description: 'Netflix Monthly Premium 4K (Price Raised)',
    merchant: 'Netflix Inc',
    amount: -22.99,
    category: 'Entertainment & Subscriptions',
    spendingType: 'discretionary',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-18',
    date: '2026-10-03',
    description: 'Amazon Web Services Cloud Charge',
    merchant: 'Amazon Web Services',
    amount: -44.5,
    category: 'Utilities & Bills',
    spendingType: 'essential',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-19',
    date: '2026-10-02',
    description: 'MTA NYC Subway 30-Day Unlimited',
    merchant: 'MTA Subway',
    amount: -132.0,
    category: 'Transportation',
    spendingType: 'essential',
    accountName: 'Primary Checking ···4921',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-20',
    date: '2026-10-01',
    description: 'Avalon Bay Lease Rent Direct Debit',
    merchant: 'Avalon Bay Communities',
    amount: -2150.0,
    category: 'Housing & Rent',
    spendingType: 'essential',
    accountName: 'Primary Checking ···4921',
    isRecurring: true,
    recurringFrequency: 'monthly',
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-21',
    date: '2026-09-28',
    description: 'Coursera Professional Certification',
    merchant: 'Coursera',
    amount: -49.0,
    category: 'Education & Growth',
    spendingType: 'essential',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: false,
    source: 'demo',
    status: 'cleared',
  },
  {
    id: 'tx-22',
    date: '2026-09-25',
    description: 'Local Italian Trattoria Dinner with Friends',
    merchant: 'Via Carota Trattoria',
    amount: -112.5,
    category: 'Food & Dining',
    spendingType: 'discretionary',
    accountName: 'Preferred Sapphire ···3320',
    isRecurring: false,
    source: 'demo',
    status: 'cleared',
  },
];

const INITIAL_NUDGES: NudgeAlert[] = [
  {
    id: 'nudge-1',
    type: 'subscription_hike',
    severity: 'warning',
    title: 'Subscription Price Increase Detected',
    message: 'Netflix increased your monthly charge from $19.99 to $22.99 (+15%). Adds $36/year to recurring commitments.',
    impactAmount: 36,
    actionLabel: 'Review Subscription',
    actionType: 'NAVIGATE_SUBSCRIPTIONS',
    date: '2026-10-08',
    dismissed: false,
  },
  {
    id: 'nudge-2',
    type: 'unused_sub',
    severity: 'warning',
    title: 'Potential Unused Subscription Flagged',
    message: 'Equinox Gym ($260/mo) shows 0 activity check-ins in the past 45 days. Would you like to keep or pause it?',
    impactAmount: 260,
    actionLabel: 'Check Usage',
    actionType: 'MANAGE_SUBSCRIPTION_EQUINOX',
    date: '2026-10-25',
    dismissed: false,
  },
  {
    id: 'nudge-3',
    type: 'unused_sub',
    severity: 'info',
    title: 'Redundant Audio Subscriptions',
    message: 'You have active plans for both Spotify Duo ($16.99) and Apple Music ($10.99). Consolidating could save up to $203/yr.',
    impactAmount: 131.88,
    actionLabel: 'Compare Plans',
    actionType: 'NAVIGATE_SUBSCRIPTIONS',
    date: '2026-10-20',
    dismissed: false,
  },
  {
    id: 'nudge-4',
    type: 'drift_warning',
    severity: 'warning',
    title: 'Dining Out Discretionary Drift',
    message: 'Discretionary food & cafes reached $363 vs your planned $350 pace with 1 day remaining.',
    impactAmount: 13,
    actionLabel: 'View Breakdown',
    actionType: 'NAVIGATE_TRANSACTIONS_FOOD',
    date: '2026-10-30',
    dismissed: false,
  },
];

export class FinanceStorage {
  private state: FinancialState;

  constructor() {
    this.state = this.loadFromFile();
    this.recalculateAllMetrics();
  }

  private loadFromFile(): FinancialState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (err) {
      console.warn('Could not read existing finance storage, using initial seed data.', err);
    }

    const defaultState: FinancialState = {
      profile: INITIAL_PROFILE,
      transactions: INITIAL_TRANSACTIONS,
      recurring: INITIAL_RECURRING,
      rules: INITIAL_RULES,
      nudges: INITIAL_NUDGES,
      metrics: {
        totalMonthlyIncome: 7150,
        totalMonthlyExpenses: 3986.63,
        essentialSpending: 3123.6,
        discretionarySpending: 863.03,
        committedFixedObligations: 3044.27,
        netMonthlyCashFlow: 3163.37,
        safeToSpendPerDay: 48.2,
        effectiveSavingsRate: 44.2,
        emergencyFundCalculatedTarget: 18741.6,
        runwayMonths: 5.9,
        financialHealthScore: 88,
        essentialPercentOfIncome: 43.7,
        discretionaryPercentOfIncome: 12.1,
      },
      lastUpdated: new Date().toISOString(),
    };

    this.saveToFile(defaultState);
    return defaultState;
  }

  private saveToFile(state: FinancialState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save finance storage to disk:', err);
    }
  }

  public getState(): FinancialState {
    this.recalculateAllMetrics();
    return this.state;
  }

  public resetToDefault(): FinancialState {
    this.state = {
      profile: JSON.parse(JSON.stringify(INITIAL_PROFILE)),
      transactions: JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS)),
      recurring: JSON.parse(JSON.stringify(INITIAL_RECURRING)),
      rules: JSON.parse(JSON.stringify(INITIAL_RULES)),
      nudges: JSON.parse(JSON.stringify(INITIAL_NUDGES)),
      metrics: {
        totalMonthlyIncome: 7150,
        totalMonthlyExpenses: 3986.63,
        essentialSpending: 3123.6,
        discretionarySpending: 863.03,
        committedFixedObligations: 3044.27,
        netMonthlyCashFlow: 3163.37,
        safeToSpendPerDay: 48.2,
        effectiveSavingsRate: 44.2,
        emergencyFundCalculatedTarget: 18741.6,
        runwayMonths: 5.9,
        financialHealthScore: 88,
        essentialPercentOfIncome: 43.7,
        discretionaryPercentOfIncome: 12.1,
      },
      lastUpdated: new Date().toISOString(),
    };
    this.recalculateAllMetrics();
    this.saveToFile(this.state);
    return this.state;
  }

  public updateProfile(profileUpdates: Partial<LivingMoneyModel>): LivingMoneyModel {
    this.state.profile = {
      ...this.state.profile,
      ...profileUpdates,
    };
    this.recalculateAllMetrics();
    this.saveToFile(this.state);
    return this.state.profile;
  }

  public recalculateAllMetrics(): CalculatedFinancialMetrics {
    const profile = this.state.profile;
    const currentMonthPrefix = '2026-10'; // Anchor to current active month in demo
    const monthTx = this.state.transactions.filter((tx) => tx.date.startsWith(currentMonthPrefix));

    // Calculate actual monthly income from transactions or fallback to profile net income
    const actualIncomeTx = monthTx.filter((tx) => tx.amount > 0);
    const totalIncome =
      actualIncomeTx.length > 0
        ? actualIncomeTx.reduce((sum, tx) => sum + tx.amount, 0)
        : profile.monthlyNetIncome;

    // Filter expenses (negative amounts)
    const expenseTx = monthTx.filter((tx) => tx.amount < 0);
    const totalExpenses = Math.abs(expenseTx.reduce((sum, tx) => sum + tx.amount, 0));

    const essentialTx = expenseTx.filter((tx) => tx.spendingType === 'essential');
    const discretionaryTx = expenseTx.filter((tx) => tx.spendingType === 'discretionary');

    const essentialSpending = Math.abs(essentialTx.reduce((sum, tx) => sum + tx.amount, 0));
    const discretionarySpending = Math.abs(discretionaryTx.reduce((sum, tx) => sum + tx.amount, 0));

    // Committed fixed obligations: Recurring commitments + Debt minimums
    const activeRecurring = this.state.recurring.filter((r) => r.status !== 'cancelled');
    const recurringMonthly = activeRecurring.reduce((sum, r) => {
      if (r.frequency === 'annual') return sum + r.amount / 12;
      if (r.frequency === 'quarterly') return sum + r.amount / 3;
      return sum + r.amount;
    }, 0);

    const debtMonthly = profile.debtCommitments.reduce((sum, d) => sum + d.monthlyPayment, 0);
    const committedFixedObligations = recurringMonthly + debtMonthly;

    // Net Cash Flow
    const netMonthlyCashFlow = totalIncome - totalExpenses;

    // Safe to spend per day:
    // (Total Income - Committed Fixed Obligations - Planned Monthly Goal Savings - Current Month Discretionary spent so far)
    // divided by remaining days in month (1 day remaining on Oct 31, or min 1 day)
    const totalPlannedSavings = profile.savingsGoals.reduce((sum, g) => sum + (g.monthlyTarget || 0), 0);
    const remainingDiscretionaryBudget = Math.max(
      0,
      totalIncome - committedFixedObligations - totalPlannedSavings - discretionarySpending
    );
    const safeToSpendPerDay = Math.round((remainingDiscretionaryBudget / 1) * 10) / 10;

    // Effective Savings Rate
    const effectiveSavingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 1000) / 10 : 0;

    // Emergency fund calculations
    // Base target: essential monthly baseline * target months
    const monthlyEssentialBaseline = Math.max(essentialSpending, committedFixedObligations * 0.9);
    const emergencyFundCalculatedTarget = Math.round(monthlyEssentialBaseline * profile.emergencyFund.targetMonths);
    const runwayMonths =
      monthlyEssentialBaseline > 0
        ? Math.round((profile.emergencyFund.currentBalance / monthlyEssentialBaseline) * 10) / 10
        : 0;

    // Deterministic Financial Health Score (0-100)
    // 1. Emergency Fund (0-30 pts): 6 months = 30 pts
    const emergencyFundPts = Math.min(30, (runwayMonths / profile.emergencyFund.targetMonths) * 30);

    // 2. Savings Rate (0-25 pts): 20% target = 25 pts
    const savingsPts = Math.min(25, (effectiveSavingsRate / profile.guardrails.savingsTargetPercent) * 25);

    // 3. Debt to Income Ratio (0-25 pts): lower is better. < 15% gets 25 pts
    const debtRatio = totalIncome > 0 ? committedFixedObligations / totalIncome : 0.5;
    const debtPts = Math.max(0, Math.min(25, 25 - (debtRatio - 0.3) * 50));

    // 4. Discretionary discipline (0-20 pts)
    const discretionaryRatio = totalIncome > 0 ? (discretionarySpending / totalIncome) * 100 : 30;
    const discPts =
      discretionaryRatio <= profile.guardrails.discretionaryLimitPercent
        ? 20
        : Math.max(0, 20 - (discretionaryRatio - profile.guardrails.discretionaryLimitPercent) * 2);

    const financialHealthScore = Math.min(100, Math.max(10, Math.round(emergencyFundPts + savingsPts + debtPts + discPts)));

    const essentialPercentOfIncome =
      totalIncome > 0 ? Math.round((essentialSpending / totalIncome) * 1000) / 10 : 0;
    const discretionaryPercentOfIncome =
      totalIncome > 0 ? Math.round((discretionarySpending / totalIncome) * 1000) / 10 : 0;

    this.state.metrics = {
      totalMonthlyIncome: Math.round(totalIncome * 100) / 100,
      totalMonthlyExpenses: Math.round(totalExpenses * 100) / 100,
      essentialSpending: Math.round(essentialSpending * 100) / 100,
      discretionarySpending: Math.round(discretionarySpending * 100) / 100,
      committedFixedObligations: Math.round(committedFixedObligations * 100) / 100,
      netMonthlyCashFlow: Math.round(netMonthlyCashFlow * 100) / 100,
      safeToSpendPerDay,
      effectiveSavingsRate,
      emergencyFundCalculatedTarget,
      runwayMonths,
      financialHealthScore,
      essentialPercentOfIncome,
      discretionaryPercentOfIncome,
    };

    this.state.lastUpdated = new Date().toISOString();
    return this.state.metrics;
  }

  // --- Transactions & Adaptive Rules ---

  public matchCategoryByRules(
    merchant: string,
    description: string
  ): { category: string; spendingType: 'essential' | 'discretionary'; matchedRuleId?: string } {
    for (const rule of this.state.rules) {
      const targetText =
        rule.matchField === 'merchant' ? merchant.toLowerCase() : description.toLowerCase();
      if (targetText.includes(rule.pattern.toLowerCase())) {
        return {
          category: rule.targetCategory,
          spendingType: rule.targetSpendingType as 'essential' | 'discretionary',
          matchedRuleId: rule.id,
        };
      }
    }

    // Heuristic fallbacks
    const lower = `${merchant} ${description}`.toLowerCase();
    if (lower.includes('salary') || lower.includes('payroll') || lower.includes('deposit')) {
      return { category: 'Income', spendingType: 'essential' };
    }
    if (
      lower.includes('rent') ||
      lower.includes('lease') ||
      lower.includes('mortgage') ||
      lower.includes('property')
    ) {
      return { category: 'Housing & Rent', spendingType: 'essential' };
    }
    if (
      lower.includes('electric') ||
      lower.includes('gas') ||
      lower.includes('utility') ||
      lower.includes('water') ||
      lower.includes('internet')
    ) {
      return { category: 'Utilities & Bills', spendingType: 'essential' };
    }
    if (
      lower.includes('supermarket') ||
      lower.includes('grocery') ||
      lower.includes('foods') ||
      lower.includes('market')
    ) {
      return { category: 'Food & Dining', spendingType: 'essential' };
    }
    if (
      lower.includes('cafe') ||
      lower.includes('coffee') ||
      lower.includes('bistro') ||
      lower.includes('restaurant') ||
      lower.includes('burger')
    ) {
      return { category: 'Food & Dining', spendingType: 'discretionary' };
    }
    if (
      lower.includes('subway') ||
      lower.includes('metro') ||
      lower.includes('fuel') ||
      lower.includes('transit')
    ) {
      return { category: 'Transportation', spendingType: 'essential' };
    }
    if (lower.includes('uber') || lower.includes('lyft') || lower.includes('taxi')) {
      return { category: 'Transportation', spendingType: 'discretionary' };
    }
    if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('cinema')) {
      return { category: 'Entertainment & Subscriptions', spendingType: 'discretionary' };
    }
    if (lower.includes('loan') || lower.includes('emi') || lower.includes('credit card pmt')) {
      return { category: 'Debt & Loans', spendingType: 'essential' };
    }
    if (lower.includes('hospital') || lower.includes('pharmacy') || lower.includes('doctor')) {
      return { category: 'Health & Wellness', spendingType: 'essential' };
    }

    return { category: 'Shopping & Personal', spendingType: 'discretionary' };
  }

  public addRule(ruleData: Omit<CategorizationRule, 'id' | 'createdAt' | 'timesApplied'>): CategorizationRule {
    const newRule: CategorizationRule = {
      id: `rule-${Date.now()}`,
      ...ruleData,
      createdAt: new Date().toISOString(),
      timesApplied: 0,
    };

    this.state.rules.unshift(newRule);

    // Retroactively update existing transactions that match this new rule!
    let updatedCount = 0;
    this.state.transactions = this.state.transactions.map((tx) => {
      const matchFieldText =
        newRule.matchField === 'merchant' ? tx.merchant.toLowerCase() : tx.description.toLowerCase();
      if (matchFieldText.includes(newRule.pattern.toLowerCase())) {
        updatedCount++;
        return {
          ...tx,
          category: newRule.targetCategory,
          spendingType: newRule.targetSpendingType,
        };
      }
      return tx;
    });

    newRule.timesApplied = updatedCount;
    this.recalculateAllMetrics();
    this.saveToFile(this.state);
    return newRule;
  }

  public deleteRule(id: string): boolean {
    const initialLen = this.state.rules.length;
    this.state.rules = this.state.rules.filter((r) => r.id !== id);
    if (this.state.rules.length !== initialLen) {
      this.saveToFile(this.state);
      return true;
    }
    return false;
  }

  public updateTransaction(
    id: string,
    updates: Partial<Transaction>,
    createLearningRule?: boolean
  ): Transaction | null {
    const idx = this.state.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const current = this.state.transactions[idx];
    const updated = { ...current, ...updates };
    this.state.transactions[idx] = updated;

    // If user requested to create a learning rule from this correction:
    if (createLearningRule && updates.category && current.merchant) {
      this.addRule({
        pattern: current.merchant,
        matchField: 'merchant',
        targetCategory: updates.category,
        targetSpendingType: updates.spendingType || current.spendingType,
        isUserDefined: true,
      });
    } else {
      this.recalculateAllMetrics();
      this.saveToFile(this.state);
    }

    return updated;
  }

  public addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...tx,
    };

    // Auto-apply rule if not explicitly set
    if (!tx.category || tx.category === 'Uncategorized') {
      const match = this.matchCategoryByRules(tx.merchant, tx.description);
      newTx.category = match.category;
      newTx.spendingType = match.spendingType;
    }

    this.state.transactions.unshift(newTx);
    this.recalculateAllMetrics();
    this.saveToFile(this.state);
    return newTx;
  }

  public deleteTransaction(id: string): boolean {
    const initialLen = this.state.transactions.length;
    this.state.transactions = this.state.transactions.filter((t) => t.id !== id);
    if (this.state.transactions.length !== initialLen) {
      this.recalculateAllMetrics();
      this.saveToFile(this.state);
      return true;
    }
    return false;
  }

  public importTransactions(
    incoming: Array<Omit<Transaction, 'id'>>,
    source: Transaction['source']
  ): { imported: number; duplicatesDetected: number; items: Transaction[] } {
    let imported = 0;
    let duplicatesDetected = 0;
    const addedItems: Transaction[] = [];

    for (const raw of incoming) {
      // Duplicate detection: same date, same amount within 0.01, and similar merchant/description
      const isDuplicate = this.state.transactions.some(
        (existing) =>
          existing.date === raw.date &&
          Math.abs(existing.amount - raw.amount) < 0.01 &&
          (existing.merchant.toLowerCase() === raw.merchant.toLowerCase() ||
            existing.description.toLowerCase().includes(raw.merchant.toLowerCase()))
      );

      if (isDuplicate) {
        duplicatesDetected++;
        continue;
      }

      // Match categories
      const match = this.matchCategoryByRules(raw.merchant, raw.description);

      const newTx: Transaction = {
        id: `tx-imp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        date: raw.date,
        description: raw.description,
        merchant: raw.merchant || raw.description,
        amount: raw.amount,
        category: raw.category || match.category,
        spendingType: raw.spendingType || match.spendingType,
        accountName: raw.accountName || 'Imported Account',
        isRecurring: Boolean(raw.isRecurring),
        recurringFrequency: raw.recurringFrequency,
        source: source,
        status: 'cleared',
        notes: raw.notes,
      };

      this.state.transactions.unshift(newTx);
      addedItems.push(newTx);
      imported++;
    }

    this.recalculateAllMetrics();
    this.saveToFile(this.state);
    return { imported, duplicatesDetected, items: addedItems };
  }

  // --- Subscriptions & Nudges ---

  public updateRecurringAction(id: string, action: 'confirm_active' | 'mark_cancelled' | 'dismiss_alert'): RecurringCommitment | null {
    const item = this.state.recurring.find((r) => r.id === id);
    if (!item) return null;

    if (action === 'confirm_active') {
      item.status = 'confirmed_active';
    } else if (action === 'mark_cancelled') {
      item.status = 'cancelled';
    } else if (action === 'dismiss_alert') {
      item.status = 'active';
    }

    this.recalculateAllMetrics();
    this.saveToFile(this.state);
    return item;
  }

  public dismissNudge(id: string): boolean {
    const nudge = this.state.nudges.find((n) => n.id === id);
    if (nudge) {
      nudge.dismissed = true;
      this.saveToFile(this.state);
      return true;
    }
    return false;
  }
}

export const storage = new FinanceStorage();
