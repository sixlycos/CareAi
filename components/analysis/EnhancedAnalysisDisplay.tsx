'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Lightbulb,
  Heart,
  Shield,
  Target,
  Calendar,
  Utensils,
  Dumbbell,
  Stethoscope,
  TrendingUp,
  Info,
  Sparkles,
  Clock,
  User,
  Brain,
  Eye,
  Zap,
  FileText,
  ChevronRight,
  Star,
  Award,
  AlertCircle,
  BookOpen,
  Pill
} from 'lucide-react'

// 智能解析器 - 处理AI返回的各种格式
const intelligentAnalysisParser = (rawResponse: string) => {
  try {
    // 尝试解析JSON
    const parsed = JSON.parse(rawResponse)
    
    // 智能字段映射表
    const fieldMappings = {
      // 整体评估相关
      overallAssessment: ['整体评估', 'overall_assessment', 'overallAssessment', '总体评估'],
      healthStatus: ['健康状况', 'health_status', 'healthStatus', '健康状态'],
      healthScore: ['健康评分', 'health_score', 'healthScore', '评分', 'score'],
      riskLevel: ['风险等级', 'risk_level', 'riskLevel', '风险级别'],
      keyFindings: ['关键发现', 'key_findings', 'keyFindings', '主要发现', '重要发现'],
      
      // 专业解读相关
      professionalAnalysis: ['专业解读', 'professional_analysis', 'professionalAnalysis', '医学解读'],
      abnormalIndicators: ['异常指标分析', 'abnormal_indicators', 'abnormalIndicators'],
      systemAssessment: ['系统评估', 'system_assessment', 'systemAssessment'],
      
      // 个性化建议相关
      personalizedAdvice: ['个性化建议', 'personalized_advice', 'personalizedAdvice', '个人建议'],
      immediateActions: ['立即行动', 'immediate_actions', 'immediateActions', '即时建议'],
      lifestyleChanges: ['生活方式', 'lifestyle_changes', 'lifestyleChanges', '生活建议'],
      medicalAdvice: ['医疗建议', 'medical_advice', 'medicalAdvice'],
      
      // 风险预警相关
      riskWarning: ['风险预警', 'risk_warning', 'riskWarning', '风险提醒'],
      shortTermRisks: ['短期风险', 'short_term_risks', 'shortTermRisks'],
      longTermRisks: ['长期风险', 'long_term_risks', 'longTermRisks'],
      preventiveMeasures: ['预防措施', 'preventive_measures', 'preventiveMeasures'],
      
      // 健康规划相关
      healthPlanning: ['健康规划', 'health_planning', 'healthPlanning', '健康计划'],
      thirtyDayPlan: ['30天计划', 'thirty_day_plan', 'thirtyDayPlan', '近期计划'],
      threeMonthGoals: ['3个月目标', 'three_month_goals', 'threeMonthGoals', '中期目标'],
      longTermMaintenance: ['长期维护', 'long_term_maintenance', 'longTermMaintenance'],
      annualCheckup: ['年度体检', 'annual_checkup', 'annualCheckup']
    }
    
    // 智能提取函数
    const smartExtract = (obj: any, fieldNames: string[]): any => {
      if (!obj || typeof obj !== 'object') return null
      
      // 直接匹配
      for (const field of fieldNames) {
        if (obj[field] !== undefined) return obj[field]
      }
      
      // 递归搜索
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          const result = smartExtract(obj[key], fieldNames)
          if (result !== null) return result
        }
      }
      
      return null
    }
    
    const smartExtractArray = (obj: any, fieldNames: string[]): any[] => {
      const result = smartExtract(obj, fieldNames)
      if (Array.isArray(result)) return result
      if (typeof result === 'string') return [result]
      return []
    }
    
    const smartExtractString = (obj: any, fieldNames: string[]): string => {
      const result = smartExtract(obj, fieldNames)
      if (typeof result === 'string') return result
      if (typeof result === 'object' && result !== null) {
        return JSON.stringify(result)
      }
      return ''
    }
    
    const smartExtractNumber = (obj: any, fieldNames: string[]): number => {
      const result = smartExtract(obj, fieldNames)
      if (typeof result === 'number') return result
      if (typeof result === 'string') {
        const num = parseInt(result)
        if (!isNaN(num)) return num
      }
      return 0
    }
    
    // 解析结果
    return {
      // 整体评估
      overallAssessment: {
        healthStatus: smartExtractString(parsed, fieldMappings.healthStatus),
        healthScore: smartExtractNumber(parsed, fieldMappings.healthScore),
        riskLevel: smartExtractString(parsed, fieldMappings.riskLevel),
        keyFindings: smartExtractArray(parsed, fieldMappings.keyFindings)
      },
      
      // 专业解读
      professionalAnalysis: {
        abnormalIndicators: smartExtract(parsed, fieldMappings.abnormalIndicators) || {},
        systemAssessment: smartExtract(parsed, fieldMappings.systemAssessment) || {}
      },
      
      // 个性化建议
      personalizedAdvice: {
        immediateActions: smartExtractArray(parsed, fieldMappings.immediateActions),
        lifestyleChanges: smartExtract(parsed, fieldMappings.lifestyleChanges) || {},
        medicalAdvice: smartExtract(parsed, fieldMappings.medicalAdvice) || {}
      },
      
      // 风险预警
      riskWarning: {
        shortTermRisks: smartExtractArray(parsed, fieldMappings.shortTermRisks),
        longTermRisks: smartExtractArray(parsed, fieldMappings.longTermRisks),
        preventiveMeasures: smartExtractArray(parsed, fieldMappings.preventiveMeasures)
      },
      
      // 健康规划
      healthPlanning: {
        thirtyDayPlan: smartExtractArray(parsed, fieldMappings.thirtyDayPlan),
        threeMonthGoals: smartExtractArray(parsed, fieldMappings.threeMonthGoals),
        longTermMaintenance: smartExtractArray(parsed, fieldMappings.longTermMaintenance),
        annualCheckup: smartExtractArray(parsed, fieldMappings.annualCheckup)
      },
      
      // 原始数据备份
      rawData: parsed
    }
  } catch (error) {
    // JSON解析失败，使用文本模式解析
    console.warn('JSON解析失败，使用文本模式:', error)
    
    // 文本模式的正则表达式解析
    const extractSection = (text: string, sectionNames: string[]): string[] => {
      const results: string[] = []
      for (const name of sectionNames) {
        const regex = new RegExp(`${name}[：:](.*?)(?=\\n\\n|\\n[一二三四五六七八九十]|$)`, 'gs')
        const matches = text.match(regex)
        if (matches) {
          results.push(...matches.map(m => m.replace(/^[^：:]*[：:]/, '').trim()))
        }
      }
      return results
    }
    
    return {
      overallAssessment: {
        healthStatus: rawResponse.substring(0, 200) + '...',
        healthScore: 50, // 默认分数
        riskLevel: '中等风险',
        keyFindings: extractSection(rawResponse, ['关键发现', '主要发现'])
      },
      professionalAnalysis: {
        abnormalIndicators: {},
        systemAssessment: {}
      },
      personalizedAdvice: {
        immediateActions: extractSection(rawResponse, ['立即行动', '即时建议']),
        lifestyleChanges: {},
        medicalAdvice: {}
      },
      riskWarning: {
        shortTermRisks: extractSection(rawResponse, ['短期风险']),
        longTermRisks: extractSection(rawResponse, ['长期风险']),
        preventiveMeasures: extractSection(rawResponse, ['预防措施'])
      },
      healthPlanning: {
        thirtyDayPlan: extractSection(rawResponse, ['30天计划', '近期计划']),
        threeMonthGoals: extractSection(rawResponse, ['3个月目标', '中期目标']),
        longTermMaintenance: extractSection(rawResponse, ['长期维护']),
        annualCheckup: extractSection(rawResponse, ['年度体检'])
      },
      rawData: { text: rawResponse }
    }
  }
}

interface EnhancedAnalysisDisplayProps {
  analysis?: any // 保持向后兼容
  rawAIResponse: string // 现在这是必需的
}

export function EnhancedAnalysisDisplay({ analysis, rawAIResponse }: EnhancedAnalysisDisplayProps) {
  const [showRawResponse, setShowRawResponse] = useState(false)
  
  // 使用智能解析器处理AI响应
  const parsedAnalysis = intelligentAnalysisParser(rawAIResponse)
  
  const getHealthScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 55) return 'text-amber-600'
    return 'text-red-600'
  }

  const getHealthScoreGradient = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-green-500'
    if (score >= 70) return 'from-blue-500 to-cyan-500'
    if (score >= 55) return 'from-amber-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  const getRiskLevelColor = (riskLevel: string) => {
    if (riskLevel.includes('低') || riskLevel.includes('良好')) return 'bg-green-100 text-green-800 border-green-200'
    if (riskLevel.includes('中') || riskLevel.includes('一般')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (riskLevel.includes('高') || riskLevel.includes('严重')) return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getHealthMessage = (score: number) => {
    if (score >= 85) return { title: "健康状况优秀", message: "您的身体状态很棒！继续保持现有的健康习惯。", icon: "🎉" }
    if (score >= 70) return { title: "健康状况良好", message: "整体健康状况不错，有一些可以优化的地方。", icon: "😊" }
    if (score >= 55) return { title: "需要关注", message: "有几个指标需要您的关注，建议采取行动改善。", icon: "🤔" }
    return { title: "建议就医", message: "发现一些需要重点关注的问题，建议咨询专业医生。", icon: "⚠️" }
  }

  const healthMessage = getHealthMessage(parsedAnalysis.overallAssessment.healthScore)

  return (
    <div className="space-y-6">
      {/* 🎯 个性化健康概览 - 全新设计 */}
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900">
        <CardContent className="p-8">
          {/* 健康评分和状态 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl">{healthMessage.icon}</div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {healthMessage.title}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    {healthMessage.message}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge className={`px-3 py-1 ${getRiskLevelColor(parsedAnalysis.overallAssessment.riskLevel)}`}>
                      {parsedAnalysis.overallAssessment.riskLevel}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">AI专业分析</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 健康评分可视化 - 增强版 */}
            <div className="relative">
              <div className="w-40 h-40 relative">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                  {/* 背景圆环 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  {/* 进度圆环 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#healthGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(parsedAnalysis.overallAssessment.healthScore / 100) * 440} 440`}
                    className="transition-all duration-2000 ease-out"
                  />
                  <defs>
                    <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getHealthScoreColor(parsedAnalysis.overallAssessment.healthScore)}`}>
                      {parsedAnalysis.overallAssessment.healthScore}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">健康评分</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI智能洞察 - 增强版 */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl text-white shadow-lg">
                <Brain className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  AI 专业医学分析
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                  {parsedAnalysis.overallAssessment.healthStatus}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 全新标签页设计 - 更美观的导航 */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-2 h-16 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <TabsTrigger 
            value="insights" 
            className="rounded-xl font-medium flex items-center gap-2 text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">关键洞察</span>
            <span className="sm:hidden">洞察</span>
          </TabsTrigger>
          <TabsTrigger 
            value="professional" 
            className="rounded-xl font-medium flex items-center gap-2 text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">专业解读</span>
            <span className="sm:hidden">解读</span>
          </TabsTrigger>
          <TabsTrigger 
            value="actions" 
            className="rounded-xl font-medium flex items-center gap-2 text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">行动建议</span>
            <span className="sm:hidden">建议</span>
          </TabsTrigger>
          <TabsTrigger 
            value="risks" 
            className="rounded-xl font-medium flex items-center gap-2 text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">风险预警</span>
            <span className="sm:hidden">风险</span>
          </TabsTrigger>
          <TabsTrigger 
            value="planning" 
            className="rounded-xl font-medium flex items-center gap-2 text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">健康规划</span>
            <span className="sm:hidden">规划</span>
          </TabsTrigger>
        </TabsList>

        {/* 🔍 关键洞察 */}
        <TabsContent value="insights" className="space-y-6 mt-8">
          {/* 关键发现 */}
          {parsedAnalysis.overallAssessment.keyFindings.length > 0 && (
            <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Info className="h-5 w-5" />
                  关键医学发现
                </CardTitle>
                <CardDescription>基于您的检查结果，AI识别出以下重要信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parsedAnalysis.overallAssessment.keyFindings.map((finding: string, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                      <div className="p-2 bg-blue-500 text-white rounded-lg flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{finding}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 健康评分详情 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                健康评分详情
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">综合健康评分</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">基于多维度医学指标分析</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getHealthScoreColor(parsedAnalysis.overallAssessment.healthScore)}`}>
                      {parsedAnalysis.overallAssessment.healthScore}
                    </div>
                    <div className="text-sm text-gray-500">/ 100</div>
                  </div>
                </div>
                <Progress value={parsedAnalysis.overallAssessment.healthScore} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🩺 专业解读 */}
        <TabsContent value="professional" className="space-y-6 mt-8">
          {/* 异常指标分析 */}
          {parsedAnalysis.professionalAnalysis.abnormalIndicators && Object.keys(parsedAnalysis.professionalAnalysis.abnormalIndicators).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  异常指标专业分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(parsedAnalysis.professionalAnalysis.abnormalIndicators).map(([category, items]: [string, any], index) => (
                    <div key={index} className="p-4 border rounded-xl">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{category}</h4>
                      {Array.isArray(items) ? (
                        <div className="space-y-2">
                          {items.map((item: string, itemIndex: number) => (
                            <div key={itemIndex} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300">{items}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 系统评估 */}
          {parsedAnalysis.professionalAnalysis.systemAssessment && Object.keys(parsedAnalysis.professionalAnalysis.systemAssessment).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  系统性医学评估
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(parsedAnalysis.professionalAnalysis.systemAssessment).map(([system, assessment]: [string, any], index) => (
                    <div key={index} className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">{system}</h4>
                      <p className="text-sm text-green-800 dark:text-green-200">{assessment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 🎯 行动建议 */}
        <TabsContent value="actions" className="space-y-6 mt-8">
          {/* 立即行动 */}
          {parsedAnalysis.personalizedAdvice.immediateActions.length > 0 && (
            <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  立即行动建议
                </CardTitle>
                <CardDescription>需要您立即关注和执行的重要建议</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {parsedAnalysis.personalizedAdvice.immediateActions.map((action: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 生活方式建议 */}
          {parsedAnalysis.personalizedAdvice.lifestyleChanges && Object.keys(parsedAnalysis.personalizedAdvice.lifestyleChanges).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(parsedAnalysis.personalizedAdvice.lifestyleChanges).map(([category, suggestions]: [string, any], index) => {
                const getIcon = (cat: string) => {
                  if (cat.includes('饮食')) return <Utensils className="h-5 w-5 text-green-600" />
                  if (cat.includes('运动')) return <Dumbbell className="h-5 w-5 text-blue-600" />
                  return <Heart className="h-5 w-5 text-pink-600" />
                }
                
                return (
                  <Card key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getIcon(category)}
                        {category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Array.isArray(suggestions) ? suggestions.map((suggestion: string, suggestionIndex: number) => (
                          <div key={suggestionIndex} className="flex items-start gap-3 p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</p>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300">{suggestions}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* 医疗建议 */}
          {parsedAnalysis.personalizedAdvice.medicalAdvice && Object.keys(parsedAnalysis.personalizedAdvice.medicalAdvice).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-purple-600" />
                  专业医疗建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(parsedAnalysis.personalizedAdvice.medicalAdvice).map(([category, advice]: [string, any], index) => (
                    <div key={index} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">{category}</h4>
                      {Array.isArray(advice) ? (
                        <div className="space-y-2">
                          {advice.map((item: string, itemIndex: number) => (
                            <div key={itemIndex} className="flex items-start gap-2">
                              <Stethoscope className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-purple-800 dark:text-purple-200">{item}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-purple-800 dark:text-purple-200">{advice}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 🛡️ 风险预警 */}
        <TabsContent value="risks" className="space-y-6 mt-8">
          {/* 短期风险 */}
          {parsedAnalysis.riskWarning.shortTermRisks.length > 0 && (
            <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <Clock className="h-5 w-5" />
                  短期风险预警
                </CardTitle>
                <CardDescription>1-3个月内需要特别关注的健康风险</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {parsedAnalysis.riskWarning.shortTermRisks.map((risk: string, index: number) => (
                    <Alert key={index} className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 dark:text-orange-200">
                        {risk}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 长期风险 */}
          {parsedAnalysis.riskWarning.longTermRisks.length > 0 && (
            <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <TrendingUp className="h-5 w-5" />
                  长期风险评估
                </CardTitle>
                <CardDescription>6个月以上的潜在健康风险</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {parsedAnalysis.riskWarning.longTermRisks.map((risk: string, index: number) => (
                    <Alert key={index} className="border-red-200 bg-red-50 dark:bg-red-900/20">
                      <Shield className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        {risk}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 预防措施 */}
          {parsedAnalysis.riskWarning.preventiveMeasures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  预防措施建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedAnalysis.riskWarning.preventiveMeasures.map((measure: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-800 dark:text-green-200">{measure}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 📅 健康规划 */}
        <TabsContent value="planning" className="space-y-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                个性化健康规划
              </CardTitle>
              <CardDescription>基于您的健康状况制定的分阶段改善计划</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* 30天计划 */}
                {parsedAnalysis.healthPlanning.thirtyDayPlan.length > 0 && (
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-green-500 text-white rounded-full">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">30天行动计划</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">立即可以开始的健康改善</p>
                      </div>
                    </div>
                    <div className="ml-16 space-y-3">
                      {parsedAnalysis.healthPlanning.thirtyDayPlan.map((plan: string, index: number) => (
                        <div key={index} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{plan}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3个月目标 */}
                {parsedAnalysis.healthPlanning.threeMonthGoals.length > 0 && (
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-500 text-white rounded-full">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">3个月健康目标</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">持续改善和巩固健康习惯</p>
                      </div>
                    </div>
                    <div className="ml-16 space-y-3">
                      {parsedAnalysis.healthPlanning.threeMonthGoals.map((goal: string, index: number) => (
                        <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{goal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 长期维护 */}
                {parsedAnalysis.healthPlanning.longTermMaintenance.length > 0 && (
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-purple-500 text-white rounded-full">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">长期健康维护</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">建立可持续的健康生活方式</p>
                      </div>
                    </div>
                    <div className="ml-16 space-y-3">
                      {parsedAnalysis.healthPlanning.longTermMaintenance.map((maintenance: string, index: number) => (
                        <div key={index} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{maintenance}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 年度体检 */}
                {parsedAnalysis.healthPlanning.annualCheckup.length > 0 && (
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-indigo-500 text-white rounded-full">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">定期体检建议</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">预防性健康监测计划</p>
                      </div>
                    </div>
                    <div className="ml-16 space-y-3">
                      {parsedAnalysis.healthPlanning.annualCheckup.map((checkup: string, index: number) => (
                        <div key={index} className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{checkup}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && rawAIResponse && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>调试信息</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRawResponse(!showRawResponse)}
              >
                {showRawResponse ? '隐藏' : '显示'} AI原始响应
              </Button>
            </CardTitle>
          </CardHeader>
          {showRawResponse && (
            <CardContent>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
                {rawAIResponse}
              </pre>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
} 