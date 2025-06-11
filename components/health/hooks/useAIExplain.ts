import { useState } from 'react'
import AzureHealthAISystem, { type HealthIndicator } from '@/lib/agents/azure-health-ai-system'

export function useAIExplain(azureAI: AzureHealthAISystem) {
  const [aiExplainMode, setAiExplainMode] = useState(false)
  const [selectedIndicator, setSelectedIndicator] = useState<HealthIndicator | null>(null)
  const [indicatorExplanation, setIndicatorExplanation] = useState<string | null>(null)
  const [isExplaining, setIsExplaining] = useState(false)

  const handleIndicatorExplain = async (indicator: HealthIndicator) => {
    if (!azureAI) return
    
    setSelectedIndicator(indicator)
    setIsExplaining(true)
    setIndicatorExplanation(null)

    try {
      // 构建解读请求
      const explainPrompt = `请为以下健康指标提供个性化解读：

指标名称：${indicator.name}
测量值：${indicator.value} ${indicator.unit}
参考范围：${indicator.normalRange}
状态：${indicator.status}

请提供：
1. 这个指标的含义和重要性
2. 当前数值的评估
3. 针对性的健康建议
4. 需要注意的事项

请用通俗易懂的语言，不要超过200字。`

      // 调用AI获取解读
      const explanation = await azureAI.healthChat(explainPrompt, {
        indicator: indicator,
        userProfile: { age: 35, gender: '男' }
      })

      setIndicatorExplanation(explanation)
    } catch (error) {
      console.error('AI解读失败:', error)
      setIndicatorExplanation('抱歉，AI解读功能暂时不可用，请稍后重试。')
    } finally {
      setIsExplaining(false)
    }
  }

  const toggleAiExplainMode = () => {
    setAiExplainMode(!aiExplainMode)
    if (aiExplainMode) {
      // 关闭模式时清空选中状态
      setSelectedIndicator(null)
      setIndicatorExplanation(null)
    }
  }

  const resetExplain = () => {
    setSelectedIndicator(null)
    setIndicatorExplanation(null)
    setAiExplainMode(false)
  }

  return {
    aiExplainMode,
    selectedIndicator,
    indicatorExplanation,
    isExplaining,
    handleIndicatorExplain,
    toggleAiExplainMode,
    resetExplain
  }
} 