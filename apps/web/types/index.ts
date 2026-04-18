// Frontend Type Definitions

// Supabase User Type
export interface User {
  id: string;
  email?: string;
  aud: string;
  role?: string;
  created_at?: string;
}

// API Response Types
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
  email?: string | null;
  is_subscribed: boolean;
  is_admin: boolean;
  created_at: string;
}

// Decrypted Vault Item
export interface VaultItem {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

// Password Entry (alternative structure)
export interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  password: string;
}

// Client-side Password Vault Container (decrypted)
export interface ClientPasswordVault {
  entries: PasswordEntry[];
}

// Form Data
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// API Error Response
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
