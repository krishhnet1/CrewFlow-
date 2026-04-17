import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatHours, startOfWeek, endOfWeek, formatTime } from '@/lib/format';

type TimesheetRow = {
  id: string;
  hours_worked: number | null;
  pay_amount: number | null;
  status: string;
  clock_in_at: string;
  clock_out_at: string | null;
  employee: { first_name: string; last_name: string } | null;
};

async function getDashboardData() {
  const supabase = await createClient();
  const weekStart = startOfWeek().toISOString();
  const weekEnd = endOfWeek().toISOString();

  const [tsWeek, onShift, pendingApprovals] = await Promise.all([
    supabase
      .from('timesheets')
      .select('id, hours_worked, pay_amount, status, clock_in_at, clock_out_at')
      .gte('clock_in_at', weekStart)
      .lt('clock_in_at', weekEnd),
    supabase
      .from('timesheets')
      .select(
        'id, clock_in_at, clock_out_at, status, hours_worked, pay_amount, employee:profiles!timesheets_employee_id_fkey(first_name, last_name)',
      )
      .is('clock_out_at', null)
      .order('clock_in_at', { ascending: false })
      .limit(10),
    supabase.from('timesheets').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const totalHours = (tsWeek.data ?? []).reduce((s, t) => s + (t.hours_worked ?? 0), 0);
  const totalCost = (tsWeek.data ?? []).reduce((s, t) => s + (t.pay_amount ?? 0), 0);

  return {
    totalHours,
    totalCost,
    onShift: (onShift.data ?? []) as unknown as TimesheetRow[],
    pendingApprovals: pendingApprovals.count ?? 0,
  };
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card">
      <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </div>
      <div
        className={`mt-md text-5xl font-black leading-none ${accent ? 'text-accent' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}

export default async function DashboardHome() {
  const data = await getDashboardData();

  return (
    <div className="space-y-2xl">
      <header>
        <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
        <p className="mt-sm text-text-secondary">This week at a glance.</p>
      </header>

      <div className="grid grid-cols-1 gap-xl md:grid-cols-3">
        <StatCard label="Hours this week" value={formatHours(data.totalHours)} />
        <StatCard label="Labor cost this week" value={formatCurrency(data.totalCost)} accent />
        <StatCard label="Pending approvals" value={String(data.pendingApprovals)} />
      </div>

      <section className="card">
        <div className="mb-lg flex items-baseline justify-between">
          <h2 className="text-xl font-bold">On shift now</h2>
          <span className="text-sm text-text-secondary">{data.onShift.length} people</span>
        </div>
        {data.onShift.length === 0 ? (
          <p className="text-text-secondary">Nobody clocked in right now.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {data.onShift.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-md">
                <div className="font-semibold">
                  {t.employee ? `${t.employee.first_name} ${t.employee.last_name}` : 'Unknown'}
                </div>
                <div className="text-sm text-text-secondary">
                  since {formatTime(t.clock_in_at)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid grid-cols-1 gap-xl md:grid-cols-2">
        <div className="card">
          <h3 className="mb-md text-lg font-bold">Quick actions</h3>
          <div className="flex flex-col gap-sm">
            <a href="/schedule" className="btn-primary w-full">Create a shift</a>
            <a href="/timesheets" className="btn-secondary w-full">Review timesheets</a>
            <a href="/payroll" className="btn-secondary w-full">Run payroll export</a>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-md text-lg font-bold">News</h3>
          <p className="text-sm text-text-secondary">
            Post to your team via the mobile app or the Communications tab.
          </p>
        </div>
      </section>
    </div>
  );
}
