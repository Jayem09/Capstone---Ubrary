import { supabase, supabaseHelpers } from '../lib/supabase'
import { toast } from 'sonner'

export class UserService {
  // Get all users with optional role filtering
  static async getUsers(role?: string) {
    try {
      const { data, error } = await supabaseHelpers.getUsers(role)
      
      if (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getUsers:', error)
      toast.error('An unexpected error occurred')
      return { data: [], error }
    }
  }

  // Get a single user by ID
  static async getUser(id: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching user:', error)
        toast.error('Failed to load user')
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getUser:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Create a new user
  static async createUser(user: {
    email: string
    firstName: string
    lastName: string
    role: 'student' | 'faculty' | 'librarian' | 'admin'
    program?: string
    department?: string
    studentId?: string
    employeeId?: string
  }) {
    try {
      const { data, error } = await supabaseHelpers.createUser({
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        program: user.program,
        department: user.department,
        student_id: user.studentId,
        employee_id: user.employeeId
      })

      if (error) {
        console.error('Error creating user:', error)
        
        // Handle specific errors
        if (error.code === '23505') { // Unique violation
          toast.error('A user with this email already exists')
        } else {
          toast.error('Failed to create user')
        }
        
        return { data: null, error }
      }

      // Log user creation for audit
      await this.logAuditEvent('user_created', 'user', data?.id, {
        email: user.email,
        role: user.role
      })

      toast.success(`User ${user.firstName} ${user.lastName} created successfully`)
      return { data, error: null }
    } catch (error) {
      console.error('Error in createUser:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Update user information
  static async updateUser(userId: string, updates: {
    firstName?: string
    lastName?: string
    role?: 'student' | 'faculty' | 'librarian' | 'admin'
    program?: string
    department?: string
    isActive?: boolean
  }) {
    try {
      const { data, error } = await supabaseHelpers.updateUser(userId, {
        first_name: updates.firstName,
        last_name: updates.lastName,
        role: updates.role,
        program: updates.program,
        department: updates.department,
        is_active: updates.isActive
      })

      if (error) {
        console.error('Error updating user:', error)
        toast.error('Failed to update user')
        return { data: null, error }
      }

      // Log user update for audit
      await this.logAuditEvent('user_updated', 'user', userId, updates)

      toast.success('User updated successfully')
      return { data, error: null }
    } catch (error) {
      console.error('Error in updateUser:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Toggle user active status
  static async toggleUserStatus(userId: string, isActive: boolean) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error toggling user status:', error)
        toast.error('Failed to update user status')
        return { data: null, error }
      }

      // Log status change for audit
      await this.logAuditEvent('user_status_changed', 'user', userId, {
        is_active: isActive
      })

      const action = isActive ? 'activated' : 'deactivated'
      toast.success(`User ${action} successfully`)
      return { data, error: null }
    } catch (error) {
      console.error('Error in toggleUserStatus:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Delete user (soft delete by deactivating)
  static async deleteUser(userId: string) {
    try {
      // Instead of hard delete, we deactivate the user for audit trail
      const { data, error } = await this.toggleUserStatus(userId, false)

      if (error) {
        return { data: null, error }
      }

      // Log deletion for audit
      await this.logAuditEvent('user_deleted', 'user', userId)

      toast.success('User deleted successfully')
      return { data, error: null }
    } catch (error) {
      console.error('Error in deleteUser:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    }
  }

  // Get user's documents
  static async getUserDocuments(userId: string, includeUnpublished = false) {
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          adviser:users!adviser_id(id, first_name, last_name, email),
          keywords:document_keywords(
            keywords(id, name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!includeUnpublished) {
        query = query.eq('status', 'published')
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching user documents:', error)
        toast.error('Failed to load user documents')
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getUserDocuments:', error)
      toast.error('An unexpected error occurred')
      return { data: [], error }
    }
  }

  // Update user's last login time
  static async updateLastLogin(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating last login:', error)
      }

      // Log login for audit
      await this.logAuditEvent('user_login', 'user', userId)
    } catch (error) {
      console.error('Error in updateLastLogin:', error)
    }
  }

  // Search users by name or email
  static async searchUsers(query: string, role?: string) {
    try {
      let supabaseQuery = supabase
        .from('users')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (role) {
        supabaseQuery = supabaseQuery.eq('role', role)
      }

      const { data, error } = await supabaseQuery

      if (error) {
        console.error('Error searching users:', error)
        toast.error('Search failed')
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in searchUsers:', error)
      toast.error('An unexpected error occurred')
      return { data: [], error }
    }
  }

  // Get user statistics
  static async getUserStats(userId: string) {
    try {
      const [
        { count: totalDocuments },
        { count: publishedDocuments },
        { count: pendingDocuments }
      ] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'published'),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending')
      ])

      // Get total downloads for user's documents
      const { data: downloadData } = await supabase
        .from('documents')
        .select('download_count')
        .eq('user_id', userId)

      const totalDownloads = downloadData?.reduce((sum, doc) => sum + (doc.download_count || 0), 0) || 0

      return {
        totalDocuments: totalDocuments || 0,
        publishedDocuments: publishedDocuments || 0,
        pendingDocuments: pendingDocuments || 0,
        totalDownloads
      }
    } catch (error) {
      console.error('Error in getUserStats:', error)
      return {
        totalDocuments: 0,
        publishedDocuments: 0,
        pendingDocuments: 0,
        totalDownloads: 0
      }
    }
  }

  // Log audit events
  private static async logAuditEvent(
    action: string, 
    resourceType: string, 
    resourceId?: string, 
    details?: Record<string, any>
  ) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        })

      if (error) {
        console.error('Error logging audit event:', error)
      }
    } catch (error) {
      console.error('Error in logAuditEvent:', error)
    }
  }

  // Get client IP (simplified for demo)
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }
}
