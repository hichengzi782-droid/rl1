export interface LetterData {
  professorInfo: string;
  studentMaterial: string;
}

export interface GeneratedContent {
  chineseLogicDraft: string;
  englishLetter: string;
  grammarAnalysis: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}