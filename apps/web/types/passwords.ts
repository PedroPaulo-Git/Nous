// Passwords types
export interface Password {
  id: string;
  website: string;
  username: string;
  password: string; // This will store encrypted data
  category: string;
  created_at: string;
  updated_at: string;
}

export interface DecryptedPassword {
  id: string;
  website: string;
  username: string;
  password: string; // Decrypted plaintext
  category: string;
  created_at: string;
  updated_at: string;
}
