import { useEffect, useState } from 'react'
import { getCircleTasks, TASKS_CHANGED_EVENT } from '../services/circleTaskService'
import type { CircleTask } from '../types/dashboard'

export function useCircleTasks(circleId: string): CircleTask[] {
  const [tasks, setTasks] = useState(() => getCircleTasks(circleId))

  useEffect(() => {
    const refresh = () => setTasks(getCircleTasks(circleId))
    window.addEventListener(TASKS_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(TASKS_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [circleId])

  return tasks
}
