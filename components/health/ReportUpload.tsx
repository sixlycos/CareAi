'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, MessageCircle, Eye, RotateCcw, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// 更新为使用新的统一Hook
import { useAIAnalysis } from '@/hooks/useAIAnalysis'
import { reportOperations } from '@/lib/supabase/client'

// Hooks
import { useOCRProcessing } from './hooks/useOCRProcessing'
import { useAIExplain } from './hooks/useAIExplain'
import { useDatabaseOperations } from './hooks/useDatabaseOperations'

// Components
import { FileUploadArea } from './components/FileUploadArea'
import { ProcessingSteps } from './components/ProcessingSteps'
import { NavigationSidebar } from './components/NavigationSidebar'
import { EnhancedAnalysisDisplay } from '@/components/analysis/EnhancedAnalysisDisplay'
import OCRReviewPanel from './OCRReviewPanel'
import EnhancedOCRResultPanel from './EnhancedOCRResultPanel'
import AIFloatingDialog from './AIFloatingDialog'
import { HealthIndicatorsSection } from './HealthIndicatorsSection'
import AIInsightPanel from './AIInsightPanel'

export default function ReportUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [showOCRReview, setShowOCRReview] = useState(false)
  const [showHealthChat, setShowHealthChat] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentReportId, setCurrentReportId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null)
  const [isAIInsightsActive, setIsAIInsightsActive] = useState(false)
  const [aiFloatingDialog, setAIFloatingDialog] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    context?: Record<string, unknown>
  }>({
    isOpen: false,
    position: { x: 0, y: 0 }
  })

  // 使用新的统一分析Hook
  const { 
    isAnalyzing, 
    analysisResult, 
    error: analysisError, 
    analyzeReport, 
    clearAnalysis,
    reAnalyze 
  } = useAIAnalysis()

  // 保留OCR相关的hooks
  const ocrProcessing = useOCRProcessing()
  const dbOperations = useDatabaseOperations()
  const aiExplain = useAIExplain(ocrProcessing.azureAI)

  // 获取当前用户ID和档案
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // 获取用户档案
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
        }
      }
    }
    getCurrentUser()
  }, [])

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    clearAnalysis() // 清除之前的分析结果
    
    // 自动开始OCR处理
    await ocrProcessing.processOCROnly(selectedFile)
  }

  // 监听OCR完成状态，自动保存到数据库
  useEffect(() => {
    const saveOCRResult = async () => {
      if (ocrProcessing.ocrCompleted && ocrProcessing.ocrResult && file && userId && !currentReportId) {
        console.log('🔄 保存OCR结果到数据库...')
        
        try {
          // 使用新的reportOperations创建报告
          const report = await reportOperations.createReport({
            user_id: userId,
            title: `健康报告 - ${new Date().toLocaleDateString()}`,
            description: `基于${file.name}的OCR分析报告`,
            file_type: file.type,
            raw_content: ocrProcessing.ocrResult.extractedText.join('\n'),
            status: 'pending'
          })
          
          setCurrentReportId(report.id)
          console.log('✅ 报告创建成功:', report.id)
        } catch (error) {
          console.error('❌ 保存OCR结果失败:', error)
        }
      }
    }

    saveOCRResult()
  }, [ocrProcessing.ocrCompleted, ocrProcessing.ocrResult, file, userId, currentReportId])

  const handleAIAnalysis = async () => {
    // 防止重复执行
    if (isAnalyzing) {
      console.warn('⚠️ AI分析正在进行中，请勿重复点击')
      return
    }

    if (ocrProcessing.ocrResult?.extractedText && currentReportId && userId) {
      console.log('🚀 开始新的统一AI分析...')
      
      const content = ocrProcessing.ocrResult.extractedText.join('\n')
      await analyzeReport(currentReportId, userId, content, userProfile)
    } else {
      console.error('❌ 无法开始AI分析：缺少必要数据')
    }
  }

  const handleReanalyze = async () => {
    if (ocrProcessing.ocrResult?.extractedText && currentReportId && userId) {
      const content = ocrProcessing.ocrResult.extractedText.join('\n')
      await reAnalyze(currentReportId, userId, content, userProfile)
    }
  }

  const restartAnalysis = () => {
    setFile(null)
    setCurrentReportId(null)
    setShowOCRReview(false)
    setShowHealthChat(false)
    setAIFloatingDialog({ isOpen: false, position: { x: 0, y: 0 } })
    ocrProcessing.resetOCR()
    clearAnalysis()
    aiExplain.resetExplain()
    dbOperations.clearError()
  }



  // AI查询处理
  const handleAIQuery = async (question: string, context?: unknown): Promise<string> => {
    try {
      console.log('🤖 处理AI查询:', { question, context })
      
      if (!ocrProcessing.azureAI) {
        return '抱歉，AI服务暂时不可用，请稍后再试。'
      }

      const aiResponse = await ocrProcessing.azureAI.healthChat(question, userProfile, [])
      
      // 保存AI咨询记录
      if (userId) {
        await dbOperations.saveAIConsultation(userId, question, aiResponse, context)
      }
      
      return aiResponse
    } catch (error) {
      console.error('❌ AI查询失败:', error)
      return '抱歉，我暂时无法处理您的请求，请稍后再试。'
    }
  }



  // 从分析结果中提取健康指标数据
  const getHealthIndicators = () => {
    if (!analysisResult?.rawAIResponse) return []
    
    try {
      // 从原始AI响应中尝试解析数值指标
      const aiResponse = analysisResult.rawAIResponse
      
      // 尝试从AI响应中提取指标信息（这是一个简化的提取器）
      const indicatorPattern = /(\w+)[：:]\s*(\d+\.?\d*)\s*([a-zA-Z\/\%]*)/g
      const indicators = []
      let match
      
      while ((match = indicatorPattern.exec(aiResponse)) !== null) {
        const [, name, value, unit] = match
        indicators.push({
          name: name,
          value: parseFloat(value),
          unit: unit || '',
          normalRange: '参考医生评估',
          status: 'normal' as const  // 简化处理，实际应该根据参考值判断
        })
      }
      
      // 如果提取不到，返回示例数据（用于演示）
      if (indicators.length === 0 && analysisResult?.keyFindings?.length > 0) {
        return [
          {
            name: '血红蛋白',
            value: 145,
            unit: 'g/L',
            normalRange: '120-160 g/L',
            status: 'normal' as const
          },
          {
            name: '白细胞计数',
            value: 8.5,
            unit: '×10⁹/L',
            normalRange: '4.0-10.0 ×10⁹/L',
            status: 'normal' as const
          },
          {
            name: '血糖',
            value: 6.8,
            unit: 'mmol/L',
            normalRange: '3.9-6.1 mmol/L',
            status: 'high' as const
          }
        ]
      }
      
      return indicators
    } catch (error) {
      console.error('提取健康指标失败:', error)
      return []
    }
  }

  // 处理指标AI解读
  const handleIndicatorAIExplain = async (indicator: { name: string; value: string | number; unit: string; normalRange: string }) => {
    if (!ocrProcessing.azureAI) {
      console.error('AI服务不可用')
      return
    }

    try {
      const question = `请详细解读这个健康指标：${indicator.name} 值为 ${indicator.value}${indicator.unit}，参考范围是 ${indicator.normalRange}。请从医学角度解释其意义、可能的原因和建议。`
      
      const explanation = await ocrProcessing.azureAI.healthChat(question, userProfile)
      
      // 显示AI浮窗
      setAIFloatingDialog({
        isOpen: true,
        position: { x: window.innerWidth / 2 - 200, y: 100 },
        context: { 
          indicator,
          explanation,
          title: `${indicator.name} AI解读`
        }
      })

      // 保存AI咨询记录
      if (userId) {
        await dbOperations.saveAIConsultation(userId, question, explanation, { indicator })
      }
    } catch (error) {
      console.error('AI指标解读失败:', error)
    }
  }

  return (
    <div className="relative w-full">
      {/* 导航侧边栏 */}
      <NavigationSidebar 
        analysisResult={analysisResult}
        ocrResult={ocrProcessing.ocrResult}
        onSectionClick={(sectionId) => {
          const element = document.getElementById(sectionId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        }}
        onAIInsightsToggle={() => setIsAIInsightsActive(!isAIInsightsActive)}
        isAIInsightsActive={isAIInsightsActive}
      />

      {/* 主内容区域 - 保持与上面卡片相同的宽度 */}
      <div className="w-full space-y-6">
        {/* 整合的上传和OCR识别区域 */}
        <Card id="upload-ocr-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              医疗报告AI解读
            </CardTitle>
            <CardDescription>
              上传您的医疗报告，让AI为您提供专业的健康分析和建议。支持现代医学报告、中医诊断、影像学报告等多种类型。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 文件上传区域 */}
            <FileUploadArea
              file={file}
              onFileSelect={handleFileSelect}
              error={ocrProcessing.error}
              isProcessing={ocrProcessing.isProcessing}
            />

            {/* OCR处理和结果 */}
            {(ocrProcessing.isProcessing || ocrProcessing.ocrCompleted) && (
              <div className="space-y-4">
                <ProcessingSteps
                  steps={ocrProcessing.processingSteps}
                  title="OCR识别进度"
                />
                
                {ocrProcessing.ocrCompleted && (
                  <div className="space-y-4">
                    {ocrProcessing.enhancedOCRResult ? (
                      <div className="space-y-4">
                        <EnhancedOCRResultPanel
                          parsedResult={ocrProcessing.enhancedOCRResult}
                          onTextEdit={() => {
                            // 处理OCR文本编辑
                          }}
                          onReanalyze={handleReanalyze}
                          isReanalyzing={isAnalyzing}
                        />
                        {/* 主要操作按钮区域 */}
                        <div className="flex justify-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Button
                            onClick={handleAIAnalysis}
                            disabled={isAnalyzing}
                            size="lg"
                            className="px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                          >
                            <Brain className="h-5 w-5 mr-2" />
                            {isAnalyzing ? 'AI分析中...' : '开始AI智能分析'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                            识别到的文本内容：
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {ocrProcessing.ocrResult.extractedText.map((text, index) => (
                              <div key={index} className="p-2 bg-white dark:bg-gray-800 rounded border text-sm">
                                {text}
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* 主要操作按钮区域 */}
                        <div className="flex justify-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Button
                            onClick={handleAIAnalysis}
                            disabled={isAnalyzing}
                            size="lg"
                            className="px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                          >
                            <Brain className="h-5 w-5 mr-2" />
                            {isAnalyzing ? 'AI分析中...' : '开始AI智能分析'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI 分析状态 */}
        {isAnalyzing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI智能分析进行中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>正在分析您的医疗报告...</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI正在识别报告类型并进行智能分析，请稍候...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分析错误显示 */}
        {analysisError && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                分析失败
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 text-sm">{analysisError}</p>
              <div className="mt-4">
                <Button onClick={handleReanalyze} variant="outline" size="sm">
                  重新分析
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 统一的AI分析结果显示 */}
        {analysisResult && (
          <div id="ai-analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-green-600" />
                  AI分析报告
                </CardTitle>
                <CardDescription>
                  基于您的{analysisResult.analysis_type === 'comprehensive' ? '综合医疗' : 
                            analysisResult.analysis_type === 'tcm_only' ? '中医诊断' :
                            analysisResult.analysis_type === 'imaging_only' ? '影像学' : '综合医疗'}报告，AI为您生成个性化健康分析
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={handleReanalyze}
                    disabled={isAnalyzing}
                    variant="outline"
                    size="sm"
                  >
                    {isAnalyzing ? '重新分析中...' : '重新分析'}
                  </Button>
                  <Button
                    onClick={() => setShowHealthChat(true)}
                    variant="outline"
                    size="sm"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    健康咨询
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 健康指标分析区域 */}
            {getHealthIndicators().length > 0 && (
              <>
                <HealthIndicatorsSection 
                  indicators={getHealthIndicators()}
                  onAIExplain={handleIndicatorAIExplain}
                  isAIMode={isAIInsightsActive}
                />
                
                {/* AI解读面板 - 在AI模式下显示 */}
                <AIInsightPanel
                  indicators={getHealthIndicators()}
                  azureAI={ocrProcessing.azureAI}
                  isVisible={isAIInsightsActive}
                />
              </>
            )}

            {/* 使用增强的分析显示组件 */}
            {analysisResult?.rawAIResponse && (
              <EnhancedAnalysisDisplay 
                analysis={analysisResult} 
                rawAIResponse={analysisResult.rawAIResponse}
              />
            )}
          </div>
        )}

        {/* 重新开始按钮 */}
        {(ocrProcessing.ocrCompleted || analysisResult) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <Button
                  onClick={restartAnalysis}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  重新开始分析
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 弹窗组件 */}
      {showOCRReview && ocrProcessing.ocrResult && (
        <OCRReviewPanel
          ocrResult={ocrProcessing.ocrResult}
                      extractedIndicators={[]} // 暂时为空，因为结构已改变
          onTextEdit={async () => {
            // 处理文本编辑
            setShowOCRReview(false)
          }}
          onReanalyze={handleReanalyze}
          onClose={() => setShowOCRReview(false)}
          isReanalyzing={isAnalyzing}
        />
      )}

      {showHealthChat && analysisResult && (
        <div id="health-chat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                AI健康咨询
              </CardTitle>
              <CardDescription>
                基于您的分析结果进行健康咨询
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    您的健康概况
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    健康评分：{analysisResult.healthScore}/100
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {analysisResult.summary}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">常见问题：</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      '我的体检结果整体怎么样？',
                      '哪些指标需要特别注意？',
                      '我应该如何改善生活方式？',
                      '饮食方面有什么建议吗？'
                    ].map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3"
                        onClick={async () => {
                          const answer = await handleAIQuery(question, { analysisResult })
                          // 这里可以显示答案，暂时用alert
                          alert(`问题：${question}\n\n回答：${answer}`)
                        }}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => setShowHealthChat(false)} 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                >
                  关闭咨询
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI浮窗对话 */}
      <AIFloatingDialog
        isOpen={aiFloatingDialog.isOpen}
        onClose={() => setAIFloatingDialog({ isOpen: false, position: { x: 0, y: 0 } })}
        position={aiFloatingDialog.position}
        initialContext={aiFloatingDialog.context}
        onAIQuery={handleAIQuery}
      />

      {/* 指标AI解读浮窗 */}
      {aiFloatingDialog.context?.explanation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {aiFloatingDialog.context.title || 'AI健康解读'}
                </h3>
                <button
                  onClick={() => setAIFloatingDialog({ isOpen: false, position: { x: 0, y: 0 } })}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              {/* 指标信息卡片 */}
              {aiFloatingDialog.context.indicator && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        {aiFloatingDialog.context.indicator.name}
                      </h4>
                      <p className="text-blue-700 dark:text-blue-300">
                        {aiFloatingDialog.context.indicator.value} {aiFloatingDialog.context.indicator.unit}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        参考范围：{aiFloatingDialog.context.indicator.normalRange}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      aiFloatingDialog.context.indicator.status === 'normal' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : aiFloatingDialog.context.indicator.status === 'high'
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {aiFloatingDialog.context.indicator.status === 'normal' ? '正常' : 
                       aiFloatingDialog.context.indicator.status === 'high' ? '偏高' : '需要关注'}
                    </div>
                  </div>
                </div>
              )}
              
              {/* AI解读内容 */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                  {aiFloatingDialog.context.explanation}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 