export const AgentRole = {
  PRODUCT_MANAGER: 'product_manager',
  PROJECT_MANAGER: 'project_manager',
  FRONTEND_DEV: 'frontend_dev',
  BACKEND_DEV: 'backend_dev',
  FULLSTACK_DEV: 'fullstack_dev',
  BI_ANALYST: 'bi_analyst',
  SECURITY_ENGINEER: 'security_engineer',
  QA_ENGINEER: 'qa_engineer',
  DEVOPS_ENGINEER: 'devops_engineer',
  UX_DESIGNER: 'ux_designer',
} as const;

export type AgentRole = (typeof AgentRole)[keyof typeof AgentRole];

export const AgentStatus = {
  IDLE: 'idle',
  WORKING: 'working',
  TALKING: 'talking',
  BLOCKED: 'blocked',
  OFFLINE: 'offline',
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

export interface AgentProfile {
  role: AgentRole;
  label: string;
  description: string;
  skills: string[];
  costPerTick: number;
  color: string;
  icon: string;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  currentTaskId: string | null;
  position: { x: number; y: number };
  tokensUsed: number;
  messagesSent: number;
  createdAt: number;
}

export const AGENT_PROFILES: Record<AgentRole, AgentProfile> = {
  [AgentRole.PRODUCT_MANAGER]: {
    role: AgentRole.PRODUCT_MANAGER,
    label: 'Product Manager',
    description: 'Defines product vision, prioritizes features, and writes user stories.',
    skills: ['roadmap', 'user-stories', 'prioritization', 'stakeholder-mgmt'],
    costPerTick: 5,
    color: '#6366f1',
    icon: '📋',
  },
  [AgentRole.PROJECT_MANAGER]: {
    role: AgentRole.PROJECT_MANAGER,
    label: 'Project Manager',
    description: 'Coordinates tasks, manages timelines, and unblocks the team.',
    skills: ['planning', 'coordination', 'risk-mgmt', 'reporting'],
    costPerTick: 4,
    color: '#8b5cf6',
    icon: '📊',
  },
  [AgentRole.FRONTEND_DEV]: {
    role: AgentRole.FRONTEND_DEV,
    label: 'Frontend Developer',
    description: 'Builds user interfaces and client-side logic.',
    skills: ['react', 'css', 'accessibility', 'performance'],
    costPerTick: 3,
    color: '#06b6d4',
    icon: '🎨',
  },
  [AgentRole.BACKEND_DEV]: {
    role: AgentRole.BACKEND_DEV,
    label: 'Backend Developer',
    description: 'Builds APIs, services, and server-side logic.',
    skills: ['api-design', 'databases', 'microservices', 'caching'],
    costPerTick: 3,
    color: '#10b981',
    icon: '⚙️',
  },
  [AgentRole.FULLSTACK_DEV]: {
    role: AgentRole.FULLSTACK_DEV,
    label: 'Fullstack Developer',
    description: 'Works across the entire stack.',
    skills: ['react', 'api-design', 'databases', 'deployment'],
    costPerTick: 4,
    color: '#f59e0b',
    icon: '🔧',
  },
  [AgentRole.BI_ANALYST]: {
    role: AgentRole.BI_ANALYST,
    label: 'BI Analyst',
    description: 'Analyzes data, builds dashboards, and provides insights.',
    skills: ['sql', 'dashboards', 'data-modeling', 'reporting'],
    costPerTick: 3,
    color: '#ec4899',
    icon: '📈',
  },
  [AgentRole.SECURITY_ENGINEER]: {
    role: AgentRole.SECURITY_ENGINEER,
    label: 'Security Engineer',
    description: 'Reviews code for vulnerabilities and implements security measures.',
    skills: ['pen-testing', 'code-review', 'auth', 'compliance'],
    costPerTick: 4,
    color: '#ef4444',
    icon: '🛡️',
  },
  [AgentRole.QA_ENGINEER]: {
    role: AgentRole.QA_ENGINEER,
    label: 'QA Engineer',
    description: 'Tests features, writes test plans, and reports bugs.',
    skills: ['test-automation', 'manual-testing', 'bug-reporting', 'regression'],
    costPerTick: 2,
    color: '#14b8a6',
    icon: '🧪',
  },
  [AgentRole.DEVOPS_ENGINEER]: {
    role: AgentRole.DEVOPS_ENGINEER,
    label: 'DevOps Engineer',
    description: 'Manages infrastructure, CI/CD pipelines, and deployments.',
    skills: ['docker', 'ci-cd', 'monitoring', 'cloud'],
    costPerTick: 4,
    color: '#f97316',
    icon: '🚀',
  },
  [AgentRole.UX_DESIGNER]: {
    role: AgentRole.UX_DESIGNER,
    label: 'UX Designer',
    description: 'Designs user flows, wireframes, and visual interfaces.',
    skills: ['wireframing', 'prototyping', 'user-research', 'design-systems'],
    costPerTick: 3,
    color: '#a855f7',
    icon: '✏️',
  },
};
