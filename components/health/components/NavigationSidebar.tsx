import { Upload, Brain, Activity, Eye, MessageCircle } from 'lucide-react'
import { type AnalysisResult, type HealthIndicator } from '@/lib/agents/azure-health-ai-system'
import { ParsedOCRResult } from '@/lib/utils/azure-ocr-parser'
import { OCRResult } from '../types'

interface NavigationSidebarProps {
  result: AnalysisResult | null
  extractedIndicators: HealthIndicator[]
  ocrResult: OCRResult | null
  enhancedOCRResult: ParsedOCRResult | null
  showHealthChat: boolean
  aiExplainMode: boolean
  selectedIndicator: HealthIndicator | null
  indicatorExplanation: string | null
  isExplaining: boolean
  onToggleAiExplainMode: () => void
}

export function NavigationSidebar({
  result,
  extractedIndicators,
  ocrResult,
  enhancedOCRResult,
  showHealthChat,
  aiExplainMode,
  selectedIndicator,
  indicatorExplanation,
  isExplaining,
  onToggleAiExplainMode
}: NavigationSidebarProps) {
  const scrollToElement = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-50 hidden lg:block">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 space-y-2">
        <div className="text-xs text-gray-500 text-center mb-2">快速导航</div>
        
        {/* 上传区域 */}
        <button
          onClick={() => scrollToElement('upload-section')}
          className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="上传区域"
        >
          <Upload className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* AI分析结果 */}
        {result && (
          <button
            onClick={() => scrollToElement('ai-analysis')}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
            title="AI分析结果"
          >
            <Brain className="h-4 w-4 text-blue-600" />
          </button>
        )}

        {/* 健康指标 */}
        {extractedIndicators.length > 0 && (
          <button
            onClick={() => scrollToElement('health-indicators')}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
            title="健康指标"
          >
            <Activity className="h-4 w-4 text-green-600" />
          </button>
        )}

        {/* OCR结果 */}
        {(ocrResult || enhancedOCRResult) && (
          <button
            onClick={() => scrollToElement('ocr-results')}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
            title="OCR识别结果"
          >
            <Eye className="h-4 w-4 text-purple-600" />
          </button>
        )}

        {/* AI咨询 */}
        {showHealthChat && (
          <button
            onClick={() => scrollToElement('health-chat')}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-orange-100 dark:hover:bg-orange-800 transition-colors"
            title="AI健康咨询"
          >
            <MessageCircle className="h-4 w-4 text-orange-600" />
          </button>
        )}

        {/* 分隔线 */}
        {extractedIndicators.length > 0 && (
          <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-2" />
        )}

        {/* AI解读面板 */}
        {extractedIndicators.length > 0 && (
          <div className="w-full">
            {/* AI解读模式切换 */}
            <button
              onClick={onToggleAiExplainMode}
              className={`w-full p-2 rounded-lg flex items-center justify-center transition-all duration-200 relative ${
                aiExplainMode 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-300/50' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title={aiExplainMode ? "关闭AI解读模式" : "开启AI解读模式"}
            >
              <Brain className={`h-4 w-4 ${aiExplainMode ? 'animate-bounce' : ''}`} />
              {/* AI模式激活指示器 */}
              {aiExplainMode && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
              )}
            </button>

            {/* AI解读模式状态提示 */}
            {aiExplainMode && (
              <div className="mt-1 text-center">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                  <Brain className="h-3 w-3" />
                  AI解读已启用
                </span>
              </div>
            )}

            {/* 解读内容预览 */}
            {aiExplainMode && (
              <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                  AI智能解读
                </div>
                
                {selectedIndicator ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {selectedIndicator.name}
                    </div>
                    {isExplaining ? (
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 border border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-500">解读中...</span>
                      </div>
                    ) : indicatorExplanation ? (
                      <button 
                        onClick={() => {
                          // 显示完整解读的弹窗
                          alert(indicatorExplanation) // 临时用alert，后续可以用更好的模态框
                        }}
                        className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 text-left hover:text-purple-600 transition-colors"
                      >
                        {indicatorExplanation.substring(0, 50)}...
                        <div className="text-purple-500 mt-1">点击查看完整解读</div>
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center p-2 border border-dashed border-purple-300 dark:border-purple-700 rounded">
                    <Brain className="h-4 w-4 mx-auto mb-1 text-purple-400" />
                    点击指标卡片获取AI解读
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 