export interface Flashcard {
  id: string;
  front: string;
  back: string;
  easeFactor: number; // For basic Spaced Repetition (SRS)
  interval: number; // Days
  nextReviewDate: string; // ISO String
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  cards: Flashcard[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  selectedAnswerIndex?: number;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  questions: QuizQuestion[];
  score?: number;
  completedAt?: string;
}

export interface StudyTask {
  id: string;
  title: string;
  durationMinutes: number;
  isCompleted: boolean;
  notes?: string;
}

export interface StudyPlanDay {
  dayNumber: number;
  theme: string;
  tasks: StudyTask[];
}

export interface StudyPlan {
  id: string;
  topic: string;
  targetExamDate?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  days: StudyPlanDay[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ExplanationResponse {
  simple: string;
  analogy: string;
  deep: string;
  keyTakeaways: string[];
}
