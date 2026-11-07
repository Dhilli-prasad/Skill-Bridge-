import { useEffect, useState } from 'react'
import {
  DEMO_USER_ID,
  getMemberships,
  joinCircle,
  leaveCircle,
  MEMBERSHIP_CHANGED_EVENT,
} from '../services/circleMembership'
import type { CircleMembership, LearningCircle } from '../types/dashboard'

export function useCircleMemberships() {
  const [memberships, setMemberships] = useState<CircleMembership[]>(() => getMemberships(DEMO_USER_ID))

  useEffect(() => {
    const refresh = () => setMemberships(getMemberships(DEMO_USER_ID))
    window.addEventListener(MEMBERSHIP_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(MEMBERSHIP_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return {
    memberships,
    join: (circle: LearningCircle) => joinCircle(circle),
    leave: (circle: LearningCircle) => leaveCircle(circle),
  }
}
