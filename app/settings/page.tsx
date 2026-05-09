import { Shell } from '@/components/ui';

export default function SettingsPage() {
  return (
    <Shell title="Settings">
      <div className="rounded-2xl bg-white p-6 text-navy shadow-executive">
        <p className="text-sm text-slate-600">Configure account preferences, report cadence, and role-based access mappings.</p>
      </div>
    </Shell>
  );
}
