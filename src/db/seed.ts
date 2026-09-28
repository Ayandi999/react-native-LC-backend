import "dotenv/config";
import { db } from "./db.js";
import { problems } from "./schema.js";

const sampleProblems = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Arrays & Hashing",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the *same* element twice.

You can return the answer in any order.`,
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Your code here
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  // Your code here
}`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Your code here
        pass`,
    },
    testCases: [
      {
        input: { nums: [2, 7, 11, 15], target: 9 },
        expected: [0, 1],
      },
      {
        input: { nums: [3, 2, 4], target: 6 },
        expected: [1, 2],
      },
      {
        input: { nums: [3, 3], target: 6 },
        expected: [0, 1],
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    hints: [
      "A brute force approach would search all pairs, taking O(N^2) time.",
      "Can you use a hash map to look up the complement (target - nums[i]) in O(1) time?",
    ],
    defaultTimeLimitSeconds: 1800,
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: "Stack",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Your code here
}`,
      typescript: `function isValid(s: string): boolean {
  // Your code here
}`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Your code here
        pass`,
    },
    testCases: [
      {
        input: { s: "()" },
        expected: true,
      },
      {
        input: { s: "()[]{}" },
        expected: true,
      },
      {
        input: { s: "(]" },
        expected: false,
      },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'.",
    ],
    hints: [
      "Consider using a Last-In-First-Out (LIFO) data structure like a Stack.",
      "When encountering an opening bracket, push it. When encountering a closing bracket, check if it matches the top of the stack.",
    ],
    defaultTimeLimitSeconds: 1200,
  },
  {
    slug: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    category: "Sliding Window",
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return \`0\`.`,
    starterCode: {
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {
  // Your code here
}`,
      typescript: `function maxProfit(prices: number[]): number {
  // Your code here
}`,
      python: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        # Your code here
        pass`,
    },
    testCases: [
      {
        input: { prices: [7, 1, 5, 3, 6, 4] },
        expected: 5,
      },
      {
        input: { prices: [7, 6, 4, 3, 1] },
        expected: 0,
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4",
    ],
    hints: [
      "Track the minimum price seen so far as you iterate through the array.",
      "Calculate the potential profit if sold on the current day, and keep track of the maximum profit.",
    ],
    defaultTimeLimitSeconds: 1500,
  },
  {
    slug: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "Sliding Window",
    description: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.`,
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // Your code here
}`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
  // Your code here
}`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Your code here
        pass`,
    },
    testCases: [
      {
        input: { s: "abcabcbb" },
        expected: 3,
      },
      {
        input: { s: "bbbbb" },
        expected: 1,
      },
      {
        input: { s: "pwwkew" },
        expected: 3,
      },
    ],
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    hints: [
      "Use a sliding window with two pointers (left and right).",
      "Use a Set or Map to track the characters inside the current window.",
    ],
    defaultTimeLimitSeconds: 1800,
  },
];

async function seed() {
  console.log("🌱 Seeding LeetCode problems into database...");

  for (const prob of sampleProblems) {
    await db
      .insert(problems)
      .values(prob)
      .onConflictDoUpdate({
        target: problems.slug,
        set: {
          title: prob.title,
          difficulty: prob.difficulty,
          category: prob.category,
          description: prob.description,
          starterCode: prob.starterCode,
          testCases: prob.testCases,
          constraints: prob.constraints,
          hints: prob.hints,
          defaultTimeLimitSeconds: prob.defaultTimeLimitSeconds,
        },
      });
    console.log(`✓ Seeded: ${prob.title} (${prob.difficulty})`);
  }

  console.log("✅ Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
