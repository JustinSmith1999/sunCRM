import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Printer, Search, FileText, ChevronLeft, RefreshCw, ChevronRight, Hash, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SELECT_CLAUSE, BOM_CATEGORIES, hasValue } from './bomFields';
import { PullSheetPrintable } from './PullSheetPrintable';

interface Opp {
  Id: string;
  Name: string | null;
  Job_Number__c: string | null;
  AccountId: string | null;
  Install_Address__c: string | null;
  Install_Scheduled_Date__c: string | null;
  Estimated_Installation_Date__c: string | null;
  Job_Status__c: string | null;
  Job_Notes__c: string | null;
  [k: string]: unknown;
}

interface Account {
  Id: string;
  Name: string | null;
  Phone: string | null;
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  PullSheets — list + filter + detail.
 *  Replaces the .xlsm warehouse pull sheet workflow:
 *   - default view: jobs scheduled in the next 7 days
 *   - pick any job → printable per-job pull list
 *   - "Print all" produces a multi-page sheet, page-break per job
 * ────────────────────────────────────────────────────────────────────────── */
export function PullSheets() {
  // Default range: last 90 days through next 30 days. Covers historical
  // jobs (so the page never looks empty if Salesforce sync is stale) AND
  // upcoming jobs once fresh data flows in.
  const [from, setFrom] = useState<string>(() => isoDate(addDays(new Date(), -90)));
  const [to,   setTo]   = useState<string>(() => isoDate(addDays(new Date(),  30)));
  const [search, setSearch] = useState('');
  const [opps, setOpps] = useState<Opp[]>([]);
  const [accounts, setAccounts] = useState<Map<string, Account>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [openOpp, setOpenOpp] = useState<Opp | null>(null);          // for lookups outside the date window
  const [openAcc, setOpenAcc] = useState<Account | null>(null);
  const [mode, setMode] = useState<'list' | 'detail' | 'printAll'>('list');

  // Job # lookup — the warehouse's primary workflow. Auto-focused on load,
  // takes a server-side direct hit on opportunities and jumps straight to
  // the printable sheet. Bypasses the date window so any job is reachable.
  const [lookupValue, setLookupValue] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lookupRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (mode === 'list') lookupRef.current?.focus(); }, [mode]);

  const lookupJob = async (raw: string) => {
    const job = raw.trim();
    if (!job) return;
    setLookupBusy(true);
    setLookupError(null);
    const { data, error } = await supabase
      .from('opportunities')
      .select(SELECT_CLAUSE)
      .eq('Job_Number__c', job)
      .order('LastModifiedDate', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLookupBusy(false);
    if (error) {
      setLookupError(error.message);
      return;
    }
    if (!data) {
      setLookupError(`No job found matching #${job}.`);
      return;
    }
    const opp = data as unknown as Opp;
    // Fetch the account in one round-trip too, so the sheet renders complete.
    let acc: Account | null = null;
    if (opp.AccountId) {
      const { data: a } = await supabase.from('accounts').select('Id, Name, Phone').eq('Id', opp.AccountId).maybeSingle();
      acc = (a as Account) ?? null;
    }
    setOpenOpp(opp);
    setOpenAcc(acc);
    setOpenId(opp.Id);
    setMode('detail');
    setLookupValue('');
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('opportunities')
      .select(SELECT_CLAUSE)
      .gte('Install_Scheduled_Date__c', from)
      .lte('Install_Scheduled_Date__c', to)
      .order('Install_Scheduled_Date__c', { ascending: true })
      .limit(500);

    if (error) {
      console.error('PullSheets load error', error);
      setOpps([]); setAccounts(new Map()); setLoading(false);
      return;
    }
    const rows = (data ?? []) as Opp[];
    setOpps(rows);

    // Pull just the accounts we need, in one batched IN-query.
    const accountIds = Array.from(new Set(rows.map((r) => r.AccountId).filter(Boolean) as string[]));
    if (accountIds.length) {
      const { data: accs } = await supabase
        .from('accounts')
        .select('Id, Name, Phone')
        .in('Id', accountIds);
      const map = new Map<string, Account>();
      (accs ?? []).forEach((a) => map.set(a.Id, a as Account));
      setAccounts(map);
    } else {
      setAccounts(new Map());
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  // Cheap client-side search across job#, name, address.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return opps;
    return opps.filter((o) =>
      (o.Job_Number__c ?? '').toString().toLowerCase().includes(q) ||
      (o.Name ?? '').toLowerCase().includes(q) ||
      (o.Install_Address__c ?? '').toLowerCase().includes(q)
    );
  }, [opps, search]);

  // Counts for the summary bar.
  const summary = useMemo(() => {
    const totalJobs = filtered.length;
    const totalModules = filtered.reduce((sum, o) => {
      const m = parseFloat(String(o.Module_Amount_Sold__c ?? '0')) || 0;
      const b = parseFloat(String(o.Module_Amount_Sold_B__c ?? '0')) || 0;
      return sum + m + b;
    }, 0);
    const withBattery = filtered.filter((o) => hasValue('text', o.Battery_Storage__c) || hasValue('qty', o.Total_Qty_Battery_Storage__c)).length;
    const withEV      = filtered.filter((o) => hasValue('text', o.EV_Charger_Model__c) || hasValue('qty', o.Qty_EV_Chargers__c)).length;
    return { totalJobs, totalModules, withBattery, withEV };
  }, [filtered]);

  const openJob = (id: string) => { setOpenId(id); setMode('detail'); };

  const toggleSel = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAllVisible = () => setSelected(new Set(filtered.map((o) => o.Id)));
  const clearSel = () => setSelected(new Set());

  const printAllSelected = () => {
    if (selected.size === 0) selectAllVisible();
    setMode('printAll');
    // Defer the print() until the layout is in the DOM.
    setTimeout(() => window.print(), 80);
  };

  /* ────────── Render ────────── */

  if (mode === 'detail' && openId) {
    // Prefer the explicitly looked-up record (works for jobs outside the
    // current date window). Fall back to the in-window list otherwise.
    const opp = openOpp ?? opps.find((o) => o.Id === openId) ?? null;
    if (!opp) return null;
    const acc = openAcc ?? (opp.AccountId ? accounts.get(opp.AccountId) ?? null : null);
    return (
      <div className="max-w-4xl mx-auto animate-fade-up">
        <div className="flex items-center justify-between mb-4 no-print">
          <button
            onClick={() => { setMode('list'); setOpenOpp(null); setOpenAcc(null); setOpenId(null); }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-sky transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to list
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-sky hover:bg-sky-deep text-white text-sm font-semibold shadow-soft press-scale transition-all duration-fast ease-smooth"
          >
            <Printer className="w-4 h-4" /> Print this sheet
          </button>
        </div>
        <div className="print-area">
          <PullSheetPrintable opp={opp} account={acc} />
        </div>
      </div>
    );
  }

  if (mode === 'printAll') {
    const rows = selected.size ? filtered.filter((o) => selected.has(o.Id)) : filtered;
    return (
      <div>
        <div className="flex items-center justify-between mb-4 no-print">
          <button onClick={() => setMode('list')} className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-sky transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to list
          </button>
          <div className="text-sm text-ink-muted">Print preview: {rows.length} sheet{rows.length === 1 ? '' : 's'}</div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-sky hover:bg-sky-deep text-white text-sm font-semibold shadow-soft press-scale transition-all duration-fast ease-smooth"
          >
            <Printer className="w-4 h-4" /> Print {rows.length}
          </button>
        </div>
        <div className="print-area space-y-6">
          {rows.map((o) => (
            <PullSheetPrintable
              key={o.Id}
              opp={o}
              account={o.AccountId ? accounts.get(o.AccountId) ?? null : null}
              pageBreak
            />
          ))}
        </div>
      </div>
    );
  }

  // ----- LIST MODE -----
  return (
    <div className="space-y-5 animate-fade-up">
      {/* Page header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-bold tracking-eyebrow uppercase text-sky-dark">Operations</div>
          <h1 className="font-display text-[34px] leading-[40px] font-bold text-ink mt-1 tracking-tighter">Pull Sheets</h1>
          <p className="text-sm text-ink-muted mt-1">Warehouse pick lists for jobs scheduled to install. Live from Supabase.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            title="Re-fetch from Supabase"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-line text-ink bg-white hover:bg-ink-50 text-sm font-semibold transition-colors duration-fast ease-smooth press-scale disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={printAllSelected}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-sky hover:bg-sky-deep text-white text-sm font-semibold shadow-soft press-scale transition-all duration-fast ease-smooth disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print {selected.size > 0 ? selected.size : `all ${filtered.length}`}
          </button>
        </div>
      </div>

      {/* Job # quick lookup — matches the Excel muscle memory: type job#, get sheet. */}
      <form
        onSubmit={(e) => { e.preventDefault(); lookupJob(lookupValue); }}
        className="bg-navy text-white rounded-lg p-5 shadow-card flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[280px]">
          <label className="block text-[11px] font-bold tracking-eyebrow uppercase text-sky-pale/80 mb-1.5">
            Type a Job # → Get the Pull Sheet
          </label>
          <div className="relative">
            <Hash className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-sky-soft pointer-events-none" />
            <input
              ref={lookupRef}
              type="text"
              inputMode="numeric"
              autoFocus
              autoComplete="off"
              value={lookupValue}
              onChange={(e) => { setLookupValue(e.target.value); setLookupError(null); }}
              placeholder="e.g. 25734"
              className="w-full h-12 pl-11 pr-3 bg-white text-ink rounded-lg text-base font-semibold placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-sun tabular"
            />
          </div>
          {lookupError && <div className="text-[12px] text-sun-soft mt-1.5 font-medium">{lookupError}</div>}
        </div>
        <button
          type="submit"
          disabled={lookupBusy || !lookupValue.trim()}
          className="h-12 px-6 rounded-full bg-sun hover:bg-sun-deep text-ink font-semibold text-sm shadow-soft press-scale transition-all duration-fast ease-smooth disabled:opacity-50 inline-flex items-center gap-2"
        >
          {lookupBusy ? (
            <span className="inline-block w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          Open Sheet
        </button>
      </form>

      {/* Filter bar */}
      <div className="bg-white border border-line rounded-lg p-4 shadow-soft">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle mb-1.5">Install date — from</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 pl-9 pr-3 border border-line rounded-lg bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle mb-1.5">To</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 pl-9 pr-3 border border-line rounded-lg bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle mb-1.5">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Job #, opportunity name, or address"
                className="w-full h-10 pl-9 pr-3 border border-line rounded-lg bg-white text-ink text-sm placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setFrom(isoDate(addDays(new Date(), -30))); setTo(isoDate(new Date())); }}
              className="h-10 px-3 rounded-full border border-line text-ink-muted bg-white hover:text-ink hover:bg-ink-50 text-xs font-semibold transition-colors duration-fast">Last 30</button>
            <button onClick={() => { setFrom(isoDate(addDays(new Date(), -90))); setTo(isoDate(new Date())); }}
              className="h-10 px-3 rounded-full border border-line text-ink-muted bg-white hover:text-ink hover:bg-ink-50 text-xs font-semibold transition-colors duration-fast">Last 90</button>
            <button onClick={() => { setFrom(isoDate(new Date())); setTo(isoDate(addDays(new Date(), 7))); }}
              className="h-10 px-3 rounded-full border border-line text-ink-muted bg-white hover:text-ink hover:bg-ink-50 text-xs font-semibold transition-colors duration-fast">Next 7</button>
            <button onClick={() => { setFrom(isoDate(new Date())); setTo(isoDate(addDays(new Date(), 30))); }}
              className="h-10 px-3 rounded-full border border-line text-ink-muted bg-white hover:text-ink hover:bg-ink-50 text-xs font-semibold transition-colors duration-fast">Next 30</button>
            <button onClick={() => { setFrom(isoDate(addDays(new Date(), -90))); setTo(isoDate(addDays(new Date(), 30))); }}
              className="h-10 px-3 rounded-full border border-sky text-sky-dark bg-sky-pale hover:bg-sky-soft text-xs font-semibold transition-colors duration-fast">Default window</button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Jobs in window"   value={summary.totalJobs.toLocaleString()} />
        <SummaryCard label="Modules to pick"  value={summary.totalModules.toLocaleString()} tone="sky" />
        <SummaryCard label="Battery jobs"     value={summary.withBattery.toLocaleString()} tone="sun" />
        <SummaryCard label="EV charger jobs"  value={summary.withEV.toLocaleString()} tone="sun" />
      </div>

      {/* List */}
      <div className="bg-white border border-line rounded-lg shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-line text-xs">
          <div className="text-ink-muted">
            {loading ? 'Loading…' : `${filtered.length} job${filtered.length === 1 ? '' : 's'}`}
            {selected.size > 0 && <span className="ml-2 text-sky-dark font-semibold">· {selected.size} selected</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={selectAllVisible} className="text-ink-muted hover:text-ink font-medium">Select all</button>
            {selected.size > 0 && <button onClick={clearSel} className="text-ink-muted hover:text-ink font-medium">Clear</button>}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-[3px] border-sky border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-6">
            <FileText className="w-10 h-10 text-ink-300 mx-auto" />
            <div className="font-semibold mt-3 text-ink">No jobs scheduled in this window.</div>
            <div className="text-sm text-ink-muted mt-1">Try widening the date range or clearing the search.</div>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((o) => {
              const acc = o.AccountId ? accounts.get(o.AccountId) : undefined;
              const sel = selected.has(o.Id);
              return (
                <li key={o.Id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggleSel(o.Id)}
                    aria-label={`Select job ${o.Job_Number__c ?? ''}`}
                    className="w-4 h-4 accent-sky shrink-0"
                  />
                  <button onClick={() => openJob(o.Id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                    <div className="w-20 shrink-0">
                      <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">Job</div>
                      <div className="font-display text-base font-bold text-ink tabular">{o.Job_Number__c ?? '—'}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink truncate">{o.Name ?? '(unnamed)'}</div>
                      <div className="text-xs text-ink-muted truncate">{acc?.Name ?? '—'} &middot; {o.Install_Address__c ?? '—'}</div>
                    </div>
                    <div className="w-32 shrink-0 text-right">
                      <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">Install</div>
                      <div className="text-sm font-semibold text-ink tabular">{fmtShortDate(o.Install_Scheduled_Date__c)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-300 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Print CSS — scoped here so this module's print behavior is self-contained. */}
      <style>{`
        @media print {
          /* Hide everything outside the print area */
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .pull-sheet-page { page-break-after: always; box-shadow: none !important; border: none !important; padding: 0 !important; }
          .pull-sheet-page:last-child { page-break-after: auto; }
          @page { size: Letter; margin: 0.5in; }
        }
      `}</style>
    </div>
  );
}

/* ───── small helpers ───── */
function SummaryCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'sky' | 'sun' }) {
  const accent = tone === 'sky' ? 'text-sky-dark' : tone === 'sun' ? 'text-sun-deep' : 'text-ink';
  return (
    <div className="bg-white rounded-lg border border-line p-4 shadow-soft">
      <div className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">{label}</div>
      <div className={`font-display text-[28px] leading-[32px] font-bold tabular mt-2 ${accent}`}>{value}</div>
    </div>
  );
}

function isoDate(d: Date): string {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return t.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function fmtShortDate(d: string | null | undefined): string {
  if (!d) return '—';
  const parsed = new Date(d + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export default PullSheets;
