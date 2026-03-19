export type AnswerSection =
  | { type: "short"; content: string }
  | { type: "code"; language: string; content: string; filename?: string }
  | { type: "diagram"; title: string; description: string; svgContent: string }
  | { type: "video"; title: string; url: string; description: string }
  | { type: "related"; topics: { title: string; description: string; tag: string }[] }
  | { type: "eli5"; content: string };

export interface Question {
  id: string;
  number: number;
  title: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  votes: number;
  views: string;
  askedBy: string;
  askedAt: string;
  sections: AnswerSection[];
}

export const questions: Question[] = [
  {
    id: "q1",
    number: 1,
    title: "How does the JavaScript Event Loop work?",
    tags: ["javascript", "async", "event-loop"],
    difficulty: "intermediate",
    votes: 248,
    views: "12.4k",
    askedBy: "devlearner",
    askedAt: "2024-01-15",
    sections: [
      {
        type: "short",
        content: "The **event loop** is the mechanism that allows JavaScript to perform non-blocking operations. It continuously checks the **call stack** and the **task queue**, pushing tasks from the queue to the stack when the stack is empty.\n\nKey components:\n- **Call Stack**: Executes synchronous code one frame at a time\n- **Web APIs**: Handle async operations (setTimeout, fetch, DOM events)\n- **Microtask Queue**: Higher priority — holds Promise callbacks\n- **Macrotask Queue**: Lower priority — holds setTimeout, setInterval callbacks"
      },
      {
        type: "diagram",
        title: "Event Loop Architecture",
        description: "The flow of execution in the JavaScript runtime",
        svgContent: `<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <rect x="10" y="20" width="120" height="140" rx="6" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="70" y="42" text-anchor="middle" fill="#e3b341" font-size="11" font-weight="700">CALL STACK</text>
  <rect x="20" y="52" width="100" height="28" rx="4" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="70" y="71" text-anchor="middle" fill="#79c0ff" font-size="10">console.log()</text>
  <rect x="20" y="86" width="100" height="28" rx="4" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="70" y="105" text-anchor="middle" fill="#79c0ff" font-size="10">main()</text>

  <rect x="160" y="20" width="140" height="140" rx="6" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="230" y="42" text-anchor="middle" fill="#ffa657" font-size="11" font-weight="700">WEB APIs</text>
  <rect x="170" y="52" width="120" height="22" rx="4" fill="#ffa65722" stroke="#ffa65755"/>
  <text x="230" y="67" text-anchor="middle" fill="#ffa657" font-size="10">setTimeout(cb, 1000)</text>
  <rect x="170" y="80" width="120" height="22" rx="4" fill="#ffa65722" stroke="#ffa65755"/>
  <text x="230" y="95" text-anchor="middle" fill="#ffa657" font-size="10">fetch('/api')</text>
  <rect x="170" y="108" width="120" height="22" rx="4" fill="#ffa65722" stroke="#ffa65755"/>
  <text x="230" y="123" text-anchor="middle" fill="#ffa657" font-size="10">DOM Events</text>

  <rect x="320" y="20" width="160" height="60" rx="6" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="400" y="42" text-anchor="middle" fill="#56d364" font-size="11" font-weight="700">MICROTASK QUEUE</text>
  <text x="400" y="62" text-anchor="middle" fill="#8b949e" font-size="10">Promise.then() callbacks</text>

  <rect x="320" y="100" width="160" height="60" rx="6" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="400" y="122" text-anchor="middle" fill="#d2a8ff" font-size="11" font-weight="700">MACROTASK QUEUE</text>
  <text x="400" y="142" text-anchor="middle" fill="#8b949e" font-size="10">setTimeout callbacks</text>

  <rect x="140" y="210" width="220" height="60" rx="8" fill="#161b22" stroke="#388bfd" stroke-width="2"/>
  <text x="250" y="235" text-anchor="middle" fill="#388bfd" font-size="13" font-weight="700">EVENT LOOP</text>
  <text x="250" y="255" text-anchor="middle" fill="#8b949e" font-size="10">Stack empty? → Process microtasks first</text>

  <path d="M310 240 L485 160" stroke="#56d364" stroke-width="1.5" fill="none" marker-end="url(#arrow)" stroke-dasharray="4,3"/>
  <path d="M440 160 L440 230 L360 240" stroke="#d2a8ff" stroke-width="1.5" fill="none" marker-end="url(#arrow)" stroke-dasharray="4,3"/>
  <path d="M140 230 L70 165" stroke="#388bfd" stroke-width="1.5" fill="none" marker-end="url(#arrow)"/>

  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b949e"/>
    </marker>
  </defs>
</svg>`
      },
      {
        type: "code",
        language: "javascript",
        filename: "event-loop-demo.js",
        content: `console.log('1: Sync start');

setTimeout(() => console.log('4: setTimeout (macrotask)'), 0);

Promise.resolve()
  .then(() => console.log('3: Promise.then (microtask)'));

console.log('2: Sync end');

// Output order:
// 1: Sync start
// 2: Sync end
// 3: Promise.then (microtask)   ← microtasks run before macrotasks
// 4: setTimeout (macrotask)`
      },
      {
        type: "eli5",
        content: "Imagine a **chef** (call stack) who can only cook one dish at a time. When an order takes long (like waiting for ingredients — that's async), the chef hands it to a **helper** (Web API). The helper signals back when ready. The chef checks a **VIP list** (microtasks / Promises) before the **regular queue** (macrotasks / setTimeout). So Promises always cut the line!"
      }
    ]
  },
  {
    id: "q2",
    number: 2,
    title: "What are JavaScript closures and when should you use them?",
    tags: ["javascript", "closures"],
    difficulty: "intermediate",
    votes: 192,
    views: "9.1k",
    askedBy: "jsdev42",
    askedAt: "2024-01-22",
    sections: [
      {
        type: "short",
        content: "A **closure** is a function that retains access to its **lexical scope** — variables from the outer function — even after the outer function has finished executing.\n\nClosures enable:\n- **Data encapsulation** — private variables\n- **Factory functions** — generate customized functions\n- **Memoization** — cache expensive computations\n- **Partial application / currying**"
      },
      {
        type: "code",
        language: "javascript",
        filename: "closures.js",
        content: `// Counter factory — closure over 'count'
function makeCounter(start = 0) {
  let count = start; // private variable

  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}

const counter = makeCounter(10);
counter.increment(); // 11
counter.increment(); // 12
counter.decrement(); // 11
counter.value();     // 11

// Classic closure pitfall with loops
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // logs 3, 3, 3 ❌
}

// Fix: use let (block-scoped) or IIFE
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // logs 0, 1, 2 ✅
}`
      },
      {
        type: "related",
        topics: [
          { title: "Lexical Scope", description: "How JavaScript determines variable access at write time, not run time", tag: "javascript" },
          { title: "IIFE Pattern", description: "Immediately Invoked Function Expressions for module-like isolation", tag: "javascript" },
          { title: "Module Pattern", description: "Use closures to create private/public APIs without ES modules", tag: "javascript" }
        ]
      }
    ]
  },
  {
    id: "q3",
    number: 3,
    title: "What are React Hooks and what problem do they solve?",
    tags: ["react", "hooks", "state"],
    difficulty: "beginner",
    votes: 310,
    views: "18.2k",
    askedBy: "reactnewbie",
    askedAt: "2024-02-01",
    sections: [
      {
        type: "short",
        content: "**Hooks** let you use state and other React features in **function components**, replacing the need for class components.\n\nCore hooks:\n- `useState` — local component state\n- `useEffect` — side effects (data fetching, subscriptions)\n- `useContext` — consume React context\n- `useRef` — mutable ref / DOM access\n- `useMemo` / `useCallback` — performance optimization\n- `useReducer` — complex state logic"
      },
      {
        type: "code",
        language: "tsx",
        filename: "hooks-example.tsx",
        content: `import { useState, useEffect, useCallback } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cleanup
  }, [value, delay]);

  return debounced;
}

function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery) return setResults([]);
    fetch(\`/api/search?q=\${debouncedQuery}\`)
      .then(r => r.json())
      .then(setResults);
  }, [debouncedQuery]);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ul>{results.map(r => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}`
      },
      {
        type: "eli5",
        content: "Before hooks, React components needed to be **class-based** to have memory (state). Hooks gave **function components** superpowers — `useState` is like a sticky note the component can read and update, `useEffect` is like saying 'do this whenever something changes'."
      }
    ]
  },
  {
    id: "q4",
    number: 4,
    title: "How does React reconciliation (the 'diffing' algorithm) work?",
    tags: ["react", "performance"],
    difficulty: "advanced",
    votes: 175,
    views: "7.8k",
    askedBy: "perf_enjoyer",
    askedAt: "2024-02-10",
    sections: [
      {
        type: "short",
        content: "React's **reconciliation** algorithm compares the previous and new virtual DOM trees to determine the minimum number of DOM operations needed.\n\nKey assumptions that make it O(n):\n1. **Different element types** → unmount old, mount new subtree\n2. **Same element type** → update props in place, recurse on children\n3. **`key` prop** → identifies stable list items across re-renders\n\nReact 18 introduces **concurrent rendering** — work can be split, paused, and resumed."
      },
      {
        type: "code",
        language: "tsx",
        filename: "reconciliation.tsx",
        content: `// BAD: Using index as key — breaks reconciliation
{items.map((item, i) => (
  <TodoItem key={i} todo={item} /> // ❌ React can't track identity
))}

// GOOD: Use stable unique IDs
{items.map(item => (
  <TodoItem key={item.id} todo={item} /> // ✅ React can diff correctly
))}

// Conditional rendering: different element types = full remount
function Widget({ isLoggedIn }: { isLoggedIn: boolean }) {
  // React unmounts <GuestView> and mounts <UserView> when isLoggedIn changes
  return isLoggedIn ? <UserView /> : <GuestView />;
}`
      },
      {
        type: "related",
        topics: [
          { title: "React Fiber", description: "The reimplemented reconciler that enables concurrent features", tag: "react" },
          { title: "useMemo & useCallback", description: "Prevent unnecessary reconciliation in child components", tag: "react" },
          { title: "React.memo", description: "Skip re-rendering when props haven't changed", tag: "performance" }
        ]
      }
    ]
  },
  {
    id: "q5",
    number: 5,
    title: "What is Big-O notation and how do you analyze algorithm complexity?",
    tags: ["algorithms", "big-o"],
    difficulty: "beginner",
    votes: 422,
    views: "24.6k",
    askedBy: "algo_starter",
    askedAt: "2024-02-15",
    sections: [
      {
        type: "short",
        content: "**Big-O notation** describes how an algorithm's runtime or space grows as input size **n** approaches infinity.\n\nCommon complexities (best → worst):\n- **O(1)** — Constant: array index lookup\n- **O(log n)** — Logarithmic: binary search\n- **O(n)** — Linear: single loop\n- **O(n log n)** — Merge sort, quicksort average\n- **O(n²)** — Quadratic: nested loops\n- **O(2ⁿ)** — Exponential: naive recursion"
      },
      {
        type: "code",
        language: "javascript",
        filename: "big-o-examples.js",
        content: `// O(1) — constant time
function getFirst(arr) { return arr[0]; }

// O(n) — linear scan
function findMax(arr) {
  let max = arr[0];
  for (const n of arr) if (n > max) max = n;
  return max;
}

// O(n²) — nested loops (bubble sort)
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length - i - 1; j++)
      if (arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
  return arr;
}

// O(log n) — binary search
function binarySearch(sorted, target) {
  let lo = 0, hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] === target) return mid;
    sorted[mid] < target ? lo = mid + 1 : hi = mid - 1;
  }
  return -1;
}`
      },
      {
        type: "eli5",
        content: "Imagine looking for a name in a phone book. **O(1)** is knowing exactly which page it's on. **O(n)** is checking every page one by one. **O(log n)** is opening to the middle, checking if your name is before/after, then halving the search each time — *much* faster for big books!"
      }
    ]
  },
  {
    id: "q6",
    number: 6,
    title: "Explain the TCP/IP model and how data travels across the internet",
    tags: ["networking", "http", "dns"],
    difficulty: "intermediate",
    votes: 156,
    views: "6.3k",
    askedBy: "netops_jen",
    askedAt: "2024-02-20",
    sections: [
      {
        type: "short",
        content: "The **TCP/IP model** has 4 layers (compared to OSI's 7):\n\n1. **Application** (HTTP, DNS, SMTP) — user-facing protocols\n2. **Transport** (TCP, UDP) — end-to-end delivery, ports\n3. **Internet** (IP, ICMP) — logical addressing, routing\n4. **Network Access** (Ethernet, Wi-Fi) — physical transmission\n\n**TCP** guarantees ordered, reliable delivery. **UDP** is faster but unreliable — used for video streaming, gaming, DNS."
      },
      {
        type: "diagram",
        title: "TCP Three-Way Handshake",
        description: "How a TCP connection is established before data flows",
        svgContent: `<svg viewBox="0 0 460 220" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <text x="90" y="25" text-anchor="middle" fill="#79c0ff" font-size="13" font-weight="700">CLIENT</text>
  <line x1="90" y1="35" x2="90" y2="200" stroke="#388bfd" stroke-width="2"/>

  <text x="370" y="25" text-anchor="middle" fill="#56d364" font-size="13" font-weight="700">SERVER</text>
  <line x1="370" y1="35" x2="370" y2="200" stroke="#56d364" stroke-width="2"/>

  <line x1="90" y1="65" x2="360" y2="95" stroke="#e3b341" stroke-width="1.5" marker-end="url(#earrow)"/>
  <text x="225" y="73" text-anchor="middle" fill="#e3b341" font-size="11" font-weight="600">SYN  (seq=x)</text>

  <line x1="370" y1="110" x2="100" y2="140" stroke="#ffa657" stroke-width="1.5" marker-end="url(#earrow)"/>
  <text x="225" y="121" text-anchor="middle" fill="#ffa657" font-size="11" font-weight="600">SYN-ACK  (seq=y, ack=x+1)</text>

  <line x1="90" y1="155" x2="360" y2="185" stroke="#56d364" stroke-width="1.5" marker-end="url(#earrow)"/>
  <text x="225" y="165" text-anchor="middle" fill="#56d364" font-size="11" font-weight="600">ACK  (ack=y+1)</text>

  <text x="230" y="212" text-anchor="middle" fill="#8b949e" font-size="10">Connection established — data can now flow</text>

  <defs>
    <marker id="earrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b949e"/>
    </marker>
  </defs>
</svg>`
      },
      {
        type: "related",
        topics: [
          { title: "DNS Resolution", description: "How domain names are translated to IP addresses", tag: "dns" },
          { title: "HTTP/2 vs HTTP/3", description: "Multiplexing, QUIC, and modern protocol improvements", tag: "http" },
          { title: "TLS Handshake", description: "How HTTPS establishes an encrypted connection", tag: "networking" }
        ]
      }
    ]
  },
  {
    id: "q7",
    number: 7,
    title: "What is the CAP theorem in distributed systems?",
    tags: ["cs", "distributed"],
    difficulty: "advanced",
    votes: 287,
    views: "11.9k",
    askedBy: "sysarch_pro",
    askedAt: "2024-03-01",
    sections: [
      {
        type: "short",
        content: "The **CAP theorem** states that a distributed system can only guarantee **two of three** properties simultaneously:\n\n- **C — Consistency**: Every read gets the most recent write\n- **A — Availability**: Every request gets a (non-error) response\n- **P — Partition Tolerance**: System continues operating despite network splits\n\nIn practice, **P is unavoidable** in real networks, so the trade-off is **CP vs AP**:\n- **CP** (e.g. HBase, Zookeeper): Sacrifices availability for consistency\n- **AP** (e.g. Cassandra, DynamoDB): Sacrifices consistency for availability\n- **CA** is impossible in distributed systems"
      },
      {
        type: "code",
        language: "javascript",
        filename: "cap-patterns.js",
        content: `// AP pattern — optimistic updates, eventual consistency
// Used by systems like Cassandra, DynamoDB

async function updateUserProfile(userId, data) {
  // Write to local node immediately (available)
  await localNode.write(userId, data);

  // Propagate to other nodes asynchronously
  // If a partition occurs, nodes may diverge temporarily
  broadcastAsync(otherNodes, userId, data);

  return { ok: true }; // Always responds
}

// CP pattern — strong consistency via quorum
// Used by systems like Zookeeper, etcd

async function updateWithQuorum(key, value) {
  const majority = Math.ceil(nodes.length / 2) + 1;
  const acks = await Promise.allSettled(
    nodes.map(n => n.write(key, value))
  );

  const succeeded = acks.filter(r => r.status === 'fulfilled').length;
  if (succeeded < majority) throw new Error('Quorum not reached');

  return { ok: true };
}`
      },
      {
        type: "eli5",
        content: "Imagine a **bank with 3 branches** during a storm (network partition). A **CP bank** locks all transactions until branches can sync — customers wait but never get wrong info. An **AP bank** lets transactions proceed at each branch, but after the storm, one branch might not know about a transfer from another. You pick: *wait for accuracy* or *stay open and sync later*."
      }
    ]
  },
  {
    id: "q8",
    number: 8,
    title: "CSS Flexbox vs CSS Grid — when to use which?",
    tags: ["cs", "oop"],
    difficulty: "beginner",
    votes: 198,
    views: "14.2k",
    askedBy: "frontend_hiro",
    askedAt: "2024-03-05",
    sections: [
      {
        type: "short",
        content: "**Flexbox** is one-dimensional (row **or** column). **Grid** is two-dimensional (rows **and** columns).\n\n**Use Flexbox for:**\n- Navigation bars, button groups\n- Centering a single item\n- Distributing space along one axis\n\n**Use Grid for:**\n- Page layouts, card grids\n- Precise two-axis placement\n- Overlapping elements\n\n**Rule of thumb:** If you're thinking about layout in one direction → Flex. Two directions → Grid. They're also composable — use Grid for the page, Flex for components within cells."
      },
      {
        type: "code",
        language: "css",
        filename: "flex-vs-grid.css",
        content: `/* Flexbox — horizontal nav */
.navbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
}
.navbar .logo { margin-right: auto; } /* push rest right */

/* Grid — responsive card layout */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* Grid — holy grail layout */
.page {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 260px 1fr;
  grid-template-rows: 52px 1fr 48px;
  height: 100vh;
}`
      },
      {
        type: "related",
        topics: [
          { title: "CSS Grid Areas", description: "Name grid regions with template-areas for readable layouts", tag: "cs" },
          { title: "Flexbox Alignment", description: "justify-content, align-items, align-self deep dive", tag: "cs" },
          { title: "Container Queries", description: "Respond to parent container size, not viewport", tag: "cs" }
        ]
      }
    ]
  }
];
