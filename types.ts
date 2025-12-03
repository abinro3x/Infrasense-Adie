

export enum UserRole {
  ADMIN = 'ADMIN',
  LAB_CREW = 'LAB_CREW',
  TESTER = 'TESTER',
  USER = 'USER',
  VIEWER = 'VIEWER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  businessUnit?: string;
  token?: string;
  // New Profile Fields
  photo?: string;
  geosite?: string;
  project?: string;
}

export interface Notification {
  id: string;
  userId: string; // Target specific user
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  timestamp: string;
  read: boolean;
}

export enum BoardStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
  PENDING_APPROVAL = 'PENDING_APPROVAL'
}

export enum BoardType {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL' // AI Mimic
}

export interface Board {
  id: string;
  name: string;
  ip: string;
  type: BoardType;
  status: BoardStatus;
  visibility: 'PUBLIC' | 'PRIVATE'; 
  reservedBy?: string; // Display Name
  reservedUserId?: string; // Strict Link to User.id
  reservationStart?: string; // ISO String
  reservationEnd?: string; // ISO String
  location: string;
  specs: {
    cpu: string;
    ram: string;
    storage: string;
  };
  access?: {
    sshUser: string;
    sshKey?: string; 
    sshPassword?: string; 
  };
  requestedBy?: string; 
}

export enum TestStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  ERROR = 'ERROR'
}

export enum AIModelType {
  AUTO = 'Auto-Select (GenAI)',
  LSTM = 'LSTM (Time Series)',
  CNN = 'CNN (Pattern/Visual)',
  RNN = 'RNN (Sequential)',
  TRANSFORMER = 'Transformer (Complex Logic)',
  RANDOM_FOREST = 'Random Forest (Regression)'
}

export interface TestJob {
  id: string; 
  userId: string; 
  testName: string[];
  boardId: string[];
  startedAt: string;
  completedAt?: string;
  status: TestStatus;
  logs: string[];
  semaphoreId?: string;
  selectedAiModel?: AIModelType;
  resultData?: any; 
}

export interface AIAnalysis {
  summary: string;
  prediction: string;
  rootCause: string;
  recommendedAction: string;
}

export interface TestCase {
  id: string;
  name: string;
  category: 'SANITY' | 'STRESS' | 'POWER' | 'IO' | 'CUSTOM';
  scriptPath: string; 
  description: string;
  author?: string; 
  isCustom?: boolean;
  yamlContent?: string;
  // New Ownership Fields
  ownerId?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

// --- NEURAL ASSISTANCE (TICKETING) ---

export enum SupportStatus {
  OPEN = 'SIGNAL_RECEIVED',
  IN_PROGRESS = 'DIAGNOSTIC_SCAN',
  RESOLVED = 'NOMINAL',
  CLOSED = 'ARCHIVED'
}

export interface SupportMessage {
  id: string;
  sender: string;
  role: UserRole;
  message: string;
  timestamp: string;
}

export interface SupportRequest {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  description: string;
  status: SupportStatus;
  targetNode?: string; // Board Name
  createdAt: string;
  messages: SupportMessage[];
  aiSuggestedSolution?: string; // If AI solved it
}

// --- AI CONFIGURATION ---

export enum AiProvider {
  GOOGLE_CLOUD = 'GOOGLE_CLOUD',
  OLLAMA_LOCAL = 'OLLAMA_LOCAL'
}

export interface AiConfig {
  provider: AiProvider;
  ollamaUrl: string; // e.g. http://localhost:11434
  ollamaModel: string; // e.g. llama3, mistral
}
