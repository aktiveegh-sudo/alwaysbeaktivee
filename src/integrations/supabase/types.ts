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
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      free_data_campaigns: {
        Row: {
          created_at: string
          data_volume_mb: number
          id: string
          is_active: boolean
          name: string
          network: Database["public"]["Enums"]["network_type"]
        }
        Insert: {
          created_at?: string
          data_volume_mb: number
          id?: string
          is_active?: boolean
          name: string
          network: Database["public"]["Enums"]["network_type"]
        }
        Update: {
          created_at?: string
          data_volume_mb?: number
          id?: string
          is_active?: boolean
          name?: string
          network?: Database["public"]["Enums"]["network_type"]
        }
        Relationships: []
      }
      free_data_codes: {
        Row: {
          campaign_id: string
          code: string
          created_at: string
          id: string
          redeemed_at: string | null
          redeemed_by_phone: string | null
        }
        Insert: {
          campaign_id: string
          code: string
          created_at?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by_phone?: string | null
        }
        Update: {
          campaign_id?: string
          code?: string
          created_at?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "free_data_codes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "free_data_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agent_profit: number | null
          amount: number
          buyer_user_id: string | null
          created_at: string
          delivered_pin: string | null
          id: string
          notes: string | null
          product_id: string | null
          recipient_email: string | null
          recipient_phone: string
          reference: string
          status: Database["public"]["Enums"]["order_status"]
          store_owner_id: string | null
          swift_order_id: string | null
          swift_status: string | null
          updated_at: string
        }
        Insert: {
          agent_profit?: number | null
          amount: number
          buyer_user_id?: string | null
          created_at?: string
          delivered_pin?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          recipient_email?: string | null
          recipient_phone: string
          reference?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_owner_id?: string | null
          swift_order_id?: string | null
          swift_status?: string | null
          updated_at?: string
        }
        Update: {
          agent_profit?: number | null
          amount?: number
          buyer_user_id?: string | null
          created_at?: string
          delivered_pin?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          recipient_email?: string | null
          recipient_phone?: string
          reference?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_owner_id?: string | null
          swift_order_id?: string | null
          swift_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_settings: {
        Row: {
          created_at: string
          id: string
          is_live: boolean
          paystack_public_key: string | null
          paystack_secret_key: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_live?: boolean
          paystack_public_key?: string | null
          paystack_secret_key?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_live?: boolean
          paystack_public_key?: string | null
          paystack_secret_key?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          paystack_access_code: string | null
          paystack_authorization_url: string | null
          paystack_response: Json | null
          processed_at: string | null
          purpose: string
          reference: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paystack_access_code?: string | null
          paystack_authorization_url?: string | null
          paystack_response?: Json | null
          processed_at?: string | null
          purpose: string
          reference: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paystack_access_code?: string | null
          paystack_authorization_url?: string | null
          paystack_response?: Json | null
          processed_at?: string | null
          purpose?: string
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          agent_price: number
          created_at: string
          data_volume_mb: number | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          network: Database["public"]["Enums"]["network_type"]
          public_price: number
          stock_count: number | null
          swift_package_id: string | null
          type: Database["public"]["Enums"]["product_type"]
          updated_at: string
        }
        Insert: {
          agent_price: number
          created_at?: string
          data_volume_mb?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          network: Database["public"]["Enums"]["network_type"]
          public_price: number
          stock_count?: number | null
          swift_package_id?: string | null
          type: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Update: {
          agent_price?: number
          created_at?: string
          data_volume_mb?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          network?: Database["public"]["Enums"]["network_type"]
          public_price?: number
          stock_count?: number | null
          swift_package_id?: string | null
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_suspended: boolean
          parent_agent_id: string | null
          phone: string | null
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_suspended?: boolean
          parent_agent_id?: string | null
          phone?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          parent_agent_id?: string | null
          phone?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_agent_id_fkey"
            columns: ["parent_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          agent_signup_fee: number
          id: string
          logo_url: string | null
          maintenance_message: string | null
          maintenance_mode: boolean
          min_withdrawal: number
          singleton: boolean
          site_name: string
          updated_at: string
          whatsapp_channel_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          agent_signup_fee?: number
          id?: string
          logo_url?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean
          min_withdrawal?: number
          singleton?: boolean
          site_name?: string
          updated_at?: string
          whatsapp_channel_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          agent_signup_fee?: number
          id?: string
          logo_url?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean
          min_withdrawal?: number
          singleton?: boolean
          site_name?: string
          updated_at?: string
          whatsapp_channel_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      store_product_pricing: {
        Row: {
          created_at: string
          id: string
          product_id: string
          profit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          profit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          profit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_product_pricing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          logo_url: string | null
          slug: string
          tagline: string | null
          theme_color: string | null
          updated_at: string
          user_id: string
          whatsapp_group_link: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          slug: string
          tagline?: string | null
          theme_color?: string | null
          updated_at?: string
          user_id: string
          whatsapp_group_link?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          slug?: string
          tagline?: string | null
          theme_color?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_group_link?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference: string | null
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_name: string
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          momo_number: string
          network: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          momo_number: string
          network: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          momo_number?: string
          network?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_credit_wallet: {
        Args: { _amount: number; _description?: string; _user_id: string }
        Returns: undefined
      }
      admin_list_users: {
        Args: { _search?: string }
        Returns: {
          balance: number
          created_at: string
          email: string
          full_name: string
          id: string
          is_suspended: boolean
          phone: string
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      admin_overview: { Args: never; Returns: Json }
      admin_set_role: {
        Args: {
          _enabled: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      track_order: {
        Args: { _phone: string; _reference: string }
        Returns: {
          amount: number
          created_at: string
          product_name: string
          recipient_phone: string
          reference: string
          status: Database["public"]["Enums"]["order_status"]
        }[]
      }
      wallet_pay_for_order: { Args: { _order_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "agent" | "subagent" | "customer"
      network_type: "mtn" | "telecel" | "airteltigo" | "bece" | "wassce"
      order_status: "processing" | "delivered" | "failed" | "refunded"
      product_type: "data" | "checker"
      tx_type:
        | "topup"
        | "purchase"
        | "withdrawal"
        | "refund"
        | "referral_bonus"
        | "admin_credit"
      withdrawal_status: "pending" | "approved" | "rejected" | "paid"
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
      app_role: ["admin", "agent", "subagent", "customer"],
      network_type: ["mtn", "telecel", "airteltigo", "bece", "wassce"],
      order_status: ["processing", "delivered", "failed", "refunded"],
      product_type: ["data", "checker"],
      tx_type: [
        "topup",
        "purchase",
        "withdrawal",
        "refund",
        "referral_bonus",
        "admin_credit",
      ],
      withdrawal_status: ["pending", "approved", "rejected", "paid"],
    },
  },
} as const
