'use client'

import { useState } from 'react'
import { HealthDatabaseClient } from '@/lib/supabase/database-client'
import { HealthStorageService } from '@/lib/supabase/storage'

export function useDatabaseOperations() {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [healthDB] = useState(() => new HealthDatabaseClient())
  const [storageService] = useState(() => new HealthStorageService())

  const saveHealthReport = async (
    userId: string,
    file: File,
    ocrResult: any,
    analysisResult?: any
  ): Promise<{ reportId?: string; success: boolean }> => {
    setIsSaving(true)
    setSaveError(null)

    try {
      // 1. 生成报告ID
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 2. 上传文件到存储
      const fileUploadResult = await storageService.uploadReportFile(file, userId, reportId)
      
      if (!fileUploadResult.success) {
        throw new Error(`文件上传失败: ${fileUploadResult.error}`)
      }

      // 3. 创建健康报告记录
      const healthReport = await healthDB.createHealthReport({
        user_id: userId,
        title: `健康报告 - ${new Date().toLocaleDateString()}`,
        description: `基于${file.name}的OCR分析报告`,
        file_url: fileUploadResult.fileUrl,
        file_type: file.type,
        raw_content: JSON.stringify({
          ocrResult,
          fileName: file.name,
          fileSize: file.size,
          uploadTime: new Date().toISOString()
        }),
        status: analysisResult ? 'completed' : 'processing',
        upload_date: new Date().toISOString()
      })

      if (!healthReport) {
        throw new Error('创建健康报告记录失败')
      }

      console.log('✅ 健康报告保存成功:', healthReport.id)

      // 4. 如果有分析结果，保存分析数据
      if (analysisResult) {
        await saveAnalysisResult(userId, healthReport.id, analysisResult)
      }

      // 5. 更新用户统计
      await healthDB.incrementReportsAnalyzed(userId)

      return { reportId: healthReport.id, success: true }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存健康报告失败'
      setSaveError(errorMessage)
      console.error('❌ 保存健康报告失败:', error)
      return { success: false }
    } finally {
      setIsSaving(false)
    }
  }

  const saveAnalysisResult = async (
    userId: string,
    reportId: string,
    analysisResult: any
  ): Promise<boolean> => {
    try {
      // 保存分析结果
      const reportAnalysis = await healthDB.createReportAnalysis({
        report_id: reportId,
        user_id: userId,
        ai_analysis: JSON.stringify(analysisResult),
        structured_data: {
          indicators: analysisResult.indicators || [],
          summary: analysisResult.summary || '',
          healthScore: analysisResult.healthScore || null
        },
        key_findings: {
          abnormalIndicators: analysisResult.indicators?.filter((i: any) => i.status !== 'normal') || [],
          riskFactors: analysisResult.riskFactors || []
        },
        recommendations: {
          immediate: analysisResult.recommendations?.immediate || [],
          longterm: analysisResult.recommendations?.longterm || [],
          followup: analysisResult.recommendations?.followup || []
        },
        health_score: analysisResult.healthScore || null,
        analysis_date: new Date().toISOString()
      })

      if (!reportAnalysis) {
        throw new Error('保存分析结果失败')
      }

      console.log('✅ 分析结果保存成功:', reportAnalysis.id)

      // 【关键修复】保存健康指标到 health_metrics 表
      if (analysisResult.indicators && Array.isArray(analysisResult.indicators)) {
        console.log('💾 开始保存健康指标到 health_metrics 表...')
        let savedCount = 0
        
        for (const indicator of analysisResult.indicators) {
          try {
            // 解析数值 - 确保是数字类型
            let numericValue: number
            if (typeof indicator.value === 'string') {
              // 移除可能的非数字字符，只保留数字和小数点
              const cleanValue = indicator.value.replace(/[^\d.-]/g, '')
              numericValue = parseFloat(cleanValue)
            } else {
              numericValue = Number(indicator.value)
            }

            // 如果无法解析为有效数字，跳过这个指标
            if (isNaN(numericValue)) {
              console.warn(`⚠️ 指标 ${indicator.name} 的值 "${indicator.value}" 无法解析为数字，跳过保存`)
              continue
            }

            await healthDB.createHealthMetric({
              user_id: userId,
              metric_type: indicator.name,
              value: numericValue,
              unit: indicator.unit || '',
              measurement_date: new Date().toISOString().split('T')[0], // 今天的日期
              source: 'report',
              metadata: {
                reportId: reportId,
                normalRange: indicator.normalRange,
                status: indicator.status,
                analysisDate: new Date().toISOString()
              }
            })
            
            savedCount++
            console.log(`✅ 指标 ${indicator.name} 保存成功`)
            
          } catch (metricError) {
            console.error(`❌ 保存指标 ${indicator.name} 失败:`, metricError)
            // 继续保存其他指标，不中断整个过程
          }
        }
        
        console.log(`✅ 成功保存 ${savedCount}/${analysisResult.indicators.length} 个健康指标到 health_metrics 表`)
      }

      // 更新健康报告状态为已完成
      await healthDB.updateHealthReportStatus(reportId, 'completed')

      // 更新用户健康得分
      if (analysisResult.healthScore) {
        await healthDB.updateUserProfile(userId, {
          health_score: analysisResult.healthScore
        })
      }

      return true

    } catch (error) {
      console.error('❌ 保存分析结果失败:', error)
      setSaveError(error instanceof Error ? error.message : '保存分析结果失败')
      return false
    }
  }

  const saveAIConsultation = async (
    userId: string,
    question: string,
    aiResponse: string,
    context?: any
  ): Promise<boolean> => {
    try {
      const consultation = await healthDB.createAIConsultation({
        user_id: userId,
        question,
        ai_response: aiResponse,
        conversation_type: context?.indicator ? 'report_based' : 'general',
        context_data: context || {},
        consultation_date: new Date().toISOString()
      })

      if (!consultation) {
        throw new Error('保存AI咨询记录失败')
      }

      // 更新咨询次数
      await healthDB.incrementConsultationCount(userId)

      console.log('✅ AI咨询记录保存成功:', consultation.id)
      return true

    } catch (error) {
      console.error('❌ 保存AI咨询记录失败:', error)
      return false
    }
  }

  return {
    isSaving,
    saveError,
    saveHealthReport,
    saveAnalysisResult,
    saveAIConsultation,
    clearError: () => setSaveError(null)
  }
} 