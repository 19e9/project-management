import { useMemo, useState } from 'react';
import { openInvoiceHtmlTab } from '../../features/admin/hooks';
import { BillingLedgerTable } from '../../components/billing/BillingLedgerTable';
import { useBillingDashboard } from '../../features/billing/BillingDashboardContext';
import { formatUsd } from '../../features/billing/billingFormat';

export default function BillingInvoicesPage() {
  const billing = useBillingDashboard();
  const [status, setStatus] = useState<'all' | 'open' | 'paid' | 'overdue'>('all');

  const rows = useMemo(() => {
    const inv = billing.data?.invoices ?? [];
    const now = Date.now();
    return inv.filter((i) => {
      if (status === 'all') return true;
      const st = i.status.toLowerCase();
      if (status === 'paid') return st === 'paid';
      if (status === 'open') return st === 'open' || st === 'issued';
      if (status === 'overdue') {
        const due = new Date(i.dueAt).getTime();
        return due < now && st !== 'paid' && st !== 'void';
      }
      return true;
    });
  }, [billing.data?.invoices, status]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header>
        <h2 className="text-xl font-bold text-ink-900 dark:text-white">Invoices</h2>
        <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
          Ledger-backed invoice artifacts · preview renders bill-ready HTML for PDF printing.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['all', 'open', 'paid', 'overdue'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              status === s
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-950'
                : 'bg-white text-ink-600 ring-1 ring-ink-200 dark:bg-ink-900 dark:text-ink-300 dark:ring-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <BillingLedgerTable
        title="Invoice register"
        subtitle={`${rows.length} rows · USD`}
        loading={billing.isLoading}
        cols={['Number', 'Workspace', 'Status', 'Amount', 'Issued', 'Due']}
        rows={rows.map((i) => ({
          key: i.id,
          cells: [
            i.invoiceNumber,
            i.workspaceName,
            i.status,
            formatUsd(i.amountDueFinalUsd),
            new Date(i.issuedAt).toLocaleDateString(),
            new Date(i.dueAt).toLocaleDateString(),
          ],
          action:
            i.status !== 'void' ? (
              <button
                type="button"
                className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
                onClick={() => void openInvoiceHtmlTab(i.id)}
              >
                Preview
              </button>
            ) : null,
        }))}
      />
    </div>
  );
}
