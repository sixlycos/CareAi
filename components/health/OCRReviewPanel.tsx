'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, Edit3, Check, X, RefreshCw, AlertTriangle } from 'lucide-react'

interface OCRResult {
  extractedText: string[]
  confidence: number
  totalSegments: number
}

interface HealthIndicator {
  name: string
  value: number | string
  unit: string
  normalRange: string
  status: 'normal' | 'high' | 'low' | 'critical'
}

interface OCRReviewPanelProps {
  ocrResult: OCRResult
  extractedIndicators: HealthIndicator[]
  onTextEdit: (editedText: string[]) => void
  onReanalyze: () => void
  onClose: () => void
  isReanalyzing?: boolean
}

export default function OCRReviewPanel({
  ocrResult,
  extractedIndicators,
  onTextEdit,
  onReanalyze,
  onClose,
  isReanalyzing = false
}: OCRReviewPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTexts, setEditedTexts] = useState<string[]>(ocrResult.extractedText)
  const [hasChanges, setHasChanges] = useState(false)

  const handleTextChange = (index: number, newText: string) => {
    const updated = [...editedTexts]
    updated[index] = newText
    setEditedTexts(updated)
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(ocrResult.extractedText))
  }

  const handleSaveChanges = () => {
    onTextEdit(editedTexts)
    setIsEditing(false)
    setHasChanges(false)
  }

  const handleCancelEdit = () => {
    setEditedTexts(ocrResult.extractedText)
    setIsEditing(false)
    setHasChanges(false)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return '高'
    if (confidence >= 0.7) return '中'
    return '低'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 space-y-6">
          {/* OCR 统计概览 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  OCR 识别结果
                </div>
                <div className="flex gap-2">
                  {!isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      编辑文本
                    </Button>
                  )}
                  {isEditing && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-1" />
                        取消
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleSaveChanges}
                        disabled={!hasChanges}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        保存修改
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                查看和编辑OCR识别的文本内容，确保数据准确性
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{ocrResult.totalSegments}</div>
                  <div className="text-sm text-blue-600">文本片段</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className={`text-2xl font-bold ${getConfidenceColor(ocrResult.confidence)}`}>
                    {getConfidenceLabel(ocrResult.confidence)}
                  </div>
                  <div className="text-sm text-gray-600">识别置信度</div>
                  <Progress value={ocrResult.confidence * 100} className="mt-2 h-2" />
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{extractedIndicators.length}</div>
                  <div className="text-sm text-purple-600">健康指标</div>
                </div>
              </div>

              {/* 低置信度警告 */}
              {ocrResult.confidence < 0.7 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    OCR识别置信度较低，建议仔细检查和编辑文本内容以确保准确性
                  </AlertDescription>
                </Alert>
              )}

              {/* 变更提示 */}
              {hasChanges && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>检测到文本修改，保存后将重新分析健康指标</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onReanalyze}
                      disabled={isReanalyzing || !hasChanges}
                    >
                      {isReanalyzing ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-1" />
                      )}
                      重新分析
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* OCR 文本详情 */}
          <Card>
            <CardHeader>
              <CardTitle>
                识别文本详情
                {isEditing && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (编辑模式 - 点击文本框进行修改)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {editedTexts.map((text: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0 w-8 text-center">
                      <span className="text-sm text-gray-500 font-mono">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <textarea
                          value={text}
                          onChange={(e) => handleTextChange(index, e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                          rows={Math.max(1, Math.ceil(text.length / 50))}
                        />
                      ) : (
                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {text || <span className="text-gray-400 italic">空行</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 提取的健康指标预览 */}
          {extractedIndicators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>识别的健康指标</CardTitle>
                <CardDescription>
                  基于当前文本识别出的健康指标，修改文本后将重新解析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {extractedIndicators.map((indicator, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{indicator.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          indicator.status === 'normal' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          indicator.status === 'high' || indicator.status === 'low' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {indicator.status === 'normal' ? '正常' :
                           indicator.status === 'high' ? '偏高' :
                           indicator.status === 'low' ? '偏低' : '异常'}
                        </span>
                      </div>
                      <div className="text-lg font-semibold">
                        {indicator.value} {indicator.unit}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        正常范围: {indicator.normalRange}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 