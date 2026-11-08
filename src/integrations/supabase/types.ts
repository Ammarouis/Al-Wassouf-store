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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          product_code: string | null
          term: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          product_code?: string | null
          term?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          product_code?: string | null
          term?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          entity: string
          entity_label: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity: string
          entity_label?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity?: string
          entity_label?: string | null
          id?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string
          code: string
          created_at: string
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean
          maps_url: string | null
          name: string
          phone: string | null
          sort_order: number
          whatsapp: string | null
        }
        Insert: {
          address?: string
          code: string
          created_at?: string
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          maps_url?: string | null
          name: string
          phone?: string | null
          sort_order?: number
          whatsapp?: string | null
        }
        Update: {
          address?: string
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          maps_url?: string | null
          name?: string
          phone?: string | null
          sort_order?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          branch_id: string
          id: string
          product_id: string
          quantity: number | null
          status: Database["public"]["Enums"]["availability_status"]
          updated_at: string
        }
        Insert: {
          branch_id: string
          id?: string
          product_id: string
          quantity?: number | null
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
        }
        Update: {
          branch_id?: string
          id?: string
          product_id?: string
          quantity?: number | null
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          cta_label: string | null
          cta_url: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          images: Json
          is_featured: boolean
          model: string | null
          name: string
          price: number | null
          product_code: string
          published_at: string | null
          search_text: string
          specifications: Json
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
        }
        Insert: {
          brand: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          images?: Json
          is_featured?: boolean
          model?: string | null
          name: string
          price?: number | null
          product_code?: string
          published_at?: string | null
          search_text?: string
          specifications?: Json
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          images?: Json
          is_featured?: boolean
          model?: string | null
          name?: string
          price?: number | null
          product_code?: string
          published_at?: string | null
          search_text?: string
          specifications?: Json
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          about: string
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          currency: string
          hero_image_url: string | null
          id: number
          show_prices: boolean
          show_quantities: boolean
          store_name: string
          updated_at: string
          whatsapp_channel_url: string | null
        }
        Insert: {
          about?: string
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          currency?: string
          hero_image_url?: string | null
          id?: number
          show_prices?: boolean
          show_quantities?: boolean
          store_name?: string
          updated_at?: string
          whatsapp_channel_url?: string | null
        }
        Update: {
          about?: string
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          currency?: string
          hero_image_url?: string | null
          id?: number
          show_prices?: boolean
          show_quantities?: boolean
          store_name?: string
          updated_at?: string
          whatsapp_channel_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
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
      can: { Args: { _perm: string; _uid: string }; Returns: boolean }
      current_role_of: {
        Args: { _uid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_product_code: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "inventory_manager"
      availability_status: "in_stock" | "out_of_stock" | "ask_to_confirm"
      product_status: "draft" | "published" | "hidden" | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["owner", "admin", "editor", "inventory_manager"],
      availability_status: ["in_stock", "out_of_stock", "ask_to_confirm"],
      product_status: ["draft", "published", "hidden", "archived"],
    },
  },
} as const
