'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Utensils, 
  Dumbbell, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'

interface Recommendations {
  lifestyle: string[]
  diet: string[]
  exercise: string[]
  followUp: string[]
}

interface RecommendationCardProps {
  recommendations: Recommendations
  className?: string
}

export default function RecommendationCard({ 
  recommendations, 
  className = '' 
}: RecommendationCardProps) {
  const sections = [
    {
      title: '生活方式建议',
      icon: Heart,
      items: recommendations.lifestyle,
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    {
      title: '饮食建议',
      icon: Utensils,
      items: recommendations.diet,
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    {
      title: '运动建议',
      icon: Dumbbell,
      items: recommendations.exercise,
      color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      iconColor: 'text-orange-600 dark:text-orange-400',
      badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    },
    {
      title: '随访建议',
      icon: Calendar,
      items: recommendations.followUp,
      color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      iconColor: 'text-purple-600 dark:text-purple-400',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
  ]

  // 过滤掉空的建议
  const validSections = sections.filter(section => section.items && section.items.length > 0)

  if (validSections.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Info className="h-5 w-5 mr-2" />
            暂无个性化建议
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          AI个性化健康建议
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 2x2 网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validSections.map((section, index) => {
            const IconComponent = section.icon
            return (
              <div key={index} className={`p-4 rounded-lg border ${section.color} min-h-[140px] flex flex-col`}>
                <div className="flex items-center gap-2 mb-3">
                  <IconComponent className={`h-5 w-5 ${section.iconColor}`} />
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {section.title}
                  </h4>
                  <Badge variant="secondary" className={`${section.badgeColor} text-xs`}>
                    {section.items.length}
                  </Badge>
                </div>
                <ul className="space-y-2 flex-1">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${section.iconColor.replace('text-', 'bg-')}`} />
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        
        {/* 免责声明 */}
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              以上建议仅供参考，不能替代专业医疗诊断。如有健康问题，请及时咨询医生。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 