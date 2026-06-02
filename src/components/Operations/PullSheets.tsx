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
 *   - Type a Job # → jump straight to that printable sheet (the operator flow)
 *   - OR pick from a list filtered by install date (the planner flow)
 *   - "Print all" produces a multi-page sheet, page-break per job
 *  Styled to match the original Bolt sunCRM admin theme.
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

    if (error) {
      console.error('PullSheets load error', error);
      setOpps([]); setAccounts(new Map()); setLoading(false);
      return;
    }
    const rows = (data ?? []) as Opp[];
    setOpps(rows);

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
  const toggleSel = (id: string) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAllVisible = () => setSelected(new Set(filtered.map((o) => o.Id)));
  const clearSel = () => setSelected(new Set());
  const printAllSelected = () => {
    if (selected.size === 0) selectAllVisible();
    setMode('printAll');
    setTimeout(() => window.print(), 80);
  };

  /* ─── detail ─── */
  if (mode === 'detail' && openId) {
    const opp = openOpp ?? opps.find((o) => o.Id === openId) ?? null;
    if (!opp) return null;
    const acc = openAcc ?? (opp.AccountId ? accounts.get(opp.AccountId) ?? null : null);
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 no-print">
          <button
            onClick={() => { setMode('list'); setOpenOpp(null); setOpenAcc(null); setOpenId(null); }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to list
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-semibold shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" /> Print this sheet
          </button>
        </div>
        <div className="print-area">
          <PullSheetPrintable opp={opp} account={acc} />
        </div>
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
          <button onClick={() => setMode('list')} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600">
            <ChevronLeft className="w-4 h-4" /> Back to list
          </button>
          <div className="text-sm text-gray-500">Print preview: {rows.length} sheet{rows.length === 1 ? '' : 's'}</div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-semibold shadow-lg transition-all"
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
    <div className="p-6 space-y-6">

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Pull Sheets</h1>
          <p className="text-gray-500 mt-1 text-sm">Warehouse pick lists for jobs scheduled to install. Live from Supabase.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={printAllSelected}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-semibold shadow-lg transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Print {selected.size > 0 ? selected.size : `all ${filtered.length}`}
          </button>
        </div>
      </div>

      {/* Job # quick lookup — primary entry point, matches Excel muscle memory */}
      <form
        onSubmit={(e) => { e.preventDefault(); lookupJob(lookupValue); }}
        className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200"
      >
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Type a Job # to open its Pull Sheet
        </label>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Hash className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={lookupRef}
              type="text"
              inputMode="numeric"
              autoFocus
              autoComplete="off"
              value={lookupValue}
              onChange={(e) => { setLookupValue(e.target.value); setLookupError(null); }}
              placeholder="e.g. 25734"
              className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={lookupBusy || !lookupValue.trim()}
            className="inline-flex items-center gap-2 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg disabled:opacity-50 transition-all"
          >
            {lookupBusy
              ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <ArrowRight className="w-4 h-4" />}
            Open Sheet
          </button>
        </div>
        {lookupError && <div className="text-sm text-red-600 mt-2 font-medium">{lookupError}</div>}
      </form>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Install date — from</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">To</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Job #, opportunity name, or address"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ChipButton onClick={() => { setFrom(isoDate(addDays(new Date(), -30))); setTo(isoDate(new Date())); }}>Last 30</ChipButton>
            <ChipButton onClick={() => { setFrom(isoDate(addDays(new Date(), -90))); setTo(isoDate(new Date())); }}>Last 90</ChipButton>
            <ChipButton onClick={() => { setFrom(isoDate(new Date())); setTo(isoDate(addDays(new Date(), 7))); }}>Next 7</ChipButton>
            <ChipButton onClick={() => { setFrom(isoDate(new Date())); setTo(isoDate(addDays(new Date(), 30))); }}>Next 30</ChipButton>
          </div>
        </div>
      </div>

      {/* Summary cards — gradient style matching AccountList */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard color="from-blue-600 to-cyan-600"        icon={ClipboardList} label="Jobs in window"   value={summary.totalJobs.toLocaleString()} />
        <SummaryCard color="from-emerald-600 to-green-600"   icon={Package}       label="Modules to pick"  value={summary.totalModules.toLocaleString()} />
        <SummaryCard color="from-amber-600 to-orange-600"    icon={Battery}       label="Battery jobs"     value={summary.withBattery.toLocaleString()} />
        <SummaryCard color="from-purple-600 to-pink-600"     icon={Zap}           label="EV charger jobs"  value={summary.withEV.toLocaleString()} />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 text-sm">
          <div className="text-gray-600">
            {loading ? 'Loading…' : (
              <>
                <span className="font-semibold text-gray-900">{filtered.length}</span> job{filtered.length === 1 ? '' : 's'}
                {selected.size > 0 && <span className="ml-2 text-blue-600 font-semibold">· {selected.size} selected</span>}
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button onClick={selectAllVisible} className="text-gray-600 hover:text-blue-600 font-medium">Select all</button>
            {selected.size > 0 && <button onClick={clearSel} className="text-gray-600 hover:text-blue-600 font-medium">Clear</button>}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
            <div className="font-semibold mt-3 text-gray-900">No jobs scheduled in this window.</div>
            <div className="text-sm text-gray-500 mt-1">Try widening the date range or clearing the search.</div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filtered.map((o) => {
              const acc = o.AccountId ? accounts.get(o.AccountId) : undefined;
              const sel = selected.has(o.Id);
              return (
                <li key={o.Id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggleSel(o.Id)}
                    aria-label={`Select job ${o.Job_Number__c ?? ''}`}
                    className="w-4 h-4 accent-blue-600 shrink-0"
                  />
                  <button onClick={() => openJob(o.Id)} className="flex-1 flex items-center gap-4 text-left min-w-0">
                    <div className="w-20 shrink-0">
                      <div className="text-[10px] tracking-wider uppercase font-bold text-gray-500">Job</div>
                      <div className="text-base font-black text-gray-900 tabular-nums">{o.Job_Number__c ?? '—'}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{o.Name ?? '(unnamed)'}</div>
                      <div className="text-xs text-gray-500 truncate">{acc?.Name ?? '—'} &middot; {o.Install_Address__c ?? '—'}</div>
                    </div>
                    <div className="w-32 shrink-0 text-right">
                      <div className="text-[10px] tracking-wider uppercase font-bold text-gray-500">Install</div>
                      <div className="text-sm font-bold text-gray-900 tabular-nums">{fmtShortDate(o.Install_Scheduled_Date__c)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
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

/* ─── pieces ─── */

function SummaryCard(props: { color: string; icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  const Icon = props.icon;
  return (
    <div className={`bg-gradient-to-br ${props.color} rounded-2xl shadow-2xl p-6 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      <div className="relative z-10">
        <Icon className="w-10 h-10 text-white/90 mb-3" />
        <div className="text-4xl font-black text-white mb-2 tabular-nums">{props.value}</div>
        <div className="text-sm text-white/80 font-medium">{props.label}</div>
      </div>
    </div>
  );
}

function ChipButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2.5 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-xs font-semibold transition-colors"
    >
      {children}
    </button>
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

/* ─── utils ─── */

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
