
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
    description: 'Build a strong foundation with core programming concepts, complexity analysis, and basic data structures.',
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
    description: 'Solve a variety of problems on arrays, from easy to hard.',
    initialLives: 5,
    levels: [
      { id: 1, name: 'Easy 1', question: 'Find the largest element in an array.' },
      { id: 2, name: 'Easy 2', question: 'Find the second largest and second smallest element in an array.' },
      { id: 3, name: 'Easy 3', question: 'Check if an array is sorted in ascending order.' },
      { id: 4, name: 'Easy 4', question: 'Remove duplicates from a sorted array.' },
      { id: 5, name: 'Easy 5', question: 'Given an array, move all the zeros to the end of the array.' },
      { id: 6, name: 'Easy 6', question: 'Find the union of two sorted arrays.' },
      { id: 7, name: 'Medium 1', question: 'Given an array of integers, return indices of the two numbers such that they add up to a specific target (Two Sum Problem).' },
      { id: 8, name: 'Medium 2', question: 'Sort an array of 0s, 1s and 2s without using any external sorting algorithms.' },
      { id: 9, name: 'Medium 3', question: 'Find the element that appears more than N/2 times in an array.' },
      { id: 10, name: 'Medium 4', question: 'Implement Kadane\'s Algorithm to find the maximum subarray sum.' },
      { id: 11, name: 'Medium 5', question: 'Find the leaders in an array. An element is a leader if it is greater than all the elements to its right.' },
      { id: 12, name: 'Medium 6', question: 'Given a matrix, set the entire row and column to 0 if an element is 0.' },
      { id: 13, name: 'Hard 1', question: 'Given an integer numRows, return the first numRows of Pascal\'s triangle.' },
      { id: 14, name: 'Hard 2', question: 'Find all unique triplets in an array that sum up to zero (3-Sum Problem).' },
      { id: 15, name: 'Hard 3', question: 'Find the number of subarrays with a given XOR K.' },
      { id: 16, name: 'Hard 4', question: 'Merge two sorted arrays without using extra space.' },
      { id: 17, name: 'Surprise', question: 'What is the Dutch National Flag algorithm and where is it used?', isSurprise: true },
    ],
  },
  {
    id: 'step-4-binary-search',
    name: 'Step 4: Binary Search',
    description: 'Learn binary search on 1D/2D arrays and its application in search spaces.',
    initialLives: 3,
    levels: [
        { id: 1, name: '1D L1', question: 'Implement binary search to find a target in a sorted array.' },
        { id: 2, name: '1D L2', question: 'Implement a function to find the lower bound of a number in a sorted array.' },
        { id: 3, name: '1D L3', question: 'Find a peak element in an array. An element is a peak if it is not smaller than its neighbors.' },
        { id: 4, name: '1D L4', question: 'Search for an element in a rotated sorted array with unique elements.' },
        { id: 5, name: '2D L1', question: 'Search for a target value in a 2D matrix that is sorted row-wise and column-wise.' },
        { id: 6, name: 'Search Space 1', question: 'Find the square root of a number up to a certain precision using binary search.' },
        { id: 7, name: 'Search Space 2', question: 'Koko is eating bananas. Find the minimum integer K such that she can eat all the bananas within H hours.' },
        { id: 8, name: 'Search Space 3', question: 'You have to ship packages within D days. Find the least weight capacity of a ship that will result in all packages being shipped within D days.' },
        { id: 9, name: 'Surprise', question: 'Explain the Aggressive Cows problem and how binary search on answers is applied to solve it.', isSurprise: true },
    ]
  },
   {
    id: 'step-5-strings',
    name: 'Step 5: Strings',
    description: 'Dive into string algorithms, pattern matching, and manipulation.',
    initialLives: 5,
    levels: [
        { id: 1, name: 'Easy 1', question: 'Remove the outermost parentheses of every primitive string in the decomposition of a valid parentheses string.' },
        { id: 2, name: 'Easy 2', question: 'Reverse words in a given string.' },
        { id: 3, name: 'Easy 3', question: 'Check if two strings are anagrams of each other.' },
        { id: 4, name: 'Medium 1', question: 'Implement the atoi function, which converts a string to an integer.' },
        { id: 5, name: 'Medium 2', question: 'Find the length of the longest substring without repeating characters.' },
        { id: 6, name: 'Medium 3', question: 'Given a string, sort it in decreasing order based on the frequency of characters.' },
        { id: 7, name: 'Surprise', question: 'Explain the Rabin-Karp algorithm for pattern matching.', isSurprise: true },
    ],
  },
  {
    id: 'step-6-linked-list',
    name: 'Step 6: Linked List',
    description: 'Master operations on singly, doubly, and circular linked lists.',
    initialLives: 5,
    levels: [
      { id: 1, name: 'Easy 1', question: 'Implement a singly linked list with insert and delete operations.' },
      { id: 2, name: 'Easy 2', question: 'Reverse a given linked list.' },
      { id: 3, name: 'Easy 3', question: 'Find the middle of a linked list.' },
      { id: 4, name: 'Easy 4', question: 'Merge two sorted linked lists.' },
      { id: 5, name: 'Medium 1', question: 'Detect a cycle in a linked list.' },
      { id: 6, name: 'Medium 2', question: 'Find the starting point of a cycle in a linked list.' },
      { id: 7, name: 'Medium 3', question: 'Check if a linked list is a palindrome.' },
      { id: 8, name: 'Medium 4', question: 'Add two numbers represented by linked lists.' },
      { id: 9, name: 'Hard 1', question: 'Reverse a linked list in groups of size k.' },
      { id: 10, name: 'Hard 2', question: 'Rotate a linked list by k places.' },
      { id: 11, name: 'Surprise', question: 'Design a data structure for a Least Recently Used (LRU) cache.', isSurprise: true },
    ],
  },
  {
    id: 'step-7-recursion',
    name: 'Step 7: Recursion',
    description: 'Understand and apply recursion to solve complex problems.',
    initialLives: 3,
    levels: [
      { id: 1, name: 'L1', question: 'Explain the concept of recursion and base cases with the factorial problem.' },
      { id: 2, name: 'L2', question: 'Generate all balanced parentheses for a given n.' },
      { id: 3, name: 'L3', question: 'Generate all subsets of a given set (powerset).' },
      { id: 4, name: 'L4', question: 'Given a collection of numbers that might contain duplicates, return all possible unique permutations.' },
      { id: 5, name: 'L5', question: 'Solve the N-Queens problem.' },
      { id: 6, name: 'Surprise', question: 'Explain how backtracking works and its relationship with recursion.', isSurprise: true },
    ],
  },
  {
    id: 'step-8-bit-manipulation',
    name: 'Step 8: Bit Manipulation',
    description: 'Learn bitwise operators and solve problems using bit manipulation techniques.',
    initialLives: 3,
    levels: [
      { id: 1, name: 'L1', question: 'Check if the i-th bit is set or not in a number.' },
      { id: 2, name: 'L2', question: 'Count the number of set bits in a number (Brian Kernighan\'s algorithm).' },
      { id: 3, name: 'L3', question: 'Check if a number is a power of 2.' },
      { id: 4, name: 'L4', question: 'Find the only non-repeating element in an array where every other element appears twice.' },
      { id: 5, name: 'L5', question: 'Find the two non-repeating elements in an array where every other element appears twice.' },
      { id: 6, name: 'Surprise', question: 'Generate all subsets of a set using bit manipulation.', isSurprise: true },
    ]
  },
  {
    id: 'step-9-stacks-queues',
    name: 'Step 9: Stacks & Queues',
    description: 'Learn about LIFO and FIFO data structures and their applications.',
    initialLives: 4,
    levels: [
      { id: 1, name: 'L1', question: 'Implement a stack using an array and a linked list.' },
      { id: 2, name: 'L2', question: 'Implement a queue using an array and a linked list.' },
      { id: 3, name: 'L3', question: 'Implement a stack using two queues.' },
      { id: 4, name: 'L4', question: 'Check for balanced parentheses in an expression.' },
      { id: 5, name: 'L5', question: 'Find the next greater element for each element in an array.' },
      { id: 6, name: 'L6', question: 'Implement a Min Stack that supports push, pop, top, and retrieving the minimum element in constant time.' },
      { id: 7, name: 'Surprise', question: 'Explain how you would implement a sliding window maximum algorithm using a deque.', isSurprise: true },
    ]
  },
  {
    id: 'step-10-trees',
    name: 'Step 10: Trees',
    description: 'Master traversals, views, and complex problems on Binary Trees and Binary Search Trees.',
    initialLives: 5,
    levels: [
      { id: 1, name: 'Traversal 1', question: 'Implement pre-order, in-order, and post-order traversals of a binary tree.' },
      { id: 2, name: 'Traversal 2', question: 'Implement level-order traversal of a binary tree.' },
      { id: 3, name: 'BT Med 1', question: 'Find the maximum depth (height) of a binary tree.' },
      { id: 4, name: 'BT Med 2', question: 'Check if a binary tree is balanced.' },
      { id: 5, name: 'BT Med 3', question: 'Find the diameter of a binary tree.' },
      { id: 6, name: 'BT Med 4', question: 'Check if two trees are identical.' },
      { id: 7, name: 'BT Views', question: 'Implement right view and left view of a binary tree.' },
      { id: 8, name: 'BST 1', question: 'Search for a value in a Binary Search Tree.' },
      { id: 9, name: 'BST 2', question: 'Validate if a given binary tree is a Binary Search Tree.' },
      { id: 10, name: 'BST 3', question: 'Find the Lowest Common Ancestor (LCA) of two nodes in a BST.' },
      { id: 11, name: 'BST Hard', question: 'Find the k-th smallest element in a BST.' },
      { id: 12, name: 'Surprise', question: 'Explain Morris Traversal and its advantages.', isSurprise: true },
    ]
  },
  {
    id: 'step-11-heaps',
    name: 'Step 11: Heaps',
    description: 'Understand priority queues and solve problems using Min-Heap and Max-Heap.',
    initialLives: 3,
    levels: [
      { id: 1, name: 'L1', question: 'Explain the difference between a Min-Heap and a Max-Heap.' },
      { id: 2, name: 'L2', question: 'Implement a function to convert an array into a Max-Heap (heapify).' },
      { id: 3, name: 'L3', question: 'Find the k-th largest element in an array using a heap.' },
      { id: 4, name: 'L4', question: 'Find the median from a data stream.' },
      { id: 5, name: 'Surprise', question: 'How can you merge K sorted arrays efficiently using a heap?', isSurprise: true },
    ]
  },
  {
    id: 'step-12-graphs',
    name: 'Step 12: Graphs',
    description: 'Learn graph representations and master traversal algorithms and common graph problems.',
    initialLives: 5,
    levels: [
      { id: 1, name: 'L1', question: 'Explain how to represent a graph using an adjacency matrix and an adjacency list. What are the pros and cons of each?' },
      { id: 2, name: 'L2', question: 'Implement Breadth-First Search (BFS) for a graph.' },
      { id: 3, name: 'L3', question: 'Implement Depth-First Search (DFS) for a graph.' },
      { id: 4, name: 'L4', question: 'Detect a cycle in an undirected graph using BFS/DFS.' },
      { id: 5, name: 'L5', question: 'Detect a cycle in a directed graph using DFS.' },
      { id: 6, name: 'L6', question: 'Explain and implement Topological Sort.' },
      { id: 7, name: 'L7', question: 'Explain Dijkstra\'s algorithm for finding the shortest path in a weighted graph.' },
      { id: 8, name: 'L8', question: 'Explain the Bellman-Ford algorithm and its use cases.' },
      { id: 9, name: 'L9', question: 'Explain Floyd-Warshall algorithm for all-pairs shortest path.' },
      { id: 10, name: 'L10', question: 'Explain Prim\'s and Kruskal\'s algorithms for Minimum Spanning Tree.' },
      { id: 11, name: 'Surprise', question: 'What are strongly connected components and how can Kosaraju\'s algorithm be used to find them?', isSurprise: true },
    ]
  },
  {
    id: 'step-13-dp',
    name: 'Step 13: Dynamic Programming',
    description: 'Master the art of DP by solving a wide range of problems from 1D to multidimensional.',
    initialLives: 3,
    levels: [
      { id: 1, name: '1D DP 1', question: 'Find the N-th Fibonacci number using dynamic programming.' },
      { id: 2, name: '1D DP 2', question: 'Solve the Frog Jump problem where you find the minimum cost to reach the Nth stair.' },
      { id: 3, name: '1D DP 3', question: 'Find the maximum sum of non-adjacent elements in an array.' },
      { id: 4, name: '2D DP 1', question: 'Find the number of unique paths in a grid from the top-left to the bottom-right.' },
      { id: 5, name: '2D DP 2', question: 'Find the minimum path sum in a grid.' },
      { id: 6, name: 'DP on Subsequences 1', question: 'Solve the 0/1 Knapsack problem.' },
      { id: 7, name: 'DP on Subsequences 2', question: 'Solve the Unbounded Knapsack problem.' },
      { id: 8, name: 'DP on Strings 1', question: 'Find the Longest Common Subsequence (LCS) of two strings.' },
      { id: 9, name: 'DP on Strings 2', question: 'Find the minimum number of insertions and deletions to convert string A to string B.' },
      { id: 10, name: 'Surprise', question: 'Explain the difference between memoization (top-down) and tabulation (bottom-up) in dynamic programming.', isSurprise: true },
    ]
  },
  {
    id: 'step-14-tries',
    name: 'Step 14: Tries',
    description: 'Learn the Trie data structure for efficient string searching and prefix-based operations.',
    initialLives: 3,
    levels: [
      { id: 1, name: 'L1', question: 'Implement a Trie and its basic operations: insert, search, and startsWith.' },
      { id: 2, name: 'L2', question: 'Find the longest word in a dictionary that can be built one character at a time by other words in the dictionary.' },
      { id: 3, name: 'L3', question: 'Implement a function to find the maximum XOR of two numbers in an array using a Trie.' },
      { id: 4, name: 'Surprise', question: 'How would you design an autocomplete system using a Trie?', isSurprise: true },
    ]
  },
  {
    id: 'step-15-segment-trees',
    name: 'Step 15: Segment Trees',
    description: 'Learn about Segment Trees for efficient range queries and updates.',
    initialLives: 2,
    levels: [
        { id: 1, name: 'L1', question: 'What is a Segment Tree and what kind of problems is it used to solve?' },
        { id: 2, name: 'L2', question: 'Implement a Segment Tree to find the sum of elements in a given range [L, R].' },
        { id: 3, name: 'L3', question: 'Implement point updates in a Segment Tree.' },
        { id: 4, name: 'Surprise', question: 'Explain the concept of Lazy Propagation in Segment Trees and when it is needed.', isSurprise: true },
    ],
  },
  {
    id: 'step-16-disjoint-set',
    name: 'Step 16: Disjoint Set Union (DSU)',
    description: 'Learn the DSU data structure for tracking elements partitioned into a number of disjoint sets.',
    initialLives: 3,
    levels: [
        { id: 1, name: 'L1', question: 'Explain the Disjoint Set Union data structure and its main operations: find and union.' },
        { id: 2, name: 'L2', question: 'Explain and implement the Union by Rank and Path Compression optimizations.' },
        { id: 3, name: 'L3', question: 'Use DSU to find the number of connected components in a graph.' },
        { id: 4, name: 'Surprise', question: 'How is DSU used in Kruskal\'s algorithm for finding a Minimum Spanning Tree?', isSurprise: true },
    ],
  },
  {
    id: 'step-17-sliding-window',
    name: 'Step 17: Sliding Window & Two Pointers',
    description: 'Master the sliding window and two-pointer techniques for solving array and string problems efficiently.',
    initialLives: 4,
    levels: [
        { id: 1, name: 'L1', question: 'Find the length of the longest substring with no more than K distinct characters.' },
        { id: 2, name: 'L2', question: 'Given a binary array, find the maximum length of a contiguous subarray with an equal number of 0 and 1.' },
        { id: 3, name: 'L3', question: 'Find the number of subarrays with a sum equal to K.' },
        { id: 4, name: 'L4', question: 'Given an array of positive integers, find the length of the longest subarray with a sum less than or equal to K.' },
        { id: 5, name: 'Surprise', question: 'Explain the difference between fixed-size and variable-size sliding window problems and provide an example of each.', isSurprise: true },
    ],
  },
  {
    id: 'step-18-advanced-concepts',
    name: 'Step 18: Advanced Concepts',
    description: 'Explore advanced topics like Fenwick Trees, Square Root Decomposition, and more.',
    initialLives: 2,
    levels: [
        { id: 1, name: 'Fenwick Tree', question: 'What is a Fenwick Tree (Binary Indexed Tree) and how does it compare to a Segment Tree?' },
        { id: 2, name: 'Sqrt Decomp', question: 'Explain the concept of Square Root Decomposition and when it might be a good choice.' },
        { id: 3, name: 'Manacher\'s Algo', question: 'Explain Manacher\'s algorithm for finding the longest palindromic substring in linear time.' },
        { id: 4, name: 'Surprise', question: 'What are rolling hashes and how can they be used in algorithms like Rabin-Karp?', isSurprise: true },
    ],
  },
];
