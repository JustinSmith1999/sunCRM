import React from 'react';
import { BOM_CATEGORIES, hasValue, formatValue } from './bomFields';

interface OpportunityRow {
  Id: string;
  Name?: string | null;
  Job_Number__c?: string | null;
  AccountId?: string | null;
  Install_Address__c?: string | null;
  Install_Scheduled_Date__c?: string | null;
  Estimated_Installation_Date__c?: string | null;
  Job_Status__c?: string | null;
  Job_Notes__c?: string | null;
  [key: string]: unknown;
}

interface AccountRow {
  Id: string;
  Name?: string | null;
  Phone?: string | null;
}

export interface PullSheetPrintableProps {
  opp:      OpportunityRow;
  account?: AccountRow | null;
  pageBreak?: boolean;
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—';
  const parsed = new Date(d + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

export function PullSheetPrintable({ opp, account, pageBreak }: PullSheetPrintableProps) {
  const installDate = opp.Install_Scheduled_Date__c ?? opp.Estimated_Installation_Date__c ?? null;

  const populatedCategories = BOM_CATEGORIES.map((cat) => ({
    ...cat,
    fields: cat.fields.filter((f) => hasValue(f.kind, opp[f.column])),
  })).filter((c) => c.fields.length > 0);

  return (
    <article
      className={`pull-sheet bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 text-zinc-900 dark:text-zinc-100 ${pageBreak ? 'pull-sheet-page' : 'rounded-xl'}`}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="text-[10px] tracking-wide uppercase font-medium text-blue-500">
            Warehouse Pull Sheet
          </div>
          <h1 className="font-display text-xl font-semibold mt-1 tracking-tight">
            Job {opp.Job_Number__c ?? '(no number)'} · {opp.Name ?? 'Unnamed Opportunity'}
          </h1>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{account?.Name ?? '—'}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] tracking-wide uppercase font-medium text-zinc-500 dark:text-zinc-400">Install</div>
          <div className="font-display text-base font-medium tabular mt-0.5">{fmtDate(installDate)}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{opp.Job_Status__c ?? '—'}</div>
        </div>
      </header>

      {/* Address + contact */}
      <div className="grid grid-cols-2 gap-6 mt-4">
        <div>
          <div className="text-[10px] tracking-wide uppercase font-medium text-zinc-500 dark:text-zinc-400">Install Address</div>
          <div className="text-sm mt-1">{opp.Install_Address__c ?? '—'}</div>
        </div>
        <div>
          <div className="text-[10px] tracking-wide uppercase font-medium text-zinc-500 dark:text-zinc-400">Customer Phone</div>
          <div className="text-sm mt-1 tabular">{account?.Phone ?? '—'}</div>
        </div>
      </div>

      {/* BOM sections */}
      <div className="mt-6 space-y-5">
        {populatedCategories.length === 0 ? (
          <div className="text-sm text-zinc-500 dark:text-zinc-400 italic">No BOM data on this opportunity yet.</div>
        ) : populatedCategories.map((cat) => (
          <section key={cat.key}>
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-blue-500 border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-2">
              {cat.title}
            </h2>
            <table className="w-full text-sm">
              <thead className="sr-only"><tr><th>Part</th><th>Qty</th><th>Picked</th></tr></thead>
              <tbody>
                {cat.fields.map((f) => (
                  <tr key={f.column} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-b-0">
                    <td className="py-1.5 pr-2 text-zinc-600 dark:text-zinc-400 w-1/2">{f.label}</td>
                    <td className="py-1.5 pr-2 font-medium tabular">{formatValue(f.kind, opp[f.column])}</td>
                    <td className="py-1.5 w-12 text-right">
                      <span className="inline-block w-4 h-4 border border-zinc-300 dark:border-zinc-600 rounded-sm align-middle" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs flex items-end justify-between gap-6">
        <div className="flex-1">
          <div className="text-[10px] tracking-wide uppercase font-medium text-zinc-500 dark:text-zinc-400">Notes</div>
          <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line mt-1 min-h-[24px]">
            {opp.Job_Notes__c ?? ''}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 shrink-0 text-zinc-500 dark:text-zinc-400">
          <div>
            <div className="text-[10px] tracking-wide uppercase font-medium">Picked by</div>
            <div className="border-b border-zinc-400 dark:border-zinc-600 mt-1 w-40 h-5" />
          </div>
          <div>
            <div className="text-[10px] tracking-wide uppercase font-medium">Date</div>
            <div className="border-b border-zinc-400 dark:border-zinc-600 mt-1 w-28 h-5" />
          </div>
        </div>
      </footer>
    </article>
  );
}
