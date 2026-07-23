// Domain data and storage for the Security Learning Bot.
// Durable data uses in-memory Maps (reset per process). In production these would
// be backed by Redis via the toolkit's persistent storage.

export interface UserProfile {
  id: number;
  focusArea?: string;
  deliveryCadence?: string;
  subscriptionStatus: "free" | "pro";
  emailOptIn: boolean;
  enrolledPaths: string[];
  notificationsEnabled: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  modules: string[];
  focusArea: string;
  accessLevel: "free" | "pro";
}

export interface Module {
  id: string;
  pathId: string;
  title: string;
  content: string;
  links: string[];
  exercises: string[];
  verificationType: "text" | "multiple_choice";
  verificationOptions?: string[];
}

export interface Lab {
  id: string;
  moduleId: string;
  title: string;
  instructions: string;
  expectedOutcomes: string[];
  verificationType: "text" | "multiple_choice";
  verificationOptions?: string[];
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  tags: string[];
  recency: string;
}

export interface UserProgress {
  userId: number;
  completedModules: string[];
  notes: Record<string, string>;
  certificates: string[];
  completedLabs: string[];
}

export interface Notification {
  id: string;
  type: "digest" | "alert" | "reminder" | "new_module";
  content: string;
  timestamp: number;
}

// --- Storage Maps ---

export const userProfiles = new Map<number, UserProfile>();
export const learningPaths = new Map<string, LearningPath>();
export const modules = new Map<string, Module>();
export const labs = new Map<string, Lab>();
export const resources = new Map<string, Resource>();
export const userProgress = new Map<number, UserProgress>();
export const notifications = new Map<string, Notification>();

// Index records (avoid keyspace scans)
export const pathIndex: string[] = [];
export const moduleIndex: string[] = [];
export const labIndex: string[] = [];
export const resourceIndex: string[] = [];

export function getUserProfile(userId: number): UserProfile {
  let profile = userProfiles.get(userId);
  if (!profile) {
    profile = {
      id: userId,
      subscriptionStatus: "free",
      emailOptIn: false,
      enrolledPaths: [],
      notificationsEnabled: true,
    };
    userProfiles.set(userId, profile);
  }
  return profile;
}

export function getUserProgress(userId: number): UserProgress {
  let progress = userProgress.get(userId);
  if (!progress) {
    progress = { userId, completedModules: [], notes: {}, certificates: [], completedLabs: [] };
    userProgress.set(userId, progress);
  }
  return progress;
}

export function getPathById(id: string): LearningPath | undefined {
  return learningPaths.get(id);
}

export function getModuleById(id: string): Module | undefined {
  return modules.get(id);
}

export function getLabById(id: string): Lab | undefined {
  return labs.get(id);
}

export function getModulesForPath(pathId: string): Module[] {
  return moduleIndex.map((id) => modules.get(id)!).filter((m) => m.pathId === pathId);
}

export function getLabsForModule(moduleId: string): Lab[] {
  return labIndex.map((id) => labs.get(id)!).filter((l) => l.moduleId === moduleId);
}

export function getResources(): Resource[] {
  return resourceIndex.map((id) => resources.get(id)!);
}

// --- Seed data ---

export function seedData(): void {
  if (learningPaths.size > 0) return; // already seeded

  // Learning paths
  const paths: LearningPath[] = [
    {
      id: "offense",
      title: "Offensive Security",
      description: "Red team techniques, exploitation, and penetration testing methodologies.",
      modules: ["off-m1", "off-m2", "off-m3"],
      focusArea: "offense",
      accessLevel: "free",
    },
    {
      id: "defense",
      title: "Defensive Security",
      description: "Blue team operations, detection engineering, and incident response.",
      modules: ["def-m1", "def-m2", "def-m3"],
      focusArea: "defense",
      accessLevel: "free",
    },
    {
      id: "research",
      title: "Security Research",
      description: "Vulnerability research, exploit development, and responsible disclosure.",
      modules: ["res-m1", "res-m2"],
      focusArea: "research",
      accessLevel: "pro",
    },
    {
      id: "mixed",
      title: "Mixed Focus",
      description: "A balanced track covering both offensive and defensive techniques.",
      modules: ["mix-m1", "mix-m2"],
      focusArea: "mixed",
      accessLevel: "free",
    },
  ];

  for (const p of paths) {
    learningPaths.set(p.id, p);
    pathIndex.push(p.id);
  }

  // Modules
  const mods: Module[] = [
    { id: "off-m1", pathId: "offense", title: "Reconnaissance Fundamentals", content: "Learn OSINT and active reconnaissance techniques.", links: ["https://example.com/recon"], exercises: ["Run an Nmap scan against a target"], verificationType: "text" },
    { id: "off-m2", pathId: "offense", title: "Web Application Exploitation", content: "OWASP Top 10 and hands-on web hacking.", links: ["https://example.com/owasp"], exercises: ["Find and exploit an SQL injection"], verificationType: "text" },
    { id: "off-m3", pathId: "offense", title: "Post-Exploitation", content: "Privilege escalation and lateral movement.", links: ["https://example.com/privesc"], exercises: ["Escalate from user to admin on a vulnerable VM"], verificationType: "text" },
    { id: "def-m1", pathId: "defense", title: "Log Analysis", content: "Reading and interpreting security logs.", links: ["https://example.com/logs"], exercises: ["Identify a brute-force attack from log entries"], verificationType: "text" },
    { id: "def-m2", pathId: "defense", title: "Incident Response", content: "IR lifecycle from detection to recovery.", links: ["https://example.com/ir"], exercises: ["Write an incident report for a phishing campaign"], verificationType: "text" },
    { id: "def-m3", pathId: "defense", title: "Threat Hunting", content: "Proactive threat detection methodologies.", links: ["https://example.com/hunting"], exercises: ["Hunt for C2 beacon indicators in network traffic"], verificationType: "text" },
    { id: "res-m1", pathId: "research", title: "Vulnerability Discovery", content: "Fuzzing, code review, and static analysis.", links: ["https://example.com/vuln"], exercises: ["Find a buffer overflow in a sample binary"], verificationType: "text" },
    { id: "res-m2", pathId: "research", title: "Exploit Development", content: "From PoC to working exploit.", links: ["https://example.com/exploit"], exercises: ["Write a working ROP chain for a given binary"], verificationType: "text" },
    { id: "mix-m1", pathId: "mixed", title: "Network Security Basics", content: "Firewalls, IDS/IPS, and network monitoring.", links: ["https://example.com/network"], exercises: ["Configure a Snort rule to detect lateral movement"], verificationType: "text" },
    { id: "mix-m2", pathId: "mixed", title: "Endpoint Protection", content: "EDR, anti-malware, and host-based security.", links: ["https://example.com/endpoint"], exercises: ["Analyze a malware sample in a sandbox"], verificationType: "text" },
  ];

  for (const m of mods) {
    modules.set(m.id, m);
    moduleIndex.push(m.id);
  }

  // Labs
  const labData: Lab[] = [
    { id: "lab-recon", moduleId: "off-m1", title: "Network Recon Lab", instructions: "Scan the provided target range and document all open ports and services.", expectedOutcomes: ["Identified all open ports", "Documented service versions"], verificationType: "text" },
    { id: "lab-sqli", moduleId: "off-m2", title: "SQL Injection Lab", instructions: "Find and exploit a SQL injection vulnerability in the target web app.", expectedOutcomes: ["Found injectable parameter", "Extracted database contents"], verificationType: "text" },
    { id: "lab-privesc", moduleId: "off-m3", title: "Privilege Escalation Lab", instructions: "Escalate from a low-privilege user to root on the target system.", expectedOutcomes: ["Identified escalation vector", "Obtained root access"], verificationType: "text" },
    { id: "lab-logs", moduleId: "def-m1", title: "Log Analysis Lab", instructions: "Analyze the provided log files and identify all suspicious activity.", expectedOutcomes: ["Identified attack indicators", "Correlated events across logs"], verificationType: "text" },
    { id: "lab-ir", moduleId: "def-m2", title: "Incident Response Lab", instructions: "Respond to a simulated phishing incident following the IR lifecycle.", expectedOutcomes: ["Contained the incident", "Produced an IR report"], verificationType: "text" },
    { id: "lab-hunt", moduleId: "def-m3", title: "Threat Hunting Lab", instructions: "Hunt for indicators of compromise in network traffic captures.", expectedOutcomes: ["Identified C2 communication", "Mapped attacker infrastructure"], verificationType: "text" },
  ];

  for (const l of labData) {
    labs.set(l.id, l);
    labIndex.push(l.id);
  }

  // Resources
  const resData: Resource[] = [
    { id: "res-1", title: "Nmap Documentation", url: "https://nmap.org/docs.html", tags: ["tool", "recon"], recency: "stable" },
    { id: "res-2", title: "OWASP Testing Guide", url: "https://owasp.org/www-project-web-security-testing-guide/", tags: ["web", "methodology"], recency: "current" },
    { id: "res-3", title: "MITRE ATT&CK Framework", url: "https://attack.mitre.org/", tags: ["framework", "defense"], recency: "current" },
    { id: "res-4", title: "SANS Incident Response Poster", url: "https://www.sans.org/poster/incident-response/", tags: ["ir", "reference"], recency: "current" },
  ];

  for (const r of resData) {
    resources.set(r.id, r);
    resourceIndex.push(r.id);
  }
}

// Auto-seed on import
seedData();
