import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { Shift, Area, Profile } from '../types';

export interface ShiftRow extends Shift {
  area: Area | null;
  employee: Profile | null;
}

interface Params {
  locationId?: string | null;
  employeeId?: string | null;
  rangeStart: Date;
  rangeEnd: Date;
}

export function useShifts({ locationId, employeeId, rangeStart, rangeEnd }: Params) {
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!locationId && !employeeId) {
      setShifts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase
      .from('shifts')
      .select('*, area:areas(*), employee:profiles!shifts_employee_id_fkey(*)')
      .gte('starts_at', rangeStart.toISOString())
      .lt('starts_at', rangeEnd.toISOString())
      .order('starts_at', { ascending: true });

    if (locationId) q = q.eq('location_id', locationId);
    if (employeeId) q = q.eq('employee_id', employeeId);

    const { data, error } = await q;
    if (error) setError(error.message);
    setShifts((data as unknown as ShiftRow[]) ?? []);
    setLoading(false);
  }, [locationId, employeeId, rangeStart.getTime(), rangeEnd.getTime()]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { shifts, loading, error, refresh };
}
