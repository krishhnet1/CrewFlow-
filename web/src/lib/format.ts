export function formatCurrency(amount: number | null | undefined, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatHours(hours: number | null | undefined) {
  if (hours == null) return '—';
  return `${hours.toFixed(2)} h`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateRange(startISO: string, endISO: string) {
  return `${formatDate(startISO)} – ${formatDate(endISO)}`;
}

export function minutesBetween(startISO: string, endISO: string) {
  return Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000);
}

export function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfWeek(d = new Date()) {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return end;
}
