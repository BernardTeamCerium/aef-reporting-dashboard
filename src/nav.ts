import {
  CalendarCheck,
  LayoutDashboard,
  LifeBuoy,
  Printer,
  Sparkles,
  Star,
  TrendingUp,
  Users,
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
    to: '/reviews',
    label: 'Reviews',
    icon: Star,
    description: 'Collect reviews & testimonials',
  },
  {
    to: '/clients',
    label: 'Clients',
    icon: Users,
    description: 'Profiles, birthdays & greetings',
  },
  {
    to: '/services',
    label: 'Add-on Services',
    icon: Sparkles,
    description: 'Request additional services',
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
