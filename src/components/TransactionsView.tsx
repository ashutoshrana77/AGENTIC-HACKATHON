import React, { useState, useMemo } from 'react';
import { Transaction, CurrencyCode, SpendingType } from '../types/finance.js';
import { formatCurrency, formatDate, getSpendingTypeBadge } from '../utils/formatters.js';
import {
  Search,
  Plus,
  UploadCloud,
  FileSpreadsheet,
  MessageSquare,
  FileText,
  Trash2,
  Edit2,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  onOpenCategoryModal: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenIngest: () => void;
  onOpenAddModal: () => void;
  onOpenRules: () => void;
}

const CATEGORIES = [
  'All Categories',
  'Income',
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
];

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  currency,
  onOpenCategoryModal,
  onDeleteTransaction,
  onOpenIngest,
  onOpenAddModal,
  onOpenRules,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedSpendingType, setSelectedSpendingType] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        tx.merchant.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.accountName.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'All Categories' || tx.category === selectedCategory;

      const matchesType =
        selectedSpendingType === 'all' || tx.spendingType === selectedSpendingType;

      return matchesSearch && matchesCategory && matchesType;
    }).sort((a, b) => {
      if (sortField === 'date') {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
        return sortOrder === 'desc' ? diff : -diff;
      } else {
        const diff = Math.abs(b.amount) - Math.abs(a.amount);
        return sortOrder === 'desc' ? diff : -diff;
      }
    });
  }, [transactions, searchQuery, selectedCategory, selectedSpendingType, sortField, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#202521]">Transactions Ledger</h1>
          <p className="text-xs text-[#777F79]">
            {filteredTransactions.length} of {transactions.length} recorded operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRules}
            className="px-3 py-1.5 text-xs font-medium text-[#202521] bg-white hover:bg-[#F8F9F7] border border-[#E8EBE7] rounded-md transition-colors"
          >
            Category Rules
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202521] bg-white hover:bg-[#F8F9F7] border border-[#E8EBE7] rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#777F79]" />
            New Entry
          </button>
          <button
            onClick={onOpenIngest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#237A57] hover:bg-[#1D6548] rounded-md transition-colors shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Import Statement
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E8EBE7] rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#777F79] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions, merchants, accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8F9F7] border border-[#E8EBE7] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#202521] placeholder-[#777F79] focus:outline-none focus:border-[#237A57]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#F8F9F7] border border-[#E8EBE7] rounded-md px-2.5 py-1.5 text-xs text-[#202521] focus:outline-none focus:border-[#237A57]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Spending Type Segments */}
          <div className="flex items-center bg-[#F8F9F7] border border-[#E8EBE7] rounded-md p-0.5 text-xs">
            {['all', 'essential', 'discretionary', 'income'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedSpendingType(t)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                  selectedSpendingType === t
                    ? 'bg-white text-[#202521] font-semibold shadow-xs border border-[#E8EBE7]'
                    : 'text-[#777F79] hover:text-[#202521]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Professional Banking Ledger Table */}
      <div className="bg-white border border-[#E8EBE7] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E8EBE7] bg-[#FDFDFD] text-[#777F79] font-medium">
                <th
                  onClick={() => {
                    if (sortField === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortField('date');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-[#202521]"
                >
                  Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3 px-4">Merchant & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Account</th>
                <th
                  onClick={() => {
                    if (sortField === 'amount') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortField('amount');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#202521]"
                >
                  Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBE7] text-[#202521]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#777F79]">
                    No transactions match your search or filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.amount > 0;
                  const typeBadge = getSpendingTypeBadge(tx.spendingType);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#F8F9F7] transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono text-[#777F79] whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="font-medium text-[#202521] truncate">{tx.merchant}</div>
                        <div className="text-[11px] text-[#777F79] truncate max-w-xs">
                          {tx.description}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => onOpenCategoryModal(tx)}
                          className="text-[#202521] hover:text-[#237A57] hover:underline text-left text-xs font-medium flex items-center gap-1.5"
                          title="Click to change category and teach rule"
                        >
                          <span>{tx.category}</span>
                          <Edit2 className="w-2.5 h-2.5 text-[#777F79] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-medium ${typeBadge.textClass}`}>
                          {typeBadge.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#777F79] text-[11px] truncate max-w-[140px]">
                        {tx.accountName}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium tabular-nums whitespace-nowrap">
                        <span className={isIncome ? 'text-[#237A57] font-semibold' : 'text-[#202521]'}>
                          {isIncome ? '+' : ''}
                          {formatCurrency(tx.amount, currency)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="text-[11px] font-mono text-[#777F79]">
                          Cleared
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 rounded text-[#777F79] hover:text-rose-600 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
