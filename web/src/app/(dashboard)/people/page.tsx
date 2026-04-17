import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/format';

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: 'owner' | 'manager' | 'employee';
  rate_weekday: number | null;
  avatar_color: string;
  primary_area_id: string | null;
  archived_at: string | null;
};

async function getPeople() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: areas }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, first_name, last_name, email, phone, role, rate_weekday, avatar_color, primary_area_id, archived_at',
      )
      .is('archived_at', null)
      .order('first_name'),
    supabase.from('areas').select('id, name'),
  ]);
  const areaMap = new Map((areas ?? []).map((a) => [a.id, a.name]));
  return { profiles: (profiles ?? []) as Row[], areaMap };
}

export default async function PeoplePage() {
  const { profiles, areaMap } = await getPeople();

  return (
    <div className="space-y-xl">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">People</h1>
          <p className="mt-sm text-text-secondary">{profiles.length} team members</p>
        </div>
        <button className="btn-primary">Add employee</button>
      </header>

      <div className="overflow-hidden rounded-card border border-border-subtle bg-bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="p-lg text-left table-head">Name</th>
              <th className="p-lg text-left table-head">Role</th>
              <th className="p-lg text-left table-head">Email</th>
              <th className="p-lg text-left table-head">Phone</th>
              <th className="p-lg text-left table-head">Primary area</th>
              <th className="p-lg text-right table-head">Weekday rate</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors"
              >
                <td className="p-lg">
                  <div className="flex items-center gap-md">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: p.avatar_color, color: '#0B0F1A' }}
                    >
                      {p.first_name[0]}
                      {p.last_name[0]}
                    </div>
                    <span className="font-semibold">
                      {p.first_name} {p.last_name}
                    </span>
                  </div>
                </td>
                <td className="p-lg">
                  <span
                    className={`badge ${
                      p.role === 'owner'
                        ? 'badge-warning'
                        : p.role === 'manager'
                        ? 'badge-info'
                        : 'badge-success'
                    }`}
                  >
                    {p.role}
                  </span>
                </td>
                <td className="p-lg text-text-secondary">{p.email ?? '—'}</td>
                <td className="p-lg text-text-secondary">{p.phone ?? '—'}</td>
                <td className="p-lg text-text-secondary">
                  {p.primary_area_id ? areaMap.get(p.primary_area_id) ?? '—' : '—'}
                </td>
                <td className="p-lg text-right font-semibold">
                  {formatCurrency(p.rate_weekday)}
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4xl text-center text-text-secondary">
                  No team members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
