
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
    id: 'step-1-basics',
    name: 'Step 1: Learn The Basics',
    description: 'Build a strong foundation with core programming concepts, complexity analysis, and recursion.',
    initialLives: 5,
    levels: [
      { id: 1, name: 'L1', question: 'Explain how to handle user input and output in your preferred programming language.' },
      { id: 2, name: 'L2', question: 'Describe the primitive and non-primitive data types available in your language.' },
      { id: 3, name: 'L3', question: 'Solve a problem using if-else statements, for example, checking if a number is even or odd.' },
      { id: 4, name: 'L4', question: 'When would you use a switch statement over an if-else chain? Provide an example.' },
      { id: 5, name: 'L5', question: 'Explain the basic difference between an array and a string in memory.' },
      { id: 6, name: 'L6', question: 'Write a for loop to print the first N natural numbers.' },
      { id: 7, name: 'L7', question: 'Write a while loop to reverse a given number.' },
      { id: 8, name: 'L8', question: 'What are functions and what is the difference between pass-by-value and pass-by-reference?' },
      { id: 9, name: 'L9', question: 'Explain Time and Space Complexity with an example of a simple algorithm.' },
      { id: 10, name: 'L10', question: 'Write a recursive function to calculate the sum of the first N natural numbers.' },
      { id: 11, name: 'Surprise', question: 'What is hashing and why is it useful?', isSurprise: true },
    ],
  },
  {
    id: 'step-2-sorting',
    name: 'Step 2: Sorting Techniques',
    description: 'Master fundamental and advanced sorting algorithms.',
    initialLives: 5,
    levels: [
      { id: 1, name: 'L1', question: 'Explain and implement Selection Sort.' },
      { id: 2, name: 'L2', question: 'Explain and implement Bubble Sort.' },
      { id: 3, name: 'L3', question: 'Explain and implement Insertion Sort.' },
      { id: 4, name: 'L4', question: 'Explain the logic behind Merge Sort and implement it.' },
      { id: 5, name: 'L5', question: 'Explain the partitioning strategy in Quick Sort and implement it.' },
      { id: 6, name: 'Surprise', question: 'Compare the time and space complexities of different sorting algorithms.', isSurprise: true },
    ],
  },
  {
    id: 'step-3-arrays',
    name: 'Step 3: Problems on Arrays',
    description: 'Solve a variety of problems on arrays, from easy to hard, based on the A2Z sheet.',
    initialLives: 5,
    levels: [
      { id: 1, name: 'Easy 1', question: 'Find the largest element in an array.' },
      { id: 2, name: 'Easy 2', question: 'Find the second largest and second smallest element in an array.' },
      { id: 3, name: 'Easy 3', question: 'Check if an array is sorted in ascending order.' },
      { id: 4, name: 'Easy 4', question: 'Remove duplicates from a sorted array.' },
      { id: 5, name: 'Med 1', question: 'Given an array of integers, return indices of the two numbers such that they add up to a specific target (Two Sum Problem).' },
      { id: 6, name: 'Med 2', question: 'Sort an array of 0s, 1s and 2s without using any external sorting algorithms.' },
      { id: 7, name: 'Med 3', question: 'Find the element that appears more than N/2 times in an array.' },
      { id: 8, name: 'Med 4', question: 'Implement Kadane\'s Algorithm to find the maximum subarray sum.' },
      { id: 9, name: 'Hard 1', question: 'Given an integer numRows, return the first numRows of Pascal\'s triangle.' },
      { id: 10, name: 'Hard 2', question: 'Find all unique triplets in an array that sum up to zero (3-Sum Problem).' },
      { id: 11, name: 'Surprise', question: 'What is the Dutch National Flag algorithm and where is it used?', isSurprise: true },
    ],
  },
  {
    id: 'step-4-binary-search',
    name: 'Step 4: Binary Search',
    description: 'Learn binary search on 1D/2D arrays and its application in search spaces.',
    initialLives: 3,
    levels: [
        { id: 1, name: 'L1', question: 'Implement binary search to find a target in a sorted array.' },
        { id: 2, name: 'L2', question: 'Implement a function to find the lower bound of a number in a sorted array.' },
        { id: 3, name: 'L3', question: 'Given a sorted array and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.' },
        { id: 4, name: 'L4', question: 'Find a peak element in an array. An element is a peak if it is not smaller than its neighbors.' },
        { id: 5, name: 'L5', question: 'Search for an element in a rotated sorted array.' },
        { id: 6, name: 'Surprise', question: 'Find the square root of a number up to a certain precision using binary search.', isSurprise: true },
    ]
  },
   {
    id: 'step-5-strings',
    name: 'Step 5: Strings',
    description: 'Dive into string algorithms, pattern matching, and manipulation.',
    initialLives: 5,
    levels: [
        { id: 1, name: 'Easy 1', question: 'Check if a string is a palindrome.' },
        { id: 2, name: 'Easy 2', question: 'Find the longest common prefix among an array of strings.' },
        { id: 3, name: 'Medium 1', question: 'Implement the atoi function, which converts a string to an integer.' },
        { id: 4, name: 'Medium 2', question: 'Find the length of the longest substring without repeating characters.' },
        { id: 5, name: 'Surprise', question: 'Explain the Rabin-Karp algorithm for pattern matching.', isSurprise: true },
    ],
  },
];
