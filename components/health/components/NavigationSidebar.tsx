import { Upload, Brain, Activity, Eye, MessageCircle, Sparkles } from 'lucide-react'
import { UnifiedAnalysisResult } from '@/hooks/useAIAnalysis'
import { OCRResult } from '../types'

interface NavigationSidebarProps {
  analysisResult?: UnifiedAnalysisResult | null
  ocrResult?: OCRResult | null
  onSectionClick?: (sectionId: string) => void
  onAIInsightsToggle?: () => void
  isAIInsightsActive?: boolean
}

export function NavigationSidebar({
  analysisResult,
  ocrResult,
  onSectionClick,
  onAIInsightsToggle,
  isAIInsightsActive = false
}: NavigationSidebarProps) {
  const scrollToElement = (id: string) => {
    if (onSectionClick) {
      onSectionClick(id)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-50 hidden lg:block">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 space-y-2 w-fit">
        <div className="text-xs text-gray-500 text-center mb-2">快速导航</div>
        
        {/* 上传区域 */}
        <button
          onClick={() => scrollToElement('upload-ocr-section')}
          className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="上传区域"
        >
          <Upload className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* AI分析结果 */}
        {analysisResult && (
          <button
            onClick={() => scrollToElement('ai-analysis')}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
            title="AI分析结果"
          >
            <Brain className="h-4 w-4 text-blue-600" />
          </button>
        )}

        {/* 健康指标 */}
        {analysisResult?.keyFindings && analysisResult.keyFindings.length > 0 && (
          <button
            onClick={() => scrollToElement('health-indicators')}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
            title="健康指标"
          >
            <Activity className="h-4 w-4 text-green-600" />
          </button>
        )}

        {/* AI智能解读 - 新增功能 */}
        {analysisResult?.keyFindings && analysisResult.keyFindings.length > 0 && (
          <button
            onClick={onAIInsightsToggle}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
              isAIInsightsActive 
                ? 'bg-purple-100 dark:bg-purple-800 border-2 border-purple-500 shadow-lg' 
                : 'hover:bg-purple-100 dark:hover:bg-purple-800'
            }`}
            title={isAIInsightsActive ? 'AI解读模式开启中' : '开启AI智能解读'}
          >
            <Sparkles className={`h-4 w-4 ${isAIInsightsActive ? 'text-purple-600 animate-pulse' : 'text-purple-600'}`} />
          </button>
        )}

        {/* OCR结果 */}
        {ocrResult && (
          <button
            onClick={() => scrollToElement('upload-ocr-section')}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
            title="OCR识别结果"
          >
            <Eye className="h-4 w-4 text-purple-600" />
          </button>
        )}

        {/* AI咨询 */}
        {analysisResult && (
          <button
            onClick={() => scrollToElement('health-chat')}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-orange-100 dark:hover:bg-orange-800 transition-colors"
            title="AI健康咨询"
          >
            <MessageCircle className="h-4 w-4 text-orange-600" />
          </button>
        )}

        {/* 分隔线 */}
        {analysisResult && (
          <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-2" />
        )}

        {/* 分析状态指示器 */}
        {analysisResult && (
          <div className="w-full">
            <div className="w-full p-2 rounded-lg flex items-center justify-center bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30">
              <Brain className="h-4 w-4 text-green-600" />
            </div>
            <div className="mt-1 text-center">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium whitespace-nowrap">
                <Brain className="h-3 w-3" />
                分析完成
              </span>
            </div>
            
            {/* AI解读状态指示 */}
            {isAIInsightsActive && (
              <div className="mt-2 text-center">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium whitespace-nowrap">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  AI解读中
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 