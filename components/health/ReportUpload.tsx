'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, MessageCircle, Eye, Edit3, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Hooks
import { useOCRProcessing } from './hooks/useOCRProcessing'
import { useAIAnalysis } from './hooks/useAIAnalysis'
import { useAIExplain } from './hooks/useAIExplain'
import { useDatabaseOperations } from './hooks/useDatabaseOperations'

// Components
import { FileUploadArea } from './components/FileUploadArea'
import { ProcessingSteps } from './components/ProcessingSteps'
import { NavigationSidebar } from './components/NavigationSidebar'
import OCRReviewPanel from './OCRReviewPanel'
import HealthChatPanel from './HealthChatPanel'
import EnhancedOCRResultPanel from './EnhancedOCRResultPanel'
import HealthIndicatorCard from './HealthIndicatorCard'
import AIFloatingDialog from './AIFloatingDialog'

export default function ReportUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [showOCRDetails, setShowOCRDetails] = useState(false)
  const [showOCRReview, setShowOCRReview] = useState(false)
  const [showHealthChat, setShowHealthChat] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentReportId, setCurrentReportId] = useState<string | null>(null)
  const [aiFloatingDialog, setAIFloatingDialog] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    context?: any
  }>({
    isOpen: false,
    position: { x: 0, y: 0 }
  })

  // 使用自定义hooks
  const ocrProcessing = useOCRProcessing()
  const aiAnalysis = useAIAnalysis(ocrProcessing.azureAI)
  const aiExplain = useAIExplain(ocrProcessing.azureAI)
  const dbOperations = useDatabaseOperations()

  // 获取当前用户ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    // 自动开始OCR处理
    await ocrProcessing.processOCROnly(selectedFile)
  }

  // 监听OCR完成状态，自动保存到数据库
  useEffect(() => {
    const saveOCRResult = async () => {
      if (ocrProcessing.ocrCompleted && ocrProcessing.ocrResult && file && userId && !currentReportId) {
        console.log('🔄 保存OCR结果到数据库...')
        const saveResult = await dbOperations.saveHealthReport(
          userId,
          file,
          ocrProcessing.ocrResult
        )
        
        if (saveResult.success && saveResult.reportId) {
          setCurrentReportId(saveResult.reportId)
          console.log('✅ OCR结果已保存到数据库')
        } else {
          console.error('❌ 保存OCR结果失败:', dbOperations.saveError)
        }
      }
    }

    saveOCRResult()
  }, [ocrProcessing.ocrCompleted, ocrProcessing.ocrResult, file, userId, currentReportId])

  const handleAIAnalysis = () => {
    if (ocrProcessing.ocrResult?.extractedText) {
      aiAnalysis.processAIAnalysis(ocrProcessing.ocrResult.extractedText)
    }
  }

  // 监听AI分析完成状态，自动保存分析结果到数据库
  useEffect(() => {
    const saveAnalysisResult = async () => {
      if (aiAnalysis.result && userId && currentReportId) {
        console.log('🔄 保存AI分析结果到数据库...')
        const success = await dbOperations.saveAnalysisResult(
          userId,
          currentReportId,
          aiAnalysis.result
        )
        
        if (success) {
          console.log('✅ AI分析结果已保存到数据库')
        } else {
          console.error('❌ 保存AI分析结果失败:', dbOperations.saveError)
        }
      }
    }

    saveAnalysisResult()
  }, [aiAnalysis.result, userId, currentReportId])

  const handleReanalyze = () => {
    if (ocrProcessing.ocrResult) {
      aiAnalysis.handleOCRTextEdit(ocrProcessing.ocrResult.extractedText)
    }
  }

  const restartAnalysis = () => {
    setFile(null)
    setCurrentReportId(null)
    setShowOCRDetails(false)
    setShowOCRReview(false)
    setShowHealthChat(false)
    setAIFloatingDialog({ isOpen: false, position: { x: 0, y: 0 } })
    ocrProcessing.resetOCR()
    aiAnalysis.resetAnalysis()
    aiExplain.resetExplain()
    dbOperations.clearError()
  }

  // 处理点击健康指标时显示AI浮窗
  const handleIndicatorClick = (indicator: any, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setAIFloatingDialog({
      isOpen: true,
      position: {
        x: rect.left + rect.width / 2 - 200, // 居中显示
        y: rect.top - 10 // 稍微上移
      },
      context: { indicator }
    })
  }

  // AI查询处理
  const handleAIQuery = async (question: string, context?: any): Promise<string> => {
    try {
      let aiResponse = ''
      
      // 这里可以集成真实的AI API
      if (context?.indicator) {
        aiResponse = `关于${context.indicator.name}指标的分析：

检测值：${context.indicator.value}${context.indicator.unit || ''}
参考范围：${context.indicator.referenceRange || '未知'}

${question.includes('正常') ? '这个指标的数值' + (context.indicator.status === 'normal' ? '在' : '不在') + '正常范围内。' : ''}

建议：
• 定期复查该指标
• 保持健康的生活方式
• 如有疑问请咨询医生

还有其他想了解的吗？`
      } else {
        aiResponse = `您的问题很有价值。基于您的健康报告分析，我建议您关注以下几点：

1. 维持当前的健康状态
2. 定期进行健康检查
3. 保持均衡饮食和适量运动

如需更详细的建议，建议咨询专业医生。`
      }

      // 保存AI咨询记录到数据库
      if (userId) {
        await dbOperations.saveAIConsultation(userId, question, aiResponse, context)
      }
      
      return aiResponse
    } catch (error) {
      return '抱歉，我暂时无法处理您的请求，请稍后再试。'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 获取异常指标
  const getAbnormalIndicators = () => {
    return aiAnalysis.extractedIndicators.filter(indicator => 
      indicator.status !== 'normal'
    )
  }

  // 获取正常指标
  const getNormalIndicators = () => {
    return aiAnalysis.extractedIndicators.filter(indicator => 
      indicator.status === 'normal'
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* 导航侧边栏 */}
      <NavigationSidebar
        result={aiAnalysis.result}
        extractedIndicators={aiAnalysis.extractedIndicators}
        ocrResult={ocrProcessing.ocrResult}
        enhancedOCRResult={ocrProcessing.enhancedOCRResult}
        showHealthChat={showHealthChat}
        aiExplainMode={aiExplain.aiExplainMode}
        selectedIndicator={aiExplain.selectedIndicator}
        indicatorExplanation={aiExplain.indicatorExplanation}
        isExplaining={aiExplain.isExplaining}
        onToggleAiExplainMode={aiExplain.toggleAiExplainMode}
      />

      {/* 主内容区域 */}
      <div className="space-y-6">
        {/* 整合的上传和OCR识别区域 */}
        <Card id="upload-ocr-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              体检报告AI解读
            </CardTitle>
            <CardDescription>
              上传您的体检报告，让AI为您提供专业的健康分析和建议
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
                    {/* 直接显示增强OCR结果面板（包含两种布局模式） */}
                    {ocrProcessing.enhancedOCRResult ? (
                      <div className="space-y-4">
                        <EnhancedOCRResultPanel
                          parsedResult={ocrProcessing.enhancedOCRResult}
                          onTextEdit={aiAnalysis.handleOCRTextEdit}
                          onReanalyze={handleReanalyze}
                          isReanalyzing={aiAnalysis.isReanalyzing}
                        />
                        {/* 主要操作按钮区域 - 放在OCR结果下方 */}
                        <div className="flex justify-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Button
                            onClick={handleAIAnalysis}
                            disabled={aiAnalysis.isAIAnalyzing}
                            size="lg"
                            className="px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                          >
                            <Brain className="h-5 w-5 mr-2" />
                            {aiAnalysis.isAIAnalyzing ? 'AI分析中...' : '开始AI智能分析'}
                          </Button>
                        </div>
                      </div>
                    ) : ocrProcessing.ocrResult && (
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
                             disabled={aiAnalysis.isAIAnalyzing}
                             size="lg"
                             className="px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                           >
                             <Brain className="h-5 w-5 mr-2" />
                             {aiAnalysis.isAIAnalyzing ? 'AI分析中...' : '开始AI智能分析'}
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

        {/* AI 分析步骤 */}
        {(aiAnalysis.isAIAnalyzing || aiAnalysis.result) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI智能分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProcessingSteps
                steps={aiAnalysis.aiAnalysisSteps}
                title="AI分析进度"
              />
            </CardContent>
          </Card>
        )}

        {/* AI 分析结果 */}
        {aiAnalysis.result && (
          <div id="ai-analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-green-600" />
                  AI分析报告
                </CardTitle>
                <CardDescription>
                  基于您的健康指标，AI为您生成个性化健康分析
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    健康评分：
                    <span className={`ml-2 text-2xl ${getHealthScoreColor(aiAnalysis.result.healthScore)}`}>
                      {aiAnalysis.result.healthScore}/100
                    </span>
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200">
                    {aiAnalysis.result.summary}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleReanalyze}
                    disabled={aiAnalysis.isReanalyzing}
                    variant="outline"
                    size="sm"
                  >
                    {aiAnalysis.isReanalyzing ? '重新分析中...' : '重新分析'}
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

            {/* 健康指标卡片 */}
            {aiAnalysis.extractedIndicators.length > 0 && (
              <div id="health-indicators" className="space-y-4">
                {/* 异常指标专门展示区域 */}
                {getAbnormalIndicators().length > 0 && (
                  <Card className="border-orange-200 dark:border-orange-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-5 w-5" />
                        需要关注的异常指标
                      </CardTitle>
                      <CardDescription>
                                            以下指标超出正常范围，建议重点关注
                    {aiExplain.aiExplainMode && (
                      <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-300 dark:border-purple-700">
                        <span className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium text-sm">
                          <Brain className="h-4 w-4" />
                          AI解读模式已开启 - 点击任意卡片获取智能解读
                        </span>
                      </div>
                    )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getAbnormalIndicators().map((indicator, index) => (
                          <div 
                            key={`abnormal-${index}`}
                            onClick={(e) => handleIndicatorClick(indicator, e)}
                            className={`transition-all duration-200 ${
                              aiExplain.aiExplainMode 
                                ? 'cursor-pointer transform hover:scale-105' 
                                : 'cursor-pointer'
                            }`}
                          >
                            <HealthIndicatorCard
                              indicator={indicator}
                              isAIMode={aiExplain.aiExplainMode}
                              onAIExplain={() => {}}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 正常指标 */}
                {getNormalIndicators().length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        正常指标
                      </CardTitle>
                      <CardDescription>
                                            以下指标均在正常范围内
                    {aiExplain.aiExplainMode && (
                      <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-300 dark:border-purple-700">
                        <span className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium text-sm">
                          <Brain className="h-4 w-4" />
                          AI解读模式已开启 - 点击任意卡片获取智能解读
                        </span>
                      </div>
                    )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getNormalIndicators().map((indicator, index) => (
                          <div 
                            key={`normal-${index}`}
                            onClick={(e) => handleIndicatorClick(indicator, e)}
                            className={`transition-all duration-200 ${
                              aiExplain.aiExplainMode 
                                ? 'cursor-pointer transform hover:scale-105' 
                                : 'cursor-pointer'
                            }`}
                          >
                            <HealthIndicatorCard
                              indicator={indicator}
                              isAIMode={aiExplain.aiExplainMode}
                              onAIExplain={() => {}}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 如果没有异常指标，显示所有指标 */}
                {getAbnormalIndicators().length === 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>健康指标详情</CardTitle>
                      <CardDescription>
                                            点击指标卡片查看详细信息
                    {aiExplain.aiExplainMode && (
                      <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-300 dark:border-purple-700">
                        <span className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium text-sm">
                          <Brain className="h-4 w-4" />
                          AI解读模式已开启 - 点击任意卡片获取智能解读
                        </span>
                      </div>
                    )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aiAnalysis.extractedIndicators.map((indicator, index) => (
                          <div 
                            key={`all-${index}`}
                            onClick={(e) => handleIndicatorClick(indicator, e)}
                            className={`transition-all duration-200 ${
                              aiExplain.aiExplainMode 
                                ? 'cursor-pointer transform hover:scale-105' 
                                : 'cursor-pointer'
                            }`}
                          >
                            <HealthIndicatorCard
                              indicator={indicator}
                              isAIMode={aiExplain.aiExplainMode}
                              onAIExplain={() => {}}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* OCR 结果详情 */}
        {showOCRDetails && (ocrProcessing.ocrResult || ocrProcessing.enhancedOCRResult) && (
          <div id="ocr-results">
            {ocrProcessing.enhancedOCRResult ? (
              <EnhancedOCRResultPanel
                parsedResult={ocrProcessing.enhancedOCRResult}
                onTextEdit={aiAnalysis.handleOCRTextEdit}
                onReanalyze={handleReanalyze}
                isReanalyzing={aiAnalysis.isReanalyzing}
              />
            ) : ocrProcessing.ocrResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>OCR识别结果详情</span>
                    <Button
                      onClick={() => setShowOCRDetails(false)}
                      variant="ghost"
                      size="sm"
                    >
                      ×
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      识别准确率: {(ocrProcessing.ocrResult.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="space-y-1">
                      {ocrProcessing.ocrResult.extractedText.map((text, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 重新开始按钮 */}
        {(ocrProcessing.ocrCompleted || aiAnalysis.result) && (
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
          extractedIndicators={aiAnalysis.extractedIndicators}
          onTextEdit={async (editedText) => {
            await aiAnalysis.handleOCRTextEdit(editedText)
            setShowOCRReview(false)
          }}
          onReanalyze={handleReanalyze}
          onClose={() => setShowOCRReview(false)}
          isReanalyzing={aiAnalysis.isReanalyzing}
        />
      )}

      {showHealthChat && aiAnalysis.result && (
        <div id="health-chat">
          <HealthChatPanel
            azureAI={ocrProcessing.azureAI}
            analysisResult={aiAnalysis.result}
            userProfile={{ age: 35, gender: '男', medicalHistory: '无' }}
          />
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
    </div>
  )
} 