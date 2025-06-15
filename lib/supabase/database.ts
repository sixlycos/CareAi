import { createClient } from '@/lib/supabase/server'
import { Database, UserProfile, HealthReport, ReportAnalysis, AIConsultation, HealthMetric, HealthReminder, MedicalData } from './types'

export class HealthDatabase {
  // 用户档案相关操作
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('获取用户档案失败:', error)
      return null
    }
    return data
  }

  async createUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        reports_analyzed: 0,
        consultation_count: 0,
        health_score: null,
        next_checkup: null,
      })
      .select()
      .single()

    if (error) {
      console.error('创建用户档案失败:', error)
      return null
    }
    return data
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) {
      console.error('更新用户档案失败:', error)
      return false
    }
    return true
  }

  // 专门用于保存引导信息的方法
  async saveOnboardingInfo(userId: string, age: number, gender: string, selectedPath: string): Promise<boolean> {
    const supabase = await createClient()
    
    // 确保用户档案存在
    let userProfile = await this.getUserProfile(userId)
    if (!userProfile) {
      userProfile = await this.createUserProfile(userId)
      if (!userProfile) return false
    }

    // 更新年龄、性别和引导偏好
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        age,
        gender,
        preferences: {
          ...userProfile.preferences,
          selectedPath,
          onboardingCompleted: true,
          onboardingDate: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('保存引导信息失败:', error)
      return false
    }
    return true
  }

  // 健康报告相关操作
  async createHealthReport(report: Omit<HealthReport, 'id' | 'created_at' | 'updated_at'>): Promise<HealthReport | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('health_reports')
      .insert({
        ...report,
        report_type: report.report_type || 'modern' // 设置默认值
      })
      .select()
      .single()

    if (error) {
      console.error('创建健康报告失败:', error)
      return null
    }
    return data
  }

  async getUserHealthReports(userId: string): Promise<HealthReport[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('health_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取用户健康报告失败:', error)
      return []
    }
    return data
  }

  async updateHealthReportStatus(reportId: string, status: HealthReport['status']): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('health_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reportId)

    if (error) {
      console.error('更新报告状态失败:', error)
      return false
    }
    return true
  }

  // 报告分析相关操作
  async createReportAnalysis(analysis: Omit<ReportAnalysis, 'id' | 'created_at' | 'updated_at'>): Promise<ReportAnalysis | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('report_analyses')
      .insert({
        ...analysis,
        analysis_type: analysis.analysis_type || 'comprehensive' // 设置默认值
      })
      .select()
      .single()

    if (error) {
      console.error('创建报告分析失败:', error)
      return null
    }
    return data
  }

  async getReportAnalysis(reportId: string): Promise<ReportAnalysis | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('report_analyses')
      .select('*')
      .eq('report_id', reportId)
      .single()

    if (error) {
      console.error('获取报告分析失败:', error)
      return null
    }
    return data
  }

  async getUserReportAnalyses(userId: string): Promise<ReportAnalysis[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('report_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取用户报告分析失败:', error)
      return []
    }
    return data
  }

  // AI咨询相关操作
  async createAIConsultation(consultation: Omit<AIConsultation, 'id' | 'created_at' | 'updated_at'>): Promise<AIConsultation | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ai_consultations')
      .insert(consultation)
      .select()
      .single()

    if (error) {
      console.error('创建AI咨询记录失败:', error)
      return null
    }
    return data
  }

  async getUserConsultations(userId: string, limit: number = 50): Promise<AIConsultation[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ai_consultations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('获取用户咨询记录失败:', error)
      return []
    }
    return data
  }

  // 健康指标相关操作
  async createHealthMetric(metric: Omit<HealthMetric, 'id' | 'created_at' | 'updated_at'>): Promise<HealthMetric | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('health_metrics')
      .insert(metric)
      .select()
      .single()

    if (error) {
      console.error('创建健康指标失败:', error)
      return null
    }
    return data
  }

  async getUserHealthMetrics(userId: string, metricType?: string): Promise<HealthMetric[]> {
    const supabase = await createClient()
    let query = supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('measurement_date', { ascending: false })

    if (metricType) {
      query = query.eq('metric_type', metricType)
    }

    const { data, error } = await query

    if (error) {
      console.error('获取用户健康指标失败:', error)
      return []
    }
    return data
  }

  // 统计数据
  async getUserStats(userId: string): Promise<{
    reportsAnalyzed: number
    consultationCount: number
    healthScore: number | null
    nextCheckup: string | null
  }> {
    const profile = await this.getUserProfile(userId)
    
    if (!profile) {
      return {
        reportsAnalyzed: 0,
        consultationCount: 0,
        healthScore: null,
        nextCheckup: null
      }
    }

    return {
      reportsAnalyzed: profile.reports_analyzed,
      consultationCount: profile.consultation_count,
      healthScore: profile.health_score,
      nextCheckup: profile.next_checkup
    }
  }

  // 增加分析报告计数
  async incrementReportsAnalyzed(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId)
    if (!profile) return false

    return this.updateUserProfile(userId, {
      reports_analyzed: profile.reports_analyzed + 1
    })
  }

  // 增加咨询次数
  async incrementConsultationCount(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId)
    if (!profile) return false

    return this.updateUserProfile(userId, {
      consultation_count: profile.consultation_count + 1
    })
  }

  // 健康提醒相关操作
  async createHealthReminder(reminder: Omit<HealthReminder, 'id' | 'created_at' | 'updated_at'>): Promise<HealthReminder | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('health_reminders')
      .insert(reminder)
      .select()
      .single()

    if (error) {
      console.error('创建健康提醒失败:', error)
      return null
    }
    return data
  }

  async getUserHealthReminders(userId: string): Promise<HealthReminder[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('health_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('获取用户健康提醒失败:', error)
      return []
    }
    return data
  }

  async updateHealthReminderStatus(reminderId: string, isCompleted: boolean): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('health_reminders')
      .update({ 
        is_completed: isCompleted, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', reminderId)

    if (error) {
      console.error('更新健康提醒状态失败:', error)
      return false
    }
    return true
  }

  async getReportReminders(reportId: string): Promise<HealthReminder[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('health_reminders')
      .select('*')
      .eq('report_id', reportId)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('获取报告相关提醒失败:', error)
      return []
    }
    return data
  }

  // 医疗数据相关操作
  async createMedicalData(medicalData: Omit<MedicalData, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalData | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('medical_data')
      .insert(medicalData)
      .select()
      .single()

    if (error) {
      console.error('创建医疗数据失败:', error)
      return null
    }
    return data
  }

  async getMedicalDataByReport(reportId: string): Promise<MedicalData | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('medical_data')
      .select('*')
      .eq('report_id', reportId)
      .single()

    if (error) {
      console.error('获取医疗数据失败:', error)
      return null
    }
    return data
  }

  async getUserMedicalData(userId: string): Promise<MedicalData[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('medical_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取用户医疗数据失败:', error)
      return []
    }
    return data
  }

  async updateMedicalData(reportId: string, updates: Partial<MedicalData>): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('medical_data')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('report_id', reportId)

    if (error) {
      console.error('更新医疗数据失败:', error)
      return false
    }
    return true
  }
} 