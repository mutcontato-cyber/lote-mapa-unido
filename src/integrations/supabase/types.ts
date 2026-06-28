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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      configuracoes: {
        Row: {
          id: string
          valor: string
        }
        Insert: {
          id: string
          valor: string
        }
        Update: {
          id?: string
          valor?: string
        }
        Relationships: []
      }
      loteamentos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      lotes: {
        Row: {
          created_at: string
          id: string
          numero: string
          observacoes: string | null
          quadra_id: string
          status: Database["public"]["Enums"]["lote_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          numero: string
          observacoes?: string | null
          quadra_id: string
          status?: Database["public"]["Enums"]["lote_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          numero?: string
          observacoes?: string | null
          quadra_id?: string
          status?: Database["public"]["Enums"]["lote_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotes_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_customizadas: {
        Row: {
          mensagem: string
          telefone: string
        }
        Insert: {
          mensagem: string
          telefone: string
        }
        Update: {
          mensagem?: string
          telefone?: string
        }
        Relationships: []
      }
      moradores: {
        Row: {
          created_at: string
          created_by: string | null
          data_nascimento: string | null
          id: string
          lote_id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_nascimento?: string | null
          id?: string
          lote_id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_nascimento?: string | null
          id?: string
          lote_id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moradores_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      password_resets: {
        Row: {
          fulfilled_at: string | null
          fulfilled_by: string | null
          full_name: string | null
          id: string
          nova_senha: string | null
          phone: string
          requested_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          full_name?: string | null
          id?: string
          nova_senha?: string | null
          phone: string
          requested_at?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          full_name?: string | null
          id?: string
          nova_senha?: string | null
          phone?: string
          requested_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aceite_termo_at: string | null
          aceite_termo_texto: string | null
          created_at: string
          data_nascimento: string | null
          full_name: string
          id: string
          loteamento_id: string | null
          phone: string
        }
        Insert: {
          aceite_termo_at?: string | null
          aceite_termo_texto?: string | null
          created_at?: string
          data_nascimento?: string | null
          full_name: string
          id: string
          loteamento_id?: string | null
          phone: string
        }
        Update: {
          aceite_termo_at?: string | null
          aceite_termo_texto?: string | null
          created_at?: string
          data_nascimento?: string | null
          full_name?: string
          id?: string
          loteamento_id?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_loteamento_id_fkey"
            columns: ["loteamento_id"]
            isOneToOne: false
            referencedRelation: "loteamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      proprietarios: {
        Row: {
          apoia_asfalto: boolean | null
          assinatura_status: Database["public"]["Enums"]["assinatura_status"]
          chefe_casa: boolean | null
          cpf: string | null
          created_at: string
          data_cadastro: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          fracao: number
          geo_city: string | null
          geo_country: string | null
          geo_region: string | null
          id: string
          ip_address: string | null
          lote_id: string
          melhorias: Json | null
          nome: string
          observacoes: string | null
          qtd_moradores: number | null
          responsavel_cadastro: string | null
          situacao: string | null
          telefone: string | null
          updated_at: string
          user_agent: string | null
          whatsapp: string | null
        }
        Insert: {
          apoia_asfalto?: boolean | null
          assinatura_status?: Database["public"]["Enums"]["assinatura_status"]
          chefe_casa?: boolean | null
          cpf?: string | null
          created_at?: string
          data_cadastro?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          fracao?: number
          geo_city?: string | null
          geo_country?: string | null
          geo_region?: string | null
          id?: string
          ip_address?: string | null
          lote_id: string
          melhorias?: Json | null
          nome: string
          observacoes?: string | null
          qtd_moradores?: number | null
          responsavel_cadastro?: string | null
          situacao?: string | null
          telefone?: string | null
          updated_at?: string
          user_agent?: string | null
          whatsapp?: string | null
        }
        Update: {
          apoia_asfalto?: boolean | null
          assinatura_status?: Database["public"]["Enums"]["assinatura_status"]
          chefe_casa?: boolean | null
          cpf?: string | null
          created_at?: string
          data_cadastro?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          fracao?: number
          geo_city?: string | null
          geo_country?: string | null
          geo_region?: string | null
          id?: string
          ip_address?: string | null
          lote_id?: string
          melhorias?: Json | null
          nome?: string
          observacoes?: string | null
          qtd_moradores?: number | null
          responsavel_cadastro?: string | null
          situacao?: string | null
          telefone?: string | null
          updated_at?: string
          user_agent?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proprietarios_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quadras: {
        Row: {
          created_at: string
          id: string
          loteamento_id: string
          nome: string
          observacoes: string | null
          ordem: number
        }
        Insert: {
          created_at?: string
          id?: string
          loteamento_id: string
          nome: string
          observacoes?: string | null
          ordem?: number
        }
        Update: {
          created_at?: string
          id?: string
          loteamento_id?: string
          nome?: string
          observacoes?: string | null
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "quadras_loteamento_id_fkey"
            columns: ["loteamento_id"]
            isOneToOne: false
            referencedRelation: "loteamentos"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apagar_msg_customizada: {
        Args: { secret_token: string; telefone_alvo: string }
        Returns: undefined
      }
      disparar_aniversarios_com_fallback: { Args: never; Returns: Json }
      get_dados_aniversario: { Args: { secret_token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      recalcular_status_lote: {
        Args: { p_lote_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "coordenador" | "visitante"
      assinatura_status: "nao_contatado" | "contatado" | "confirmou" | "assinou"
      lote_status:
        | "sem_cadastro"
        | "cadastrado"
        | "incompleto"
        | "confirmado"
        | "pendencia"
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
      app_role: ["admin", "coordenador", "visitante"],
      assinatura_status: ["nao_contatado", "contatado", "confirmou", "assinou"],
      lote_status: [
        "sem_cadastro",
        "cadastrado",
        "incompleto",
        "confirmado",
        "pendencia",
      ],
    },
  },
} as const
