export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          reports_analyzed: number
          consultation_count: number
          health_score: number | null
          next_checkup: string | null
          preferences: Record<string, any> | null
          created_at: string
          updated_at: string
          // 基础信息
          age: number | null
          gender: string | null
          height: string | null
          weight: string | null
          // 健康背景
          medical_history: string[] | null
          family_history: string[] | null
          medications: string | null
          allergies: string | null
          // 生活习惯
          exercise_frequency: string | null
          smoking_status: string | null
          drinking_status: string | null
          sleep_hours: string | null
          stress_level: string | null
          // 健康目标
          health_goals: string[] | null
          target_weight: string | null
          other_goals: string | null
          // 档案完成状态
          profile_completed: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          reports_analyzed?: number
          consultation_count?: number
          health_score?: number | null
          next_checkup?: string | null
          preferences?: Record<string, any> | null
          created_at?: string
          updated_at?: string
          // 基础信息
          age?: number | null
          gender?: string | null
          height?: string | null
          weight?: string | null
          // 健康背景
          medical_history?: string[] | null
          family_history?: string[] | null
          medications?: string | null
          allergies?: string | null
          // 生活习惯
          exercise_frequency?: string | null
          smoking_status?: string | null
          drinking_status?: string | null
          sleep_hours?: string | null
          stress_level?: string | null
          // 健康目标
          health_goals?: string[] | null
          target_weight?: string | null
          other_goals?: string | null
          // 档案完成状态
          profile_completed?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          reports_analyzed?: number
          consultation_count?: number
          health_score?: number | null
          next_checkup?: string | null
          preferences?: Record<string, any> | null
          updated_at?: string
          // 基础信息
          age?: number | null
          gender?: string | null
          height?: string | null
          weight?: string | null
          // 健康背景
          medical_history?: string[] | null
          family_history?: string[] | null
          medications?: string | null
          allergies?: string | null
          // 生活习惯
          exercise_frequency?: string | null
          smoking_status?: string | null
          drinking_status?: string | null
          sleep_hours?: string | null
          stress_level?: string | null
          // 健康目标
          health_goals?: string[] | null
          target_weight?: string | null
          other_goals?: string | null
          // 档案完成状态
          profile_completed?: boolean | null
        }
      }
      health_reports: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          file_url: string | null
          file_type: string | null
          raw_content: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          upload_date: string
          created_at: string
          updated_at: string
          report_type: 'modern' | 'tcm' | 'imaging' | 'pathology' | 'mixed'
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          file_url?: string | null
          file_type?: string | null
          raw_content?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          upload_date?: string
          created_at?: string
          updated_at?: string
          report_type?: 'modern' | 'tcm' | 'imaging' | 'pathology' | 'mixed'
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          file_url?: string | null
          file_type?: string | null
          raw_content?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          upload_date?: string
          updated_at?: string
          report_type?: 'modern' | 'tcm' | 'imaging' | 'pathology' | 'mixed'
        }
      }
      report_analyses: {
        Row: {
          id: string
          report_id: string
          user_id: string
          ai_analysis: string
          structured_data: Record<string, any> | null
          key_findings: Record<string, any> | null
          recommendations: Record<string, any> | null
          health_score: number | null
          analysis_date: string
          created_at: string
          updated_at: string
          report_type: string | null
          analysis_type: 'comprehensive' | 'indicators_only' | 'tcm_only' | 'imaging_only'
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          ai_analysis: string
          structured_data?: Record<string, any> | null
          key_findings?: Record<string, any> | null
          recommendations?: Record<string, any> | null
          health_score?: number | null
          analysis_date?: string
          created_at?: string
          updated_at?: string
          report_type?: string | null
          analysis_type?: 'comprehensive' | 'indicators_only' | 'tcm_only' | 'imaging_only'
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          ai_analysis?: string
          structured_data?: Record<string, any> | null
          key_findings?: Record<string, any> | null
          recommendations?: Record<string, any> | null
          health_score?: number | null
          analysis_date?: string
          updated_at?: string
          report_type?: string | null
          analysis_type?: 'comprehensive' | 'indicators_only' | 'tcm_only' | 'imaging_only'
        }
      }
      ai_consultations: {
        Row: {
          id: string
          user_id: string
          question: string
          ai_response: string
          conversation_type: 'general' | 'report_based' | 'follow_up'
          context_data: Record<string, any> | null
          consultation_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question: string
          ai_response: string
          conversation_type?: 'general' | 'report_based' | 'follow_up'
          context_data?: Record<string, any> | null
          consultation_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question?: string
          ai_response?: string
          conversation_type?: 'general' | 'report_based' | 'follow_up'
          context_data?: Record<string, any> | null
          consultation_date?: string
          updated_at?: string
        }
      }
      health_metrics: {
        Row: {
          id: string
          user_id: string
          metric_type: string
          value: number
          unit: string
          measurement_date: string
          source: 'report' | 'manual' | 'device'
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          metric_type: string
          value: number
          unit: string
          measurement_date: string
          source?: 'report' | 'manual' | 'device'
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          metric_type?: string
          value?: number
          unit?: string
          measurement_date?: string
          source?: 'report' | 'manual' | 'device'
          metadata?: Record<string, any> | null
          updated_at?: string
        }
      }
      health_reminders: {
        Row: {
          id: string
          user_id: string
          report_id: string | null
          reminder_type: string
          title: string
          description: string | null
          due_date: string | null
          is_completed: boolean
          priority: 'low' | 'medium' | 'high' | 'urgent'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_id?: string | null
          reminder_type: string
          title: string
          description?: string | null
          due_date?: string | null
          is_completed?: boolean
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_id?: string | null
          reminder_type?: string
          title?: string
          description?: string | null
          due_date?: string | null
          is_completed?: boolean
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          updated_at?: string
        }
      }
      medical_data: {
        Row: {
          id: string
          report_id: string
          user_id: string
          numerical_indicators: Record<string, any> | null
          imaging_findings: Record<string, any> | null
          pathology_results: Record<string, any> | null
          tcm_diagnosis: Record<string, any> | null
          clinical_diagnosis: Record<string, any> | null
          examination_info: Record<string, any> | null
          raw_text: string | null
          ai_analysis: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          numerical_indicators?: Record<string, any> | null
          imaging_findings?: Record<string, any> | null
          pathology_results?: Record<string, any> | null
          tcm_diagnosis?: Record<string, any> | null
          clinical_diagnosis?: Record<string, any> | null
          examination_info?: Record<string, any> | null
          raw_text?: string | null
          ai_analysis?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          numerical_indicators?: Record<string, any> | null
          imaging_findings?: Record<string, any> | null
          pathology_results?: Record<string, any> | null
          tcm_diagnosis?: Record<string, any> | null
          clinical_diagnosis?: Record<string, any> | null
          examination_info?: Record<string, any> | null
          raw_text?: string | null
          ai_analysis?: Record<string, any> | null
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
      [_ in never]: never
    }
  }
}

// Type helpers for easier access
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type HealthReport = Database['public']['Tables']['health_reports']['Row']
export type ReportAnalysis = Database['public']['Tables']['report_analyses']['Row']
export type AIConsultation = Database['public']['Tables']['ai_consultations']['Row']
export type HealthMetric = Database['public']['Tables']['health_metrics']['Row']
export type HealthReminder = Database['public']['Tables']['health_reminders']['Row']
export type MedicalData = Database['public']['Tables']['medical_data']['Row']

// Insert types
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type HealthReportInsert = Database['public']['Tables']['health_reports']['Insert']
export type ReportAnalysisInsert = Database['public']['Tables']['report_analyses']['Insert']
export type AIConsultationInsert = Database['public']['Tables']['ai_consultations']['Insert']
export type HealthMetricInsert = Database['public']['Tables']['health_metrics']['Insert']
export type HealthReminderInsert = Database['public']['Tables']['health_reminders']['Insert']
export type MedicalDataInsert = Database['public']['Tables']['medical_data']['Insert'] 