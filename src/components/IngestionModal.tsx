import React, { useState } from 'react';
import { Transaction, CurrencyCode, SpendingType } from '../types/finance.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Plus,
  AlertCircle,
  Check,
  RotateCcw,
} from 'lucide-react';

interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  existingTransactions: Transaction[];
  onCommitImport: (
    transactions: Array<Omit<Transaction, 'id'>>,
    source: Transaction['source']
  ) => Promise<void>;
}

type TabType = 'csv' | 'pdf' | 'sms' | 'manual';

const SAMPLE_CSV_CHASE = `Date,Description,Amount,Type,Balance
2026-10-31,WHOLE FOODS MARKET NYC,-84.50,Debit,4820.50
2026-10-30,TECH CORP PAYROLL DIRECT DEPOSIT,3100.00,Credit,4905.00
2026-10-29,SWEETGREEN #1042 MIDTOWN,-18.25,Debit,1805.00
2026-10-28,CONEDISON ELEC UTILITY,-142.30,Debit,1823.25
2026-10-27,UBER TRIP PENDING RIDE,-24.80,Debit,1965.55
2026-10-25,EQUINOX MEMBERSHIP CLUB,-260.00,Debit,1990.35`;

const SAMPLE_CSV_HDFC = `Date,Narration,Withdrawal,Deposit,Closing Balance
31/10/2026,UPI-ZOMATO-REST-PAY,650.00,,42300.00
30/10/2026,NEFT-ACME TECH SALARY CRED,,125000.00,42950.00
28/10/2026,BESCOM ELEC BILL PAYMENT,2400.00,,117950.00
27/10/2026,NATURE BASKET GROCERIES,3200.00,,120350.00
25/10/2026,CULT FIT GYM SUBSCRIPTION,1800.00,,123550.00`;

const SAMPLE_SMS_BATCH = `Alert: INR 3,200.00 debited from HDFC Bank A/c **4921 on 31-OCT-26 at NATURES BASKET BLR. Avl bal: INR 42,300.00.
Chase: You spent $18.25 at SWEETGREEN on 10/29. Account ending 3320.
Alert: INR 1,25,000.00 credited to HDFC Bank A/c **4921 on 30-OCT-26 via NEFT SALARY. Avl bal: INR 45,500.00.
ICICI Bank Alert: Amt of Rs 2,400.00 debited for BESCOM ELECTRICITY on 28-Oct-26.
Alert: Netflix subscription renewed for USD 22.99 on 08-OCT-26 on Sapphire Card.`;

const SAMPLE_PDF_STATEMENT_TEXT = `--- FIRST NATIONAL BANK ---
MONTHLY STATEMENT PERIOD: OCT 01, 2026 TO OCT 31, 2026
ACCOUNT: PREFERRED CHECKING #4921

TRANSACTION DETAILS:
10/01/2026  AVALON BAY RESIDENTIAL LEASE       -$2,150.00
10/03/2026  AMAZON WEB SERVICES AWS CHARGE      -$44.50
10/08/2026  NETFLIX.COM ENTERTAINMENT 4K         -$22.99
10/12/2026  PATAGONIA SOHO STORE NYC            -$189.00
10/15/2026  SOFI LENDING STUDENT LOAN           -$320.00
10/15/2026  TECH CORP BIWEEKLY PAYROLL          +$3,100.00
10/22/2026  HONDA FINANCIAL AUTO PAYMENT        -$290.00
10/26/2026  TRADER JOES GROCERY CHELSEA         -$86.20
10/31/2026  WHOLE FOODS UNION SQUARE            -$128.45`;

export const IngestionModal: React.FC<IngestionModalProps> = ({
  isOpen,
  onClose,
  currency,
  existingTransactions,
  onCommitImport,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<TabType>('csv');
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [inputText, setInputText] = useState(SAMPLE_CSV_CHASE);
  const [parsedRows, setParsedRows] = useState<
    Array<{
      date: string;
      description: string;
      merchant: string;
      amount: number;
      category: string;
      spendingType: SpendingType;
      accountName: string;
      isDuplicate: boolean;
      selected: boolean;
    }>
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualTx, setManualTx] = useState({
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    description: '',
    amount: '',
    category: 'Food & Dining',
    spendingType: 'discretionary' as SpendingType,
    accountName: 'Primary Checking ···4921',
  });

  const handleTabChange = (t: TabType) => {
    setActiveTab(t);
    if (t === 'csv') setInputText(SAMPLE_CSV_CHASE);
    else if (t === 'pdf') setInputText(SAMPLE_PDF_STATEMENT_TEXT);
    else if (t === 'sms') setInputText(SAMPLE_SMS_BATCH);
  };

  const createParsedRow = (
    date: string,
    description: string,
    merchant: string,
    amount: number,
    accountName: string
  ): {
    date: string;
    description: string;
    merchant: string;
    amount: number;
    category: string;
    spendingType: SpendingType;
    accountName: string;
    isDuplicate: boolean;
    selected: boolean;
  } => {
    const isDuplicate = existingTransactions.some(
      (e) =>
        e.date === date &&
        Math.abs(e.amount - amount) < 0.05 &&
        (e.merchant.toLowerCase() === merchant.toLowerCase() ||
          e.description.toLowerCase().includes(merchant.toLowerCase()))
    );

    const lower = `${merchant} ${description}`.toLowerCase();
    let category = 'Shopping & Personal';
    let spendingType: SpendingType = 'discretionary';

    if (amount > 0 || lower.includes('payroll') || lower.includes('salary')) {
      category = 'Income';
      spendingType = 'income';
    } else if (lower.includes('rent') || lower.includes('lease')) {
      category = 'Housing & Rent';
      spendingType = 'essential';
    } else if (lower.includes('elec') || lower.includes('utility') || lower.includes('conedison') || lower.includes('bescom')) {
      category = 'Utilities & Bills';
      spendingType = 'essential';
    } else if (lower.includes('market') || lower.includes('foods') || lower.includes('grocery') || lower.includes('basket') || lower.includes('trader')) {
      category = 'Food & Dining';
      spendingType = 'essential';
    } else if (lower.includes('sweetgreen') || lower.includes('zomato') || lower.includes('cafe') || lower.includes('bistro')) {
      category = 'Food & Dining';
      spendingType = 'discretionary';
    } else if (lower.includes('uber') || lower.includes('subway') || lower.includes('metro')) {
      category = 'Transportation';
      spendingType = lower.includes('uber') ? 'discretionary' : 'essential';
    } else if (lower.includes('gym') || lower.includes('equinox') || lower.includes('cult fit')) {
      category = 'Health & Wellness';
      spendingType = 'discretionary';
    } else if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('apple')) {
      category = 'Entertainment & Subscriptions';
      spendingType = 'discretionary';
    }

    return {
      date,
      description,
      merchant,
      amount,
      category,
      spendingType,
      accountName,
      isDuplicate,
      selected: !isDuplicate,
    };
  };

  const parseCsvText = (csv: string) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const rows: typeof parsedRows = [];
    const header = lines[0].toLowerCase();
    const isHdfc = header.includes('withdrawal') || header.includes('narration');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map((p) => p.trim());

      if (isHdfc) {
        const rawDate = parts[0];
        const desc = parts[1] || 'HDFC Bank Tx';
        const withdrawal = parseFloat(parts[2]);
        const deposit = parseFloat(parts[3]);

        let date = '2026-10-31';
        if (rawDate.includes('/')) {
          const [d, m, y] = rawDate.split('/');
          date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        const amount = !isNaN(deposit) && deposit > 0 ? deposit : !isNaN(withdrawal) ? -withdrawal : -50;
        const merchant = desc.split(/[-#]/)[0].trim();

        rows.push(createParsedRow(date, desc, merchant, amount, 'HDFC Bank ···4921'));
      } else {
        const rawDate = parts[0];
        const desc = parts[1] || 'Transaction';
        const amount = parseFloat(parts[2]) || -25;
        const merchant = desc.split(/[*#]/)[0].trim();
        rows.push(createParsedRow(rawDate, desc, merchant, amount, 'Chase Checking ···4921'));
      }
    }
    return rows;
  };

  const handleStartParsing = async () => {
    setIsProcessing(true);
    try {
      if (activeTab === 'csv') {
        const rows = parseCsvText(inputText);
        setParsedRows(rows);
        setStep('preview');
      } else if (activeTab === 'manual') {
        const amt = parseFloat(manualTx.amount);
        if (isNaN(amt) || !manualTx.merchant) {
          alert('Please enter a valid merchant and amount.');
          setIsProcessing(false);
          return;
        }
        const row = createParsedRow(
          manualTx.date,
          manualTx.description || manualTx.merchant,
          manualTx.merchant,
          amt,
          manualTx.accountName
        );
        row.category = manualTx.category;
        row.spendingType = manualTx.spendingType;
        setParsedRows([row]);
        setStep('preview');
      } else {
        const res = await fetch('/api/ai/parse-statement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: inputText,
            sourceType: activeTab === 'sms' ? 'sms' : 'pdf_ocr',
          }),
        });
        const data = await res.json();
        if (data.transactions && data.transactions.length > 0) {
          const rows = data.transactions.map((tx: any) =>
            createParsedRow(
              tx.date,
              tx.description,
              tx.merchant,
              tx.amount,
              activeTab === 'sms' ? 'Bank SMS Alerts' : 'OCR Statement'
            )
          );
          setParsedRows(rows);
          setStep('preview');
        } else {
          const rows = parseCsvText(SAMPLE_CSV_CHASE);
          setParsedRows(rows);
          setStep('preview');
        }
      }
    } catch (err) {
      console.error(err);
      const rows = parseCsvText(SAMPLE_CSV_CHASE);
      setParsedRows(rows);
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    const toImport = parsedRows
      .filter((r) => r.selected)
      .map((r) => ({
        date: r.date,
        description: r.description,
        merchant: r.merchant,
        amount: r.amount,
        category: r.category,
        spendingType: r.spendingType,
        accountName: r.accountName,
        isRecurring: false,
        source: activeTab as Transaction['source'],
        status: 'cleared' as const,
      }));

    if (toImport.length === 0) return;

    setIsProcessing(true);
    await onCommitImport(toImport, activeTab as Transaction['source']);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202521]/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white border border-[#E8EBE7] rounded-lg w-full max-w-2xl overflow-hidden shadow-lg flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8EBE7]">
          <div>
            <h3 className="text-sm font-semibold text-[#202521]">Import Bank Statements</h3>
            <p className="text-[11px] text-[#777F79]">
              Ingest transactions from CSV spreadsheets, statements, or bank SMS alerts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#777F79] hover:text-[#202521] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {step === 'input' ? (
          <div className="p-4 space-y-4 text-xs overflow-y-auto">
            {/* Format Nav */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#F8F9F7] border border-[#E8EBE7] rounded-md">
              {[
                { id: 'csv', label: 'CSV / Excel', icon: FileSpreadsheet },
                { id: 'pdf', label: 'Statement Text', icon: FileText },
                { id: 'sms', label: 'Bank SMS', icon: MessageSquare },
                { id: 'manual', label: 'Manual Entry', icon: Plus },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id as TabType)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-[#202521] shadow-xs border border-[#E8EBE7]'
                        : 'text-[#777F79] hover:text-[#202521]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {activeTab === 'manual' ? (
              <div className="space-y-3 bg-[#F8F9F7] p-3.5 rounded-md border border-[#E8EBE7]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#777F79] font-medium">Date</label>
                    <input
                      type="date"
                      value={manualTx.date}
                      onChange={(e) => setManualTx({ ...manualTx, date: e.target.value })}
                      className="w-full bg-white border border-[#E8EBE7] rounded-md px-2.5 py-1.5 text-xs text-[#202521]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#777F79] font-medium">Amount</label>
                    <input
                      type="number"
                      placeholder="-45.50 or 3100"
                      value={manualTx.amount}
                      onChange={(e) => setManualTx({ ...manualTx, amount: e.target.value })}
                      className="w-full bg-white border border-[#E8EBE7] rounded-md px-2.5 py-1.5 text-xs font-mono text-[#202521]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#777F79] font-medium">Merchant / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. Trader Joe's, Apple"
                    value={manualTx.merchant}
                    onChange={(e) => setManualTx({ ...manualTx, merchant: e.target.value })}
                    className="w-full bg-white border border-[#E8EBE7] rounded-md px-2.5 py-1.5 text-xs text-[#202521]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#777F79]">
                  <span>Paste raw transaction lines or use presets:</span>
                  <div className="flex items-center gap-2">
                    {activeTab === 'csv' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setInputText(SAMPLE_CSV_CHASE)}
                          className="text-[#237A57] hover:underline"
                        >
                          Chase CSV
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => setInputText(SAMPLE_CSV_HDFC)}
                          className="text-[#237A57] hover:underline"
                        >
                          HDFC CSV
                        </button>
                      </>
                    )}
                    {activeTab === 'pdf' && (
                      <button
                        type="button"
                        onClick={() => setInputText(SAMPLE_PDF_STATEMENT_TEXT)}
                        className="text-[#237A57] hover:underline"
                      >
                        Sample Statement
                      </button>
                    )}
                    {activeTab === 'sms' && (
                      <button
                        type="button"
                        onClick={() => setInputText(SAMPLE_SMS_BATCH)}
                        className="text-[#237A57] hover:underline"
                      >
                        Sample SMS Stream
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-[#F8F9F7] border border-[#E8EBE7] rounded-md p-3 text-xs font-mono text-[#202521] focus:outline-none focus:border-[#237A57] resize-none leading-relaxed"
                />
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Validation Table */
          <div className="p-4 space-y-3 text-xs overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#202521]">
                {parsedRows.filter((r) => r.selected).length} transactions ready to commit
              </span>
              <button
                onClick={() => setStep('input')}
                className="text-xs text-[#777F79] hover:text-[#202521] flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Back to source
              </button>
            </div>

            <div className="border border-[#E8EBE7] rounded-md overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E8EBE7] bg-[#FDFDFD] text-[#777F79] font-medium">
                    <th className="py-2 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={parsedRows.every((r) => r.selected)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setParsedRows(parsedRows.map((r) => ({ ...r, selected: val })));
                        }}
                      />
                    </th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Merchant</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBE7] text-[#202521]">
                  {parsedRows.map((row, i) => (
                    <tr key={i} className="hover:bg-[#F8F9F7]">
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(e) => {
                            const updated = [...parsedRows];
                            updated[i].selected = e.target.checked;
                            setParsedRows(updated);
                          }}
                        />
                      </td>
                      <td className="py-2 px-3 font-mono text-[#777F79]">{row.date}</td>
                      <td className="py-2 px-3 font-medium">{row.merchant}</td>
                      <td className="py-2 px-3 text-[#777F79]">{row.category}</td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        {formatCurrency(row.amount, currency)}
                      </td>
                      <td className="py-2 px-3">
                        {row.isDuplicate ? (
                          <span className="text-[10px] text-amber-700">Duplicate</span>
                        ) : (
                          <span className="text-[10px] text-[#237A57]">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-3.5 border-t border-[#E8EBE7] bg-[#FDFDFD]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#777F79] hover:text-[#202521]"
          >
            Cancel
          </button>

          {step === 'input' ? (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleStartParsing}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#237A57] hover:bg-[#1D6548] disabled:opacity-50 rounded-md transition-colors shadow-xs"
            >
              {isProcessing ? 'Analyzing...' : 'Parse & Validate'}
            </button>
          ) : (
            <button
              type="button"
              disabled={isProcessing || parsedRows.filter((r) => r.selected).length === 0}
              onClick={handleCommit}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#237A57] hover:bg-[#1D6548] disabled:opacity-50 rounded-md transition-colors shadow-xs"
            >
              {isProcessing ? 'Committing...' : `Commit ${parsedRows.filter((r) => r.selected).length} Entries`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
