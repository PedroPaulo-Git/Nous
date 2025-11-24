// API Type Definitions

// Route Parameters
export interface IdParam {
  id: string;
}

export interface DeckIdParam {
  deckId: string;
}

// Request Bodies
export interface CreateNoteBody {
  title: string;
  content: string;
}

export interface UpdateNoteBody {
  title: string;
  content: string;
}

export interface CreateTodoBody {
  text: string;
}

export interface UpdateTodoBody {
  text: string;
  is_done?: boolean;
}

export interface CreateFlashcardDeckBody {
  name: string;
}

export interface UpdateFlashcardDeckBody {
  name: string;
}

export interface CreateFlashcardBody {
  front: string;
  back: string;
}

export interface UpdateFlashcardBody {
  front: string;
  back: string;
}

export interface CreateVaultBody {
  encrypted_data: string;
}

export interface UpdateVaultBody {
  encrypted_data: string;
}

export interface UpdateSubscriptionBody {
  is_subscribed: boolean;
}
//drink water types fastify route
export interface DrinkWaterEntryBody {
  quantity_ml: number;
  // total_ml: number;
  source?: string;

  when_drink?: Date;
}

export interface UpdateDrinkWaterEntryBody {
  quantity_ml: number;
  total_ml: number;
  source?: string;

  when_drink?: Date;
}
export interface DrinkWaterGoalsBody {
  goal_ml: number;
  total_ml: number;

  goal_quantity_ml: number;
  completed: boolean;

}
export interface DrinkWaterSteakBody {
  streak_current: number;
  streak_best: number;
  last_day_check: Date;

}
// Response Types
export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  text: string;
  is_done: boolean;
  created_at: string;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  created_at: string;
}

export interface PasswordVault {
  id: string;
  user_id: string;
  encrypted_data: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  is_subscribed: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface AdminUser {
  id: string;
  is_subscribed: boolean;
  is_admin: boolean;
  created_at: string;
}
