'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, History, User, Sparkles, X, ChevronRight } from 'lucide-react'
import AzureHealthAISystem, { type HealthIndicator } from '@/lib/agents/azure-health-ai-system'
import { HealthDatabaseClient } from '@/lib/supabase/database-client'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  age?: number
  gender?: string
  medicalHistory?: string[]
  completed: boolean
}

interface InsightRecord {
  id: string
  indicator: HealthIndicator
  explanation: string
  timestamp: Date
}

interface AIInsightPanelProps {
  indicators: HealthIndicator[]
  azureAI: AzureHealthAISystem
  isVisible: boolean
}

export default function AIInsightPanel({ indicators, azureAI, isVisible }: AIInsightPanelProps) {
  const [isActive, setIsActive] = useState(false)
  const [selectedIndicator, setSelectedIndicator] = useState<HealthIndicator | null>(null)
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null)
  const [isExplaining, setIsExplaining] = useState(false)
  const [insightHistory, setInsightHistory] = useState<InsightRecord[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile>({ completed: false })
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // 初始化用户档案
  useEffect(() => {
    loadUserProfile()
    loadInsightHistory()
  }, [])

  const loadUserProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const healthDB = new HealthDatabaseClient()
      const profile = await healthDB.getUserProfile(user.id)
      
      if (profile?.preferences) {
        const prefs = profile.preferences as any
        setUserProfile({
          age: prefs.age,
          gender: prefs.gender,
          medicalHistory: prefs.medicalHistory || [],
          completed: !!(prefs.age && prefs.gender)
        })
      }
    } catch (error) {
      console.error('加载用户档案失败:', error)
    }
  }

  const loadInsightHistory = () => {
    // 从localStorage加载解读历史（临时方案，后续可以存到数据库）
    const saved = localStorage.getItem('ai-insight-history')
    if (saved) {
      try {
        const history = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setInsightHistory(history)
      } catch (error) {
        console.error('加载解读历史失败:', error)
      }
    }
  }

  const saveInsightHistory = (newRecord: InsightRecord) => {
    const updatedHistory = [newRecord, ...insightHistory].slice(0, 10) // 只保留最近10条
    setInsightHistory(updatedHistory)
    localStorage.setItem('ai-insight-history', JSON.stringify(updatedHistory))
  }

  const handleIndicatorSelect = async (indicator: HealthIndicator) => {
    if (!azureAI) return

    setSelectedIndicator(indicator)
    setIsExplaining(true)
    setCurrentExplanation(null)

    try {
      // 检查用户档案完整性
      if (!userProfile.completed) {
        setShowProfileSetup(true)
        setIsExplaining(false)
        return
      }

      // 构建个性化解读请求
      const contextInfo = `
用户信息：
- 年龄：${userProfile.age}岁
- 性别：${userProfile.gender}
- 既往病史：${userProfile.medicalHistory?.length ? userProfile.medicalHistory.join('、') : '无'}

检查指标：
- 指标名称：${indicator.name}
- 测量值：${indicator.value} ${indicator.unit}
- 参考范围：${indicator.normalRange}
- 状态：${indicator.status === 'normal' ? '正常' : indicator.status === 'high' ? '偏高' : indicator.status === 'low' ? '偏低' : '异常'}
`

      const explainPrompt = `${contextInfo}

请基于以上用户信息和检查指标，提供个性化的健康解读。

请按以下格式回答，不要使用任何markdown格式（如**粗体**、*斜体*、#标题等）：

指标含义：
这个指标代表什么，有什么医学意义

当前状态：
您的检测结果${indicator.value}${indicator.unit}在参考范围${indicator.normalRange}中的位置，是否达标，结合您的年龄${userProfile.age}岁、性别${userProfile.gender}来看

关注建议：
如果需要关注，具体应该检查什么项目，或者采取什么措施，基于您的个人情况给出建议

请用通俗易懂的中文，每个部分控制在2-3句话以内。语气专业但温和友善。`

      const explanation = await azureAI.healthChat(explainPrompt, {
        indicator,
        userProfile
      })

      setCurrentExplanation(explanation)

      // 保存到历史记录
      const record: InsightRecord = {
        id: Date.now().toString(),
        indicator,
        explanation,
        timestamp: new Date()
      }
      saveInsightHistory(record)

    } catch (error) {
      console.error('AI解读失败:', error)
      setCurrentExplanation('抱歉，AI解读功能暂时不可用，请稍后重试。')
    } finally {
      setIsExplaining(false)
    }
  }

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const healthDB = new HealthDatabaseClient()
      await healthDB.updateUserProfile(user.id, {
        preferences: {
          ...profileData,
          updatedAt: new Date().toISOString()
        }
      })

      setUserProfile(prev => ({
        ...prev,
        ...profileData,
        completed: !!(profileData.age && profileData.gender)
      }))
      setShowProfileSetup(false)
    } catch (error) {
      console.error('更新用户档案失败:', error)
    }
  }

  if (!isVisible || indicators.length === 0) return null

  return (
    <>
      {/* AI解读面板 */}
      <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2">
        {/* 模式切换和状态 */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              isActive 
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Brain className="h-3 w-3" />
            {isActive ? '解读中' : 'AI解读'}
          </button>
          
          {isActive && (
            <div className="flex gap-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                title="解读历史"
              >
                <History className="h-3 w-3" />
              </button>
              <button
                onClick={() => setShowProfileSetup(true)}
                className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                title="用户设置"
              >
                <User className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* 解读内容区域 */}
        {isActive && (
          <div className="space-y-2">
            {/* 用户档案状态 */}
            {!userProfile.completed && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                  完善个人信息获得更准确的解读
                </div>
                <button
                  onClick={() => setShowProfileSetup(true)}
                  className="text-xs text-yellow-600 hover:text-yellow-800 underline"
                >
                  立即设置 →
                </button>
              </div>
            )}

            {/* 当前解读 */}
            {selectedIndicator ? (
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    {selectedIndicator.name}
                  </div>
                  {currentExplanation && (
                    <button
                      onClick={() => setShowDetailModal(true)}
                      className="text-xs text-purple-600 hover:text-purple-800"
                    >
                      详情 <ChevronRight className="h-3 w-3 inline" />
                    </button>
                  )}
                </div>
                
                {isExplaining ? (
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 border border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-500">AI分析中...</span>
                  </div>
                ) : currentExplanation ? (
                  <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {currentExplanation.substring(0, 60)}...
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="p-2 text-xs text-gray-500 text-center">
                点击健康指标卡片获取AI解读
              </div>
            )}

            {/* 解读历史 */}
            {showHistory && insightHistory.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded">
                {insightHistory.slice(0, 5).map((record) => (
                  <button
                    key={record.id}
                    onClick={() => {
                      setSelectedIndicator(record.indicator)
                      setCurrentExplanation(record.explanation)
                      setShowHistory(false)
                    }}
                    className="w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="text-xs font-medium">{record.indicator.name}</div>
                    <div className="text-xs text-gray-500">
                      {record.timestamp.toLocaleTimeString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 详细解读模态框 */}
      {showDetailModal && currentExplanation && selectedIndicator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="max-w-md w-full max-h-[80vh] overflow-y-auto">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI智能解读
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="font-medium text-sm">{selectedIndicator.name}</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {selectedIndicator.value} {selectedIndicator.unit}
                  </div>
                  <div className="text-xs text-gray-500">
                    参考范围：{selectedIndicator.normalRange}
                  </div>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {currentExplanation}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 用户档案设置模态框 */}
      {showProfileSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">完善个人信息</h3>
                <button
                  onClick={() => setShowProfileSetup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  updateUserProfile({
                    age: parseInt(formData.get('age') as string),
                    gender: formData.get('gender') as string,
                    medicalHistory: (formData.get('history') as string)
                      .split('，').filter(Boolean)
                  })
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">年龄</label>
                  <input
                    type="number"
                    name="age"
                    defaultValue={userProfile.age}
                    className="w-full px-3 py-2 border rounded text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">性别</label>
                  <select
                    name="gender"
                    defaultValue={userProfile.gender}
                    className="w-full px-3 py-2 border rounded text-sm"
                    required
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    既往病史 <span className="text-xs text-gray-500">(用逗号分隔，可留空)</span>
                  </label>
                  <input
                    type="text"
                    name="history"
                    defaultValue={userProfile.medicalHistory?.join('，')}
                    placeholder="如：高血压，糖尿病"
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-2 rounded text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  保存设置
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// 导出钩子函数供父组件使用
export const useAIInsight = () => {
  const [isActive, setIsActive] = useState(false)
  
  const handleIndicatorClick = (
    indicator: HealthIndicator, 
    onSelect: (indicator: HealthIndicator) => void
  ) => {
    if (isActive) {
      onSelect(indicator)
    }
  }

  return {
    isActive,
    setIsActive,
    handleIndicatorClick
  }
} 