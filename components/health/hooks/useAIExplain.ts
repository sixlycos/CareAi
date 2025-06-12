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
      // 【调用场景：单个健康指标快速解读服务】+【Azure OpenAI Chat Completions API - 指标解读助手】
      // 构建解读请求
      const explainPrompt = `请为以下健康指标提供个性化解读：

指标名称：${indicator.name}
测量值：${indicator.value} ${indicator.unit}
参考范围：${indicator.normalRange}
状态：${indicator.status}

请按以下格式回答，不要使用任何markdown格式（如**粗体**、*斜体*、#标题等）：

指标含义：
这个指标代表什么，有什么医学意义

当前状态：
您的检测结果${indicator.value}${indicator.unit}在参考范围${indicator.normalRange}中的位置，是否达标

关注建议：
如果需要关注，具体应该检查什么项目，或者采取什么措施

请用通俗易懂的中文，每个部分控制在2-3句话以内。语气专业但温和友善。`

      // 【调用场景：单个健康指标快速解读服务】+【Azure OpenAI Chat Completions API - 指标解读助手】
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