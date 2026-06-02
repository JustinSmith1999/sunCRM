import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar, Printer, Search, FileText, ChevronLeft, ChevronRight,
  RefreshCw, Hash, ArrowRight, ClipboardList, Package, Zap, Battery
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SELECT_CLAUSE, hasValue } from './bomFields';
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
 *  PullSheets — list + filter + printable detail.
 *  Replaces the .xlsm warehouse pull sheet workflow.
 *    Type Job # → opens that sheet directly (matches Excel muscle memory)
 *    Date filter → list of jobs scheduled in that window
 *    Print one, or print many at once.
 *  v3 styling: neutral surfaces, single sky-blue accent, light + dark.
 * ────────────────────────────────────────────────────────────────────────── */
export function PullSheets() {
  const [from, setFrom] = useState<string>(() => isoDate(addDays(new Date(), -90)));
  const [to,   setTo]   = useState<string>(() => isoDate(addDays(new Date(),  30)));
  const [search, setSearch] = useState('');
  const [opps, setOpps] = useState<Opp[]>([]);
  const [accounts, setAccounts] = useState<Map<string, Account>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [openOpp, setOpenOpp] = useState<Opp | null>(null);
  const [openAcc, setOpenAcc] = useState<Account | null>(null);
  const [mode, setMode] = useState<'list' | 'detail' | 'printAll'>('list');

  const [lookupValue, setLookupValue] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lookupRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (mode === 'list') lookupRef.current?.focus(); }, [mode]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('opportunities')
      .select(SELECT_CLAUSE)
      .gte('Install_Scheduled_Date__c', from)
      .lte('Install_Scheduled_Date__c', to)
      .order('Install_Scheduled_Date__c', { ascending: true })
      .limit(500);

    if (error) { console.error(error); setOpps([]); setAccounts(new Map()); setLoading(false); return; }
    const rows = (data ?? []) as Opp[];
    setOpps(rows);

    const accountIds = Array.from(new Set(rows.map((r) => r.AccountId).filter(Boolean) as string[]));
    if (accountIds.length) {
      const { data: accs } = await supabase.from('accounts').select('Id, Name, Phone').in('Id', accountIds);
      const map = new Map<string, Account>();
      (accs ?? []).forEach((a) => map.set(a.Id, a as Account));
      setAccounts(map);
    } else setAccounts(new Map());
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

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
    if (error) { setLookupError(error.message); return; }
    if (!data) { setLookupError(`No job found matching #${job}.`); return; }
    const opp = data as unknown as Opp;
    let acc: Account | null = null;
    if (opp.AccountId) {
      const { data: a } = await supabase.from('accounts').select('Id, Name, Phone').eq('Id', opp.AccountId).maybeSingle();
      acc = (a as Account) ?? null;
    }
    setOpenOpp(opp); setOpenAcc(acc); setOpenId(opp.Id);
    setMode('detail');
    setLookupValue('');
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return opps;
    return opps.filter((o) =>
      (o.Job_Number__c ?? '').toString().toLowerCase().includes(q) ||
      (o.Name ?? '').toLowerCase().includes(q) ||
      (o.Install_Address__c ?? '').toLowerCase().includes(q)
    );
  }, [opps, search]);

  const summary = useMemo(() => {
    const totalJobs = filtered.length;
    const totalModules = filtered.reduce((sum, o) => {
      const m = parseFloat(String(o.Module_Amount_Sold__c ?? '0')) || 0;
      const b = parseFloat(String(o.Module_Amount_Sold_B__c ?? '0')) || 0;
      return sum + m + b;
    }, 0);
    const withBattery = filtered.filter((o) => hasValue('text', o.Battery_Storage__c) || hasValue('qty', o.Qty_Battery_Storage__c)).length;
    const withEV      = filtered.filter((o) => hasValue('text', o.EV_Charger_Model__c) || hasValue('qty', o.Qty_EV_Chargers__c)).length;
    return { totalJobs, totalModules, withBattery, withEV };
  }, [filtered]);

  const openJob = (id: string) => { setOpenId(id); setMode('detail'); };
  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAllVisible = () => setSelected(new Set(filtered.map((o) => o.Id)));
  const clearSel = () => setSelected(new Set());
  const printAllSelected = () => { if (selected.size === 0) selectAllVisible(); setMode('printAll'); setTimeout(() => window.print(), 80); };

  /* ─── detail ─── */
  if (mode === 'detail' && openId) {
    const opp = openOpp ?? opps.find((o) => o.Id === openId) ?? null;
    if (!opp) return null;
    const acc = openAcc ?? (opp.AccountId ? accounts.get(opp.AccountId) ?? null : null);
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 no-print">
          <button
            onClick={() => { setMode('list'); setOpenOpp(null); setOpenAcc(null); setOpenId(null); }}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" /> Print sheet
          </button>
        </div>
        <div className="print-area"><PullSheetPrintable opp={opp} account={acc} /></div>
        <PrintCSS />
      </div>
    );
  }

  /* ─── print all ─── */
  if (mode === 'printAll') {
    const rows = selected.size ? filtered.filter((o) => selected.has(o.Id)) : filtered;
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 no-print">
          <button onClick={() => setMode('list')} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-500">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Print preview · {rows.length} sheet{rows.length === 1 ? '' : 's'}</div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" /> Print {rows.length}
          </button>
        </div>
        <div className="print-area space-y-6">
          {rows.map((o) => (
            <PullSheetPrintable key={o.Id} opp={o} account={o.AccountId ? accounts.get(o.AccountId) ?? null : null} pageBreak />
          ))}
        </div>
        <PrintCSS />
      </div>
    );
  }

  /* ─── list ─── */
  return (
    <div className="p-6 space-y-5">

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Pull Sheets</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Warehouse pick lists. Live from Supabase.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={printAllSelected}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" /> Print {selected.size > 0 ? selected.size : `all ${filtered.length}`}
          </button>
        </div>
      </div>

      {/* Quick lookup */}
      <form
        onSubmit={(e) => { e.preventDefault(); lookupJob(lookupValue); }}
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
      >
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Open a Pull Sheet by Job Number
        </label>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Hash className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={lookupRef}
              type="text"
              inputMode="numeric"
              autoFocus
              autoComplete="off"
              value={lookupValue}
              onChange={(e) => { setLookupValue(e.target.value); setLookupError(null); }}
              placeholder="e.g. 25734"
              className="w-full h-10 pl-9 pr-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium tabular"
            />
          </div>
          <button
            type="submit"
            disabled={lookupBusy || !lookupValue.trim()}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {lookupBusy
              ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <ArrowRight className="w-3.5 h-3.5" />}
            Open
          </button>
        </div>
        {lookupError && <div className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">{lookupError}</div>}
      </form>

      {/* Date filter */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">From</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="h-9 pl-8 pr-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">To</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="h-9 pl-8 pr-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Job #, name, or address"
                className="w-full h-9 pl-8 pr-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              ['Last 30',  -30, 0],
              ['Last 90',  -90, 0],
              ['Next 7',   0,   7],
              ['Next 30',  0,   30],
            ].map(([label, a, b]) => (
              <button key={label as string}
                onClick={() => { setFrom(isoDate(addDays(new Date(), a as number))); setTo(isoDate(addDays(new Date(), b as number))); }}
                className="h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-medium transition-colors"
              >
                {label as string}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary — quiet, monochrome with one sky accent */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Jobs in window"  value={summary.totalJobs.toLocaleString()}    icon={ClipboardList} accent />
        <Stat label="Modules to pick" value={summary.totalModules.toLocaleString()} icon={Package} />
        <Stat label="Battery jobs"    value={summary.withBattery.toLocaleString()}  icon={Battery} />
        <Stat label="EV charger jobs" value={summary.withEV.toLocaleString()}       icon={Zap} />
      </div>

      {/* List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 h-10 border-b border-zinc-200 dark:border-zinc-800 text-xs">
          <div className="text-zinc-600 dark:text-zinc-400">
            {loading ? 'Loading…' : (
              <>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{filtered.length}</span> job{filtered.length === 1 ? '' : 's'}
                {selected.size > 0 && <span className="ml-2 text-blue-500 font-medium">· {selected.size} selected</span>}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={selectAllVisible} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium">Select all</button>
            {selected.size > 0 && <button onClick={clearSel} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium">Clear</button>}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <div className="font-medium text-sm mt-3 text-zinc-900 dark:text-zinc-100">No jobs in this window.</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Try widening the date range or clearing the search.</div>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filtered.map((o) => {
              const acc = o.AccountId ? accounts.get(o.AccountId) : undefined;
              const sel = selected.has(o.Id);
              return (
                <li key={o.Id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                  <input type="checkbox" checked={sel} onChange={() => toggleSel(o.Id)}
                    aria-label={`Select job ${o.Job_Number__c ?? ''}`}
                    className="w-3.5 h-3.5 accent-blue-500 shrink-0" />
                  <button onClick={() => openJob(o.Id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                    <div className="w-16 shrink-0 tabular text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {o.Job_Number__c ?? '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{o.Name ?? '(unnamed)'}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{acc?.Name ?? '—'} · {o.Install_Address__c ?? '—'}</div>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular shrink-0 w-20 text-right">
                      {fmtShortDate(o.Install_Scheduled_Date__c)}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <PrintCSS />
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; accent?: boolean }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${accent ? 'text-blue-500' : 'text-zinc-400 dark:text-zinc-600'}`} />
      </div>
      <div className="font-display text-2xl font-semibold tabular text-zinc-900 dark:text-zinc-100 mt-2 tracking-tight">{value}</div>
    </div>
  );
}

function PrintCSS() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        .print-area, .print-area * { visibility: visible !important; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
        .pull-sheet-page { page-break-after: always; box-shadow: none !important; border: none !important; padding: 0 !important; }
        .pull-sheet-page:last-child { page-break-after: auto; }
        @page { size: Letter; margin: 0.5in; }
      }
    `}</style>
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
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default PullSheets;
