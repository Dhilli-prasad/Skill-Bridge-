import type { CommunityAnswer, CommunityQuestion } from '../types/dashboard'

export const communityQuestions: CommunityQuestion[] = [
  {
    id: 'question-1',
    authorId: 'sana-iyer',
    authorName: 'Sana Iyer',
    title: 'How should I structure a reusable React form?',
    description: 'I am building several forms with the same validation patterns. What structure keeps field components reusable without hiding too much behavior?',
    category: 'Web Development',
    tags: ['React', 'Forms', 'TypeScript'],
    createdAt: '2026-11-06T12:00:00.000Z',
    updatedAt: '2026-11-06T12:00:00.000Z',
  },
  {
    id: 'question-2',
    authorId: 'arjun-mehta',
    authorName: 'Arjun Mehta',
    title: 'What is the best way to test a Python CLI?',
    description: 'I have a small Python command-line tool that reads a file and prints a report. Which testing boundaries have worked well for similar projects?',
    category: 'Python',
    tags: ['Python', 'Testing', 'CLI'],
    createdAt: '2026-11-04T09:10:00.000Z',
    updatedAt: '2026-11-04T09:10:00.000Z',
  },
]

export const communityAnswers: CommunityAnswer[] = [
  {
    id: 'answer-1',
    questionId: 'question-1',
    authorId: 'maya-patel',
    authorName: 'Maya Patel',
    content: 'Keep validation rules close to the field contract, then compose forms from small controlled pieces. Tests can cover the rules independently and the full form as a user flow.',
    createdAt: '2026-11-06T14:00:00.000Z',
    updatedAt: '2026-11-06T14:00:00.000Z',
  },
]
