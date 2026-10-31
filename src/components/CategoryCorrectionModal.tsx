import React, { useState } from 'react';
import { Transaction, CurrencyCode, SpendingType } from '../types/finance.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { X, Check } from 'lucide-react';

interface CategoryCorrectionModalProps {
  transaction: Transaction | null;
  currency: CurrencyCode;
  onClose: () => void;
  onSave: (
    txId: string,
    newCategory: string,
    newSpendingType: SpendingType,
    createLearningRule: boolean
  ) => void;
}

const CATEGORIES = [
  'Housing & Rent',
  'Utilities & Bills',
  'Food & Dining',
  'Transportation',
  'Health & Wellness',
  'Entertainment & Subscriptions',
  'Shopping & Personal',
  'Education & Growth',
  'Debt & Loans',
  'Savings & Investments',
  'Income',
];

export const CategoryCorrectionModal: React.FC<CategoryCorrectionModalProps> = ({
  transaction,
  currency,
  onClose,
  onSave,
}) => {
  if (!transaction) return null;

  const [selectedCategory, setSelectedCategory] = useState(transaction.category);
  const [selectedSpendingType, setSelectedSpendingType] = useState<SpendingType>(
    transaction.spendingType
  );
  const [createRule, setCreateRule] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(transaction.id, selectedCategory, selectedSpendingType, createRule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202521]/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white border border-[#E8EBE7] rounded-lg w-full max-w-md overflow-hidden shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8EBE7]">
          <div>
            <h3 className="text-sm font-semibold text-[#202521]">Edit Category</h3>
            <p className="text-[11px] text-[#777F79]">Adjust classification and update future preferences</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#777F79] hover:text-[#202521] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md space-y-1">
            <div className="flex items-center justify-between font-medium text-[#202521]">
              <span>{transaction.merchant}</span>
              <span className="font-mono">{formatCurrency(transaction.amount, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-[#777F79] text-[11px]">
              <span className="truncate max-w-[200px]">{transaction.description}</span>
              <span className="font-mono">{formatDate(transaction.date)}</span>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#202521]">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const cat = e.target.value;
                setSelectedCategory(cat);
                if (['Housing & Rent', 'Utilities & Bills', 'Debt & Loans', 'Income'].includes(cat)) {
                  setSelectedSpendingType(cat === 'Income' ? 'income' : 'essential');
                } else if (['Entertainment & Subscriptions', 'Shopping & Personal'].includes(cat)) {
                  setSelectedSpendingType('discretionary');
                }
              }}
              className="w-full bg-[#F8F9F7] border border-[#E8EBE7] rounded-md px-3 py-1.5 text-xs text-[#202521] focus:outline-none focus:border-[#237A57]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Classification */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#202521]">Spending Classification</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSpendingType('essential')}
                className={`py-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${
                  selectedSpendingType === 'essential'
                    ? 'bg-[#237A57]/10 border-[#237A57]/30 text-[#237A57] font-semibold'
                    : 'bg-white border-[#E8EBE7] text-[#777F79] hover:text-[#202521]'
                }`}
              >
                Essential (Need)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSpendingType('discretionary')}
                className={`py-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${
                  selectedSpendingType === 'discretionary'
                    ? 'bg-[#F1F3F0] border-[#E8EBE7] text-[#202521] font-semibold'
                    : 'bg-white border-[#E8EBE7] text-[#777F79] hover:text-[#202521]'
                }`}
              >
                Discretionary (Want)
              </button>
            </div>
          </div>

          {/* Rule Checkbox */}
          <div className="p-3 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createRule}
                onChange={(e) => setCreateRule(e.target.checked)}
                className="mt-0.5 rounded border-[#E8EBE7] text-[#237A57] focus:ring-0"
              />
              <div>
                <span className="font-medium text-[#202521]">Always apply this rule</span>
                <p className="text-[11px] text-[#777F79] mt-0.5 leading-snug">
                  Automatically categorize future and existing transactions matching "{transaction.merchant}".
                </p>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E8EBE7]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#777F79] hover:text-[#202521]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#237A57] hover:bg-[#1D6548] rounded-md transition-colors shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
