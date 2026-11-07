import type { LearningPath } from '../types/dashboard'

const module = (id: string, title: string, description: string, lessons: Array<[string, string, string, string]>) => ({
  id,
  title,
  description,
  lessons: lessons.map(([lessonId, lessonTitle, lessonDescription, material]) => ({ id: lessonId, title: lessonTitle, description: lessonDescription, material, duration: '25 min' })),
})

export const learningPaths: LearningPath[] = [
  {
    id: 'aws-cloud-fundamentals',
    title: 'AWS Cloud Fundamentals',
    description: 'Build a practical foundation in cloud concepts, core AWS services, and responsible architecture decisions.',
    difficulty: 'Beginner',
    duration: '6 weeks',
    tags: ['AWS', 'Cloud', 'Architecture'],
    objectives: ['Explain core cloud concepts', 'Choose suitable AWS services for small systems', 'Describe basic reliability and cost considerations'],
    prerequisites: ['Comfort using a web browser', 'Basic command-line familiarity is helpful'],
    createdAt: '2026-10-12',
    modules: [
      module('aws-foundations', 'Cloud foundations', 'Understand the vocabulary and shared responsibility model.', [['aws-cloud-model', 'The cloud model', 'Compare on-premises and cloud delivery models.', 'Cloud computing shifts infrastructure decisions toward flexible, measured services.'], ['aws-shared-responsibility', 'Shared responsibility', 'Learn how responsibilities are divided between AWS and customers.', 'Security and reliability improve when each responsibility has a clear owner.']]),
      module('aws-services', 'Core services', 'Map common workloads to foundational AWS services.', [['aws-compute-storage', 'Compute and storage choices', 'Recognize common compute and storage building blocks.', 'Start with the workload, then choose the smallest service that meets its needs.'], ['aws-cost-reliability', 'Cost and reliability basics', 'Use simple questions to guide safer cloud decisions.', 'Define failure modes, ownership, observability, and cost expectations before adding services.']]),
    ],
  },
  {
    id: 'full-stack-web-development',
    title: 'Full-Stack Web Development',
    description: 'Learn how frontend interfaces, APIs, databases, testing, and deployment fit together in a modern web app.',
    difficulty: 'Intermediate',
    duration: '10 weeks',
    tags: ['React', 'TypeScript', 'APIs'],
    objectives: ['Design a small full-stack feature', 'Connect an accessible UI to an API', 'Test and deploy a web workflow'],
    prerequisites: ['HTML and CSS basics', 'Comfort with JavaScript fundamentals'],
    createdAt: '2026-10-10',
    modules: [
      module('fullstack-ui', 'Interface foundations', 'Build clear, reusable interface components.', [['fullstack-components', 'Component contracts', 'Make component inputs and states explicit.', 'Small contracts make interfaces easier to reuse, test, and evolve.'], ['fullstack-accessibility', 'Accessible interactions', 'Apply labels, focus states, and keyboard-friendly controls.', 'Accessibility is part of the component default, not a final polish step.']]),
      module('fullstack-data', 'Data and delivery', 'Connect a feature to data and verify the user journey.', [['fullstack-api', 'API boundaries', 'Choose a clear boundary between UI and service logic.', 'Keep data fetching and persistence behind small, testable service functions.'], ['fullstack-testing', 'Test the workflow', 'Cover the important behavior from the user perspective.', 'A focused test should verify the measurable outcome, not implementation details.']]),
    ],
  },
  {
    id: 'python-programming',
    title: 'Python Programming',
    description: 'Strengthen Python fundamentals through readable programs, automation exercises, and practical problem solving.',
    difficulty: 'Beginner',
    duration: '8 weeks',
    tags: ['Python', 'Automation', 'Testing'],
    objectives: ['Write readable Python functions', 'Work with collections and files', 'Test a small automation script'],
    prerequisites: ['No prior Python experience required', 'A willingness to practice regularly'],
    createdAt: '2026-10-08',
    modules: [
      module('python-basics', 'Python building blocks', 'Practice expressions, functions, and readable control flow.', [['python-functions', 'Functions and names', 'Use functions to make intent and reuse visible.', 'A good function has a focused responsibility and a name that communicates the result.'], ['python-collections', 'Collections', 'Choose lists, dictionaries, and sets for common tasks.', 'Use the collection that best matches the relationship your data needs.']]),
      module('python-practice', 'Practical automation', 'Turn a small repeatable task into a dependable script.', [['python-files', 'Files and boundaries', 'Read input and keep file handling explicit.', 'Separate parsing, transformation, and output so each boundary can be tested.'], ['python-tests', 'Testing the script', 'Protect behavior with small, useful tests.', 'Test normal input and one meaningful failure case before expanding scope.']]),
    ],
  },
  {
    id: 'data-structures-algorithms',
    title: 'Data Structures and Algorithms',
    description: 'Practice core data structures and algorithmic thinking with approachable explanations and implementation exercises.',
    difficulty: 'Intermediate',
    duration: '8 weeks',
    tags: ['Algorithms', 'Problem solving', 'Computer science'],
    objectives: ['Select appropriate data structures', 'Describe time and space tradeoffs', 'Solve small problems systematically'],
    prerequisites: ['Basic programming in any language', 'Comfort reading simple pseudocode'],
    createdAt: '2026-10-05',
    modules: [
      module('dsa-structures', 'Core structures', 'Understand how common structures organize data.', [['dsa-arrays', 'Arrays and maps', 'Compare indexed access with key-based lookup.', 'Choose structures by the operations your feature performs most often.'], ['dsa-stacks-queues', 'Stacks and queues', 'Model ordered work with two simple structures.', 'Stacks emphasize the most recent item; queues emphasize the oldest waiting item.']]),
      module('dsa-strategy', 'Problem-solving strategy', 'Break problems down before optimizing them.', [['dsa-complexity', 'Complexity basics', 'Estimate how work changes as input grows.', 'Big-O is a communication tool for comparing growth, not a substitute for measurement.'], ['dsa-search', 'Search patterns', 'Apply a systematic approach to finding a result.', 'Clarify the input assumptions before selecting a linear or binary search.']]),
    ],
  },
]
