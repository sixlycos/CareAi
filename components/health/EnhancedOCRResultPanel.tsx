'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Edit3, 
  Check, 
  X, 
  RefreshCw, 
  AlertTriangle, 
  Info,
  Download,
  List,
  Layout
} from 'lucide-react'
import { ParsedOCRResult } from '@/lib/utils/azure-ocr-parser'
import OCRLayoutVisualization from './OCRLayoutVisualization'

interface EnhancedOCRResultPanelProps {
  parsedResult: ParsedOCRResult
  onTextEdit?: (editedText: string[]) => void
  onReanalyze?: () => void
  isReanalyzing?: boolean
}

export default function EnhancedOCRResultPanel({
  parsedResult,
  onTextEdit,
  onReanalyze,
  isReanalyzing = false
}: EnhancedOCRResultPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTexts, setEditedTexts] = useState<string[]>(parsedResult.extractedText)
  const [hasChanges, setHasChanges] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'layout'>('list')

  const handleTextChange = (index: number, newText: string) => {
    const updated = [...editedTexts]
    updated[index] = newText
    setEditedTexts(updated)
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(parsedResult.extractedText))
  }

  const handleSaveChanges = () => {
    if (onTextEdit) {
      onTextEdit(editedTexts)
    }
    setIsEditing(false)
    setHasChanges(false)
  }

  const handleCancelEdit = () => {
    setEditedTexts(parsedResult.extractedText)
    setIsEditing(false)
    setHasChanges(false)
  }

  const handleLayoutTextEdit = (lineNumber: number, newText: string) => {
    const updated = [...editedTexts]
    updated[lineNumber] = newText
    setEditedTexts(updated)
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(parsedResult.extractedText))
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

  const getConfidenceBadgeVariant = (confidence: number): "default" | "secondary" | "destructive" | "outline" => {
    if (confidence >= 0.9) return 'default'
    if (confidence >= 0.7) return 'secondary'
    return 'destructive'
  }

  const downloadProcessedText = () => {
    const content = parsedResult.extractedText.join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ocr-text-${new Date().getTime()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 获取当前页面的文本数据
  const getCurrentPageData = () => {
    if (!parsedResult.pages || parsedResult.pages.length === 0) {
      return {
        lines: parsedResult.structuredData,
        pageInfo: null
      }
    }
    
    const pageData = parsedResult.pages.find(p => p.pageNumber === currentPage)
    if (!pageData) {
      return {
        lines: [],
        pageInfo: null
      }
    }
    
    // 获取当前页面的结构化数据
    const pageLines = parsedResult.structuredData.filter(item => item.pageNumber === currentPage)
    
    return {
      lines: pageLines,
      pageInfo: pageData.pageInfo
    }
  }

  const { lines: currentPageLines, pageInfo } = getCurrentPageData()
  const totalPages = parsedResult.pages?.length || 1

  if (!parsedResult.success) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          OCR解析失败，无法显示结果详情
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* 统计概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              增强OCR识别结果 
              <Badge variant="outline" className="ml-2">
                Azure v{parsedResult.metadata.modelVersion}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={downloadProcessedText}
              >
                <Download className="h-4 w-4 mr-1" />
                导出文本
              </Button>
              {onReanalyze && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onReanalyze}
                  disabled={isReanalyzing}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isReanalyzing ? 'animate-spin' : ''}`} />
                  重新分析
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            OCR识别结果统计和质量分析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {parsedResult.metadata.totalLines}
              </div>
              <div className="text-sm text-blue-600">文本行数</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className={`text-2xl font-bold ${getConfidenceColor(parsedResult.metadata.avgConfidence)}`}>
                {getConfidenceLabel(parsedResult.metadata.avgConfidence)}
              </div>
              <div className="text-sm text-gray-600">平均置信度</div>
              <Progress value={parsedResult.metadata.avgConfidence * 100} className="mt-1 h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {(parsedResult.metadata.avgConfidence * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {parsedResult.metadata.totalPages}
              </div>
              <div className="text-sm text-purple-600">处理页数</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {parsedResult.metadata.processingTime}
              </div>
              <div className="text-sm text-orange-600">处理时间</div>
            </div>
          </div>

          {/* 质量分析 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <Badge variant="default">高置信度</Badge>
                <span className="text-sm text-gray-600">≥90%</span>
              </div>
              <span className="font-medium">
                {parsedResult.qualityMetrics.confidenceDistribution.high}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">中等置信度</Badge>
                <span className="text-sm text-gray-600">70-90%</span>
              </div>
              <span className="font-medium">
                {parsedResult.qualityMetrics.confidenceDistribution.medium}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">低置信度</Badge>
                <span className="text-sm text-gray-600">&lt;70%</span>
              </div>
              <span className="font-medium">
                {parsedResult.qualityMetrics.confidenceDistribution.low}
              </span>
            </div>
          </div>

          {/* 质量警告 */}
          {parsedResult.metadata.avgConfidence < 0.7 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                整体识别置信度较低({(parsedResult.metadata.avgConfidence * 100).toFixed(1)}%)，
                建议检查文本内容或重新拍摄更清晰的图片
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 文本内容 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              文本内容
              {totalPages > 1 ? (
                <span className="text-sm text-gray-500">
                  (第{currentPage}页，共{currentPageLines.length}行)
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  ({parsedResult.extractedText.length} 行)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {/* 视图切换按钮 */}
              <div className="flex border rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3 w-3 mr-1" />
                  列表
                </Button>
                <Button
                  variant={viewMode === 'layout' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('layout')}
                >
                  <Layout className="h-3 w-3 mr-1" />
                  布局
                </Button>
              </div>

              {/* 编辑按钮 - 只在列表视图显示 */}
              {onTextEdit && viewMode === 'list' && (
                <>
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
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 分页控制 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>页面布局已优化，按位置智能排序</span>
                {pageInfo && (
                  <span className="text-xs">
                    ({pageInfo.width}×{pageInfo.height}px, 旋转{pageInfo.angle.toFixed(1)}°)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}

          {/* 根据视图模式显示不同内容 */}
          {viewMode === 'list' ? (
            /* 列表视图 */
            <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
              {currentPageLines.map((structuredItem) => {
                const globalIndex = structuredItem.lineNumber
                const text = isEditing ? editedTexts[globalIndex] : structuredItem.text
                
                return (
                  <div key={globalIndex} className="flex items-start gap-3 p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-shrink-0 w-12 text-xs text-gray-500 font-mono flex flex-col">
                      <span>{globalIndex.toString().padStart(2, '0')}</span>
                      {totalPages > 1 && (
                        <span className="text-blue-500">P{structuredItem.pageNumber}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {isEditing ? (
                        <textarea
                          value={text}
                          onChange={(e) => handleTextChange(globalIndex, e.target.value)}
                          className="w-full p-1 text-sm border rounded resize-none"
                          rows={1}
                          style={{ minHeight: '24px' }}
                        />
                      ) : (
                        <div className="text-sm">{text || '(空行)'}</div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant={getConfidenceBadgeVariant(structuredItem.confidence)}
                        className="text-xs"
                      >
                        {(structuredItem.confidence * 100).toFixed(0)}%
                      </Badge>
                      {totalPages > 1 && (
                        <span className="text-xs text-gray-400">
                          ({structuredItem.x}, {structuredItem.y})
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* 布局视图 */
            <OCRLayoutVisualization
              structuredData={currentPageLines.map(item => ({
                ...item,
                text: editedTexts[item.lineNumber] || item.text
              }))}
              pageInfo={pageInfo}
              onTextEdit={onTextEdit ? handleLayoutTextEdit : undefined}
              isEditable={!!onTextEdit}
              currentPage={currentPage}
            />
          )}

          {hasChanges && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                您已修改了文本内容，{viewMode === 'layout' ? '修改会自动保存，' : '别忘记保存修改以'}应用到后续分析中
                {viewMode === 'layout' && onTextEdit && (
                  <Button 
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={handleSaveChanges}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    应用所有修改
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 