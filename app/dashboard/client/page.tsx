import { Card, Shell } from '@/components/ui';
import { CampaignPerformanceChart, LeadSourceChart, MonthlyTrendChart } from '@/components/charts';

export default function ClientDashboard() {
  return (
    <Shell title="Client Dashboard">
      <section className="grid gap-4 md:grid-cols-4">
        <Card title="Total Leads" value="412" />
        <Card title="Total Ad Spend" value="$21,750" />
        <Card title="Cost Per Lead" value="$52.79" />
        <Card title="Appointments Set" value="96" />
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 text-navy shadow-executive"><h2 className="mb-4 text-lg font-semibold">Lead Source Breakdown</h2><LeadSourceChart /></div>
        <div className="rounded-2xl bg-white p-6 text-navy shadow-executive"><h2 className="mb-4 text-lg font-semibold">Campaign Performance</h2><CampaignPerformanceChart /></div>
        <div className="rounded-2xl bg-white p-6 text-navy shadow-executive"><h2 className="mb-4 text-lg font-semibold">Monthly Trends</h2><MonthlyTrendChart /></div>
      </section>
    </Shell>
  );
}
