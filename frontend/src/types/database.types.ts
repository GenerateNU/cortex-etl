export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      classifications: {
        Row: {
          created_at: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'classifications_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      extracted_files: {
        Row: {
          created_at: string | null
          embedding: string | null
          extracted_data: Json | null
          id: string
          source_file_id: string
          status: Database['public']['Enums']['extraction_status']
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          extracted_data?: Json | null
          id?: string
          source_file_id: string
          status: Database['public']['Enums']['extraction_status']
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          extracted_data?: Json | null
          id?: string
          source_file_id?: string
          status?: Database['public']['Enums']['extraction_status']
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'extracted_files_source_file_id_fkey'
            columns: ['source_file_id']
            isOneToOne: false
            referencedRelation: 'file_uploads'
            referencedColumns: ['id']
          },
        ]
      }
      file_uploads: {
        Row: {
          bucket_id: string
          classification_id: string | null
          created_at: string | null
          id: string
          name: string
          tenant_id: string
          type: Database['public']['Enums']['file_type']
        }
        Insert: {
          bucket_id: string
          classification_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          tenant_id: string
          type: Database['public']['Enums']['file_type']
        }
        Update: {
          bucket_id?: string
          classification_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          tenant_id?: string
          type?: Database['public']['Enums']['file_type']
        }
        Relationships: [
          {
            foreignKeyName: 'file_uploads_classification_id_fkey'
            columns: ['classification_id']
            isOneToOne: false
            referencedRelation: 'classifications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'file_uploads_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      migrations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sequence: number
          sql: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sequence: number
          sql: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sequence?: number
          sql?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'migrations_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: Database['public']['Enums']['user_role']
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database['public']['Enums']['user_role']
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database['public']['Enums']['user_role']
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      relationships: {
        Row: {
          created_at: string | null
          from_classification_id: string
          id: string
          tenant_id: string
          to_classification_id: string
          type: Database['public']['Enums']['relationship_type']
        }
        Insert: {
          created_at?: string | null
          from_classification_id: string
          id?: string
          tenant_id: string
          to_classification_id: string
          type: Database['public']['Enums']['relationship_type']
        }
        Update: {
          created_at?: string | null
          from_classification_id?: string
          id?: string
          tenant_id?: string
          to_classification_id?: string
          type?: Database['public']['Enums']['relationship_type']
        }
        Relationships: [
          {
            foreignKeyName: 'relationships_from_classification_id_fkey'
            columns: ['from_classification_id']
            isOneToOne: false
            referencedRelation: 'classifications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'relationships_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'relationships_to_classification_id_fkey'
            columns: ['to_classification_id']
            isOneToOne: false
            referencedRelation: 'classifications'
            referencedColumns: ['id']
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      webhook_config: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      exec_sql: { Args: { sql: string }; Returns: undefined }
      execute_sql: { Args: { query: string }; Returns: undefined }
      match_documents: {
        Args: {
          filter_tenant_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          extracted_data: Json
          id: string
          similarity: number
          source_file_id: string
        }[]
      }
      update_webhook_config: {
        Args: { secret: string; url: string }
        Returns: undefined
      }
    }
    Enums: {
      extraction_status: 'queued' | 'processing' | 'completed' | 'failed'
      file_type: 'pdf' | 'csv'
      relationship_type: 'one-to-one' | 'one-to-many' | 'many-to-many'
      user_role: 'tenant' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      extraction_status: ['queued', 'processing', 'completed', 'failed'],
      file_type: ['pdf', 'csv'],
      relationship_type: ['one-to-one', 'one-to-many', 'many-to-many'],
      user_role: ['tenant', 'admin'],
    },
  },
} as const
