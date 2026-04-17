import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatHours, formatDate, formatTime } from '@/lib/format';

type FilterStatus = 'all' | 'pending' | 'approved';

type Row = {
  id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  hours_worked: number | null;
  pay_amount: number | null;
  status: string;
  employee: { first_name: string; last_name: string } | null;
  area: { name: string; color: string } | null;
};

async function getTimesheets(status: FilterStatus, from?: string, to?: string) {
  const supabase = await createClient();
  let q = supabase
    .from('timesheets')
    .select(
      'id, clock_in_at, clock_out_at, hours_worked, pay_amount, status, employee:profiles!timesheets_employee_id_fkey(first_name, last_name), area:areas(name, color)',
    )
    .order('clock_in_at', { ascending: false })
    .limit(100);

  if (status !== 'all') q = q.eq('status', status);
  if (from) q = q.gte('clock_in_at', from);
  if (to) q = q.lte('clock_in_at', to);

  const { data } = await q;
  return (data ?? []) as unknown as Row[];
}

function statusBadge(status: string) {
  if (status === 'approved' || status === 'paid') return 'badge badge-success';
  if (status === 'pending') return 'badge badge-warning';
  if (status === 'in_progress') return 'badge badge-info';
  if (status === 'auto_closed' || status === 'discarded') return 'badge badge-danger';
  return 'badge badge-info';
}

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: FilterStatus; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status ?? 'all') as FilterStatus;
  const rows = await getTimesheets(status, sp.from, sp.to);

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
  ];

  return (
    <div className="space-y-xl">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Timesheets</h1>
          <p className="mt-sm text-text-secondary">
            {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <button className="btn-primary">Bulk approve</button>
      </header>

      <div className="flex flex-wrap items-center gap-md">
        <div className="flex gap-xs rounded-btn bg-bg-card p-xs">
          {filters.map((f) => {
            const active = status === f.value;
            return (
              <Link
                key={f.value}
                href={`/timesheets?status=${f.value}`}
                className={`rounded-btn px-md py-sm text-sm font-semibold transition-colors ${
                  active ? 'bg-bg-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <form className="flex items-center gap-sm">
          <input
            type="date"
            name="from"
            defaultValue={sp.from}
            className="input w-44"
          />
          <span className="text-text-secondary">to</span>
          <input
            type="date"
            name="to"
            defaultValue={sp.to}
            className="input w-44"
          />
          <input type="hidden" name="status" value={status} />
          <button type="submit" className="btn-secondary">Apply</button>
        </form>
      </div>

      <div className="overflow-hidden rounded-card border border-border-subtle bg-bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="p-lg text-left table-head">Employee</th>
              <th className="p-lg text-left table-head">Date</th>
              <th className="p-lg text-left table-head">In / Out</th>
              <th className="p-lg text-left table-head">Area</th>
              <th className="p-lg text-right table-head">Hours</th>
              <th className="p-lg text-right table-head">Pay</th>
              <th className="p-lg text-left table-head">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated transition-colors"
              >
                <td className="p-lg font-semibold">
                  {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '—'}
                </td>
                <td className="p-lg text-text-secondary">{formatDate(r.clock_in_at)}</td>
                <td className="p-lg text-text-secondary">
                  {formatTime(r.clock_in_at)} – {formatTime(r.clock_out_at)}
                </td>
                <td className="p-lg">
                  {r.area ? (
                    <span className="inline-flex items-center gap-sm">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: r.area.color }}
                      />
                      {r.area.name}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-lg text-right font-semibold">{formatHours(r.hours_worked)}</td>
                <td className="p-lg text-right font-semibold">{formatCurrency(r.pay_amount)}</td>
                <td className="p-lg">
                  <span className={statusBadge(r.status)}>{r.status.replace('_', ' ')}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4xl text-center text-text-secondary">
                  No timesheets match those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
