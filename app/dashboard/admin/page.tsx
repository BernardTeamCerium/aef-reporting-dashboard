import { Card, Shell } from '@/components/ui';
import { CampaignPerformanceChart, LeadSourceChart, MonthlyTrendChart } from '@/components/charts';

export default function AdminDashboard() {
  return (
    <Shell title="Admin Dashboard">
      <section className="grid gap-4 md:grid-cols-5">
        <Card title="Total Leads" value="412" />
        <Card title="Total Ad Spend" value="$21,750" />
        <Card title="Cost Per Lead" value="$52.79" />
        <Card title="Appointments Set" value="96" />
        <Card title="Client Billing" value="$34,200" />
        <Card title="Actual Ad Spend" value="$20,980" />
        <Card title="Vendor Costs" value="$2,430" />
        <Card title="Internal Labor" value="$4,850" />
        <Card title="Software Costs" value="$980" />
        <Card title="Gross Profit" value="$13,220" />
        <Card title="Net Profit" value="$8,370" />
        <Card title="Profit Margin" value="24.5%" />
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 text-navy shadow-executive"><h2 className="mb-4 text-lg font-semibold">Lead Source Breakdown</h2><LeadSourceChart /></div>
        <div className="rounded-2xl bg-white p-6 text-navy shadow-executive"><h2 className="mb-4 text-lg font-semibold">Campaign Performance</h2><CampaignPerformanceChart /></div>
        <div className="rounded-2xl bg-white p-6 text-navy shadow-executive"><h2 className="mb-4 text-lg font-semibold">Monthly Trends</h2><MonthlyTrendChart /></div>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 text-navy shadow-executive"><h2 className="text-lg font-semibold">Campaign Notes</h2><p className="mt-3 text-sm text-slate-600">High intent leads from retirement campaign. Increase budget by 15% next month.</p></div>
        <div className="rounded-2xl bg-white p-6 text-navy shadow-executive"><h2 className="text-lg font-semibold">Project Status Tracker</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700"><li>Creative refresh: In review</li><li>Landing page v2: Deployed</li><li>Call center script update: Scheduled</li></ul></div>
      </section>
    </Shell>
  );
}
