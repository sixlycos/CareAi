'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UnifiedAnalysisResult } from '@/hooks/useAIAnalysis'
import { 
  Brain, 
  Heart, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Lightbulb,
  FileText,
  Pill,
  Utensils,
  Calendar,
  Target,
  TrendingUp,
  Info,
  Zap,
  Eye
} from 'lucide-react'

interface UnifiedAnalysisDisplayProps {
  analysis: UnifiedAnalysisResult
}

export function UnifiedAnalysisDisplay({ analysis }: UnifiedAnalysisDisplayProps) {
  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'modern': return <TestTube className="h-4 w-4" />
      case 'tcm': return <Zap className="h-4 w-4" />
      case 'imaging': return <Eye className="h-4 w-4" />
      case 'pathology': return <Microscope className="h-4 w-4" />
      case 'mixed': return <Activity className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getAnalysisTypeName = (type: string) => {
    switch (type) {
      case 'modern': return '现代医学报告'
      case 'tcm': return '中医诊断报告'
      case 'imaging': return '影像学报告'
      case 'pathology': return '病理学报告'
      case 'mixed': return '综合医疗报告'
      default: return '医疗报告'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return '良好'
    if (score >= 60) return '一般'
    return '需要关注'
  }

  return (
    <div className="space-y-6">
      {/* 报告类型和健康评分 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getAnalysisTypeIcon(analysis.analysis_type)}
            {getAnalysisTypeName(analysis.analysis_type)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">整体健康评分</p>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${getHealthScoreColor(analysis.overall_health_score)}`}>
                  {analysis.overall_health_score}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
                <Badge variant={analysis.overall_health_score >= 80 ? 'default' : analysis.overall_health_score >= 60 ? 'secondary' : 'destructive'}>
                  {getHealthScoreLabel(analysis.overall_health_score)}
                </Badge>
              </div>
            </div>
            <div className="w-32">
              <Progress value={analysis.overall_health_score} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要发现 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="findings">详细发现</TabsTrigger>
          <TabsTrigger value="recommendations">建议</TabsTrigger>
          <TabsTrigger value="trends">趋势</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                总结
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* 风险因素 */}
          {analysis.risk_factors && analysis.risk_factors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  风险因素
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.risk_factors.map((risk, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{risk}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          {/* 数值指标 */}
          {analysis.key_findings.numerical_indicators && analysis.key_findings.numerical_indicators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  化验指标
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.key_findings.numerical_indicators.map((indicator: { name: string; value: string | number; unit: string; normalRange: string; status: string }, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{indicator.name}</p>
                        <p className="text-sm text-muted-foreground">{indicator.normalRange}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          indicator.status === 'normal' ? 'text-green-600' :
                          indicator.status === 'high' || indicator.status === 'low' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {indicator.value} {indicator.unit}
                        </p>
                        <Badge variant={indicator.status === 'normal' ? 'default' : 'secondary'}>
                          {indicator.status === 'normal' ? '正常' : 
                           indicator.status === 'high' ? '偏高' :
                           indicator.status === 'low' ? '偏低' : '异常'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 影像学发现 */}
          {analysis.key_findings.imaging_findings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  影像学发现
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">检查类型</p>
                    <p className="text-sm text-muted-foreground">{analysis.key_findings.imaging_findings.type}</p>
                  </div>
                  <div>
                    <p className="font-medium">检查部位</p>
                    <p className="text-sm text-muted-foreground">{analysis.key_findings.imaging_findings.location}</p>
                  </div>
                  <div>
                    <p className="font-medium">影像学发现</p>
                    <p className="text-sm text-muted-foreground">{analysis.key_findings.imaging_findings.findings}</p>
                  </div>
                  <div>
                    <p className="font-medium">影像学印象</p>
                    <p className="text-sm text-muted-foreground">{analysis.key_findings.imaging_findings.impression}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 病理结果 */}
          {analysis.key_findings.pathology_results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Microscope className="h-4 w-4" />
                  病理诊断
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">标本类型</p>
                    <p className="text-sm text-muted-foreground">{analysis.key_findings.pathology_results.specimen}</p>
                  </div>
                  <div>
                    <p className="font-medium">病理诊断</p>
                    <p className="text-sm text-muted-foreground">{analysis.key_findings.pathology_results.diagnosis}</p>
                  </div>
                  <div>
                    <p className="font-medium">详细描述</p>
                    <p className="text-sm text-muted-foreground">{analysis.key_findings.pathology_results.details}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 中医诊断 */}
          {analysis.key_findings.tcm_diagnosis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  中医诊断
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.key_findings.tcm_diagnosis.syndrome && (
                    <div>
                      <p className="font-medium">证型</p>
                      <p className="text-sm text-muted-foreground">{analysis.key_findings.tcm_diagnosis.syndrome}</p>
                    </div>
                  )}
                  {analysis.key_findings.tcm_diagnosis.constitution && (
                    <div>
                      <p className="font-medium">体质</p>
                      <p className="text-sm text-muted-foreground">{analysis.key_findings.tcm_diagnosis.constitution}</p>
                    </div>
                  )}
                  {analysis.key_findings.tcm_diagnosis.palpation && (
                    <div>
                      <p className="font-medium">脉象</p>
                      <p className="text-sm text-muted-foreground">{analysis.key_findings.tcm_diagnosis.palpation}</p>
                    </div>
                  )}
                  {analysis.key_findings.tcm_diagnosis.inspection && (
                    <div>
                      <p className="font-medium">望诊</p>
                      <p className="text-sm text-muted-foreground">{analysis.key_findings.tcm_diagnosis.inspection}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {/* 即时建议 */}
          {analysis.recommendations.immediate && analysis.recommendations.immediate.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  即时建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.immediate.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 生活方式建议 */}
          {analysis.recommendations.lifestyle && analysis.recommendations.lifestyle.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-blue-600" />
                  生活方式建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.lifestyle.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 随访建议 */}
          {analysis.recommendations.followup && analysis.recommendations.followup.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  随访建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.followup.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 中医调理建议 */}
          {analysis.recommendations.tcm_advice && analysis.recommendations.tcm_advice.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  中医调理建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.tcm_advice.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                健康趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.health_trends && analysis.health_trends.length > 0 ? (
                <div className="space-y-4">
                  {analysis.health_trends.map((trend, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="text-sm">{JSON.stringify(trend)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无趋势数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 