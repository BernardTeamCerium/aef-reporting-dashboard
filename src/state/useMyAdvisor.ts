import { useAdvisors, type AdvisorAccount } from './Advisors'
import { useAuth } from './Auth'

/**
 * The advisor record for the signed-in advisor, matched by email. Falls back to
 * the flagship demo advisor so the advisor experience always has data to show.
 */
export function useMyAdvisor(): AdvisorAccount | undefined {
  const { advisors } = useAdvisors()
  const { user } = useAuth()
  return (
    advisors.find((a) => user?.email && a.email.toLowerCase() === user.email.toLowerCase()) ??
    advisors.find((a) => a.id === 'adv-frazier')
  )
}
