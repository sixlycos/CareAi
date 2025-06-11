import { useState } from 'react'
import AzureHealthAISystem from '@/lib/agents/azure-health-ai-system'
import { ParsedOCRResult } from '@/lib/utils/azure-ocr-parser'
import { ProcessingStep, OCRResult } from '../types'

export function useOCRProcessing() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { name: 'Azure OCR文本提取', status: 'pending', progress: 0 }
  ])
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [enhancedOCRResult, setEnhancedOCRResult] = useState<ParsedOCRResult | null>(null)
  const [ocrCompleted, setOcrCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const processOCROnly = async (uploadedFile: File) => {
    setIsProcessing(true)
    setError(null)
    setOcrResult(null)
    setEnhancedOCRResult(null)
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

  const resetOCR = () => {
    setOcrResult(null)
    setEnhancedOCRResult(null)
    setOcrCompleted(false)
    setError(null)
    setProcessingSteps([{ name: 'Azure OCR文本提取', status: 'pending', progress: 0 }])
  }

  return {
    isProcessing,
    processingSteps,
    ocrResult,
    enhancedOCRResult,
    ocrCompleted,
    error,
    processOCROnly,
    resetOCR,
    azureAI
  }
} 