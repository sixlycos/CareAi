// 多报告分析器 - 支持批量上传、OCR和智能分析
import { HealthAnalyzer } from './health-analyzer'
import { parseAIAnalysisResult, ParsedAnalysisResult } from './analysis-parser'
import { 
  reportOperations, 
  medicalDataOperations, 
  analysisOperations 
} from '../supabase/client'
import { UnifiedMedicalData } from '../supabase/types'

export interface UploadedReport {
  id: string
  file: File
  fileName: string
  fileType: string
  uploadTime: Date
  status: 'pending' | 'ocr_processing' | 'ocr_completed' | 'analyzing' | 'completed' | 'failed'
  ocrText?: string
  reportType?: 'modern' | 'tcm' | 'imaging' | 'pathology' | 'mixed'
  error?: string
}

export interface BatchAnalysisResult {
  reportId: string
  fileName: string
  status: 'success' | 'failed'
  analysisResult?: ParsedAnalysisResult
  error?: string
  processingTime: number
}

export interface ComprehensiveBatchReport {
  totalReports: number
  successCount: number
  failedCount: number
  overallHealthScore: number
  combinedFindings: string[]
  combinedRecommendations: {
    immediate: string[]
    lifestyle: string[]
    diet: string[]
    exercise: string[]
    tcmTreatment: string[]
    followUp: string[]
  }
  riskFactors: Array<{
    type: string
    probability: string
    description: string
    affectedReports: string[]
  }>
  timeline: Array<{
    date: string
    reportType: string
    keyFindings: string[]
  }>
  individualResults: BatchAnalysisResult[]
}

export class MultiReportAnalyzer {
  private healthAnalyzer: HealthAnalyzer
  private uploadedReports: Map<string, UploadedReport> = new Map()
  private maxConcurrentAnalyses = 3 // 同时处理的最大报告数
  
  constructor() {
    this.healthAnalyzer = new HealthAnalyzer()
  }

  /**
   * 批量上传报告文件
   */
  async uploadReports(files: File[]): Promise<UploadedReport[]> {
    const reports: UploadedReport[] = []
    
    for (const file of files) {
      const reportId = this.generateReportId()
      const report: UploadedReport = {
        id: reportId,
        file,
        fileName: file.name,
        fileType: file.type,
        uploadTime: new Date(),
        status: 'pending'
      }
      
      this.uploadedReports.set(reportId, report)
      reports.push(report)
    }
    
    return reports
  }

  /**
   * 批量OCR处理
   */
  async batchOCRProcessing(reportIds: string[]): Promise<void> {
    const promises = reportIds.map(async (reportId) => {
      const report = this.uploadedReports.get(reportId)
      if (!report) return
      
      try {
        report.status = 'ocr_processing'
        
        // 模拟OCR处理 - 实际项目中需要集成OCR服务
        const ocrText = await this.performOCR(report.file)
        
        report.ocrText = ocrText
        report.status = 'ocr_completed'
        
        // 识别报告类型
        report.reportType = await this.healthAnalyzer.identifyReportType(ocrText)
        
      } catch (error) {
        report.status = 'failed'
        report.error = `OCR处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    })
    
    await Promise.all(promises)
  }

  /**
   * 批量智能分析
   */
  async batchAnalysis(
    reportIds: string[], 
    userId: string, 
    userProfile?: any
  ): Promise<BatchAnalysisResult[]> {
    const results: BatchAnalysisResult[] = []
    
    // 分批处理，避免同时处理过多报告
    for (let i = 0; i < reportIds.length; i += this.maxConcurrentAnalyses) {
      const batch = reportIds.slice(i, i + this.maxConcurrentAnalyses)
      const batchPromises = batch.map(reportId => 
        this.analyzeIndividualReport(reportId, userId, userProfile)
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }

  /**
   * 单个报告分析
   */
  private async analyzeIndividualReport(
    reportId: string, 
    userId: string, 
    userProfile?: any
  ): Promise<BatchAnalysisResult> {
    const startTime = Date.now()
    const report = this.uploadedReports.get(reportId)
    
    if (!report || !report.ocrText) {
      return {
        reportId,
        fileName: report?.fileName || 'Unknown',
        status: 'failed',
        error: '报告未找到或OCR未完成',
        processingTime: Date.now() - startTime
      }
    }
    
    try {
      report.status = 'analyzing'
      
      // 1. 创建报告记录
      const dbReport = await reportOperations.createReport({
        user_id: userId,
        title: report.fileName,
        file_type: report.fileType,
        raw_content: report.ocrText,
        status: 'processing'
      })
      
      // 2. 解析医疗数据
      const medicalData = await this.healthAnalyzer.parseUnifiedMedicalData(
        report.ocrText, 
        report.reportType || 'modern'
      )
      
      // 3. 保存医疗数据
      await medicalDataOperations.createMedicalData({
        report_id: dbReport.id,
        user_id: userId,
        ...medicalData
      })
      
      // 4. AI分析
      const analysisData = await this.healthAnalyzer.analyzeUnifiedReport(
        medicalData, 
        userProfile
      )
      
      // 5. 解析AI响应
      let parsedResult: ParsedAnalysisResult
      if (analysisData.aiResponse) {
        parsedResult = parseAIAnalysisResult(analysisData.aiResponse)
      } else {
        parsedResult = this.createFallbackAnalysis(medicalData)
      }
      
      // 6. 保存分析结果
      await analysisOperations.createAnalysis({
        report_id: dbReport.id,
        user_id: userId,
        ai_analysis: JSON.stringify(analysisData),
        structured_data: medicalData,
        key_findings: analysisData.key_findings || {},
        recommendations: analysisData.recommendations || {},
        health_score: parsedResult.healthScore,
        report_type: report.reportType || 'modern',
        analysis_type: 'comprehensive',
        analysis_date: new Date().toISOString()
      })
      
      // 7. 更新报告状态
      await reportOperations.updateReportStatus(dbReport.id, 'completed')
      report.status = 'completed'
      
      return {
        reportId,
        fileName: report.fileName,
        status: 'success',
        analysisResult: parsedResult,
        processingTime: Date.now() - startTime
      }
      
    } catch (error) {
      report.status = 'failed'
      report.error = error instanceof Error ? error.message : '分析失败'
      
      return {
        reportId,
        fileName: report.fileName,
        status: 'failed',
        error: report.error,
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * 生成综合批量报告
   */
  async generateComprehensiveReport(
    batchResults: BatchAnalysisResult[]
  ): Promise<ComprehensiveBatchReport> {
    const successResults = batchResults.filter(r => r.status === 'success' && r.analysisResult)
    const failedResults = batchResults.filter(r => r.status === 'failed')
    
    // 计算整体健康评分（成功分析报告的平均值）
    const overallHealthScore = successResults.length > 0 
      ? Math.round(successResults.reduce((sum, r) => sum + (r.analysisResult?.healthScore || 0), 0) / successResults.length)
      : 0
    
    // 合并所有关键发现
    const combinedFindings: string[] = []
    successResults.forEach(result => {
      if (result.analysisResult?.keyFindings) {
        combinedFindings.push(...result.analysisResult.keyFindings)
      }
    })
    
    // 合并所有建议
    const combinedRecommendations = {
      immediate: [],
      lifestyle: [],
      diet: [],
      exercise: [],
      tcmTreatment: [],
      followUp: []
    }
    
    successResults.forEach(result => {
      if (result.analysisResult?.recommendations) {
        const rec = result.analysisResult.recommendations
        combinedRecommendations.immediate.push(...(rec.immediate || []))
        combinedRecommendations.lifestyle.push(...(rec.lifestyle || []))
        combinedRecommendations.diet.push(...(rec.diet || []))
        combinedRecommendations.exercise.push(...(rec.exercise || []))
        combinedRecommendations.tcmTreatment.push(...(rec.tcmTreatment || []))
        combinedRecommendations.followUp.push(...(rec.followUp || []))
      }
    })
    
    // 去重建议
    Object.keys(combinedRecommendations).forEach(key => {
      combinedRecommendations[key] = [...new Set(combinedRecommendations[key])]
    })
    
    // 收集风险因素
    const riskFactors: ComprehensiveBatchReport['riskFactors'] = []
    successResults.forEach(result => {
      if (result.analysisResult?.riskFactors) {
        result.analysisResult.riskFactors.forEach(risk => {
          const existingRisk = riskFactors.find(r => r.description === risk.description)
          if (existingRisk) {
            existingRisk.affectedReports.push(result.fileName)
          } else {
            riskFactors.push({
              ...risk,
              affectedReports: [result.fileName]
            })
          }
        })
      }
    })
    
    // 生成时间线（根据文件名中的日期或其他信息）
    const timeline = successResults.map(result => ({
      date: this.extractDateFromFileName(result.fileName) || new Date().toISOString().split('T')[0],
      reportType: this.getReportTypeFromFileName(result.fileName),
      keyFindings: result.analysisResult?.keyFindings?.slice(0, 3) || []
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    return {
      totalReports: batchResults.length,
      successCount: successResults.length,
      failedCount: failedResults.length,
      overallHealthScore,
      combinedFindings: [...new Set(combinedFindings)],
      combinedRecommendations,
      riskFactors,
      timeline,
      individualResults: batchResults
    }
  }

  /**
   * 获取批量分析进度
   */
  getBatchProgress(): {
    total: number
    pending: number
    ocrProcessing: number
    ocrCompleted: number
    analyzing: number
    completed: number
    failed: number
  } {
    const reports = Array.from(this.uploadedReports.values())
    return {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      ocrProcessing: reports.filter(r => r.status === 'ocr_processing').length,
      ocrCompleted: reports.filter(r => r.status === 'ocr_completed').length,
      analyzing: reports.filter(r => r.status === 'analyzing').length,
      completed: reports.filter(r => r.status === 'completed').length,
      failed: reports.filter(r => r.status === 'failed').length
    }
  }

  /**
   * 清除已完成的批次
   */
  clearBatch(): void {
    this.uploadedReports.clear()
  }

  // 私有辅助方法

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async performOCR(file: File): Promise<string> {
    // 这里应该集成实际的OCR服务，如Azure Computer Vision、Google Cloud Vision等
    // 目前返回模拟数据
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`模拟OCR结果 - 文件名: ${file.name}，文件大小: ${file.size} bytes`)
      }, 2000)
    })
  }

  private createFallbackAnalysis(medicalData: UnifiedMedicalData): ParsedAnalysisResult {
    return {
      summary: '医疗报告已解析完成，建议咨询专业医生',
      healthScore: 70,
      keyFindings: ['报告解析完成', '建议专业医生评估'],
      recommendations: {
        immediate: ['咨询专业医生'],
        lifestyle: ['保持健康生活方式'],
        diet: ['均衡饮食'],
        exercise: ['适量运动'],
        followUp: ['定期复查']
      },
      riskFactors: [],
      overallStatus: '需要专业评估'
    }
  }

  private extractDateFromFileName(fileName: string): string | null {
    // 尝试从文件名中提取日期
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{4}\d{2}\d{2})/,
      /(\d{2}-\d{2}-\d{4})/
    ]
    
    for (const pattern of datePatterns) {
      const match = fileName.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    return null
  }

  private getReportTypeFromFileName(fileName: string): string {
    const lowerName = fileName.toLowerCase()
    if (lowerName.includes('ct') || lowerName.includes('mri') || lowerName.includes('x光')) {
      return '影像学'
    }
    if (lowerName.includes('血常规') || lowerName.includes('生化')) {
      return '化验'
    }
    if (lowerName.includes('中医') || lowerName.includes('tcm')) {
      return '中医'
    }
    if (lowerName.includes('病理')) {
      return '病理'
    }
    return '综合'
  }
}

// 导出单例实例
export const multiReportAnalyzer = new MultiReportAnalyzer() 