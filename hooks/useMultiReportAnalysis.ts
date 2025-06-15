import { useState, useCallback } from 'react'
import { 
  multiReportAnalyzer, 
  UploadedReport, 
  BatchAnalysisResult, 
  ComprehensiveBatchReport 
} from '../lib/ai/multi-report-analyzer'

export interface MultiReportProgress {
  total: number
  pending: number
  ocrProcessing: number
  ocrCompleted: number
  analyzing: number
  completed: number
  failed: number
  percentage: number
}

export function useMultiReportAnalysis() {
  const [uploadedReports, setUploadedReports] = useState<UploadedReport[]>([])
  const [progress, setProgress] = useState<MultiReportProgress>({
    total: 0,
    pending: 0,
    ocrProcessing: 0,
    ocrCompleted: 0,
    analyzing: 0,
    completed: 0,
    failed: 0,
    percentage: 0
  })
  const [batchResults, setBatchResults] = useState<BatchAnalysisResult[]>([])
  const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveBatchReport | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 上传多个报告文件
   */
  const uploadFiles = useCallback(async (files: File[]) => {
    try {
      setError(null)
      const reports = await multiReportAnalyzer.uploadReports(files)
      setUploadedReports(reports)
      updateProgress()
      return reports
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件上传失败')
      return []
    }
  }, [])

  /**
   * 开始批量处理（OCR + 分析）
   */
  const startBatchProcessing = useCallback(async (
    userId: string, 
    userProfile?: any
  ) => {
    if (uploadedReports.length === 0) {
      setError('没有上传的报告文件')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const reportIds = uploadedReports.map(r => r.id)
      
      // 1. 批量OCR处理
      await multiReportAnalyzer.batchOCRProcessing(reportIds)
      updateProgress()
      
      // 等待一段时间让用户看到OCR进度
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 2. 批量AI分析
      const results = await multiReportAnalyzer.batchAnalysis(
        reportIds, 
        userId, 
        userProfile
      )
      setBatchResults(results)
      updateProgress()
      
      // 3. 生成综合报告
      const comprehensive = await multiReportAnalyzer.generateComprehensiveReport(results)
      setComprehensiveReport(comprehensive)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量处理失败')
    } finally {
      setIsProcessing(false)
    }
  }, [uploadedReports])

  /**
   * 更新进度
   */
  const updateProgress = useCallback(() => {
    const currentProgress = multiReportAnalyzer.getBatchProgress()
    const percentage = currentProgress.total > 0 
      ? Math.round(((currentProgress.completed + currentProgress.failed) / currentProgress.total) * 100)
      : 0
    
    setProgress({
      ...currentProgress,
      percentage
    })
  }, [])

  /**
   * 清除当前批次
   */
  const clearBatch = useCallback(() => {
    multiReportAnalyzer.clearBatch()
    setUploadedReports([])
    setBatchResults([])
    setComprehensiveReport(null)
    setProgress({
      total: 0,
      pending: 0,
      ocrProcessing: 0,
      ocrCompleted: 0,
      analyzing: 0,
      completed: 0,
      failed: 0,
      percentage: 0
    })
    setError(null)
  }, [])

  /**
   * 重试失败的报告
   */
  const retryFailedReports = useCallback(async (
    userId: string, 
    userProfile?: any
  ) => {
    const failedReportIds = uploadedReports
      .filter(r => r.status === 'failed')
      .map(r => r.id)
    
    if (failedReportIds.length === 0) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // 重新处理失败的报告
      await multiReportAnalyzer.batchOCRProcessing(failedReportIds)
      const retryResults = await multiReportAnalyzer.batchAnalysis(
        failedReportIds, 
        userId, 
        userProfile
      )
      
      // 更新结果
      const updatedResults = [...batchResults]
      retryResults.forEach(newResult => {
        const existingIndex = updatedResults.findIndex(r => r.reportId === newResult.reportId)
        if (existingIndex >= 0) {
          updatedResults[existingIndex] = newResult
        } else {
          updatedResults.push(newResult)
        }
      })
      
      setBatchResults(updatedResults)
      
      // 重新生成综合报告
      const comprehensive = await multiReportAnalyzer.generateComprehensiveReport(updatedResults)
      setComprehensiveReport(comprehensive)
      
      updateProgress()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '重试失败')
    } finally {
      setIsProcessing(false)
    }
  }, [uploadedReports, batchResults])

  /**
   * 获取单个报告的详细分析结果
   */
  const getReportAnalysis = useCallback((reportId: string) => {
    return batchResults.find(r => r.reportId === reportId)?.analysisResult
  }, [batchResults])

  /**
   * 获取处理状态摘要
   */
  const getStatusSummary = useCallback(() => {
    const summary = {
      isComplete: progress.percentage === 100,
      hasErrors: progress.failed > 0,
      successRate: progress.total > 0 
        ? Math.round((progress.completed / progress.total) * 100) 
        : 0,
      estimatedTimeRemaining: 0 // 可以根据处理速度计算
    }
    
    // 估算剩余时间（假设每个报告需要30秒）
    const remainingReports = progress.total - progress.completed - progress.failed
    summary.estimatedTimeRemaining = remainingReports * 30
    
    return summary
  }, [progress])

  return {
    // 状态
    uploadedReports,
    progress,
    batchResults,
    comprehensiveReport,
    isProcessing,
    error,
    
    // 操作
    uploadFiles,
    startBatchProcessing,
    retryFailedReports,
    clearBatch,
    
    // 查询
    getReportAnalysis,
    getStatusSummary,
    updateProgress
  }
} 