import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Timesheet, Shift, Profile, Area } from '../types';

interface TeamMemberStatus {
  profile: Profile;
  area: Area | null;
  state: 'on_shift' | 'late' | 'scheduled' | 'off';
  shift: Shift | null;
  timesheet: Timesheet | null;
}

interface Summary {
  onShift: number;
  late: number;
  scheduled: number;
  members: TeamMemberStatus[];
}

export function useTeamStatus(locationId: string | null | undefined) {
  const [summary, setSummary] = useState<Summary>({
    onShift: 0,
    late: 0,
    scheduled: 0,
    members: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!locationId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [{ data: openTs }, { data: todayShifts }] = await Promise.all([
      supabase
        .from('timesheets')
        .select('*, employee:profiles!timesheets_employee_id_fkey(*), area:areas(*)')
        .eq('location_id', locationId)
        .is('clock_out_at', null),
      supabase
        .from('shifts')
        .select('*, employee:profiles!shifts_employee_id_fkey(*), area:areas(*)')
        .eq('location_id', locationId)
        .gte('starts_at', dayStart.toISOString())
        .lt('starts_at', dayEnd.toISOString())
        .in('status', ['published', 'locked']),
    ]);

    const now = Date.now();
    const members: TeamMemberStatus[] = [];
    const onTsEmployeeIds = new Set<string>();

    (openTs ?? []).forEach((t: any) => {
      if (!t.employee) return;
      onTsEmployeeIds.add(t.employee.id);
      members.push({
        profile: t.employee,
        area: t.area,
        state: 'on_shift',
        shift: null,
        timesheet: t,
      });
    });

    (todayShifts ?? []).forEach((s: any) => {
      if (!s.employee) return;
      if (onTsEmployeeIds.has(s.employee.id)) return;
      const startMs = new Date(s.starts_at).getTime();
      const late = now > startMs + 5 * 60_000;
      members.push({
        profile: s.employee,
        area: s.area,
        state: late ? 'late' : 'scheduled',
        shift: s,
        timesheet: null,
      });
    });

    setSummary({
      onShift: members.filter((m) => m.state === 'on_shift').length,
      late: members.filter((m) => m.state === 'late').length,
      scheduled: members.filter((m) => m.state === 'scheduled').length,
      members,
    });
    setLoading(false);
  }, [locationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...summary, loading, refresh };
}
