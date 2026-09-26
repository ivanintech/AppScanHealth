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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          conditions: Json
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          points: number | null
          rarity: string | null
        }
        Insert: {
          category?: string | null
          conditions: Json
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points?: number | null
          rarity?: string | null
        }
        Update: {
          category?: string | null
          conditions?: Json
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points?: number | null
          rarity?: string | null
        }
        Relationships: []
      }
      additives: {
        Row: {
          e_id: string
          e_name: string | null
          e_type: string | null
          searchterm: string | null
          searchterm_2: string | null
        }
        Insert: {
          e_id: string
          e_name?: string | null
          e_type?: string | null
          searchterm?: string | null
          searchterm_2?: string | null
        }
        Update: {
          e_id?: string
          e_name?: string | null
          e_type?: string | null
          searchterm?: string | null
          searchterm_2?: string | null
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          confidence_score: number | null
          content: Json
          created_at: string | null
          expires_at: string | null
          id: string
          priority: number | null
          recommendation_type: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          priority?: number | null
          recommendation_type: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          priority?: number | null
          recommendation_type?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          performed_at: string | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_audit_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          considerations: string | null
          description: string | null
          health_goals: string | null
          icon_url: string | null
          id: string
          impact: string | null
          interactions: string | null
          name: string
          parent_category_id: string[] | null
          recommended_time: string | null
          search_keywords: string | null
          side_effects: string | null
          sort_order: number | null
          target_audience: string | null
          usage_instructions: string | null
        }
        Insert: {
          color?: string | null
          considerations?: string | null
          description?: string | null
          health_goals?: string | null
          icon_url?: string | null
          id?: string
          impact?: string | null
          interactions?: string | null
          name: string
          parent_category_id?: string[] | null
          recommended_time?: string | null
          search_keywords?: string | null
          side_effects?: string | null
          sort_order?: number | null
          target_audience?: string | null
          usage_instructions?: string | null
        }
        Update: {
          color?: string | null
          considerations?: string | null
          description?: string | null
          health_goals?: string | null
          icon_url?: string | null
          id?: string
          impact?: string | null
          interactions?: string | null
          name?: string
          parent_category_id?: string[] | null
          recommended_time?: string | null
          search_keywords?: string | null
          side_effects?: string | null
          sort_order?: number | null
          target_audience?: string | null
          usage_instructions?: string | null
        }
        Relationships: []
      }
      health_data_imports: {
        Row: {
          data_type: string
          id: string
          import_date: string | null
          processed_data: Json | null
          quality_score: number | null
          raw_data: Json
          source: string
          user_id: string
        }
        Insert: {
          data_type: string
          id?: string
          import_date?: string | null
          processed_data?: Json | null
          quality_score?: number | null
          raw_data: Json
          source: string
          user_id: string
        }
        Update: {
          data_type?: string
          id?: string
          import_date?: string | null
          processed_data?: Json | null
          quality_score?: number | null
          raw_data?: Json
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_data_imports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          device_info: Json | null
          email_enabled: boolean | null
          id: string
          last_token_update: string | null
          push_enabled: boolean | null
          push_tokens: string[] | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_window_minutes: number | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          email_enabled?: boolean | null
          id?: string
          last_token_update?: string | null
          push_enabled?: boolean | null
          push_tokens?: string[] | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_window_minutes?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          email_enabled?: boolean | null
          id?: string
          last_token_update?: string | null
          push_enabled?: boolean | null
          push_tokens?: string[] | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_window_minutes?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          _keywords: string
          additives_tags: string | null
          allergens_tags: string | null
          brands_tags: string | null
          calculated_score: number | null
          categories_tags: string | null
          category_id: string | null
          countries_tags: string | null
          created_at: string | null
          ean: string
          image_ingredients_url: string | null
          image_nutrition_url: string | null
          image_url: string | null
          ingredients_analysis_tags: string | null
          ingredients_tags: string | null
          ingredients_text: string | null
          ingredients_text_with_allergens: string | null
          known_ingredients_n: number | null
          labels_tags: string | null
          nova_groups_markers: Json | null
          nutrient_levels: Json | null
          nutriments: Json | null
          nutriscore_score: number | null
          product_name: string | null
          serving_quantity: number | null
          serving_quantity_unit: string | null
          subcategory_id: string | null
          supplement_name: string | null
          traces_tags: string | null
          unknown_ingredients_n: number | null
          updated_at: string | null
        }
        Insert: {
          _keywords: string
          additives_tags?: string | null
          allergens_tags?: string | null
          brands_tags?: string | null
          calculated_score?: number | null
          categories_tags?: string | null
          category_id?: string | null
          countries_tags?: string | null
          created_at?: string | null
          ean: string
          image_ingredients_url?: string | null
          image_nutrition_url?: string | null
          image_url?: string | null
          ingredients_analysis_tags?: string | null
          ingredients_tags?: string | null
          ingredients_text?: string | null
          ingredients_text_with_allergens?: string | null
          known_ingredients_n?: number | null
          labels_tags?: string | null
          nova_groups_markers?: Json | null
          nutrient_levels?: Json | null
          nutriments?: Json | null
          nutriscore_score?: number | null
          product_name?: string | null
          serving_quantity?: number | null
          serving_quantity_unit?: string | null
          subcategory_id?: string | null
          supplement_name?: string | null
          traces_tags?: string | null
          unknown_ingredients_n?: number | null
          updated_at?: string | null
        }
        Update: {
          _keywords?: string
          additives_tags?: string | null
          allergens_tags?: string | null
          brands_tags?: string | null
          calculated_score?: number | null
          categories_tags?: string | null
          category_id?: string | null
          countries_tags?: string | null
          created_at?: string | null
          ean?: string
          image_ingredients_url?: string | null
          image_nutrition_url?: string | null
          image_url?: string | null
          ingredients_analysis_tags?: string | null
          ingredients_tags?: string | null
          ingredients_text?: string | null
          ingredients_text_with_allergens?: string | null
          known_ingredients_n?: number | null
          labels_tags?: string | null
          nova_groups_markers?: Json | null
          nutrient_levels?: Json | null
          nutriments?: Json | null
          nutriscore_score?: number | null
          product_name?: string | null
          serving_quantity?: number | null
          serving_quantity_unit?: string | null
          subcategory_id?: string | null
          supplement_name?: string | null
          traces_tags?: string | null
          unknown_ingredients_n?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_supplement"
            columns: ["supplement_name"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          checkup_results: Json | null
          health_goals: string[] | null
          id: string
          last_activity: string | null
          level: number | null
          onboarding_completed: boolean | null
          total_points: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          checkup_results?: Json | null
          health_goals?: string[] | null
          id: string
          last_activity?: string | null
          level?: number | null
          onboarding_completed?: boolean | null
          total_points?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          checkup_results?: Json | null
          health_goals?: string[] | null
          id?: string
          last_activity?: string | null
          level?: number | null
          onboarding_completed?: boolean | null
          total_points?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          product_id: string
          rating: number
          title: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          product_id: string
          rating: number
          title?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          product_id?: string
          rating?: number
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      supplement_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplement_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "category_with_product_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "supplement_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_categories_2: {
        Row: {
          benefits: string | null
          color: string | null
          description: string | null
          icon_url: string | null
          id: string
          impact: string | null
          interactions: string | null
          is_active: boolean | null
          link: string | null
          name: string
          parent_category_id: string | null
          recommended_time: string | null
          side_effects: string | null
          sort_order: number | null
        }
        Insert: {
          benefits?: string | null
          color?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          impact?: string | null
          interactions?: string | null
          is_active?: boolean | null
          link?: string | null
          name: string
          parent_category_id?: string | null
          recommended_time?: string | null
          side_effects?: string | null
          sort_order?: number | null
        }
        Update: {
          benefits?: string | null
          color?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          impact?: string | null
          interactions?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string
          parent_category_id?: string | null
          recommended_time?: string | null
          side_effects?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplement_categories_2_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "supplement_categories_2"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_interactions: {
        Row: {
          created_at: string
          description: string
          id: string
          interaction_type: string
          recommendation: string | null
          scientific_evidence: string | null
          severity: string
          supplement_a_ean: string
          supplement_b_ean: string
          time_gap_hours: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          interaction_type: string
          recommendation?: string | null
          scientific_evidence?: string | null
          severity: string
          supplement_a_ean: string
          supplement_b_ean: string
          time_gap_hours?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          interaction_type?: string
          recommendation?: string | null
          scientific_evidence?: string | null
          severity?: string
          supplement_a_ean?: string
          supplement_b_ean?: string
          time_gap_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_interactions_supplement_a"
            columns: ["supplement_a_ean"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["ean"]
          },
          {
            foreignKeyName: "fk_interactions_supplement_a"
            columns: ["supplement_a_ean"]
            isOneToOne: false
            referencedRelation: "supplements_complete"
            referencedColumns: ["ean"]
          },
          {
            foreignKeyName: "fk_interactions_supplement_a"
            columns: ["supplement_a_ean"]
            isOneToOne: false
            referencedRelation: "supplements_with_category"
            referencedColumns: ["ean"]
          },
          {
            foreignKeyName: "fk_interactions_supplement_b"
            columns: ["supplement_b_ean"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["ean"]
          },
          {
            foreignKeyName: "fk_interactions_supplement_b"
            columns: ["supplement_b_ean"]
            isOneToOne: false
            referencedRelation: "supplements_complete"
            referencedColumns: ["ean"]
          },
          {
            foreignKeyName: "fk_interactions_supplement_b"
            columns: ["supplement_b_ean"]
            isOneToOne: false
            referencedRelation: "supplements_with_category"
            referencedColumns: ["ean"]
          },
          {
            foreignKeyName: "supplement_interactions_supplement_a_ean_fkey"
            columns: ["supplement_a_ean"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["ean"]
          },
          {
            foreignKeyName: "supplement_interactions_supplement_b_ean_fkey"
            columns: ["supplement_b_ean"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["ean"]
          },
        ]
      }
      supplement_logs: {
        Row: {
          created_at: string
          dose_taken: Json | null
          id: string
          mood_after: number | null
          mood_before: number | null
          notes: string | null
          planned_time: string | null
          supplement_ean: string
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dose_taken?: Json | null
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          planned_time?: string | null
          supplement_ean: string
          taken_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dose_taken?: Json | null
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          planned_time?: string | null
          supplement_ean?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplement_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_logs_supplement_ean_fkey1"
            columns: ["supplement_ean"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["ean"]
          },
          {
            foreignKeyName: "fk_supplement_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_logs_supplement_ean_fkey1"
            columns: ["supplement_ean"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["ean"]
          },
        ]
      }
      supplement_reminders: {
        Row: {
          created_at: string
          days_of_week: number[]
          id: string
          is_active: boolean
          notification_enabled: boolean
          reminder_time: string
          supplement_ean: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[]
          id?: string
          is_active?: boolean
          notification_enabled?: boolean
          reminder_time: string
          supplement_ean: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          id?: string
          is_active?: boolean
          notification_enabled?: boolean
          reminder_time?: string
          supplement_ean?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplement_reminders_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_reminders_supplement_ean_fkey"
            columns: ["supplement_ean"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["ean"]
          },
        ]
      }
      supplements: {
        Row: {
          brand: string | null
          categories: string[] | null
          category_id: string | null
          created_at: string | null
          description: string | null
          efectos_secundarios: string | null
          format: string | null
          health_goals: string[] | null
          image_url: string | null
          impacto_ayuno: string | null
          ingredients_text: string | null
          interacciones: string | null
          momento_recomendado: string | null
          name: string
          nutriments: Json | null
          search_keywords: string[] | null
          storage_instructions: string | null
          target_audience: string[] | null
          usage_instructions: string | null
        }
        Insert: {
          brand?: string | null
          categories?: string[] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          efectos_secundarios?: string | null
          format?: string | null
          health_goals?: string[] | null
          image_url?: string | null
          impacto_ayuno?: string | null
          ingredients_text?: string | null
          interacciones?: string | null
          momento_recomendado?: string | null
          name: string
          nutriments?: Json | null
          search_keywords?: string[] | null
          storage_instructions?: string | null
          target_audience?: string[] | null
          usage_instructions?: string | null
        }
        Update: {
          brand?: string | null
          categories?: string[] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          efectos_secundarios?: string | null
          format?: string | null
          health_goals?: string[] | null
          image_url?: string | null
          impacto_ayuno?: string | null
          ingredients_text?: string | null
          interacciones?: string | null
          momento_recomendado?: string | null
          name?: string
          nutriments?: Json | null
          search_keywords?: string[] | null
          storage_instructions?: string | null
          target_audience?: string[] | null
          usage_instructions?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          progress: Json | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          progress?: Json | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          progress?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          created_at: string | null
          id: string
          metric_type: string
          metric_value: Json
          recorded_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_type: string
          metric_value: Json
          recorded_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_type?: string
          metric_value?: Json
          recorded_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          feedback_type: string
          id: string
          processed: boolean | null
          rating: number | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          feedback_type: string
          id?: string
          processed?: boolean | null
          rating?: number | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string
          id?: string
          processed?: boolean | null
          rating?: number | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_supplement_stack: {
        Row: {
          created_at: string | null
          preferred_time: string | null
          supplement_ean: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          preferred_time?: string | null
          supplement_ean: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          preferred_time?: string | null
          supplement_ean?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_supplement_stack_2_supplement_ean_fkey1"
            columns: ["supplement_ean"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["ean"]
          },
          {
            foreignKeyName: "user_supplement_stack_2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_score_history: {
        Row: {
          created_at: string
          factors: Json | null
          food_score: number
          id: string
          is_manual: boolean | null
          notes: string | null
          overall_score: number
          recorded_date: string
          score_breakdown: Json | null
          supplements_score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          factors?: Json | null
          food_score: number
          id?: string
          is_manual?: boolean | null
          notes?: string | null
          overall_score: number
          recorded_date?: string
          score_breakdown?: Json | null
          supplements_score: number
          user_id: string
        }
        Update: {
          created_at?: string
          factors?: Json | null
          food_score?: number
          id?: string
          is_manual?: boolean | null
          notes?: string | null
          overall_score?: number
          recorded_date?: string
          score_breakdown?: Json | null
          supplements_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wellness_score_history_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      categories_public: {
        Row: {
          color: string | null
          considerations: string | null
          description: string | null
          health_goals: string | null
          icon_url: string | null
          id: string | null
          impact: string | null
          interactions: string | null
          name: string | null
          parent_category_id: string[] | null
          recommended_time: string | null
          search_keywords: string | null
          side_effects: string | null
          sort_order: number | null
          target_audience: string | null
          usage_instructions: string | null
        }
        Insert: {
          color?: string | null
          considerations?: string | null
          description?: string | null
          health_goals?: string | null
          icon_url?: string | null
          id?: string | null
          impact?: string | null
          interactions?: string | null
          name?: string | null
          parent_category_id?: string[] | null
          recommended_time?: string | null
          search_keywords?: string | null
          side_effects?: string | null
          sort_order?: number | null
          target_audience?: string | null
          usage_instructions?: string | null
        }
        Update: {
          color?: string | null
          considerations?: string | null
          description?: string | null
          health_goals?: string | null
          icon_url?: string | null
          id?: string | null
          impact?: string | null
          interactions?: string | null
          name?: string | null
          parent_category_id?: string[] | null
          recommended_time?: string | null
          search_keywords?: string | null
          side_effects?: string | null
          sort_order?: number | null
          target_audience?: string | null
          usage_instructions?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_push_token: {
        Args: { p_device_info?: Json; p_token: string; p_user_id: string }
        Returns: undefined
      }
      calculate_user_analytics: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      calculate_user_analytics_simple: {
        Args: { p_user_id: string }
        Returns: Json
      }
      calculate_wellness_score: {
        Args: { p_date?: string; p_user_id: string }
        Returns: Json
      }
      check_achievements: {
        Args: { p_user_id: string }
        Returns: number
      }
      check_all_historical_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
      debug_day_13_supplements: {
        Args: { p_user_id?: string }
        Returns: {
          brand: string
          supplement_ean: string
          supplement_name: string
          taken_at: string
          was_taken: boolean
        }[]
      }
      debug_historical_dashboard_error: {
        Args: { p_target_date: string; p_user_id: string }
        Returns: Json
      }
      debug_supplement_completion: {
        Args: { p_target_date: string; p_user_id: string }
        Returns: Json
      }
      debug_supplement_logs_direct: {
        Args: {
          p_supplement_ean: string
          p_target_date: string
          p_user_id: string
        }
        Returns: Json
      }
      debug_user_data_for_dates: {
        Args: { p_date1: string; p_date2: string; p_user_email: string }
        Returns: Json
      }
      debug_weekly_adherence: {
        Args:
          | { p_end_date?: string; p_start_date?: string; p_user_id?: string }
          | { p_target_date: string; p_user_id: string }
        Returns: {
          adherence_percentage: number
          day: string
          stack_size: number
          supplements_taken: number
        }[]
      }
      get_all_achievements_status: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          color: string
          considerations: string
          description: string
          health_goals: string
          icon_url: string
          id: string
          impact: string
          interactions: string
          name: string
          parent_category_id: string[]
          recommended_time: string
          search_keywords: string
          side_effects: string
          sort_order: number
          target_audience: string
          usage_instructions: string
        }[]
      }
      get_daily_adherence_for_week: {
        Args: { end_date: string; p_user_id: string; start_date: string }
        Returns: {
          adherence_percentage: number
          log_date: string
        }[]
      }
      get_gamification_data: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          longest_streak: number
          total_active_days: number
          total_points: number
          upcoming_achievements: Json
          user_level: number
          weekly_adherence: number
          weekly_completed_days: number
        }[]
      }
      get_historical_dashboard_data: {
        Args: { p_target_date: string; p_user_id: string }
        Returns: Json
      }
      get_historical_dashboard_data_simple: {
        Args: { p_target_date: string; p_user_id: string }
        Returns: Json
      }
      get_interactions_for_pairs: {
        Args: { pairs: Json }
        Returns: {
          description: string
          interaction_type: string
          recommendation: string
          severity: string
          supplement_a_ean: string
          supplement_b_ean: string
        }[]
      }
      get_interactions_for_stack: {
        Args: { p_eans: string[] }
        Returns: {
          description: string
          id: string
          interaction_type: string
          recommendation: string
          severity: string
          supplement_a_ean: string
          supplement_b_ean: string
        }[]
      }
      get_main_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          color: string
          considerations: string
          description: string
          health_goals: string
          icon_url: string
          id: string
          impact: string
          interactions: string
          name: string
          recommended_time: string
          search_keywords: string
          side_effects: string
          sort_order: number
          target_audience: string
          usage_instructions: string
        }[]
      }
      get_personalized_recommendations: {
        Args: { p_user_id: string }
        Returns: {
          confidence_score: number
          content: Json
          priority: number
          recommendation_type: string
          title: string
        }[]
      }
      get_products_by_category: {
        Args: { category_slug: string }
        Returns: {
          brand: string
          category_name: string
          ean: string
          image_url: string
          is_featured: boolean
          name: string
          popularity_score: number
          price_per_serving: number
          subcategory_name: string
        }[]
      }
      get_reviews_with_users: {
        Args: { p_product_id: string }
        Returns: {
          comment: string
          created_at: string
          id: number
          product_id: string
          rating: number
          title: string
          user_avatar_url: string
          user_id: string
          user_name: string
        }[]
      }
      get_subcategories: {
        Args: { parent_id: string }
        Returns: {
          color: string
          considerations: string
          description: string
          health_goals: string
          icon_url: string
          id: string
          impact: string
          interactions: string
          name: string
          parent_category_id: string[]
          recommended_time: string
          search_keywords: string
          side_effects: string
          sort_order: number
          target_audience: string
          usage_instructions: string
        }[]
      }
      get_user_dashboard_stats: {
        Args: { p_user_id: string }
        Returns: {
          achievements_count: number
          adherence_rate: number
          interactions_count: number
          total_logs: number
          total_supplements: number
        }[]
      }
      get_user_progress: {
        Args:
          | { p_start_date?: string; p_user_id: string }
          | { p_user_id: string }
        Returns: Json
      }
      get_weekly_adherence: {
        Args: { p_start_date: string; p_user_id: string }
        Returns: {
          adherence_percentage: number
          day: string
        }[]
      }
      remove_push_token: {
        Args: { p_token: string; p_user_id: string }
        Returns: undefined
      }
      search_supplements: {
        Args: { search_term: string }
        Returns: {
          brand: string
          category_name: string
          ean: string
          image_url: string
          is_featured: boolean
          name: string
          popularity_score: number
          price_per_serving: number
          relevance_score: number
          subcategory_name: string
        }[]
      }
      send_feedback_email: {
        Args: {
          feedback_type: string
          user_comment?: string
          user_email?: string
          user_rating?: number
        }
        Returns: Json
      }
      test_upcoming_achievements_only: {
        Args: { p_user_id: string }
        Returns: Json
      }
      upsert_wellness_score: {
        Args: { p_date?: string; p_manual_score?: Json; p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      interaction_type:
        | "positive"
        | "negative"
        | "caution"
        | "neutral"
        | "timing"
        | "absorption"
        | "synergy"
        | "antagonist"
        | "contraindication"
        | "food_interaction"
      severity:
        | "low"
        | "medium"
        | "high"
        | "critical"
        | "info"
        | "positive"
        | "warning"
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
      interaction_type: [
        "positive",
        "negative",
        "caution",
        "neutral",
        "timing",
        "absorption",
        "synergy",
        "antagonist",
        "contraindication",
        "food_interaction",
      ],
      severity: [
        "low",
        "medium",
        "high",
        "critical",
        "info",
        "positive",
        "warning",
      ],
    },
  },
} as const
