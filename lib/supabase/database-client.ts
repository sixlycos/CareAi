import { createClient } from '@/lib/supabase/client'
import { 
  UserProfile, 
  HealthReport, 
  ReportAnalysis, 
  TCMReport,
  AIConsultation, 
  HealthMetric,
  UserProfileInsert,
  HealthReportInsert,
  ReportAnalysisInsert,
  TCMReportInsert,
  AIConsultationInsert,
  HealthMetricInsert
} from './types'

export class HealthDatabaseClient {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  // 用户档案相关操作
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    const { error } = await this.supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) {
      console.error('更新用户档案失败:', error)
      return false
    }
    return true
  }

  // 健康报告相关操作
  async createHealthReport(report: Omit<HealthReportInsert, 'id' | 'created_at' | 'updated_at'>): Promise<HealthReport | null> {
    const { data, error } = await this.supabase
      .from('health_reports')
      .insert({
        ...report,
        report_type: report.report_type || 'modern' // 默认为现代体检报告
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
    const { data, error } = await this.supabase
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
    const { error } = await this.supabase
      .from('health_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reportId)

    if (error) {
      console.error('更新报告状态失败:', error)
      return false
    }
    return true
  }

  async updateHealthReportType(reportId: string, reportType: 'modern' | 'tcm' | 'mixed'): Promise<boolean> {
    const { error } = await this.supabase
      .from('health_reports')
      .update({ 
        report_type: reportType,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (error) {
      console.error('更新报告类型失败:', error)
      return false
    }
    return true
  }

  // 报告分析相关操作
  async createReportAnalysis(analysis: Omit<ReportAnalysis, 'id' | 'created_at' | 'updated_at'>): Promise<ReportAnalysis | null> {
    const { data, error } = await this.supabase
      .from('report_analyses')
      .insert(analysis)
      .select()
      .single()

    if (error) {
      console.error('创建报告分析失败:', error)
      return null
    }
    return data
  }

  async getReportAnalysis(reportId: string): Promise<ReportAnalysis | null> {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    let query = this.supabase
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

  // 中医报告相关操作
  async createTCMReport(tcmReport: Omit<TCMReportInsert, 'id' | 'created_at' | 'updated_at'>): Promise<TCMReport | null> {
    const { data, error } = await this.supabase
      .from('tcm_reports')
      .insert(tcmReport)
      .select()
      .single()

    if (error) {
      console.error('创建中医报告失败:', error)
      return null
    }
    return data
  }

  async getTCMReport(reportId: string): Promise<TCMReport | null> {
    const { data, error } = await this.supabase
      .from('tcm_reports')
      .select('*')
      .eq('report_id', reportId)
      .single()

    if (error) {
      console.error('获取中医报告失败:', error)
      return null
    }
    return data
  }

  async updateTCMReport(reportId: string, updates: Partial<TCMReportInsert>): Promise<boolean> {
    const { error } = await this.supabase
      .from('tcm_reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('report_id', reportId)

    if (error) {
      console.error('更新中医报告失败:', error)
      return false
    }
    return true
  }

  async getUserTCMReports(userId: string): Promise<TCMReport[]> {
    const { data, error } = await this.supabase
      .from('tcm_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取用户中医报告失败:', error)
      return []
    }
    return data
  }
} 