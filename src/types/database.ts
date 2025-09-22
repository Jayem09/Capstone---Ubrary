export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'student' | 'faculty' | 'librarian' | 'admin'
          program: string | null
          department: string | null
          student_id: string | null
          employee_id: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          role: 'student' | 'faculty' | 'librarian' | 'admin'
          program?: string | null
          department?: string | null
          student_id?: string | null
          employee_id?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'student' | 'faculty' | 'librarian' | 'admin'
          program?: string | null
          department?: string | null
          student_id?: string | null
          employee_id?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          abstract: string
          program: string
          year: number
          status: 'pending' | 'approved' | 'rejected' | 'published'
          user_id: string
          adviser_id: string
          author_names: string | null
          adviser_name: string | null
          pages: number | null
          file_size: string | null
          download_count: number
          view_count: number
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          abstract: string
          program: string
          year: number
          status?: 'pending' | 'approved' | 'rejected' | 'published'
          user_id: string
          adviser_id: string
          author_names?: string | null
          adviser_name?: string | null
          pages?: number | null
          file_size?: string | null
          download_count?: number
          view_count?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          abstract?: string
          program?: string
          year?: number
          status?: 'pending' | 'approved' | 'rejected' | 'published'
          user_id?: string
          adviser_id?: string
          author_names?: string | null
          adviser_name?: string | null
          pages?: number | null
          file_size?: string | null
          download_count?: number
          view_count?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      document_authors: {
        Row: {
          id: string
          document_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          created_at?: string
        }
      }
      keywords: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      document_keywords: {
        Row: {
          id: string
          document_id: string
          keyword_id: string
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          keyword_id: string
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          keyword_id?: string
          created_at?: string
        }
      }
      document_files: {
        Row: {
          id: string
          document_id: string
          file_name: string
          file_path: string
          file_size: string
          file_type: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          file_name: string
          file_path: string
          file_size: string
          file_type: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          file_name?: string
          file_path?: string
          file_size?: string
          file_type?: string
          is_primary?: boolean
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          details: Record<string, any> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          details?: Record<string, any> | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: Record<string, any> | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          expires_at: string
          ip_address: string | null
          user_agent: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          expires_at: string
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          expires_at?: string
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
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
      user_role: 'student' | 'faculty' | 'librarian' | 'admin'
      document_status: 'pending' | 'approved' | 'rejected' | 'published'
    }
  }
}

// Utility types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentAuthor = Database['public']['Tables']['document_authors']['Row']
export type Keyword = Database['public']['Tables']['keywords']['Row']
export type DocumentKeyword = Database['public']['Tables']['document_keywords']['Row']
export type DocumentFile = Database['public']['Tables']['document_files']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type UserSession = Database['public']['Tables']['user_sessions']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentAuthorInsert = Database['public']['Tables']['document_authors']['Insert']
export type KeywordInsert = Database['public']['Tables']['keywords']['Insert']
export type DocumentKeywordInsert = Database['public']['Tables']['document_keywords']['Insert']
export type DocumentFileInsert = Database['public']['Tables']['document_files']['Insert']
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']
export type UserSessionInsert = Database['public']['Tables']['user_sessions']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']
