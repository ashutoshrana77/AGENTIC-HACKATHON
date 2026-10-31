import React from 'react';
import { RecurringCommitment, CurrencyCode } from '../types/finance.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import {
  Repeat,
  AlertCircle,
  HelpCircle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Info,
} from 'lucide-react';

interface SubscriptionsViewProps {
  recurring: RecurringCommitment[];
  currency: CurrencyCode;
  onAction: (id: string, action: 'confirm_active' | 'mark_cancelled' | 'dismiss_alert') => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  recurring,
  currency,
  onAction,
}) => {
  const activeRecurring = recurring.filter((r) => r.status !== 'cancelled');

  const totalAnnualRecurring = activeRecurring.reduce((sum, r) => {
    if (r.frequency === 'annual') return sum + r.amount;
    if (r.frequency === 'quarterly') return sum + r.amount * 4;
    return sum + r.amount * 12;
  }, 0);

  const totalMonthlyRecurring = totalAnnualRecurring / 12;

  const flaggedIncreases = recurring.filter((r) => r.status === 'flagged_increase');
  const flaggedUnused = recurring.filter((r) => r.status === 'flagged_unused');
  const flaggedDuplicates = recurring.filter((r) => r.status === 'flagged_duplicate');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-lg font-semibold text-[#202521]">Recurring Commitments & Subscriptions</h1>
        <p className="text-xs text-[#777F79]">
          Ongoing contract obligations, payment cadence, and proactive price change tracking
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="text-xs text-[#777F79] font-medium">Annualized Commitments</div>
          <div className="text-2xl font-bold font-mono text-[#202521] mt-1 tabular-nums tracking-tight">
            {formatCurrency(totalAnnualRecurring, currency)}
          </div>
          <div className="text-[11px] text-[#777F79] mt-1">
            {formatCurrency(totalMonthlyRecurring, currency)} / month fixed contract load
          </div>
        </div>

        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="text-xs text-[#777F79] font-medium">Active Services Tracked</div>
          <div className="text-2xl font-bold font-mono text-[#202521] mt-1 tabular-nums tracking-tight">
            {activeRecurring.length}
          </div>
          <div className="text-[11px] text-[#777F79] mt-1">
            Rent, loans, cloud, software, utilities
          </div>
        </div>

        <div className="bg-white border border-[#E8EBE7] rounded-lg p-4">
          <div className="text-xs text-[#777F79] font-medium">Identified Optimization Potential</div>
          <div className="text-2xl font-bold font-mono text-[#237A57] mt-1 tabular-nums tracking-tight">
            {formatCurrency(260 * 12 + 132, currency)}
          </div>
          <div className="text-[11px] text-[#777F79] mt-1">
            Annual potential savings across unconfirmed & duplicate plans
          </div>
        </div>
      </div>

      {/* Notifications & Confirmation Prompts */}
      <div className="space-y-3">
        {flaggedIncreases.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-white border border-[#E8EBE7] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#202521]">{item.name}</span>
                <span className="text-[10px] font-mono text-[#777F79] bg-[#F8F9F7] px-1.5 py-0.5 rounded border border-[#E8EBE7]">
                  Price Adjustment
                </span>
              </div>
              <p className="text-xs text-[#777F79] mt-0.5">
                Charge increased from{' '}
                <span className="line-through">{formatCurrency(item.previousAmount || 19.99, currency)}</span>{' '}
                to <span className="font-semibold text-[#202521]">{formatCurrency(item.amount, currency)}</span>/mo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onAction(item.id, 'dismiss_alert')}
                className="px-3 py-1.5 text-xs font-medium text-[#202521] bg-white hover:bg-[#F8F9F7] border border-[#E8EBE7] rounded-md transition-colors"
              >
                Accept Update
              </button>
              <button
                onClick={() => onAction(item.id, 'mark_cancelled')}
                className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        ))}

        {flaggedUnused.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-white border border-[#E8EBE7] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#202521]">{item.name}</span>
                <span className="text-[10px] font-mono text-[#777F79] bg-[#F8F9F7] px-1.5 py-0.5 rounded border border-[#E8EBE7]">
                  Confirmation Needed
                </span>
              </div>
              <p className="text-xs text-[#777F79] mt-0.5">
                {item.unusedEvidence || 'No recorded activity check-ins in the past 45 days.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onAction(item.id, 'confirm_active')}
                className="px-3 py-1.5 text-xs font-medium text-[#237A57] bg-[#237A57]/10 hover:bg-[#237A57]/20 border border-[#237A57]/25 rounded-md transition-colors"
              >
                Still Using (Confirm)
              </button>
              <button
                onClick={() => onAction(item.id, 'mark_cancelled')}
                className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
              >
                Mark Cancelled
              </button>
            </div>
          </div>
        ))}

        {flaggedDuplicates.length > 0 && (
          <div className="p-4 bg-white border border-[#E8EBE7] rounded-lg text-xs text-[#777F79]">
            <span className="font-semibold text-[#202521]">Redundant Audio Streaming Subscriptions:</span>{' '}
            Both Spotify Duo ($16.99) and Apple Music ($10.99) are actively billed. Consolidating saves $131 to $203 annually.
          </div>
        )}
      </div>

      {/* Commitments Table */}
      <div className="bg-white border border-[#E8EBE7] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#E8EBE7]">
          <h3 className="text-sm font-semibold text-[#202521]">Committed Obligations Schedule</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E8EBE7] bg-[#FDFDFD] text-[#777F79] font-medium">
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Cadence</th>
                <th className="py-2.5 px-4">Next Due Date</th>
                <th className="py-2.5 px-4">Account</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBE7] text-[#202521]">
              {recurring.map((item) => {
                const isCancelled = item.status === 'cancelled';
                return (
                  <tr key={item.id} className={`hover:bg-[#F8F9F7] ${isCancelled ? 'opacity-40' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#202521]">{item.name}</div>
                      <div className="text-[11px] text-[#777F79]">{item.merchant}</div>
                    </td>

                    <td className="py-3 px-4 capitalize font-mono text-[#777F79]">
                      {item.frequency}
                    </td>

                    <td className="py-3 px-4 font-mono text-[#777F79]">
                      {formatDate(item.nextDueDate)}
                    </td>

                    <td className="py-3 px-4 text-[#777F79]">{item.account}</td>

                    <td className="py-3 px-4 text-right font-mono font-medium tabular-nums">
                      {formatCurrency(item.amount, currency)}
                    </td>

                    <td className="py-3 px-4">
                      {isCancelled ? (
                        <span className="text-[11px] text-[#777F79]">Cancelled</span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#237A57]">Active</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isCancelled ? (
                        <button
                          onClick={() => onAction(item.id, 'confirm_active')}
                          className="text-[11px] text-[#777F79] hover:text-[#202521]"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => onAction(item.id, 'mark_cancelled')}
                          className="text-[11px] text-[#777F79] hover:text-rose-600"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
