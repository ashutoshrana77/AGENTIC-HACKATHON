import React, { useState, useEffect } from 'react';
import {
  FinancialState,
  Transaction,
  CurrencyCode,
  SpendingType,
  CategorizationRule,
  LivingMoneyModel,
  NudgeAlert,
} from './types/finance.js';
import {
  loadStoredFinancialState,
  saveStoredFinancialState,
  calculateFinancialMetrics,
  getInitialFinancialState,
} from './utils/financeEngine.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { OverviewView } from './components/OverviewView.js';
import { TransactionsView } from './components/TransactionsView.js';
import { LivingMoneyModelView } from './components/LivingMoneyModelView.js';
import { SubscriptionsView } from './components/SubscriptionsView.js';
import { AICoachView } from './components/AICoachView.js';
import { ScenarioSimulatorView } from './components/ScenarioSimulatorView.js';
import { MonthlyReviewView } from './components/MonthlyReviewView.js';
import { CategoryCorrectionModal } from './components/CategoryCorrectionModal.js';
import { IngestionModal } from './components/IngestionModal.js';
import { RulesManagerModal } from './components/RulesManagerModal.js';
import confetti from 'canvas-confetti';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Always initialize with stored or pristine default financial state so the page NEVER gets stuck loading
  const [data, setData] = useState<FinancialState>(() => loadStoredFinancialState());
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Modals state
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [categoryModalTx, setCategoryModalTx] = useState<Transaction | null>(null);

  // Quick toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync with server if available in background
  const fetchFinancialState = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        if (json && json.profile && json.transactions) {
          setData(json);
          saveStoredFinancialState(json);
        }
      }
    } catch (err) {
      // In offline / serverless environments, local state remains fully active
      console.warn('Backend server unreachable, running in local-first mode:', err);
    }
  };

  useEffect(() => {
    fetchFinancialState();
  }, []);

  // Currency change handler
  const handleCurrencyChange = async (newCurrency: CurrencyCode) => {
    const updatedProfile = { ...data.profile, currency: newCurrency };
    const updatedMetrics = calculateFinancialMetrics(updatedProfile, data.transactions, data.recurring);
    const updatedState: FinancialState = {
      ...data,
      profile: updatedProfile,
      metrics: updatedMetrics,
    };
    setData(updatedState);
    saveStoredFinancialState(updatedState);
    showToast(`Currency changed to ${newCurrency}`);

    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrency }),
      });
    } catch (err) {
      console.warn('Could not sync currency with server:', err);
    }
  };

  // Category correction & adaptive learning handler
  const handleSaveCategoryCorrection = async (
    txId: string,
    newCategory: string,
    newSpendingType: SpendingType,
    createLearningRule: boolean
  ) => {
    const targetTx = data.transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    let updatedRules = [...data.rules];
    if (createLearningRule && targetTx.merchant) {
      const existingRuleIdx = updatedRules.findIndex(
        (r) => r.pattern.toLowerCase() === targetTx.merchant.toLowerCase()
      );
      if (existingRuleIdx >= 0) {
        updatedRules[existingRuleIdx] = {
          ...updatedRules[existingRuleIdx],
          targetCategory: newCategory,
          targetSpendingType: newSpendingType,
        };
      } else {
        updatedRules.unshift({
          id: `rule-${Date.now()}`,
          pattern: targetTx.merchant,
          matchField: 'merchant',
          targetCategory: newCategory,
          targetSpendingType: newSpendingType,
          createdAt: new Date().toISOString(),
          timesApplied: 1,
          isUserDefined: true,
        });
      }
    }

    // Apply rule to existing transactions
    const updatedTransactions = data.transactions.map((t) => {
      if (t.id === txId || (createLearningRule && t.merchant.toLowerCase() === targetTx.merchant.toLowerCase())) {
        return {
          ...t,
          category: newCategory,
          spendingType: newSpendingType,
        };
      }
      return t;
    });

    const updatedMetrics = calculateFinancialMetrics(data.profile, updatedTransactions, data.recurring);
    const updatedState: FinancialState = {
      ...data,
      rules: updatedRules,
      transactions: updatedTransactions,
      metrics: updatedMetrics,
    };

    setData(updatedState);
    saveStoredFinancialState(updatedState);

    if (createLearningRule) {
      confetti({ particleCount: 35, spread: 45, origin: { y: 0.8 } });
      showToast('Preference learned! Matching transactions updated.');
    } else {
      showToast('Transaction category updated.');
    }

    // Background sync
    try {
      await fetch(`/api/transactions/${txId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { category: newCategory, spendingType: newSpendingType },
          createLearningRule,
        }),
      });
    } catch (err) {
      console.warn('Could not sync category correction with server:', err);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    const updatedTransactions = data.transactions.filter((t) => t.id !== id);
    const updatedMetrics = calculateFinancialMetrics(data.profile, updatedTransactions, data.recurring);
    const updatedState: FinancialState = {
      ...data,
      transactions: updatedTransactions,
      metrics: updatedMetrics,
    };
    setData(updatedState);
    saveStoredFinancialState(updatedState);
    showToast('Transaction removed.');

    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Could not sync transaction deletion with server:', err);
    }
  };

  // Import batch transactions
  const handleCommitImport = async (
    newTxs: Array<Omit<Transaction, 'id'>>,
    source: Transaction['source']
  ) => {
    const createdItems: Transaction[] = newTxs.map((t, idx) => ({
      id: `tx-imp-${Date.now()}-${idx}`,
      ...t,
      source,
      status: 'cleared',
    }));

    const updatedTransactions = [...createdItems, ...data.transactions];
    const updatedMetrics = calculateFinancialMetrics(data.profile, updatedTransactions, data.recurring);
    const updatedState: FinancialState = {
      ...data,
      transactions: updatedTransactions,
      metrics: updatedMetrics,
    };

    setData(updatedState);
    saveStoredFinancialState(updatedState);
    confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
    showToast(`Successfully ingested ${createdItems.length} transactions.`);

    try {
      await fetch('/api/transactions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: newTxs, source }),
      });
    } catch (err) {
      console.warn('Could not sync imported transactions with server:', err);
    }
  };

  // Update Living Money Model Profile
  const handleUpdateProfile = async (updates: Partial<LivingMoneyModel>) => {
    const updatedProfile = { ...data.profile, ...updates };
    const updatedMetrics = calculateFinancialMetrics(updatedProfile, data.transactions, data.recurring);
    const updatedState: FinancialState = {
      ...data,
      profile: updatedProfile,
      metrics: updatedMetrics,
    };

    setData(updatedState);
    saveStoredFinancialState(updatedState);
    confetti({ particleCount: 25, spread: 40, origin: { y: 0.6 } });
    showToast('Living Money Model updated!');

    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn('Could not sync profile with server:', err);
    }
  };

  // Recurring commitment actions
  const handleRecurringAction = async (
    id: string,
    action: 'confirm_active' | 'mark_cancelled' | 'dismiss_alert'
  ) => {
    const updatedRecurring = data.recurring.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          status:
            action === 'confirm_active'
              ? ('confirmed_active' as const)
              : action === 'mark_cancelled'
              ? ('cancelled' as const)
              : ('active' as const),
        };
      }
      return r;
    });

    const updatedMetrics = calculateFinancialMetrics(data.profile, data.transactions, updatedRecurring);
    const updatedState: FinancialState = {
      ...data,
      recurring: updatedRecurring,
      metrics: updatedMetrics,
    };

    setData(updatedState);
    saveStoredFinancialState(updatedState);
    showToast(
      action === 'confirm_active'
        ? 'Subscription confirmed active.'
        : action === 'mark_cancelled'
        ? 'Subscription marked cancelled. Cashflow updated.'
        : 'Alert acknowledged.'
    );

    try {
      await fetch(`/api/recurring/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch (err) {
      console.warn('Could not sync recurring action with server:', err);
    }
  };

  // Dismiss Nudge Alert
  const handleDismissNudge = async (id: string) => {
    const updatedNudges = data.nudges.filter((n) => n.id !== id);
    const updatedState: FinancialState = {
      ...data,
      nudges: updatedNudges,
    };
    setData(updatedState);
    saveStoredFinancialState(updatedState);
    showToast('Insight dismissed.');

    try {
      await fetch(`/api/nudges/${id}/dismiss`, { method: 'POST' });
    } catch (err) {
      console.warn('Could not sync dismiss with server:', err);
    }
  };

  // Handle Nudge Action
  const handleNudgeAction = (nudge: NudgeAlert) => {
    if (nudge.actionType === 'NAVIGATE_SUBSCRIPTIONS' || nudge.actionType === 'MANAGE_SUBSCRIPTION_EQUINOX') {
      setActiveTab('subscriptions');
    } else if (nudge.actionType === 'NAVIGATE_TRANSACTIONS_FOOD') {
      setActiveTab('transactions');
    } else {
      setActiveTab('ai-coach');
    }
  };

  // Add Custom Rule
  const handleAddRule = async (
    rule: Omit<CategorizationRule, 'id' | 'createdAt' | 'timesApplied'>
  ) => {
    const newRule: CategorizationRule = {
      id: `rule-${Date.now()}`,
      ...rule,
      createdAt: new Date().toISOString(),
      timesApplied: 0,
    };

    const updatedTransactions = data.transactions.map((tx) => {
      const matchText = rule.matchField === 'merchant' ? tx.merchant.toLowerCase() : tx.description.toLowerCase();
      if (matchText.includes(rule.pattern.toLowerCase())) {
        newRule.timesApplied++;
        return {
          ...tx,
          category: rule.targetCategory,
          spendingType: rule.targetSpendingType,
        };
      }
      return tx;
    });

    const updatedRules = [newRule, ...data.rules];
    const updatedMetrics = calculateFinancialMetrics(data.profile, updatedTransactions, data.recurring);
    const updatedState: FinancialState = {
      ...data,
      rules: updatedRules,
      transactions: updatedTransactions,
      metrics: updatedMetrics,
    };

    setData(updatedState);
    saveStoredFinancialState(updatedState);
    showToast('Categorization rule saved and applied.');

    try {
      await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
    } catch (err) {
      console.warn('Could not sync rule with server:', err);
    }
  };

  // Delete Rule
  const handleDeleteRule = async (id: string) => {
    const updatedRules = data.rules.filter((r) => r.id !== id);
    const updatedState: FinancialState = {
      ...data,
      rules: updatedRules,
    };
    setData(updatedState);
    saveStoredFinancialState(updatedState);
    showToast('Rule deleted.');

    try {
      await fetch(`/api/rules/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Could not sync rule deletion with server:', err);
    }
  };

  // Reset to Pristine Demo
  const handleResetData = async () => {
    if (!confirm('Reset all financial data to pristine default state?')) return;
    const pristine = getInitialFinancialState();
    setData(pristine);
    saveStoredFinancialState(pristine);
    showToast('Default financial state restored.');

    try {
      await fetch('/api/reset-data', { method: 'POST' });
    } catch (err) {
      console.warn('Could not sync reset with server:', err);
    }
  };

  const unresolvedNudgeCount = data.nudges.filter((n) => !n.dismissed).length;

  return (
    <div className="min-h-screen bg-[#F8F9F7] text-[#202521] flex flex-col antialiased">
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={data.profile.currency}
        onCurrencyChange={handleCurrencyChange}
        onOpenIngest={() => setIsIngestOpen(true)}
        onOpenAddTx={() => setIsIngestOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profile={data.profile}
          onOpenRules={() => setIsRulesOpen(true)}
          onResetData={handleResetData}
          unresolvedNudgeCount={unresolvedNudgeCount}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <OverviewView
              state={data}
              onNavigateTab={setActiveTab}
              onOpenCategoryModal={(tx) => setCategoryModalTx(tx)}
              onDismissNudge={handleDismissNudge}
              onNudgeAction={handleNudgeAction}
            />
          )}

          {activeTab === 'living-model' && (
            <LivingMoneyModelView
              profile={data.profile}
              metrics={data.metrics}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={data.transactions}
              currency={data.profile.currency}
              onOpenCategoryModal={(tx) => setCategoryModalTx(tx)}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenIngest={() => setIsIngestOpen(true)}
              onOpenAddModal={() => setIsIngestOpen(true)}
              onOpenRules={() => setIsRulesOpen(true)}
            />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionsView
              recurring={data.recurring}
              currency={data.profile.currency}
              onAction={handleRecurringAction}
            />
          )}

          {activeTab === 'ai-coach' && (
            <AICoachView state={data} onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'simulator' && <ScenarioSimulatorView state={data} />}

          {activeTab === 'reports' && <MonthlyReviewView state={data} />}
        </main>
      </div>

      {/* Modals */}
      <CategoryCorrectionModal
        transaction={categoryModalTx}
        currency={data.profile.currency}
        onClose={() => setCategoryModalTx(null)}
        onSave={handleSaveCategoryCorrection}
      />

      <IngestionModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        currency={data.profile.currency}
        existingTransactions={data.transactions}
        onCommitImport={handleCommitImport}
      />

      <RulesManagerModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        rules={data.rules}
        onAddRule={handleAddRule}
        onDeleteRule={handleDeleteRule}
      />

      {/* Floating Action / Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-md bg-white border border-[#E8EBE7] text-xs text-[#202521] shadow-md animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-[#237A57] shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
