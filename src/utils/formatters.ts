import { CurrencyCode, SpendingType } from '../types/finance.js';

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';
  if (currency === 'INR') {
    formatted = '₹' + absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: absAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  } else if (currency === 'EUR') {
    formatted = '€' + absAmount.toLocaleString('de-DE', {
      minimumFractionDigits: absAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  } else if (currency === 'GBP') {
    formatted = '£' + absAmount.toLocaleString('en-GB', {
      minimumFractionDigits: absAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  } else {
    formatted = '$' + absAmount.toLocaleString('en-US', {
      minimumFractionDigits: absAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }

  return isNegative ? `-${formatted}` : formatted;
}

export function formatPercent(val: number): string {
  return `${Math.round(val * 10) / 10}%`;
}

export function formatDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function getSpendingTypeBadge(type: SpendingType): { label: string; textClass: string; bgClass: string } {
  switch (type) {
    case 'essential':
      return { label: 'Essential', textClass: 'text-[#237A57]', bgClass: 'bg-[#237A57]/8 border-[#237A57]/20' };
    case 'discretionary':
      return { label: 'Discretionary', textClass: 'text-[#777F79]', bgClass: 'bg-[#F1F3F0] border-[#E8EBE7]' };
    case 'income':
      return { label: 'Income', textClass: 'text-[#237A57]', bgClass: 'bg-[#237A57]/10 border-[#237A57]/25' };
    case 'savings':
      return { label: 'Savings', textClass: 'text-[#2C5282]', bgClass: 'bg-[#2C5282]/8 border-[#2C5282]/20' };
  }
}
