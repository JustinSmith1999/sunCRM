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
  // BOM fields are dynamically read by column name — keep typing open.
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
  /** When true, the sheet renders as a freestanding letter-sized page —
   *  used for the bulk print-all view. Default false (inline / on-screen). */
  pageBreak?: boolean;
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—';
  // Salesforce dates come as 'YYYY-MM-DD'; format as Wed · Jan 14, 2026
  const parsed = new Date(d + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

export function PullSheetPrintable({ opp, account, pageBreak }: PullSheetPrintableProps) {
  const installDate = opp.Install_Scheduled_Date__c ?? opp.Estimated_Installation_Date__c ?? null;

  // Only render categories that have at least one populated field for THIS job.
  const populatedCategories = BOM_CATEGORIES.map((cat) => ({
    ...cat,
    fields: cat.fields.filter((f) => hasValue(f.kind, opp[f.column])),
  })).filter((c) => c.fields.length > 0);

  return (
    <article
      className={`pull-sheet bg-white border border-line p-8 ${pageBreak ? 'pull-sheet-page' : 'rounded-lg shadow-soft'}`}
    >
      {/* Header — job identity */}
      <header className="flex items-start justify-between gap-6 border-b-2 border-ink pb-4">
        <div>
          <div className="text-[10px] tracking-eyebrow uppercase font-bold text-sky-dark">
            SUNation Energy · Warehouse Pull Sheet
          </div>
          <h1 className="font-display text-[28px] leading-[32px] font-bold text-ink mt-1 tracking-tighter">
            Job {opp.Job_Number__c ?? '(no number)'} &mdash; {opp.Name ?? 'Unnamed Opportunity'}
          </h1>
          <div className="text-sm text-ink-muted mt-1">{account?.Name ?? '—'}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">Install</div>
          <div className="font-display text-[20px] font-bold text-ink leading-tight mt-0.5 tabular">{fmtDate(installDate)}</div>
          <div className="text-xs text-ink-muted mt-1">Status: {opp.Job_Status__c ?? '—'}</div>
        </div>
      </header>

      {/* Address + contact band */}
      <div className="grid grid-cols-2 gap-6 mt-4">
        <div>
          <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">Install Address</div>
          <div className="text-sm text-ink mt-1">{opp.Install_Address__c ?? '—'}</div>
        </div>
        <div>
          <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">Customer Phone</div>
          <div className="text-sm text-ink mt-1 tabular">{account?.Phone ?? '—'}</div>
        </div>
      </div>

      {/* BOM sections */}
      <div className="mt-6 space-y-4">
        {populatedCategories.length === 0 ? (
          <div className="text-sm text-ink-muted italic">No BOM data on this opportunity yet.</div>
        ) : populatedCategories.map((cat) => (
          <section key={cat.key}>
            <h2 className="font-display text-[15px] font-bold uppercase tracking-tighter text-sky-dark border-b border-line pb-1 mb-2">
              {cat.title}
            </h2>
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr><th>Part</th><th>Quantity / Detail</th><th>Picked</th></tr>
              </thead>
              <tbody>
                {cat.fields.map((f) => (
                  <tr key={f.column} className="border-b border-line last:border-b-0">
                    <td className="py-1.5 pr-2 text-ink-muted w-1/2">{f.label}</td>
                    <td className="py-1.5 pr-2 font-semibold text-ink tabular">
                      {formatValue(f.kind, opp[f.column])}
                    </td>
                    <td className="py-1.5 w-12 text-right">
                      {/* Warehouse-pickable checkbox */}
                      <span className="inline-block w-5 h-5 border border-ink-300 rounded-sm align-middle" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      {/* Footer — sign-off */}
      <footer className="mt-8 pt-4 border-t border-line text-xs text-ink-subtle flex items-end justify-between gap-6">
        <div className="flex-1">
          <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">Notes</div>
          <div className="text-[12px] text-ink-muted whitespace-pre-line mt-1 min-h-[24px]">
            {opp.Job_Notes__c ?? ''}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 shrink-0">
          <div>
            <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">Picked by</div>
            <div className="border-b border-ink-400 mt-1 w-44 h-6" />
          </div>
          <div>
            <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">Date</div>
            <div className="border-b border-ink-400 mt-1 w-32 h-6" />
          </div>
        </div>
      </footer>
    </article>
  );
}
