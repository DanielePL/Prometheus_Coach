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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blocked_time_slots: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          reason: string | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arms: number | null
          chest: number | null
          client_id: string
          created_at: string | null
          date: string
          hips: number | null
          id: string
          legs: number | null
          waist: number | null
        }
        Insert: {
          arms?: number | null
          chest?: number | null
          client_id: string
          created_at?: string | null
          date: string
          hips?: number | null
          id?: string
          legs?: number | null
          waist?: number | null
        }
        Update: {
          arms?: number | null
          chest?: number | null
          client_id?: string
          created_at?: string | null
          date?: string
          hips?: number | null
          id?: string
          legs?: number | null
          waist?: number | null
        }
        Relationships: []
      }
      booking_links: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          is_enabled: boolean
          slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          is_enabled?: boolean
          slug: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          is_enabled?: boolean
          slug?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_enabled: boolean | null
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_enabled?: boolean | null
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_enabled?: boolean | null
          start_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_integrations: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_workouts: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string | null
          description: string | null
          exercises: Json | null
          id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string | null
          description?: string | null
          exercises?: Json | null
          id?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string | null
          description?: string | null
          exercises?: Json | null
          id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_client_connections: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          requested_at: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          requested_at?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          requested_at?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_client_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_client_connections_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_notes: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string | null
          id: string
          note_text: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string | null
          id?: string
          note_text: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          note_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          assigned_to: string | null
          color: string
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          event_type: string
          id: string
          is_recurring: boolean
          parent_event_id: string | null
          recurrence_days: string[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_pattern: string | null
          reminders: number[] | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          color?: string
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          event_type?: string
          id?: string
          is_recurring?: boolean
          parent_event_id?: string | null
          recurrence_days?: string[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          reminders?: number[] | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          color?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          is_recurring?: boolean
          parent_event_id?: string | null
          recurrence_days?: string[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          reminders?: number[] | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: Database["public"]["Enums"]["exercise_category"]
          cloudfront_url: string
          common_mistakes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration: number | null
          equipment: string | null
          id: string
          key_aspects: string | null
          primary_muscles: string | null
          suggested_reps: string | null
          suggested_sets: number | null
          suggested_weight: string | null
          thumbnail_url: string | null
          title: string
          video_filename: string
          visibility: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["exercise_category"]
          cloudfront_url: string
          common_mistakes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          equipment?: string | null
          id?: string
          key_aspects?: string | null
          primary_muscles?: string | null
          suggested_reps?: string | null
          suggested_sets?: number | null
          suggested_weight?: string | null
          thumbnail_url?: string | null
          title: string
          video_filename: string
          visibility?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["exercise_category"]
          cloudfront_url?: string
          common_mistakes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          equipment?: string | null
          id?: string
          key_aspects?: string | null
          primary_muscles?: string | null
          suggested_reps?: string | null
          suggested_sets?: number | null
          suggested_weight?: string | null
          thumbnail_url?: string | null
          title?: string
          video_filename?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          message: string
          read: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          message: string
          read?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          message?: string
          read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          achieved_at: string
          client_id: string
          created_at: string | null
          exercise_id: string
          id: string
          reps_completed: number
          session_id: string | null
          weight_used: number
        }
        Insert: {
          achieved_at?: string
          client_id: string
          created_at?: string | null
          exercise_id: string
          id?: string
          reps_completed: number
          session_id?: string | null
          weight_used: number
        }
        Update: {
          achieved_at?: string
          client_id?: string
          created_at?: string | null
          exercise_id?: string
          id?: string
          reps_completed?: number
          session_id?: string | null
          weight_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_admin: boolean
          preferred_timezone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_admin?: boolean
          preferred_timezone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_admin?: boolean
          preferred_timezone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          client_id: string
          created_at: string | null
          date: string
          id: string
          photo_url: string
          type: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date: string
          id?: string
          photo_url: string
          type?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
          id?: string
          photo_url?: string
          type?: string | null
        }
        Relationships: []
      }
      routine_assignments: {
        Row: {
          assigned_at: string | null
          client_id: string
          coach_id: string
          id: string
          notes: string | null
          routine_id: string
          scheduled_date: string | null
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          client_id: string
          coach_id: string
          id?: string
          notes?: string | null
          routine_id: string
          scheduled_date?: string | null
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          client_id?: string
          coach_id?: string
          id?: string
          notes?: string | null
          routine_id?: string
          scheduled_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_assignments_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps_max: number | null
          reps_min: number | null
          rest_seconds: number | null
          routine_id: string
          sets: number | null
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          order_index: number
          reps_max?: number | null
          reps_min?: number | null
          rest_seconds?: number | null
          routine_id: string
          sets?: number | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps_max?: number | null
          reps_min?: number | null
          rest_seconds?: number | null
          routine_id?: string
          sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          coach_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routines_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          completed: boolean | null
          created_at: string | null
          exercise_id: string
          id: string
          reps_completed: number | null
          session_id: string
          set_number: number
          weight_used: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          exercise_id: string
          id?: string
          reps_completed?: number | null
          session_id: string
          set_number: number
          weight_used?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          exercise_id?: string
          id?: string
          reps_completed?: number | null
          session_id?: string
          set_number?: number
          weight_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_world_clock_timezones: {
        Row: {
          city_name: string
          created_at: string | null
          display_order: number | null
          flag: string | null
          id: string
          timezone: string
          user_id: string
        }
        Insert: {
          city_name: string
          created_at?: string | null
          display_order?: number | null
          flag?: string | null
          id?: string
          timezone: string
          user_id: string
        }
        Update: {
          city_name?: string
          created_at?: string | null
          display_order?: number | null
          flag?: string | null
          id?: string
          timezone?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          client_id: string
          created_at: string | null
          date: string
          id: string
          notes: string | null
          weight: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          weight: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          weight?: number
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string | null
          exercises_completed: Json | null
          id: string
          notes: string | null
          workout_id: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          exercises_completed?: Json | null
          id?: string
          notes?: string | null
          workout_id?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          exercises_completed?: Json | null
          id?: string
          notes?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "client_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          client_id: string
          client_notes: string | null
          completed_at: string | null
          created_at: string | null
          current_exercise_index: number | null
          duration_seconds: number | null
          id: string
          paused_at: string | null
          paused_elapsed_seconds: number | null
          routine_id: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          client_id: string
          client_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_exercise_index?: number | null
          duration_seconds?: number | null
          id?: string
          paused_at?: string | null
          paused_elapsed_seconds?: number | null
          routine_id: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string
          client_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_exercise_index?: number | null
          duration_seconds?: number | null
          id?: string
          paused_at?: string | null
          paused_elapsed_seconds?: number | null
          routine_id?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_recurring_events: {
        Args: {
          p_end_date: string
          p_event_id: string
          p_recurrence_days: string[]
          p_recurrence_interval: number
          p_recurrence_pattern: string
          p_start_date: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "coach" | "client"
      exercise_category:
        | "bodybuilding"
        | "crossfit"
        | "powerlifting"
        | "weightlifting"
        | "functional"
        | "plyometrics"
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
      app_role: ["admin", "coach", "client"],
      exercise_category: [
        "bodybuilding",
        "crossfit",
        "powerlifting",
        "weightlifting",
        "functional",
        "plyometrics",
      ],
    },
  },
} as const
