import { useState } from 'react'
import { learningCircles } from '../data/mockData'
import { getCreatedLearningCircles } from '../services/circleStorage'
import type { LearningCircle } from '../types/dashboard'

export function useLearningCircles(): LearningCircle[] {
  const [circles] = useState(() => [...learningCircles, ...getCreatedLearningCircles()])
  return circles
}
