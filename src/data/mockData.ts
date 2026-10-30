// ============================================================
// FRAUD RING GRAPH — MOCK DATA
// All PII sanitized. Only pseudonymous identifiers used.
// ============================================================

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type RingStatus = 'New' | 'In review' | 'Escalated' | 'Confirmed' | 'Dismissed';
export type UserRole = 'analyst' | 'lead' | 'admin' | 'auditor';

// ─── PERSONAS ────────────────────────────────────────────────
export interface Persona {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  avatar: string;
  homePath: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'aiko',
    name: 'Aiko Tanaka',
    role: 'analyst',
    department: 'Tokyo AML Operations',
    avatar: 'AT',
    homePath: '/dashboard',
  },
  {
    id: 'kenji',
    name: 'Kenji Sato',
    role: 'lead',
    department: 'Financial Crime Compliance',
    avatar: 'KS',
    homePath: '/team-overview',
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    role: 'admin',
    department: 'Infrastructure & ML Ops',
    avatar: 'ML',
    homePath: '/system-activity',
  },
  {
    id: 'daniel',
    name: 'Daniel Vance',
    role: 'auditor',
    department: 'Independent Risk & Compliance Assurance',
    avatar: 'DV',
    homePath: '/audit-log',
  },
];

// ─── FRAUD RINGS ─────────────────────────────────────────────
export interface FraudRing {
  id: string;
  riskScore: number;
  riskLevel: RiskLevel;
  pattern: string;
  accountCount: number;
  totalVolume: number;
  status: RingStatus;
  firstSeen: string;
  assignedTo?: string;
  keyReasons: string[];
  rulesFired: string[];
  accounts: string[];
  devices: string[];
  description: string;
  escalatedBy?: string;
  escalatedNote?: string;
  notes: RingNote[];
}

export interface RingNote {
  id: string;
  author: string;
  role: UserRole;
  timestamp: string;
  content: string;
  action?: string;
}

export const FRAUD_RINGS: FraudRing[] = [
  {
    id: 'R-0042',
    riskScore: 92,
    riskLevel: 'Critical',
    pattern: 'Circular Flow',
    accountCount: 7,
    totalVolume: 248000,
    status: 'In review',
    firstSeen: 'Oct 18, 2026 14:32',
    assignedTo: 'Aiko Tanaka',
    keyReasons: ['3-hop cycle in 2h', 'shared device ×9', 'high transaction velocity', 'fan-in from 5 accounts'],
    rulesFired: ['fan_in', 'circular_flow_3hop', 'rapid_pass_through'],
    accounts: ['ACC-1021', 'ACC-1187', 'ACC-1342', 'ACC-1519', 'ACC-1611', 'ACC-1660', 'ACC-1678'],
    devices: ['DEV-883'],
    description: 'Funds cycle ACC-1021 → ACC-1187 → ACC-1342 → ACC-1021 within 2 hours. Seven accounts share device DEV-883. Individual transaction risk scores were all below 40 — the ring was only visible through graph connections.',
    notes: [
      {
        id: 'n1',
        author: 'System',
        role: 'admin',
        timestamp: 'Oct 18, 2026 14:32',
        content: 'Ring automatically detected. GNN score: 92. Alert raised.',
        action: 'Ring detected',
      },
      {
        id: 'n2',
        author: 'Kenji Sato',
        role: 'lead',
        timestamp: 'Oct 18, 2026 15:01',
        content: 'High-volume ring — assigned to Aiko for initial review.',
        action: 'Assigned',
      },
    ],
  },
  {
    id: 'R-0018',
    riskScore: 88,
    riskLevel: 'Critical',
    pattern: 'Mule Chain',
    accountCount: 5,
    totalVolume: 168600,
    status: 'New',
    firstSeen: 'Oct 17, 2026 09:15',
    keyReasons: ['fan-in pattern', 'rapid pass-through', 'new accounts'],
    rulesFired: ['mule_chain_5hop', 'rapid_pass_through', 'new_account_high_volume'],
    accounts: ['ACC-2201', 'ACC-2334', 'ACC-2501', 'ACC-2677', 'ACC-2890'],
    devices: ['DEV-441', 'DEV-229'],
    description: 'Classic mule chain: funds aggregated at ACC-2201 then fanned out through 4 pass-through accounts before exit. All 5 accounts are less than 30 days old.',
    notes: [
      {
        id: 'n1',
        author: 'System',
        role: 'admin',
        timestamp: 'Oct 17, 2026 09:15',
        content: 'Ring automatically detected. GNN score: 88. Alert raised.',
        action: 'Ring detected',
      },
    ],
  },
  {
    id: 'R-0061',
    riskScore: 66,
    riskLevel: 'High',
    pattern: 'Shared Identity',
    accountCount: 6,
    totalVolume: 82410,
    status: 'In review',
    firstSeen: 'Oct 16, 2026 11:42',
    assignedTo: 'Aiko Tanaka',
    keyReasons: ['shared device ×4', 'shared IP cluster'],
    rulesFired: ['shared_device_cluster', 'ip_clustering'],
    accounts: ['ACC-3100', 'ACC-3241', 'ACC-3319', 'ACC-3402', 'ACC-3598', 'ACC-3711'],
    devices: ['DEV-117', 'DEV-293'],
    description: '6 accounts sharing 2 devices and 3 IP addresses in the same /24 subnet. Moderate transaction velocity.',
    notes: [],
  },
  {
    id: 'R-0035',
    riskScore: 53,
    riskLevel: 'Medium',
    pattern: 'Fan-Out',
    accountCount: 4,
    totalVolume: 64230,
    status: 'New',
    firstSeen: 'Oct 15, 2026 16:20',
    keyReasons: ['multiple small transfers', 'structuring pattern'],
    rulesFired: ['fan_out', 'structuring_below_10k'],
    accounts: ['ACC-4001', 'ACC-4128', 'ACC-4209', 'ACC-4377'],
    devices: [],
    description: 'Single source account splits funds into 4 destination accounts in amounts just below reporting threshold.',
    notes: [],
  },
  {
    id: 'R-0027',
    riskScore: 45,
    riskLevel: 'Medium',
    pattern: 'Pass-Through',
    accountCount: 3,
    totalVolume: 41970,
    status: 'Dismissed',
    firstSeen: 'Oct 14, 2026 08:55',
    keyReasons: ['high velocity'],
    rulesFired: ['rapid_pass_through'],
    accounts: ['ACC-5001', 'ACC-5102', 'ACC-5200'],
    devices: [],
    description: 'Three-account pass-through chain. Dismissed after review — identified as legitimate business payment to suppliers.',
    notes: [
      {
        id: 'n1',
        author: 'System',
        role: 'admin',
        timestamp: 'Oct 14, 2026 08:55',
        content: 'Ring automatically detected.',
        action: 'Ring detected',
      },
      {
        id: 'n2',
        author: 'Aiko Tanaka',
        role: 'analyst',
        timestamp: 'Oct 14, 2026 14:30',
        content: 'Reviewed — legitimate B2B supplier payments. Accounts verified by compliance team.',
        action: 'Dismissed',
      },
    ],
  },
  {
    id: 'R-0055',
    riskScore: 79,
    riskLevel: 'High',
    pattern: 'Layering',
    accountCount: 8,
    totalVolume: 312500,
    status: 'Escalated',
    firstSeen: 'Oct 19, 2026 07:30',
    assignedTo: 'Aiko Tanaka',
    escalatedBy: 'Aiko Tanaka',
    escalatedNote: 'Large volume and complex layering — requires Lead review before decision.',
    keyReasons: ['multi-layer structuring', 'offshore indicators', '8-hop chain'],
    rulesFired: ['layering_8hop', 'cross_border_velocity', 'structuring_below_10k'],
    accounts: ['ACC-6001', 'ACC-6088', 'ACC-6177', 'ACC-6244', 'ACC-6312', 'ACC-6401', 'ACC-6500', 'ACC-6609'],
    devices: ['DEV-521', 'DEV-738'],
    description: 'Complex 8-hop layering with funds flowing through multiple intermediary accounts. High-value transfers suggest organised financial crime.',
    notes: [
      {
        id: 'n1',
        author: 'System',
        role: 'admin',
        timestamp: 'Oct 19, 2026 07:30',
        content: 'Ring automatically detected. GNN score: 79.',
        action: 'Ring detected',
      },
      {
        id: 'n2',
        author: 'Aiko Tanaka',
        role: 'analyst',
        timestamp: 'Oct 19, 2026 09:45',
        content: 'Large volume and complex layering — requires Lead review before decision.',
        action: 'Escalated to Lead',
      },
    ],
  },
];

// ─── TRANSACTIONS ─────────────────────────────────────────────
export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: string;
  riskScore: number;
  ring?: string;
  type: string;
  status: string;
}

export const TRANSACTIONS: Transaction[] = [
  { id: 'TXN-7242', from: 'ACC-1021', to: 'ACC-1187', amount: 42000, timestamp: 'Oct 18, 2026 14:12', riskScore: 38, ring: 'R-0042', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN-7560', from: 'ACC-1187', to: 'ACC-1342', amount: 41000, timestamp: 'Oct 18, 2026 14:45', riskScore: 35, ring: 'R-0042', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN-7621', from: 'ACC-1342', to: 'ACC-1519', amount: 38500, timestamp: 'Oct 18, 2026 15:10', riskScore: 33, ring: 'R-0042', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN-7810', from: 'ACC-1519', to: 'ACC-1611', amount: 40000, timestamp: 'Oct 18, 2026 15:30', riskScore: 37, ring: 'R-0042', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN-7881', from: 'ACC-1611', to: 'ACC-1660', amount: 39000, timestamp: 'Oct 18, 2026 15:55', riskScore: 34, ring: 'R-0042', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN-7950', from: 'ACC-1660', to: 'ACC-1678', amount: 37500, timestamp: 'Oct 18, 2026 16:15', riskScore: 31, ring: 'R-0042', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN-8001', from: 'ACC-1678', to: 'ACC-1021', amount: 10000, timestamp: 'Oct 18, 2026 16:32', riskScore: 29, ring: 'R-0042', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN-5001', from: 'ACC-2201', to: 'ACC-2334', amount: 9800, timestamp: 'Oct 17, 2026 09:10', riskScore: 72, ring: 'R-0018', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN-5100', from: 'ACC-2201', to: 'ACC-2501', amount: 9700, timestamp: 'Oct 17, 2026 09:12', riskScore: 74, ring: 'R-0018', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN-5201', from: 'ACC-3100', to: 'ACC-3241', amount: 15000, timestamp: 'Oct 16, 2026 11:30', riskScore: 55, ring: 'R-0061', type: 'Transfer', status: 'Under Review' },
  { id: 'TXN-3001', from: 'CUST-9001', to: 'ACC-4001', amount: 4500, timestamp: 'Oct 15, 2026 16:00', riskScore: 22, type: 'Deposit', status: 'Normal' },
  { id: 'TXN-3100', from: 'ACC-4001', to: 'ACC-4128', amount: 4400, timestamp: 'Oct 15, 2026 16:05', riskScore: 41, ring: 'R-0035', type: 'Transfer', status: 'Under Review' },
];

// ─── ACCOUNTS ─────────────────────────────────────────────────
export interface Account {
  id: string;
  customerId: string;
  type: string;
  age: number;
  totalVolume: number;
  inflow: number;
  outflow: number;
  riskScore: number;
  riskLevel: RiskLevel;
  ring?: string;
  deviceCount: number;
  transactionCount: number;
  role?: string;
  status: string;
}

export const ACCOUNTS: Account[] = [
  { id: 'ACC-1021', customerId: 'CUST-8842', type: 'Bank Account', age: 23, totalVolume: 248000, inflow: 154400, outflow: 122000, riskScore: 38, riskLevel: 'Low', ring: 'R-0042', deviceCount: 2, transactionCount: 24, role: 'Source', status: 'Flagged' },
  { id: 'ACC-1187', customerId: 'CUST-1021', type: 'Bank Account', age: 31, totalVolume: 185000, inflow: 118000, outflow: 92000, riskScore: 35, riskLevel: 'Low', ring: 'R-0042', deviceCount: 3, transactionCount: 19, role: 'Pass-through', status: 'Flagged' },
  { id: 'ACC-1342', customerId: 'CUST-1187', type: 'Bank Account', age: 17, totalVolume: 163000, inflow: 105000, outflow: 87000, riskScore: 33, riskLevel: 'Low', ring: 'R-0042', deviceCount: 2, transactionCount: 16, role: 'Pass-through', status: 'Flagged' },
  { id: 'ACC-1519', customerId: 'CUST-2241', type: 'Bank Account', age: 45, totalVolume: 142000, inflow: 92000, outflow: 71000, riskScore: 37, riskLevel: 'Low', ring: 'R-0042', deviceCount: 1, transactionCount: 14, role: 'Pass-through', status: 'Flagged' },
  { id: 'ACC-1611', customerId: 'CUST-3392', type: 'Bank Account', age: 12, totalVolume: 128000, inflow: 84000, outflow: 63000, riskScore: 34, riskLevel: 'Low', ring: 'R-0042', deviceCount: 2, transactionCount: 12, role: 'Collector', status: 'Flagged' },
  { id: 'ACC-1660', customerId: 'CUST-4418', type: 'Bank Account', age: 8, totalVolume: 115000, inflow: 75000, outflow: 57000, riskScore: 31, riskLevel: 'Low', ring: 'R-0042', deviceCount: 1, transactionCount: 11, role: 'Pass-through', status: 'Flagged' },
  { id: 'ACC-1678', customerId: 'CUST-5521', type: 'Bank Account', age: 19, totalVolume: 98000, inflow: 62000, outflow: 49000, riskScore: 29, riskLevel: 'Low', ring: 'R-0042', deviceCount: 2, transactionCount: 9, role: 'Collector', status: 'Flagged' },
  { id: 'ACC-2201', customerId: 'CUST-6614', type: 'Bank Account', age: 14, totalVolume: 168600, inflow: 168600, outflow: 120000, riskScore: 82, riskLevel: 'High', ring: 'R-0018', deviceCount: 1, transactionCount: 22, role: 'Collector', status: 'Flagged' },
  { id: 'ACC-3100', customerId: 'CUST-7701', type: 'Savings Account', age: 62, totalVolume: 82410, inflow: 60000, outflow: 48000, riskScore: 55, riskLevel: 'Medium', ring: 'R-0061', deviceCount: 2, transactionCount: 18, status: 'Under Review' },
  { id: 'ACC-4001', customerId: 'CUST-9901', type: 'Bank Account', age: 120, totalVolume: 64230, inflow: 45000, outflow: 38000, riskScore: 22, riskLevel: 'Low', ring: 'R-0035', deviceCount: 1, transactionCount: 8, status: 'Normal' },
];

// ─── GRAPH NODES (for Network Explorer) ───────────────────────
export interface GraphNode {
  id: string;
  type: 'account' | 'device' | 'phone' | 'ip' | 'hub';
  label: string;
  riskScore?: number;
  riskLevel?: RiskLevel;
  ring?: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'transfer' | 'shared_device' | 'shared_phone' | 'shared_ip';
  weight?: number;
  amount?: number;
  timestamp?: string;
}

export const GRAPH_NODES: GraphNode[] = [
  { id: 'ACC-1021', type: 'account', label: 'ACC-1021', riskScore: 38, riskLevel: 'Low', ring: 'R-0042', x: 300, y: 200 },
  { id: 'ACC-1187', type: 'account', label: 'ACC-1187', riskScore: 35, riskLevel: 'Low', ring: 'R-0042', x: 480, y: 120 },
  { id: 'ACC-1342', type: 'account', label: 'ACC-1342', riskScore: 33, riskLevel: 'Low', ring: 'R-0042', x: 580, y: 280 },
  { id: 'ACC-1519', type: 'account', label: 'ACC-1519', riskScore: 37, riskLevel: 'Low', ring: 'R-0042', x: 480, y: 400 },
  { id: 'ACC-1611', type: 'account', label: 'ACC-1611', riskScore: 34, riskLevel: 'Low', ring: 'R-0042', x: 300, y: 450 },
  { id: 'ACC-1660', type: 'account', label: 'ACC-1660', riskScore: 31, riskLevel: 'Low', ring: 'R-0042', x: 160, y: 360 },
  { id: 'ACC-1678', type: 'account', label: 'ACC-1678', riskScore: 29, riskLevel: 'Low', ring: 'R-0042', x: 140, y: 200 },
  { id: 'DEV-883', type: 'device', label: 'DEV-883', x: 360, y: 300 },
  { id: 'ACC-2201', type: 'account', label: 'ACC-2201', riskScore: 82, riskLevel: 'High', ring: 'R-0018', x: 720, y: 180 },
  { id: 'ACC-2334', type: 'account', label: 'ACC-2334', riskScore: 68, riskLevel: 'High', ring: 'R-0018', x: 860, y: 120 },
  { id: 'ACC-2501', type: 'account', label: 'ACC-2501', riskScore: 71, riskLevel: 'High', ring: 'R-0018', x: 870, y: 240 },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { id: 'e1', source: 'ACC-1021', target: 'ACC-1187', type: 'transfer', amount: 42000 },
  { id: 'e2', source: 'ACC-1187', target: 'ACC-1342', type: 'transfer', amount: 41000 },
  { id: 'e3', source: 'ACC-1342', target: 'ACC-1519', type: 'transfer', amount: 38500 },
  { id: 'e4', source: 'ACC-1519', target: 'ACC-1611', type: 'transfer', amount: 40000 },
  { id: 'e5', source: 'ACC-1611', target: 'ACC-1660', type: 'transfer', amount: 39000 },
  { id: 'e6', source: 'ACC-1660', target: 'ACC-1678', type: 'transfer', amount: 37500 },
  { id: 'e7', source: 'ACC-1678', target: 'ACC-1021', type: 'transfer', amount: 10000 },
  { id: 'e8', source: 'DEV-883', target: 'ACC-1021', type: 'shared_device' },
  { id: 'e9', source: 'DEV-883', target: 'ACC-1187', type: 'shared_device' },
  { id: 'e10', source: 'DEV-883', target: 'ACC-1342', type: 'shared_device' },
  { id: 'e11', source: 'DEV-883', target: 'ACC-1519', type: 'shared_device' },
  { id: 'e12', source: 'DEV-883', target: 'ACC-1611', type: 'shared_device' },
  { id: 'e13', source: 'DEV-883', target: 'ACC-1660', type: 'shared_device' },
  { id: 'e14', source: 'DEV-883', target: 'ACC-1678', type: 'shared_device' },
  { id: 'e15', source: 'ACC-2201', target: 'ACC-2334', type: 'transfer', amount: 9800 },
  { id: 'e16', source: 'ACC-2201', target: 'ACC-2501', type: 'transfer', amount: 9700 },
];

// ─── AUDIT LOG ────────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  actionType: 'Login' | 'Logout' | 'Decision' | 'Rule Change' | 'Model Promotion' | 'User Change' | 'Data Export' | 'Assignment' | 'System';
  entity?: string;
  details: string;
  comment: string;
}

export const AUDIT_LOG: AuditEntry[] = [
  { id: 'AL-001', timestamp: 'Oct 30, 2026 08:02', user: 'Aiko Tanaka', role: 'analyst', action: 'Login', actionType: 'Login', details: 'Successful login from 192.168.1.x', comment: '' },
  { id: 'AL-002', timestamp: 'Oct 30, 2026 08:05', user: 'Aiko Tanaka', role: 'analyst', action: 'Viewed Ring', actionType: 'Decision', entity: 'R-0042', details: 'Opened ring detail', comment: '' },
  { id: 'AL-003', timestamp: 'Oct 29, 2026 14:12', user: 'Kenji Sato', role: 'lead', action: 'Assigned Ring', actionType: 'Assignment', entity: 'R-0042', details: 'Assigned to Aiko Tanaka', comment: 'High-volume ring — assigned to Aiko for initial review.' },
  { id: 'AL-004', timestamp: 'Oct 29, 2026 13:40', user: 'Mei Lin', role: 'admin', action: 'Run Detection', actionType: 'System', entity: 'Detection Job', details: 'Detection run completed: 15 rings, 42 alerts', comment: 'Scheduled weekly detection run.' },
  { id: 'AL-005', timestamp: 'Oct 28, 2026 11:20', user: 'Mei Lin', role: 'admin', action: 'Model Training', actionType: 'Model Promotion', entity: 'GNN v2.3.1', details: 'Trained on 248 new labels. AUC-PR: 0.912', comment: 'Model retrained after analyst batch — improved recall on circular flow patterns.' },
  { id: 'AL-006', timestamp: 'Oct 28, 2026 09:55', user: 'Aiko Tanaka', role: 'analyst', action: 'Escalated to Lead', actionType: 'Decision', entity: 'R-0055', details: 'Escalated Ring R-0055 to Kenji Sato', comment: 'Large volume and complex layering — requires Lead review before decision.' },
  { id: 'AL-007', timestamp: 'Oct 27, 2026 16:30', user: 'Daniel Vance', role: 'auditor', action: 'Export Report', actionType: 'Data Export', entity: 'Audit Log', details: 'CSV export of Oct 2026 audit log (244 records)', comment: 'Monthly compliance report export.' },
  { id: 'AL-008', timestamp: 'Oct 27, 2026 10:15', user: 'Mei Lin', role: 'admin', action: 'Rule Change', actionType: 'Rule Change', entity: 'fan_in threshold', details: 'Previous: 8→ 6 senders in 24h. Preview: +6 rings, -2 rings', comment: 'Tightened fan-in threshold based on Lead recommendation. Family sharing device → higher specificity.' },
  { id: 'AL-009', timestamp: 'Oct 26, 2026 14:00', user: 'Kenji Sato', role: 'lead', action: 'Confirmed Fraud', actionType: 'Decision', entity: 'R-0038', details: 'Ring R-0038 confirmed as fraud. Labels stored for retraining.', comment: 'Clear circular flow with offshore indicators. SAR will be filed.' },
  { id: 'AL-010', timestamp: 'Oct 25, 2026 09:30', user: 'Mei Lin', role: 'admin', action: 'User Created', actionType: 'User Change', entity: 'CUST-USER-014', details: 'New analyst user created: role=analyst, dept=Tokyo AML', comment: 'New hire onboarding — system access provisioned.' },
];

// ─── DETECTION RULES ─────────────────────────────────────────
export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  threshold: number;
  unit: string;
  min: number;
  max: number;
  hitCount: number;
  ringImpact: number;
  enabled: boolean;
  lastModified: string;
  modifiedBy: string;
}

export const DETECTION_RULES: DetectionRule[] = [
  { id: 'fan_in', name: 'Mule Fan-in Threshold', description: 'Max senders to a single account within 24 hours before flagging', threshold: 6, unit: 'senders / 24h', min: 2, max: 20, hitCount: 142, ringImpact: 28, enabled: true, lastModified: 'Oct 27, 2026', modifiedBy: 'Mei Lin' },
  { id: 'circular_flow_3hop', name: 'Circular Flow Min Hops', description: 'Minimum number of hops in a cycle to be considered a ring', threshold: 3, unit: 'hops', min: 2, max: 8, hitCount: 87, ringImpact: 19, enabled: true, lastModified: 'Oct 20, 2026', modifiedBy: 'Mei Lin' },
  { id: 'rapid_pass_through', name: 'Rapid Pass-Through Window', description: 'Funds must leave an account within this window to be flagged', threshold: 120, unit: 'minutes', min: 15, max: 480, hitCount: 204, ringImpact: 45, enabled: true, lastModified: 'Oct 15, 2026', modifiedBy: 'System' },
  { id: 'mule_chain_5hop', name: 'Mule Chain Depth', description: 'Maximum depth of a linear chain for mule detection', threshold: 5, unit: 'hops', min: 3, max: 10, hitCount: 56, ringImpact: 12, enabled: true, lastModified: 'Oct 10, 2026', modifiedBy: 'Mei Lin' },
  { id: 'new_account_high_volume', name: 'New Account Volume Alert', description: 'Alert when accounts less than N days old transact above threshold volume', threshold: 30, unit: 'days', min: 7, max: 90, hitCount: 38, ringImpact: 8, enabled: true, lastModified: 'Oct 05, 2026', modifiedBy: 'System' },
  { id: 'structuring_below_10k', name: 'Structuring Detection', description: 'Flag transactions clustering below reporting threshold', threshold: 9500, unit: 'USD max', min: 5000, max: 9999, hitCount: 311, ringImpact: 62, enabled: true, lastModified: 'Sep 28, 2026', modifiedBy: 'Mei Lin' },
];

// ─── MODEL VERSIONS ───────────────────────────────────────────
export interface ModelVersion {
  id: string;
  name: string;
  version: string;
  trainedOn: string;
  promotedBy?: string;
  status: 'Active' | 'Archived' | 'Staging';
  precision: number;
  recall: number;
  f1: number;
  aucPR: number;
  ringRecall: number;
  labelCount: number;
  drift: number;
  split: string;
  datasetHash: string;
}

export const MODEL_VERSIONS: ModelVersion[] = [
  { id: 'gnn-v231', name: 'Graph Neural Network', version: 'v2.3.1', trainedOn: 'Oct 28, 2026', promotedBy: 'Mei Lin', status: 'Active', precision: 0.88, recall: 0.81, f1: 0.843, aucPR: 0.912, ringRecall: 0.94, labelCount: 1248, drift: 0.038, split: 'Temporal 70/15/15', datasetHash: 'a3f2c8...d91e' },
  { id: 'xgb-v18', name: 'XGBoost Ensemble', version: 'v1.8', trainedOn: 'Oct 10, 2026', status: 'Staging', precision: 0.84, recall: 0.76, f1: 0.798, aucPR: 0.871, ringRecall: 0.88, labelCount: 1000, drift: 0.062, split: 'Temporal 70/15/15', datasetHash: 'b7e1a4...c23f' },
  { id: 'iso-v32', name: 'Isolation Forest', version: 'v3.2', trainedOn: 'Sep 15, 2026', status: 'Archived', precision: 0.79, recall: 0.71, f1: 0.748, aucPR: 0.802, ringRecall: 0.81, labelCount: 850, drift: 0.11, split: 'Random 80/20', datasetHash: 'c2d8b1...f44a' },
  { id: 'txn-only-v5', name: 'Transaction-only Baseline', version: 'v5', trainedOn: 'Aug 01, 2026', status: 'Archived', precision: 0.71, recall: 0.63, f1: 0.668, aucPR: 0.714, ringRecall: 0.64, labelCount: 600, drift: 0.19, split: 'Random 80/20', datasetHash: 'd4f9c2...a17b' },
];

// ─── USERS (Admin) ────────────────────────────────────────────
export interface SystemUser {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Disabled';
  lastLogin: string;
  createdAt: string;
}

export const SYSTEM_USERS: SystemUser[] = [
  { id: 'USR-001', name: 'Aiko Tanaka', role: 'analyst', department: 'Tokyo AML Operations', status: 'Active', lastLogin: 'Oct 30, 2026 08:02', createdAt: 'Jan 15, 2025' },
  { id: 'USR-002', name: 'Kenji Sato', role: 'lead', department: 'Financial Crime Compliance', status: 'Active', lastLogin: 'Oct 30, 2026 07:58', createdAt: 'Mar 02, 2024' },
  { id: 'USR-003', name: 'Mei Lin', role: 'admin', department: 'Infrastructure & ML Ops', status: 'Active', lastLogin: 'Oct 30, 2026 07:45', createdAt: 'Jun 10, 2023' },
  { id: 'USR-004', name: 'Daniel Vance', role: 'auditor', department: 'Independent Risk & Compliance', status: 'Active', lastLogin: 'Oct 29, 2026 16:30', createdAt: 'Sep 01, 2024' },
  { id: 'USR-005', name: 'Michael J.', role: 'analyst', department: 'Tokyo AML Operations', status: 'Active', lastLogin: 'Oct 30, 2026 08:10', createdAt: 'Feb 28, 2025' },
  { id: 'USR-006', name: 'Anna S.', role: 'analyst', department: 'APAC Fraud Team', status: 'Active', lastLogin: 'Oct 29, 2026 17:05', createdAt: 'Apr 15, 2025' },
  { id: 'USR-007', name: 'Ravi K.', role: 'analyst', department: 'Tokyo AML Operations', status: 'Active', lastLogin: 'Oct 30, 2026 09:00', createdAt: 'Jul 01, 2025' },
  { id: 'USR-008', name: 'Kira M.', role: 'analyst', department: 'APAC Fraud Team', status: 'Disabled', lastLogin: 'Oct 10, 2026 14:00', createdAt: 'Aug 20, 2024' },
];

// ─── ANALYST WORKLOAD ─────────────────────────────────────────
export const ANALYST_WORKLOAD = [
  { name: 'Aiko Tanaka', open: 5, inReview: 3, resolved: 12 },
  { name: 'Michael J.', open: 4, inReview: 2, resolved: 8 },
  { name: 'Anna S.', open: 3, inReview: 4, resolved: 10 },
  { name: 'Ravi K.', open: 6, inReview: 1, resolved: 6 },
  { name: 'Kira M.', open: 0, inReview: 0, resolved: 4 },
];

// ─── SYSTEM JOBS ─────────────────────────────────────────────
export interface SystemJob {
  id: string;
  type: string;
  status: 'Completed' | 'Running' | 'Failed';
  startTime: string;
  duration: string;
  records: number;
}

export const SYSTEM_JOBS: SystemJob[] = [
  { id: 'JOB-0841', type: 'Data Ingestion', status: 'Completed', startTime: 'Oct 28, 13:42', duration: '8m 21s', records: 125430 },
  { id: 'JOB-0841-D', type: 'Run Detection', status: 'Completed', startTime: 'Oct 28, 13:55', duration: '6m 13s', records: 98350 },
  { id: 'JOB-0842', type: 'Model Training', status: 'Running', startTime: 'Oct 29, 11:20', duration: '25m 10s+', records: 0 },
  { id: 'JOB-0843', type: 'Data Ingestion', status: 'Failed', startTime: 'Oct 29, 15:41', duration: '2m 30s', records: 0 },
];

// ─── CHART DATA ───────────────────────────────────────────────
export const PATTERN_DISTRIBUTION = [
  { pattern: 'Circular Flow', count: 34, pct: 28 },
  { pattern: 'Mule Chain', count: 28, pct: 23 },
  { pattern: 'Fan-Out', count: 22, pct: 18 },
  { pattern: 'Layering', count: 18, pct: 15 },
  { pattern: 'Shared Identity', count: 14, pct: 11 },
  { pattern: 'Pass-Through', count: 6, pct: 5 },
];

export const ALERT_PRECISION_TREND = [
  { week: 'W38', precision: 0.71, recall: 0.68 },
  { week: 'W39', precision: 0.73, recall: 0.70 },
  { week: 'W40', precision: 0.76, recall: 0.72 },
  { week: 'W41', precision: 0.79, recall: 0.75 },
  { week: 'W42', precision: 0.82, recall: 0.78 },
  { week: 'W43', precision: 0.85, recall: 0.80 },
  { week: 'W44', precision: 0.88, recall: 0.81 },
];

export const CONFIRM_DISMISS_DATA = [
  { month: 'Jun', confirmed: 42, dismissed: 28 },
  { month: 'Jul', confirmed: 48, dismissed: 24 },
  { month: 'Aug', confirmed: 51, dismissed: 21 },
  { month: 'Sep', confirmed: 55, dismissed: 19 },
  { month: 'Oct', confirmed: 58, dismissed: 16 },
];

export const RING_GROWTH_TREND = [
  { week: 'W38', rings: 18 },
  { week: 'W39', rings: 22 },
  { week: 'W40', rings: 19 },
  { week: 'W41', rings: 28 },
  { week: 'W42', rings: 31 },
  { week: 'W43', rings: 26 },
  { week: 'W44', rings: 33 },
];
