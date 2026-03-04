export interface Message {
  id: string;
  question: string;
  answer: string;
  reasoning: string;
  sql: string;
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  steps: Record<string, unknown>[];
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  historySummary: string;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  question: string;
  answer: string;
  sql: string;
}

export interface QueryRequest {
  question: string;
  history: HistoryEntry[];
  history_summary: string;
}

export interface QueryResponse {
  question: string;
  answer: string;
  reasoning: string;
  sql: string;
  columns: string[];
  rows: unknown[][];
  row_count: number;
  steps: Record<string, unknown>[];
}

export interface SummarizeRequest {
  messages: HistoryEntry[];
  existing_summary: string;
}

export interface SummarizeResponse {
  summary: string;
}
