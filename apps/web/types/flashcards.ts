// Flashcards types
export type Status = 'new' | 'learning' | 'review' | 'mastered';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  deck_id: string;
  ease_factor?: number;
  review_interval?: number;
  repetitions?: number;
  next_review_date?: string;
  status?: Status;
  times_reviewed?: number;
  times_correct?: number;
  times_wrong?: number;
  is_starred?: boolean;
  created_at: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  color?: string;
  cards_count?: number;
  new_count?: number;
  learning_count?: number;
  mastered_count?: number;
  flashcards: Flashcard[];
  created_at: string;
  updated_at?: string;
}

export interface StudySession {
  id?: string;
  deck_id?: string;
  session_type: 'new' | 'review' | 'cram' | 'mixed';
  started_at: Date;
  cards_studied: number;
  cards_correct: number;
  cards_wrong: number;
  cards_skipped: number;
}
