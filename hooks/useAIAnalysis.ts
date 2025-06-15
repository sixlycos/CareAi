import { useState, useCallback } from 'react'
import { HealthAnalyzer } from '../lib/ai/health-analyzer'
import { 
  reportOperations, 
  medicalDataOperations, 
  analysisOperations 
} from '../lib/supabase/client'
import { UnifiedMedicalData } from '../lib/supabase/types'
import { parseAIAnalysisResult, ParsedAnalysisResult } from '../lib/ai/analysis-parser'

export interface UnifiedAnalysisResult extends ParsedAnalysisResult {
  analysis_type: 'comprehensive' | 'indicators_only' | 'tcm_only' | 'imaging_only'
  rawAIResponse?: string // 原始AI响应
}

export function useAIAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<UnifiedAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeReport = useCallback(async (
    reportId: string, 
    userId: string, 
    content: string,
    userProfile?: any
  ) => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const analyzer = new HealthAnalyzer()
      
      // 1. 识别报告类型
      const reportType = await analyzer.identifyReportType(content)
      
      // 2. 解析统一医疗数据
      const medicalData = await analyzer.parseUnifiedMedicalData(content, reportType)
      
      // 3. 保存到数据库
      await medicalDataOperations.createMedicalData({
        report_id: reportId,
        user_id: userId,
        ...medicalData
      })
      
      // 4. 更新报告状态和类型
      await reportOperations.updateReportStatus(reportId, 'processing')
      
      // 5. 进行AI分析
      const analysisData = await analyzer.analyzeUnifiedReport(medicalData, userProfile)
      
      // 6. 处理数值指标
      if (medicalData.numerical_indicators?.length) {
        await medicalDataOperations.createHealthMetrics(
          reportId, 
          userId, 
          medicalData.numerical_indicators
        )
      }
      
      // 7. 保存分析结果
      const analysis = await analysisOperations.createAnalysis({
        report_id: reportId,
        user_id: userId,
        ai_analysis: JSON.stringify(analysisData),
        structured_data: medicalData,
        key_findings: analysisData.key_findings || {},
        recommendations: analysisData.recommendations || {},
        health_score: analysisData.health_score || 70,
        report_type: reportType,
        analysis_type: 'comprehensive',
        analysis_date: new Date().toISOString()
      })
      
      // 8. 更新报告状态
      await reportOperations.updateReportStatus(reportId, 'completed')
      
      // 9. 处理AI响应并解析
      let parsedResult: ParsedAnalysisResult
      let parseError = null
      
      if (analysisData.aiResponse) {
        try {
          console.log('🔍 开始解析AI响应...')
          console.log('📊 原始AI响应长度:', analysisData.aiResponse.length)
          console.log('📝 原始AI响应预览:', analysisData.aiResponse.slice(0, 200) + '...')
          
          // 解析AI的JSON响应
          parsedResult = parseAIAnalysisResult(analysisData.aiResponse)
          console.log('✅ AI响应解析成功!')
          
        } catch (err) {
          console.error('❌ AI响应解析失败:', err)
          parseError = err
          
          // 尝试从数值指标构建备用分析结果
          parsedResult = {
            summary: `基于${medicalData.numerical_indicators?.length || 0}项指标的健康分析`,
            healthScore: 70,
            keyFindings: medicalData.numerical_indicators?.filter(i => i.status !== 'normal')
              .map(i => `${i.name}: ${i.value}${i.unit} (${i.status === 'high' ? '偏高' : i.status === 'low' ? '偏低' : i.status})`) || [],
            recommendations: {
              immediate: ['请咨询专业医生获取详细诊断'],
              lifestyle: ['保持健康的生活方式'],
              diet: ['均衡饮食'],
              exercise: ['适量运动'],
              followUp: ['定期复查']
            },
            riskFactors: medicalData.numerical_indicators?.filter(i => i.status !== 'normal')
              .map(i => ({
                type: i.status === 'high' ? '指标偏高' : i.status === 'low' ? '指标偏低' : '异常指标',
                probability: i.status === 'critical' ? '高' : '中',
                description: `${i.name}: ${i.value}${i.unit} (参考范围: ${i.normalRange || '未知'})`
              })) || [],
            overallStatus: '需要关注'
          }
        }
      } else {
        // 使用默认解析
        parsedResult = {
          summary: analysisData.summary || '分析完成',
          healthScore: analysisData.health_score || 70,
          keyFindings: [
            medicalData.tcm_diagnosis?.syndrome || '',
            medicalData.tcm_diagnosis?.inspection || '',
            medicalData.tcm_diagnosis?.palpation || ''
          ].filter(Boolean),
          recommendations: {
            immediate: analysisData.recommendations?.immediate || [],
            lifestyle: analysisData.recommendations?.lifestyle || [],
            diet: analysisData.recommendations?.diet || [],
            exercise: analysisData.recommendations?.exercise || [],
            followUp: analysisData.recommendations?.followUp || []
          },
          riskFactors: analysisData.risk_factors || [],
          overallStatus: '一般'
        }
      }

      // 10. 格式化返回结果
      const result: UnifiedAnalysisResult = {
        ...parsedResult,
        analysis_type: 'comprehensive',
        rawAIResponse: analysisData.aiResponse
      }
      
      // 如果解析出错但有指标数据，仍然显示结果但添加错误信息
      if (parseError && medicalData.numerical_indicators?.length) {
        console.log('⚠️ 使用基于指标的备用分析结果')
        result.summary = `${result.summary} (AI分析解析出错，显示基于${medicalData.numerical_indicators.length}项指标的备用分析)`
      }
      
      setAnalysisResult(result)
      
    } catch (err) {
      console.error('❌ 分析失败详情:', err)
      console.error('🔍 错误类型:', typeof err)
      console.error('🔍 错误对象:', err)
      
      let errorMessage = '分析过程中发生错误'
      
      if (err instanceof Error) {
        errorMessage = err.message
        console.error('🔍 错误消息:', err.message)
        console.error('🔍 错误堆栈:', err.stack)
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err)
        console.error('🔍 错误对象JSON:', JSON.stringify(err, null, 2))
      }
      
      setError(errorMessage)
      
      // 更新报告状态为失败
      try {
        await reportOperations.updateReportStatus(reportId, 'failed')
      } catch (updateError) {
        console.error('❌ 更新报告状态失败:', updateError)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null)
    setError(null)
  }, [])

  const reAnalyze = useCallback(async (
    reportId: string,
    userId: string,
    content: string,
    userProfile?: any
  ) => {
    await analyzeReport(reportId, userId, content, userProfile)
  }, [analyzeReport])

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeReport,
    clearAnalysis,
    reAnalyze
  }
} 