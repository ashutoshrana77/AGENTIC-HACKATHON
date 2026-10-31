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
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<FinancialState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch initial financial state
  const fetchFinancialState = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load financial state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialState();
  }, []);

  // Currency change handler
  const handleCurrencyChange = async (newCurrency: CurrencyCode) => {
    if (!data) return;
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrency }),
      });
      const resData = await res.json();
      if (resData.success) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                profile: resData.profile,
                metrics: resData.metrics,
              }
            : null
        );
        showToast(`Display currency changed to ${newCurrency}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Category correction & adaptive learning handler
  const handleSaveCategoryCorrection = async (
    txId: string,
    newCategory: string,
    newSpendingType: SpendingType,
    createLearningRule: boolean
  ) => {
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { category: newCategory, spendingType: newSpendingType },
          createLearningRule,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        // Refresh state
        await fetchFinancialState();
        if (createLearningRule) {
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
          showToast(`Rule learned! Category updated across matching transactions.`);
        } else {
          showToast(`Transaction category updated.`);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update category', 'error');
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchFinancialState();
        showToast('Transaction removed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Import batch transactions
  const handleCommitImport = async (
    transactions: Array<Omit<Transaction, 'id'>>,
    source: Transaction['source']
  ) => {
    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, source }),
      });
      const resData = await res.json();
      if (resData.success) {
        await fetchFinancialState();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        showToast(
          `Successfully ingested ${resData.imported} transactions (${resData.duplicatesDetected} duplicates filtered).`
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to import transactions.', 'error');
    }
  };

  // Update Living Money Model Profile
  const handleUpdateProfile = async (updates: Partial<LivingMoneyModel>) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const resData = await res.json();
      if (resData.success) {
        await fetchFinancialState();
        confetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } });
        showToast('Living Money Model recalibrated!');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save profile.', 'error');
    }
  };

  // Recurring commitment actions
  const handleRecurringAction = async (
    id: string,
    action: 'confirm_active' | 'mark_cancelled' | 'dismiss_alert'
  ) => {
    try {
      const res = await fetch(`/api/recurring/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchFinancialState();
        showToast(
          action === 'confirm_active'
            ? 'Subscription confirmed active.'
            : action === 'mark_cancelled'
            ? 'Subscription marked cancelled. Cashflow updated.'
            : 'Alert acknowledged.'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dismiss Nudge Alert
  const handleDismissNudge = async (id: string) => {
    try {
      const res = await fetch(`/api/nudges/${id}/dismiss`, { method: 'POST' });
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                nudges: prev.nudges.filter((n) => n.id !== id),
              }
            : null
        );
        showToast('Nudge dismissed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Nudge Action
  const handleNudgeAction = (nudge: NudgeAlert) => {
    if (nudge.actionType === 'NAVIGATE_SUBSCRIPTIONS') {
      setActiveTab('subscriptions');
    } else if (nudge.actionType === 'MANAGE_SUBSCRIPTION_EQUINOX') {
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
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        await fetchFinancialState();
        showToast('New learned rule applied to existing transactions.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Rule
  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchFinancialState();
        showToast('Categorization rule deleted.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset to Pristine Demo
  const handleResetData = async () => {
    if (!confirm('Reset all financial data to pristine demo state?')) return;
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setData(json.state);
        showToast('Demo data restored.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#F8F9F7] flex flex-col items-center justify-center text-[#777F79] gap-3">
        <div className="w-8 h-8 rounded-md bg-[#237A57] flex items-center justify-center text-white font-bold text-sm animate-pulse">
          F
        </div>
        <div className="text-xs font-medium tracking-wide text-[#202521]">Loading Finmate Ledger...</div>
      </div>
    );
  }

  const unresolvedNudgeCount = data.nudges.filter((n) => !n.dismissed).length;

  return (
    <div className="min-h-screen bg-[#F8F9F7] text-[#202521] flex flex-col antialiased">
      {/* Top 3-Zone Bar */}
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
