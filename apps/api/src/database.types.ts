export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          is_subscribed: boolean;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          is_subscribed?: boolean;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          is_subscribed?: boolean;
          is_admin?: boolean;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          is_done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          is_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          is_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      flashcard_decks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      flashcards: {
        Row: {
          id: string;
          deck_id: string;
          user_id: string;
          front: string;
          back: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          user_id: string;
          front: string;
          back: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          deck_id?: string;
          user_id?: string;
          front?: string;
          back?: string;
          created_at?: string;
        };
      };
      password_vault: {
        Row: {
          user_id: string;
          encrypted_blob: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          encrypted_blob: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          encrypted_blob?: string;
          updated_at?: string;
        };
      };
      passwords: {
        Row: {
          id: string;
          user_id: string;
          website: string;
          username: string;
          password: string;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          website: string;
          username: string;
          password: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          website?: string;
          username?: string;
          password?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
