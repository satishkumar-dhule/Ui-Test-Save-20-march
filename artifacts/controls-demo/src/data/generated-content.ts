import type { Question } from "./questions";

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  channel: string;
  duration: string;
  views: string;
  publishedAt: string;
  relevance: string;
}

export interface SVGDiagram {
  id: string;
  title: string;
  category: string;
  svgContent: string;
}

export const svgDiagrams: SVGDiagram[] = [
  {
    id: "closures-scope",
    title: "JavaScript Closures Scope Diagram",
    category: "javascript",
    svgContent: `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <rect x="10" y="10" width="580" height="380" rx="8" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>

  <text x="300" y="35" text-anchor="middle" fill="#e3b341" font-size="14" font-weight="700">CLOSURE SCOPE CHAIN</text>

  <!-- Global Scope -->
  <rect x="180" y="60" width="240" height="70" rx="6" fill="#161b22" stroke="#56d364" stroke-width="2"/>
  <text x="300" y="82" text-anchor="middle" fill="#56d364" font-size="11" font-weight="700">GLOBAL SCOPE</text>
  <rect x="195" y="92" width="70" height="22" rx="3" fill="#56d36422" stroke="#56d36455"/>
  <text x="230" y="107" text-anchor="middle" fill="#56d364" font-size="9">makeCounter</text>
  <rect x="275" y="92" width="70" height="22" rx="3" fill="#56d36422" stroke="#56d36455"/>
  <text x="310" y="107" text-anchor="middle" fill="#56d364" font-size="9">globalVar</text>

  <!-- Outer Function Scope -->
  <rect x="150" y="160" width="300" height="90" rx="6" fill="#161b22" stroke="#388bfd" stroke-width="2"/>
  <text x="300" y="182" text-anchor="middle" fill="#388bfd" font-size="11" font-weight="700">OUTER FUNCTION SCOPE</text>
  <rect x="165" y="195" width="80" height="22" rx="3" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="205" y="210" text-anchor="middle" fill="#79c0ff" font-size="9">let count = 0</text>
  <rect x="255" y="195" width="80" height="22" rx="3" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="295" y="210" text-anchor="middle" fill="#79c0ff" font-size="9">start = 0</text>
  <rect x="345" y="195" width="90" height="22" rx="3" fill="#ffa65722" stroke="#ffa65755"/>
  <text x="390" y="210" text-anchor="middle" fill="#ffa657" font-size="9">inner function</text>

  <!-- Inner Function (Closure) -->
  <rect x="200" y="280" width="200" height="60" rx="6" fill="#161b22" stroke="#d2a8ff" stroke-width="2"/>
  <text x="300" y="302" text-anchor="middle" fill="#d2a8ff" font-size="11" font-weight="700">CLOSURE (inner)</text>
  <text x="300" y="322" text-anchor="middle" fill="#c9d1d9" font-size="9">accesses: count, start, globalVar</text>

  <!-- Scope chain arrows -->
  <path d="M300 130 L300 155" stroke="#56d364" stroke-width="1.5" fill="none" marker-end="url(#arrow-green)"/>
  <path d="M300 250 L300 275" stroke="#388bfd" stroke-width="1.5" fill="none" marker-end="url(#arrow-blue)"/>

  <!-- Scope chain label -->
  <text x="330" y="200" fill="#8b949e" font-size="8" transform="rotate(90, 330, 200)">lexical scope chain</text>

  <!-- Legend -->
  <rect x="480" y="160" width="100" height="90" rx="4" fill="#21262d" stroke="#30363d"/>
  <text x="530" y="178" text-anchor="middle" fill="#8b949e" font-size="9" font-weight="600">LEGEND</text>
  <rect x="490" y="188" width="12" height="12" rx="2" fill="#56d36422" stroke="#56d364"/>
  <text x="510" y="198" fill="#56d364" font-size="8">Global</text>
  <rect x="490" y="208" width="12" height="12" rx="2" fill="#388bfd22" stroke="#388bfd"/>
  <text x="510" y="218" fill="#388bfd" font-size="8">Outer</text>
  <rect x="490" y="228" width="12" height="12" rx="2" fill="#d2a8ff22" stroke="#d2a8ff"/>
  <text x="510" y="238" fill="#d2a8ff" font-size="8">Closure</text>

  <defs>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#56d364"/>
    </marker>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#388bfd"/>
    </marker>
  </defs>
</svg>`,
  },
  {
    id: "react-lifecycle",
    title: "React Component Lifecycle",
    category: "react",
    svgContent: `<svg viewBox="0 0 600 350" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <rect x="10" y="10" width="580" height="330" rx="8" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="300" y="35" text-anchor="middle" fill="#e3b341" font-size="14" font-weight="700">REACT COMPONENT LIFECYCLE</text>

  <!-- Mount Phase -->
  <rect x="30" y="55" width="170" height="260" rx="6" fill="#161b22" stroke="#56d364" stroke-width="2"/>
  <text x="115" y="78" text-anchor="middle" fill="#56d364" font-size="11" font-weight="700">MOUNT</text>
  
  <rect x="45" y="95" width="140" height="30" rx="4" fill="#56d36422" stroke="#56d36455"/>
  <text x="115" y="114" text-anchor="middle" fill="#c9d1d9" font-size="9">constructor()</text>
  
  <rect x="45" y="135" width="140" height="30" rx="4" fill="#56d36422" stroke="#56d36455"/>
  <text x="115" y="154" text-anchor="middle" fill="#c9d1d9" font-size="9">render()</text>
  
  <rect x="45" y="175" width="140" height="30" rx="4" fill="#56d36422" stroke="#56d36455"/>
  <text x="115" y="194" text-anchor="middle" fill="#c9d1d9" font-size="9">componentDidMount()</text>

  <!-- Update Phase -->
  <rect x="215" y="55" width="170" height="260" rx="6" fill="#161b22" stroke="#388bfd" stroke-width="2"/>
  <text x="300" y="78" text-anchor="middle" fill="#388bfd" font-size="11" font-weight="700">UPDATE</text>
  
  <rect x="230" y="95" width="140" height="30" rx="4" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="300" y="114" text-anchor="middle" fill="#c9d1d9" font-size="9">setState()</text>
  
  <rect x="230" y="135" width="140" height="30" rx="4" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="300" y="154" text-anchor="middle" fill="#c9d1d9" font-size="9">render()</text>
  
  <rect x="230" y="175" width="140" height="30" rx="4" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="300" y="194" text-anchor="middle" fill="#c9d1d9" font-size="9">componentDidUpdate()</text>

  <!-- Unmount Phase -->
  <rect x="400" y="55" width="170" height="260" rx="6" fill="#161b22" stroke="#ffa657" stroke-width="2"/>
  <text x="485" y="78" text-anchor="middle" fill="#ffa657" font-size="11" font-weight="700">UNMOUNT</text>
  
  <rect x="415" y="95" width="140" height="30" rx="4" fill="#ffa65722" stroke="#ffa65755"/>
  <text x="485" y="114" text-anchor="middle" fill="#c9d1d9" font-size="9">render()</text>
  
  <rect x="415" y="135" width="140" height="30" rx="4" fill="#ffa65722" stroke="#ffa65755"/>
  <text x="485" y="154" text-anchor="middle" fill="#c9d1d9" font-size="9">componentWillUnmount()</text>

  <!-- Hooks equivalents -->
  <rect x="30" y="250" width="540" height="55" rx="4" fill="#21262d" stroke="#d2a8ff" stroke-width="1"/>
  <text x="300" y="268" text-anchor="middle" fill="#d2a8ff" font-size="9" font-weight="600">HOOKS EQUIVALENTS</text>
  <text x="300" y="288" text-anchor="middle" fill="#8b949e" font-size="8">useState → state  |  useEffect(()=>{}, []) → componentDidMount  |  useEffect(()=>{}, [dep]) → componentDidUpdate  |  useEffect(()=>()=>{}, []) → componentWillUnmount</text>

  <!-- Arrows between phases -->
  <path d="M200 185 L215 185" stroke="#8b949e" stroke-width="1.5" fill="none" marker-end="url(#arrow-gray)"/>
  <path d="M385 185 L400 185" stroke="#8b949e" stroke-width="1.5" fill="none" marker-end="url(#arrow-gray)"/>

  <defs>
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b949e"/>
    </marker>
  </defs>
</svg>`,
  },
  {
    id: "http-request-flow",
    title: "HTTP Request/Response Flow",
    category: "networking",
    svgContent: `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <rect x="10" y="10" width="580" height="360" rx="8" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="300" y="35" text-anchor="middle" fill="#e3b341" font-size="14" font-weight="700">HTTP REQUEST/RESPONSE LIFECYCLE</text>

  <!-- Client -->
  <rect x="40" y="60" width="120" height="180" rx="6" fill="#161b22" stroke="#388bfd" stroke-width="2"/>
  <text x="100" y="85" text-anchor="middle" fill="#388bfd" font-size="11" font-weight="700">CLIENT</text>
  <text x="100" y="105" text-anchor="middle" fill="#8b949e" font-size="8">(Browser)</text>
  
  <rect x="50" y="120" width="100" height="25" rx="4" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="100" y="137" text-anchor="middle" fill="#79c0ff" font-size="8">DNS Lookup</text>
  
  <rect x="50" y="155" width="100" height="25" rx="4" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="100" y="172" text-anchor="middle" fill="#79c0ff" font-size="8">TCP Handshake</text>
  
  <rect x="50" y="190" width="100" height="25" rx="4" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="100" y="207" text-anchor="middle" fill="#79c0ff" font-size="8">TLS Handshake</text>

  <!-- Middle box -->
  <rect x="240" y="60" width="120" height="180" rx="6" fill="#161b22" stroke="#d2a8ff" stroke-width="2"/>
  <text x="300" y="85" text-anchor="middle" fill="#d2a8ff" font-size="11" font-weight="700">INTERNET</text>
  
  <rect x="250" y="120" width="100" height="25" rx="4" fill="#d2a8ff22" stroke="#d2a8ff55"/>
  <text x="300" y="137" text-anchor="middle" fill="#d2a8ff" font-size="8">Routers</text>
  
  <rect x="250" y="155" width="100" height="25" rx="4" fill="#d2a8ff22" stroke="#d2a8ff55"/>
  <text x="300" y="172" text-anchor="middle" fill="#d2a8ff" font-size="8">CDN Edge</text>
  
  <rect x="250" y="190" width="100" height="25" rx="4" fill="#d2a8ff22" stroke="#d2a8ff55"/>
  <text x="300" y="207" text-anchor="middle" fill="#d2a8ff" font-size="8">Load Balancer</text>

  <!-- Server -->
  <rect x="440" y="60" width="120" height="180" rx="6" fill="#161b22" stroke="#56d364" stroke-width="2"/>
  <text x="500" y="85" text-anchor="middle" fill="#56d364" font-size="11" font-weight="700">SERVER</text>
  
  <rect x="450" y="120" width="100" height="25" rx="4" fill="#56d36422" stroke="#56d36455"/>
  <text x="500" y="137" text-anchor="middle" fill="#56d364" font-size="8">Web Server</text>
  
  <rect x="450" y="155" width="100" height="25" rx="4" fill="#56d36422" stroke="#56d36455"/>
  <text x="500" y="172" text-anchor="middle" fill="#56d364" font-size="8">App Server</text>
  
  <rect x="450" y="190" width="100" height="25" rx="4" fill="#56d36422" stroke="#56d36455"/>
  <text x="500" y="207" text-anchor="middle" fill="#56d364" font-size="8">Database</text>

  <!-- Request arrow -->
  <path d="M160 250 L240 250" stroke="#ffa657" stroke-width="2" fill="none" marker-end="url(#arrow-orange)"/>
  <text x="200" y="242" text-anchor="middle" fill="#ffa657" font-size="8">HTTP Request</text>

  <!-- Response arrow -->
  <path d="M360 280 L440 280" stroke="#56d364" stroke-width="2" fill="none" marker-end="url(#arrow-green)"/>
  <text x="400" y="295" text-anchor="middle" fill="#56d364" font-size="8">HTTP Response</text>

  <!-- HTTP Message detail -->
  <rect x="180" y="320" width="240" height="40" rx="4" fill="#161b22" stroke="#30363d"/>
  <text x="300" y="338" text-anchor="middle" fill="#8b949e" font-size="8">GET /api/users HTTP/1.1</text>
  <text x="300" y="352" text-anchor="middle" fill="#8b949e" font-size="8">Headers: Host, Content-Type, Authorization</text>

  <defs>
    <marker id="arrow-orange" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffa657"/>
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#56d364"/>
    </marker>
  </defs>
</svg>`,
  },
  {
    id: "array-methods",
    title: "Array Methods: map, filter, reduce",
    category: "javascript",
    svgContent: `<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <rect x="10" y="10" width="580" height="300" rx="8" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="300" y="35" text-anchor="middle" fill="#e3b341" font-size="14" font-weight="700">ARRAY METHODS COMPARISON</text>

  <!-- Input Array -->
  <rect x="30" y="60" width="120" height="80" rx="6" fill="#161b22" stroke="#8b949e" stroke-width="1.5"/>
  <text x="90" y="82" text-anchor="middle" fill="#8b949e" font-size="10" font-weight="600">INPUT</text>
  <text x="90" y="100" text-anchor="middle" fill="#c9d1d9" font-size="9">[1, 2, 3, 4, 5]</text>

  <!-- Map -->
  <rect x="175" y="55" width="125" height="90" rx="6" fill="#161b22" stroke="#56d364" stroke-width="2"/>
  <text x="237" y="78" text-anchor="middle" fill="#56d364" font-size="10" font-weight="700">.map()</text>
  <text x="237" y="98" text-anchor="middle" fill="#8b949e" font-size="8">Transforms each</text>
  <text x="237" y="112" text-anchor="middle" fill="#8b949e" font-size="8">x → x * 2</text>
  <path d="M150 100 L175 100" stroke="#56d364" stroke-width="1.5" fill="none" marker-end="url(#arrow-green)"/>

  <!-- Filter -->
  <rect x="325" y="55" width="125" height="90" rx="6" fill="#161b22" stroke="#388bfd" stroke-width="2"/>
  <text x="387" y="78" text-anchor="middle" fill="#388bfd" font-size="10" font-weight="700">.filter()</text>
  <text x="387" y="98" text-anchor="middle" fill="#8b949e" font-size="8">Keeps matching</text>
  <text x="387" y="112" text-anchor="middle" fill="#8b949e" font-size="8">x → x > 2</text>
  <path d="M300 100 L325 100" stroke="#388bfd" stroke-width="1.5" fill="none" marker-end="url(#arrow-blue)"/>

  <!-- Reduce -->
  <rect x="475" y="55" width="115" height="90" rx="6" fill="#161b22" stroke="#d2a8ff" stroke-width="2"/>
  <text x="532" y="78" text-anchor="middle" fill="#d2a8ff" font-size="10" font-weight="700">.reduce()</text>
  <text x="532" y="98" text-anchor="middle" fill="#8b949e" font-size="8">Accumulates to</text>
  <text x="532" y="112" text-anchor="middle" fill="#8b949e" font-size="8">single value</text>
  <path d="M450 100 L475 100" stroke="#d2a8ff" stroke-width="1.5" fill="none" marker-end="url(#arrow-purple)"/>

  <!-- Output boxes -->
  <rect x="175" y="170" width="125" height="50" rx="4" fill="#56d36422" stroke="#56d36455"/>
  <text x="237" y="193" text-anchor="middle" fill="#56d364" font-size="9">[2, 4, 6, 8, 10]</text>
  <text x="237" y="208" text-anchor="middle" fill="#8b949e" font-size="7">same length</text>

  <rect x="325" y="170" width="125" height="50" rx="4" fill="#388bfd22" stroke="#388bfd55"/>
  <text x="387" y="193" text-anchor="middle" fill="#388bfd" font-size="9">[3, 4, 5]</text>
  <text x="387" y="208" text-anchor="middle" fill="#8b949e" font-size="7">subset</text>

  <rect x="475" y="170" width="115" height="50" rx="4" fill="#d2a8ff22" stroke="#d2a8ff55"/>
  <text x="532" y="193" text-anchor="middle" fill="#d2a8ff" font-size="9">15</text>
  <text x="532" y="208" text-anchor="middle" fill="#8b949e" font-size="7">sum = 1+2+3+4+5</text>

  <!-- Arrow down from inputs -->
  <path d="M90 140 L90 170" stroke="#8b949e" stroke-width="1.5" fill="none"/>
  <path d="M90 170 L90 195" stroke="#8b949e" stroke-width="1.5" fill="none" marker-end="url(#arrow-gray)"/>

  <!-- Use case boxes -->
  <rect x="30" y="250" width="540" height="45" rx="4" fill="#21262d" stroke="#30363d"/>
  <text x="130" y="272" text-anchor="middle" fill="#56d364" font-size="8">map: render lists</text>
  <text x="300" y="272" text-anchor="middle" fill="#388bfd" font-size="8">filter: search/condition</text>
  <text x="470" y="272" text-anchor="middle" fill="#d2a8ff" font-size="8">reduce: aggregate/sum</text>

  <defs>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#56d364"/>
    </marker>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#388bfd"/>
    </marker>
    <marker id="arrow-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#d2a8ff"/>
    </marker>
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b949e"/>
    </marker>
  </defs>
</svg>`,
  },
  {
    id: "promise-chain",
    title: "Promise Chain Visualization",
    category: "javascript",
    svgContent: `<svg viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <rect x="10" y="10" width="580" height="260" rx="8" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="300" y="35" text-anchor="middle" fill="#e3b341" font-size="14" font-weight="700">PROMISE CHAIN EXECUTION</text>

  <!-- Promise States -->
  <rect x="30" y="60" width="540" height="60" rx="6" fill="#161b22" stroke="#30363d"/>
  <text x="120" y="85" text-anchor="middle" fill="#8b949e" font-size="10" font-weight="600">PENDING</text>
  <text x="120" y="105" text-anchor="middle" fill="#8b949e" font-size="8">Initial state</text>
  
  <text x="300" y="85" text-anchor="middle" fill="#56d364" font-size="10" font-weight="700">FULFILLED</text>
  <text x="300" y="105" text-anchor="middle" fill="#56d364" font-size="8">.then() triggered</text>
  
  <text x="480" y="85" text-anchor="middle" fill="#ffa657" font-size="10" font-weight="700">REJECTED</text>
  <text x="480" y="105" text-anchor="middle" fill="#ffa657" font-size="8">.catch() triggered</text>

  <!-- Arrow between states -->
  <path d="M180 90 L230 90" stroke="#8b949e" stroke-width="1.5" fill="none" marker-end="url(#arrow-gray)"/>
  <path d="M420 90 L470 90" stroke="#8b949e" stroke-width="1.5" fill="none" marker-end="url(#arrow-gray)"/>

  <!-- Chain visualization -->
  <rect x="40" y="140" width="100" height="50" rx="6" fill="#56d36422" stroke="#56d364"/>
  <text x="90" y="162" text-anchor="middle" fill="#56d364" font-size="9" font-weight="600">Promise 1</text>
  <text x="90" y="178" text-anchor="middle" fill="#8b949e" font-size="8">fetchUser()</text>

  <path d="M140 165 L170 165" stroke="#388bfd" stroke-width="2" fill="none" marker-end="url(#arrow-blue)"/>
  <text x="155" y="155" text-anchor="middle" fill="#388bfd" font-size="7">.then</text>

  <rect x="180" y="140" width="100" height="50" rx="6" fill="#388bfd22" stroke="#388bfd"/>
  <text x="230" y="162" text-anchor="middle" fill="#388bfd" font-size="9" font-weight="600">Promise 2</text>
  <text x="230" y="178" text-anchor="middle" fill="#8b949e" font-size="8">validate(data)</text>

  <path d="M280 165 L310 165" stroke="#388bfd" stroke-width="2" fill="none" marker-end="url(#arrow-blue)"/>
  <text x="295" y="155" text-anchor="middle" fill="#388bfd" font-size="7">.then</text>

  <rect x="320" y="140" width="100" height="50" rx="6" fill="#388bfd22" stroke="#388bfd"/>
  <text x="370" y="162" text-anchor="middle" fill="#388bfd" font-size="9" font-weight="600">Promise 3</text>
  <text x="370" y="178" text-anchor="middle" fill="#8b949e" font-size="8">processUser()</text>

  <path d="M420 165 L450 165" stroke="#d2a8ff" stroke-width="2" fill="none" marker-end="url(#arrow-purple)"/>
  <text x="435" y="155" text-anchor="middle" fill="#d2a8ff" font-size="7">.catch</text>

  <rect x="460" y="140" width="100" height="50" rx="6" fill="#ffa65722" stroke="#ffa657"/>
  <text x="510" y="162" text-anchor="middle" fill="#ffa657" font-size="9" font-weight="600">Error Handler</text>
  <text x="510" y="178" text-anchor="middle" fill="#8b949e" font-size="8">handleError()</text>

  <defs>
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b949e"/>
    </marker>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#388bfd"/>
    </marker>
    <marker id="arrow-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#d2a8ff"/>
    </marker>
  </defs>
</svg>`,
  },
  {
    id: "dom-tree",
    title: "DOM Tree Structure",
    category: "javascript",
    svgContent: `<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <rect x="10" y="10" width="580" height="300" rx="8" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="300" y="35" text-anchor="middle" fill="#e3b341" font-size="14" font-weight="700">DOM TREE HIERARCHY</text>

  <!-- Root -->
  <rect x="240" y="55" width="120" height="35" rx="6" fill="#56d36422" stroke="#56d364" stroke-width="2"/>
  <text x="300" y="77" text-anchor="middle" fill="#56d364" font-size="10" font-weight="700">document</text>

  <!-- html -->
  <path d="M300 90 L300 115" stroke="#8b949e" stroke-width="1.5" fill="none"/>
  <rect x="230" y="120" width="140" height="30" rx="4" fill="#388bfd22" stroke="#388bfd"/>
  <text x="300" y="140" text-anchor="middle" fill="#388bfd" font-size="9" font-weight="600">&lt;html&gt;</text>

  <!-- head and body branches -->
  <path d="M240 125 L80 160" stroke="#8b949e" stroke-width="1" fill="none"/>
  <path d="M360 125 L520 160" stroke="#8b949e" stroke-width="1" fill="none"/>

  <!-- head -->
  <rect x="30" y="165" width="100" height="70" rx="4" fill="#161b22" stroke="#d2a8ff"/>
  <text x="80" y="188" text-anchor="middle" fill="#d2a8ff" font-size="9" font-weight="600">&lt;head&gt;</text>
  <rect x="40" y="198" width="80" height="18" rx="3" fill="#d2a8ff22" stroke="#d2a8ff55"/>
  <text x="80" y="211" text-anchor="middle" fill="#c9d1d9" font-size="7">&lt;title&gt;</text>
  <rect x="40" y="222" width="80" height="18" rx="3" fill="#d2a8ff22" stroke="#d2a8ff55"/>
  <text x="80" y="235" text-anchor="middle" fill="#c9d1d9" font-size="7">&lt;script&gt;</text>

  <!-- body -->
  <rect x="470" y="165" width="100" height="120" rx="4" fill="#161b22" stroke="#ffa657"/>
  <text x="520" y="188" text-anchor="middle" fill="#ffa657" font-size="9" font-weight="600">&lt;body&gt;</text>
  <rect x="480" y="198" width="80" height="18" rx="3" fill="#ffa65722" stroke="#ffa65755"/>
  <text x="520" y="211" text-anchor="middle" fill="#c9d1d9" font-size="7">&lt;header&gt;</text>
  <rect x="480" y="222" width="80" height="18" rx="3" fill="#ffa65722" stroke="#ffa65755"/>
  <text x="520" y="235" text-anchor="middle" fill="#c9d1d9" font-size="7">&lt;main&gt;</text>
  <rect x="480" y="246" width="80" height="18" rx="3" fill="#ffa65722" stroke="#ffa65755"/>
  <text x="520" y="259" text-anchor="middle" fill="#c9d1d9" font-size="7">&lt;footer&gt;</text>

  <!-- Legend -->
  <rect x="240" y="295" width="120" height="35" rx="4" fill="#21262d" stroke="#30363d"/>
  <text x="300" y="308" text-anchor="middle" fill="#8b949e" font-size="8">Element nodes</text>
  <text x="300" y="322" text-anchor="middle" fill="#8b949e" font-size="8">Text nodes (leaf)</text>

  <!-- Vertical line down -->
  <path d="M300 150 L300 165" stroke="#8b949e" stroke-width="1.5"/>
</svg>`,
  },
  {
    id: "event-propagation",
    title: "Event Propagation: Bubbling vs Capturing",
    category: "javascript",
    svgContent: `<svg viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <rect x="10" y="10" width="580" height="320" rx="8" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="300" y="35" text-anchor="middle" fill="#e3b341" font-size="14" font-weight="700">EVENT PROPAGATION PHASES</text>

  <!-- Document -->
  <rect x="170" y="55" width="260" height="25" rx="4" fill="#8b949e22" stroke="#8b949e"/>
  <text x="300" y="72" text-anchor="middle" fill="#8b949e" font-size="9">document</text>

  <!-- Window -->
  <rect x="170" y="85" width="260" height="25" rx="4" fill="#8b949e22" stroke="#8b949e"/>
  <text x="300" y="102" text-anchor="middle" fill="#8b949e" font-size="9">window</text>

  <!-- Container div -->
  <rect x="170" y="115" width="260" height="50" rx="4" fill="#388bfd22" stroke="#388bfd"/>
  <text x="300" y="138" text-anchor="middle" fill="#388bfd" font-size="9">&lt;div class="container"&gt;</text>

  <!-- Inner div -->
  <rect x="200" y="170" width="200" height="40" rx="4" fill="#56d36422" stroke="#56d364"/>
  <text x="300" y="195" text-anchor="middle" fill="#56d364" font-size="9">&lt;button&gt;Click Me&lt;/button&gt;</text>

  <!-- Capturing phase arrow -->
  <path d="M300 80 L300 115" stroke="#d2a8ff" stroke-width="2" fill="none" marker-end="url(#arrow-purple)"/>
  <path d="M300 110 L300 115" stroke="#d2a8ff" stroke-width="2" fill="none"/>
  <text x="320" y="100" fill="#d2a8ff" font-size="8">Capturing (top-down)</text>

  <!-- Target phase -->
  <rect x="260" y="220" width="80" height="25" rx="4" fill="#e3b34122" stroke="#e3b341"/>
  <text x="300" y="237" text-anchor="middle" fill="#e3b341" font-size="8">TARGET</text>

  <!-- Bubbling phase arrow -->
  <path d="M300 245 L300 265" stroke="#ffa657" stroke-width="2" fill="none" marker-end="url(#arrow-orange)"/>
  <text x="320" y="258" fill="#ffa657" font-size="8">Bubbling (bottom-up)</text>

  <!-- Legend box -->
  <rect x="30" y="220" width="120" height="90" rx="4" fill="#161b22" stroke="#30363d"/>
  <text x="90" y="242" text-anchor="middle" fill="#8b949e" font-size="9" font-weight="600">Phases</text>
  <rect x="40" y="255" width="15" height="12" rx="2" fill="#d2a8ff"/>
  <text x="62" y="265" fill="#d2a8ff" font-size="8">1. Capturing</text>
  <rect x="40" y="275" width="15" height="12" rx="2" fill="#e3b341"/>
  <text x="62" y="285" fill="#e3b341" font-size="8">2. Target</text>
  <rect x="40" y="295" width="15" height="12" rx="2" fill="#ffa657"/>
  <text x="62" y="305" fill="#ffa657" font-size="8">3. Bubbling</text>

  <!-- Code example -->
  <rect x="450" y="220" width="130" height="90" rx="4" fill="#161b22" stroke="#30363d"/>
  <text x="515" y="242" text-anchor="middle" fill="#8b949e" font-size="8" font-weight="600">Code</text>
  <text x="460" y="258" fill="#c9d1d9" font-size="7">el.addEventListener('click',</text>
  <text x="460" y="270" fill="#c9d1d9" font-size="7">  handler,</text>
  <text x="460" y="282" fill="#56d364" font-size="7">  true  // capturing</text>
  <text x="460" y="294" fill="#c9d1d9" font-size="7">);</text>
  <text x="460" y="306" fill="#8b949e" font-size="6">stopPropagation()</text>

  <defs>
    <marker id="arrow-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#d2a8ff"/>
    </marker>
    <marker id="arrow-orange" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffa657"/>
    </marker>
  </defs>
</svg>`,
  },
  {
    id: "big-o-complexity",
    title: "Big-O Complexity Chart",
    category: "algorithms",
    svgContent: `<svg viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <rect x="10" y="10" width="580" height="320" rx="8" fill="#21262d" stroke="#30363d" stroke-width="1.5"/>
  <text x="300" y="35" text-anchor="middle" fill="#e3b341" font-size="14" font-weight="700">BIG-O COMPLEXITY COMPARISON</text>

  <!-- Chart area -->
  <rect x="60" y="60" width="450" height="220" rx="4" fill="#161b22" stroke="#30363d"/>
  
  <!-- Y-axis label -->
  <text x="25" y="170" fill="#8b949e" font-size="9" transform="rotate(-90, 25, 170)">Runtime</text>
  
  <!-- X-axis label -->
  <text x="285" y="300" text-anchor="middle" fill="#8b949e" font-size="9">Input Size (n)</text>

  <!-- Complexity lines (simplified representation) -->
  <!-- O(1) - horizontal -->
  <path d="M80 80 L500 80" stroke="#56d364" stroke-width="3" fill="none"/>
  <text x="510" y="85" fill="#56d364" font-size="10">O(1)</text>
  
  <!-- O(log n) - slow growth -->
  <path d="M80 90 Q200 95 500 120" stroke="#388bfd" stroke-width="2" fill="none"/>
  <text x="510" y="125" fill="#388bfd" font-size="10">O(log n)</text>
  
  <!-- O(n) - linear -->
  <path d="M80 90 L500 200" stroke="#e3b341" stroke-width="2" fill="none"/>
  <text x="510" y="205" fill="#e3b341" font-size="10">O(n)</text>
  
  <!-- O(n log n) -->
  <path d="M80 90 Q200 150 500 230" stroke="#ffa657" stroke-width="2" fill="none"/>
  <text x="510" y="235" fill="#ffa657" font-size="10">O(n log n)</text>
  
  <!-- O(n²) - steep curve -->
  <path d="M80 90 Q150 150 500 270" stroke="#ffa657" stroke-width="2" fill="none" stroke-dasharray="5,3"/>
  <text x="510" y="275" fill="#d2a8ff" font-size="10">O(n²)</text>
  
  <!-- O(2^n) - exponential -->
  <path d="M80 90 Q120 100 200 280" stroke="#d2a8ff" stroke-width="2" fill="none" stroke-dasharray="3,3"/>
  <text x="210" y="295" fill="#d2a8ff" font-size="10">O(2ⁿ)</text>

  <!-- Legend -->
  <rect x="520" y="70" width="70" height="180" rx="4" fill="#21262d" stroke="#30363d"/>
  <text x="555" y="90" text-anchor="middle" fill="#8b949e" font-size="8" font-weight="600">BEST→</text>
  <text x="555" y="115" text-anchor="middle" fill="#8b949e" font-size="8" font-weight="600">WORST</text>
  <text x="555" y="255" text-anchor="middle" fill="#8b949e" font-size="6">∞</text>

  <!-- Common operations table -->
  <rect x="60" y="290" width="450" height="30" rx="4" fill="#21262d" stroke="#30363d"/>
  <text x="120" y="308" fill="#56d364" font-size="8">Array[i]: O(1)</text>
  <text x="230" y="308" fill="#388bfd" font-size="8">Binary search: O(log n)</text>
  <text x="380" y="308" fill="#e3b341" font-size="8">Loop: O(n)</text>
  <text x="480" y="308" fill="#ffa657" font-size="8">Sort: O(n log n)</text>
</svg>`,
  },
];

export const youtubeVideos: YouTubeVideo[] = [
  {
    id: "yt-001",
    title: "Master JavaScript Closures — Finally Understand How They Work",
    url: "https://www.youtube.com/watch?v=JVT_d9Qx_ro",
    channel: "Web Dev Simplified",
    duration: "45:00",
    views: "45K",
    publishedAt: "2025-11-10",
    relevance:
      "Comprehensive closure tutorial with practical examples and interview questions",
  },
  {
    id: "yt-002",
    title: "Learn Closures In 13 Minutes",
    url: "https://frontendmasters.com/tutorials/webdevsimplified/js-closures",
    channel: "Frontend Masters",
    duration: "13:00",
    views: "120K",
    publishedAt: "2024-07-09",
    relevance: "Quick, focused explanation perfect for interview prep",
  },
  {
    id: "yt-003",
    title: "JavaScript Full Course in 45 Minutes – Beginner to Advanced",
    url: "https://www.youtube.com/watch?v=vY9oShIBMQ0",
    channel: "Traversy Media",
    duration: "45:00",
    views: "85K",
    publishedAt: "2025-08-18",
    relevance: "Complete JavaScript fundamentals review for beginners",
  },
  {
    id: "yt-004",
    title: "All React Hooks Tutorial 2025 (+Building Custom Hooks)",
    url: "https://www.youtube.com/watch?v=4Ak2jFEIr9o",
    channel: "RoadsideCoder",
    duration: "58:11",
    views: "68.6K",
    publishedAt: "2025-02-23",
    relevance:
      "Complete hooks coverage including React 19 hooks and custom hooks",
  },
  {
    id: "yt-005",
    title: "Master the useEffect Hook in React 19",
    url: "https://www.youtube.com/watch?v=stZ39IxNzgs",
    channel: "LearnAwesome",
    duration: "35:00",
    views: "42K",
    publishedAt: "2025-05-03",
    relevance: "Modern useEffect patterns for React 19",
  },
  {
    id: "yt-006",
    title: "React useState Explained Like You're 5",
    url: "https://www.youtube.com/watch?v=6t4gUt_iNO8",
    channel: "ByteGrad",
    duration: "10:00",
    views: "35K",
    publishedAt: "2025-07-04",
    relevance: "Beginner-friendly explanation of useState",
  },
  {
    id: "yt-007",
    title: "Big O Notation - Full Course",
    url: "https://www.youtube.com/watch?v=Mo4vesaut8g",
    channel: "freeCodeCamp.org",
    duration: "1:56:15",
    views: "643K",
    publishedAt: "2021-08-10",
    relevance: "Comprehensive Big-O course with visual examples",
  },
  {
    id: "yt-008",
    title: "Big-O Notation - For Coding Interviews",
    url: "https://www.youtube.com/watch?v=BgLTDT03QtU",
    channel: "NeetCode",
    duration: "25:00",
    views: "89K",
    publishedAt: "2022-10-10",
    relevance: "Interview-focused Big-O explanation with examples",
  },
  {
    id: "yt-009",
    title: "Introduction to Big O Notation",
    url: "https://www.youtube.com/watch?v=4nUDZtRX38U",
    channel: "Neso Academy",
    duration: "7:32",
    views: "58K",
    publishedAt: "2024-05-12",
    relevance: "Quick academic introduction to Big-O",
  },
  {
    id: "yt-010",
    title: "CAP Theorem for System Design Interviews",
    url: "https://www.youtube.com/watch?v=BTKBS_GdSms",
    channel: "Exponent",
    duration: "18:00",
    views: "156K",
    publishedAt: "2022-03-15",
    relevance: "Interview-focused CAP theorem explanation",
  },
  {
    id: "yt-011",
    title: "CAP Theorem Explained",
    url: "https://www.youtube.com/watch?v=ydy9BE5EX6Q",
    channel: "System Design Interview",
    duration: "22:00",
    views: "78K",
    publishedAt: "2025-02-05",
    relevance: "Clear explanation with real-world examples",
  },
  {
    id: "yt-012",
    title: "FAANG System Design Concepts",
    url: "https://www.youtube.com/playlist?list=PLxOsu5yU9ovN2hTKJjRRwsN29GHBH-2cR",
    channel: "Exponent",
    duration: "Playlist",
    views: "234K",
    publishedAt: "2025-12-15",
    relevance: "Complete system design interview prep playlist",
  },
  {
    id: "yt-013",
    title: "JavaScript Event Loop Explained",
    url: "https://www.youtube.com/watch?v=cCOL7MC4Pl0",
    channel: "Fireship",
    duration: "8:00",
    views: "245K",
    publishedAt: "2023-06-15",
    relevance: "Visual explanation of async JavaScript",
  },
  {
    id: "yt-014",
    title: "Async/Await & Promises Tutorial",
    url: "https://www.youtube.com/watch?v=V_Kr9OSfDeU",
    channel: "Web Dev Simplified",
    duration: "20:00",
    views: "156K",
    publishedAt: "2024-01-20",
    relevance: "Modern async patterns for JavaScript",
  },
  {
    id: "yt-015",
    title: "React Performance Optimization",
    url: "https://www.youtube.com/watch?v=xyz",
    channel: "Kent C. Dodds",
    duration: "45:00",
    views: "89K",
    publishedAt: "2025-03-10",
    relevance: "useMemo, useCallback, and React.memo deep dive",
  },
];

export const generatedQuestions: Question[] = [
  {
    id: "gq-closure-scope",
    number: 9,
    title: "How do JavaScript closures work and why are they important?",
    tags: ["javascript", "closures", "scope"],
    difficulty: "intermediate",
    votes: 215,
    views: "10.2k",
    askedBy: "closure_fan",
    askedAt: "2024-03-10",
    sections: [
      {
        type: "short",
        content:
          "A **closure** is a function that remembers the variables from its enclosing scope even after that scope has finished executing. Closures are created every time a function is created, at function creation time.\n\n**Key concepts:**\n- **Lexical scope**: Variables are resolved based on where functions are written, not called\n- **Scope chain**: Inner functions can access outer function variables\n- **Garbage collection**: Closures keep their outer scope alive in memory",
      },
      {
        type: "diagram",
        title: "Closure Scope Chain",
        description:
          "Visualizing how closures capture variables from their lexical environment",
        svgContent:
          svgDiagrams.find((d) => d.id === "closures-scope")?.svgContent || "",
      },
      {
        type: "code",
        language: "javascript",
        filename: "closures-deep-dive.js",
        content: `// Closure capturing by reference
function createMultiplier(factor) {
  return function(number) {
    return number * factor; // 'factor' is captured
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15

// Classic loop closure issue
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 (all closures share same 'i')

// Fix with let (block scope)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2 (each iteration has own 'i')

// Module pattern with closures
const calculator = (function() {
  let result = 0; // private state
  
  return {
    add: (n) => { result += n; return this; },
    subtract: (n) => { result -= n; return this; },
    getResult: () => result
  };
})();`,
      },
      {
        type: "video",
        title: "Master JavaScript Closures — Finally Understand How They Work",
        url: "https://www.youtube.com/watch?v=JVT_d9Qx_ro",
        description:
          "Comprehensive closure tutorial covering practical examples, interview questions, and common pitfalls",
      },
      {
        type: "eli5",
        content:
          "Think of a closure like a **backpack a function wears**. When the function is created, it puts variables in its backpack and keeps them. Even if you call the function somewhere else far away, it still has access to those backpack variables. This is useful for keeping data private and creating specialized functions.",
      },
    ],
  },
  {
    id: "gq-react-hooks",
    number: 10,
    title: "How do React Hooks work and what are the rules governing them?",
    tags: ["react", "hooks", "useState", "useEffect"],
    difficulty: "beginner",
    votes: 287,
    views: "15.8k",
    askedBy: "hook_hero",
    askedAt: "2024-03-15",
    sections: [
      {
        type: "short",
        content:
          "**Hooks** let you use React features in function components. They were introduced in React 16.8 to enable state and side effects without class components.\n\n**Rules of Hooks:**\n1. Only call hooks at the top level (not in loops, conditions, or nested functions)\n2. Only call hooks from React functions (components or custom hooks)\n3. Custom hooks must start with 'use' prefix\n\n**Why these rules?** React relies on call order to track state between renders.",
      },
      {
        type: "diagram",
        title: "React Component Lifecycle with Hooks",
        description: "Mapping traditional lifecycle methods to modern hooks",
        svgContent:
          svgDiagrams.find((d) => d.id === "react-lifecycle")?.svgContent || "",
      },
      {
        type: "code",
        language: "tsx",
        filename: "react-hooks-guide.tsx",
        content: `import { useState, useEffect, useCallback, useMemo } from 'react';

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size
    
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty deps = componentDidMount + willUnmount
  
  return size;
}

function SearchComponent({ query }: { query: string }) {
  const [results, setResults] = useState<string[]>([]);
  
  // Debounced search with useCallback
  const search = useCallback(async () => {
    if (!query) return setResults([]);
    const data = await fetch(\`/api/search?q=\${query}\`);
    setResults(await data.json());
  }, [query]);
  
  useEffect(() => {
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [search]);
  
  // Memoize expensive computation
  const processedResults = useMemo(
    () => results.map(r => r.toUpperCase()),
    [results]
  );
  
  return <ul>{processedResults.map(r => <li key={r}>{r}</li>)}</ul>;
}`,
      },
      {
        type: "video",
        title: "All React Hooks Tutorial 2025 (+Building Custom Hooks)",
        url: "https://www.youtube.com/watch?v=4Ak2jFEIr9o",
        description:
          "Complete coverage of all React hooks including React 19 additions and building reusable custom hooks",
      },
      {
        type: "related",
        topics: [
          {
            title: "useReducer vs useState",
            description: "When to use useReducer for complex state logic",
            tag: "react",
          },
          {
            title: "useMemo & useCallback",
            description:
              "Performance optimization hooks to prevent unnecessary re-renders",
            tag: "react",
          },
          {
            title: "Custom Hooks",
            description: "Extract and share stateful logic between components",
            tag: "react",
          },
        ],
      },
    ],
  },
  {
    id: "gq-http-flow",
    number: 11,
    title: "What happens when you type a URL and press Enter?",
    tags: ["networking", "http", "dns"],
    difficulty: "intermediate",
    votes: 342,
    views: "22.4k",
    askedBy: "network_ninja",
    askedAt: "2024-03-20",
    sections: [
      {
        type: "short",
        content:
          "When you type a URL, several things happen:\n\n1. **URL Parsing** — Browser extracts protocol, host, port, path\n2. **DNS Lookup** — Domain → IP address resolution\n3. **TCP Handshake** — Establish connection with server\n4. **TLS Handshake** (for HTTPS) — Negotiate encryption\n5. **HTTP Request** — Browser sends request\n6. **Server Processing** — Backend handles request\n7. **HTTP Response** — Server sends response\n8. **Rendering** — Browser renders the page",
      },
      {
        type: "diagram",
        title: "HTTP Request/Response Flow",
        description:
          "End-to-end journey of an HTTP request from browser to server",
        svgContent:
          svgDiagrams.find((d) => d.id === "http-request-flow")?.svgContent ||
          "",
      },
      {
        type: "code",
        language: "bash",
        filename: "http-flow-demo.sh",
        content: `# DNS Lookup
dig example.com
# Returns: example.com. 300 IN A 93.184.216.34

# TCP Connection (3-way handshake visualization)
# Client → SYN → Server (seq=x)
# Server → SYN-ACK → Client (seq=y, ack=x+1)
# Client → ACK → Server (ack=y+1)

# HTTP Request
curl -v https://api.example.com/users/123
# GET /users/123 HTTP/1.1
# Host: api.example.com
# Accept: application/json
# Authorization: Bearer <token>

# HTTP Response
# HTTP/1.1 200 OK
# Content-Type: application/json
# Content-Length: 256
# Cache-Control: max-age=3600
# 
# {"id": 123, "name": "John", "email": "john@example.com"}`,
      },
      {
        type: "video",
        title: "How the Internet Works in 5 Minutes",
        url: "https://www.youtube.com/watch?v=xyz",
        description:
          "Quick overview of HTTP, DNS, and the request/response cycle",
      },
      {
        type: "related",
        topics: [
          {
            title: "DNS Resolution",
            description: "Recursive vs iterative DNS queries and caching",
            tag: "dns",
          },
          {
            title: "HTTP/2 & HTTP/3",
            description: "Multiplexing, header compression, and QUIC protocol",
            tag: "http",
          },
          {
            title: "TLS Handshake",
            description: "How HTTPS establishes secure encrypted connections",
            tag: "networking",
          },
        ],
      },
    ],
  },
  {
    id: "gq-array-methods",
    number: 12,
    title: "When should you use map, filter, reduce, and other array methods?",
    tags: ["javascript", "arrays", "functional-programming"],
    difficulty: "beginner",
    votes: 198,
    views: "11.3k",
    askedBy: "array_master",
    askedAt: "2024-03-25",
    sections: [
      {
        type: "short",
        content:
          "JavaScript array methods are functional alternatives to loops:\n\n- **map()** — Transform each element, returns same-length array\n- **filter()** — Keep elements matching condition, returns subset\n- **reduce()** — Accumulate to single value (sum, object, etc.)\n- **find()** — Get first matching element\n- **some()/every()** — Boolean checks\n- **flat()/flatMap()** — Flatten nested arrays",
      },
      {
        type: "diagram",
        title: "Array Methods Comparison",
        description:
          "Visual comparison of map, filter, and reduce transformations",
        svgContent:
          svgDiagrams.find((d) => d.id === "array-methods")?.svgContent || "",
      },
      {
        type: "code",
        language: "javascript",
        filename: "array-methods.js",
        content: `const users = [
  { id: 1, name: 'Alice', age: 25, active: true },
  { id: 2, name: 'Bob', age: 30, active: false },
  { id: 3, name: 'Charlie', age: 25, active: true },
];

// map: transform to different shape
const names = users.map(u => u.name); // ['Alice', 'Bob', 'Charlie']

// filter: keep matching items
const activeUsers = users.filter(u => u.active); // [Alice, Charlie]

// reduce: aggregate to single value
const ageSum = users.reduce((sum, u) => sum + u.age, 0); // 80

// reduce: group by property
const byAge = users.reduce((groups, user) => {
  (groups[user.age] ??= []).push(user);
  return groups;
}, {});
// { 25: [Alice, Charlie], 30: [Bob] }

// Chaining methods
const activeNamesUpper = users
  .filter(u => u.active)
  .map(u => u.name.toUpperCase()); // ['ALICE', 'CHARLIE']

// flatMap: map + flatten in one pass
const allSkills = users.flatMap(u => u.skills || []);`,
      },
      {
        type: "video",
        title: "JavaScript Array Methods Tutorial",
        url: "https://www.youtube.com/watch?v=xyz",
        description: "Complete guide to array methods with practical examples",
      },
      {
        type: "eli5",
        content:
          "Think of array methods like kitchen tools: **map** is like cutting each vegetable the same way. **filter** is like picking out only ripe tomatoes. **reduce** is like putting all ingredients into one soup. Each tool has a specific job, and chaining them together is like following a recipe!",
      },
    ],
  },
];

export function getDiagramById(id: string): string | undefined {
  return svgDiagrams.find((d) => d.id === id)?.svgContent;
}

export function getVideosByCategory(category: string): YouTubeVideo[] {
  const categoryMap: Record<string, string[]> = {
    javascript: ["yt-001", "yt-002", "yt-003", "yt-013", "yt-014"],
    react: ["yt-004", "yt-005", "yt-006", "yt-015"],
    algorithms: ["yt-007", "yt-008", "yt-009"],
    systemdesign: ["yt-010", "yt-011", "yt-012"],
  };

  const ids = categoryMap[category] || [];
  return youtubeVideos.filter((v) => ids.includes(v.id));
}
