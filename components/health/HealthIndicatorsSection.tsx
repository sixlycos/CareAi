'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react'

interface HealthIndicator {
  name: string
  value: number | string
  unit: string
  normalRange: string
  status: 'normal' | 'high' | 'low' | 'critical'
}

interface HealthIndicatorsSectionProps {
  indicators: HealthIndicator[]
  onAIExplain?: (indicator: HealthIndicator) => void
  isAIMode?: boolean
  className?: string
}

export function HealthIndicatorsSection({
  indicators,
  onAIExplain,
  isAIMode = false,
  className = ''
}: HealthIndicatorsSectionProps) {
  // 统计指标状态
  const statusStats = indicators.reduce((acc, indicator) => {
    acc[indicator.status] = (acc[indicator.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const normalCount = statusStats.normal || 0
  const abnormalCount = indicators.length - normalCount

  if (indicators.length === 0) {
    return null
  }

  return (
    <Card id="health-indicators" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          健康指标分析
          {isAIMode && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              <Brain className="h-3 w-3 mr-1" />
              AI解读模式
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>共检测 {indicators.length} 项指标</span>
          <div className="flex items-center gap-4 text-sm">
            {abnormalCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                需关注 {abnormalCount}
              </span>
            )}
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              正常 {normalCount}
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* AI模式提示 */}
        {isAIMode && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">AI智能解读已开启</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  点击任意指标卡片，获取基于您个人档案的专业AI解读
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🚨 异常指标优先展示区域 */}
        {abnormalCount > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">需要关注的指标</h3>
              <Badge variant="outline" className="text-amber-700 border-amber-300">
                {abnormalCount} 项
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {indicators
                .filter(indicator => indicator.status !== 'normal')
                .sort((a, b) => {
                  const statusPriority = { 'critical': 0, 'high': 1, 'low': 2 }
                  return (statusPriority[a.status as keyof typeof statusPriority] || 3) - 
                         (statusPriority[b.status as keyof typeof statusPriority] || 3)
                })
                .map((indicator, index) => (
                <IndicatorCard 
                  key={`abnormal-${index}`}
                  indicator={indicator}
                  isAIMode={isAIMode}
                  onAIExplain={onAIExplain}
                  priority="high"
                />
              ))}
            </div>
          </div>
        )}

        {/* ✅ 正常指标展示区域 */}
        {normalCount > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">正常指标</h3>
              <Badge variant="outline" className="text-green-700 border-green-300">
                {normalCount} 项
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {indicators
                .filter(indicator => indicator.status === 'normal')
                .map((indicator, index) => (
                <IndicatorCard 
                  key={`normal-${index}`}
                  indicator={indicator}
                  isAIMode={isAIMode}
                  onAIExplain={onAIExplain}
                  priority="normal"
                />
              ))}
            </div>
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                💡 智能提示
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {isAIMode 
                  ? "AI解读模式下，点击任意指标可获取个性化专业解读。正常指标同样重要，有助于了解整体健康状况。"
                  : "开启AI解读模式，点击导航栏的紫色星星图标，即可获得每个指标的专业解读。"
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 🎯 独立的指标卡片组件 - 乔布斯式设计
interface IndicatorCardProps {
  indicator: HealthIndicator
  isAIMode: boolean
  onAIExplain?: (indicator: HealthIndicator) => void
  priority: 'high' | 'normal'
}

function IndicatorCard({ indicator, isAIMode, onAIExplain, priority }: IndicatorCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      case 'critical': return 'text-red-700 bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700'
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-4 w-4" />
      case 'high': return <TrendingUp className="h-4 w-4" />
      case 'low': return <TrendingDown className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return '正常'
      case 'high': return '偏高'
      case 'low': return '偏低'
      case 'critical': return '严重异常'
      default: return '需要关注'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'normal': return 'default' as const
      case 'high': return 'destructive' as const
      case 'low': return 'secondary' as const
      case 'critical': return 'destructive' as const
      default: return 'outline' as const
    }
  }

  return (
    <Card 
      className={`relative transition-all duration-300 ${
        isAIMode 
          ? 'cursor-pointer hover:shadow-xl hover:shadow-purple-200/50 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 border-2 border-purple-300 dark:border-purple-700 hover:scale-[1.02]' 
          : 'hover:shadow-lg hover:scale-[1.01]'
      } ${
        priority === 'high' && indicator.status !== 'normal' 
          ? 'ring-2 ring-amber-200 dark:ring-amber-800 shadow-lg' 
          : ''
      }`}
      onClick={() => isAIMode && onAIExplain && onAIExplain(indicator)}
    >
      {/* AI模式指示器 */}
      {isAIMode && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-1.5 rounded-full z-10 shadow-lg animate-pulse">
          <Brain className="h-3 w-3" />
        </div>
      )}
      
      {/* 优先级指示器 */}
      {priority === 'high' && indicator.status !== 'normal' && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
      )}
      
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* 指标名称和状态 */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
              {indicator.name}
            </h4>
            <Badge variant={getStatusBadgeVariant(indicator.status)} className="text-xs font-medium">
              {getStatusIcon(indicator.status)}
              <span className="ml-1">{getStatusText(indicator.status)}</span>
            </Badge>
          </div>
          
          {/* 数值显示 - 更大更突出 */}
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${
              indicator.status === 'normal' ? 'text-gray-900 dark:text-gray-100' :
              indicator.status === 'high' ? 'text-red-600' :
              indicator.status === 'low' ? 'text-blue-600' :
              'text-red-700'
            }`}>
              {indicator.value}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {indicator.unit}
            </span>
          </div>
          
          {/* 参考范围 */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
            参考范围：{indicator.normalRange}
          </div>
          
          {/* 状态说明 */}
          {indicator.status !== 'normal' ? (
            <div className={`p-3 rounded-lg text-xs ${getStatusColor(indicator.status)}`}>
              <div className="flex items-center gap-2">
                {getStatusIcon(indicator.status)}
                <span className="font-medium">
                  {indicator.status === 'high' ? '数值偏高，建议关注并咨询医生' :
                   indicator.status === 'low' ? '数值偏低，建议关注并咨询医生' :
                   indicator.status === 'critical' ? '数值严重异常，建议立即就医' :
                   '数值异常，建议咨询专业医生'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">指标正常，继续保持健康生活方式</span>
              </div>
            </div>
          )}
          
          {/* AI解读提示 */}
          {isAIMode && (
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs">
              <Brain className="h-3 w-3" />
              <span>点击获取AI专业解读</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default HealthIndicatorsSection 