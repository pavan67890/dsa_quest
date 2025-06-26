export interface Level {
  id: number;
  name: string;
  question: string;
  isSurprise?: boolean;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  initialLives: number;
  levels: Level[];
}

export const dsaModules: Module[] = [
  {
    id: 'basics',
    name: 'Basics',
    description: 'Start with the fundamentals of programming and complexity analysis.',
    initialLives: 5,
    levels: [
      { id: 1, name: 'L1', question: 'Explain the concept of Time Complexity and Space Complexity.' },
      { id: 2, name: 'L2', question: 'What are the different types of data structures?' },
      { id: 3, name: 'L3', question: 'Implement a function to reverse a given number.' },
      { id: 4, name: 'Surprise', question: 'Random basic question with follow-ups.', isSurprise: true },
    ],
  },
  {
    id: 'arrays',
    name: 'Arrays',
    description: 'Master array manipulation, searching, and sorting algorithms.',
    initialLives: 5,
    levels: [
      { id: 1, name: 'Easy 1', question: 'Find the largest element in an array.' },
      { id: 2, name: 'Easy 2', question: 'Rotate array by K elements.' },
      { id: 3, name: 'Medium 1', question: 'Kadane\'s Algorithm for maximum subarray sum.' },
      { id: 4, name: 'Medium 2', question: 'Stock Buy and Sell.' },
      { id: 5, name: 'Hard 1', question: 'Merge two sorted arrays without extra space.' },
      { id: 6, name: 'Surprise', question: 'Random array-based question with follow-ups.', isSurprise: true },
    ],
  },
  {
    id: 'strings',
    name: 'Strings',
    description: 'Dive into string algorithms, pattern matching, and manipulation.',
    initialLives: 5,
    levels: [
        { id: 1, name: 'Easy 1', question: 'Check if a string is a palindrome.' },
        { id: 2, name: 'Easy 2', question: 'Find the longest common prefix.' },
        { id: 3, name: 'Medium 1', question: 'Implement atoi function.' },
        { id: 4, name: 'Surprise', question: 'Random string-based question with follow-ups.', isSurprise: true },
    ],
  },
  {
    id: 'recursion',
    name: 'Recursion',
    description: 'Understand the power of recursion and backtracking.',
    initialLives: 3,
    levels: [
        { id: 1, name: 'L1', question: 'Print numbers from 1 to N using recursion.' },
        { id: 2, name: 'L2', question: 'Calculate the factorial of a number using recursion.' },
        { id: 3, name: 'L3', question: 'Solve the Tower of Hanoi problem.' },
        { id: 4, name: 'Surprise', question: 'Random recursion-based question with follow-ups.', isSurprise: true },
    ]
  }
];
