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
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          last_login: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_login?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
        }
        Relationships: []
      }
      character_images: {
        Row: {
          character_name: string | null
          created_at: string
          genre: string | null
          id: string
          original_filename: string
          processed_image_url: string
          prompt_used: string | null
          reference_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          character_name?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          original_filename: string
          processed_image_url: string
          prompt_used?: string | null
          reference_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          character_name?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          original_filename?: string
          processed_image_url?: string
          prompt_used?: string | null
          reference_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      curated_stories: {
        Row: {
          created_at: string
          description: string | null
          genre: string
          icon_name: string | null
          id: string
          slug: string
          story_content: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          genre: string
          icon_name?: string | null
          id?: string
          slug: string
          story_content: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          genre?: string
          icon_name?: string | null
          id?: string
          slug?: string
          story_content?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          category: string
          created_at: string
          email: string | null
          id: string
          mobile: string
          name: string
          query: string
          status: string | null
        }
        Insert: {
          category: string
          created_at?: string
          email?: string | null
          id?: string
          mobile: string
          name: string
          query: string
          status?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string
          name?: string
          query?: string
          status?: string | null
        }
        Relationships: []
      }
      policy_factors: {
        Row: {
          created_at: string
          deductible_factor: string | null
          id: string
          policy_id: string
          seasonal_factor: string | null
          sector_factor: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deductible_factor?: string | null
          id?: string
          policy_id: string
          seasonal_factor?: string | null
          sector_factor?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deductible_factor?: string | null
          id?: string
          policy_id?: string
          seasonal_factor?: string | null
          sector_factor?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_factors_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "travel_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          character_image_reference_id: string | null
          character_name: string | null
          content: string
          created_at: string
          genre: string | null
          id: string
          story_length: number | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          character_image_reference_id?: string | null
          character_name?: string | null
          content: string
          created_at?: string
          genre?: string | null
          id?: string
          story_length?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          character_image_reference_id?: string | null
          character_name?: string | null
          content?: string
          created_at?: string
          genre?: string | null
          id?: string
          story_length?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_character_image_reference_id_fkey"
            columns: ["character_image_reference_id"]
            isOneToOne: false
            referencedRelation: "character_images"
            referencedColumns: ["reference_id"]
          },
        ]
      }
      story_illustrations: {
        Row: {
          character_image_reference_id: string | null
          created_at: string
          id: string
          illustration_url: string
          panel_index: number
          panel_text: string | null
          prompt_used: string | null
          story_id: string | null
        }
        Insert: {
          character_image_reference_id?: string | null
          created_at?: string
          id?: string
          illustration_url: string
          panel_index: number
          panel_text?: string | null
          prompt_used?: string | null
          story_id?: string | null
        }
        Update: {
          character_image_reference_id?: string | null
          created_at?: string
          id?: string
          illustration_url?: string
          panel_index?: number
          panel_text?: string | null
          prompt_used?: string | null
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_illustrations_character_image_reference_id_fkey"
            columns: ["character_image_reference_id"]
            isOneToOne: false
            referencedRelation: "character_images"
            referencedColumns: ["reference_id"]
          },
          {
            foreignKeyName: "story_illustrations_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_policies: {
        Row: {
          additional_notes: string | null
          address: string
          booking_id: string
          cancellation_charge: number
          cost_of_booking: number
          created_at: string
          currency: string
          customer_id: string
          date_of_purchase: string | null
          email: string
          event_descriptions: string[] | null
          event_end_date: string | null
          event_locations: string[] | null
          event_start_date: string | null
          first_name: string
          flight_departure_dates: string[] | null
          flight_return_dates: string[] | null
          from_locations: string[] | null
          hotel_check_in_dates: string[] | null
          hotel_check_out_dates: string[] | null
          id: string
          last_name: string
          mobile: string
          to_locations: string[] | null
          travel_end_date: string
          travel_start_date: string
          user_id: string | null
        }
        Insert: {
          additional_notes?: string | null
          address: string
          booking_id: string
          cancellation_charge: number
          cost_of_booking: number
          created_at?: string
          currency: string
          customer_id: string
          date_of_purchase?: string | null
          email: string
          event_descriptions?: string[] | null
          event_end_date?: string | null
          event_locations?: string[] | null
          event_start_date?: string | null
          first_name: string
          flight_departure_dates?: string[] | null
          flight_return_dates?: string[] | null
          from_locations?: string[] | null
          hotel_check_in_dates?: string[] | null
          hotel_check_out_dates?: string[] | null
          id?: string
          last_name: string
          mobile: string
          to_locations?: string[] | null
          travel_end_date: string
          travel_start_date: string
          user_id?: string | null
        }
        Update: {
          additional_notes?: string | null
          address?: string
          booking_id?: string
          cancellation_charge?: number
          cost_of_booking?: number
          created_at?: string
          currency?: string
          customer_id?: string
          date_of_purchase?: string | null
          email?: string
          event_descriptions?: string[] | null
          event_end_date?: string | null
          event_locations?: string[] | null
          event_start_date?: string | null
          first_name?: string
          flight_departure_dates?: string[] | null
          flight_return_dates?: string[] | null
          from_locations?: string[] | null
          hotel_check_in_dates?: string[] | null
          hotel_check_out_dates?: string[] | null
          id?: string
          last_name?: string
          mobile?: string
          to_locations?: string[] | null
          travel_end_date?: string
          travel_start_date?: string
          user_id?: string | null
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
