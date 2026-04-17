import { createClient } from '@/lib/supabase/server';
import { startOfWeek, formatTime } from '@/lib/format';

type Area = { id: string; name: string; color: string; sort_order: number };
type Shift = {
  id: string;
  area_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  confirmation_status: string | null;
  employee: { first_name: string; last_name: string } | null;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function getSchedule() {
  const supabase = await createClient();
  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [areas, shifts] = await Promise.all([
    supabase.from('areas').select('id, name, color, sort_order').order('sort_order'),
    supabase
      .from('shifts')
      .select(
        'id, area_id, starts_at, ends_at, status, confirmation_status, employee:profiles!shifts_employee_id_fkey(first_name, last_name)',
      )
      .gte('starts_at', weekStart.toISOString())
      .lt('starts_at', weekEnd.toISOString())
      .order('starts_at'),
  ]);

  return {
    weekStart,
    areas: (areas.data ?? []) as Area[],
    shifts: (shifts.data ?? []) as unknown as Shift[],
  };
}

export default async function SchedulePage() {
  const { weekStart, areas, shifts } = await getSchedule();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const shiftsByAreaAndDay = new Map<string, Shift[]>();
  for (const s of shifts) {
    const day = new Date(s.starts_at).getDay();
    const key = `${s.area_id}-${day}`;
    const arr = shiftsByAreaAndDay.get(key) ?? [];
    arr.push(s);
    shiftsByAreaAndDay.set(key, arr);
  }

  return (
    <div className="space-y-xl">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Schedule</h1>
          <p className="mt-sm text-text-secondary">
            Week of{' '}
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-sm">
          <button className="btn-secondary">Previous</button>
          <button className="btn-secondary">Next</button>
          <button className="btn-primary">Publish all</button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-card border border-border-subtle bg-bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="w-40 p-md text-left table-head">Area</th>
              {days.map((d, i) => (
                <th key={i} className="p-md text-left table-head">
                  <div>{DAYS[i]}</div>
                  <div className="text-sm font-semibold normal-case tracking-normal text-text-primary">
                    {d.getDate()}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.id} className="border-b border-border-subtle">
                <td className="p-md align-top">
                  <span
                    className="inline-block h-2 w-2 rounded-full mr-sm align-middle"
                    style={{ background: area.color }}
                  />
                  <span className="font-semibold">{area.name}</span>
                </td>
                {days.map((_, dayIdx) => {
                  const cellShifts = shiftsByAreaAndDay.get(`${area.id}-${dayIdx}`) ?? [];
                  return (
                    <td
                      key={dayIdx}
                      className="h-28 min-w-[130px] p-sm align-top hover:bg-bg-elevated cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col gap-xs">
                        {cellShifts.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-btn border-l-2 bg-bg-elevated px-sm py-xs text-xs"
                            style={{ borderLeftColor: area.color }}
                          >
                            <div className="font-semibold">
                              {formatTime(s.starts_at)}–{formatTime(s.ends_at)}
                            </div>
                            <div className="text-text-secondary truncate">
                              {s.employee
                                ? `${s.employee.first_name} ${s.employee.last_name}`
                                : 'Open'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {areas.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-4xl text-center text-text-secondary"
                >
                  No areas yet. Add one in Settings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
