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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      duplicate_leads: {
        Row: {
          address: string | null
          client_name: string
          id: string
          loan_requirement: string
          original_bo_name: string | null
          original_lead_id: string | null
          phone_number: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          address?: string | null
          client_name: string
          id?: string
          loan_requirement?: string
          original_bo_name?: string | null
          original_lead_id?: string | null
          phone_number: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          address?: string | null
          client_name?: string
          id?: string
          loan_requirement?: string
          original_bo_name?: string | null
          original_lead_id?: string | null
          phone_number?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      meeting_remarks: {
        Row: {
          id: string
          meeting_id: string
          remark: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          remark: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          remark?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      lead_remarks: {
        Row: {
          created_at: string
          created_by: string
          id: string
          lead_id: string
          remark: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          lead_id: string
          remark: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          lead_id?: string
          remark?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_remarks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_bo_id: string
          assigned_date: string
          client_name: string
          created_at: string
          id: string
          lead_status: string
          lead_type: string
          loan_requirement: string
          meeting_approved: boolean
          meeting_id: string | null
          meeting_requested: boolean
          number_status: string
          phone_number: string
        }
        Insert: {
          address?: string | null
          assigned_bo_id: string
          assigned_date: string
          client_name: string
          created_at?: string
          id: string
          lead_status?: string
          lead_type?: string
          loan_requirement?: string
          meeting_approved?: boolean
          meeting_id?: string | null
          meeting_requested?: boolean
          number_status?: string
          phone_number: string
        }
        Update: {
          address?: string | null
          assigned_bo_id?: string
          assigned_date?: string
          client_name?: string
          created_at?: string
          id?: string
          lead_status?: string
          lead_type?: string
          loan_requirement?: string
          meeting_approved?: boolean
          meeting_id?: string | null
          meeting_requested?: boolean
          number_status?: string
          phone_number?: string
        }
        Relationships: []
      }
      meeting_requests: {
        Row: {
          bo_id: string
          created_at: string
          id: string
          lead_id: string
          status: string
          tc_id: string
        }
        Insert: {
          bo_id: string
          created_at?: string
          id: string
          lead_id: string
          status?: string
          tc_id: string
        }
        Update: {
          bo_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          status?: string
          tc_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          bdo_id: string | null
          bdo_status: string | null
          bdm_id: string
          bo_id: string
          client_name: string | null
          collateral_value: string | null
          created_at: string
          date: string
          final_requirement: string | null
          full_login: boolean | null
          id: string
          lead_id: string
          location: string | null
          meeting_type: string | null
          mini_login: boolean | null
          product_type: string | null
          state: string | null
          status: string
          tc_id: string
          time_slot: string
          walkin_date: string | null
          walking_status: string | null
        }
        Insert: {
          bdo_id?: string | null
          bdo_status?: string | null
          bdm_id: string
          bo_id: string
          client_name?: string | null
          collateral_value?: string | null
          created_at?: string
          date: string
          final_requirement?: string | null
          full_login?: boolean | null
          id: string
          lead_id: string
          location?: string | null
          meeting_type?: string | null
          mini_login?: boolean | null
          product_type?: string | null
          state?: string | null
          status?: string
          tc_id: string
          time_slot: string
          walkin_date?: string | null
          walking_status?: string | null
        }
        Update: {
          bdo_id?: string | null
          bdo_status?: string | null
          bdm_id?: string
          bo_id?: string
          client_name?: string | null
          collateral_value?: string | null
          created_at?: string
          date?: string
          final_requirement?: string | null
          full_login?: boolean | null
          id?: string
          lead_id?: string
          location?: string | null
          meeting_type?: string | null
          mini_login?: boolean | null
          product_type?: string | null
          state?: string | null
          status?: string
          tc_id?: string
          time_slot?: string
          walkin_date?: string | null
          walking_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          auth_id: string | null
          created_at: string
          id: string
          name: string
          role: string
          team_id: string | null
          username: string
        }
        Insert: {
          active?: boolean
          auth_id?: string | null
          created_at?: string
          id?: string
          name: string
          role?: string
          team_id?: string | null
          username: string
        }
        Update: {
          active?: boolean
          auth_id?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string
          team_id?: string | null
          username?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bo_id: string
          created_at: string
          id: string
          team_id: string
        }
        Insert: {
          bo_id: string
          created_at?: string
          id?: string
          team_id: string
        }
        Update: {
          bo_id?: string
          created_at?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          tc_id: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          tc_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tc_id?: string
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
    Enums: {},
  },
} as const
