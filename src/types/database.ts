// supabase-js requires every table entry to include a `Relationships: []`
// array (even if empty) and the schema to have `Views`/`Functions`/`Enums`/
// `CompositeTypes`, otherwise type inference collapses to `never` and every
// .insert / .update / select-of-named-columns call fails to typecheck.
type EmptyRelationships = Array<{
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}>;

export interface Database {
  public: {
    Tables: {
      recipe_recipes: {
        Row: {
          id: string;
          title: string;
          source_url: string | null;
          description: string | null;
          servings: string | null;
          prep_time: string | null;
          cook_time: string | null;
          total_time: string | null;
          image_url: string | null;
          tags: string[];
          notes: string | null;
          is_favorite: boolean;
          total_minutes: number | null;
          time_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          source_url?: string | null;
          description?: string | null;
          servings?: string | null;
          prep_time?: string | null;
          cook_time?: string | null;
          total_time?: string | null;
          image_url?: string | null;
          tags?: string[];
          notes?: string | null;
          is_favorite?: boolean;
          total_minutes?: number | null;
          time_note?: string | null;
        };
        Update: Partial<Database['public']['Tables']['recipe_recipes']['Insert']>;
        Relationships: EmptyRelationships;
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          position: number;
          group_label: string | null;
          amount: string | null;
          item: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          position: number;
          group_label?: string | null;
          amount?: string | null;
          item: string;
        };
        Update: Partial<Database['public']['Tables']['recipe_ingredients']['Insert']>;
        Relationships: EmptyRelationships;
      };
      recipe_phases: {
        Row: {
          id: string;
          recipe_id: string;
          position: number;
          name: string;
          meta: string | null;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          position: number;
          name: string;
          meta?: string | null;
        };
        Update: Partial<Database['public']['Tables']['recipe_phases']['Insert']>;
        Relationships: EmptyRelationships;
      };
      recipe_steps: {
        Row: {
          id: string;
          recipe_id: string;
          phase_id: string | null;
          position: number;
          instruction: string;
          timer_label: string | null;
          empty_note: string | null;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          phase_id?: string | null;
          position: number;
          instruction: string;
          timer_label?: string | null;
          empty_note?: string | null;
        };
        Update: Partial<Database['public']['Tables']['recipe_steps']['Insert']>;
        Relationships: EmptyRelationships;
      };
      recipe_step_ingredients: {
        Row: {
          id: string;
          step_id: string;
          position: number;
          amount: string | null;
          short_name: string;
        };
        Insert: {
          id?: string;
          step_id: string;
          position: number;
          amount?: string | null;
          short_name: string;
        };
        Update: Partial<Database['public']['Tables']['recipe_step_ingredients']['Insert']>;
        Relationships: EmptyRelationships;
      };
      recipe_comments: {
        Row: {
          id: string;
          recipe_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          body: string;
        };
        Update: Partial<Database['public']['Tables']['recipe_comments']['Insert']>;
        Relationships: EmptyRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
