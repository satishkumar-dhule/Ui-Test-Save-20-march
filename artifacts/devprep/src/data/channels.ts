export interface Channel {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  color: string;
  type: "tech" | "cert";
  certCode?: string;
  description: string;
  tagFilter?: string[];
}

export const channels: Channel[] = [
  { id: "javascript", name: "JavaScript", shortName: "JS", emoji: "⚡", color: "#f7df1e", type: "tech", description: "Core JS concepts, async, closures, prototype chain", tagFilter: ["javascript", "async", "closures", "prototype", "types", "generators"] },
  { id: "react", name: "React", shortName: "React", emoji: "⚛️", color: "#61dafb", type: "tech", description: "Hooks, state management, reconciliation, performance", tagFilter: ["react", "hooks", "state", "performance"] },
  { id: "algorithms", name: "Algorithms", shortName: "Algo", emoji: "🔢", color: "#a371f7", type: "tech", description: "Big-O, sorting, dynamic programming, trees & graphs", tagFilter: ["algorithms", "sorting", "big-o", "dynamic-programming", "trees", "graphs"] },
  { id: "devops", name: "DevOps", shortName: "DevOps", emoji: "🔧", color: "#ffa657", type: "tech", description: "Docker, CI/CD pipelines, Linux fundamentals", tagFilter: ["devops", "docker", "ci-cd", "linux"] },
  { id: "kubernetes", name: "Kubernetes", shortName: "K8s", emoji: "☸️", color: "#326ce5", type: "tech", description: "Container orchestration, deployments, services", tagFilter: ["kubernetes", "k8s", "containers", "orchestration"] },
  { id: "networking", name: "Networking", shortName: "Net", emoji: "📡", color: "#3fb950", type: "tech", description: "HTTP, REST, DNS, TCP/IP, network protocols", tagFilter: ["networking", "http", "rest", "dns"] },
  { id: "system-design", name: "System Design", shortName: "SysD", emoji: "🏗️", color: "#bc8cff", type: "tech", description: "Distributed systems, CAP theorem, scalability", tagFilter: ["cs", "distributed", "concurrency", "memory", "oop", "data-structures"] },
  { id: "aws-saa", name: "AWS Solutions Architect", shortName: "AWS SAA", emoji: "☁️", color: "#ff9900", type: "cert", certCode: "SAA-C03", description: "Design resilient, high-performing, secure AWS architectures", tagFilter: ["aws", "cloud"] },
  { id: "aws-dev", name: "AWS Developer", shortName: "AWS Dev", emoji: "🛠️", color: "#ff9900", type: "cert", certCode: "DVA-C02", description: "Develop and deploy cloud-native applications on AWS", tagFilter: ["aws", "cloud", "serverless"] },
  { id: "cka", name: "Certified Kubernetes Admin", shortName: "CKA", emoji: "🎓", color: "#326ce5", type: "cert", certCode: "CKA", description: "Administer Kubernetes clusters in production environments", tagFilter: ["kubernetes", "k8s"] },
  { id: "terraform", name: "HashiCorp Terraform", shortName: "Terraform", emoji: "🏔️", color: "#7b42bc", type: "cert", certCode: "TA-002-P", description: "Infrastructure as Code with HashiCorp Terraform", tagFilter: ["terraform", "iac", "devops"] },
];

export const techChannels = channels.filter(c => c.type === "tech");
export const certChannels = channels.filter(c => c.type === "cert");
