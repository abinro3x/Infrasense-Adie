

import { User, Board, TestJob, UserRole, UserStatus, BoardStatus, BoardType, TestStatus, Notification, SupportRequest, SupportStatus, SupportMessage, TestCase, AiConfig, AiProvider } from '../types';

// Storage Keys
const KEYS = {
  USERS: 'infrasense_db_users',
  BOARDS: 'infrasense_db_boards',
  JOBS: 'infrasense_db_jobs',
  JOB_SEQ: 'infrasense_db_job_seq',
  NOTIFICATIONS: 'infrasense_db_notifications',
  SUPPORT: 'infrasense_db_support',
  TESTS: 'infrasense_db_tests',
  AI_CONFIG: 'infrasense_ai_config'
};

// --- SEED DATA ---

const SEED_USERS: User[] = [
  { id: 'ADMI01', name: 'System Admin', email: 'admin@intel.com', role: UserRole.ADMIN, status: UserStatus.ACTIVE, businessUnit: 'IT', geosite: 'Santa Clara', project: 'Lab Infra' },
  { id: 'ALIC02', name: 'Alice Engineer', email: 'tester@intel.com', role: UserRole.TESTER, status: UserStatus.ACTIVE, businessUnit: 'CCG', geosite: 'Hillsboro', project: 'Meteor Lake Validation' },
  { id: 'CHAR03', name: 'Charlie Dev', email: 'user@intel.com', role: UserRole.USER, status: UserStatus.ACTIVE, businessUnit: 'DCAI', geosite: 'Haifa', project: 'Gaudi SW' },
  { id: 'BOBV04', name: 'Bob Viewer', email: 'viewer@intel.com', role: UserRole.VIEWER, status: UserStatus.ACTIVE, businessUnit: 'SMG', geosite: 'Bangalore', project: 'Sales Enablement' },
];

const SEED_BOARDS: Board[] = [
  { 
    id: '1', 
    name: 'NUC-13-Extreme', 
    ip: '192.168.1.101', 
    type: BoardType.PHYSICAL,
    status: BoardStatus.ONLINE, 
    visibility: 'PUBLIC',
    location: 'Lab 1, Rack 3', 
    specs: { cpu: 'i9-13900K', ram: '64GB', storage: '2TB NVMe' },
    access: { sshUser: 'lab_admin', sshKey: 'ssh-rsa AA...' }
  },
  { 
    id: '2', 
    name: 'Xeon-W-3400', 
    ip: '192.168.1.102', 
    type: BoardType.PHYSICAL,
    status: BoardStatus.RESERVED,
    visibility: 'PUBLIC', 
    reservedBy: 'Alice Engineer',
    reservedUserId: 'ALIC02', // Strictly linked
    reservationStart: new Date(Date.now() - 3600000).toISOString(),
    reservationEnd: new Date(Date.now() + 3600000).toISOString(),
    location: 'Lab 2, Rack 1', 
    specs: { cpu: 'Xeon w9-3495X', ram: '512GB', storage: '8TB NVMe' },
    access: { sshUser: 'root' }
  },
  { 
    id: '3', 
    name: 'Gaudi-2-Cluster', 
    ip: '10.10.20.50', 
    type: BoardType.PHYSICAL,
    status: BoardStatus.MAINTENANCE, 
    visibility: 'PRIVATE', 
    location: 'AI Lab, Zone A', 
    specs: { cpu: 'Gaudi 2', ram: '96GB HBM', storage: 'Network Storage' },
    access: { sshUser: 'admin' }
  }
];

const SEED_TESTS: TestCase[] = [
  { id: 't1', name: 'Full System Sanity', category: 'SANITY', scriptPath: 'playbooks/sanity.yml', description: 'Basic check of CPU, RAM, Network.', visibility: 'PUBLIC' },
  { id: 't2', name: 'Stress-ng 24h', category: 'STRESS', scriptPath: 'playbooks/stress_ng.yml', description: 'Heavy load testing for thermal throttle.', visibility: 'PUBLIC' },
  { id: 't3', name: 'PCIE Bandwidth', category: 'IO', scriptPath: 'playbooks/pcie_bw.yml', description: 'Validates Gen5 speeds.', visibility: 'PUBLIC' },
  { id: 't4', name: 'Power Consumption Idle', category: 'POWER', scriptPath: 'playbooks/pwr_idle.yml', description: 'Measure C-State residency.', visibility: 'PUBLIC' },
];

const SEED_JOBS: TestJob[] = [
  { id: 'JOB-0001', userId: 'ALIC02', testName: ['DDR5 Bandwidth Check'], boardId: ['NUC-13-Extreme'], startedAt: '2023-10-28T09:15:00Z', status: TestStatus.PASSED, logs: ["[INFO] Init sequence..", "[SUCCESS] Bandwidth: 84GB/s"] },
  { id: 'JOB-0002', userId: 'ALIC02', testName: ['PCIE Gen5 Stress'], boardId: ['Xeon-W-3400'], startedAt: '2023-10-27T14:30:00Z', status: TestStatus.FAILED, logs: ["[INFO] Starting stress..", "[ERROR] Link training failed"] },
];

const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'ALIC02', title: 'System Update', message: 'Lab maintenance scheduled for Sunday.', type: 'INFO', timestamp: '2023-10-28T10:00:00Z', read: false }
];

const SEED_SUPPORT: SupportRequest[] = [
  {
    id: 'SIG-9012',
    userId: 'CHAR03',
    userName: 'Charlie Dev',
    subject: 'Connection Latency to Gaudi Cluster',
    description: 'Experiencing high packet loss when running training workloads.',
    status: SupportStatus.IN_PROGRESS,
    createdAt: '2023-10-29T08:30:00Z',
    targetNode: 'Gaudi-2-Cluster',
    messages: [
      { id: 'm1', sender: 'Charlie Dev', role: UserRole.USER, message: 'Latency is > 200ms.', timestamp: '2023-10-29T08:30:00Z' },
      { id: 'm2', sender: 'System Admin', role: UserRole.ADMIN, message: 'Investigating switch configuration.', timestamp: '2023-10-29T09:00:00Z' }
    ]
  }
];

const DEFAULT_AI_CONFIG: AiConfig = {
    provider: AiProvider.OLLAMA_LOCAL, // Default to Ollama as main AI
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3'
};

// --- DB SERVICE ---

export const LocalDb = {
  // Initialization
  init: () => {
    if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
    if (!localStorage.getItem(KEYS.BOARDS)) localStorage.setItem(KEYS.BOARDS, JSON.stringify(SEED_BOARDS));
    if (!localStorage.getItem(KEYS.JOBS)) localStorage.setItem(KEYS.JOBS, JSON.stringify(SEED_JOBS));
    if (!localStorage.getItem(KEYS.JOB_SEQ)) localStorage.setItem(KEYS.JOB_SEQ, '3');
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    if (!localStorage.getItem(KEYS.SUPPORT)) localStorage.setItem(KEYS.SUPPORT, JSON.stringify(SEED_SUPPORT));
    if (!localStorage.getItem(KEYS.TESTS)) localStorage.setItem(KEYS.TESTS, JSON.stringify(SEED_TESTS));
    if (!localStorage.getItem(KEYS.AI_CONFIG)) localStorage.setItem(KEYS.AI_CONFIG, JSON.stringify(DEFAULT_AI_CONFIG));
  },

  // Management
  resetDatabase: () => {
    localStorage.clear();
    LocalDb.init();
    window.location.reload();
  },

  exportDatabase: () => {
    const data = {
        users: LocalDb.getUsers(),
        boards: LocalDb.getBoards(),
        jobs: LocalDb.getJobs(),
        tests: LocalDb.getTestCases(),
        support: LocalDb.getSupportRequests(),
        notifications: JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]'),
        aiConfig: LocalDb.getAiConfig()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infrasense_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importDatabase: (jsonString: string) => {
    try {
        const data = JSON.parse(jsonString);
        if(data.users) localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
        if(data.boards) localStorage.setItem(KEYS.BOARDS, JSON.stringify(data.boards));
        if(data.jobs) localStorage.setItem(KEYS.JOBS, JSON.stringify(data.jobs));
        if(data.tests) localStorage.setItem(KEYS.TESTS, JSON.stringify(data.tests));
        if(data.support) localStorage.setItem(KEYS.SUPPORT, JSON.stringify(data.support));
        if(data.notifications) localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
        if(data.aiConfig) localStorage.setItem(KEYS.AI_CONFIG, JSON.stringify(data.aiConfig));
        window.location.reload();
    } catch (e) {
        alert("Failed to import database. Invalid JSON format.");
        console.error(e);
    }
  },

  // Users
  getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
  
  addUser: (user: User) => {
    const users = LocalDb.getUsers();
    if (users.some(u => u.id === user.id || u.email === user.email)) throw new Error("User already exists");
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return user;
  },

  updateUser: (updatedUser: User) => {
    const users = LocalDb.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
    return users;
  },

  deleteUser: (userId: string) => {
    let users = LocalDb.getUsers();
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return users;
  },

  // Boards
  getBoards: (): Board[] => JSON.parse(localStorage.getItem(KEYS.BOARDS) || '[]'),

  addBoard: (board: Board) => {
    const boards = LocalDb.getBoards();
    boards.push(board);
    localStorage.setItem(KEYS.BOARDS, JSON.stringify(boards));
    return boards;
  },

  updateBoard: (updatedBoard: Board) => {
    const boards = LocalDb.getBoards();
    const index = boards.findIndex(b => b.id === updatedBoard.id);
    if (index !== -1) {
      boards[index] = updatedBoard;
      localStorage.setItem(KEYS.BOARDS, JSON.stringify(boards));
    }
    return boards;
  },

  deleteBoard: (boardId: string) => {
    let boards = LocalDb.getBoards();
    boards = boards.filter(b => b.id !== boardId);
    localStorage.setItem(KEYS.BOARDS, JSON.stringify(boards));
    return boards;
  },

  // Test Cases
  getTestCases: (): TestCase[] => JSON.parse(localStorage.getItem(KEYS.TESTS) || '[]'),

  addTestCase: (testCase: TestCase) => {
    const tests = LocalDb.getTestCases();
    tests.push(testCase);
    localStorage.setItem(KEYS.TESTS, JSON.stringify(tests));
    return testCase;
  },

  deleteTestCase: (id: string) => {
    let tests = LocalDb.getTestCases();
    tests = tests.filter(t => t.id !== id);
    localStorage.setItem(KEYS.TESTS, JSON.stringify(tests));
  },

  // Jobs
  getJobs: (): TestJob[] => JSON.parse(localStorage.getItem(KEYS.JOBS) || '[]'),

  createJob: (jobData: Omit<TestJob, 'id'>) => {
    const jobs = LocalDb.getJobs();
    let seq = parseInt(localStorage.getItem(KEYS.JOB_SEQ) || '1');
    const newId = `JOB-${seq.toString().padStart(4, '0')}`;
    localStorage.setItem(KEYS.JOB_SEQ, (seq + 1).toString());

    const newJob: TestJob = { ...jobData, id: newId };
    jobs.unshift(newJob); 
    localStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
    return newJob;
  },
  
  updateJob: (updatedJob: TestJob) => {
    const jobs = LocalDb.getJobs();
    const index = jobs.findIndex(j => j.id === updatedJob.id);
    if (index !== -1) {
        jobs[index] = updatedJob;
        localStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
    }
    return jobs;
  },

  // Notifications
  getNotifications: (userId: string): Notification[] => {
    const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]') as Notification[];
    return all.filter(n => n.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
     const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]') as Notification[];
     const newNotif: Notification = {
         id: `notif-${Date.now()}-${Math.floor(Math.random()*1000)}`,
         timestamp: new Date().toISOString(),
         read: false,
         ...notif
     };
     all.unshift(newNotif);
     localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(all));
  },

  markNotificationRead: (id: string) => {
      const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]') as Notification[];
      const updated = all.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  clearAllNotifications: (userId: string) => {
      const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]') as Notification[];
      const kept = all.filter(n => n.userId !== userId); // Keep other users' notifications
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(kept));
  },

  // Neural Assistance (Support)
  getSupportRequests: (): SupportRequest[] => {
      return JSON.parse(localStorage.getItem(KEYS.SUPPORT) || '[]');
  },

  createSupportRequest: (req: Omit<SupportRequest, 'id' | 'createdAt' | 'messages' | 'status'>) => {
      const all = LocalDb.getSupportRequests();
      const newReq: SupportRequest = {
          id: `SIG-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString(),
          status: SupportStatus.OPEN,
          messages: [],
          ...req
      };
      all.unshift(newReq);
      localStorage.setItem(KEYS.SUPPORT, JSON.stringify(all));

      // AUTO-NOTIFY ADMINS
      const users = LocalDb.getUsers();
      const admins = users.filter(u => u.role === UserRole.ADMIN);
      admins.forEach(admin => {
          LocalDb.addNotification({
              userId: admin.id,
              title: 'New Neural Signal',
              message: `${req.userName} broadcasted: ${req.subject}`,
              type: 'WARNING'
          });
      });

      return newReq;
  },

  updateSupportRequest: (req: SupportRequest) => {
      const all = LocalDb.getSupportRequests();
      const index = all.findIndex(r => r.id === req.id);
      if(index !== -1) {
          all[index] = req;
          localStorage.setItem(KEYS.SUPPORT, JSON.stringify(all));
      }
  },

  addSupportMessage: (reqId: string, msg: Omit<SupportMessage, 'id' | 'timestamp'>) => {
      const all = LocalDb.getSupportRequests();
      const req = all.find(r => r.id === reqId);
      if(req) {
          const newMsg: SupportMessage = {
              id: `msg-${Date.now()}`,
              timestamp: new Date().toISOString(),
              ...msg
          };
          req.messages.push(newMsg);
          localStorage.setItem(KEYS.SUPPORT, JSON.stringify(all));

          // AUTO-NOTIFY Logic
          if (msg.role === UserRole.ADMIN || msg.role === UserRole.TESTER) {
              // Admin replied -> Notify User
              LocalDb.addNotification({
                  userId: req.userId,
                  title: 'Neural Assistance Update',
                  message: `New response on Signal ${req.id}: ${req.subject}`,
                  type: 'INFO'
              });
          } else {
              // User replied -> Notify Admins
              const users = LocalDb.getUsers();
              const admins = users.filter(u => u.role === UserRole.ADMIN);
              admins.forEach(admin => {
                  LocalDb.addNotification({
                      userId: admin.id,
                      title: 'Signal Update',
                      message: `New message on ${req.id} from ${req.userName}`,
                      type: 'INFO'
                  });
              });
          }
      }
  },

  // AI Config
  getAiConfig: (): AiConfig => {
      const stored = localStorage.getItem(KEYS.AI_CONFIG);
      return stored ? JSON.parse(stored) : DEFAULT_AI_CONFIG;
  },

  saveAiConfig: (config: AiConfig) => {
      localStorage.setItem(KEYS.AI_CONFIG, JSON.stringify(config));
  }
};
