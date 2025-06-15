'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Brain, 
  Stethoscope, 
  Pill, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Info,
  Activity
} from 'lucide-react'

// 中医分析结果接口
interface TCMAnalysisResult {
  overallStatus: '健康' | '亚健康' | '需要调理' | '建议就医' | '无法评估'
  constitution?: string
  summary: string
  keyFindings: {
    symptoms: string[]
    tcmDiagnosis: {
      disease?: string
      syndrome?: string
    }
    constitution?: string
  }
  recommendations: {
    lifestyle: string[]
    diet: string[]
    exercise: string[]
    tcmTreatment: string[]
    followUp: string[]
  }
  risks: Array<{
    type: string
    probability: '低' | '中' | '高'
    description: string
  }>
}

interface TCMAnalysisDisplayProps {
  analysis: TCMAnalysisResult
  className?: string
}

const TCMAnalysisDisplay: React.FC<TCMAnalysisDisplayProps> = ({ analysis, className = '' }) => {
  // 状态颜色映射
  const getStatusColor = (status: string) => {
    switch (status) {
      case '健康': return 'bg-green-100 text-green-800 border-green-200'
      case '亚健康': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case '需要调理': return 'bg-orange-100 text-orange-800 border-orange-200'
      case '建议就医': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // 风险概率颜色映射
  const getRiskColor = (probability: string) => {
    switch (probability) {
      case '低': return 'bg-green-100 text-green-800'
      case '中': return 'bg-yellow-100 text-yellow-800'
      case '高': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 整体状况 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              中医健康评估
            </CardTitle>
            <Badge 
              variant="outline" 
              className={getStatusColor(analysis.overallStatus)}
            >
              {analysis.overallStatus}
            </Badge>
          </div>
          {analysis.constitution && (
            <CardDescription>
              体质类型：{analysis.constitution}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
        </CardContent>
      </Card>

      {/* 主要发现 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            主要发现
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 中医诊断 */}
          {(analysis.keyFindings.tcmDiagnosis.disease || analysis.keyFindings.tcmDiagnosis.syndrome) && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">中医诊断</h4>
              <div className="space-y-1">
                {analysis.keyFindings.tcmDiagnosis.disease && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">病名：</span>{analysis.keyFindings.tcmDiagnosis.disease}
                  </p>
                )}
                {analysis.keyFindings.tcmDiagnosis.syndrome && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">证型：</span>{analysis.keyFindings.tcmDiagnosis.syndrome}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 主要症状 */}
          {analysis.keyFindings.symptoms.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">主要症状</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keyFindings.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 体质分析 */}
          {analysis.keyFindings.constitution && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">体质分析</h4>
              <p className="text-sm text-gray-600">{analysis.keyFindings.constitution}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 调养建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            调养建议
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 生活起居 */}
          {analysis.recommendations.lifestyle.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                生活起居
              </h4>
              <ul className="space-y-1">
                {analysis.recommendations.lifestyle.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-green-200">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 饮食调养 */}
          {analysis.recommendations.diet.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-600" />
                饮食调养
              </h4>
              <ul className="space-y-1">
                {analysis.recommendations.diet.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-blue-200">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 运动养生 */}
          {analysis.recommendations.exercise.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                运动养生
              </h4>
              <ul className="space-y-1">
                {analysis.recommendations.exercise.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-purple-200">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 中医治疗 */}
          {analysis.recommendations.tcmTreatment.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4 text-orange-600" />
                中医治疗建议
              </h4>
              <ul className="space-y-1">
                {analysis.recommendations.tcmTreatment.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-orange-200">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 复诊建议 */}
          {analysis.recommendations.followUp.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                复诊建议
              </h4>
              <ul className="space-y-1">
                {analysis.recommendations.followUp.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-indigo-200">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 风险提示 */}
      {analysis.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              健康风险提示
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.risks.map((risk, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{risk.type}</h4>
                    <Badge 
                      variant="outline" 
                      className={getRiskColor(risk.probability)}
                    >
                      {risk.probability}风险
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{risk.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 温馨提示 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">温馨提示</p>
              <p className="text-xs text-blue-700">
                中医诊断需要结合望、闻、问、切四诊合参，本分析仅供参考。如有不适，请及时就医，听从专业中医师的诊断和治疗建议。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TCMAnalysisDisplay 