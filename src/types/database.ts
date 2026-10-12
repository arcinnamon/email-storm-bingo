/** The application-owned subset of the Supabase schema; keep in sync with migrations. */
type ConfigRow = {
  id: number;
  phrases: string[];
  version: number;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      bingo_config: {
        Row: ConfigRow;
        Insert: { id?: number; phrases: string[]; version?: number; updated_at?: string };
        Update: Partial<ConfigRow>;
        Relationships: [];
      };
      login_attempts: {
        Row: { client_hash: string; failures: number; expires_at: string };
        Insert: { client_hash: string; failures: number; expires_at?: string };
        Update: { failures?: number; expires_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      update_bingo_config: {
        Args: { expected_version: number; new_phrases: string[] };
        Returns: ConfigRow[];
      };
      seed_bingo_config: { Args: { initial_phrases: string[] }; Returns: boolean };
      purge_expired_login_attempts: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
