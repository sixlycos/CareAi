'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { Brain, Send, X, MessageCircle, Sparkles } from 'lucide-react'
import AzureHealthAISystem from '@/lib/agents/azure-health-ai-system'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  suggestedQuestions?: string[]
}

interface AIFloatingDialogProps {
  isOpen: boolean
  onClose: () => void
  position: { x: number; y: number }
  initialContext?: {
    indicator?: any
    question?: string
    userProfile?: any
  }
  onAIQuery?: (question: string, context?: any) => Promise<string>
}

export default function AIFloatingDialog({
  isOpen,
  onClose,
  position,
  initialContext,
  onAIQuery
}: AIFloatingDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [floatingPosition, setFloatingPosition] = useState(position)
  const [userProfile, setUserProfile] = useState<any>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [azureAI] = useState(() => new AzureHealthAISystem({
    azureOpenAIEndpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '',
    azureOpenAIKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY || '',
    azureOpenAIVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_VERSION || '2024-02-15-preview',
    azureOpenAIDeployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || '',
    azureVisionEndpoint: process.env.NEXT_PUBLIC_AZURE_VISION_ENDPOINT || '',
    azureVisionKey: process.env.NEXT_PUBLIC_AZURE_VISION_KEY || ''
  }))

  // 获取用户档案
  const getUserProfile = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      return profile
    } catch (error) {
      console.error('获取用户档案失败:', error)
      return null
    }
  }

  // 初始化时获取用户档案
  useEffect(() => {
    const initUserProfile = async () => {
      if (isOpen) {
        console.log('🔍 [AIFloatingDialog] 初始化用户档案...')
        const profile = await getUserProfile()
        setUserProfile(profile)
        console.log('👤 [AIFloatingDialog] 用户档案获取完成:', profile ? '已获取' : '未获取')
      }
    }
    initUserProfile()
  }, [isOpen])

  // 使用Azure AI生成解读
  const generateAIAnalysis = async (context: any): Promise<string> => {
    try {
      console.log('🔍 [AIFloatingDialog] 开始生成AI解读:', context);
      
      // 检查是否是数值类型的健康指标
      if (context.value !== undefined && context.name) {
        // 数值类型指标，构建健康指标对象
        const healthIndicator = {
          name: context.name,
          value: context.value,
          unit: context.unit || '',
          normalRange: context.referenceRange || context.normalRange || '未知',
          status: context.status || 'unknown'
        }
        
        // 使用Azure AI健康问答功能
        const question = `请为我解读这个健康指标：${healthIndicator.name}，检测值是${healthIndicator.value}${healthIndicator.unit}，参考范围是${healthIndicator.normalRange}，状态是${healthIndicator.status}。

请按以下格式回答，不要使用任何markdown格式（如**粗体**、*斜体*、#标题等）：

指标含义：
这个指标代表什么，有什么医学意义

当前状态：
您的检测结果${healthIndicator.value}${healthIndicator.unit}在参考范围${healthIndicator.normalRange}中的位置，是否达标

关注建议：
如果需要关注，具体应该检查什么项目，或者采取什么措施

请用通俗易懂的中文，每个部分控制在2-3句话以内。语气专业但温和友善。`
        
        // 【调用场景：浮窗对话中的健康指标智能解读】+【AI Chat Completions API - 对话式指标分析】
        // 使用获取到的用户档案
        console.log('📤 [AIFloatingDialog] 发送健康指标解读请求到Azure AI');
        console.log('👤 [AIFloatingDialog] 使用用户档案:', userProfile ? '已获取' : '未获取');
        
        const response = await azureAI.healthChat(question, userProfile);
        console.log('✅ [AIFloatingDialog] 健康指标解读完成，响应长度:', response.length);
        return response;
      } else if (typeof context === 'string') {
        // 文字解读信息，直接使用AI分析
        const question = `请帮我分析这个健康检查结果：${context}。

请按以下格式回答，不要使用任何markdown格式（如**粗体**、*斜体*、#标题等）：

检查含义：
这个检查项目的意义和作用

结果分析：
当前结果的具体状况和评估

关注建议：
如果需要关注，具体应该检查什么项目，或者采取什么措施

请用通俗易懂的中文，每个部分控制在2-3句话以内。语气专业但温和友善。`
        
        // 【调用场景：浮窗对话中的文字解读分析】+【AI Chat Completions API - 文本内容智能分析】
        console.log('📤 [AIFloatingDialog] 发送文字解读请求到Azure AI');
        console.log('👤 [AIFloatingDialog] 使用用户档案:', userProfile ? '已获取' : '未获取');
        
        const response = await azureAI.healthChat(question, userProfile);
        console.log('✅ [AIFloatingDialog] 文字解读完成，响应长度:', response.length);
        return response;
      } else if (context.description || context.result) {
        // 对象包含描述或结果字段
        const analysisText = context.description || context.result || JSON.stringify(context)
        const question = `请帮我分析这个健康检查结果：${analysisText}。

请按以下格式回答，不要使用任何markdown格式（如**粗体**、*斜体*、#标题等）：

检查含义：
这个检查项目的意义和作用

结果分析：
当前结果的具体状况和评估

关注建议：
如果需要关注，具体应该检查什么项目，或者采取什么措施

请用通俗易懂的中文，每个部分控制在2-3句话以内。语气专业但温和友善。`
        
        // 【调用场景：浮窗对话中的对象数据解读】+【AI Chat Completions API - 结构化数据智能解析】
        console.log('📤 [AIFloatingDialog] 发送对象解读请求到Azure AI');
        console.log('👤 [AIFloatingDialog] 使用用户档案:', userProfile ? '已获取' : '未获取');
        
        const response = await azureAI.healthChat(question, userProfile);
        console.log('✅ [AIFloatingDialog] 对象解读完成，响应长度:', response.length);
        return response;
      } else {
        // 降级到本地分析
        return generateBasicAnalysis(context)
      }
    } catch (error) {
      console.error('Azure AI分析失败:', error)
      return generateBasicAnalysis(context)
    }
  }

  // 生成基本解读和相关问题（备用方案）
  const generateBasicAnalysis = (indicator: any) => {
    const status = indicator.status || 'unknown'
    const value = indicator.value
    const unit = indicator.unit || ''
    const referenceRange = indicator.referenceRange || '未知'
    
    let analysis = `🔍 ${indicator.name} 解读\n\n`
    analysis += `📊 检测值：${value}${unit}\n`
    analysis += `📏 参考范围：${referenceRange}\n\n`
    
    if (status === 'normal') {
      analysis += `✅ 结果评估：正常范围内\n恭喜！您的${indicator.name}指标在正常范围内，表明这项健康指标良好。`
    } else if (status === 'high') {
      analysis += `⚠️ 结果评估：偏高\n您的${indicator.name}指标高于正常范围，建议关注并采取相应措施。`
    } else if (status === 'low') {
      analysis += `⚠️ 结果评估：偏低\n您的${indicator.name}指标低于正常范围，建议关注并采取相应措施。`
    } else {
      analysis += `❓ 结果评估：需要进一步分析\n让我为您详细解读这个指标的意义。`
    }
    
    return analysis
  }

  const generateSuggestedQuestions = (context: any) => {
    // 如果是字符串类型的内容
    if (typeof context === 'string') {
      return [
        '这个结果意味着什么？',
        '我需要注意什么？',
        '有什么改善建议？'
      ]
    }
    
    // 如果有描述或结果字段
    if (context.description || context.result) {
      return [
        '这个检查结果正常吗？',
        '我需要进一步检查吗？',
        '有什么注意事项？'
      ]
    }
    
    // 数值类型指标
    const indicatorName = context.name || ''
    const commonQuestions = [
      `${indicatorName}异常会有什么症状？`,
      `如何改善${indicatorName}指标？`,
      `${indicatorName}与哪些疾病相关？`
    ]
    
    // 根据指标类型生成特定问题
    const lowerName = indicatorName.toLowerCase()
    let specificQuestions = []
    
    if (lowerName.includes('血糖') || lowerName.includes('glucose')) {
      specificQuestions = [
        '饮食对血糖有什么影响？',
        '运动如何帮助控制血糖？',
        '血糖波动的原因是什么？'
      ]
    } else if (lowerName.includes('胆固醇') || lowerName.includes('cholesterol')) {
      specificQuestions = [
        '如何通过饮食降低胆固醇？',
        '胆固醇高会增加哪些风险？',
        '需要服用降脂药物吗？'
      ]
    } else if (lowerName.includes('血压') || lowerName.includes('pressure')) {
      specificQuestions = [
        '高血压的生活方式调整建议？',
        '血压波动正常吗？',
        '什么时候需要药物治疗？'
      ]
    } else if (lowerName.includes('肝') || lowerName.includes('alt') || lowerName.includes('ast')) {
      specificQuestions = [
        '肝功能异常的常见原因？',
        '如何保护肝脏健康？',
        '需要进一步检查吗？'
      ]
    }
    
    return specificQuestions.length > 0 ? specificQuestions : commonQuestions
  }

  // 初始化对话
  useEffect(() => {
    const initializeDialog = async () => {
      if (isOpen && initialContext) {
        if (initialContext.indicator) {
          setIsLoading(true)
          
          try {
            // 使用Azure AI生成基本解读
            const basicAnalysis = await generateAIAnalysis(initialContext.indicator)
            const suggestedQuestions = generateSuggestedQuestions(initialContext.indicator)
            
            const analysisMessage: Message = {
              id: Date.now().toString(),
              type: 'ai',
              content: basicAnalysis,
              timestamp: new Date()
            }
            
            const questionsMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: 'ai',
              content: 'SUGGESTED_QUESTIONS',
              timestamp: new Date(),
              suggestedQuestions: suggestedQuestions
            }
            
            setMessages([analysisMessage, questionsMessage])
          } catch (error) {
            console.error('AI分析失败:', error)
            // 降级到本地分析
            const fallbackAnalysis = generateBasicAnalysis(initialContext.indicator)
            const suggestedQuestions = generateSuggestedQuestions(initialContext.indicator)
            
            const analysisMessage: Message = {
              id: Date.now().toString(),
              type: 'ai',
              content: fallbackAnalysis,
              timestamp: new Date()
            }
            
            const questionsMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: 'ai',
              content: 'SUGGESTED_QUESTIONS',
              timestamp: new Date(),
              suggestedQuestions: suggestedQuestions
            }
            
            setMessages([analysisMessage, questionsMessage])
          } finally {
            setIsLoading(false)
          }
        } else {
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: '您好！我是您的AI健康助手，有什么健康问题想咨询吗？',
            timestamp: new Date()
          }
          setMessages([welcomeMessage])
        }
        
        // 自动聚焦输入框
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }
    }

    initializeDialog()
  }, [isOpen, initialContext])

  // 调整浮窗位置避免超出屏幕
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const dialog = dialogRef.current
      const rect = dialog.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      let newX = position.x
      let newY = position.y
      
      // 避免右侧超出
      if (newX + 520 > viewportWidth) {
        newX = viewportWidth - 540
      }
      
      // 避免左侧超出
      if (newX < 20) {
        newX = 20
      }
      
      // 避免底部超出
      if (newY + 640 > viewportHeight) {
        newY = viewportHeight - 660
      }
      
      // 避免顶部超出
      if (newY < 20) {
        newY = 20
      }
      
      setFloatingPosition({ x: newX, y: newY })
    }
  }, [isOpen, position])

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue.trim()
    if (!messageToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    if (!message) setInputValue('')
    setIsLoading(true)

    try {
      console.log('💬 [AIFloatingDialog] 处理用户消息:', messageToSend);
      
      // 优先使用内置AI服务
      let aiResponse: string
      
      if (onAIQuery) {
        // 如果有外部AI查询函数，使用它
        console.log('🔄 [AIFloatingDialog] 使用外部AI查询函数');
        aiResponse = await onAIQuery(messageToSend, initialContext)
      } else {
        // 【调用场景：浮窗对话中的用户自由提问交互】+【AI Chat Completions API - 开放式健康问答】
        // 使用获取到的用户档案
        console.log('🤖 [AIFloatingDialog] 使用内置Azure AI服务');
        console.log('👤 [AIFloatingDialog] 使用用户档案:', userProfile ? '已获取' : '未获取');
        
        aiResponse = await azureAI.healthChat(messageToSend, userProfile)
      }
      
      console.log('✅ [AIFloatingDialog] AI回复成功，长度:', aiResponse.length);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI回复失败:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '抱歉，我遇到了一些问题。请稍后再试。如果问题持续，请检查网络连接或稍后重试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 处理点击建议问题
  const handleQuestionClick = (question: string) => {
    handleSendMessage(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* 浮窗对话框 */}
      <div
        ref={dialogRef}
        className="fixed z-50 animate-in slide-in-from-bottom-2 duration-200"
        style={{
          left: floatingPosition.x,
          top: floatingPosition.y,
          width: '520px',
          maxHeight: '640px'
        }}
      >
        <Card className="shadow-2xl border-2 border-blue-200/50 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-full">
                  <Brain className="h-5 w-5" />
                </div>
                AI健康助手
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* 消息区域 */}
            <div className="h-96 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white ml-4'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-4'
                      }`}
                    >
                      {message.type === 'ai' && (
                        <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                          <MessageCircle className="h-3 w-3" />
                          AI助手
                        </div>
                      )}
                                             {message.content === 'SUGGESTED_QUESTIONS' ? (
                         <div className="space-y-3">
                           <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                             💡 您可能想了解的问题：
                           </div>
                           <div className="space-y-2">
                             {message.suggestedQuestions?.map((question, index) => (
                               <button
                                 key={index}
                                 onClick={() => handleQuestionClick(question)}
                                 className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-all duration-200 text-sm text-blue-800 dark:text-blue-200 hover:shadow-sm"
                               >
                                 <span className="text-blue-600 dark:text-blue-400 font-medium">Q{index + 1}:</span> {question}
                               </button>
                             ))}
                           </div>
                         </div>
                       ) : (
                         <div className="whitespace-pre-wrap">{message.content}</div>
                       )}
                      <div className={`text-xs mt-1 opacity-60 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 mr-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                        {messages.length === 0 ? 'AI正在分析您的健康指标...' : 'AI正在思考...'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 输入区域 */}
            <div className="border-t bg-gray-50/50 p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="问我任何健康问题..."
                  className="flex-1 border-gray-200 focus:border-blue-400"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                按 Enter 发送，Shift+Enter 换行
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 