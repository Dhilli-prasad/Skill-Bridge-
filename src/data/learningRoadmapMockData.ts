import type { LearningRoadmap } from '../types/dashboard'

const milestone = (id: string, title: string, description: string, topics: string[], duration: string, relatedPathId: string, relatedLessonId: string) => ({ id, title, description, topics, duration, relatedPathId, relatedLessonId })

export const learningRoadmaps: LearningRoadmap[] = [
  {
    id: 'aws-cloud-developer-roadmap',
    title: 'AWS Cloud Developer Roadmap',
    description: 'Move from cloud fundamentals to building observable, reliable cloud applications.',
    difficulty: 'Intermediate',
    duration: '12 weeks',
    createdAt: '2026-10-14',
    milestones: [
      milestone('aws-roadmap-foundations', 'Understand cloud foundations', 'Learn the vocabulary and responsibility model behind cloud systems.', ['Cloud concepts', 'Shared responsibility'], '2 weeks', 'aws-cloud-fundamentals', 'aws-cloud-model'),
      milestone('aws-roadmap-services', 'Choose core services', 'Map a small workload to suitable compute, storage, and reliability choices.', ['AWS services', 'Architecture', 'Reliability'], '4 weeks', 'aws-cloud-fundamentals', 'aws-compute-storage'),
      milestone('aws-roadmap-observability', 'Design for operations', 'Use ownership, cost, and observability questions to improve a cloud design.', ['Observability', 'Cost awareness'], '6 weeks', 'aws-cloud-fundamentals', 'aws-cost-reliability'),
    ],
  },
  {
    id: 'full-stack-developer-roadmap',
    title: 'Full-Stack Developer Roadmap',
    description: 'Build a practical progression from accessible interfaces to tested full-stack workflows.',
    difficulty: 'Intermediate',
    duration: '16 weeks',
    createdAt: '2026-10-11',
    milestones: [
      milestone('fullstack-roadmap-ui', 'Build accessible interfaces', 'Create reusable components with clear contracts and keyboard-friendly states.', ['React', 'Accessibility', 'TypeScript'], '5 weeks', 'full-stack-web-development', 'fullstack-components'),
      milestone('fullstack-roadmap-data', 'Connect application data', 'Structure API boundaries and keep persistence logic testable.', ['APIs', 'Data flow', 'Services'], '5 weeks', 'full-stack-web-development', 'fullstack-api'),
      milestone('fullstack-roadmap-quality', 'Test and ship workflows', 'Verify the user journey and make delivery behavior predictable.', ['Testing', 'Deployment'], '6 weeks', 'full-stack-web-development', 'fullstack-testing'),
    ],
  },
  {
    id: 'python-developer-roadmap',
    title: 'Python Developer Roadmap',
    description: 'Progress from Python building blocks to dependable automation and tested scripts.',
    difficulty: 'Beginner',
    duration: '12 weeks',
    createdAt: '2026-10-09',
    milestones: [
      milestone('python-roadmap-basics', 'Master Python building blocks', 'Practice focused functions, names, and common collections.', ['Python', 'Functions', 'Collections'], '4 weeks', 'python-programming', 'python-functions'),
      milestone('python-roadmap-automation', 'Automate a practical task', 'Separate file input, transformation, and output into clear boundaries.', ['Automation', 'Files', 'Data handling'], '4 weeks', 'python-programming', 'python-files'),
      milestone('python-roadmap-testing', 'Protect your script', 'Use small tests to make normal and failure behavior trustworthy.', ['Testing', 'Debugging'], '4 weeks', 'python-programming', 'python-tests'),
    ],
  },
  {
    id: 'data-structures-algorithms-roadmap',
    title: 'Data Structures and Algorithms Roadmap',
    description: 'Develop systematic problem-solving habits through structures, complexity, and search patterns.',
    difficulty: 'Intermediate',
    duration: '12 weeks',
    createdAt: '2026-10-06',
    milestones: [
      milestone('dsa-roadmap-structures', 'Select core structures', 'Compare arrays, maps, stacks, and queues by their operations.', ['Data structures', 'Tradeoffs'], '4 weeks', 'data-structures-algorithms', 'dsa-arrays'),
      milestone('dsa-roadmap-complexity', 'Reason about complexity', 'Describe how time and space change as input grows.', ['Big-O', 'Analysis'], '4 weeks', 'data-structures-algorithms', 'dsa-complexity'),
      milestone('dsa-roadmap-search', 'Apply search patterns', 'Turn assumptions into a systematic search strategy.', ['Searching', 'Problem solving'], '4 weeks', 'data-structures-algorithms', 'dsa-search'),
    ],
  },
]
