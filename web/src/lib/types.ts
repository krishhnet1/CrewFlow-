// TypeScript interfaces mirroring the Supabase schema (docs/02-database-schema.md).

export type UserRole = 'owner' | 'manager' | 'employee';
export type EmploymentType = 'hourly' | 'salaried';
export type ShiftStatus =
  | 'draft'
  | 'published'
  | 'locked'
  | 'offered'
  | 'claim_pending'
  | 'cancelled';
export type TimesheetStatus =
  | 'upcoming'
  | 'in_progress'
  | 'pending'
  | 'approved'
  | 'late'
  | 'discarded'
  | 'auto_closed'
  | 'paid';
export type DayType = 'weekday' | 'saturday' | 'sunday' | 'public_holiday';
export type ClockSource = 'qr' | 'kiosk' | 'phone_geofence' | 'manager_manual';
export type TradeStatus =
  | 'pending_claim'
  | 'claim_pending_approval'
  | 'approved'
  | 'denied'
  | 'cancelled';

export interface Organization {
  id: string;
  name: string;
  owner_user_id: string;
  overtime_threshold_hours: number;
  overtime_multiplier: number;
  pay_period: 'weekly' | 'biweekly' | 'semimonthly';
  currency: string;
  qr_signing_secret: string;
  allow_unscheduled_clock_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  employment_type: EmploymentType;
  avatar_color: string;
  pin_hash: string | null;
  pin_failed_attempts: number;
  pin_locked_until: string | null;
  rate_weekday: number | null;
  rate_saturday: number | null;
  rate_sunday: number | null;
  rate_public_holiday: number | null;
  salary_annual: number | null;
  primary_area_id: string | null;
  secondary_area_ids: string[];
  start_date: string | null;
  archived_at: string | null;
  expo_push_token: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  timezone: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  enforce_geofence_on_qr: boolean;
  qr_nonce: string | null;
  qr_nonce_date: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  location_id: string;
  name: string;
  color: string;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AreaTaskTemplate {
  id: string;
  area_id: string;
  title: string;
  sort_order: number;
  required: boolean;
  archived_at: string | null;
  created_at: string;
}

export type ShiftConfirmationStatus = 'unconfirmed' | 'confirmed' | 'declined';

export interface Shift {
  id: string;
  location_id: string;
  area_id: string;
  employee_id: string | null;
  original_employee_id: string | null;
  starts_at: string;
  ends_at: string;
  break_minutes: number;
  notes: string | null;
  status: ShiftStatus;
  published_at: string | null;
  confirmation_status: ShiftConfirmationStatus;
  confirmed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'declined' | 'cancelled';

export interface LeaveRequest {
  id: string;
  organization_id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  notes: string | null;
  status: LeaveStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAvailability {
  id: string;
  employee_id: string;
  day_of_week: number;
  available_from: string | null;
  available_to: string | null;
  is_unavailable: boolean;
  notes: string | null;
  created_at: string;
}

export interface PayAgreement {
  id: string;
  employee_id: string;
  effective_date: string;
  rate_weekday: number | null;
  rate_saturday: number | null;
  rate_sunday: number | null;
  rate_holiday: number | null;
  salary_annual: number | null;
  created_by: string;
  notes: string | null;
  created_at: string;
}

export interface MessageComment {
  id: string;
  message_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftTradeOffer {
  id: string;
  shift_id: string;
  offered_by: string;
  reason: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  status: TradeStatus;
  manager_decision_by: string | null;
  manager_decision_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  id: string;
  organization_id: string;
  location_id: string;
  area_id: string;
  employee_id: string;
  shift_id: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  break_minutes: number;
  clock_in_source: ClockSource;
  clock_out_source: ClockSource | null;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  device_reported_at: string | null;
  status: TimesheetStatus;
  auto_closed: boolean;
  hours_worked: number | null;
  pay_rate_applied: number | null;
  pay_amount: number | null;
  day_type: DayType | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_export_id: string | null;
  client_event_uuid: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  timesheet_id: string;
  task_template_id: string;
  title_snapshot: string;
  completed: boolean;
  completed_at: string | null;
  client_event_uuid: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  location_id: string;
  author_id: string;
  body: string;
  pinned: boolean;
  silent: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: '👍' | '👀' | '✅';
  created_at: string;
}

export interface Holiday {
  id: string;
  organization_id: string;
  name: string;
  observed_date: string;
  created_at: string;
}

export interface PayrollExport {
  id: string;
  organization_id: string;
  location_id: string | null;
  period_start: string;
  period_end: string;
  exported_by: string;
  format: 'csv' | 'pdf';
  file_path: string | null;
  total_hours: number | null;
  total_pay: number | null;
  created_at: string;
}

// Convenience composite types for joined queries.
export interface ShiftWithRelations extends Shift {
  area?: Area;
  employee?: Profile;
}

export interface TimesheetWithRelations extends Timesheet {
  employee?: Profile;
  area?: Area;
  shift?: Shift;
}

export interface MessageWithAuthor extends Message {
  author?: Profile;
  reactions?: MessageReaction[];
}
