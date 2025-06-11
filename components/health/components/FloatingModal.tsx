import { X } from 'lucide-react'
import { type HealthIndicator } from '@/lib/agents/azure-health-ai-system'

interface FloatingModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  indicator?: HealthIndicator | null
}

export function FloatingModal({ isOpen, onClose, title, content, indicator }: FloatingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl border max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 指标信息 */}
        {indicator && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {indicator.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {indicator.value} {indicator.unit} (参考范围: {indicator.normalRange})
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                indicator.status === 'normal' 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : indicator.status === 'high'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : indicator.status === 'low'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {indicator.status === 'normal' ? '正常' : 
                 indicator.status === 'high' ? '偏高' : 
                 indicator.status === 'low' ? '偏低' : '异常'}
              </div>
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
              {content}
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
} 