export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  codeExample?: { language: string; code: string };
}

export type CardStatus = "unseen" | "known" | "reviewing" | "hard";

export const flashcards: Flashcard[] = [
  {
    id: "fc1",
    front: "What is hoisting in JavaScript?",
    back: "Hoisting moves variable and function declarations to the top of their scope before execution. `var` declarations are hoisted (but not initialized — undefined until assigned). `let`/`const` are hoisted but sit in a 'Temporal Dead Zone' until their declaration line.",
    hint: "Think about what happens before the code runs",
    tags: ["javascript"],
    difficulty: "beginner",
    category: "JavaScript",
    codeExample: {
      language: "javascript",
      code: `console.log(x); // undefined (hoisted var)
var x = 5;

console.log(y); // ReferenceError (TDZ)
let y = 10;

greet(); // Works! Function declarations are fully hoisted
function greet() { console.log('Hello'); }`
    }
  },
  {
    id: "fc2",
    front: "What is the difference between `==` and `===` in JavaScript?",
    back: "`==` performs **type coercion** before comparing. `===` checks value AND type — no coercion. Always prefer `===` to avoid surprising behavior.",
    tags: ["javascript", "types"],
    difficulty: "beginner",
    category: "JavaScript",
    codeExample: {
      language: "javascript",
      code: `0 == false  // true  (coercion)
0 === false // false (different types)
'' == false // true  (coercion)
null == undefined // true (special case)
null === undefined // false`
    }
  },
  {
    id: "fc3",
    front: "What is a Promise in JavaScript?",
    back: "A **Promise** is an object representing the eventual completion or failure of an async operation. States: **pending** → **fulfilled** or **rejected**. Use `.then()`, `.catch()`, `.finally()` or `async/await`.",
    tags: ["javascript", "async"],
    difficulty: "intermediate",
    category: "JavaScript"
  },
  {
    id: "fc4",
    front: "What does `Array.prototype.reduce()` do?",
    back: "`reduce(callback, initialValue)` iterates over an array and accumulates a single value. The callback receives `(accumulator, currentValue, index, array)`. Great for summing, grouping, or building objects from arrays.",
    tags: ["javascript"],
    difficulty: "intermediate",
    category: "JavaScript",
    codeExample: {
      language: "javascript",
      code: `const sum = [1,2,3,4].reduce((acc, n) => acc + n, 0); // 10

const grouped = ['a','b','a','c'].reduce((acc, x) => {
  acc[x] = (acc[x] || 0) + 1;
  return acc;
}, {}); // { a:2, b:1, c:1 }`
    }
  },
  {
    id: "fc5",
    front: "What is the `useEffect` cleanup function?",
    back: "The function returned from `useEffect` runs **before** the next effect and when the component **unmounts**. Use it to cancel subscriptions, clear timers, or abort fetch requests to prevent memory leaks.",
    tags: ["react", "hooks"],
    difficulty: "intermediate",
    category: "React",
    codeExample: {
      language: "tsx",
      code: `useEffect(() => {
  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal })
    .then(r => r.json()).then(setData);

  return () => controller.abort(); // cleanup
}, [id]);`
    }
  },
  {
    id: "fc6",
    front: "When should you use `useMemo` vs `useCallback`?",
    back: "`useMemo` memoizes a **computed value** — use when a calculation is expensive. `useCallback` memoizes a **function reference** — use when passing callbacks to optimized children (`React.memo`). Both take a dependency array.",
    tags: ["react", "performance"],
    difficulty: "advanced",
    category: "React"
  },
  {
    id: "fc7",
    front: "What is React's Context API used for?",
    back: "Context provides a way to pass data through the component tree **without prop drilling**. Good for: theme, locale, auth state, user preferences. Not ideal for frequently changing data — prefer state management libraries for that.",
    tags: ["react", "state"],
    difficulty: "intermediate",
    category: "React"
  },
  {
    id: "fc8",
    front: "What is the time complexity of quicksort?",
    back: "**Best/Average: O(n log n)** — when pivot divides array roughly in half each time. **Worst: O(n²)** — when pivot is always min/max (sorted array). In practice, quicksort is fast due to cache efficiency. Often uses median-of-three to avoid worst case.",
    tags: ["algorithms", "sorting"],
    difficulty: "intermediate",
    category: "Algorithms"
  },
  {
    id: "fc9",
    front: "Explain a hash table and its time complexity",
    back: "A **hash table** maps keys to values using a hash function. **Average O(1)** for get/set/delete. **Worst O(n)** with many collisions. Collisions resolved via chaining (linked lists) or open addressing. Used in objects, Maps, Sets.",
    tags: ["algorithms", "data-structures"],
    difficulty: "intermediate",
    category: "Algorithms"
  },
  {
    id: "fc10",
    front: "What is dynamic programming?",
    back: "**Dynamic programming** solves complex problems by breaking them into overlapping subproblems and storing solutions (memoization or tabulation) to avoid redundant work. Key insight: **optimal substructure** + **overlapping subproblems**. Classic examples: Fibonacci, longest common subsequence, 0-1 knapsack.",
    tags: ["algorithms", "dynamic-programming"],
    difficulty: "advanced",
    category: "Algorithms"
  },
  {
    id: "fc11",
    front: "What is BFS vs DFS in graph traversal?",
    back: "**BFS** (Breadth-First Search): visits nodes level by level using a queue. Good for shortest path in unweighted graphs. **DFS** (Depth-First Search): goes deep along one path using a stack (or recursion). Good for cycle detection, topological sort, connected components.",
    tags: ["algorithms", "graphs", "trees"],
    difficulty: "intermediate",
    category: "Algorithms"
  },
  {
    id: "fc12",
    front: "What is the OSI model and its 7 layers?",
    back: "1. Physical — bits/signals\n2. Data Link — MAC addresses, Ethernet\n3. Network — IP routing\n4. Transport — TCP/UDP, ports\n5. Session — connection lifecycle\n6. Presentation — encoding, encryption\n7. Application — HTTP, DNS, SMTP\n\nMnemonic: **P**lease **D**o **N**ot **T**hrow **S**ausage **P**izza **A**way",
    tags: ["networking"],
    difficulty: "intermediate",
    category: "Networking"
  },
  {
    id: "fc13",
    front: "What is the difference between TCP and UDP?",
    back: "**TCP**: connection-oriented, reliable, ordered, error-checked. Uses 3-way handshake. Slower. Used for: HTTP, email, file transfer.\n\n**UDP**: connectionless, unreliable, no ordering guarantee. Faster/lower overhead. Used for: video streaming, DNS, gaming, VoIP.",
    tags: ["networking"],
    difficulty: "beginner",
    category: "Networking"
  },
  {
    id: "fc14",
    front: "What is SOLID in object-oriented design?",
    back: "**S** — Single Responsibility: one class, one reason to change\n**O** — Open/Closed: open for extension, closed for modification\n**L** — Liskov Substitution: subtypes must be substitutable for base types\n**I** — Interface Segregation: clients shouldn't depend on methods they don't use\n**D** — Dependency Inversion: depend on abstractions, not concretions",
    tags: ["oop", "cs"],
    difficulty: "intermediate",
    category: "CS Fundamentals"
  },
  {
    id: "fc15",
    front: "What is the difference between a process and a thread?",
    back: "A **process** is an independent program with its own memory space, file handles, and resources. A **thread** is a lightweight unit of execution within a process, sharing memory with siblings. Context switching between processes is expensive; threads are cheaper but require synchronization (mutexes, semaphores).",
    tags: ["cs", "concurrency"],
    difficulty: "intermediate",
    category: "CS Fundamentals"
  },
  {
    id: "fc16",
    front: "What is eventual consistency?",
    back: "**Eventual consistency** means that in a distributed system, if no new updates are made, all replicas will eventually converge to the same value. It prioritizes **availability** over strong consistency (AP in CAP theorem). Examples: DNS, Cassandra, DynamoDB.",
    tags: ["distributed", "cs"],
    difficulty: "advanced",
    category: "CS Fundamentals"
  },
  {
    id: "fc17",
    front: "What is a deadlock and how do you prevent it?",
    back: "A **deadlock** occurs when two or more threads are each waiting for a resource held by the other, creating a cycle. Prevention strategies:\n1. Lock ordering — always acquire locks in same order\n2. Timeout with retry\n3. Deadlock detection + rollback\n4. Avoid nested locks when possible",
    tags: ["cs", "concurrency"],
    difficulty: "advanced",
    category: "CS Fundamentals"
  },
  {
    id: "fc18",
    front: "What is memoization?",
    back: "**Memoization** is caching the results of expensive function calls and returning the cached result when the same inputs are seen again. It trades memory for speed. A form of **dynamic programming** (top-down approach). `useMemo` in React applies this concept to component renders.",
    tags: ["algorithms", "cs"],
    difficulty: "intermediate",
    category: "Algorithms"
  },
  {
    id: "fc19",
    front: "What is prototypal inheritance in JavaScript?",
    back: "In JavaScript, objects have an internal `[[Prototype]]` link to another object. When a property isn't found on an object, JS walks up the **prototype chain** until it finds it or hits `null`. `class` syntax is syntactic sugar over this mechanism.",
    tags: ["javascript", "prototype"],
    difficulty: "intermediate",
    category: "JavaScript",
    codeExample: {
      language: "javascript",
      code: `const animal = { breathes: true };
const dog = Object.create(animal);
dog.barks = true;

dog.breathes; // true (from prototype chain)
Object.getPrototypeOf(dog) === animal; // true`
    }
  },
  {
    id: "fc20",
    front: "What is the virtual DOM in React?",
    back: "The **virtual DOM** is a lightweight in-memory representation of the real DOM. When state changes, React creates a new vDOM tree, **diffs** it against the previous one (reconciliation), and only applies the minimal required real DOM mutations. This batching and diffing makes UI updates efficient.",
    tags: ["react"],
    difficulty: "beginner",
    category: "React"
  }
];
