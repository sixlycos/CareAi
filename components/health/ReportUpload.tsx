'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Brain, CheckCircle, AlertCircle, Eye, MessageCircle, Edit3, X } from 'lucide-react'
import AzureHealthAISystem, { type AnalysisResult, type HealthIndicator } from '@/lib/agents/azure-health-ai-system'
import OCRReviewPanel from './OCRReviewPanel'
import HealthChatPanel from './HealthChatPanel'
import EnhancedOCRResultPanel from './EnhancedOCRResultPanel'
import { ParsedOCRResult } from '@/lib/utils/azure-ocr-parser'

interface ProcessingStep {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message?: string
  progress?: number
}

interface OCRResult {
  extractedText: string[]
  confidence: number
  totalSegments: number
}

export default function ReportUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { name: 'Azure OCR文本提取', status: 'pending', progress: 0 }
  ])
  const [aiAnalysisSteps, setAiAnalysisSteps] = useState<ProcessingStep[]>([
    { name: '健康指标解析', status: 'pending', progress: 0 },
    { name: 'Azure OpenAI分析', status: 'pending', progress: 0 },
    { name: '生成智能报告', status: 'pending', progress: 0 }
  ])
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [enhancedOCRResult, setEnhancedOCRResult] = useState<ParsedOCRResult | null>(null)
  const [extractedIndicators, setExtractedIndicators] = useState<HealthIndicator[]>([])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showOCRDetails, setShowOCRDetails] = useState(false)
  const [showOCRReview, setShowOCRReview] = useState(false)
  const [showHealthChat, setShowHealthChat] = useState(false)
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false)
  const [ocrCompleted, setOcrCompleted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 初始化Azure AI系统
  const azureAI = new AzureHealthAISystem({
    azureOpenAIEndpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '',
    azureOpenAIKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY || '',
    azureOpenAIVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_VERSION || '2024-02-15-preview',
    azureOpenAIDeployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || '',
    azureVisionEndpoint: process.env.NEXT_PUBLIC_AZURE_VISION_ENDPOINT || '',
    azureVisionKey: process.env.NEXT_PUBLIC_AZURE_VISION_KEY || ''
  })

  const updateStep = (stepIndex: number, status: ProcessingStep['status'], message?: string, progress?: number) => {
    setProcessingSteps(prev => 
      prev.map((step, index) => 
        index === stepIndex ? { ...step, status, message, progress } : step
      )
    )
  }

  // 只处理OCR提取
  const processOCROnly = async (uploadedFile: File) => {
    setIsProcessing(true)
    setError(null)
    setResult(null)
    setOcrResult(null)
    setEnhancedOCRResult(null)
    setExtractedIndicators([])
    setOcrCompleted(false)

    try {
      // Step 1: Azure OCR文本提取
      updateStep(0, 'processing', '正在连接Azure Computer Vision...', 10)
      
      let ocrResponse: { extractedText: string[], parsedResult?: any }
      try {
        ocrResponse = await azureAI.extractTextFromImage(uploadedFile)
        
        updateStep(0, 'processing', '正在处理OCR结果...', 80)
        
        if (ocrResponse.extractedText.length === 0) {
          throw new Error('未能从图片中提取到文字，请确保图片清晰可读')
        }

        const ocrData: OCRResult = {
          extractedText: ocrResponse.extractedText,
          confidence: ocrResponse.parsedResult?.metadata.avgConfidence || 0.85,
          totalSegments: ocrResponse.extractedText.length
        }
        
        setOcrResult(ocrData)
        if (ocrResponse.parsedResult) {
          console.log('🔍 设置增强OCR结果:', ocrResponse.parsedResult)
          setEnhancedOCRResult(ocrResponse.parsedResult)
        } else {
          console.log('⚠️ 未获得增强OCR结果，使用传统显示模式')
        }
        
        setOcrCompleted(true)
        updateStep(0, 'completed', `OCR识别完成，提取 ${ocrResponse.extractedText.length} 个文本片段`, 100)
        
      } catch (ocrError) {
        updateStep(0, 'error', `OCR处理失败: ${ocrError instanceof Error ? ocrError.message : '未知错误'}`)
        throw ocrError
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      console.error('OCR处理失败:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // AI分析处理（用户手动触发）
  const processAIAnalysis = async () => {
    if (!ocrResult || !ocrResult.extractedText || ocrResult.extractedText.length === 0) {
      setError('没有OCR数据，请先上传并处理图片')
      return
    }

    setIsAIAnalyzing(true)
    setError(null)
    setResult(null)
    setExtractedIndicators([])

    // 重置AI分析步骤
    setAiAnalysisSteps(steps => steps.map(step => ({ ...step, status: 'pending' as const, progress: 0 })))

    const updateAIStep = (stepIndex: number, status: ProcessingStep['status'], message?: string, progress?: number) => {
      setAiAnalysisSteps(prev => 
        prev.map((step, index) => 
          index === stepIndex ? { ...step, status, message, progress } : step
        )
      )
    }

    try {
      // 用户配置文件（后续可以从用户设置中获取）
      const userProfile = {
        age: 35,
        gender: '男',
        medicalHistory: '无'
      }

      // Step 1: 健康指标解析
      updateAIStep(0, 'processing', '正在使用AI解析健康指标...', 20)
      
      try {
        const indicators = await azureAI.parseHealthIndicators(ocrResult.extractedText)
        
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
      
      try {
        const analysis = await azureAI.analyzeHealthData(extractedIndicators, userProfile)
        
        updateAIStep(1, 'processing', '正在生成健康建议...', 80)
        
        setResult(analysis)
        updateAIStep(1, 'completed', 'AI健康分析完成', 100)
        
      } catch (analysisError) {
        updateAIStep(1, 'error', `AI分析失败: ${analysisError instanceof Error ? analysisError.message : '未知错误'}`)
        throw analysisError
      }
      
      // Step 3: 生成最终报告
      updateAIStep(2, 'processing', '正在整合分析结果...', 50)
      
      // 模拟报告生成过程
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      updateAIStep(2, 'completed', '智能健康报告生成完成', 100)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      console.error('AI分析失败:', err)
    } finally {
      setIsAIAnalyzing(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('请上传JPG、PNG或PDF格式的文件')
        return
      }
      
      // 验证文件大小 (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('文件大小不能超过10MB')
        return
      }

      setFile(selectedFile)
      
      // 重置所有状态
      setProcessingSteps(steps => steps.map(step => ({ ...step, status: 'pending' as const, progress: 0 })))
      
      // 开始OCR处理
      processOCROnly(selectedFile)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'processing':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const restartAnalysis = () => {
    setFile(null)
    setResult(null)
    setOcrResult(null)
    setEnhancedOCRResult(null)
    setExtractedIndicators([])
    setError(null)
    setShowOCRDetails(false)
    setOcrCompleted(false)
    setIsAIAnalyzing(false)
    setProcessingSteps(steps => steps.map(step => ({ ...step, status: 'pending' as const, progress: 0 })))
    setAiAnalysisSteps(steps => steps.map(step => ({ ...step, status: 'pending' as const, progress: 0 })))
  }

  // 处理OCR文本编辑后的重新分析
  const handleOCRTextEdit = async (editedText: string[]) => {
    if (!azureAI) return
    
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

  // 处理重新分析请求
  const handleReanalyze = () => {
    if (ocrResult) {
      handleOCRTextEdit(ocrResult.extractedText)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 文件上传区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            智能体检报告解读
          </CardTitle>
          <CardDescription>
            基于Azure AI技术，支持JPG、PNG、PDF格式，最大10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div
            onClick={!isProcessing ? triggerFileSelect : undefined}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${!isProcessing ? 'cursor-pointer hover:border-gray-400' : 'cursor-not-allowed opacity-50'}
              ${file ? 'bg-green-50 border-green-300 dark:bg-green-900/20' : 'border-gray-300'}
            `}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {file ? (
              <div>
                <p className="text-lg font-medium text-green-700 dark:text-green-300">已选择文件</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{file.name}</p>
                <p className="text-xs text-gray-500 mt-2">
                  大小: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium">点击选择体检报告</p>
                <p className="text-sm text-gray-500">支持体检报告的图片或PDF文件</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Azure AI处理进度 */}
      {file && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Azure AI处理进度
              <span className="text-sm font-normal text-muted-foreground">
                (基于Azure OpenAI + Computer Vision)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {processingSteps.map((step, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-3">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{step.name}</span>
                      <span className="text-sm text-gray-500">{step.message}</span>
                    </div>
                  </div>
                </div>
                {step.status === 'processing' && step.progress !== undefined && (
                  <Progress value={step.progress} className="h-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* OCR完成提示和AI分析触发 */}
      {ocrCompleted && ocrResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              OCR识别完成
            </CardTitle>
            <CardDescription>
              文本提取完成，你可以查看和编辑识别结果，然后启动AI分析
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              已识别 {ocrResult.totalSegments} 个文本片段，置信度 {(ocrResult.confidence * 100).toFixed(0)}%
            </div>
            <Button 
              onClick={processAIAnalysis}
              disabled={isAIAnalyzing}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAIAnalyzing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  分析中...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  开始AI分析
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI分析进度 */}
      {isAIAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              AI分析进度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiAnalysisSteps.map((step, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-3">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{step.name}</span>
                      <span className="text-sm text-gray-500">{step.message}</span>
                    </div>
                  </div>
                </div>
                {step.status === 'processing' && step.progress !== undefined && (
                  <Progress value={step.progress} className="h-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 增强OCR结果展示 */}
      {enhancedOCRResult && (
        <EnhancedOCRResultPanel
          parsedResult={enhancedOCRResult}
          onTextEdit={(editedText) => {
            // 更新OCR结果
            setOcrResult(prev => prev ? { ...prev, extractedText: editedText } : null)
            // 可以在这里触发重新分析
          }}
          onReanalyze={isReanalyzing ? undefined : () => {
            setIsReanalyzing(true)
            // 重新处理文件
            if (file) {
              processOCROnly(file).finally(() => setIsReanalyzing(false))
            }
          }}
          isReanalyzing={isReanalyzing}
        />
      )}

      {/* 传统OCR结果展示 - 向后兼容 */}
      {ocrResult && !enhancedOCRResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                OCR提取结果
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowOCRDetails(!showOCRDetails)}
                >
                  {showOCRDetails ? '隐藏详情' : '查看详情'}
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setShowOCRReview(true)}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  审查编辑
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{ocrResult.totalSegments}</div>
                <div className="text-sm text-blue-600">文本片段</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{(ocrResult.confidence * 100).toFixed(0)}%</div>
                <div className="text-sm text-green-600">识别置信度</div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{extractedIndicators.length}</div>
                <div className="text-sm text-purple-600">健康指标</div>
              </div>
            </div>
            
            {showOCRDetails && (
              <div className="space-y-3">
                <h4 className="font-medium">提取的文本内容：</h4>
                <div className="max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {ocrResult.extractedText.map((text, index) => (
                    <div key={index} className="text-sm py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <span className="text-gray-500 mr-2">{index + 1}:</span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* OCR 审查界面 */}
      {showOCRReview && ocrResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">OCR 结果审查与编辑</h2>
            <Button 
              variant="outline" 
              onClick={() => setShowOCRReview(false)}
            >
              <X className="h-4 w-4 mr-1" />
              关闭审查
            </Button>
          </div>
          <OCRReviewPanel
            ocrResult={ocrResult}
            extractedIndicators={extractedIndicators}
            onTextEdit={handleOCRTextEdit}
            onReanalyze={handleReanalyze}
            isReanalyzing={isReanalyzing}
          />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={restartAnalysis}
            >
              重新开始
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* AI分析结果 */}
      {result && (
        <div className="space-y-6">
          {/* 总体状况 */}
          <Card>
            <CardHeader>
              <CardTitle>Azure AI健康分析结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">整体评估</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-blue-600">{result.overallStatus}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{result.summary}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">健康得分</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-4xl font-bold ${getHealthScoreColor(result.healthScore)}`}>
                      {result.healthScore}
                    </span>
                    <span className="text-gray-500">/ 100</span>
                  </div>
                  <Progress value={result.healthScore} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 异常指标 */}
          {result.abnormalIndicators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">需要关注的指标</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.abnormalIndicators.map((indicator, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{indicator.name}</h4>
                        <span className={`px-2 py-1 rounded text-sm ${
                          indicator.status === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                          indicator.status === 'low' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {indicator.status === 'high' ? '偏高' : indicator.status === 'low' ? '偏低' : '严重'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        当前值：{indicator.value} {indicator.unit} 
                        （正常范围：{indicator.normalRange}）
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 健康建议 */}
          <Card>
            <CardHeader>
              <CardTitle>AI个性化建议</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">生活方式</h4>
                  <ul className="space-y-1 text-sm">
                    {result.recommendations.lifestyle.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">饮食建议</h4>
                  <ul className="space-y-1 text-sm">
                    {result.recommendations.diet.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">运动建议</h4>
                  <ul className="space-y-1 text-sm">
                    {result.recommendations.exercise.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">复查建议</h4>
                  <ul className="space-y-1 text-sm">
                    {result.recommendations.followUp.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 健康风险 */}
          {result.risks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>健康风险预警</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.risks.map((risk, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{risk.type}</h4>
                        <span className={`px-2 py-1 rounded text-sm ${
                          risk.probability === '高' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                          risk.probability === '中' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          {risk.probability}风险
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 操作按钮 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={restartAnalysis}
                  variant="outline"
                  className="flex-1"
                >
                  分析其他报告
                </Button>
                <Button className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  保存报告
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowHealthChat(!showHealthChat)}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {showHealthChat ? '关闭AI咨询' : 'AI问答咨询'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI 健康咨询界面 */}
          {showHealthChat && result && (
            <HealthChatPanel
              analysisResult={result}
              userProfile={{ age: 35, gender: '男', medicalHistory: '无' }}
              azureAI={azureAI}
            />
          )}
        </div>
      )}
    </div>
  )
} 