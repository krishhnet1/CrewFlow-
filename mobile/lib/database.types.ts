// Lightweight Supabase Database type. Replace with output of
// `supabase gen types typescript --linked > database.types.ts` once the
// project is linked. In the meantime, permissive row/insert shapes keep
// supabase-js queries ergonomic without full codegen.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type AnyRow = { [column: string]: any };

interface Table {
  Row: AnyRow;
  Insert: AnyRow;
  Update: AnyRow;
  Relationships: [];
}

// `any` deliberately disables the strict row typing — this matches
// supabase-js's behaviour when no generated types are provided.
export type Database = any;
