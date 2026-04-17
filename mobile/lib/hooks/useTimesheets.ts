import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { Timesheet, Profile, Area, TimesheetStatus } from '../types';

export interface TimesheetRow extends Timesheet {
  employee: Profile | null;
  area: Area | null;
}

interface Params {
  organizationId?: string | null;
  employeeId?: string | null;
  status?: TimesheetStatus | 'all' | 'pending';
  limit?: number;
}

export function useTimesheets({ organizationId, employeeId, status = 'all', limit = 100 }: Params) {
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!organizationId && !employeeId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase
      .from('timesheets')
      .select('*, employee:profiles!timesheets_employee_id_fkey(*), area:areas(*)')
      .order('clock_in_at', { ascending: false })
      .limit(limit);
    if (organizationId) q = q.eq('organization_id', organizationId);
    if (employeeId) q = q.eq('employee_id', employeeId);
    if (status !== 'all') q = q.eq('status', status);

    const { data, error } = await q;
    if (error) setError(error.message);
    setRows((data as unknown as TimesheetRow[]) ?? []);
    setLoading(false);
  }, [organizationId, employeeId, status, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const approve = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('timesheets')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  return { timesheets: rows, loading, error, refresh, approve };
}
