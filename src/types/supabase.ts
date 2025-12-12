/**
 * Auto-generated Supabase database types
 * Generated from the actual Supabase database schema
 */

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
      appointment_addons: {
        Row: {
          addon_id: string
          appointment_id: string
          id: string
          price: number
        }
        Insert: {
          addon_id: string
          appointment_id: string
          id?: string
          price: number
        }
        Update: {
          addon_id?: string
          appointment_id?: string
          id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_addons_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          booking_reference: string | null
          created_at: string | null
          customer_id: string
          duration_minutes: number
          groomer_id: string | null
          id: string
          notes: string | null
          payment_status: string | null
          pet_id: string
          scheduled_at: string
          service_id: string
          status: string | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          booking_reference?: string | null
          created_at?: string | null
          customer_id: string
          duration_minutes: number
          groomer_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          pet_id: string
          scheduled_at: string
          service_id: string
          status?: string | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          booking_reference?: string | null
          created_at?: string | null
          customer_id?: string
          duration_minutes?: number
          groomer_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          pet_id?: string
          scheduled_at?: string
          service_id?: string
          status?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_groomer_id_fkey"
            columns: ["groomer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      breeds: {
        Row: {
          created_at: string | null
          grooming_frequency_weeks: number | null
          id: string
          name: string
          reminder_message: string | null
        }
        Insert: {
          created_at?: string | null
          grooming_frequency_weeks?: number | null
          id?: string
          name: string
          reminder_message?: string | null
        }
        Update: {
          created_at?: string | null
          grooming_frequency_weeks?: number | null
          id?: string
          name?: string
          reminder_message?: string | null
        }
        Relationships: []
      }
      customer_flags: {
        Row: {
          created_at: string | null
          customer_id: string
          flagged_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          reason: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          flagged_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          reason: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          flagged_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_flags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_memberships: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          customer_id: string
          id: string
          membership_id: string
          status: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          customer_id: string
          id?: string
          membership_id: string
          status?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          customer_id?: string
          id?: string
          membership_id?: string
          status?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          before_image_url: string | null
          breed: string | null
          caption: string | null
          created_at: string | null
          display_order: number | null
          dog_name: string | null
          id: string
          image_url: string
          is_before_after: boolean | null
          is_published: boolean | null
          tags: string[] | null
        }
        Insert: {
          before_image_url?: string | null
          breed?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          dog_name?: string | null
          id?: string
          image_url: string
          is_before_after?: boolean | null
          is_published?: boolean | null
          tags?: string[] | null
        }
        Update: {
          before_image_url?: string | null
          breed?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          dog_name?: string | null
          id?: string
          image_url?: string
          is_before_after?: boolean | null
          is_published?: boolean | null
          tags?: string[] | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          customer_id: string
          id: string
          lifetime_points: number | null
          points_balance: number | null
        }
        Insert: {
          customer_id: string
          id?: string
          lifetime_points?: number | null
          points_balance?: number | null
        }
        Update: {
          customer_id?: string
          id?: string
          lifetime_points?: number | null
          points_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          notes: string | null
          points: number
          reference_id: string | null
          reference_type: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          points: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          benefits: Json | null
          billing_frequency: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          benefits?: Json | null
          billing_frequency?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          benefits?: Json | null
          billing_frequency?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          channel: string | null
          content: string | null
          created_at: string | null
          customer_id: string | null
          error_message: string | null
          id: string
          recipient: string
          sent_at: string | null
          status: string | null
          subject: string | null
          type: string
        }
        Insert: {
          channel?: string | null
          content?: string | null
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          id?: string
          recipient: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          type: string
        }
        Update: {
          channel?: string | null
          content?: string | null
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          id?: string
          recipient?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          customer_id: string
          id: string
          payment_method: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          tip_amount: number | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          tip_amount?: number | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          tip_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          birth_date: string | null
          breed_custom: string | null
          breed_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          medical_info: string | null
          name: string
          notes: string | null
          owner_id: string
          photo_url: string | null
          size: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          birth_date?: string | null
          breed_custom?: string | null
          breed_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          medical_info?: string | null
          name: string
          notes?: string | null
          owner_id: string
          photo_url?: string | null
          size: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          birth_date?: string | null
          breed_custom?: string | null
          breed_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          medical_info?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          photo_url?: string | null
          size?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_banners: {
        Row: {
          alt_text: string | null
          click_count: number | null
          click_url: string | null
          created_at: string | null
          display_order: number | null
          end_date: string | null
          id: string
          image_url: string
          is_active: boolean | null
          start_date: string | null
        }
        Insert: {
          alt_text?: string | null
          click_count?: number | null
          click_url?: string | null
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          start_date?: string | null
        }
        Update: {
          alt_text?: string | null
          click_count?: number | null
          click_url?: string | null
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          start_date?: string | null
        }
        Relationships: []
      }
      report_cards: {
        Row: {
          after_photo_url: string | null
          appointment_id: string
          before_photo_url: string | null
          behavior: string | null
          coat_condition: string | null
          created_at: string | null
          feedback: string | null
          groomer_notes: string | null
          health_observations: string[] | null
          id: string
          mood: string | null
          rating: number | null
        }
        Insert: {
          after_photo_url?: string | null
          appointment_id: string
          before_photo_url?: string | null
          behavior?: string | null
          coat_condition?: string | null
          created_at?: string | null
          feedback?: string | null
          groomer_notes?: string | null
          health_observations?: string[] | null
          id?: string
          mood?: string | null
          rating?: number | null
        }
        Update: {
          after_photo_url?: string | null
          appointment_id?: string
          before_photo_url?: string | null
          behavior?: string | null
          coat_condition?: string | null
          created_at?: string | null
          feedback?: string | null
          groomer_notes?: string | null
          health_observations?: string[] | null
          id?: string
          mood?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      service_prices: {
        Row: {
          id: string
          price: number
          service_id: string
          size: string
        }
        Insert: {
          id?: string
          price: number
          service_id: string
          size: string
        }
        Update: {
          id?: string
          price?: number
          service_id?: string
          size?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_prices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          id: string
          section: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          id?: string
          section: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          id?: string
          section?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          preferences: Json | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          notified_at: string | null
          pet_id: string
          requested_date: string
          service_id: string
          status: string | null
          time_preference: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          notified_at?: string | null
          pet_id: string
          requested_date: string
          service_id: string
          status?: string | null
          time_preference?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          notified_at?: string | null
          pet_id?: string
          requested_date?: string
          service_id?: string
          status?: string | null
          time_preference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
