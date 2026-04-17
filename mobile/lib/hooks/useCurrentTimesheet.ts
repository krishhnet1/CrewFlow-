import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { Timesheet } from '../types';

// Returns the current open timesheet (no clock_out) for the employee, if any.
export function useCurrentTimesheet(employeeId: string | null | undefined) {
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!employeeId) {
      setTimesheet(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('timesheets')
      .select('*')
      .eq('employee_id', employeeId)
      .is('clock_out_at', null)
      .order('clock_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setTimesheet((data as unknown as Timesheet) ?? null);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clockIn = useCallback(
    async (args: { locationId: string; areaId: string; organizationId: string }) => {
      if (!employeeId) throw new Error('no employee');
      const { error } = await supabase.from('timesheets').insert({
        organization_id: args.organizationId,
        location_id: args.locationId,
        area_id: args.areaId,
        employee_id: employeeId,
        clock_in_at: new Date().toISOString(),
        clock_in_source: 'phone_geofence',
        status: 'in_progress',
      });
      if (error) throw error;
      await refresh();
    },
    [employeeId, refresh]
  );

  const clockOut = useCallback(async () => {
    if (!timesheet) return;
    const { error } = await supabase
      .from('timesheets')
      .update({
        clock_out_at: new Date().toISOString(),
        clock_out_source: 'phone_geofence',
        status: 'pending',
      })
      .eq('id', timesheet.id);
    if (error) throw error;
    await refresh();
  }, [timesheet, refresh]);

  return { timesheet, loading, refresh, clockIn, clockOut };
}
