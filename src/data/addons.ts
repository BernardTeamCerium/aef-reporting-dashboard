import {
  Bot,
  Clapperboard,
  GraduationCap,
  ListChecks,
  Mic,
  MapPin,
  MousePointerClick,
  Sparkles,
  UserPlus,
  Video,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export interface AddonService {
  id: string
  name: string
  description: string
  icon: LucideIcon
}

// The catalog of additional services an advisor can request. The team responds
// to each request with an invoice or by confirming company coverage.
export const addonCatalog: AddonService[] = [
  { id: 'podcast', name: 'Podcast Recording', description: 'Studio-quality podcast recording and editing to build your authority.', icon: Mic },
  { id: 'gbp', name: 'Google Business Profile & Optimization', description: 'Set up and optimize your Google Business Profile to win local search.', icon: MapPin },
  { id: 'citations', name: 'Citation Creation', description: 'Build accurate business citations across directories to boost local SEO.', icon: ListChecks },
  { id: 'ads', name: 'Search & Service Ads (Google Ads)', description: 'Managed Google Ads / AdWords campaigns to drive qualified leads.', icon: MousePointerClick },
  { id: 'crm', name: 'Automated CRM', description: 'Prospect & client CRM with automated follow-up and nurture sequences.', icon: Workflow },
  { id: 'ai-assistant', name: 'AI Assistant', description: 'An AI assistant that answers prospects and books appointments 24/7.', icon: Bot },
  { id: 'ai-listing', name: 'AI Business & Service Listing', description: 'Get listed and optimized across AI search and assistant platforms.', icon: Sparkles },
  { id: 'refer', name: 'Refer an Advisor', description: 'Refer another advisor to OneStop and earn rewards.', icon: UserPlus },
  { id: 'training', name: 'Team Training Platform', description: 'A training platform to onboard and upskill your team.', icon: GraduationCap },
  { id: 'video', name: 'Video Content Recording', description: 'Professional video content recording for social and web.', icon: Video },
  { id: 'commercial', name: 'Commercial Production', description: 'Full commercial production — concept, filming, and editing.', icon: Clapperboard },
]
