export type Language = "javascript" | "python" | "typescript";

export interface TestCase {
  input: string;
  expected: string;
  description: string;
}

export interface CodingChallenge {
  id: string;
  channelId: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  category: string;
  timeEstimate: number;
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: Record<Language, string>;
  solution: Record<Language, string>;
  hints: string[];
  testCases: TestCase[];
  eli5: string;
  approach: string;
  complexity: { time: string; space: string; explanation: string };
  relatedConcepts: string[];
}

export const codingChallenges: CodingChallenge[] = [
  {
    id: "cc1",
    channelId: "javascript",
    title: "Implement Array.prototype.flatten",
    slug: "flatten-array",
    difficulty: "easy",
    tags: ["javascript", "arrays", "recursion"],
    category: "Arrays",
    timeEstimate: 15,
    description: `Implement a \`flatten\` function that takes a **nested array** of any depth and returns a flat array containing all values.

Do not use \`Array.prototype.flat()\` — implement it yourself using recursion or iteration.`,
    constraints: ["Input is a valid array (may contain arrays of any depth)", "Values can be any type", "Do not use Array.prototype.flat()"],
    examples: [
      { input: "[1, [2, 3], [4, [5, 6]]]", output: "[1, 2, 3, 4, 5, 6]", explanation: "All nested arrays are unwrapped" },
      { input: "[[1, [2]], [3, [4, [5]]]]", output: "[1, 2, 3, 4, 5]" },
      { input: "[1, 2, 3]", output: "[1, 2, 3]", explanation: "Already flat — no change" },
    ],
    starterCode: {
      javascript: `/**
 * @param {any[]} arr
 * @returns {any[]}
 */
function flatten(arr) {
  // Your solution here
}

// Test
console.log(flatten([1, [2, 3], [4, [5, 6]]])); // [1, 2, 3, 4, 5, 6]`,
      typescript: `function flatten(arr: any[]): any[] {
  // Your solution here
}

console.log(flatten([1, [2, 3], [4, [5, 6]]]));`,
      python: `def flatten(arr):
    # Your solution here
    pass

print(flatten([1, [2, 3], [4, [5, 6]]]))  # [1, 2, 3, 4, 5, 6]`,
    },
    solution: {
      javascript: `function flatten(arr) {
  return arr.reduce((acc, val) =>
    Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val),
  []);
}

// Alternatively using a stack (iterative):
function flattenIterative(arr) {
  const stack = [...arr];
  const result = [];
  while (stack.length) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      stack.push(...item); // push elements back
    } else {
      result.unshift(item);
    }
  }
  return result;
}`,
      typescript: `function flatten(arr: any[]): any[] {
  return arr.reduce((acc: any[], val: any) =>
    Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val),
  []);
}`,
      python: `def flatten(arr):
    result = []
    for item in arr:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result`,
    },
    hints: [
      "Use reduce() — for each element, either concatenate it or recursively flatten it",
      "Check Array.isArray(val) to decide whether to recurse",
      "Base case: when an element is NOT an array, just add it directly",
    ],
    testCases: [
      { input: "flatten([1, [2, 3], [4, [5, 6]]])", expected: "[1,2,3,4,5,6]", description: "Basic nested" },
      { input: "flatten([[1, [2]], [3, [4, [5]]]])", expected: "[1,2,3,4,5]", description: "Deep nesting" },
      { input: "flatten([1, 2, 3])", expected: "[1,2,3]", description: "Already flat" },
      { input: "flatten([])", expected: "[]", description: "Empty array" },
    ],
    eli5: "Imagine you have a box of boxes (some boxes have more boxes inside). Flatten opens every box and puts all the single items into one big flat box — no boxes inside boxes allowed in the result.",
    approach: `Use **recursion with reduce**:
1. Start with an empty accumulator \`[]\`
2. For each element, check if it's an array
3. If yes → recursively flatten it and concat to accumulator
4. If no → directly concat to accumulator`,
    complexity: { time: "O(n)", space: "O(n)", explanation: "n is total number of elements across all levels. We visit each element once, and the result array has n elements." },
    relatedConcepts: ["Array.reduce()", "Recursion", "Array.isArray()", "Stack-based iteration"],
  },
  {
    id: "cc2",
    channelId: "javascript",
    title: "Implement debounce",
    slug: "debounce",
    difficulty: "medium",
    tags: ["javascript", "closures", "timers"],
    category: "Functions",
    timeEstimate: 20,
    description: `Implement a \`debounce(fn, delay)\` function that delays invoking \`fn\` until after \`delay\` milliseconds have elapsed since the last time it was called.

This is essential for **search inputs**, **resize handlers**, and any scenario where you want to wait for the user to "stop" before acting.`,
    constraints: ["fn is a function, delay is a positive integer (ms)", "The debounced function should pass through all arguments", "Calling multiple times within delay resets the timer"],
    examples: [
      { input: 'const dSearch = debounce(search, 300);\ndSearch("a"); dSearch("ab"); dSearch("abc");', output: 'search("abc") called once after 300ms', explanation: "Only the last call fires" },
    ],
    starterCode: {
      javascript: `/**
 * @param {Function} fn
 * @param {number} delay - milliseconds
 * @returns {Function}
 */
function debounce(fn, delay) {
  // Your solution here
}

// Test: this should only log "abc" after 300ms
const log = debounce(console.log, 300);
log("a"); log("ab"); log("abc");`,
      typescript: `function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  // Your solution here
}`,
      python: `import threading

def debounce(fn, delay):
    # delay is in seconds for Python
    # Your solution here
    pass`,
    },
    solution: {
      javascript: `function debounce(fn, delay) {
  let timerId = null;

  return function(...args) {
    // Cancel the previous timer
    clearTimeout(timerId);

    // Set a new one
    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}`,
      typescript: `function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return function(this: any, ...args: Parameters<T>) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}`,
      python: `import threading

def debounce(fn, delay):
    timer = None

    def debounced(*args, **kwargs):
        nonlocal timer
        if timer:
            timer.cancel()
        timer = threading.Timer(delay, fn, args, kwargs)
        timer.start()

    return debounced`,
    },
    hints: [
      "You need a variable to store the timer ID — where should it live so it persists between calls? (Closure!)",
      "Use clearTimeout on each call to cancel the previous timer",
      "Then set a new setTimeout with the delay",
    ],
    testCases: [
      { input: "// Rapid calls — only last should execute\nlet called = 0;\nconst d = debounce(() => called++, 50);\nd(); d(); d();\n// After 60ms: called === 1", expected: "called === 1", description: "Rapid calls debounced" },
    ],
    eli5: "Imagine you're typing a text message. If you stopped typing for 300ms, it sends. But every time you type another letter, the 300ms countdown resets. The message only sends when you've ACTUALLY stopped typing.",
    approach: `**Closure + setTimeout pattern:**
1. Declare \`timerId\` in the outer scope (closure)
2. Return an inner function that:
   - Calls \`clearTimeout(timerId)\` to cancel pending call
   - Calls \`setTimeout(() => fn(...args), delay)\` to reschedule`,
    complexity: { time: "O(1)", space: "O(1)", explanation: "Each call is O(1). Only one timer reference stored at any time." },
    relatedConcepts: ["Closures", "setTimeout/clearTimeout", "Throttle (cousin pattern)", "Event handling optimization"],
  },
  {
    id: "cc3",
    channelId: "javascript",
    title: "Deep Clone an Object",
    slug: "deep-clone",
    difficulty: "medium",
    tags: ["javascript", "objects", "recursion"],
    category: "Objects",
    timeEstimate: 20,
    description: `Implement a \`deepClone(obj)\` function that creates a **deep copy** of a given object. The clone must not share any references with the original.

Handle: plain objects, arrays, nested structures, primitive values. You do not need to handle Dates, RegExp, or functions.`,
    constraints: ["Input can be an object, array, or primitive", "No circular references in input", "No need to handle Date, RegExp, Map, Set"],
    examples: [
      { input: 'deepClone({ a: 1, b: { c: 2 } })', output: '{ a: 1, b: { c: 2 } }', explanation: "Modifying result.b.c does NOT affect original.b.c" },
      { input: 'deepClone([1, [2, 3]])', output: '[1, [2, 3]]', explanation: "Arrays deep copied too" },
    ],
    starterCode: {
      javascript: `/**
 * @param {any} obj
 * @returns {any}
 */
function deepClone(obj) {
  // Your solution here
}

const original = { a: 1, b: { c: 2 } };
const clone = deepClone(original);
clone.b.c = 99;
console.log(original.b.c); // should still be 2`,
      typescript: `function deepClone<T>(obj: T): T {
  // Your solution here
}`,
      python: `def deep_clone(obj):
    # Your solution here
    pass`,
    },
    solution: {
      javascript: `function deepClone(obj) {
  // Primitives + null → return as-is
  if (obj === null || typeof obj !== 'object') return obj;

  // Array
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  // Plain object
  const clone = {};
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key]);
  }
  return clone;
}`,
      typescript: `function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as unknown as T;
  const clone = {} as T;
  for (const key of Object.keys(obj as object)) {
    (clone as any)[key] = deepClone((obj as any)[key]);
  }
  return clone;
}`,
      python: `def deep_clone(obj):
    if not isinstance(obj, (dict, list)):
        return obj
    if isinstance(obj, list):
        return [deep_clone(item) for item in obj]
    return {k: deep_clone(v) for k, v in obj.items()}`,
    },
    hints: [
      "Base case: primitives (string, number, boolean, null) can be returned directly",
      "For arrays, map over elements recursively",
      "For objects, create a new {}, then copy each key recursively",
    ],
    testCases: [
      { input: "const r = deepClone({a:1,b:{c:2}}); r.b.c=99; original.b.c", expected: "2", description: "Deep reference isolation" },
      { input: "deepClone([1,[2,3]])", expected: "[1,[2,3]]", description: "Array deep clone" },
      { input: "deepClone(42)", expected: "42", description: "Primitive passthrough" },
    ],
    eli5: "Imagine photocopying a book that has photos inside. A shallow copy just photocopies the cover with *references* to the same photos. A deep clone photocopies EVERYTHING — every page, every photo — completely independent.",
    approach: `**Recursive type-check pattern:**
1. If primitive → return it directly (no cloning needed)
2. If array → \`map(deepClone)\`
3. If object → create new \`{}\`, copy each property recursively`,
    complexity: { time: "O(n)", space: "O(n)", explanation: "n = total number of nodes in the object tree. Every node is visited and a copy is created." },
    relatedConcepts: ["Shallow vs Deep Copy", "structuredClone() (native)", "JSON.parse(JSON.stringify()) gotcha", "Object.assign()"],
  },
  {
    id: "cc4",
    channelId: "algorithms",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "easy",
    tags: ["algorithms", "arrays", "hash-table"],
    category: "Arrays",
    timeEstimate: 10,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers that add up to \`target\`.

You may assume each input has **exactly one solution**, and you may not use the same element twice.`,
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "Exactly one valid solution exists"],
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0, 1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
      { input: "nums = [3,2,4], target = 6", output: "[1, 2]" },
      { input: "nums = [3,3], target = 6", output: "[0, 1]" },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Your solution here
}

console.log(twoSum([2,7,11,15], 9)); // [0, 1]
console.log(twoSum([3,2,4], 6));     // [1, 2]`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  // Your solution here
}`,
      python: `def two_sum(nums, target):
    # Your solution here
    pass

print(two_sum([2,7,11,15], 9))  # [0, 1]`,
    },
    solution: {
      javascript: `function twoSum(nums, target) {
  const seen = new Map(); // value → index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    seen.set(nums[i], i);
  }
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement)!, i];
    seen.set(nums[i], i);
  }
  return [];
}`,
      python: `def two_sum(nums, target):
    seen = {}  # value -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i`,
    },
    hints: [
      "A brute force O(n²) uses two nested loops — can you do O(n)?",
      "For each number, what's the complement you need? (target - current)",
      "Use a Map to look up complements in O(1)",
    ],
    testCases: [
      { input: "twoSum([2,7,11,15], 9)", expected: "[0,1]", description: "Basic" },
      { input: "twoSum([3,2,4], 6)", expected: "[1,2]", description: "Non-sequential" },
      { input: "twoSum([3,3], 6)", expected: "[0,1]", description: "Duplicate values" },
    ],
    eli5: "You need two numbers that add to 9. For each number you see, ask 'have I seen the NUMBER I need to go with this one?' Keep a notebook of numbers you've already seen. If yes — you found your pair!",
    approach: `**One-pass hash map:**
1. Create a Map \`seen\` of value → index
2. For each \`nums[i]\`, compute \`complement = target - nums[i]\`
3. If \`complement\` is in \`seen\`, return \`[seen[complement], i]\`
4. Otherwise, store \`seen[nums[i]] = i\``,
    complexity: { time: "O(n)", space: "O(n)", explanation: "Single pass through the array. Map stores up to n entries." },
    relatedConcepts: ["Hash Map / Dictionary", "Complement pattern", "Three Sum (variant)", "Two Sum II (sorted array)"],
  },
  {
    id: "cc5",
    channelId: "algorithms",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "easy",
    tags: ["algorithms", "stack", "strings"],
    category: "Stacks",
    timeEstimate: 15,
    description: `Given a string containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is **valid**.

A string is valid if:
1. Open brackets must be closed by the **same type** of bracket
2. Open brackets must be closed in the **correct order**
3. Every close bracket has a corresponding open bracket`,
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses characters only"],
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
      { input: 's = "([)]"', output: "false", explanation: "Interleaved types — not valid" },
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Your solution here
}

console.log(isValid("()"));     // true
console.log(isValid("()[]{}")); // true
console.log(isValid("(]"));     // false`,
      typescript: `function isValid(s: string): boolean {
  // Your solution here
}`,
      python: `def is_valid(s: str) -> bool:
    # Your solution here
    pass`,
    },
    solution: {
      javascript: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };

  for (const ch of s) {
    if (ch in map) {
      // Closing bracket
      if (stack.pop() !== map[ch]) return false;
    } else {
      // Opening bracket
      stack.push(ch);
    }
  }

  return stack.length === 0;
}`,
      typescript: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const ch of s) {
    if (ch in map) {
      if (stack.pop() !== map[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,
      python: `def is_valid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for ch in s:
        if ch in mapping:
            if not stack or stack[-1] != mapping[ch]:
                return False
            stack.pop()
        else:
            stack.append(ch)
    return not stack`,
    },
    hints: [
      "A stack is perfect here — brackets must close in reverse order of opening",
      "When you see an opening bracket, push it",
      "When you see a closing bracket, the top of stack should be its matching opener",
    ],
    testCases: [
      { input: 'isValid("()")', expected: "true", description: "Simple pair" },
      { input: 'isValid("()[]{}")', expected: "true", description: "Multiple types" },
      { input: 'isValid("(]")', expected: "false", description: "Mismatched" },
      { input: 'isValid("([)]")', expected: "false", description: "Interleaved" },
      { input: 'isValid("{[]}")', expected: "true", description: "Nested" },
    ],
    eli5: "Think of it like putting on and taking off gloves. You put on your left glove, then right glove. To take them off, you MUST take off your right glove first, then left. If you try to take off the left first — something's wrong!",
    approach: `**Stack + closing bracket map:**
1. Create a map of closing → opening: \`{')':'(', '}':'{', ']':'['}\`
2. For each char:
   - Opening bracket → push to stack
   - Closing bracket → pop stack, check it equals the matching opener
3. Valid if stack is empty at end`,
    complexity: { time: "O(n)", space: "O(n)", explanation: "Single pass through string. Stack holds at most n/2 opening brackets." },
    relatedConcepts: ["Stack data structure", "Monotonic stack", "Expression parsing", "Bracket matching in compilers"],
  },
  {
    id: "cc6",
    channelId: "algorithms",
    title: "Merge Two Sorted Lists",
    slug: "merge-sorted-lists",
    difficulty: "easy",
    tags: ["algorithms", "linked-list", "sorting"],
    category: "Linked Lists",
    timeEstimate: 20,
    description: `You are given the heads of two **sorted linked lists** \`list1\` and \`list2\`.

Merge the two lists into one **sorted** list. Return the head of the merged list.`,
    constraints: ["0 ≤ list length ≤ 50", "-100 ≤ Node.val ≤ 100", "Both lists are sorted in non-decreasing order"],
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]" },
      { input: "list1 = [], list2 = []", output: "[]" },
      { input: "list1 = [], list2 = [0]", output: "[0]" },
    ],
    starterCode: {
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
function mergeTwoLists(list1, list2) {
  // Your solution here
}

// Helper to create list from array
function makeList(arr) {
  let dummy = new ListNode();
  let cur = dummy;
  for (const v of arr) { cur.next = new ListNode(v); cur = cur.next; }
  return dummy.next;
}

// Helper to print list
function toArray(node) {
  const res = [];
  while (node) { res.push(node.val); node = node.next; }
  return res;
}

const l1 = makeList([1, 2, 4]);
const l2 = makeList([1, 3, 4]);
console.log(toArray(mergeTwoLists(l1, l2))); // [1, 1, 2, 3, 4, 4]`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val; this.next = next;
  }
}

function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  // Your solution here
}`,
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def merge_two_lists(list1, list2):
    # Your solution here
    pass`,
    },
    solution: {
      javascript: `function mergeTwoLists(list1, list2) {
  const dummy = new ListNode(-1);
  let current = dummy;

  while (list1 && list2) {
    if (list1.val <= list2.val) {
      current.next = list1;
      list1 = list1.next;
    } else {
      current.next = list2;
      list2 = list2.next;
    }
    current = current.next;
  }

  // Attach the remaining list
  current.next = list1 ?? list2;

  return dummy.next;
}`,
      typescript: `function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  const dummy = new ListNode(-1);
  let current: ListNode = dummy;
  while (list1 && list2) {
    if (list1.val <= list2.val) { current.next = list1; list1 = list1.next; }
    else { current.next = list2; list2 = list2.next; }
    current = current.next!;
  }
  current.next = list1 ?? list2;
  return dummy.next;
}`,
      python: `def merge_two_lists(list1, list2):
    dummy = ListNode(-1)
    current = dummy
    while list1 and list2:
        if list1.val <= list2.val:
            current.next = list1
            list1 = list1.next
        else:
            current.next = list2
            list2 = list2.next
        current = current.next
    current.next = list1 or list2
    return dummy.next`,
    },
    hints: [
      "Use a dummy head node to avoid edge cases with the result's head",
      "Compare the current node of each list — advance the pointer of the smaller one",
      "After one list runs out, attach the rest of the other",
    ],
    testCases: [
      { input: "// makeList([1,2,4]) + makeList([1,3,4])", expected: "[1,1,2,3,4,4]", description: "Standard merge" },
      { input: "mergeTwoLists(null, null)", expected: "[]", description: "Both empty" },
    ],
    eli5: "Imagine two sorted card piles face-up. Keep picking the smaller top card and adding it to your result pile. When one pile runs out, dump the rest of the other pile on top.",
    approach: `**Dummy head + two-pointer:**
1. Create a dummy node to simplify head tracking
2. While both lists have nodes:
   - Pick the smaller \`val\`, attach it to \`current.next\`
   - Advance that list's pointer AND \`current\`
3. Attach remaining nodes from whichever list is non-null`,
    complexity: { time: "O(m + n)", space: "O(1)", explanation: "We visit each node once. No extra space — we reuse existing nodes." },
    relatedConcepts: ["Dummy head technique", "Two-pointer pattern", "Merge Sort (merge step)", "K-way merge"],
  },
  {
    id: "cc7",
    channelId: "react",
    title: "Build a useLocalStorage Hook",
    slug: "use-local-storage",
    difficulty: "medium",
    tags: ["react", "hooks", "state"],
    category: "Custom Hooks",
    timeEstimate: 25,
    description: `Implement a custom React hook \`useLocalStorage(key, initialValue)\` that:

1. Reads the initial value from \`localStorage\` if it exists, falling back to \`initialValue\`
2. Returns \`[value, setValue]\` like \`useState\`
3. Persists every state update to \`localStorage\` (serialized as JSON)
4. Handles JSON parse errors gracefully`,
    constraints: ["Must work with any JSON-serializable value", "Should not throw on parse errors", "Must stay in sync with localStorage across calls"],
    examples: [
      { input: 'const [count, setCount] = useLocalStorage("count", 0);', output: 'Works like useState, but persisted across page reloads', explanation: "After refresh, count is still the last saved value" },
    ],
    starterCode: {
      javascript: `import { useState } from 'react';

/**
 * @param {string} key
 * @param {any} initialValue
 * @returns {[any, Function]}
 */
function useLocalStorage(key, initialValue) {
  // Your solution here
}

// Usage example:
// function Counter() {
//   const [count, setCount] = useLocalStorage('count', 0);
//   return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
// }`,
      typescript: `import { useState } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  // Your solution here
}`,
      python: `# Not applicable — this is a React/browser concept`,
    },
    solution: {
      javascript: `import { useState } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn('useLocalStorage: failed to save', key, error);
    }
  };

  return [storedValue, setValue];
}`,
      typescript: `import { useState } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) as T : initialValue;
    } catch { return initialValue; }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const v = value instanceof Function ? value(storedValue) : value;
      setStoredValue(v);
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch (e) { console.warn('useLocalStorage:', key, e); }
  };

  return [storedValue, setValue];
}`,
      python: `# Not applicable — this is a React/browser API`,
    },
    hints: [
      "Initialize useState lazily (pass a function) to read localStorage only once on mount",
      "In setValue, support both direct values AND updater functions (like useState does)",
      "Wrap everything in try/catch — localStorage can be unavailable (SSR, private mode)",
    ],
    testCases: [
      { input: "// Call with key='name', default='Alice'; set to 'Bob'; check localStorage.getItem('name')", expected: '"Bob"', description: "Persists to localStorage" },
    ],
    eli5: "It's like a sticky note on your laptop. Even when you close and reopen the app, the sticky note is still there. The hook reads the sticky note when it starts, and updates it every time you change the value.",
    approach: `**Lazy init + wrapped setter:**
1. \`useState(() => { ... })\` — lazy initializer reads localStorage once
2. \`setValue\` wraps React's setter AND calls \`localStorage.setItem\`
3. Support functional updates: \`setValue(prev => prev + 1)\`
4. Wrap all I/O in try/catch for SSR/private mode safety`,
    complexity: { time: "O(n)", space: "O(n)", explanation: "n = serialized size of the value. JSON.stringify/parse is linear in value size." },
    relatedConcepts: ["useState lazy initializer", "JSON.stringify/parse", "localStorage API", "Custom hook patterns"],
  },
  {
    id: "cc8",
    channelId: "system-design",
    title: "Implement an LRU Cache",
    slug: "lru-cache",
    difficulty: "medium",
    tags: ["cs", "data-structures", "cache"],
    category: "Data Structures",
    timeEstimate: 35,
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) Cache**.

Implement \`LRUCache\` with:
- \`LRUCache(capacity)\` — Initialize with positive capacity
- \`get(key)\` — Return value if key exists, else return \`-1\`. Mark as recently used.
- \`put(key, value)\` — Insert or update the key. If capacity exceeded, evict the least recently used key.

Both operations must run in **O(1)** average time.`,
    constraints: ["1 ≤ capacity ≤ 3000", "0 ≤ key ≤ 10⁴", "get/put must be O(1) average"],
    examples: [
      { input: 'const cache = new LRUCache(2);\ncache.put(1, 1);\ncache.put(2, 2);\ncache.get(1);    // 1\ncache.put(3, 3); // evicts key 2\ncache.get(2);    // -1', output: 'get(1)→1, get(2)→-1', explanation: "Key 2 was LRU when key 3 was inserted" },
    ],
    starterCode: {
      javascript: `class LRUCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    // Your implementation here
  }

  /**
   * @param {number} key
   * @return {number}
   */
  get(key) {
    // Your implementation here
  }

  /**
   * @param {number} key
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    // Your implementation here
  }
}

const cache = new LRUCache(2);
cache.put(1, 1); cache.put(2, 2);
console.log(cache.get(1));    // 1
cache.put(3, 3);               // evicts key 2
console.log(cache.get(2));    // -1`,
      typescript: `class LRUCache {
  constructor(capacity: number) {}
  get(key: number): number { return -1; }
  put(key: number, value: number): void {}
}`,
      python: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        # Your implementation here
        pass

    def get(self, key: int) -> int:
        # Your implementation here
        pass

    def put(self, key: int, value: int) -> None:
        # Your implementation here
        pass`,
    },
    solution: {
      javascript: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key → value, insertion order = recency
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    // Move to end (most recent)
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    // Evict LRU (first entry)
    if (this.map.size > this.capacity) {
      const lruKey = this.map.keys().next().value;
      this.map.delete(lruKey);
    }
  }
}`,
      typescript: `class LRUCache {
  private capacity: number;
  private map: Map<number, number>;
  constructor(capacity: number) { this.capacity = capacity; this.map = new Map(); }
  get(key: number): number {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key)!;
    this.map.delete(key); this.map.set(key, val);
    return val;
  }
  put(key: number, value: number): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) this.map.delete(this.map.keys().next().value!);
  }
}`,
      python: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)  # mark as recently used
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)  # remove LRU (first item)`,
    },
    hints: [
      "JavaScript's Map preserves insertion order — use that to track recency",
      "On get: delete the key and re-insert it (moves to end = most recent)",
      "On put exceeding capacity: delete the FIRST key in the Map (= least recently used)",
    ],
    testCases: [
      { input: "put(1,1) put(2,2) get(1) put(3,3) get(2)", expected: "get(1)=1, get(2)=-1", description: "Basic eviction" },
    ],
    eli5: "Imagine a small whiteboard (capacity=2). You write new things on the right. When someone reads something, you erase it and rewrite it on the right (most recent). When the board is full, you erase the leftmost thing (least recently used).",
    approach: `**Map with insertion order trick:**
JS's \`Map\` maintains insertion order. "Most recently used" = last inserted.
- \`get\`: delete + re-insert = move to back (O(1))
- \`put\`: re-insert if exists; evict \`map.keys().next().value\` (first = LRU)

For interview: mention the **HashMap + Doubly Linked List** classic approach for languages without ordered maps.`,
    complexity: { time: "O(1)", space: "O(capacity)", explanation: "Map operations (get, set, delete, first key) are all O(1) amortized. Space limited to capacity entries." },
    relatedConcepts: ["HashMap + Doubly Linked List", "OrderedDict (Python)", "Cache eviction policies (LFU, FIFO)", "Redis cache patterns"],
  },
  {
    id: "cc9",
    channelId: "algorithms",
    title: "Binary Search",
    slug: "binary-search",
    difficulty: "easy",
    tags: ["algorithms", "searching", "big-o"],
    category: "Searching",
    timeEstimate: 10,
    description: `Given a **sorted** array of integers and a target value, return the **index** of the target using binary search. Return \`-1\` if the target is not found.

Your solution must run in **O(log n)** time.`,
    constraints: ["1 ≤ nums.length ≤ 10⁴", "All values are distinct", "Array is sorted in ascending order"],
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // Your solution here
}

console.log(search([-1,0,3,5,9,12], 9));  // 4
console.log(search([-1,0,3,5,9,12], 2));  // -1`,
      typescript: `function search(nums: number[], target: number): number {
  // Your solution here
}`,
      python: `def search(nums, target):
    # Your solution here
    pass`,
    },
    solution: {
      javascript: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);  // or (lo + hi) >> 1

    if (nums[mid] === target) return mid;
    if (nums[mid] < target)  lo = mid + 1;
    else                     hi = mid - 1;
  }

  return -1;
}`,
      typescript: `function search(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    nums[mid] < target ? lo = mid + 1 : hi = mid - 1;
  }
  return -1;
}`,
      python: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    },
    hints: [
      "Maintain left (lo) and right (hi) pointers",
      "Check the midpoint: if too small, move lo right; if too large, move hi left",
      "Loop while lo <= hi (not just <)",
    ],
    testCases: [
      { input: "search([-1,0,3,5,9,12], 9)", expected: "4", description: "Target found" },
      { input: "search([-1,0,3,5,9,12], 2)", expected: "-1", description: "Target missing" },
      { input: "search([5], 5)", expected: "0", description: "Single element" },
    ],
    eli5: "Guessing a number 1–100: guess 50. Too high? Now try 1–49, guess 25. Too low? Try 26–49. You halve the search space every guess — you'll find it in at most 7 guesses!",
    approach: `**Classic binary search:**
1. \`lo = 0\`, \`hi = n - 1\`
2. While \`lo <= hi\`:
   - \`mid = (lo + hi) >> 1\`
   - If \`nums[mid] === target\` → return \`mid\`
   - If \`nums[mid] < target\` → \`lo = mid + 1\` (search right half)
   - Else → \`hi = mid - 1\` (search left half)
3. Return \`-1\` if not found`,
    complexity: { time: "O(log n)", space: "O(1)", explanation: "Each iteration halves the search space. No extra memory needed." },
    relatedConcepts: ["Binary Search on answer", "Lower/upper bound variants", "Rotated sorted array search", "Search in 2D matrix"],
  },
];
