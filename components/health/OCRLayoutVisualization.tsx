'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit3, Save, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface OCRLayoutVisualizationProps {
  structuredData: Array<{
    lineNumber: number
    text: string
    x: number
    y: number
    confidence: number
    bbox: number[]
    pageNumber?: number
    lineIndexInPage?: number
  }>
  pageInfo?: {
    width: number
    height: number
    angle: number
    unit: string
  }
  onTextEdit?: (lineNumber: number, newText: string) => void
  isEditable?: boolean
  currentPage?: number
}

export default function OCRLayoutVisualization({
  structuredData,
  pageInfo,
  onTextEdit,
  isEditable = true,
  currentPage = 1
}: OCRLayoutVisualizationProps) {
  const [scale, setScale] = useState(0.5)
  const [editingLine, setEditingLine] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // 计算缩放后的尺寸
  const canvasWidth = pageInfo ? pageInfo.width * scale : 800
  const canvasHeight = pageInfo ? pageInfo.height * scale : 1000

  // 过滤当前页面的数据
  const currentPageData = structuredData.filter(item => 
    !currentPage || item.pageNumber === currentPage
  )

  const handleEditStart = (line: typeof structuredData[0]) => {
    setEditingLine(line.lineNumber)
    setEditText(line.text)
  }

  const handleEditSave = () => {
    if (editingLine !== null && onTextEdit) {
      onTextEdit(editingLine, editText)
    }
    setEditingLine(null)
    setEditText('')
  }

  const handleEditCancel = () => {
    setEditingLine(null)
    setEditText('')
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 border-green-300 text-green-800'
    if (confidence >= 0.7) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    return 'bg-red-100 border-red-300 text-red-800'
  }

  const getTextSize = (bbox: number[]) => {
    // 根据边界框计算合适的字体大小
    const width = Math.abs(bbox[2] - bbox[0])
    const height = Math.abs(bbox[5] - bbox[1])
    const baseSize = Math.min(width * scale / 12, height * scale / 3)
    return Math.max(10, Math.min(baseSize, 18))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>布局可视化</span>
            {pageInfo && (
              <Badge variant="outline">
                {pageInfo.width}×{pageInfo.height}px
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(Math.max(0.2, scale - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500 min-w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(Math.min(2, scale + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(1.5)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
                 <div 
           ref={containerRef}
           className="relative overflow-auto border-2 border-dashed border-gray-300 bg-white"
           style={{
             width: '100%',
             height: Math.min(canvasHeight + 80, 600),
             maxHeight: '80vh'
           }}
         >
          <div
            className="relative bg-white shadow-sm"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transform: pageInfo?.angle ? `rotate(${pageInfo.angle}deg)` : undefined,
              transformOrigin: 'top left'
            }}
          >
                         {currentPageData.map((item) => {
              const scaledX = item.x * scale
              const scaledY = item.y * scale
              const scaledWidth = Math.abs(item.bbox[2] - item.bbox[0]) * scale
              const scaledHeight = Math.abs(item.bbox[5] - item.bbox[1]) * scale
              const fontSize = getTextSize(item.bbox)
              const isEditing = editingLine === item.lineNumber

              return (
                <div
                  key={item.lineNumber}
                  className={`absolute border transition-all duration-200 hover:shadow-md ${getConfidenceColor(item.confidence)}`}
                  style={{
                    left: scaledX,
                    top: scaledY,
                    width: Math.max(scaledWidth, 20),
                    height: Math.max(scaledHeight, 16),
                    fontSize: `${fontSize}px`,
                    lineHeight: `${scaledHeight}px`,
                    cursor: isEditable ? 'pointer' : 'default'
                  }}
                  onClick={() => isEditable && !isEditing && handleEditStart(item)}
                >
                  {isEditing ? (
                    <div className="relative w-full h-full">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full h-full resize-none border-none bg-transparent text-xs p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ fontSize: `${fontSize}px` }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleEditSave()
                          } else if (e.key === 'Escape') {
                            handleEditCancel()
                          }
                        }}
                      />
                      <div className="absolute -top-8 left-0 flex gap-1">
                        <Button
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={handleEditSave}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={handleEditCancel}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full group">
                      <div 
                        className="p-1 text-xs leading-tight overflow-hidden"
                        style={{ 
                          fontSize: `${fontSize}px`,
                          lineHeight: '1.2'
                        }}
                        title={item.text} // 显示完整文本作为提示
                      >
                        {item.text || '(空行)'}
                      </div>
                      <div className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Badge variant="secondary" className="text-xs h-4 shadow-sm">
                          #{item.lineNumber}
                        </Badge>
                      </div>
                      <div className="absolute -top-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Badge 
                          variant={item.confidence >= 0.9 ? 'default' : item.confidence >= 0.7 ? 'secondary' : 'destructive'}
                          className="text-xs h-4 shadow-sm"
                        >
                          {Math.round(item.confidence * 100)}%
                        </Badge>
                      </div>
                      {isEditable && (
                        <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-5 px-1 text-xs shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditStart(item)
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 space-y-1">
          <div>• 点击文本框进行编辑，Ctrl+Enter 保存，Esc 取消</div>
          <div>• 悬停查看行号和置信度，颜色表示识别质量</div>
          <div>• 使用缩放控件调整视图大小</div>
        </div>
      </CardContent>
    </Card>
  )
} 