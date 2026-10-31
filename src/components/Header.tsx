import React from 'react';
import { CurrencyCode } from '../types/finance.js';
import { Plus, UploadCloud, ChevronDown, Check } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  onOpenIngest: () => void;
  onOpenAddTx: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  onCurrencyChange,
  onOpenIngest,
  onOpenAddTx,
}) => {
  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Overview';
      case 'living-model':
        return 'Living Money Model';
      case 'transactions':
        return 'Transactions Ledger';
      case 'subscriptions':
        return 'Recurring & Subscriptions';
      case 'ai-coach':
        return 'Financial Assistant';
      case 'simulator':
        return 'Scenario Simulator';
      case 'reports':
        return 'Monthly Statement';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E8EBE7] px-6 flex items-center justify-between gap-6 shrink-0">
      {/* Left: Breadcrumbs / Context */}
      <div className="flex items-center gap-2.5 text-xs text-[#777F79]">
        <span className="font-semibold text-[#202521] tracking-tight">Finmate</span>
        <span className="text-[#C8CCC6]">/</span>
        <span className="text-[#202521] font-medium">{getBreadcrumbTitle()}</span>
        <span className="text-[#C8CCC6]">/</span>
        <span className="font-mono text-[#777F79]">Oct 2026</span>
      </div>

      {/* Right: Controls & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Currency Switcher */}
        <div className="flex items-center bg-[#F8F9F7] border border-[#E8EBE7] rounded-md p-0.5 text-xs">
          {(['USD', 'INR', 'EUR'] as CurrencyCode[]).map((c) => (
            <button
              key={c}
              onClick={() => onCurrencyChange(c)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                currency === c
                  ? 'bg-white text-[#202521] font-semibold shadow-xs border border-[#E8EBE7]'
                  : 'text-[#777F79] hover:text-[#202521]'
              }`}
            >
              {c === 'USD' ? '$ USD' : c === 'INR' ? '₹ INR' : '€ EUR'}
            </button>
          ))}
        </div>

        {/* Action: Add Entry */}
        <button
          onClick={onOpenAddTx}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202521] bg-white hover:bg-[#F8F9F7] border border-[#E8EBE7] rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#777F79]" />
          <span>New Entry</span>
        </button>

        {/* Action: Import */}
        <button
          onClick={onOpenIngest}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#237A57] hover:bg-[#1D6548] rounded-md transition-colors shadow-xs"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Import Statement</span>
        </button>
      </div>
    </header>
  );
};
