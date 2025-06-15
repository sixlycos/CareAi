'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TCMAnalysisResult, TCMReportData } from '@/lib/agents/tcm-report-analyzer'
import { 
  Heart, 
  Activity, 
  Pill, 
  Stethoscope, 
  Eye, 
  MessageCircle, 
  Hand,
  Brain,
  AlertTriangle,
  CheckCircle,
  Coffee,
  Utensils,
  Dumbbell,
  Calendar
} from 'lucide-react'

interface TCMReportPanelProps {
  reportData: TCMReportData
  analysisResult: TCMAnalysisResult
}

export default function TCMReportPanel({ reportData, analysisResult }: TCMReportPanelProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case '健康': return 'bg-green-500'
      case '亚健康': return 'bg-yellow-500'  
      case '需要调理': return 'bg-orange-500'
      case '建议复诊': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      
      {/* 总体状态概览 */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg animate-pulse">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  AI中医健康分析报告
                  <span className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full animate-pulse">
                    Smart Analysis
                  </span>
                </CardTitle>
                <CardDescription>基于深度学习的中医四诊智能分析系统</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getStatusColor(analysisResult.overallStatus)} text-white`}>
                  {analysisResult.overallStatus}
                </Badge>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(analysisResult.tcmScore)}`}>
                {analysisResult.tcmScore}分
              </div>
              <div className="text-sm text-muted-foreground">中医健康评分</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-lg leading-relaxed">{analysisResult.summary}</p>
            
            {/* AI处理指标 */}
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>AI算法处理中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>深度学习分析</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>智能诊断完成</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 中医诊断信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            中医诊断信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">中医病名</div>
                <div className="font-semibold text-lg">{reportData.diagnosis.diseaseName || '未明确'}</div>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">中医证型</div>
                <div className="font-semibold text-lg">{reportData.diagnosis.syndromeType || '待辨证'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 中医四诊结果 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-600" />
            中医四诊检查
          </CardTitle>
          <CardDescription>望诊、问诊、切诊综合分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 望诊 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-indigo-600" />
                <h4 className="font-semibold">望诊</h4>
              </div>
              {reportData.fourExaminations.inspection && (
                <div className="space-y-2 text-sm">
                  {reportData.fourExaminations.inspection.tongueColor && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">舌质：</span>
                      <span className="font-medium">{reportData.fourExaminations.inspection.tongueColor}</span>
                    </div>  
                  )}
                  {reportData.fourExaminations.inspection.tongueCoating && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">苔色：</span>
                      <span className="font-medium">{reportData.fourExaminations.inspection.tongueCoating}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 问诊 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold">问诊</h4>
              </div>
              {reportData.fourExaminations.inquiry && (
                <div className="space-y-2 text-sm">
                  {reportData.fourExaminations.inquiry.appetite && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">胃纳：</span>
                      <span className="font-medium">{reportData.fourExaminations.inquiry.appetite}</span>
                    </div>
                  )}
                  {reportData.fourExaminations.inquiry.sleep && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">睡眠：</span>
                      <span className="font-medium">{reportData.fourExaminations.inquiry.sleep}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 切诊 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hand className="h-4 w-4 text-orange-600" />
                <h4 className="font-semibold">切诊</h4>
              </div>
              {reportData.fourExaminations.palpation && (
                <div className="space-y-2 text-sm">
                  {reportData.fourExaminations.palpation.pulse && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">脉象：</span>
                      <span className="font-medium">{reportData.fourExaminations.palpation.pulse}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 证候分析 */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
                      <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg animate-pulse">
                <Brain className="h-5 w-5 text-white" />
              </div>
              AI证候分析
              <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-600 px-2 py-1 rounded-full">
                智能推理
              </span>
            </CardTitle>
          <CardDescription>基于千年中医理论的AI深度学习分析</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                AI病机推演
              </div>
              <div className="font-medium text-sm leading-relaxed">{analysisResult.syndromeAnalysis.pathogenesis}</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                智能治疗策略
              </div>
              <div className="font-medium text-sm leading-relaxed">{analysisResult.syndromeAnalysis.treatmentPrinciple}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 处方信息 */}
      {reportData.prescription.formulaName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-green-600" />
              处方信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">方剂名称</div>
                  <div className="font-semibold">{reportData.prescription.formulaName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">剂量</div>
                  <div className="font-medium">{reportData.prescription.dosage}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">服用方法</div>
                  <div className="font-medium">{reportData.prescription.administration}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">频次</div>
                  <div className="font-medium">{reportData.prescription.frequency}</div>
                </div>
              </div>
            </div>
            
            {analysisResult.prescriptionAnalysis && (
              <>
                {/* 方剂组成 */}
                {analysisResult.prescriptionAnalysis.ingredients && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Pill className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-800 dark:text-green-200 mb-2">方剂组成</div>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.prescriptionAnalysis.ingredients.map((ingredient, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-md text-sm">
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 用药注意事项 */}
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">用药注意事项</div>
                      <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                        {analysisResult.prescriptionAnalysis.cautions.map((caution, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-yellow-600 mt-1">•</span>
                            <span>{caution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 关键发现 */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
                      <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              AI智能发现
              <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 px-2 py-1 rounded-full">
                高精度分析
              </span>
            </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analysisResult.keyFindings.map((finding, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <span className="text-sm leading-relaxed">{finding}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 调理建议 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 生活调理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-green-600" />
              生活调理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysisResult.recommendations.lifestyle.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 饮食调理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-orange-600" />
              饮食调理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysisResult.recommendations.diet.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 运动调理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-blue-600" />
              运动调理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysisResult.recommendations.exercise.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 中医调理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-600" />
              中医调理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysisResult.recommendations.tcmCare.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 随访建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            随访建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysisResult.recommendations.followUp.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 