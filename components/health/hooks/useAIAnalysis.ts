import { useState, useCallback } from 'react'
import AzureHealthAISystem from '@/lib/agents/azure-health-ai-system'

interface HealthIndicator {
  name: string
  value: number | string
  unit: string
  normalRange: string
  status: 'normal' | 'high' | 'low' | 'critical'
}

interface AnalysisResult {
  overallStatus: '优秀' | '良好' | '注意' | '建议就医' | '无法评估'
  healthScore: number
  summary: string
  abnormalIndicators: HealthIndicator[]
  recommendations: {
    lifestyle: string[]
    diet: string[]
    exercise: string[]
    followUp: string[]
  }
  risks: Array<{
    type: string
    probability: '低' | '中' | '高'
    description: string
  }>
}

// 中医分析结果接口
interface TCMAnalysisResult {
  overallStatus: '健康' | '亚健康' | '需要调理' | '建议就医' | '无法评估'
  constitution?: string
  summary: string
  keyFindings: {
    symptoms: string[]
    tcmDiagnosis: {
      disease?: string
      syndrome?: string
    }
    constitution?: string
  }
  recommendations: {
    lifestyle: string[]
    diet: string[]
    exercise: string[]
    tcmTreatment: string[]
    followUp: string[]
  }
  risks: Array<{
    type: string
    probability: '低' | '中' | '高'
    description: string
  }>
}

// 统一的分析结果类型
type UnifiedAnalysisResult = {
  type: 'modern'
  data: AnalysisResult
} | {
  type: 'tcm'
  data: TCMAnalysisResult
}

interface AIAnalysisStep {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message: string
  progress: number
}

export function useAIAnalysis(azureAI: AzureHealthAISystem, dbOperations?: any) {
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false)
  const [result, setResult] = useState<UnifiedAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extractedIndicators, setExtractedIndicators] = useState<HealthIndicator[]>([])
  const [editedText, setEditedText] = useState<string[]>([])
  const [reportType, setReportType] = useState<'modern' | 'tcm' | 'mixed'>('modern')

  // AI分析步骤状态
  const [aiAnalysisSteps, setAiAnalysisSteps] = useState<AIAnalysisStep[]>([
    { name: '报告类型识别', status: 'pending', message: '准备识别报告类型...', progress: 0 },
    { name: '数据提取', status: 'pending', message: '准备提取数据...', progress: 0 },
    { name: 'AI智能分析', status: 'pending', message: '准备进行AI分析...', progress: 0 },
    { name: '生成报告', status: 'pending', message: '准备生成报告...', progress: 0 },
    { name: '保存数据', status: 'pending', message: '准备保存数据...', progress: 0 }
  ])

  const updateAIStep = useCallback((stepIndex: number, status: AIAnalysisStep['status'], message: string, progress: number = 0) => {
    setAiAnalysisSteps(prev => 
      prev.map((step, index) => 
        index === stepIndex ? { ...step, status, message, progress } : step
      )
    )
  }, [])

  const resetAnalysis = useCallback(() => {
    setResult(null)
    setError(null)
    setExtractedIndicators([])
    setEditedText([])
    setReportType('modern')
    setAiAnalysisSteps([
      { name: '报告类型识别', status: 'pending', message: '准备识别报告类型...', progress: 0 },
      { name: '数据提取', status: 'pending', message: '准备提取数据...', progress: 0 },
      { name: 'AI智能分析', status: 'pending', message: '准备进行AI分析...', progress: 0 },
      { name: '生成报告', status: 'pending', message: '准备生成报告...', progress: 0 },
      { name: '保存数据', status: 'pending', message: '准备保存数据...', progress: 0 }
    ])
  }, [])

  const getUserProfile = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      return profile
    } catch (error) {
      console.error('获取用户档案失败:', error)
      return null
    }
  }

  const processAIAnalysis = async (extractedText: string[], reportId?: string) => {
    if (!extractedText || extractedText.length === 0) {
      setError('没有OCR数据，请先上传并处理图片')
      return
    }

    setIsAIAnalyzing(true)
    setError(null)
    setResult(null)
    setExtractedIndicators([])

    // 重置AI分析步骤
    setAiAnalysisSteps(steps => steps.map(step => ({ ...step, status: 'pending' as const, progress: 0 })))

    try {
      // 获取真实的用户档案
      console.log('👤 [useAIAnalysis] 获取用户档案...')
      const userProfile = await getUserProfile()
      console.log('👤 [useAIAnalysis] 用户档案获取完成:', userProfile ? '已获取' : '未获取')

      // Step 1: 报告类型识别
      updateAIStep(0, 'processing', '正在识别报告类型...', 20)
      
      const identifiedReportType = await azureAI.identifyReportType(extractedText.join('\n'))
      setReportType(identifiedReportType)
      
      updateAIStep(0, 'completed', `识别为${identifiedReportType === 'modern' ? '现代医学报告' : identifiedReportType === 'tcm' ? '中医报告' : '混合报告'}`, 100)

      // 根据报告类型选择不同的处理流程
      if (identifiedReportType === 'tcm') {
        await processTCMReport(extractedText, userProfile, reportId)
      } else {
        await processModernReport(extractedText, userProfile, reportId)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      console.error('AI分析失败:', err)
    } finally {
      setIsAIAnalyzing(false)
    }
  }

  const processModernReport = async (extractedText: string[], userProfile: any, reportId?: string) => {
    // Step 2: 健康指标解析
    updateAIStep(1, 'processing', '正在解析健康指标...', 20)
    
    let indicators: HealthIndicator[] = []
    try {
      indicators = await azureAI.parseHealthIndicators(extractedText)
      
      if (indicators.length === 0) {
        throw new Error('未能识别到有效的健康指标，请确认上传的是体检报告')
      }

      setExtractedIndicators(indicators)
      updateAIStep(1, 'completed', `识别到 ${indicators.length} 个健康指标`, 100)
      
    } catch (parseError) {
      updateAIStep(1, 'error', `指标解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`)
      throw parseError
    }
    
    // Step 3: Azure OpenAI健康分析
    updateAIStep(2, 'processing', '正在进行Azure OpenAI智能分析...', 30)
    
    let analysis: AnalysisResult
    try {
      analysis = await azureAI.analyzeHealthData(indicators, userProfile)
      
      updateAIStep(2, 'processing', '正在生成健康建议...', 80)
      
      setResult({ type: 'modern', data: analysis })
      updateAIStep(2, 'completed', 'AI健康分析完成', 100)
      
    } catch (analysisError) {
      updateAIStep(2, 'error', `AI分析失败: ${analysisError instanceof Error ? analysisError.message : '未知错误'}`)
      throw analysisError
    }

    // Step 4: 生成智能报告
    updateAIStep(3, 'processing', '正在生成详细报告...', 50)
    updateAIStep(3, 'completed', '智能报告生成完成', 100)

    // Step 5: 保存数据到数据库
    await saveAnalysisToDatabase(reportId, analysis, indicators, userProfile)
  }

  const processTCMReport = async (extractedText: string[], userProfile: any, reportId?: string) => {
    // Step 2: 中医报告解析
    updateAIStep(1, 'processing', '正在解析中医报告...', 20)
    
    let tcmData: any
    try {
      tcmData = await azureAI.parseTCMReport(extractedText)
      updateAIStep(1, 'completed', '中医报告解析完成', 100)
      
    } catch (parseError) {
      updateAIStep(1, 'error', `中医报告解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`)
      throw parseError
    }
    
    // Step 3: 中医分析
    updateAIStep(2, 'processing', '正在进行中医分析...', 30)
    
    let analysis: TCMAnalysisResult
    try {
      analysis = await azureAI.analyzeTCMReport(tcmData, userProfile)
      
      updateAIStep(2, 'processing', '正在生成中医建议...', 80)
      
      setResult({ type: 'tcm', data: analysis })
      updateAIStep(2, 'completed', '中医分析完成', 100)
      
    } catch (analysisError) {
      updateAIStep(2, 'error', `中医分析失败: ${analysisError instanceof Error ? analysisError.message : '未知错误'}`)
      throw analysisError
    }

    // Step 4: 生成中医报告
    updateAIStep(3, 'processing', '正在生成中医报告...', 50)
    updateAIStep(3, 'completed', '中医报告生成完成', 100)

    // Step 5: 保存数据到数据库
    await saveTCMAnalysisToDatabase(reportId, analysis, tcmData, userProfile)
  }

  const saveAnalysisToDatabase = async (reportId: string | undefined, analysis: AnalysisResult, indicators: HealthIndicator[], userProfile: any) => {
    updateAIStep(4, 'processing', '正在保存数据...', 30)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && dbOperations && reportId) {
        updateAIStep(4, 'processing', '正在保存健康指标到数据库...', 60)
        
        // 更新报告类型
        await dbOperations.updateHealthReportType(reportId, 'modern')
        
        // 构建分析结果数据
        const analysisResultWithIndicators = {
          ...analysis,
          indicators: indicators
        }
        
        // 保存分析结果和健康指标
        const saveResult = await dbOperations.saveAnalysisResult(user.id, reportId, analysisResultWithIndicators)
        
        if (saveResult) {
          updateAIStep(4, 'completed', '数据保存完成', 100)
          console.log('✅ [useAIAnalysis] 现代医学报告数据已保存到数据库')
        } else {
          updateAIStep(4, 'error', '数据保存失败')
          console.error('❌ [useAIAnalysis] 保存数据到数据库失败')
        }
      } else {
        updateAIStep(4, 'completed', '跳过数据保存（缺少必要参数）', 100)
        console.log('ℹ️ [useAIAnalysis] 跳过数据保存：用户未登录或缺少数据库操作对象')
      }
    } catch (saveError) {
      updateAIStep(4, 'error', `保存失败: ${saveError instanceof Error ? saveError.message : '未知错误'}`)
      console.error('❌ [useAIAnalysis] 保存数据过程中出错:', saveError)
    }
  }

  const saveTCMAnalysisToDatabase = async (reportId: string | undefined, analysis: TCMAnalysisResult, tcmData: any, userProfile: any) => {
    updateAIStep(4, 'processing', '正在保存中医数据...', 30)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && dbOperations && reportId) {
        updateAIStep(4, 'processing', '正在保存中医报告到数据库...', 60)
        
        // 更新报告类型
        await dbOperations.updateHealthReportType(reportId, 'tcm')
        
        // 保存中医报告数据
        const tcmReportResult = await dbOperations.createTCMReport({
          report_id: reportId,
          user_id: user.id,
          physical_exam: tcmData.physicalExam || {},
          inspection: tcmData.fourDiagnostics?.inspection || {},
          inquiry: tcmData.fourDiagnostics?.inquiry || {},
          palpation: tcmData.fourDiagnostics?.palpation || {},
          auscultation: tcmData.fourDiagnostics?.auscultation || {},
          auxiliary_exam: tcmData.auxiliaryExam || {},
          tcm_diagnosis: tcmData.tcmDiagnosis || {},
          treatment: tcmData.treatment || {},
          notes: tcmData.notes || null,
          visit_date: tcmData.visitDate || null,
          doctor_name: tcmData.doctorName || null
        })
        
        // 保存分析结果
        const analysisResult = await dbOperations.saveAnalysisResult(user.id, reportId, {
          type: 'tcm',
          ...analysis,
          tcmData: tcmData
        })
        
        if (tcmReportResult && analysisResult) {
          updateAIStep(4, 'completed', '中医数据保存完成', 100)
          console.log('✅ [useAIAnalysis] 中医报告数据已保存到数据库')
        } else {
          updateAIStep(4, 'error', '中医数据保存失败')
          console.error('❌ [useAIAnalysis] 保存中医数据到数据库失败')
        }
      } else {
        updateAIStep(4, 'completed', '跳过数据保存（缺少必要参数）', 100)
        console.log('ℹ️ [useAIAnalysis] 跳过数据保存：用户未登录或缺少数据库操作对象')
      }
    } catch (saveError) {
      updateAIStep(4, 'error', `保存失败: ${saveError instanceof Error ? saveError.message : '未知错误'}`)
      console.error('❌ [useAIAnalysis] 保存中医数据过程中出错:', saveError)
    }
  }

  const handleOCRTextEdit = useCallback(async (editedTextArray: string[]) => {
    setEditedText(editedTextArray)
    setError(null)
    
    try {
      updateAIStep(1, 'processing', '正在重新解析...', 50)
      
      const indicators = await azureAI.parseHealthIndicators(editedTextArray)
      setExtractedIndicators(indicators)
      
      updateAIStep(1, 'completed', `重新识别到 ${indicators.length} 个健康指标`, 100)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setError(errorMessage)
      updateAIStep(1, 'error', `重新解析失败: ${errorMessage}`)
    }
  }, [azureAI])

  return {
    isAIAnalyzing,
    result,
    error,
    extractedIndicators,
    editedText,
    reportType,
    aiAnalysisSteps,
    processAIAnalysis,
    handleOCRTextEdit,
    resetAnalysis
  }
} 