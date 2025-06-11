'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Brain, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { type HealthIndicator } from '@/lib/agents/azure-health-ai-system'

interface HealthIndicatorCardProps {
  indicator: HealthIndicator
  isAIMode?: boolean
  onAIExplain?: (indicator: HealthIndicator) => void
}

export default function HealthIndicatorCard({ 
  indicator, 
  isAIMode = false, 
  onAIExplain 
}: HealthIndicatorCardProps) {
  const getStatusColor = () => {
    switch (indicator.status) {
      case 'normal': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
    }
  }

  const getStatusIcon = () => {
    switch (indicator.status) {
      case 'normal': return null
      case 'high': return <TrendingUp className="h-4 w-4" />
      case 'low': return <TrendingDown className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (indicator.status) {
      case 'normal': return '正常'
      case 'high': return '偏高'
      case 'low': return '偏低'
      default: return '异常'
    }
  }

  const handleClick = () => {
    if (isAIMode && onAIExplain) {
      onAIExplain(indicator)
    }
  }

  return (
    <Card 
      className={`transition-all duration-200 ${
        isAIMode 
          ? 'cursor-pointer hover:shadow-md hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10' 
          : ''
      } ${
        isAIMode 
          ? 'relative ring-2 ring-purple-200 dark:ring-purple-800' 
          : ''
      }`}
      onClick={handleClick}
    >
      {/* AI模式指示器 */}
      {isAIMode && (
        <div className="absolute -top-1 -right-1 bg-purple-600 text-white p-1 rounded-full z-10">
          <Brain className="h-3 w-3" />
        </div>
      )}
      
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* 指标名称 */}
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {indicator.name}
          </div>
          
          {/* 数值和单位 */}
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {indicator.value}
            </span>
            <span className="text-sm text-gray-500">
              {indicator.unit}
            </span>
          </div>
          
          {/* 参考范围 */}
          <div className="text-xs text-gray-500">
            参考范围：{indicator.normalRange}
          </div>
          
          {/* 状态标签 */}
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
            {getStatusIcon()}
            {getStatusText()}
          </div>
          
          {/* AI模式提示 */}
          {isAIMode && (
            <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-2">
              <Brain className="h-3 w-3" />
              点击获取AI解读
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 