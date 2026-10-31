import React, { useState } from 'react';
import { CategorizationRule, SpendingType } from '../types/finance.js';
import { X, Plus, Trash2 } from 'lucide-react';

interface RulesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: CategorizationRule[];
  onAddRule: (rule: Omit<CategorizationRule, 'id' | 'createdAt' | 'timesApplied'>) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
}

const CATEGORIES = [
  'Food & Dining',
  'Housing & Rent',
  'Utilities & Bills',
  'Transportation',
  'Health & Wellness',
  'Entertainment & Subscriptions',
  'Shopping & Personal',
  'Education & Growth',
  'Debt & Loans',
  'Income',
  'Savings & Investments',
];

export const RulesManagerModal: React.FC<RulesManagerModalProps> = ({
  isOpen,
  onClose,
  rules,
  onAddRule,
  onDeleteRule,
}) => {
  if (!isOpen) return null;

  const [isAdding, setIsAdding] = useState(false);
  const [pattern, setPattern] = useState('');
  const [matchField, setMatchField] = useState<'merchant' | 'description'>('merchant');
  const [targetCategory, setTargetCategory] = useState('Food & Dining');
  const [targetSpendingType, setTargetSpendingType] = useState<SpendingType>('discretionary');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim()) return;

    await onAddRule({
      pattern: pattern.trim(),
      matchField,
      targetCategory,
      targetSpendingType,
      isUserDefined: true,
    });

    setPattern('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202521]/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white border border-[#E8EBE7] rounded-lg w-full max-w-2xl overflow-hidden shadow-lg flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8EBE7]">
          <div>
            <h3 className="text-sm font-semibold text-[#202521]">Categorization Rules</h3>
            <p className="text-[11px] text-[#777F79]">
              Automated rules learned from your category adjustments and manual configurations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#237A57] hover:bg-[#1D6548] rounded-md transition-colors shadow-xs"
            >
              New Rule
            </button>
            <button
              onClick={onClose}
              className="p-1 text-[#777F79] hover:text-[#202521] rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {isAdding && (
            <form
              onSubmit={handleCreate}
              className="p-3.5 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md space-y-3"
            >
              <div className="font-semibold text-[#202521]">Add Learning Rule</div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#777F79] font-medium">Text Pattern (Contains)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starbucks, Uber"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full bg-white border border-[#E8EBE7] rounded-md px-2.5 py-1.5 text-xs text-[#202521]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#777F79] font-medium">Field to Search</label>
                  <select
                    value={matchField}
                    onChange={(e) => setMatchField(e.target.value as any)}
                    className="w-full bg-white border border-[#E8EBE7] rounded-md px-2.5 py-1.5 text-xs text-[#202521]"
                  >
                    <option value="merchant">Merchant Name</option>
                    <option value="description">Description</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#777F79] font-medium">Target Category</label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full bg-white border border-[#E8EBE7] rounded-md px-2.5 py-1.5 text-xs text-[#202521]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#777F79] font-medium">Classification</label>
                  <select
                    value={targetSpendingType}
                    onChange={(e) => setTargetSpendingType(e.target.value as any)}
                    className="w-full bg-white border border-[#E8EBE7] rounded-md px-2.5 py-1.5 text-xs text-[#202521]"
                  >
                    <option value="essential">Essential (Need)</option>
                    <option value="discretionary">Discretionary (Want)</option>
                    <option value="income">Income</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 text-[#777F79] hover:text-[#202521]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 font-medium text-white bg-[#237A57] hover:bg-[#1D6548] rounded-md shadow-xs"
                >
                  Save Rule
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          <div className="border border-[#E8EBE7] rounded-md overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E8EBE7] bg-[#FDFDFD] text-[#777F79] font-medium">
                  <th className="py-2.5 px-4">Pattern</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4 text-center">Applied</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBE7] text-[#202521]">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#F8F9F7]">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#202521]">"{rule.pattern}"</div>
                      <div className="text-[11px] text-[#777F79]">
                        matches {rule.matchField === 'merchant' ? 'merchant' : 'description'}
                      </div>
                    </td>

                    <td className="py-3 px-4">{rule.targetCategory}</td>

                    <td className="py-3 px-4 capitalize text-[#777F79] font-medium">
                      {rule.targetSpendingType}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-[#777F79]">
                      {rule.timesApplied}x
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="text-[#777F79] hover:text-rose-600 p-1"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#E8EBE7] bg-[#FDFDFD] flex items-center justify-between text-xs text-[#777F79]">
          <span>{rules.length} active rules configured</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-[#E8EBE7] hover:bg-[#F8F9F7] text-[#202521] rounded-md font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
