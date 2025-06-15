import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeHealthReport } from '@/lib/ai/health-analyzer'
import { medicalDataOperations, analysisOperations, reportOperations } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 验证用户身份
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { reportId, reportContent } = await request.json()

    if (!reportId || !reportContent) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 获取报告信息
    const report = await reportOperations.getReportById(reportId)
    if (!report || report.user_id !== user.id) {
      return NextResponse.json(
        { error: '报告不存在或无权限访问' },
        { status: 404 }
      )
    }

    // AI分析报告
    const analysisResult = await analyzeHealthReport(reportContent)

    // 保存医疗数据
    const medicalData = await medicalDataOperations.saveMedicalData({
      report_id: reportId,
      user_id: user.id,
      raw_text: reportContent,
      ai_analysis: analysisResult.medicalData
    })

    // 保存分析结果
    const analysisRecord = await analysisOperations.saveAnalysis({
      report_id: reportId,
      user_id: user.id,
      ai_analysis: JSON.stringify(analysisResult),
      structured_data: analysisResult.medicalData,
      key_findings: analysisResult.keyFindings,
      recommendations: analysisResult.recommendations,
      health_score: analysisResult.overallHealthScore,
      report_type: analysisResult.reportType,
      analysis_type: 'comprehensive',
      analysis_date: new Date().toISOString()
    })

    // 更新报告状态
    await reportOperations.updateReportStatus(reportId, 'analyzed')

    return NextResponse.json({
      success: true,
      analysis: analysisRecord,
      medicalData,
      message: '报告分析完成'
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '分析失败' },
      { status: 500 }
    )
  }
} 