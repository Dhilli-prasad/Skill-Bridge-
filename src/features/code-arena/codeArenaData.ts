export type ArenaDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type ArenaLanguage = 'Python' | 'JavaScript' | 'Java'
export type ArenaCategory = 'Python' | 'JavaScript' | 'Java' | 'Data Structures & Algorithms'

export interface ArenaExample { input: string; output: string }
export interface ArenaTestCase { input: string; expected: string }
export interface ArenaChallenge {
  id: string
  title: string
  description: string
  difficulty: ArenaDifficulty
  category: ArenaCategory
  language: ArenaLanguage
  points: number
  estimatedMinutes: number
  problemStatement: string
  examples: ArenaExample[]
  constraints: string[]
  hints: string[]
  testCases: ArenaTestCase[]
  starterCode: string
  demoChecks: string[]
  featured?: boolean
}

export const arenaChallenges: ArenaChallenge[] = [
  {
    id: 'python-balanced-brackets', title: 'Balanced Brackets',
    description: 'Use a stack to check whether every opening bracket is closed in the correct order.',
    difficulty: 'Beginner', category: 'Python', language: 'Python', points: 80, estimatedMinutes: 20, featured: true,
    problemStatement: 'Given a string containing (), {}, and [], return true when the brackets are balanced and false otherwise.',
    examples: [{ input: '"{[()]}"', output: 'true' }, { input: '"([)]"', output: 'false' }],
    constraints: ['1 ≤ length of input ≤ 10,000', 'Input contains only brackets and spaces'],
    hints: ['Keep opening brackets in a stack.', 'A closing bracket must match the most recent opening bracket.'],
    testCases: [{ input: '"{[()]}"', expected: 'true' }, { input: '"([)]"', expected: 'false' }, { input: '""', expected: 'true' }],
    starterCode: 'def is_balanced(value):\n    # Return True when all brackets are correctly paired.\n    pass\n',
    demoChecks: ['stack', 'return True'],
  },
  {
    id: 'js-frequency-counter', title: 'First Unique Character',
    description: 'Find the first character that appears exactly once in a string.',
    difficulty: 'Beginner', category: 'JavaScript', language: 'JavaScript', points: 90, estimatedMinutes: 25, featured: true,
    problemStatement: 'Return the index of the first non-repeating character. Return -1 when every character repeats.',
    examples: [{ input: '"swiss"', output: '1' }, { input: '"aabb"', output: '-1' }],
    constraints: ['1 ≤ string length ≤ 100,000', 'Characters are lowercase English letters'],
    hints: ['Count every character before looking for the answer.', 'Make a second pass and return the first count of one.'],
    testCases: [{ input: '"swiss"', expected: '1' }, { input: '"aabb"', expected: '-1' }, { input: '"coding"', expected: '0' }],
    starterCode: 'function firstUniqueCharacter(value) {\n  // Return the index of the first non-repeating character.\n  return -1;\n}\n',
    demoChecks: ['Map', 'return index'],
  },
  {
    id: 'java-merge-intervals', title: 'Merge Meeting Times',
    description: 'Combine overlapping meeting intervals into a compact schedule.',
    difficulty: 'Intermediate', category: 'Java', language: 'Java', points: 140, estimatedMinutes: 35, featured: true,
    problemStatement: 'Given intervals represented by start and end times, merge all overlapping intervals and return them sorted by start time.',
    examples: [{ input: '[[1,3],[2,6],[8,10]]', output: '[[1,6],[8,10]]' }, { input: '[[1,4],[4,5]]', output: '[[1,5]]' }],
    constraints: ['1 ≤ number of intervals ≤ 10,000', 'Start and end values are integers from 0 to 1,000,000'],
    hints: ['Sort by each interval\'s start.', 'Compare the next start with the end of the last merged interval.'],
    testCases: [{ input: '[[1,3],[2,6],[8,10]]', expected: '[[1,6],[8,10]]' }, { input: '[[1,4],[4,5]]', expected: '[[1,5]]' }],
    starterCode: 'public int[][] merge(int[][] intervals) {\n    // Return the merged intervals in sorted order.\n    return intervals;\n}\n',
    demoChecks: ['Arrays.sort', 'new int'],
  },
  {
    id: 'python-two-sum', title: 'Pair Sum Lookup',
    description: 'Return the indices of two values that add up to a target in one pass.',
    difficulty: 'Beginner', category: 'Data Structures & Algorithms', language: 'Python', points: 100, estimatedMinutes: 25,
    problemStatement: 'Given an integer array and a target, return the two distinct indices whose values add up to the target.',
    examples: [{ input: '[2, 7, 11, 15], target = 9', output: '[0, 1]' }, { input: '[3, 2, 4], target = 6', output: '[1, 2]' }],
    constraints: ['2 ≤ array length ≤ 10,000', 'Exactly one valid answer exists'],
    hints: ['Store values you have already seen in a dictionary.', 'Look for target minus the current value.'],
    testCases: [{ input: '[2, 7, 11, 15], 9', expected: '[0, 1]' }, { input: '[3, 2, 4], 6', expected: '[1, 2]' }],
    starterCode: 'def two_sum(numbers, target):\n    # Return the indices of the two values that reach target.\n    return []\n',
    demoChecks: ['seen', 'target - number'],
  },
  {
    id: 'js-longest-substring', title: 'Longest Distinct Window',
    description: 'Use a sliding window to find the longest substring without repeated characters.',
    difficulty: 'Intermediate', category: 'Data Structures & Algorithms', language: 'JavaScript', points: 150, estimatedMinutes: 40,
    problemStatement: 'Return the length of the longest substring that contains no repeated characters.',
    examples: [{ input: '"abcabcbb"', output: '3' }, { input: '"bbbbb"', output: '1' }],
    constraints: ['0 ≤ string length ≤ 50,000', 'Input contains printable ASCII characters'],
    hints: ['Keep a left boundary for the current window.', 'Move the boundary past the previous index of a repeated character.'],
    testCases: [{ input: '"abcabcbb"', expected: '3' }, { input: '"bbbbb"', expected: '1' }, { input: '"pwwkew"', expected: '3' }],
    starterCode: 'function longestDistinctWindow(value) {\n  // Return the length of the longest substring without repeats.\n  return 0;\n}\n',
    demoChecks: ['left', 'lastSeen'],
  },
  {
    id: 'java-binary-search', title: 'Rotated Search',
    description: 'Search a sorted array that has been rotated at an unknown pivot.',
    difficulty: 'Advanced', category: 'Data Structures & Algorithms', language: 'Java', points: 180, estimatedMinutes: 45,
    problemStatement: 'Return the index of target in a rotated sorted array with unique values, or -1 when it is absent.',
    examples: [{ input: '[4,5,6,7,0,1,2], target = 0', output: '4' }, { input: '[4,5,6,7,0,1,2], target = 3', output: '-1' }],
    constraints: ['0 ≤ array length ≤ 5,000', 'Values are unique integers'],
    hints: ['At least one side of the midpoint is always sorted.', 'Use the sorted side to decide which half to discard.'],
    testCases: [{ input: '[4,5,6,7,0,1,2], 0', expected: '4' }, { input: '[4,5,6,7,0,1,2], 3', expected: '-1' }],
    starterCode: 'public int search(int[] numbers, int target) {\n    // Return target index using logarithmic search.\n    return -1;\n}\n',
    demoChecks: ['mid', 'left <= right'],
  },
  {
    id: 'python-grid-path', title: 'Count Grid Paths',
    description: 'Count the ways to reach the bottom-right cell while moving only down or right.',
    difficulty: 'Advanced', category: 'Python', language: 'Python', points: 200, estimatedMinutes: 50,
    problemStatement: 'Given rows and columns, return the number of paths from the top-left to the bottom-right cell.',
    examples: [{ input: 'rows = 3, columns = 2', output: '3' }, { input: 'rows = 3, columns = 7', output: '28' }],
    constraints: ['1 ≤ rows, columns ≤ 100', 'Return the exact integer result'],
    hints: ['The paths to a cell equal the paths from above plus the paths from the left.', 'A one-dimensional dynamic programming array is enough.'],
    testCases: [{ input: '3, 2', expected: '3' }, { input: '3, 7', expected: '28' }],
    starterCode: 'def count_paths(rows, columns):\n    # Return the number of valid paths.\n    return 0\n',
    demoChecks: ['dp', 'rows + columns'],
  },
]

export const arenaCategories: ArenaCategory[] = ['Python', 'JavaScript', 'Java', 'Data Structures & Algorithms']
export const arenaDifficulties: ArenaDifficulty[] = ['Beginner', 'Intermediate', 'Advanced']
