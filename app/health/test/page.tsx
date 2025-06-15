'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TestTube, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import AzureHealthAISystem from '@/lib/agents/azure-health-ai-system'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  duration?: number
}

export default function AzureAITestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'Vision 连接测试', status: 'pending' },
    { name: '健康指标解析测试', status: 'pending' },
    { name: '健康分析测试', status: 'pending' },
    { name: '健康问答测试', status: 'pending' }
  ])
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)

  // 初始化Azure AI系统
  const azureAI = new AzureHealthAISystem({
    azureOpenAIEndpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '',
    azureOpenAIKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY || '',
    azureOpenAIVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_VERSION || '2024-02-15-preview',
    azureOpenAIDeployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || '',
    azureVisionEndpoint: process.env.NEXT_PUBLIC_AZURE_VISION_ENDPOINT || '',
    azureVisionKey: process.env.NEXT_PUBLIC_AZURE_VISION_KEY || ''
  })

  const updateTestResult = (index: number, status: TestResult['status'], message?: string, duration?: number) => {
    setTestResults(prev => 
      prev.map((test, i) => 
        i === index ? { ...test, status, message, duration } : test
      )
    )
  }

  const runAllTests = async () => {
    setIsTestRunning(true)
    setOverallProgress(0)

    try {
      // Test 1: Azure OpenAI 连接测试
      updateTestResult(0, 'running')
      const startTime1 = Date.now()
      
      try {
        const testMessages = [
          { role: 'user', content: '你好，请简单回复确认连接正常' }
        ]
        await azureAI['callAzureOpenAI'](testMessages, 'gpt-4.1', 100)
        const duration1 = Date.now() - startTime1
        updateTestResult(0, 'success', 'Azure OpenAI 连接正常', duration1)
      } catch (error) {
        updateTestResult(0, 'error', `连接失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
      
      setOverallProgress(20)

      // Test 2: Azure Computer Vision 连接测试 (模拟)
      updateTestResult(1, 'running')
      const startTime2 = Date.now()
      
      try {
        // 创建一个简单的测试图片 (1x1 像素的白色PNG)
        const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
        const blob = await fetch(testImageData).then(r => r.blob())
        const testFile = new File([blob], 'test.png', { type: 'image/png' })
        
        // 这个测试可能会失败，因为我们需要真实的图片内容
        // 但可以测试API端点的可达性
        await azureAI.extractTextFromImage(testFile, 1)
        const duration2 = Date.now() - startTime2
        updateTestResult(1, 'success', 'Azure Computer Vision 连接正常', duration2)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        if (errorMsg.includes('未能从图片中提取到文字')) {
          updateTestResult(1, 'success', 'Azure Computer Vision 端点可达 (测试图片无文字内容)')
        } else {
          updateTestResult(1, 'error', `连接失败: ${errorMsg}`)
        }
      }
      
      setOverallProgress(40)

      // Test 3: 健康指标解析测试
      updateTestResult(2, 'running')
      const startTime3 = Date.now()
      
      try {
        const testTextArray = [
          '血常规检查结果',
          '白细胞计数 WBC: 6.2 x10^9/L (正常范围: 4.0-10.0)',
          '红细胞计数 RBC: 4.5 x10^12/L (正常范围: 4.0-5.5)',
          '血红蛋白 HGB: 140 g/L (正常范围: 120-160)',
          '血小板计数 PLT: 250 x10^9/L (正常范围: 100-300)'
        ]
        
        const indicators = await azureAI.parseHealthIndicators(testTextArray)
        const duration3 = Date.now() - startTime3
        updateTestResult(3, 'success', `成功解析 ${indicators.length} 个健康指标`, duration3)
      } catch (error) {
        updateTestResult(3, 'error', `解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
      
      setOverallProgress(60)

      // Test 4: 健康分析测试
      updateTestResult(3, 'running')
      const startTime4 = Date.now()
      
      try {
        const mockIndicators = [
          { name: '白细胞计数', value: '6.2', unit: 'x10^9/L', normalRange: '4.0-10.0', status: 'normal' as const },
          { name: '血红蛋白', value: '140', unit: 'g/L', normalRange: '120-160', status: 'normal' as const }
        ]
        const mockUserProfile = { age: 35, gender: '男', medicalHistory: '无' }
        
        const analysis = await azureAI.analyzeHealthData(mockIndicators, mockUserProfile)
        const duration4 = Date.now() - startTime4
        updateTestResult(3, 'success', `健康分析完成，得分: ${analysis.healthScore}`, duration4)
      } catch (error) {
        updateTestResult(3, 'error', `分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
      
      setOverallProgress(80)

      // Test 5: 健康问答测试
      updateTestResult(4, 'running')
      const startTime5 = Date.now()
      
      try {
        const mockContext = {
          age: 35,
          gender: '男',
          latestHealthStatus: '良好',
          healthScore: 85
        }
        
        const response = await azureAI.healthChat('我的血压正常吗？', mockContext)
        const duration5 = Date.now() - startTime5
        updateTestResult(4, 'success', `AI问答正常 (${response.length} 字符)`, duration5)
      } catch (error) {
        updateTestResult(4, 'error', `问答失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
      
      setOverallProgress(100)

    } catch (error) {
      console.error('测试过程中出现错误:', error)
    } finally {
      setIsTestRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary">运行中</Badge>
      case 'success':
        return <Badge className="bg-green-100 text-green-800">成功</Badge>
      case 'error':
        return <Badge variant="destructive">失败</Badge>
      default:
        return <Badge variant="outline">待测试</Badge>
    }
  }

  const successCount = testResults.filter(t => t.status === 'success').length
  const errorCount = testResults.filter(t => t.status === 'error').length

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Azure AI 系统测试</h1>
        <p className="text-gray-600">验证 Azure OpenAI 和 Computer Vision 服务集成</p>
      </div>

      {/* 测试概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            测试概览
          </CardTitle>
          <CardDescription>
            测试 Azure AI 服务的连接性和功能完整性
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{testResults.length}</div>
              <div className="text-sm text-blue-600">总测试项</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-green-600">成功</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-red-600">失败</div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>总体进度</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} />
          </div>

          <Button 
            onClick={runAllTests} 
            disabled={isTestRunning}
            className="w-full"
          >
            {isTestRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                测试进行中...
              </>
            ) : (
              '开始测试'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 详细测试结果 */}
      <Card>
        <CardHeader>
          <CardTitle>详细测试结果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    {test.message && (
                      <div className="text-sm text-gray-600">{test.message}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {test.duration && (
                    <span className="text-xs text-gray-500">{test.duration}ms</span>
                  )}
                  {getStatusBadge(test.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 配置信息 */}
      <Card>
        <CardHeader>
          <CardTitle>配置信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Azure OpenAI:</strong>
              <div className="text-gray-600 font-mono break-all">
                {process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '未配置'}
              </div>
            </div>
            <div>
              <strong>部署名称:</strong>
              <div className="text-gray-600 font-mono">
                {process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || '未配置'}
              </div>
            </div>
            <div>
              <strong>API 版本:</strong>
              <div className="text-gray-600 font-mono">
                {process.env.NEXT_PUBLIC_AZURE_OPENAI_VERSION || '未配置'}
              </div>
            </div>
            <div>
              <strong>Computer Vision:</strong>
              <div className="text-gray-600 font-mono break-all">
                {process.env.NEXT_PUBLIC_AZURE_VISION_ENDPOINT || '未配置'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>说明：</strong> 此页面用于测试 Azure AI 服务的集成。请确保在 .env.local 文件中配置了正确的 Azure OpenAI 和 Computer Vision 服务凭据。
        </AlertDescription>
      </Alert>
    </div>
  )
} 