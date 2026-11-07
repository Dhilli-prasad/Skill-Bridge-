import type { CircleDiscussionComment, CircleDiscussionPost } from '../types/dashboard'

export const demoDiscussionPosts: CircleDiscussionPost[] = [
  {
    id: 'post-frontend-welcome',
    circleId: 'frontend-foundry',
    authorId: 'owner-frontend-foundry',
    authorName: 'Maya Patel',
    authorRole: 'Owner',
    title: 'Welcome to our next shipping sprint',
    content: 'Let us share one small interface improvement each week and give thoughtful feedback along the way.',
    type: 'Announcement',
    createdAt: '2026-11-04T10:00:00.000Z',
    pinned: true,
  },
  {
    id: 'post-python-testing',
    circleId: 'python-practice-lab',
    authorId: 'member-meera',
    authorName: 'Meera Joshi',
    authorRole: 'Moderator',
    title: 'What is your favorite way to test Python code?',
    content: 'I am comparing pytest fixtures with a simpler setup for our practice exercises. What works well for you?',
    type: 'Question',
    createdAt: '2026-11-03T14:30:00.000Z',
    pinned: false,
  },
  {
    id: 'post-cloud-notes',
    circleId: 'cloud-launchpad',
    authorId: 'member-anika',
    authorName: 'Anika Roy',
    authorRole: 'Moderator',
    title: 'Serverless architecture notes',
    content: 'I added a short checklist for choosing between Lambda, Step Functions, and EventBridge for our project.',
    type: 'Discussion',
    createdAt: '2026-11-01T09:15:00.000Z',
    pinned: false,
  },
]

export const demoDiscussionComments: CircleDiscussionComment[] = [
  {
    id: 'comment-frontend-welcome',
    postId: 'post-frontend-welcome',
    circleId: 'frontend-foundry',
    authorId: 'member-jay',
    authorName: 'Jay Shah',
    content: 'Excited to ship together. I will bring an accessibility checklist to the first review.',
    createdAt: '2026-11-04T12:15:00.000Z',
  },
  {
    id: 'comment-python-testing',
    postId: 'post-python-testing',
    circleId: 'python-practice-lab',
    authorId: 'member-vikram',
    authorName: 'Vikram Rao',
    content: 'Pytest fixtures have helped me keep the exercises focused and readable.',
    createdAt: '2026-11-03T16:00:00.000Z',
  },
]
