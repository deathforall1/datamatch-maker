export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          match_1_id: string | null
          match_1_score: number | null
          match_2_id: string | null
          match_2_score: number | null
          match_3_id: string | null
          match_3_score: number | null
          participant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_1_id?: string | null
          match_1_score?: number | null
          match_2_id?: string | null
          match_2_score?: number | null
          match_3_id?: string | null
          match_3_score?: number | null
          participant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_1_id?: string | null
          match_1_score?: number | null
          match_2_id?: string | null
          match_2_score?: number | null
          match_3_id?: string | null
          match_3_score?: number | null
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_match_1_id_fkey"
            columns: ["match_1_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_match_2_id_fkey"
            columns: ["match_2_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_match_3_id_fkey"
            columns: ["match_3_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          age: number
          consent_given: boolean
          created_at: string
          email: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          name: string
          partner_preference: Database["public"]["Enums"]["gender_type"][]
          questionnaire_complete: boolean
          registration_complete: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          age: number
          consent_given?: boolean
          created_at?: string
          email: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          name: string
          partner_preference: Database["public"]["Enums"]["gender_type"][]
          questionnaire_complete?: boolean
          registration_complete?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number
          consent_given?: boolean
          created_at?: string
          email?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          name?: string
          partner_preference?: Database["public"]["Enums"]["gender_type"][]
          questionnaire_complete?: boolean
          registration_complete?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questionnaire_responses: {
        Row: {
          created_at: string
          current_step: number
          id: string
          q1_friday_night: string | null
          q10_date_preference: number | null
          q2_humour: string | null
          q3_conflict_style: string | null
          q4_life_pillars: string[] | null
          q5_love_languages: string[] | null
          q6_social_battery: number | null
          q7_spontaneity: number | null
          q8_ambition: number | null
          q9_productivity: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          id?: string
          q1_friday_night?: string | null
          q10_date_preference?: number | null
          q2_humour?: string | null
          q3_conflict_style?: string | null
          q4_life_pillars?: string[] | null
          q5_love_languages?: string[] | null
          q6_social_battery?: number | null
          q7_spontaneity?: number | null
          q8_ambition?: number | null
          q9_productivity?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: number
          id?: string
          q1_friday_night?: string | null
          q10_date_preference?: number | null
          q2_humour?: string | null
          q3_conflict_style?: string | null
          q4_life_pillars?: string[] | null
          q5_love_languages?: string[] | null
          q6_social_battery?: number | null
          q7_spontaneity?: number | null
          q8_ambition?: number | null
          q9_productivity?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "participant"
      gender_type: "male" | "female" | "non_binary"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "participant"],
      gender_type: ["male", "female", "non_binary"],
    },
  },
} as const
