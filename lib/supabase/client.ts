import { createBrowserClient } from "@supabase/ssr";
import { 
  HealthReportInsert, 
  MedicalDataInsert, 
  MedicalData, 
  ReportAnalysisInsert,
  HealthReminderInsert,
  AIConsultationInsert,
  NumericalIndicator
} from './types';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// 创建全局客户端实例
const supabase = createClient();

// 更新报告相关操作
export const reportOperations = {
  // 创建报告
  async createReport(data: HealthReportInsert) {
    const { data: report, error } = await supabase
      .from('health_reports')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return report
  },

  // 根据ID获取报告
  async getReportById(id: string) {
    const { data: report, error } = await supabase
      .from('health_reports')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return report
  },



  // 获取用户报告列表
  async getUserReports(userId: string) {
    const { data, error } = await supabase
      .from('health_reports')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 获取单个报告详情（包含医疗数据）
  async getReportWithData(reportId: string) {
    const { data, error } = await supabase
      .from('health_reports')
      .select(`
        *,
        medical_data (*),
        report_analyses (*)
      `)
      .eq('id', reportId)
      .single()
    
    if (error) throw error
    return data
  },

  // 更新报告状态
  async updateReportStatus(reportId: string, status: string) {
    const { data, error } = await supabase
      .from('health_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 删除报告
  async deleteReport(reportId: string) {
    const { error } = await supabase
      .from('health_reports')
      .delete()
      .eq('id', reportId)
    
    if (error) throw error
  }
}

// 新增医疗数据操作
export const medicalDataOperations = {
  // 创建医疗数据
  async createMedicalData(data: MedicalDataInsert) {
    const { data: medicalData, error } = await supabase
      .from('medical_data')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return medicalData
  },

  // 保存医疗数据（兼容性函数，支持 UPSERT）
  async saveMedicalData(data: MedicalDataInsert) {
    // 首先尝试更新现有记录
    try {
      const existingData = await this.getMedicalData(data.report_id);
      if (existingData) {
        // 如果记录存在，更新它
        return await this.updateMedicalData(data.report_id, data);
      }
    } catch (error) {
      // 如果没有找到现有记录，继续创建新记录
    }
    
    // 创建新记录
    return this.createMedicalData(data);
  },

  // 获取报告的医疗数据
  async getMedicalData(reportId: string) {
    const { data, error } = await supabase
      .from('medical_data')
      .select('*')
      .eq('report_id', reportId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 表示没有找到记录，这是正常的
      throw error
    }
    return data
  },

  // 更新医疗数据
  async updateMedicalData(reportId: string, updates: Partial<MedicalData>) {
    const { data, error } = await supabase
      .from('medical_data')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('report_id', reportId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 批量创建数值指标
  async createHealthMetrics(reportId: string, userId: string, indicators: NumericalIndicator[]) {
    const metrics = indicators.map(indicator => ({
      user_id: userId,
      metric_type: indicator.name,
      value: typeof indicator.value === 'string' ? parseFloat(indicator.value) || 0 : indicator.value,
      unit: indicator.unit,
      measurement_date: new Date().toISOString(),
      source: 'report' as const,
      metadata: {
        report_id: reportId,
        normal_range: indicator.normalRange,
        status: indicator.status
      }
    }))

    const { data, error } = await supabase
      .from('health_metrics')
      .insert(metrics)
      .select()
    
    if (error) throw error
    return data
  }
}

// 更新分析操作
export const analysisOperations = {
  // 创建分析结果
  async createAnalysis(data: ReportAnalysisInsert) {
    const { data: analysis, error } = await supabase
      .from('report_analyses')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return analysis
  },

  // 保存分析结果（兼容性函数，支持 UPSERT）
  async saveAnalysis(data: ReportAnalysisInsert) {
    // 首先尝试获取现有分析
    try {
      const existingAnalysis = await this.getReportAnalysis(data.report_id);
      if (existingAnalysis) {
        // 如果分析存在，更新它
        const { data: updatedAnalysis, error } = await supabase
          .from('report_analyses')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('report_id', data.report_id)
          .select()
          .single()
        
        if (error) throw error
        return updatedAnalysis
      }
    } catch (error) {
      // 如果没有找到现有分析，继续创建新分析
    }
    
    // 创建新分析
    return this.createAnalysis(data);
  },

  // 获取报告分析
  async getReportAnalysis(reportId: string) {
    const { data, error } = await supabase
      .from('report_analyses')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 表示没有找到记录，这是正常的
      throw error
    }
    return data
  },

  // 获取用户所有分析历史
  async getUserAnalyses(userId: string) {
    const { data, error } = await supabase
      .from('report_analyses')
      .select(`
        *,
        health_reports (title, upload_date)
      `)
      .eq('user_id', userId)
      .order('analysis_date', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

// 新增健康提醒操作
export const reminderOperations = {
  // 创建提醒
  async createReminder(data: HealthReminderInsert) {
    const { data: reminder, error } = await supabase
      .from('health_reminders')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return reminder
  },

  // 获取用户提醒
  async getUserReminders(userId: string) {
    const { data, error } = await supabase
      .from('health_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .order('due_date', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // 完成提醒
  async completeReminder(reminderId: string) {
    const { data, error } = await supabase
      .from('health_reminders')
      .update({ 
        is_completed: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', reminderId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// 更新咨询操作以支持中医咨询
export const consultationOperations = {
  // 创建AI咨询
  async createConsultation(data: AIConsultationInsert) {
    const { data: consultation, error } = await supabase
      .from('ai_consultations')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return consultation
  },

  // 获取用户咨询历史
  async getUserConsultations(userId: string, type?: string) {
    let query = supabase
      .from('ai_consultations')
      .select('*')
      .eq('user_id', userId)
      .order('consultation_date', { ascending: false })
    
    if (type) {
      query = query.eq('conversation_type', type)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  // 获取基于报告的咨询上下文
  async getReportBasedContext(userId: string, reportId?: string) {
    let query = supabase
      .from('health_reports')
      .select(`
        *,
        medical_data (*),
        report_analyses (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('upload_date', { ascending: false })
    
    if (reportId) {
      query = query.eq('id', reportId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }
}
