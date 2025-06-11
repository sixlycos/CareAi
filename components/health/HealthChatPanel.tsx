'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageCircle, Send, Bot, User, Loader2, AlertCircle } from 'lucide-react'
import AzureHealthAISystem, { type AnalysisResult } from '@/lib/agents/azure-health-ai-system'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface HealthChatPanelProps {
  analysisResult: AnalysisResult
  userProfile: any
  azureAI: AzureHealthAISystem
}

export default function HealthChatPanel({
  analysisResult,
  userProfile,
  azureAI
}: HealthChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `您好！我是您的专属健康AI助手。基于您的体检报告分析，我可以为您解答关于健康状况的各种问题。

您的当前健康概况：
• 整体状况：${analysisResult.overallStatus}
• 健康得分：${analysisResult.healthScore}/100
• 异常指标：${analysisResult.abnormalIndicators.length} 项

请随时向我咨询任何健康相关的问题！`,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      // 构建用户上下文
      const userContext = {
        ...userProfile,
        latestHealthStatus: analysisResult.overallStatus,
        healthScore: analysisResult.healthScore,
        abnormalIndicators: analysisResult.abnormalIndicators,
        recommendations: analysisResult.recommendations
      }

      // 获取聊天历史（最近6条消息）
      const chatHistory = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await azureAI.healthChat(inputValue, userContext, chatHistory)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '出现未知错误'
      setError(errorMessage)
      
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我现在无法回答您的问题。如果您有紧急健康问题，请及时就医。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getCommonQuestions = () => [
    '我的体检结果整体怎么样？',
    '哪些指标需要特别注意？',
    '我应该如何改善生活方式？',
    '饮食方面有什么建议吗？',
    '需要做哪些运动？',
    '什么时候需要复查？'
  ]

  const handleQuickQuestion = (question: string) => {
    setInputValue(question)
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI健康咨询
        </CardTitle>
        <CardDescription>
          基于您的体检报告，向AI助手咨询健康问题
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* 错误提示 */}
        {error && (
          <div className="px-6 pb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-green-500 text-white'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className={`flex-1 max-w-[85%] ${
                message.role === 'user' ? 'flex flex-col items-end' : ''
              }`}>
                <div className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${
                  message.role === 'user' ? 'text-right' : ''
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI正在思考...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 快捷问题 */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm text-gray-600 mb-3">常见问题：</div>
            <div className="flex flex-wrap gap-2">
              {getCommonQuestions().map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="询问任何关于您健康状况的问题..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            按 Enter 发送，Shift + Enter 换行
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 