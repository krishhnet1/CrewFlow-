import { PayrollClient } from './PayrollClient';

export default function PayrollPage() {
  return (
    <div className="space-y-xl">
      <header>
        <h1 className="text-4xl font-black tracking-tight">Payroll</h1>
        <p className="mt-sm text-text-secondary">Pick a date range and export to CSV.</p>
      </header>
      <PayrollClient />
    </div>
  );
}
