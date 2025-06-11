'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, MessageCircle, Eye, Edit3, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react'

// Hooks
import { useOCRProcessing } from './hooks/useOCRProcessing'
import { useAIAnalysis } from './hooks/useAIAnalysis'
import { useAIExplain } from './hooks/useAIExplain'

// Components
import { FileUploadArea } from './components/FileUploadArea'
import { ProcessingSteps } from './components/ProcessingSteps'
import { NavigationSidebar } from './components/NavigationSidebar'
import OCRReviewPanel from './OCRReviewPanel'
import HealthChatPanel from './HealthChatPanel'
import EnhancedOCRResultPanel from './EnhancedOCRResultPanel'
import HealthIndicatorCard from './HealthIndicatorCard'

export default function ReportUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [showOCRDetails, setShowOCRDetails] = useState(false)
  const [showOCRReview, setShowOCRReview] = useState(false)
  const [showHealthChat, setShowHealthChat] = useState(false)

  // 使用自定义hooks
  const ocrProcessing = useOCRProcessing()
  const aiAnalysis = useAIAnalysis(ocrProcessing.azureAI)
  const aiExplain = useAIExplain(ocrProcessing.azureAI)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    // 自动开始OCR处理
    ocrProcessing.processOCROnly(selectedFile)
  }

  const handleAIAnalysis = () => {
    if (ocrProcessing.ocrResult?.extractedText) {
      aiAnalysis.processAIAnalysis(ocrProcessing.ocrResult.extractedText)
    }
  }

  const handleReanalyze = () => {
    if (ocrProcessing.ocrResult) {
      aiAnalysis.handleOCRTextEdit(ocrProcessing.ocrResult.extractedText)
    }
  }

  const restartAnalysis = () => {
    setFile(null)
    setShowOCRDetails(false)
    setShowOCRReview(false)
    setShowHealthChat(false)
    ocrProcessing.resetOCR()
    aiAnalysis.resetAnalysis()
    aiExplain.resetExplain()
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
                      <span className="ml-2 text-purple-600">
                        (AI解读模式已开启)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getAbnormalIndicators().map((indicator, index) => (
                      <HealthIndicatorCard
                        key={`abnormal-${index}`}
                        indicator={indicator}
                        isAIMode={aiExplain.aiExplainMode}
                        onAIExplain={(indicator) => {
                          if (aiExplain.aiExplainMode) {
                            aiExplain.handleIndicatorExplain(indicator)
                          }
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 健康指标卡片 */}
        {aiAnalysis.extractedIndicators.length > 0 && (
          <div id="health-indicators" className="space-y-4">
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
                      <span className="ml-2 text-purple-600">
                        (AI解读模式已开启)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getNormalIndicators().map((indicator, index) => (
                      <HealthIndicatorCard
                        key={`normal-${index}`}
                        indicator={indicator}
                        isAIMode={aiExplain.aiExplainMode}
                        onAIExplain={(indicator) => {
                          if (aiExplain.aiExplainMode) {
                            aiExplain.handleIndicatorExplain(indicator)
                          }
                        }}
                      />
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
                      <span className="ml-2 text-purple-600">
                        (AI解读模式已开启)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiAnalysis.extractedIndicators.map((indicator, index) => (
                      <HealthIndicatorCard
                        key={`all-${index}`}
                        indicator={indicator}
                        isAIMode={aiExplain.aiExplainMode}
                        onAIExplain={(indicator) => {
                          if (aiExplain.aiExplainMode) {
                            aiExplain.handleIndicatorExplain(indicator)
                          }
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
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
    </div>
  )
} 