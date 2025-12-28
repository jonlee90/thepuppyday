export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addons: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          upsell_breeds: string[] | null
          upsell_prompt: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          upsell_breeds?: string[] | null
          upsell_prompt?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          upsell_breeds?: string[] | null
          upsell_prompt?: string | null
        }
        Relationships: []
      }
      // Additional tables would go here...
    }
    Views: {
      // Views would go here...
    }
    Functions: {
      // Functions would go here...
    }
    Enums: {
      customer_flag_color: "red" | "yellow" | "green"
      customer_flag_type:
        | "aggressive_dog"
        | "payment_issues"
        | "vip"
        | "special_needs"
        | "grooming_notes"
        | "other"
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
