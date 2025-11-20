export type Profile = {
  id: string;
  is_subscribed: boolean;
  is_admin: boolean;
  created_at?: string;
};

export type Note = {
  id: string;
  user_id: string;
  title?: string;
  content?: string;
  created_at: string;
  updated_at: string;
};

export type Todo = {
  id: string;
  user_id: string;
  text: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
};

export type FlashcardDeck = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Flashcard = {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  created_at: string;
};

export type PasswordEntry = {
  id: string;
  website: string;
  username: string;
  password: string;
};

export type PasswordVault = {
  entries: PasswordEntry[];
};
