#!/usr/bin/env node
/**
 * Seed channels table in devprep.db with top 50 tech topics + 25 certifications.
 * Run: node scripts/seed-channels.mjs
 */
import { Database } from "bun:sqlite";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "../data/devprep.db");

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    color TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('tech', 'cert')),
    cert_code TEXT,
    description TEXT DEFAULT '',
    tag_filter TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`);

const techChannels = [
  {
    id: "javascript",
    name: "JavaScript",
    shortName: "JS",
    emoji: "⚡",
    color: "#f7df1e",
    description: "Core JS concepts, async, closures, prototype chain, ES2024+",
    tags: [
      "javascript",
      "async",
      "closures",
      "prototype",
      "generators",
      "types",
    ],
  },
  {
    id: "typescript",
    name: "TypeScript",
    shortName: "TS",
    emoji: "🔷",
    color: "#3178c6",
    description:
      "Static typing, generics, decorators, compiler config, utility types",
    tags: ["typescript", "types", "generics", "interfaces"],
  },
  {
    id: "react",
    name: "React",
    shortName: "React",
    emoji: "⚛️",
    color: "#61dafb",
    description:
      "Hooks, state management, reconciliation, performance optimisation",
    tags: ["react", "hooks", "state", "performance", "jsx"],
  },
  {
    id: "vue",
    name: "Vue.js",
    shortName: "Vue",
    emoji: "💚",
    color: "#42b883",
    description: "Composition API, reactivity, Vuex/Pinia, Nuxt",
    tags: ["vue", "vuejs", "composition-api", "nuxt"],
  },
  {
    id: "angular",
    name: "Angular",
    shortName: "Angular",
    emoji: "🅰️",
    color: "#dd0031",
    description: "Modules, DI, RxJS, Angular CLI, change detection",
    tags: ["angular", "rxjs", "typescript", "di"],
  },
  {
    id: "nodejs",
    name: "Node.js",
    shortName: "Node",
    emoji: "🟢",
    color: "#339933",
    description:
      "Event loop, streams, cluster, Express/Fastify, worker threads",
    tags: ["nodejs", "node", "express", "event-loop", "streams"],
  },
  {
    id: "python",
    name: "Python",
    shortName: "Python",
    emoji: "🐍",
    color: "#3776ab",
    description: "Data types, decorators, async, GIL, packaging, type hints",
    tags: ["python", "async", "decorators", "packaging"],
  },
  {
    id: "golang",
    name: "Go",
    shortName: "Go",
    emoji: "🐹",
    color: "#00add8",
    description: "Goroutines, channels, interfaces, memory model, stdlib",
    tags: ["golang", "go", "goroutines", "channels", "concurrency"],
  },
  {
    id: "rust",
    name: "Rust",
    shortName: "Rust",
    emoji: "🦀",
    color: "#ce422b",
    description: "Ownership, borrowing, lifetimes, async/await, cargo",
    tags: ["rust", "ownership", "borrow", "lifetimes"],
  },
  {
    id: "java",
    name: "Java",
    shortName: "Java",
    emoji: "☕",
    color: "#ed8b00",
    description: "JVM internals, GC, concurrency, streams API, Spring",
    tags: ["java", "jvm", "spring", "concurrency", "generics"],
  },
  {
    id: "sql",
    name: "SQL",
    shortName: "SQL",
    emoji: "🗄️",
    color: "#e38c16",
    description:
      "Query optimisation, joins, indexes, window functions, transactions",
    tags: ["sql", "database", "joins", "indexes", "transactions"],
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    shortName: "Postgres",
    emoji: "🐘",
    color: "#336791",
    description: "MVCC, indexing strategies, JSONB, partitioning, pg_stat",
    tags: ["postgresql", "postgres", "sql", "database"],
  },
  {
    id: "mongodb",
    name: "MongoDB",
    shortName: "Mongo",
    emoji: "🍃",
    color: "#47a248",
    description: "Document model, aggregation pipeline, indexing, sharding",
    tags: ["mongodb", "nosql", "aggregation", "document"],
  },
  {
    id: "redis",
    name: "Redis",
    shortName: "Redis",
    emoji: "🔴",
    color: "#dc382d",
    description:
      "Data structures, pub/sub, Lua scripts, clustering, persistence",
    tags: ["redis", "cache", "pub-sub", "data-structures"],
  },
  {
    id: "graphql",
    name: "GraphQL",
    shortName: "GraphQL",
    emoji: "🔮",
    color: "#e10098",
    description:
      "Schema design, resolvers, subscriptions, DataLoader, federation",
    tags: ["graphql", "schema", "resolvers", "apollo"],
  },
  {
    id: "rest-api",
    name: "REST APIs",
    shortName: "REST",
    emoji: "🔌",
    color: "#6db33f",
    description:
      "HTTP methods, status codes, HATEOAS, versioning, auth patterns",
    tags: ["rest", "api", "http", "authentication", "versioning"],
  },
  {
    id: "microservices",
    name: "Microservices",
    shortName: "µSvc",
    emoji: "🔬",
    color: "#f7931e",
    description: "Service mesh, sagas, event sourcing, DDD, circuit breakers",
    tags: ["microservices", "distributed", "event-sourcing", "saga"],
  },
  {
    id: "docker",
    name: "Docker",
    shortName: "Docker",
    emoji: "🐳",
    color: "#2496ed",
    description:
      "Layered images, multi-stage builds, networking, compose, security",
    tags: ["docker", "containers", "dockerfile", "compose"],
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    shortName: "K8s",
    emoji: "☸️",
    color: "#326ce5",
    description: "Pods, deployments, services, RBAC, ingress, HPA, operators",
    tags: ["kubernetes", "k8s", "containers", "orchestration"],
  },
  {
    id: "linux",
    name: "Linux",
    shortName: "Linux",
    emoji: "🐧",
    color: "#fcc624",
    description: "Kernel, processes, signals, filesystem, networking, systemd",
    tags: ["linux", "kernel", "bash", "filesystem", "networking"],
  },
  {
    id: "git",
    name: "Git",
    shortName: "Git",
    emoji: "🌿",
    color: "#f05032",
    description: "Branching strategies, rebasing, hooks, internals, workflows",
    tags: ["git", "version-control", "branching", "merge"],
  },
  {
    id: "algorithms",
    name: "Algorithms",
    shortName: "Algo",
    emoji: "🔢",
    color: "#a371f7",
    description: "Big-O, sorting, dynamic programming, trees, graphs, greedy",
    tags: [
      "algorithms",
      "sorting",
      "big-o",
      "dynamic-programming",
      "trees",
      "graphs",
    ],
  },
  {
    id: "data-structures",
    name: "Data Structures",
    shortName: "DS",
    emoji: "🌳",
    color: "#2eb67d",
    description:
      "Arrays, linked lists, stacks, queues, heaps, tries, segment trees",
    tags: ["data-structures", "arrays", "trees", "graphs", "heaps"],
  },
  {
    id: "system-design",
    name: "System Design",
    shortName: "SysD",
    emoji: "🏗️",
    color: "#bc8cff",
    description:
      "Distributed systems, CAP theorem, scalability, load balancing",
    tags: ["system-design", "distributed", "scalability", "caching"],
  },
  {
    id: "networking",
    name: "Networking",
    shortName: "Net",
    emoji: "📡",
    color: "#3fb950",
    description: "TCP/IP, HTTP/2, TLS, DNS, CDN, WebSockets, gRPC",
    tags: ["networking", "http", "tcp", "dns", "tls"],
  },
  {
    id: "security",
    name: "Security",
    shortName: "SecOps",
    emoji: "🔒",
    color: "#ff6b6b",
    description: "OWASP, auth/authz, cryptography, secrets management, ZTA",
    tags: ["security", "authentication", "cryptography", "owasp"],
  },
  {
    id: "react-native",
    name: "React Native",
    shortName: "RN",
    emoji: "📱",
    color: "#61dafb",
    description:
      "Bridge architecture, native modules, Expo, navigation, performance",
    tags: ["react-native", "mobile", "expo", "ios", "android"],
  },
  {
    id: "nextjs",
    name: "Next.js",
    shortName: "Next",
    emoji: "⬛",
    color: "#ffffff",
    description: "App Router, RSC, SSR/SSG/ISR, middleware, deployment",
    tags: ["nextjs", "react", "ssr", "rsc", "app-router"],
  },
  {
    id: "fastapi",
    name: "FastAPI",
    shortName: "FastAPI",
    emoji: "⚡",
    color: "#009688",
    description:
      "Pydantic, dependency injection, async, OpenAPI, background tasks",
    tags: ["fastapi", "python", "async", "pydantic", "api"],
  },
  {
    id: "spring-boot",
    name: "Spring Boot",
    shortName: "Spring",
    emoji: "🌱",
    color: "#6db33f",
    description: "Auto-configuration, AOP, data JPA, security, actuator",
    tags: ["spring", "java", "spring-boot", "jpa", "security"],
  },
  {
    id: "grpc",
    name: "gRPC",
    shortName: "gRPC",
    emoji: "⚙️",
    color: "#244c5a",
    description:
      "Protobuf, streaming, interceptors, load balancing, status codes",
    tags: ["grpc", "protobuf", "streaming", "rpc"],
  },
  {
    id: "kafka",
    name: "Apache Kafka",
    shortName: "Kafka",
    emoji: "📨",
    color: "#d4a853",
    description:
      "Topics, partitions, consumers, exactly-once semantics, Streams API",
    tags: ["kafka", "messaging", "streaming", "pub-sub"],
  },
  {
    id: "elasticsearch",
    name: "Elasticsearch",
    shortName: "ES",
    emoji: "🔍",
    color: "#00bfb3",
    description: "Inverted index, mapping, aggregations, sharding, ELK stack",
    tags: ["elasticsearch", "search", "elk", "lucene"],
  },
  {
    id: "devops",
    name: "DevOps",
    shortName: "DevOps",
    emoji: "🔧",
    color: "#ffa657",
    description: "CI/CD pipelines, GitOps, infrastructure as code, SRE",
    tags: ["devops", "docker", "ci-cd", "linux", "sre"],
  },
  {
    id: "terraform",
    name: "Terraform",
    shortName: "Terraform",
    emoji: "🏔️",
    color: "#7b42bc",
    description: "HCL, providers, state management, modules, workspaces",
    tags: ["terraform", "iac", "devops", "cloud"],
  },
  {
    id: "ansible",
    name: "Ansible",
    shortName: "Ansible",
    emoji: "🔴",
    color: "#ee0000",
    description: "Playbooks, roles, inventory, handlers, Ansible Tower",
    tags: ["ansible", "automation", "iac", "devops"],
  },
  {
    id: "aws",
    name: "AWS",
    shortName: "AWS",
    emoji: "☁️",
    color: "#ff9900",
    description: "Core services: EC2, S3, VPC, IAM, Lambda, RDS, EKS",
    tags: ["aws", "cloud", "ec2", "s3", "lambda", "iam"],
  },
  {
    id: "azure",
    name: "Azure",
    shortName: "Azure",
    emoji: "🔵",
    color: "#0078d4",
    description: "Azure VMs, App Service, AKS, Entra ID, Cosmos DB, DevOps",
    tags: ["azure", "cloud", "microsoft", "aks"],
  },
  {
    id: "gcp",
    name: "Google Cloud",
    shortName: "GCP",
    emoji: "🌈",
    color: "#4285f4",
    description: "Compute Engine, GKE, BigQuery, Cloud Run, Pub/Sub, Spanner",
    tags: ["gcp", "google-cloud", "bigquery", "gke"],
  },
  {
    id: "testing",
    name: "Testing",
    shortName: "Testing",
    emoji: "🧪",
    color: "#c21325",
    description:
      "Unit, integration, E2E, TDD, Jest, Playwright, contract testing",
    tags: ["testing", "jest", "playwright", "tdd", "e2e"],
  },
  {
    id: "serverless",
    name: "Serverless",
    shortName: "FaaS",
    emoji: "⚡",
    color: "#fd5750",
    description:
      "Lambda, cold starts, event triggers, Step Functions, cost model",
    tags: ["serverless", "lambda", "faas", "event-driven"],
  },
  {
    id: "api-design",
    name: "API Design",
    shortName: "API",
    emoji: "📐",
    color: "#6d8fa6",
    description: "RESTful, versioning, pagination, idempotency, OpenAPI spec",
    tags: ["api", "rest", "graphql", "openapi", "design"],
  },
  {
    id: "data-engineering",
    name: "Data Engineering",
    shortName: "DataEng",
    emoji: "🔩",
    color: "#ff6b35",
    description: "ETL/ELT, dbt, Spark, Airflow, data lake vs warehouse",
    tags: ["data-engineering", "etl", "spark", "airflow", "dbt"],
  },
  {
    id: "web-performance",
    name: "Web Performance",
    shortName: "Perf",
    emoji: "🏎️",
    color: "#f7c59f",
    description:
      "Core Web Vitals, bundle optimisation, caching, CRP, lazy loading",
    tags: ["web-performance", "cwv", "caching", "optimization"],
  },
  {
    id: "wasm",
    name: "WebAssembly",
    shortName: "WASM",
    emoji: "🔩",
    color: "#654ff0",
    description: "Binary format, memory model, JS interop, WASI, Emscripten",
    tags: ["wasm", "webassembly", "performance", "rust", "c++"],
  },
  {
    id: "swift-ios",
    name: "Swift / iOS",
    shortName: "iOS",
    emoji: "🍎",
    color: "#fa7343",
    description:
      "Swift concurrency, SwiftUI, UIKit, Combine, App Store distribution",
    tags: ["swift", "ios", "swiftui", "xcode", "apple"],
  },
  {
    id: "kotlin-android",
    name: "Kotlin / Android",
    shortName: "Android",
    emoji: "🤖",
    color: "#7f52ff",
    description: "Coroutines, Jetpack Compose, ViewModels, Room, Play Store",
    tags: ["kotlin", "android", "coroutines", "compose", "jetpack"],
  },
  {
    id: "machine-learning",
    name: "Machine Learning",
    shortName: "ML",
    emoji: "🧠",
    color: "#ff6f00",
    description:
      "Model training, feature engineering, evaluation, deployment, LLMs",
    tags: ["machine-learning", "ml", "ai", "python", "sklearn"],
  },
  {
    id: "ci-cd",
    name: "CI/CD",
    shortName: "CI/CD",
    emoji: "🔄",
    color: "#f05133",
    description:
      "GitHub Actions, Jenkins, ArgoCD, deployment strategies, rollbacks",
    tags: ["ci-cd", "github-actions", "jenkins", "argocd", "devops"],
  },
  {
    id: "cloud-native",
    name: "Cloud Native",
    shortName: "CloudN",
    emoji: "☁️",
    color: "#00c7b7",
    description:
      "The Twelve-Factor App, containers, service mesh, observability",
    tags: ["cloud-native", "containers", "service-mesh", "12factor"],
  },
];

const certChannels = [
  {
    id: "aws-saa",
    name: "AWS Solutions Architect Associate",
    shortName: "AWS SAA",
    emoji: "☁️",
    color: "#ff9900",
    certCode: "SAA-C03",
    description:
      "Design resilient, high-performing, secure and cost-optimised architectures on AWS",
    tags: ["aws", "cloud", "architecture", "ec2", "vpc", "s3"],
  },
  {
    id: "aws-dev",
    name: "AWS Developer Associate",
    shortName: "AWS Dev",
    emoji: "🛠️",
    color: "#ff9900",
    certCode: "DVA-C02",
    description:
      "Develop and deploy cloud-native applications using AWS services and SDK",
    tags: ["aws", "cloud", "serverless", "lambda", "dynamodb"],
  },
  {
    id: "aws-ai",
    name: "AWS AI Practitioner",
    shortName: "AWS AI",
    emoji: "🤖",
    color: "#ff9900",
    certCode: "AIF-C01",
    description:
      "Fundamentals of AI/ML, generative AI, foundation models, and responsible AI on AWS",
    tags: ["aws", "ai", "ml", "generative-ai", "bedrock", "sagemaker"],
  },
  {
    id: "aws-sysops",
    name: "AWS SysOps Administrator",
    shortName: "AWS SysOps",
    emoji: "⚙️",
    color: "#ff9900",
    certCode: "SOA-C02",
    description:
      "Deploy, manage and operate scalable, highly available systems on AWS",
    tags: ["aws", "cloud", "operations", "monitoring", "ec2"],
  },
  {
    id: "aws-ccp",
    name: "AWS Cloud Practitioner",
    shortName: "AWS CCP",
    emoji: "🎓",
    color: "#ff9900",
    certCode: "CLF-C02",
    description:
      "Foundational understanding of AWS Cloud, services and terminology",
    tags: ["aws", "cloud", "fundamentals"],
  },
  {
    id: "aws-mls",
    name: "AWS ML Specialty",
    shortName: "AWS MLS",
    emoji: "🧠",
    color: "#ff9900",
    certCode: "MLS-C01",
    description:
      "Design and implement ML solutions on AWS including SageMaker and data pipelines",
    tags: ["aws", "machine-learning", "sagemaker", "mlops"],
  },
  {
    id: "gcp-pca",
    name: "Google Cloud Architect",
    shortName: "GCP PCA",
    emoji: "🌈",
    color: "#4285f4",
    certCode: "PCA",
    description: "Design, develop and manage GCP solutions for organisations",
    tags: ["gcp", "cloud", "architecture", "kubernetes"],
  },
  {
    id: "gcp-ace",
    name: "Google Cloud Engineer",
    shortName: "GCP ACE",
    emoji: "🌈",
    color: "#4285f4",
    certCode: "ACE",
    description:
      "Deploy applications, monitor operations and manage GCP infrastructure",
    tags: ["gcp", "cloud", "compute", "networking"],
  },
  {
    id: "gcp-pde",
    name: "Google Cloud Data Engineer",
    shortName: "GCP PDE",
    emoji: "🌈",
    color: "#4285f4",
    certCode: "PDE",
    description:
      "Design and build data processing systems, BigQuery, Dataflow, Pub/Sub",
    tags: ["gcp", "data-engineering", "bigquery", "dataflow"],
  },
  {
    id: "az-104",
    name: "Azure Administrator",
    shortName: "AZ-104",
    emoji: "🔵",
    color: "#0078d4",
    certCode: "AZ-104",
    description:
      "Implement, manage and monitor Azure infrastructure for organisations",
    tags: ["azure", "cloud", "administration", "networking"],
  },
  {
    id: "az-204",
    name: "Azure Developer",
    shortName: "AZ-204",
    emoji: "🔵",
    color: "#0078d4",
    certCode: "AZ-204",
    description:
      "Design, build, test and maintain Azure cloud applications and services",
    tags: ["azure", "cloud", "development", "app-service"],
  },
  {
    id: "az-305",
    name: "Azure Solutions Architect",
    shortName: "AZ-305",
    emoji: "🔵",
    color: "#0078d4",
    certCode: "AZ-305",
    description:
      "Design Azure infrastructure solutions including compute, storage and security",
    tags: ["azure", "cloud", "architecture", "design"],
  },
  {
    id: "az-400",
    name: "Azure DevOps Engineer",
    shortName: "AZ-400",
    emoji: "🔵",
    color: "#0078d4",
    certCode: "AZ-400",
    description:
      "Design and implement DevOps practices for CI/CD, monitoring and feedback",
    tags: ["azure", "devops", "ci-cd", "pipelines"],
  },
  {
    id: "az-900",
    name: "Azure Fundamentals",
    shortName: "AZ-900",
    emoji: "🔵",
    color: "#0078d4",
    certCode: "AZ-900",
    description: "Core Azure concepts, services, pricing and support models",
    tags: ["azure", "cloud", "fundamentals"],
  },
  {
    id: "cka",
    name: "Certified Kubernetes Admin",
    shortName: "CKA",
    emoji: "🎓",
    color: "#326ce5",
    certCode: "CKA",
    description:
      "Administer Kubernetes clusters: troubleshoot, upgrade, secure, configure RBAC",
    tags: ["kubernetes", "k8s", "cka", "administration"],
  },
  {
    id: "ckad",
    name: "Certified K8s App Developer",
    shortName: "CKAD",
    emoji: "🎓",
    color: "#326ce5",
    certCode: "CKAD",
    description:
      "Design, build and deploy cloud-native applications for Kubernetes",
    tags: ["kubernetes", "k8s", "ckad", "development"],
  },
  {
    id: "cks",
    name: "Certified K8s Security",
    shortName: "CKS",
    emoji: "🔒",
    color: "#326ce5",
    certCode: "CKS",
    description:
      "Secure container-based applications and Kubernetes platforms during build/deploy",
    tags: ["kubernetes", "k8s", "cks", "security"],
  },
  {
    id: "terraform-cert",
    name: "HashiCorp Terraform Associate",
    shortName: "Terraform",
    emoji: "🏔️",
    color: "#7b42bc",
    certCode: "TA-002-P",
    description:
      "Understand Terraform concepts and use Terraform to manage cloud infrastructure",
    tags: ["terraform", "iac", "devops", "cloud"],
  },
  {
    id: "vault-cert",
    name: "HashiCorp Vault Associate",
    shortName: "Vault",
    emoji: "🔐",
    color: "#7b42bc",
    certCode: "VA-002",
    description:
      "Understand Vault concepts: secrets engines, auth methods, policies, HA",
    tags: ["vault", "secrets", "hashicorp", "security"],
  },
  {
    id: "comptia-sec",
    name: "CompTIA Security+",
    shortName: "Sec+",
    emoji: "🛡️",
    color: "#c8202f",
    certCode: "SY0-701",
    description:
      "Core security concepts, threats, architecture, implementation and governance",
    tags: ["security", "comptia", "threats", "cryptography"],
  },
  {
    id: "comptia-net",
    name: "CompTIA Network+",
    shortName: "Net+",
    emoji: "📡",
    color: "#c8202f",
    certCode: "N10-008",
    description:
      "Networking fundamentals, troubleshooting, protocols and security",
    tags: ["networking", "comptia", "protocols", "tcp"],
  },
  {
    id: "comptia-cloud",
    name: "CompTIA Cloud+",
    shortName: "Cloud+",
    emoji: "☁️",
    color: "#c8202f",
    certCode: "CV0-003",
    description: "Cloud architecture, security, deployment and troubleshooting",
    tags: ["cloud", "comptia", "security", "infrastructure"],
  },
  {
    id: "ceh",
    name: "Certified Ethical Hacker",
    shortName: "CEH",
    emoji: "🕵️",
    color: "#00539b",
    certCode: "CEH",
    description:
      "Ethical hacking methodology, penetration testing, vulnerability assessment",
    tags: ["security", "ethical-hacking", "penetration-testing"],
  },
  {
    id: "cissp",
    name: "CISSP",
    shortName: "CISSP",
    emoji: "🏆",
    color: "#00539b",
    certCode: "CISSP",
    description:
      "Information security management: risk, assets, cryptography, software security",
    tags: ["security", "cissp", "risk-management", "cryptography"],
  },
  {
    id: "oscp",
    name: "OSCP",
    shortName: "OSCP",
    emoji: "💀",
    color: "#e13939",
    certCode: "OSCP",
    description:
      "Practical penetration testing: buffer overflows, privilege escalation, pivoting",
    tags: ["security", "oscp", "penetration-testing", "exploitation"],
  },
  {
    id: "mongodb-cert",
    name: "MongoDB Associate Developer",
    shortName: "MongoDB",
    emoji: "🍃",
    color: "#47a248",
    certCode: "MDB-Dev",
    description:
      "MongoDB CRUD, aggregation, data modeling, indexing, transactions",
    tags: ["mongodb", "nosql", "aggregation", "database"],
  },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO channels
    (id, name, short_name, emoji, color, type, cert_code, description, tag_filter, sort_order)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((channels, type) => {
  channels.forEach((c, i) => {
    insert.run(
      c.id,
      c.name,
      c.shortName,
      c.emoji,
      c.color,
      type,
      c.certCode || null,
      c.description,
      JSON.stringify(c.tags),
      i,
    );
  });
});

insertMany(techChannels, "tech");
insertMany(certChannels, "cert");

const count = db.prepare("SELECT COUNT(*) AS n FROM channels").get();
console.log(
  `✅ channels table seeded — ${count.n} total channels (${techChannels.length} tech, ${certChannels.length} cert)`,
);

// Also check if existing content channel_ids match our new channel list
const contentChannels = db
  .prepare("SELECT DISTINCT channel_id FROM generated_content")
  .all()
  .map((r) => r.channel_id);
const channelIds = new Set([...techChannels, ...certChannels].map((c) => c.id));
const orphaned = contentChannels.filter((id) => !channelIds.has(id));
if (orphaned.length > 0) {
  console.warn(
    "⚠️  Content exists for channel IDs not in channels table:",
    orphaned.join(", "),
  );
  console.warn(
    "   You may want to add these as channels or re-map the content.",
  );
}

db.close();
