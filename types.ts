export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  status?: 'active' | 'suspended';
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  citations?: number[];
  timestamp: number;
}

export type AIModelMode = 'fast' | 'pro' | 'thinking';

export interface ProcessedDocument {
  name: string;
  type: 'pdf' | 'image' | 'video';
  totalPages: number;
  content: { page: number; text: string }[];
  uploadDate: number;
  // Image/Video specific properties
  inlineData?: string; // base64 string
  mimeType?: string;
}