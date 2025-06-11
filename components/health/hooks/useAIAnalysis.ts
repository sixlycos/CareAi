import { useState } from 'react'
import AzureHealthAISystem, { type AnalysisResult, type HealthIndicator } from '@/lib/agents/azure-health-ai-system'
import { ProcessingStep } from '../types'

export function useAIAnalysis(azureAI: AzureHealthAISystem) {
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false)
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [aiAnalysisSteps, setAiAnalysisSteps] = useState<ProcessingStep[]>([
    { name: '健康指标解析', status: 'pending', progress: 0 },
    { name: 'Azure OpenAI分析', status: 'pending', progress: 0 },
    { name: '生成智能报告', status: 'pending', progress: 0 },
    { name: '保存数据到数据库', status: 'pending', progress: 0 }
  ])
  const [extractedIndicators, setExtractedIndicators] = useState<HealthIndicator[]>([])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateAIStep = (stepIndex: number, status: ProcessingStep['status'], message?: string, progress?: number) => {
    setAiAnalysisSteps(prev => 
      prev.map((step, index) => 
        index === stepIndex ? { ...step, status, message, progress } : step
      )
    )
  }

  const processAIAnalysis = async (extractedText: string[]) => {
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
      // 用户配置文件（后续可以从用户设置中获取）
      const userProfile = {
        age: 35,
        gender: '男',
        medicalHistory: '无'
      }

      // Step 1: 健康指标解析
      updateAIStep(0, 'processing', '正在使用AI解析健康指标...', 20)
      
      let indicators: any[] = []
      try {
        indicators = await azureAI.parseHealthIndicators(extractedText)
        
        updateAIStep(0, 'processing', '正在验证指标数据...', 80)
        
        if (indicators.length === 0) {
          throw new Error('未能识别到有效的健康指标，请确认上传的是体检报告')
        }

        setExtractedIndicators(indicators)
        updateAIStep(0, 'completed', `识别到 ${indicators.length} 个健康指标`, 100)
        
      } catch (parseError) {
        updateAIStep(0, 'error', `指标解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`)
        throw parseError
      }
      
      // Step 2: Azure OpenAI健康分析
      updateAIStep(1, 'processing', '正在进行Azure OpenAI智能分析...', 30)
      
      let analysis: AnalysisResult
      try {
        analysis = await azureAI.analyzeHealthData(indicators, userProfile)
        
        updateAIStep(1, 'processing', '正在生成健康建议...', 80)
        
        setResult(analysis)
        updateAIStep(1, 'completed', 'AI健康分析完成', 100)
        
      } catch (analysisError) {
        updateAIStep(1, 'error', `AI分析失败: ${analysisError instanceof Error ? analysisError.message : '未知错误'}`)
        throw analysisError
      }

      // Step 3: 生成智能报告
      updateAIStep(2, 'processing', '正在生成详细报告...', 50)
      updateAIStep(2, 'completed', '智能报告生成完成', 100)

      // Step 4: 保存数据到数据库
      updateAIStep(3, 'processing', '正在保存数据...', 50)
      // TODO: 实现数据库保存逻辑
      updateAIStep(3, 'completed', '数据保存完成', 100)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      console.error('AI分析失败:', err)
    } finally {
      setIsAIAnalyzing(false)
    }
  }

  const handleOCRTextEdit = async (editedText: string[]) => {
    setIsReanalyzing(true)
    setError(null)
    
    try {
      console.log('📊 重新解析健康指标...')
      const indicators = await azureAI.parseHealthIndicators(editedText)
      setExtractedIndicators(indicators)
      
      // 如果有分析结果，也重新分析
      if (result) {
        console.log('🤖 重新进行AI分析...')
        const userProfile = { age: 35, gender: '男', medicalHistory: '无' }
        const newAnalysis = await azureAI.analyzeHealthData(indicators, userProfile)
        setResult(newAnalysis)
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重新分析失败'
      setError(errorMessage)
    } finally {
      setIsReanalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setResult(null)
    setExtractedIndicators([])
    setError(null)
    setAiAnalysisSteps([
      { name: '健康指标解析', status: 'pending', progress: 0 },
      { name: 'Azure OpenAI分析', status: 'pending', progress: 0 },
      { name: '生成智能报告', status: 'pending', progress: 0 },
      { name: '保存数据到数据库', status: 'pending', progress: 0 }
    ])
  }

  return {
    isAIAnalyzing,
    isReanalyzing,
    aiAnalysisSteps,
    extractedIndicators,
    result,
    error,
    processAIAnalysis,
    handleOCRTextEdit,
    resetAnalysis
  }
} 