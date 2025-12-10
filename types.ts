export interface ProcessState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
}

export interface AnswerData {
  text: string;
  modelUsed: string;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  date: string;
  data: AnswerData;
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview'
}

export interface AppSettings {
  depth: 'concise' | 'detailed';
  language: 'english' | 'hinglish';
  focus: 'exam' | 'concept';
}