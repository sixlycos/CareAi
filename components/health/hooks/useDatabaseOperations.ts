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
        upload_date: new Date().toISOString(),
        report_type: 'modern'
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
      // 1. 创建医疗数据记录 (新增的medical_data表)
      await healthDB.createMedicalData({
        report_id: reportId,
        user_id: userId,
        numerical_indicators: {
          indicators: analysisResult.indicators || [],
          parsedData: analysisResult.indicators?.map((indicator: any) => ({
            name: indicator.name,
            value: indicator.value,
            unit: indicator.unit,
            normalRange: indicator.normalRange,
            status: indicator.status
          })) || []
        },
        imaging_findings: analysisResult.imagingFindings || {},
        pathology_results: analysisResult.pathologyResults || {},
        tcm_diagnosis: analysisResult.tcmDiagnosis || {},
        clinical_diagnosis: {
          overallStatus: analysisResult.overallStatus,
          risks: analysisResult.risks || []
        },
        examination_info: {
          analysisDate: new Date().toISOString(),
          healthScore: analysisResult.healthScore
        },
        raw_text: JSON.stringify(analysisResult),
        ai_analysis: {
          summary: analysisResult.summary,
          recommendations: analysisResult.recommendations,
          abnormalIndicators: analysisResult.indicators?.filter((i: any) => i.status !== 'normal') || []
        }
      })

      console.log('✅ 医疗数据保存成功')

      // 2. 保存分析结果 (更新的report_analyses表)
      const reportAnalysis = await healthDB.createReportAnalysis({
        report_id: reportId,
        user_id: userId,
        ai_analysis: JSON.stringify(analysisResult),
        structured_data: {
          indicators: analysisResult.indicators || [],
          summary: analysisResult.summary || '',
          healthScore: analysisResult.healthScore || null,
          overallStatus: analysisResult.overallStatus
        },
        key_findings: {
          abnormalIndicators: analysisResult.indicators?.filter((i: any) => i.status !== 'normal') || [],
          riskFactors: analysisResult.risks || [],
          criticalIndicators: analysisResult.indicators?.filter((i: any) => i.status === 'critical') || []
        },
        recommendations: {
          immediate: analysisResult.recommendations?.followUp || [],
          lifestyle: analysisResult.recommendations?.lifestyle || [],
          diet: analysisResult.recommendations?.diet || [],
          exercise: analysisResult.recommendations?.exercise || [],
          longterm: analysisResult.recommendations?.longterm || [],
          followup: analysisResult.recommendations?.followUp || []
        },
        health_score: analysisResult.healthScore || null,
        analysis_date: new Date().toISOString(),
        report_type: 'modern', // 根据实际报告类型设置
        analysis_type: 'comprehensive'
      })

      if (!reportAnalysis) {
        throw new Error('保存分析结果失败')
      }

      console.log('✅ 分析结果保存成功:', reportAnalysis.id)

      // 3. 创建健康提醒 (新增的health_reminders表)
      await createHealthReminders(userId, reportId, analysisResult)

      // 4. 保存健康指标到 health_metrics 表
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
                analysisDate: new Date().toISOString(),
                reportAnalysisId: reportAnalysis.id
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

      // 5. 更新健康报告状态为已完成
      await healthDB.updateHealthReportStatus(reportId, 'completed')

      // 6. 更新用户健康得分和档案
      if (analysisResult.healthScore) {
        await healthDB.updateUserProfile(userId, {
          health_score: analysisResult.healthScore,
          next_checkup: getNextCheckupDate(analysisResult)
        })
      }

      return true

    } catch (error) {
      console.error('❌ 保存分析结果失败:', error)
      setSaveError(error instanceof Error ? error.message : '保存分析结果失败')
      return false
    }
  }

  // 创建健康提醒的辅助函数
  const createHealthReminders = async (userId: string, reportId: string, analysisResult: any) => {
    try {
      const reminders = []

      // 基于异常指标创建提醒
      const abnormalIndicators = analysisResult.indicators?.filter((i: any) => i.status !== 'normal') || []
      
      if (abnormalIndicators.length > 0) {
        // 创建复查提醒
        reminders.push({
          user_id: userId,
          report_id: reportId,
          reminder_type: 'follow_up',
          title: '建议定期复查',
          description: `您有 ${abnormalIndicators.length} 项指标异常，建议 3-6 个月后复查：${abnormalIndicators.map((i: any) => i.name).join('、')}`,
          due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3个月后
          priority: abnormalIndicators.some((i: any) => i.status === 'critical') ? 'high' : 'medium',
          is_completed: false
        })
      }

      // 基于风险因素创建提醒
      if (analysisResult.risks && analysisResult.risks.length > 0) {
        const highRisks = analysisResult.risks.filter((r: any) => r.probability === '高')
        
        if (highRisks.length > 0) {
          reminders.push({
            user_id: userId,
            report_id: reportId,
            reminder_type: 'health_monitoring',
            title: '高风险健康监测',
            description: `检测到高风险因素：${highRisks.map((r: any) => r.type).join('、')}，建议密切关注相关指标`,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1个月后
            priority: 'high',
            is_completed: false
          })
        }
      }

      // 基于建议创建生活方式提醒
      if (analysisResult.recommendations?.lifestyle && analysisResult.recommendations.lifestyle.length > 0) {
        reminders.push({
          user_id: userId,
          report_id: reportId,
          reminder_type: 'lifestyle',
          title: '生活方式改善提醒',
          description: `建议调整生活方式：${analysisResult.recommendations.lifestyle.slice(0, 2).join('、')}等`,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1周后
          priority: 'medium',
          is_completed: false
        })
      }

      // 批量创建提醒
      for (const reminder of reminders) {
        try {
          await healthDB.createHealthReminder(reminder)
          console.log(`✅ 健康提醒创建成功: ${reminder.title}`)
        } catch (reminderError) {
          console.error(`❌ 创建提醒失败: ${reminder.title}`, reminderError)
        }
      }

      console.log(`✅ 成功创建 ${reminders.length} 个健康提醒`)

    } catch (error) {
      console.error('❌ 创建健康提醒失败:', error)
    }
  }

  // 计算下次体检日期的辅助函数
  const getNextCheckupDate = (analysisResult: any): string | null => {
    if (!analysisResult.healthScore) return null

    // 根据健康得分决定下次体检时间
    let monthsLater = 12 // 默认一年后
    
    if (analysisResult.healthScore < 60) {
      monthsLater = 6 // 健康得分较低，6个月后复查
    } else if (analysisResult.healthScore < 80) {
      monthsLater = 9 // 健康得分中等，9个月后复查
    }

    // 如果有严重异常指标，缩短复查时间
    const criticalIndicators = analysisResult.indicators?.filter((i: any) => i.status === 'critical') || []
    if (criticalIndicators.length > 0) {
      monthsLater = 3 // 3个月后复查
    }

    const nextDate = new Date()
    nextDate.setMonth(nextDate.getMonth() + monthsLater)
    return nextDate.toISOString().split('T')[0]
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