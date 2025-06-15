import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HealthDatabase } from '@/lib/supabase/database'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const healthDB = new HealthDatabase()

    // 获取用户基础信息
    const userProfile = await healthDB.getUserProfile(user.id)
    
    // 获取用户的健康报告
    const healthReports = await healthDB.getUserHealthReports(user.id)
    
    // 获取最新的报告分析
    const reportAnalyses = await healthDB.getUserReportAnalyses(user.id)
    
    // 获取健康指标
    const healthMetrics = await healthDB.getUserHealthMetrics(user.id)
    
    // 获取健康提醒
    const healthReminders = await healthDB.getUserHealthReminders(user.id)
    
    // 获取AI咨询记录
    const consultations = await healthDB.getUserConsultations(user.id, 10)
    
    // 获取医疗数据
    const medicalData = await healthDB.getUserMedicalData(user.id)

    // 构建健康摘要
    const healthSummary = {
      user: {
        id: user.id,
        profile: userProfile
      },
      statistics: {
        totalReports: healthReports.length,
        completedReports: healthReports.filter(r => r.status === 'completed').length,
        totalConsultations: consultations.length,
        healthScore: userProfile?.health_score || null,
        nextCheckup: userProfile?.next_checkup || null
      },
      recentActivity: {
        latestReport: healthReports[0] || null,
        latestAnalysis: reportAnalyses[0] || null,
        recentMetrics: healthMetrics.slice(0, 10),
        recentConsultations: consultations.slice(0, 5)
      },
      healthReminders: {
        total: healthReminders.length,
        pending: healthReminders.filter(r => !r.is_completed),
        overdue: healthReminders.filter(r => 
          !r.is_completed && 
          r.due_date && 
          new Date(r.due_date) < new Date()
        ),
        urgent: healthReminders.filter(r => 
          !r.is_completed && 
          r.priority === 'urgent'
        )
      },
      medicalDataSummary: {
        totalRecords: medicalData.length,
        hasNumericalIndicators: medicalData.some(d => d.numerical_indicators && Object.keys(d.numerical_indicators).length > 0),
        hasImagingFindings: medicalData.some(d => d.imaging_findings && Object.keys(d.imaging_findings).length > 0),
        hasTCMDiagnosis: medicalData.some(d => d.tcm_diagnosis && Object.keys(d.tcm_diagnosis).length > 0),
        recentRecord: medicalData[0] || null
      },
      trends: {
        healthScoreTrend: calculateHealthScoreTrend(reportAnalyses),
        metricsTrend: calculateMetricsTrend(healthMetrics),
        consultationTrend: calculateConsultationTrend(consultations)
      }
    }

    return NextResponse.json({
      success: true,
      data: healthSummary
    })

  } catch (error) {
    console.error('获取健康摘要失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取健康摘要失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 计算健康得分趋势
function calculateHealthScoreTrend(analyses: any[]) {
  const scores = analyses
    .filter(a => a.health_score !== null)
    .map(a => ({
      score: a.health_score,
      date: a.analysis_date
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (scores.length < 2) return { trend: 'stable', change: 0 }

  const latest = scores[scores.length - 1]
  const previous = scores[scores.length - 2]
  const change = latest.score - previous.score

  return {
    trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
    change: change,
    latest: latest.score,
    previous: previous.score
  }
}

// 计算健康指标趋势
function calculateMetricsTrend(metrics: any[]) {
  const metricTypes = [...new Set(metrics.map(m => m.metric_type))]
  const trends: Record<string, any> = {}

  metricTypes.forEach(type => {
    const typeMetrics = metrics
      .filter(m => m.metric_type === type)
      .sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime())

    if (typeMetrics.length >= 2) {
      const latest = typeMetrics[typeMetrics.length - 1]
      const previous = typeMetrics[typeMetrics.length - 2]
      
      trends[type] = {
        latest: latest.value,
        previous: previous.value,
        change: latest.value - previous.value,
        unit: latest.unit,
        trend: latest.value > previous.value ? 'up' : latest.value < previous.value ? 'down' : 'stable'
      }
    }
  })

  return trends
}

// 计算咨询趋势
function calculateConsultationTrend(consultations: any[]) {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())

  const thisMonthCount = consultations.filter(c => 
    new Date(c.consultation_date) >= lastMonth
  ).length

  const lastMonthCount = consultations.filter(c => {
    const date = new Date(c.consultation_date)
    return date >= twoMonthsAgo && date < lastMonth
  }).length

  return {
    thisMonth: thisMonthCount,
    lastMonth: lastMonthCount,
    change: thisMonthCount - lastMonthCount,
    trend: thisMonthCount > lastMonthCount ? 'increasing' : 
           thisMonthCount < lastMonthCount ? 'decreasing' : 'stable'
  }
} 