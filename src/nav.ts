import {
  CalendarCheck,
  LayoutDashboard,
  LifeBuoy,
  Printer,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  description: string
}

export const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Traffic, appointments & leads',
  },
  {
    to: '/content',
    label: 'Content Approvals',
    icon: CalendarCheck,
    description: 'Review upcoming posts',
  },
  {
    to: '/print',
    label: 'Print Orders',
    icon: Printer,
    description: 'Order materials & track jobs',
  },
  {
    to: '/seo',
    label: 'SEO & Keywords',
    icon: TrendingUp,
    description: 'Search visibility & rankings',
  },
  {
    to: '/support',
    label: 'Support',
    icon: LifeBuoy,
    description: 'Request help from your team',
  },
]
