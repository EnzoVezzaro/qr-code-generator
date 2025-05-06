export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          name: string
          date: string
          location: string
          max_participants: number
          qr_usage_limit: number
          check_in_logo_url: string | null
          check_in_color: string | null
          check_in_message: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          date: string
          location: string
          max_participants: number
          qr_usage_limit: number
          check_in_logo_url?: string | null
          check_in_color?: string | null
          check_in_message?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          date?: string
          location?: string
          max_participants?: number
          qr_usage_limit?: number
          check_in_logo_url?: string | null
          check_in_color?: string | null
          check_in_message?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      participants: {
        Row: {
          id: string
          event_id: string
          name: string
          email: string
          identifier: string
          qr_token: string
          qr_usage_count: number
          is_revoked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          email: string
          identifier: string
          qr_token?: string
          qr_usage_count?: number
          is_revoked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          email?: string
          identifier?: string
          qr_token?: string
          qr_usage_count?: number
          is_revoked?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          event_id: string
          participant_id: string
          timestamp: string
          ip_address: string
          device_info: string
          processed_by: string
        }
        Insert: {
          id?: string
          event_id: string
          participant_id: string
          timestamp?: string
          ip_address: string
          device_info: string
          processed_by: string
        }
        Update: {
          id?: string
          event_id?: string
          participant_id?: string
          timestamp?: string
          ip_address?: string
          device_info?: string
          processed_by?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          event_id: string
          name: string
          subject: string
          content: string
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          subject: string
          content: string
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          subject?: string
          content?: string
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      blocked_ips: {
        Row: {
          id: string
          ip_address: string
          reason: string
          blocked_at: string
          blocked_by: string
        }
        Insert: {
          id?: string
          ip_address: string
          reason: string
          blocked_at?: string
          blocked_by: string
        }
        Update: {
          id?: string
          ip_address?: string
          reason?: string
          blocked_at?: string
          blocked_by?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "admin" | "staff"
    }
  }
}