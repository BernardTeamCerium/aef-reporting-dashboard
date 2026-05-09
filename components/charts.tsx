'use client';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

const colors = ['#d4af37', '#1f3c88', '#2f5fb3', '#8ba4d9'];

export function LeadSourceChart() {
  const data = [{ name: 'Meta', value: 44 }, { name: 'Google', value: 30 }, { name: 'Referral', value: 16 }, { name: 'Organic', value: 10 }];
  return <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>{data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>;
}

export function CampaignPerformanceChart() {
  const data = [{ campaign: 'Retirement', leads: 112 }, { campaign: 'Annuity', leads: 86 }, { campaign: 'Tax Shield', leads: 74 }];
  return <ResponsiveContainer width="100%" height={260}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="campaign" /><YAxis /><Tooltip /><Bar dataKey="leads" fill="#d4af37" /></BarChart></ResponsiveContainer>;
}

export function MonthlyTrendChart() {
  const data = [{ month: 'Jan', leads: 110 }, { month: 'Feb', leads: 125 }, { month: 'Mar', leads: 139 }, { month: 'Apr', leads: 160 }];
  return <ResponsiveContainer width="100%" height={260}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="leads" stroke="#d4af37" strokeWidth={3} /></LineChart></ResponsiveContainer>;
}
