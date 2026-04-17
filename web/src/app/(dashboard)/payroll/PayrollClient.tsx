'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatHours, startOfWeek } from '@/lib/format';

type Summary = {
  employee_id: string;
  name: string;
  hours: number;
  pay: number;
};

function defaultFrom() {
  const d = startOfWeek();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  const d = startOfWeek();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function PayrollClient() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [rows, setRows] = useState<Summary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('timesheets')
      .select(
        'employee_id, hours_worked, pay_amount, employee:profiles!timesheets_employee_id_fkey(first_name, last_name)',
      )
      .gte('clock_in_at', `${from}T00:00:00Z`)
      .lte('clock_in_at', `${to}T23:59:59Z`)
      .in('status', ['approved', 'paid']);

    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }

    const map = new Map<string, Summary>();
    for (const t of (data ?? []) as unknown as Array<{
      employee_id: string;
      hours_worked: number | null;
      pay_amount: number | null;
      employee: { first_name: string; last_name: string } | null;
    }>) {
      const cur = map.get(t.employee_id) ?? {
        employee_id: t.employee_id,
        name: t.employee ? `${t.employee.first_name} ${t.employee.last_name}` : 'Unknown',
        hours: 0,
        pay: 0,
      };
      cur.hours += t.hours_worked ?? 0;
      cur.pay += t.pay_amount ?? 0;
      map.set(t.employee_id, cur);
    }
    setRows([...map.values()].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function exportCsv() {
    const header = 'Employee,Hours,Pay\n';
    const body = rows
      .map((r) => `"${r.name}",${r.hours.toFixed(2)},${r.pay.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  const totalPay = rows.reduce((s, r) => s + r.pay, 0);

  return (
    <>
      <div className="card flex flex-wrap items-end gap-lg">
        <div>
          <label className="mb-xs block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input w-44"
          />
        </div>
        <div>
          <label className="mb-xs block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input w-44"
          />
        </div>
        <button onClick={run} disabled={busy} className="btn-primary">
          {busy ? 'Loading…' : 'Run'}
        </button>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="btn-secondary"
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="rounded-btn border-l-[3px] border-status-danger bg-status-danger-soft px-lg py-md text-sm">
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-xl md:grid-cols-2">
            <div className="card">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Total hours
              </div>
              <div className="mt-md text-5xl font-black">{formatHours(totalHours)}</div>
            </div>
            <div className="card">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Total pay
              </div>
              <div className="mt-md text-5xl font-black text-accent">
                {formatCurrency(totalPay)}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-card border border-border-subtle bg-bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="p-lg text-left table-head">Employee</th>
                  <th className="p-lg text-right table-head">Hours</th>
                  <th className="p-lg text-right table-head">Pay</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employee_id} className="border-b border-border-subtle last:border-0">
                    <td className="p-lg font-semibold">{r.name}</td>
                    <td className="p-lg text-right font-semibold">{formatHours(r.hours)}</td>
                    <td className="p-lg text-right font-semibold">{formatCurrency(r.pay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
